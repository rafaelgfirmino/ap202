package usecase

import (
	"context"
	"testing"

	"ap202/internal/domain"
)

type mockUnitGroupRepoForList struct {
	groups       []domain.UnitGroup
	createCalled bool
	created      *domain.UnitGroup
}

func (m *mockUnitGroupRepoForList) Create(_ context.Context, group *domain.UnitGroup) error {
	m.createCalled = true
	group.ID = 1
	m.created = group
	m.groups = append(m.groups, *group)
	return nil
}

func (m *mockUnitGroupRepoForList) List(_ context.Context, _ int64) ([]domain.UnitGroup, error) {
	return append([]domain.UnitGroup(nil), m.groups...), nil
}

func (m *mockUnitGroupRepoForList) GetByID(_ context.Context, _ int64, id int64) (*domain.UnitGroup, error) {
	for _, group := range m.groups {
		if group.ID == id {
			cloned := group
			return &cloned, nil
		}
	}
	return nil, domain.ErrUnitGroupNotFound
}

func (m *mockUnitGroupRepoForList) Exists(_ context.Context, _ int64, _, _ string) (bool, error) {
	return false, nil
}

func (m *mockUnitGroupRepoForList) ExistsExcludingID(_ context.Context, _ int64, id int64, groupType, name string) (bool, error) {
	for _, group := range m.groups {
		if group.ID != id && group.GroupType == groupType && group.Name == name && group.Active {
			return true, nil
		}
	}

	return false, nil
}

func (m *mockUnitGroupRepoForList) Update(_ context.Context, _ int64, id int64, input domain.UpdateUnitGroupInput) (*domain.UnitGroup, error) {
	for index, group := range m.groups {
		if group.ID == id {
			m.groups[index].GroupType = input.GroupType
			m.groups[index].Name = input.Name
			m.groups[index].Floors = input.Floors
			updated := m.groups[index]
			return &updated, nil
		}
	}
	return nil, domain.ErrUnitGroupNotFound
}

func (m *mockUnitGroupRepoForList) Delete(_ context.Context, _ int64, id int64) error {
	for index, group := range m.groups {
		if group.ID == id {
			m.groups = append(m.groups[:index], m.groups[index+1:]...)
			return nil
		}
	}
	return domain.ErrUnitGroupNotFound
}

type mockUnitRepoForUnitGroup struct {
	existsByGroup bool
}

func (m *mockUnitRepoForUnitGroup) Create(context.Context, *domain.Unit) error { return nil }
func (m *mockUnitRepoForUnitGroup) List(context.Context, int64) ([]domain.Unit, error) {
	return nil, nil
}
func (m *mockUnitRepoForUnitGroup) FindByID(context.Context, int64, int64) (*domain.Unit, error) {
	return nil, nil
}
func (m *mockUnitRepoForUnitGroup) FindByGroupNameAndIdentifier(context.Context, int64, string, string) (*domain.Unit, error) {
	return nil, nil
}
func (m *mockUnitRepoForUnitGroup) ExistsByGroupNameAndIdentifier(context.Context, int64, string, string) (bool, error) {
	return false, nil
}
func (m *mockUnitRepoForUnitGroup) BelongsToCondominium(context.Context, int64, int64) (bool, error) {
	return false, nil
}
func (m *mockUnitRepoForUnitGroup) UpdatePrivateArea(context.Context, int64, int64, *float64) (*domain.Unit, error) {
	return nil, nil
}
func (m *mockUnitRepoForUnitGroup) Delete(context.Context, int64, int64) error { return nil }
func (m *mockUnitRepoForUnitGroup) ExistsByGroup(context.Context, int64, string, string) (bool, error) {
	return m.existsByGroup, nil
}

type mockAssociationRepoForUnitGroup struct{}

func (m *mockAssociationRepoForUnitGroup) HasActiveManagerAssociation(_ context.Context, _ int64, _ int64) (bool, error) {
	return true, nil
}

func (m *mockAssociationRepoForUnitGroup) Create(context.Context, int64, int64, string) error {
	return nil
}

func (m *mockAssociationRepoForUnitGroup) ListCondominiumsByPerson(context.Context, int64) ([]domain.Condominium, error) {
	return nil, nil
}

type mockCondominiumRepoForUnitGroup struct{}

func (m *mockCondominiumRepoForUnitGroup) Create(context.Context, *domain.Condominium, int64) error {
	return nil
}

func (m *mockCondominiumRepoForUnitGroup) List(context.Context) ([]domain.Condominium, error) {
	return nil, nil
}

func (m *mockCondominiumRepoForUnitGroup) ListByPersonID(context.Context, int64) ([]domain.Condominium, error) {
	return nil, nil
}

func (m *mockCondominiumRepoForUnitGroup) GetByID(context.Context, int64) (*domain.Condominium, error) {
	return nil, nil
}

func (m *mockCondominiumRepoForUnitGroup) FindIDByCode(_ context.Context, _ string) (int64, error) {
	return 10, nil
}

func (m *mockCondominiumRepoForUnitGroup) ExistsByCode(context.Context, string) (bool, error) {
	return false, nil
}

func (m *mockCondominiumRepoForUnitGroup) ExistsByCNPJ(context.Context, string) (bool, error) {
	return false, nil
}

func (m *mockCondominiumRepoForUnitGroup) UpdateFeeRule(context.Context, int64, domain.FeeRule) error {
	return nil
}

func (m *mockCondominiumRepoForUnitGroup) UpdateLandArea(context.Context, int64, *float64) error {
	return nil
}

func TestUnitGroupUseCase_ListCreatesDefaultBlockAWhenEmpty(t *testing.T) {
	repo := &mockUnitGroupRepoForList{}
	useCase := NewUnitGroupUseCase(repo, &mockUnitRepoForUnitGroup{}, &mockAssociationRepoForUnitGroup{}, &mockCondominiumRepoForUnitGroup{})

	groups, err := useCase.List(context.Background(), 1, "ABC123")
	if err != nil {
		t.Fatalf("expected no error, got %v", err)
	}
	if !repo.createCalled {
		t.Fatalf("expected default group creation when list is empty")
	}
	if len(groups) != 1 {
		t.Fatalf("expected 1 group, got %d", len(groups))
	}
	if groups[0].GroupType != "block" || groups[0].Name != "A" {
		t.Fatalf("expected default group block/A, got %s/%s", groups[0].GroupType, groups[0].Name)
	}
	if groups[0].Floors != nil {
		t.Fatalf("expected default group floors to be nil")
	}
}

func TestUnitGroupUseCase_ListDoesNotCreateDefaultWhenGroupExists(t *testing.T) {
	repo := &mockUnitGroupRepoForList{
		groups: []domain.UnitGroup{
			{ID: 5, CondominiumID: 10, GroupType: "tower", Name: "1", Active: true},
		},
	}
	useCase := NewUnitGroupUseCase(repo, &mockUnitRepoForUnitGroup{}, &mockAssociationRepoForUnitGroup{}, &mockCondominiumRepoForUnitGroup{})

	groups, err := useCase.List(context.Background(), 1, "ABC123")
	if err != nil {
		t.Fatalf("expected no error, got %v", err)
	}
	if repo.createCalled {
		t.Fatalf("did not expect default group creation when groups already exist")
	}
	if len(groups) != 1 {
		t.Fatalf("expected 1 group, got %d", len(groups))
	}
}

func TestUnitGroupUseCase_CreateIncludesFloors(t *testing.T) {
	floors := 8
	repo := &mockUnitGroupRepoForList{}
	useCase := NewUnitGroupUseCase(repo, &mockUnitRepoForUnitGroup{}, &mockAssociationRepoForUnitGroup{}, &mockCondominiumRepoForUnitGroup{})

	group, err := useCase.Create(context.Background(), 1, "ABC123", domain.CreateUnitGroupInput{
		GroupType: "block",
		Name:      "B",
		Floors:    &floors,
	})
	if err != nil {
		t.Fatalf("expected no error, got %v", err)
	}
	if group.Floors == nil || *group.Floors != floors {
		t.Fatalf("expected floors %d, got %+v", floors, group.Floors)
	}
}

func TestUnitGroupUseCase_DeleteBlocksWhenUnitsExist(t *testing.T) {
	repo := &mockUnitGroupRepoForList{
		groups: []domain.UnitGroup{
			{ID: 1, CondominiumID: 10, GroupType: "block", Name: "A", Active: true},
		},
	}
	useCase := NewUnitGroupUseCase(repo, &mockUnitRepoForUnitGroup{existsByGroup: true}, &mockAssociationRepoForUnitGroup{}, &mockCondominiumRepoForUnitGroup{})

	err := useCase.Delete(context.Background(), 1, "ABC123", 1)
	if err == nil || err != domain.ErrUnitGroupHasUnits {
		t.Fatalf("expected ErrUnitGroupHasUnits, got %v", err)
	}
}
