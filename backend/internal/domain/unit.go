package domain

import (
	"errors"
	"strings"
	"time"
)

var (
	ErrForbidden               = errors.New("forbidden")
	ErrUnitNotFound            = errors.New("unit not found")
	ErrUnitIdentifierDuplicate = errors.New("unit identifier already exists in this condominium")
	ErrUnitGroupInvalid        = errors.New("unit group_type and group_name must be provided together")
	ErrUnitCodeTooLong         = errors.New("unit code is too long")
	ErrUnitIdentifierRequired  = errors.New("unit identifier is required")
	ErrUnitIdentifierInvalid   = errors.New("unit identifier must be numeric")
	ErrUnitFloorInvalid        = errors.New("unit floor is invalid for the selected group")
	ErrUnitHasActiveMembers    = errors.New("unit has active members")
	ErrUnitHasCharges          = errors.New("unit has charges and cannot be deleted")
)

var allowedUnitGroupTypes = map[string]struct{}{
	"block":  {},
	"tower":  {},
	"sector": {},
	"court":  {},
	"phase":  {},
}

type Unit struct {
	ID            int64     `json:"id"`
	CondominiumID int64     `json:"condominium_id"`
	Code          string    `json:"code"`
	Identifier    string    `json:"identifier"`
	GroupType     string    `json:"group_type,omitempty"`
	GroupName     string    `json:"group_name,omitempty"`
	Floor         string    `json:"floor,omitempty"`
	Description   string    `json:"description,omitempty"`
	PrivateArea   *float64  `json:"private_area"`
	IdealFraction *float64  `json:"ideal_fraction"`
	Active        bool      `json:"active"`
	CreatedAt     time.Time `json:"created_at"`
	UpdatedAt     time.Time `json:"updated_at"`
}

type CreateUnitInput struct {
	Identifier  string   `json:"identifier"`
	GroupType   string   `json:"group_type"`
	GroupName   string   `json:"group_name"`
	Floor       string   `json:"floor"`
	Description string   `json:"description"`
	PrivateArea *float64 `json:"private_area"`
}

type UpdateUnitPrivateAreaInput struct {
	PrivateArea *float64 `json:"private_area"`
}

func (i CreateUnitInput) Normalize() CreateUnitInput {
	i.Identifier = strings.TrimSpace(i.Identifier)
	i.GroupType = strings.TrimSpace(i.GroupType)
	i.GroupName = strings.TrimSpace(i.GroupName)
	i.Floor = strings.TrimSpace(i.Floor)
	i.Description = strings.TrimSpace(i.Description)
	return i
}

func (i CreateUnitInput) Validate() error {
	if i.GroupType == "" || i.GroupName == "" {
		return ErrUnitGroupInvalid
	}
	if len(i.GroupType) > 20 || len(i.GroupName) > 20 {
		return ErrUnitGroupInvalid
	}
	if _, ok := allowedUnitGroupTypes[i.GroupType]; !ok {
		return ErrUnitGroupInvalid
	}
	if strings.TrimSpace(i.Identifier) == "" {
		return ErrUnitIdentifierRequired
	}
	if len(i.Identifier) > 20 {
		return ErrUnitIdentifierRequired
	}
	for _, char := range i.Identifier {
		if char < '0' || char > '9' {
			return ErrUnitIdentifierInvalid
		}
	}
	if i.PrivateArea != nil {
		if *i.PrivateArea < 0 {
			return errors.New("private area must be non-negative")
		}
	}
	return nil
}

func (i UpdateUnitPrivateAreaInput) Validate() error {
	if i.PrivateArea != nil && *i.PrivateArea < 0 {
		return errors.New("private area must be non-negative")
	}
	return nil
}
