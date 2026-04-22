package usecase

import (
	"context"
	"errors"
	"testing"

	"ap202/internal/authctx"
	"ap202/internal/domain"
	"ap202/internal/domain/vo"
)

type mockCondoRepo struct {
	existsByCode     bool
	existsByCNPJ     bool
	createErr        error
	listResult       []domain.Condominium
	listErr          error
	getByIDResult    *domain.Condominium
	getByIDErr       error
	updateFeeRuleErr error
	updatedFeeRule   domain.FeeRule
	updatedLandArea  *float64
}

func (m *mockCondoRepo) Create(_ context.Context, _ *domain.Condominium, _ int64) error {
	return m.createErr
}

func (m *mockCondoRepo) List(_ context.Context) ([]domain.Condominium, error) {
	return m.listResult, m.listErr
}

func (m *mockCondoRepo) ListByPersonID(_ context.Context, _ int64) ([]domain.Condominium, error) {
	return m.listResult, m.listErr
}

func (m *mockCondoRepo) GetByID(_ context.Context, _ int64) (*domain.Condominium, error) {
	return m.getByIDResult, m.getByIDErr
}

func (m *mockCondoRepo) FindIDByCode(_ context.Context, _ string) (int64, error) {
	if m.getByIDErr != nil {
		return 0, m.getByIDErr
	}
	return 1, nil
}

func (m *mockCondoRepo) ExistsByCode(_ context.Context, _ string) (bool, error) {
	return m.existsByCode, nil
}

func (m *mockCondoRepo) ExistsByCNPJ(_ context.Context, _ string) (bool, error) {
	return m.existsByCNPJ, nil
}

func (m *mockCondoRepo) UpdateFeeRule(_ context.Context, _ int64, feeRule domain.FeeRule) error {
	m.updatedFeeRule = feeRule
	return m.updateFeeRuleErr
}

func (m *mockCondoRepo) UpdateLandArea(_ context.Context, _ int64, landArea *float64) error {
	m.updatedLandArea = landArea
	return nil
}

type mockChargeRepo struct {
	hasCharges    bool
	hasChargesErr error
	createErr     error
	created       *domain.Charge
}

func (m *mockChargeRepo) Create(_ context.Context, charge *domain.Charge) error {
	m.created = charge
	return m.createErr
}

func (m *mockChargeRepo) HasChargesForCondominium(_ context.Context, _ int64) (bool, error) {
	return m.hasCharges, m.hasChargesErr
}

func validRequest() domain.CreateCondominiumRequest {
	return domain.CreateCondominiumRequest{
		Name:  "Condomínio Teste",
		Phone: "11999999999",
		Email: "teste@condo.com",
		Address: vo.Address{
			Street:       "Rua Teste",
			Number:       "100",
			Neighborhood: "Centro",
			City:         "São Paulo",
			State:        "SP",
			ZipCode:      "01000-000",
		},
		CNPJs: []domain.CNPJRequest{
			{CNPJ: "11222333000181", RazaoSocial: "Test LTDA", Principal: true, Ativo: true},
		},
	}
}

func authenticatedContext() context.Context {
	return authctx.WithUser(context.Background(), &domain.User{ID: 1})
}

func TestCondominiumUseCase_CreateCondominium_ValidationError(t *testing.T) {
	uc := NewCondominiumUseCase(&mockCondoRepo{})

	req := domain.CreateCondominiumRequest{}
	_, err := uc.CreateCondominium(context.Background(), req)
	if err == nil {
		t.Fatal("expected validation error, got nil")
	}
}

func TestCondominiumUseCase_CreateCondominium_DuplicateCNPJ(t *testing.T) {
	uc := NewCondominiumUseCase(&mockCondoRepo{existsByCNPJ: true})

	req := validRequest()
	_, err := uc.CreateCondominium(authenticatedContext(), req)
	if err == nil {
		t.Fatal("expected duplicate CNPJ error, got nil")
	}
}

func TestCondominiumUseCase_CreateCondominium_Success(t *testing.T) {
	uc := NewCondominiumUseCase(&mockCondoRepo{})

	req := validRequest()
	condo, err := uc.CreateCondominium(authenticatedContext(), req)
	if err != nil {
		t.Fatalf("unexpected error: %v", err)
	}

	if condo.Name != req.Name {
		t.Errorf("expected name %s, got %s", req.Name, condo.Name)
	}
	if condo.Code == "" {
		t.Error("expected code to be generated")
	}
	if len(condo.Code) != 7 {
		t.Errorf("expected code length 7, got %d", len(condo.Code))
	}
	if condo.Status != domain.StatusActive {
		t.Errorf("expected status active, got %s", condo.Status)
	}
	if len(condo.CNPJs) != 1 {
		t.Errorf("expected 1 CNPJ, got %d", len(condo.CNPJs))
	}
}

func TestCondominiumUseCase_CreateCondominium_InvalidCNPJ(t *testing.T) {
	uc := NewCondominiumUseCase(&mockCondoRepo{})

	req := validRequest()
	req.CNPJs = []domain.CNPJRequest{
		{CNPJ: "12345678901234", RazaoSocial: "Invalid LTDA", Principal: true, Ativo: true},
	}
	_, err := uc.CreateCondominium(authenticatedContext(), req)
	if err == nil {
		t.Fatal("expected validation error for invalid CNPJ, got nil")
	}
}

func TestCondominiumUseCase_ListCondominiums_Success(t *testing.T) {
	uc := NewCondominiumUseCase(&mockCondoRepo{listResult: []domain.Condominium{{ID: 1, Name: "Condo 1"}, {ID: 2, Name: "Condo 2"}}})

	condos, err := uc.ListCondominiums(context.Background())
	if err != nil {
		t.Fatalf("unexpected error: %v", err)
	}

	if len(condos) != 2 {
		t.Fatalf("expected 2 condominiums, got %d", len(condos))
	}
}

func TestCondominiumUseCase_ListCondominiums_Error(t *testing.T) {
	uc := NewCondominiumUseCase(&mockCondoRepo{listErr: errors.New("list failed")})

	_, err := uc.ListCondominiums(context.Background())
	if err == nil {
		t.Fatal("expected list error, got nil")
	}
}

func TestCondominiumUseCase_GetCondominiumByID_Success(t *testing.T) {
	expected := &domain.Condominium{ID: 1, Name: "Condomínio Teste"}
	uc := NewCondominiumUseCase(&mockCondoRepo{getByIDResult: expected})

	condo, err := uc.GetCondominiumByID(context.Background(), 1)
	if err != nil {
		t.Fatalf("unexpected error: %v", err)
	}

	if condo.ID != expected.ID {
		t.Errorf("expected id %d, got %d", expected.ID, condo.ID)
	}
}

func TestCondominiumUseCase_GetCondominiumByID_InvalidID(t *testing.T) {
	uc := NewCondominiumUseCase(&mockCondoRepo{})

	_, err := uc.GetCondominiumByID(context.Background(), 0)
	if err == nil {
		t.Fatal("expected invalid id error, got nil")
	}
}

func TestCondominiumUseCase_GetCondominiumByID_NotFound(t *testing.T) {
	uc := NewCondominiumUseCase(&mockCondoRepo{getByIDErr: domain.ErrCondominiumNotFound})

	_, err := uc.GetCondominiumByID(context.Background(), 1)
	if !errors.Is(err, domain.ErrCondominiumNotFound) {
		t.Fatalf("expected not found error, got %v", err)
	}
}

func TestCondominiumUseCase_UpdateFeeRule_Success(t *testing.T) {
	repo := &mockCondoRepo{
		getByIDResult: &domain.Condominium{ID: 1, Code: "ABC1234", FeeRule: domain.FeeRuleProportional},
	}
	uc := NewCondominiumUseCaseWithAuthAndCharges(repo, &mockAssociationRepo{exists: true}, &mockChargeRepo{})

	condo, err := uc.UpdateFeeRule(context.Background(), 1, "ABC1234", domain.FeeRuleProportional)
	if err != nil {
		t.Fatalf("unexpected error: %v", err)
	}

	if repo.updatedFeeRule != domain.FeeRuleProportional {
		t.Fatalf("expected fee rule to be updated to proportional, got %s", repo.updatedFeeRule)
	}
	if condo.FeeRule != domain.FeeRuleProportional {
		t.Fatalf("expected returned fee rule proportional, got %s", condo.FeeRule)
	}
}

func TestCondominiumUseCase_UpdateFeeRule_Immutable(t *testing.T) {
	uc := NewCondominiumUseCaseWithAuthAndCharges(&mockCondoRepo{}, &mockAssociationRepo{exists: true}, &mockChargeRepo{hasCharges: true})

	_, err := uc.UpdateFeeRule(context.Background(), 1, "ABC1234", domain.FeeRuleProportional)
	if !errors.Is(err, domain.ErrFeeRuleImmutable) {
		t.Fatalf("expected immutable fee rule error, got %v", err)
	}
}
