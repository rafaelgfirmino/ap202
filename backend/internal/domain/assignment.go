package domain

import (
	"time"

	"github.com/google/uuid"
)

type UserRole struct {
	ID         uuid.UUID         `json:"id"`
	UserID     int64             `json:"user_id"`
	RoleID     uuid.UUID         `json:"role_id"`
	TenantID   int64             `json:"tenant_id"`
	Attributes map[string]string `json:"attributes,omitempty"`
	CreatedAt  time.Time         `json:"created_at"`
}
