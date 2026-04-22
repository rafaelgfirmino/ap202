package domain

import (
	"errors"
	"fmt"
	"time"

	"ap202/internal/domain/vo"
)

var ErrCondominiumNotFound = errors.New("condominium not found")

type FeeRule string

const (
	FeeRuleEqual        FeeRule = "equal"
	FeeRuleProportional FeeRule = "proportional"
)

func (r FeeRule) IsValid() bool {
	switch r {
	case FeeRuleEqual, FeeRuleProportional:
		return true
	}
	return false
}

type CondominiumCNPJ struct {
	ID            int64      `json:"id"`
	CondominiumID int64      `json:"condominium_id"`
	CNPJ          string     `json:"cnpj"`
	RazaoSocial   string     `json:"razao_social"`
	Descricao     string     `json:"descricao"`
	Principal     bool       `json:"principal"`
	Ativo         bool       `json:"ativo"`
	DataInicio    *time.Time `json:"data_inicio,omitempty"`
	DataFim       *time.Time `json:"data_fim,omitempty"`
	CreatedAt     time.Time  `json:"created_at"`
}

type CNPJRequest struct {
	CNPJ        string `json:"cnpj"`
	RazaoSocial string `json:"razao_social"`
	Descricao   string `json:"descricao"`
	Principal   bool   `json:"principal"`
	Ativo       bool   `json:"ativo"`
}

type CondominiumStatus string

const (
	StatusActive    CondominiumStatus = "active"
	StatusInactive  CondominiumStatus = "inactive"
	StatusSuspended CondominiumStatus = "suspended"
)

func (s CondominiumStatus) IsValid() bool {
	switch s {
	case StatusActive, StatusInactive, StatusSuspended:
		return true
	}
	return false
}

type Condominium struct {
	ID        int64             `json:"id"`
	Code      string            `json:"code"`
	Name      string            `json:"name"`
	Phone     string            `json:"phone"`
	Email     string            `json:"email"`
	FeeRule   FeeRule           `json:"fee_rule"`
	LandArea  *float64          `json:"land_area"`
	BuiltArea float64           `json:"built_area_sum"`
	Address   vo.Address        `json:"address"`
	Status    CondominiumStatus `json:"status"`
	CNPJs     []CondominiumCNPJ `json:"cnpjs"`
	CreatedAt time.Time         `json:"created_at"`
	UpdatedAt time.Time         `json:"updated_at"`
}

type CreateCondominiumRequest struct {
	Name     string        `json:"name"`
	Phone    string        `json:"phone"`
	Email    string        `json:"email"`
	LandArea *float64      `json:"land_area"`
	Address  vo.Address    `json:"address"`
	CNPJs    []CNPJRequest `json:"cnpjs"`
}

type UpdateFeeRuleRequest struct {
	FeeRule FeeRule `json:"fee_rule"`
}

type UpdateLandAreaRequest struct {
	LandArea *float64 `json:"land_area"`
}

func (r *CreateCondominiumRequest) Validate() []string {
	var errs []string

	if r.Name == "" {
		errs = append(errs, "name is required")
	}
	if r.Phone == "" {
		errs = append(errs, "phone is required")
	}
	if r.Email == "" {
		errs = append(errs, "email is required")
	}
	if r.Address.Street == "" {
		errs = append(errs, "address.street is required")
	}
	if r.Address.Number == "" {
		errs = append(errs, "address.number is required")
	}
	if r.Address.Neighborhood == "" {
		errs = append(errs, "address.neighborhood is required")
	}
	if r.Address.City == "" {
		errs = append(errs, "address.city is required")
	}
	if r.Address.State == "" {
		errs = append(errs, "address.state is required")
	}
	if r.Address.ZipCode == "" {
		errs = append(errs, "address.zip_code is required")
	}
	if len(r.CNPJs) == 0 {
		errs = append(errs, "at least one CNPJ is required")
	}
	for i, c := range r.CNPJs {
		if !vo.ValidateCNPJ(c.CNPJ) {
			errs = append(errs, fmt.Sprintf("cnpjs[%d] is invalid", i))
		}
		if c.RazaoSocial == "" {
			errs = append(errs, fmt.Sprintf("cnpjs[%d] razao_social is required", i))
		}
	}

	principalAtivoCount := 0
	for _, c := range r.CNPJs {
		if c.Principal && c.Ativo {
			principalAtivoCount++
		}
	}
	if principalAtivoCount > 1 {
		errs = append(errs, "only one CNPJ can be principal and ativo at the same time")
	}

	return errs
}
