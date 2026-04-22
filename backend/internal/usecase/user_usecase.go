package usecase

import (
	"context"
	"errors"
	"fmt"
	"strings"
	"time"

	"ap202/internal/domain"
	"ap202/internal/ports/output"
)

type UserUseCase struct {
	repo output.UserRepository
}

func NewUserUseCase(repo output.UserRepository) *UserUseCase {
	return &UserUseCase{repo: repo}
}

func (uc *UserUseCase) FindOrCreate(ctx context.Context, externalAuthID, firstName, lastName, email string) (*domain.User, error) {
	if externalAuthID == "" {
		return nil, domain.ErrExternalAuthIDRequired
	}
	firstName = strings.TrimSpace(firstName)
	if firstName == "" {
		return nil, domain.ErrFirstNameRequired
	}
	lastName = strings.TrimSpace(lastName)
	if lastName == "" {
		return nil, domain.ErrLastNameRequired
	}
	email = strings.TrimSpace(email)
	if email == "" {
		return nil, domain.ErrEmailRequired
	}

	user, err := uc.repo.FindByExternalAuthID(ctx, externalAuthID)
	if err == nil {
		return user, nil
	}
	if !errors.Is(err, domain.ErrUserNotFound) {
		return nil, fmt.Errorf("failed to find user by external_auth_id: %w", err)
	}

	now := time.Now()
	name := strings.TrimSpace(strings.Join([]string{firstName, lastName}, " "))
	if name == "" {
		return nil, domain.ErrNameRequired
	}

	userByEmail, err := uc.repo.FindByEmail(ctx, email)
	if err == nil {
		externalAuthIDValue := externalAuthID
		userByEmail.ExternalAuthID = &externalAuthIDValue
		userByEmail.FirstName = firstName
		userByEmail.LastName = lastName
		userByEmail.Name = name
		userByEmail.Email = email
		userByEmail.UpdatedAt = now

		if updateErr := uc.repo.UpdateIdentity(ctx, userByEmail); updateErr != nil {
			return nil, fmt.Errorf("failed to reconcile user by email: %w", updateErr)
		}

		return userByEmail, nil
	}
	if !errors.Is(err, domain.ErrUserNotFound) {
		return nil, fmt.Errorf("failed to find user by email: %w", err)
	}

	externalAuthIDValue := externalAuthID
	user = &domain.User{
		ExternalAuthID: &externalAuthIDValue,
		FirstName:      firstName,
		LastName:       lastName,
		Name:           name,
		Email:          email,
		CreatedAt:      now,
		UpdatedAt:      now,
	}

	if err := uc.repo.Create(ctx, user); err != nil {
		return nil, fmt.Errorf("failed to create user: %w", err)
	}

	return user, nil
}

func (uc *UserUseCase) GetByID(ctx context.Context, id int64) (*domain.User, error) {
	if id <= 0 {
		return nil, domain.ErrUserNotFound
	}

	user, err := uc.repo.FindByID(ctx, id)
	if err != nil {
		return nil, fmt.Errorf("failed to get user: %w", err)
	}

	return user, nil
}
