package usecase

import (
	"context"
	"errors"
	"fmt"
	"log"
	"strings"
	"time"

	"ap202/internal/authctx"
	"ap202/internal/domain"
	"ap202/internal/domain/vo"
	"ap202/internal/ports/output"
)

type CondominiumUseCase struct {
	repo       output.CondominiumRepository
	authorizer output.AssociationRepository
	chargeRepo output.ChargeRepository
}

func NewCondominiumUseCase(repo output.CondominiumRepository) *CondominiumUseCase {
	return &CondominiumUseCase{repo: repo}
}

func NewCondominiumUseCaseWithAuth(repo output.CondominiumRepository, authorizer output.AssociationRepository) *CondominiumUseCase {
	return &CondominiumUseCase{repo: repo, authorizer: authorizer}
}

func NewCondominiumUseCaseWithAuthAndCharges(repo output.CondominiumRepository, authorizer output.AssociationRepository, chargeRepo output.ChargeRepository) *CondominiumUseCase {
	return &CondominiumUseCase{repo: repo, authorizer: authorizer, chargeRepo: chargeRepo}
}

func (uc *CondominiumUseCase) CreateCondominium(ctx context.Context, req domain.CreateCondominiumRequest) (*domain.Condominium, error) {
	if errs := req.Validate(); len(errs) > 0 {
		return nil, fmt.Errorf("validation failed: %v", errs)
	}

	for _, c := range req.CNPJs {
		clean := cleanCNPJ(c.CNPJ)
		exists, err := uc.repo.ExistsByCNPJ(ctx, clean)
		if err != nil {
			return nil, fmt.Errorf("failed to check CNPJ uniqueness: %w", err)
		}
		if exists {
			return nil, fmt.Errorf("CNPJ %s already registered", c.CNPJ)
		}
	}

	code, err := uc.generateUniqueCode(ctx)
	if err != nil {
		return nil, fmt.Errorf("failed to generate unique code: %w", err)
	}

	coords, err := domain.Geocode(req.Address.Street, req.Address.Number, req.Address.City, req.Address.State, req.Address.ZipCode)
	if err != nil {
		log.Printf("geocoding failed, proceeding without coordinates: %v", err)
	}

	now := time.Now()
	condo := &domain.Condominium{
		Code:      code,
		Name:      req.Name,
		Phone:     req.Phone,
		Email:     req.Email,
		FeeRule:   domain.FeeRuleEqual,
		LandArea:  req.LandArea,
		BuiltArea: 0,
		Address: vo.Address{
			Street:       req.Address.Street,
			Number:       req.Address.Number,
			Neighborhood: req.Address.Neighborhood,
			City:         req.Address.City,
			State:        req.Address.State,
			ZipCode:      req.Address.ZipCode,
			Latitude:     coords.Latitude,
			Longitude:    coords.Longitude,
		},
		Status:    domain.StatusActive,
		CNPJs:     buildCNPJs(req.CNPJs, now),
		CreatedAt: now,
		UpdatedAt: now,
	}

	personID, ok := authctx.UserIDFromContext(ctx)
	if !ok || personID <= 0 {
		return nil, fmt.Errorf("authenticated user not found in context")
	}

	if err := uc.repo.Create(ctx, condo, personID); err != nil {
		return nil, fmt.Errorf("failed to create condominium: %w", err)
	}

	return condo, nil
}

func (uc *CondominiumUseCase) ListCondominiums(ctx context.Context) ([]domain.Condominium, error) {
	condos, err := uc.repo.List(ctx)
	if err != nil {
		return nil, fmt.Errorf("failed to list condominiums: %w", err)
	}

	return condos, nil
}

func (uc *CondominiumUseCase) ListCondominiumsByPersonID(ctx context.Context, personID int64) ([]domain.Condominium, error) {
	if personID <= 0 {
		return nil, fmt.Errorf("invalid person id")
	}

	condos, err := uc.repo.ListByPersonID(ctx, personID)
	if err != nil {
		return nil, fmt.Errorf("failed to list condominiums by person: %w", err)
	}

	return condos, nil
}

func (uc *CondominiumUseCase) GetCondominiumByID(ctx context.Context, id int64) (*domain.Condominium, error) {
	if id <= 0 {
		return nil, fmt.Errorf("invalid condominium id")
	}

	condo, err := uc.repo.GetByID(ctx, id)
	if err != nil {
		return nil, fmt.Errorf("failed to get condominium: %w", err)
	}

	return condo, nil
}

func (uc *CondominiumUseCase) GetCondominiumByCode(ctx context.Context, personID int64, code string) (*domain.Condominium, error) {
	code = strings.TrimSpace(code)
	if personID <= 0 || code == "" {
		return nil, fmt.Errorf("invalid input")
	}

	condominiumID, err := uc.repo.FindIDByCode(ctx, code)
	if err != nil {
		return nil, err
	}

	if uc.authorizer == nil {
		return nil, fmt.Errorf("authorizer not configured")
	}

	allowed, err := uc.authorizer.HasActiveManagerAssociation(ctx, personID, condominiumID)
	if err != nil {
		return nil, fmt.Errorf("failed to check manager association: %w", err)
	}
	if !allowed {
		return nil, domain.ErrForbidden
	}

	condo, err := uc.repo.GetByID(ctx, condominiumID)
	if err != nil {
		return nil, fmt.Errorf("failed to get condominium: %w", err)
	}
	return condo, nil
}

func (uc *CondominiumUseCase) UpdateFeeRule(ctx context.Context, personID int64, code string, feeRule domain.FeeRule) (*domain.Condominium, error) {
	feeRule = domain.FeeRule(strings.TrimSpace(string(feeRule)))
	if !feeRule.IsValid() {
		return nil, domain.ErrInvalidFeeRule
	}

	condominiumID, err := uc.repo.FindIDByCode(ctx, code)
	if err != nil {
		return nil, err
	}

	if uc.authorizer == nil {
		return nil, fmt.Errorf("authorizer not configured")
	}

	allowed, err := uc.authorizer.HasActiveManagerAssociation(ctx, personID, condominiumID)
	if err != nil {
		return nil, fmt.Errorf("failed to check manager association: %w", err)
	}
	if !allowed {
		return nil, domain.ErrForbidden
	}

	if uc.chargeRepo != nil {
		hasCharges, err := uc.chargeRepo.HasChargesForCondominium(ctx, condominiumID)
		if err != nil {
			return nil, fmt.Errorf("failed to verify fee rule immutability: %w", err)
		}
		if hasCharges {
			return nil, domain.ErrFeeRuleImmutable
		}
	}

	if err := uc.repo.UpdateFeeRule(ctx, condominiumID, feeRule); err != nil {
		return nil, err
	}

	condo, err := uc.repo.GetByID(ctx, condominiumID)
	if err != nil {
		return nil, fmt.Errorf("failed to get condominium after fee rule update: %w", err)
	}

	return condo, nil
}

func (uc *CondominiumUseCase) UpdateLandArea(ctx context.Context, personID int64, code string, landArea *float64) (*domain.Condominium, error) {
	condominiumID, err := uc.repo.FindIDByCode(ctx, code)
	if err != nil {
		return nil, err
	}

	if uc.authorizer == nil {
		return nil, fmt.Errorf("authorizer not configured")
	}

	allowed, err := uc.authorizer.HasActiveManagerAssociation(ctx, personID, condominiumID)
	if err != nil {
		return nil, fmt.Errorf("failed to check manager association: %w", err)
	}
	if !allowed {
		return nil, domain.ErrForbidden
	}

	if landArea != nil && *landArea < 0 {
		return nil, fmt.Errorf("land area must be non-negative")
	}

	if err := uc.repo.UpdateLandArea(ctx, condominiumID, landArea); err != nil {
		return nil, err
	}

	condo, err := uc.repo.GetByID(ctx, condominiumID)
	if err != nil {
		return nil, fmt.Errorf("failed to get condominium after land area update: %w", err)
	}

	return condo, nil
}

func (uc *CondominiumUseCase) generateUniqueCode(ctx context.Context) (string, error) {
	maxAttempts := 10
	for i := 0; i < maxAttempts; i++ {
		code := vo.GenerateCondominiumCode()
		exists, err := uc.repo.ExistsByCode(ctx, code)
		if err != nil {
			return "", err
		}
		if !exists {
			return code, nil
		}
	}
	return "", errors.New("failed to generate unique code after maximum attempts")
}

func cleanCNPJ(cnpj string) string {
	result := make([]byte, 0, 14)
	for i := 0; i < len(cnpj); i++ {
		if cnpj[i] >= '0' && cnpj[i] <= '9' {
			result = append(result, cnpj[i])
		}
	}
	return string(result)
}

func buildCNPJs(reqs []domain.CNPJRequest, now time.Time) []domain.CondominiumCNPJ {
	cnpjs := make([]domain.CondominiumCNPJ, len(reqs))
	for i, r := range reqs {
		cnpjs[i] = domain.CondominiumCNPJ{
			CNPJ:        cleanCNPJ(r.CNPJ),
			RazaoSocial: r.RazaoSocial,
			Descricao:   r.Descricao,
			Principal:   r.Principal,
			Ativo:       r.Ativo,
			DataInicio:  &now,
			CreatedAt:   now,
		}
	}
	return cnpjs
}
