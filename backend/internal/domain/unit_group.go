package domain

import (
	"errors"
	"strings"
	"time"
)

var (
	ErrUnitGroupNotFound         = errors.New("unit group not found")
	ErrUnitGroupAlreadyExists    = errors.New("unit group already exists in this condominium")
	ErrUnitGroupNameRequired     = errors.New("unit group name is required")
	ErrUnitGroupFloorsInvalid    = errors.New("unit group floors must be greater than or equal to zero")
	ErrUnitGroupHasUnits         = errors.New("unit group has linked units")
	ErrUnitGroupMustBeRegistered = errors.New("unit group must be previously registered")
)

type UnitGroup struct {
	ID            int64     `json:"id"`
	CondominiumID int64     `json:"condominium_id"`
	GroupType     string    `json:"group_type"`
	Name          string    `json:"name"`
	Floors        *int      `json:"floors,omitempty"`
	Active        bool      `json:"active"`
	CreatedAt     time.Time `json:"created_at"`
}

type CreateUnitGroupInput struct {
	GroupType string `json:"group_type"`
	Name      string `json:"name"`
	Floors    *int   `json:"floors"`
}

type UpdateUnitGroupInput struct {
	GroupType string `json:"group_type"`
	Name      string `json:"name"`
	Floors    *int   `json:"floors"`
}

func (i CreateUnitGroupInput) Normalize() CreateUnitGroupInput {
	i.GroupType = strings.TrimSpace(i.GroupType)
	i.Name = strings.TrimSpace(i.Name)
	return i
}

func (i CreateUnitGroupInput) Validate() error {
	if i.Name == "" {
		return ErrUnitGroupNameRequired
	}
	if len(i.Name) > 20 {
		return ErrUnitGroupNameRequired
	}
	if _, ok := allowedUnitGroupTypes[i.GroupType]; !ok {
		return ErrUnitGroupInvalid
	}
	if i.Floors != nil && *i.Floors < 0 {
		return ErrUnitGroupFloorsInvalid
	}
	return nil
}

func (i UpdateUnitGroupInput) Normalize() UpdateUnitGroupInput {
	i.GroupType = strings.TrimSpace(i.GroupType)
	i.Name = strings.TrimSpace(i.Name)
	return i
}

func (i UpdateUnitGroupInput) Validate() error {
	return CreateUnitGroupInput(i).Validate()
}
