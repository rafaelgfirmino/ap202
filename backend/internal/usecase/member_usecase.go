package usecase

import (
	"context"
	"database/sql"
	"errors"
	"fmt"
	"time"

	"ap202/internal/domain"
	"ap202/internal/domain/vo"
	"ap202/internal/ports/output"
)

type MemberUseCase struct {
	db              *sql.DB
	memberRepo      output.MemberRepository
	userRepo        output.UserRepository
	unitRepo        output.UnitRepository
	condominiumRepo output.CondominiumRepository
}

func NewMemberUseCase(db *sql.DB, memberRepo output.MemberRepository, userRepo output.UserRepository, unitRepo output.UnitRepository, condominiumRepo output.CondominiumRepository) *MemberUseCase {
	return &MemberUseCase{
		db:              db,
		memberRepo:      memberRepo,
		userRepo:        userRepo,
		unitRepo:        unitRepo,
		condominiumRepo: condominiumRepo,
	}
}

func (uc *MemberUseCase) Add(ctx context.Context, userID int64, code string, unitCode string, input domain.AddMemberInput) (*domain.Member, error) {
	unit, condominiumID, err := uc.resolveUnit(ctx, code, unitCode)
	if err != nil {
		return nil, err
	}

	input = input.Normalize()
	if err := input.Validate(); err != nil {
		return nil, err
	}

	memberUser, findUserErr := uc.userRepo.FindByEmail(ctx, input.Email)
	if findUserErr != nil && !errors.Is(findUserErr, domain.ErrUserNotFound) {
		return nil, fmt.Errorf("failed to find user by email: %w", findUserErr)
	}

	now := time.Now().UTC()
	startDate := now
	if input.StartDate != nil {
		startDate = input.StartDate.UTC()
	}

	tx, err := uc.db.BeginTx(ctx, nil)
	if err != nil {
		return nil, fmt.Errorf("failed to begin transaction: %w", err)
	}
	defer tx.Rollback()

	if errors.Is(findUserErr, domain.ErrUserNotFound) {
		memberUser = &domain.User{
			Name:      input.Name,
			Email:     input.Email,
			CreatedAt: now,
			UpdatedAt: now,
		}
		if err := uc.userRepo.CreateTx(ctx, tx, memberUser); err != nil {
			return nil, fmt.Errorf("failed to create user: %w", err)
		}
	}

	bond := &domain.Bond{
		UserID:        memberUser.ID,
		CondominiumID: condominiumID,
		UnitID:        &unit.ID,
		Role:          input.Role,
		Active:        true,
		StartDate:     startDate,
		EndDate:       input.EndDate,
		CreatedAt:     now,
	}
	if err := uc.memberRepo.CreateBond(ctx, tx, bond); err != nil {
		return nil, fmt.Errorf("failed to create bond: %w", err)
	}

	if err := tx.Commit(); err != nil {
		return nil, fmt.Errorf("failed to commit transaction: %w", err)
	}

	return &domain.Member{
		BondID:    bond.ID,
		UserID:    memberUser.ID,
		UnitID:    unit.ID,
		Name:      memberUser.Name,
		Email:     memberUser.Email,
		Role:      bond.Role,
		Active:    bond.Active,
		StartDate: bond.StartDate,
		EndDate:   bond.EndDate,
		CreatedAt: bond.CreatedAt,
	}, nil
}

func (uc *MemberUseCase) List(ctx context.Context, userID int64, code string, unitCode string) ([]domain.Member, error) {
	unit, _, err := uc.resolveUnit(ctx, code, unitCode)
	if err != nil {
		return nil, err
	}

	members, err := uc.memberRepo.ListMembersByUnitID(ctx, unit.ID)
	if err != nil {
		return nil, fmt.Errorf("failed to list members: %w", err)
	}

	return members, nil
}

func (uc *MemberUseCase) Remove(ctx context.Context, userID int64, code string, unitCode string, bondID int64) error {
	unit, condominiumID, err := uc.resolveUnit(ctx, code, unitCode)
	if err != nil {
		return err
	}

	if err := uc.memberRepo.DeactivateBond(ctx, bondID, condominiumID, unit.ID, time.Now().UTC()); err != nil {
		return err
	}

	return nil
}

func (uc *MemberUseCase) resolveUnit(ctx context.Context, condominiumCode, unitCode string) (*domain.Unit, int64, error) {
	condominiumID, err := uc.condominiumRepo.FindIDByCode(ctx, condominiumCode)
	if err != nil {
		return nil, 0, err
	}

	groupName, identifier, err := vo.ParseUnitCode(unitCode)
	if err != nil {
		return nil, 0, domain.ErrUnitNotFound
	}

	unit, err := uc.unitRepo.FindByGroupNameAndIdentifier(ctx, condominiumID, groupName, identifier)
	if err != nil {
		return nil, 0, err
	}

	return unit, condominiumID, nil
}
