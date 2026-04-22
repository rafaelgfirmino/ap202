package domain

import (
	"errors"
	"strings"
	"time"
)

var (
	ErrMemberNotFound      = errors.New("member not found")
	ErrBondNotFound        = errors.New("bond not found")
	ErrMemberAlreadyLinked = errors.New("member already has an active link for this role in this unit")
	ErrInvalidMemberRole   = errors.New("role must be owner or tenant")
)

type Bond struct {
	ID            int64      `json:"id"`
	UserID        int64      `json:"user_id"`
	CondominiumID int64      `json:"condominium_id"`
	UnitID        *int64     `json:"unit_id,omitempty"`
	Role          string     `json:"role"`
	Active        bool       `json:"active"`
	StartDate     time.Time  `json:"start_date"`
	EndDate       *time.Time `json:"end_date,omitempty"`
	CreatedAt     time.Time  `json:"created_at"`
}

type Member struct {
	BondID    int64      `json:"bond_id"`
	UserID    int64      `json:"user_id"`
	UnitID    int64      `json:"unit_id"`
	Name      string     `json:"name"`
	Email     string     `json:"email"`
	Role      string     `json:"role"`
	Active    bool       `json:"active"`
	StartDate time.Time  `json:"start_date"`
	EndDate   *time.Time `json:"end_date,omitempty"`
	CreatedAt time.Time  `json:"created_at"`
}

type AddMemberInput struct {
	Name      string     `json:"name"`
	Email     string     `json:"email"`
	Role      string     `json:"role"`
	StartDate *time.Time `json:"start_date"`
	EndDate   *time.Time `json:"end_date"`
}

func (i AddMemberInput) Normalize() AddMemberInput {
	i.Name = strings.TrimSpace(i.Name)
	i.Email = strings.TrimSpace(strings.ToLower(i.Email))
	i.Role = strings.TrimSpace(strings.ToLower(i.Role))
	return i
}

func (i AddMemberInput) Validate() error {
	if i.Name == "" {
		return ErrNameRequired
	}
	if i.Email == "" {
		return ErrEmailRequired
	}
	if i.Role != "owner" && i.Role != "tenant" {
		return ErrInvalidMemberRole
	}
	return nil
}
