package usecase

import (
	"context"
	"errors"
	"testing"

	"ap202/internal/domain"
)

type mockUnitRepo struct {
	existsByIdentifier bool
	existsErr          error
	createErr          error
	listResult         []domain.Unit
	listErr            error
	findByIDResult     *domain.Unit
	findByIDErr        error
	deleteErr          error
	created            *domain.Unit
	updatedUnit        *domain.Unit
}

type mockUnitGroupRepo struct {
	exists    bool
	existsErr error
	list      []domain.UnitGroup
}

func (m *mockUnitRepo) Create(_ context.Context, unit *domain.Unit) error {
	m.created = unit
	if m.createErr != nil {
		return m.createErr
	}
	unit.ID = 1
	return nil
}

func (m *mockUnitRepo) List(_ context.Context, _ int64) ([]domain.Unit, error) {
	return m.listResult, m.listErr
}

func (m *mockUnitRepo) FindByID(_ context.Context, _ int64, _ int64) (*domain.Unit, error) {
	return m.findByIDResult, m.findByIDErr
}

func (m *mockUnitRepo) FindByGroupNameAndIdentifier(_ context.Context, _ int64, groupName, identifier string) (*domain.Unit, error) {
	return &domain.Unit{ID: 1, GroupName: groupName, Identifier: identifier}, nil
}

func (m *mockUnitRepo) ExistsByGroupNameAndIdentifier(_ context.Context, _ int64, _ string, _ string) (bool, error) {
	return m.existsByIdentifier, m.existsErr
}

func (m *mockUnitRepo) BelongsToCondominium(_ context.Context, _ int64, _ int64) (bool, error) {
	return true, nil
}

func (m *mockUnitRepo) UpdatePrivateArea(_ context.Context, _ int64, _ int64, privateArea *float64) (*domain.Unit, error) {
	m.updatedUnit = &domain.Unit{ID: 1, PrivateArea: privateArea}
	return m.updatedUnit, nil
}

func (m *mockUnitRepo) ExistsByGroup(_ context.Context, _ int64, _, _ string) (bool, error) {
	return false, nil
}

func (m *mockUnitRepo) Delete(_ context.Context, _ int64, _ int64) error {
	return m.deleteErr
}

func (m *mockUnitGroupRepo) Create(_ context.Context, _ *domain.UnitGroup) error {
	return nil
}

func (m *mockUnitGroupRepo) List(_ context.Context, _ int64) ([]domain.UnitGroup, error) {
	return m.list, nil
}

func (m *mockUnitGroupRepo) GetByID(_ context.Context, _ int64, _ int64) (*domain.UnitGroup, error) {
	return nil, nil
}

func (m *mockUnitGroupRepo) Exists(_ context.Context, _ int64, _, _ string) (bool, error) {
	return m.exists, m.existsErr
}

func (m *mockUnitGroupRepo) ExistsExcludingID(_ context.Context, _ int64, _ int64, _, _ string) (bool, error) {
	return m.exists, m.existsErr
}

func (m *mockUnitGroupRepo) Update(_ context.Context, _ int64, _ int64, input domain.UpdateUnitGroupInput) (*domain.UnitGroup, error) {
	return &domain.UnitGroup{ID: 1, GroupType: input.GroupType, Name: input.Name, Floors: input.Floors, Active: true}, nil
}

func (m *mockUnitGroupRepo) Delete(_ context.Context, _ int64, _ int64) error {
	return nil
}

type mockAssociationRepo struct {
	exists bool
	err    error
}

func (m *mockAssociationRepo) HasActiveManagerAssociation(_ context.Context, _, _ int64) (bool, error) {
	return m.exists, m.err
}

func TestUnitUseCase_Create_Success(t *testing.T) {
	unitRepo := &mockUnitRepo{}
	uc := NewUnitUseCase(unitRepo, &mockUnitGroupRepo{exists: true}, &mockAssociationRepo{exists: true}, &mockCondoRepo{})

	unit, err := uc.Create(context.Background(), 1, "ABC1234", domain.CreateUnitInput{Identifier: "101", GroupType: "block", GroupName: "A", Floor: "1", Description: "Apto"})
	if err != nil {
		t.Fatalf("unexpected error: %v", err)
	}

	if unit.ID != 1 {
		t.Fatalf("expected created unit id 1, got %d", unit.ID)
	}
	if unit.CondominiumID != 1 {
		t.Fatalf("expected condominium id 1, got %d", unit.CondominiumID)
	}
	if unit.Code != "ABC1234-A-101" {
		t.Fatalf("expected generated code ABC1234-A-101, got %s", unit.Code)
	}
	if unit.GroupType != "block" {
		t.Fatalf("expected group type block, got %s", unit.GroupType)
	}
	if unit.GroupName != "A" {
		t.Fatalf("expected group name A, got %s", unit.GroupName)
	}
	if !unit.Active {
		t.Fatal("expected unit to be active")
	}
}

func TestUnitUseCase_Create_Forbidden(t *testing.T) {
	uc := NewUnitUseCase(&mockUnitRepo{}, &mockUnitGroupRepo{exists: true}, &mockAssociationRepo{exists: false}, &mockCondoRepo{})

	_, err := uc.Create(context.Background(), 1, "ABC1234", domain.CreateUnitInput{Identifier: "101", GroupType: "block", GroupName: "A"})
	if !errors.Is(err, domain.ErrForbidden) {
		t.Fatalf("expected forbidden error, got %v", err)
	}
}

func TestUnitUseCase_Create_GroupInvalid(t *testing.T) {
	uc := NewUnitUseCase(&mockUnitRepo{}, &mockUnitGroupRepo{exists: true}, &mockAssociationRepo{exists: true}, &mockCondoRepo{})

	_, err := uc.Create(context.Background(), 1, "ABC1234", domain.CreateUnitInput{Identifier: "101", GroupType: "block"})
	if !errors.Is(err, domain.ErrUnitGroupInvalid) {
		t.Fatalf("expected group invalid error, got %v", err)
	}
}

func TestUnitUseCase_Create_GroupTypeNotAllowed(t *testing.T) {
	uc := NewUnitUseCase(&mockUnitRepo{}, &mockUnitGroupRepo{exists: true}, &mockAssociationRepo{exists: true}, &mockCondoRepo{})

	_, err := uc.Create(context.Background(), 1, "ABC1234", domain.CreateUnitInput{Identifier: "101", GroupType: "bloco", GroupName: "A"})
	if !errors.Is(err, domain.ErrUnitGroupInvalid) {
		t.Fatalf("expected group invalid error, got %v", err)
	}
}

func TestUnitUseCase_Create_CodeTooLong(t *testing.T) {
	uc := NewUnitUseCase(&mockUnitRepo{}, &mockUnitGroupRepo{exists: true}, &mockAssociationRepo{exists: true}, &mockCondoRepo{})

	_, err := uc.Create(context.Background(), 1, "CODIGO-CONDOMINIO-EXTREMAMENTE-GRANDE-1234567890", domain.CreateUnitInput{Identifier: "101", GroupType: "tower", GroupName: "T1"})
	if !errors.Is(err, domain.ErrUnitCodeTooLong) {
		t.Fatalf("expected unit code too long error, got %v", err)
	}
}

func TestUnitUseCase_Create_Duplicate(t *testing.T) {
	uc := NewUnitUseCase(&mockUnitRepo{existsByIdentifier: true}, &mockUnitGroupRepo{exists: true}, &mockAssociationRepo{exists: true}, &mockCondoRepo{})

	_, err := uc.Create(context.Background(), 1, "ABC1234", domain.CreateUnitInput{Identifier: "101", GroupType: "block", GroupName: "A"})
	if !errors.Is(err, domain.ErrUnitIdentifierDuplicate) {
		t.Fatalf("expected duplicate error, got %v", err)
	}
}

func TestUnitUseCase_Create_IdentifierMustBeNumeric(t *testing.T) {
	uc := NewUnitUseCase(&mockUnitRepo{}, &mockUnitGroupRepo{exists: true}, &mockAssociationRepo{exists: true}, &mockCondoRepo{})

	_, err := uc.Create(context.Background(), 1, "ABC1234", domain.CreateUnitInput{Identifier: "10A", GroupType: "block", GroupName: "A"})
	if !errors.Is(err, domain.ErrUnitIdentifierInvalid) {
		t.Fatalf("expected identifier invalid error, got %v", err)
	}
}

func TestUnitUseCase_List_Success(t *testing.T) {
	expected := []domain.Unit{{ID: 1, Identifier: "101"}, {ID: 2, Identifier: "102"}}
	uc := NewUnitUseCase(&mockUnitRepo{listResult: expected}, &mockUnitGroupRepo{exists: true}, &mockAssociationRepo{exists: true}, &mockCondoRepo{})

	units, err := uc.List(context.Background(), 1, "ABC1234")
	if err != nil {
		t.Fatalf("unexpected error: %v", err)
	}
	if len(units) != 2 {
		t.Fatalf("expected 2 units, got %d", len(units))
	}
}

func TestUnitUseCase_GetByID_NotFound(t *testing.T) {
	uc := NewUnitUseCase(&mockUnitRepo{findByIDErr: domain.ErrUnitNotFound}, &mockUnitGroupRepo{exists: true}, &mockAssociationRepo{exists: true}, &mockCondoRepo{})

	_, err := uc.GetByID(context.Background(), 1, "ABC1234", 1)
	if !errors.Is(err, domain.ErrUnitNotFound) {
		t.Fatalf("expected unit not found, got %v", err)
	}
}

func TestUnitUseCase_Create_RequiresRegisteredGroup(t *testing.T) {
	uc := NewUnitUseCase(&mockUnitRepo{}, &mockUnitGroupRepo{exists: false}, &mockAssociationRepo{exists: true}, &mockCondoRepo{})

	_, err := uc.Create(context.Background(), 1, "ABC1234", domain.CreateUnitInput{Identifier: "101", GroupType: "block", GroupName: "A"})
	if !errors.Is(err, domain.ErrUnitGroupMustBeRegistered) {
		t.Fatalf("expected registered group error, got %v", err)
	}
}

func TestUnitUseCase_Create_RejectsFloorOutsideGroupRange(t *testing.T) {
	floors := 3
	uc := NewUnitUseCase(
		&mockUnitRepo{},
		&mockUnitGroupRepo{
			exists: true,
			list: []domain.UnitGroup{
				{ID: 1, GroupType: "block", Name: "A", Floors: &floors, Active: true},
			},
		},
		&mockAssociationRepo{exists: true},
		&mockCondoRepo{},
	)

	_, err := uc.Create(context.Background(), 1, "ABC1234", domain.CreateUnitInput{
		Identifier: "101",
		GroupType:  "block",
		GroupName:  "A",
		Floor:      "5",
	})
	if !errors.Is(err, domain.ErrUnitFloorInvalid) {
		t.Fatalf("expected floor invalid error, got %v", err)
	}
}

func TestUnitUseCase_Delete_Success(t *testing.T) {
	uc := NewUnitUseCase(&mockUnitRepo{}, &mockUnitGroupRepo{exists: true}, &mockAssociationRepo{exists: true}, &mockCondoRepo{})

	err := uc.Delete(context.Background(), 1, "ABC1234", 1)
	if err != nil {
		t.Fatalf("expected no error, got %v", err)
	}
}
