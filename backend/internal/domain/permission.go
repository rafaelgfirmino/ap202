package domain

import (
	"strings"
	"time"

	"github.com/google/uuid"
)

type Permission struct {
	ID           uuid.UUID         `json:"id"`
	Microservice string            `json:"microservice"`
	Resource     string            `json:"resource"`
	Action       string            `json:"action"`
	Name         string            `json:"name"`
	Description  string            `json:"description"`
	Conditions   map[string]string `json:"conditions,omitempty"`
	CreatedAt    time.Time         `json:"created_at"`
	UpdatedAt    time.Time         `json:"updated_at"`
}

type PermissionSyncItem struct {
	Microservice   string            `json:"microservice"`
	Resource       string            `json:"resource"`
	Action         string            `json:"action"`
	Description    string            `json:"description"`
	Conditions     map[string]string `json:"conditions,omitempty"`
	SuggestedRoles []string          `json:"suggested_roles,omitempty"`
}

func (p *Permission) Normalize() {
	p.Microservice = strings.TrimSpace(p.Microservice)
	p.Resource = strings.TrimSpace(p.Resource)
	p.Action = strings.TrimSpace(p.Action)
	p.Description = strings.TrimSpace(p.Description)
	p.Name = PermissionName(p.Microservice, p.Resource, p.Action)
	if p.Conditions == nil {
		p.Conditions = map[string]string{}
	}
}

func PermissionName(microservice, resource, action string) string {
	return strings.TrimSpace(microservice) + ":" + strings.TrimSpace(resource) + ":" + strings.TrimSpace(action)
}
