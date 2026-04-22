package authz

import (
	"context"
	"encoding/json"
	"fmt"
	"os"
	"sync"

	"github.com/open-policy-agent/opa/rego"
	"github.com/open-policy-agent/opa/storage"
	"github.com/open-policy-agent/opa/storage/inmem"
)

type Engine struct {
	policy string

	mu    sync.RWMutex
	store storage.Store
	query rego.PreparedEvalQuery
}

func NewEngine(ctx context.Context, policyPath string) (*Engine, error) {
	policy, err := os.ReadFile(policyPath)
	if err != nil {
		return nil, fmt.Errorf("failed to read rego policy: %w", err)
	}

	engine := &Engine{policy: string(policy)}
	if err := engine.Reload(ctx, &BundleData{
		Permissions: map[string]map[string]any{},
		Roles:       map[string]map[string]any{},
		UserRoles:   map[string][]map[string]any{},
	}); err != nil {
		return nil, err
	}

	return engine, nil
}

func (e *Engine) Evaluate(ctx context.Context, input Input) (*Result, error) {
	e.mu.RLock()
	query := e.query
	e.mu.RUnlock()

	results, err := query.Eval(ctx, rego.EvalInput(input))
	if err != nil {
		return nil, fmt.Errorf("failed to evaluate authorization policy: %w", err)
	}
	if len(results) == 0 || len(results[0].Expressions) == 0 {
		return &Result{Allow: false, Reason: "permission denied"}, nil
	}

	raw, err := json.Marshal(results[0].Expressions[0].Value)
	if err != nil {
		return nil, fmt.Errorf("failed to marshal policy result: %w", err)
	}

	var result Result
	if err := json.Unmarshal(raw, &result); err != nil {
		return nil, fmt.Errorf("failed to decode policy result: %w", err)
	}

	return &result, nil
}

func (e *Engine) Reload(ctx context.Context, data *BundleData) error {
	if data == nil {
		data = &BundleData{
			Permissions: map[string]map[string]any{},
			Roles:       map[string]map[string]any{},
			UserRoles:   map[string][]map[string]any{},
		}
	}

	store := inmem.NewFromObject(map[string]any{
		"permissions": data.Permissions,
		"roles":       data.Roles,
		"user_roles":  data.UserRoles,
	})

	r := rego.New(
		rego.Query("data.authz.allow"),
		rego.Module("policies/authz.rego", e.policy),
		rego.Store(store),
	)

	query, err := r.PrepareForEval(ctx)
	if err != nil {
		return fmt.Errorf("failed to prepare authorization query: %w", err)
	}

	e.mu.Lock()
	e.store = store
	e.query = query
	e.mu.Unlock()

	return nil
}
