package domain

import (
	"strings"
	"time"

	"github.com/google/uuid"
)

type Role struct {
	ID          uuid.UUID    `json:"id"`
	TenantID    *int64       `json:"tenant_id,omitempty"`
	TemplateID  *uuid.UUID   `json:"template_id,omitempty"`
	Name        string       `json:"name"`
	Description string       `json:"description"`
	Scope       string       `json:"scope"`
	Permissions []Permission `json:"permissions,omitempty"`
	CreatedAt   time.Time    `json:"created_at"`
	UpdatedAt   time.Time    `json:"updated_at"`
}

type RolePermission struct {
	RoleID       uuid.UUID `json:"role_id"`
	PermissionID uuid.UUID `json:"permission_id"`
	CreatedAt    time.Time `json:"created_at"`
}

func (r *Role) Normalize() {
	r.Name = strings.TrimSpace(r.Name)
	r.Description = strings.TrimSpace(r.Description)
	r.Scope = RoleScope(r.TenantID)
}

func RoleScope(tenantID *int64) string {
	if tenantID == nil {
		return "global"
	}
	return "tenant"
}

func (r Role) IsInstance() bool {
	return r.TenantID != nil
}

func (r Role) IsTemplate() bool {
	return r.TenantID == nil && r.TemplateID == nil
}
