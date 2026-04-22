package domain

import (
	"errors"
	"time"
)

var (
	ErrUserNotFound           = errors.New("user not found")
	ErrEmailAlreadyExists     = errors.New("email already exists")
	ErrExternalAuthIDRequired = errors.New("external_auth_id is required")
	ErrFirstNameRequired      = errors.New("first_name is required")
	ErrLastNameRequired       = errors.New("last_name is required")
	ErrNameRequired           = errors.New("name is required")
	ErrEmailRequired          = errors.New("email is required")
)

type User struct {
	ID             int64     `json:"id"`
	ExternalAuthID *string   `json:"external_auth_id,omitempty"`
	FirstName      string    `json:"first_name"`
	LastName       string    `json:"last_name"`
	Name           string    `json:"name"`
	Email          string    `json:"email"`
	CreatedAt      time.Time `json:"created_at"`
	UpdatedAt      time.Time `json:"updated_at"`
}
