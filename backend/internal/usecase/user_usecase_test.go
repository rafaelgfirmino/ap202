package usecase

import (
	"context"
	"database/sql"
	"errors"
	"testing"

	"ap202/internal/domain"
)

type mockUserRepo struct {
	userByExternal  *domain.User
	userByEmail     *domain.User
	findExternalErr error
	findEmailErr    error
	createErr       error
	updateErr       error
	created         *domain.User
	updated         *domain.User
}

func (m *mockUserRepo) FindByExternalAuthID(_ context.Context, _ string) (*domain.User, error) {
	if m.findExternalErr != nil {
		return nil, m.findExternalErr
	}
	if m.userByExternal == nil {
		return nil, domain.ErrUserNotFound
	}
	return m.userByExternal, nil
}

func (m *mockUserRepo) FindByEmail(_ context.Context, _ string) (*domain.User, error) {
	if m.findEmailErr != nil {
		return nil, m.findEmailErr
	}
	if m.userByEmail == nil {
		return nil, domain.ErrUserNotFound
	}
	return m.userByEmail, nil
}

func (m *mockUserRepo) FindByID(_ context.Context, _ int64) (*domain.User, error) {
	return nil, domain.ErrUserNotFound
}

func (m *mockUserRepo) Create(_ context.Context, user *domain.User) error {
	m.created = user
	if m.createErr != nil {
		return m.createErr
	}
	user.ID = 99
	return nil
}

func (m *mockUserRepo) CreateTx(_ context.Context, _ *sql.Tx, _ *domain.User) error {
	return errors.New("not implemented")
}

func (m *mockUserRepo) UpdateIdentity(_ context.Context, user *domain.User) error {
	m.updated = user
	return m.updateErr
}

func TestUserUseCase_FindOrCreate_ReconcilesExistingUserByEmail(t *testing.T) {
	repo := &mockUserRepo{
		userByEmail: &domain.User{
			ID:    7,
			Email: "user@example.com",
			Name:  "Old Name",
		},
	}
	uc := NewUserUseCase(repo)

	user, err := uc.FindOrCreate(context.Background(), "user_ext_123", "Maria", "Silva", "user@example.com")
	if err != nil {
		t.Fatalf("unexpected error: %v", err)
	}

	if user.ID != 7 {
		t.Fatalf("expected existing user id 7, got %d", user.ID)
	}
	if repo.updated == nil {
		t.Fatal("expected user identity update")
	}
	if repo.created != nil {
		t.Fatal("did not expect a new user creation")
	}
	if repo.updated.ExternalAuthID == nil || *repo.updated.ExternalAuthID != "user_ext_123" {
		t.Fatalf("expected external auth id to be reconciled, got %+v", repo.updated.ExternalAuthID)
	}
}

func TestUserUseCase_FindOrCreate_CreatesWhenNoMatchExists(t *testing.T) {
	repo := &mockUserRepo{}
	uc := NewUserUseCase(repo)

	user, err := uc.FindOrCreate(context.Background(), "user_ext_456", "Joao", "Souza", "joao@example.com")
	if err != nil {
		t.Fatalf("unexpected error: %v", err)
	}

	if repo.created == nil {
		t.Fatal("expected user creation")
	}
	if user.ID != 99 {
		t.Fatalf("expected created user id 99, got %d", user.ID)
	}
}
