package authz

import "context"

type Input struct {
	UserID     int64          `json:"user_id"`
	TenantID   int64          `json:"tenant_id"`
	Permission string         `json:"permission"`
	Resource   map[string]any `json:"resource,omitempty"`
	Attributes map[string]any `json:"attributes,omitempty"`
}

type Result struct {
	Allow  bool   `json:"allow"`
	Reason string `json:"reason"`
}

type BundleData struct {
	Permissions map[string]map[string]any   `json:"permissions"`
	Roles       map[string]map[string]any   `json:"roles"`
	UserRoles   map[string][]map[string]any `json:"user_roles"`
}

type Evaluator interface {
	Evaluate(ctx context.Context, input Input) (*Result, error)
}

type ReloadableEvaluator interface {
	Evaluator
	Reload(ctx context.Context, data *BundleData) error
}
