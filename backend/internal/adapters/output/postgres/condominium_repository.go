package postgres

import (
	"context"
	"database/sql"
	"errors"
	"fmt"
	"time"

	"ap202/internal/adapters/output/postgres/sqlcgen"
	"ap202/internal/domain"
	"ap202/internal/domain/vo"
)

type CondominiumRepository struct {
	db      *sql.DB
	queries *sqlcgen.Queries
}

func NewCondominiumRepository(db *sql.DB) *CondominiumRepository {
	return &CondominiumRepository{
		db:      db,
		queries: sqlcgen.New(db),
	}
}

func (r *CondominiumRepository) Create(ctx context.Context, condo *domain.Condominium, personID int64) error {
	tx, err := r.db.BeginTx(ctx, nil)
	if err != nil {
		return fmt.Errorf("failed to begin transaction: %w", err)
	}
	defer tx.Rollback()

	qtx := r.queries.WithTx(tx)

	id, err := qtx.CreateCondominium(ctx, sqlcgen.CreateCondominiumParams{
		Code:         condo.Code,
		Name:         condo.Name,
		Phone:        condo.Phone,
		Email:        condo.Email,
		LandArea:     toNullFloat64(condo.LandArea),
		Street:       condo.Address.Street,
		Number:       condo.Address.Number,
		Neighborhood: condo.Address.Neighborhood,
		City:         condo.Address.City,
		State:        condo.Address.State,
		ZipCode:      condo.Address.ZipCode,
		Latitude:     sql.NullFloat64{Float64: condo.Address.Latitude, Valid: true},
		Longitude:    sql.NullFloat64{Float64: condo.Address.Longitude, Valid: true},
		Status:       string(condo.Status),
		CreatedAt:    condo.CreatedAt,
		UpdatedAt:    condo.UpdatedAt,
	})
	if err != nil {
		return fmt.Errorf("failed to insert condominium: %w", err)
	}
	condo.ID = id

	for i, cnpj := range condo.CNPJs {
		cnpjID, err := qtx.CreateCondominiumCNPJ(ctx, sqlcgen.CreateCondominiumCNPJParams{
			CondominiumID: condo.ID,
			Cnpj:          cnpj.CNPJ,
			RazaoSocial:   cnpj.RazaoSocial,
			Descricao:     cnpj.Descricao,
			Principal:     cnpj.Principal,
			Ativo:         cnpj.Ativo,
			DataInicio:    toNullTime(cnpj.DataInicio),
			DataFim:       toNullTime(cnpj.DataFim),
		})
		if err != nil {
			return fmt.Errorf("failed to insert CNPJ %s: %w", cnpj.CNPJ, err)
		}
		condo.CNPJs[i].ID = cnpjID
		condo.CNPJs[i].CondominiumID = condo.ID
	}

	if err := qtx.CreateAssociation(ctx, sqlcgen.CreateAssociationParams{
		PersonID:      personID,
		CondominiumID: condo.ID,
		UnitID:        sql.NullInt64{},
		Role:          "manager",
		Active:        true,
		StartDate:     time.Now().UTC(),
		EndDate:       sql.NullTime{},
		CreatedAt:     time.Now().UTC(),
	}); err != nil {
		return fmt.Errorf("failed to insert association: %w", err)
	}

	const createDefaultAccountsQuery = `
		INSERT INTO accounts (condominium_id, name, type)
		VALUES
			($1, 'Conta Corrente', 'checking'),
			($1, 'Poupança', 'savings'),
			($1, 'Caixa', 'cash'),
			($1, 'Fundo de Reserva', 'reserve_fund')
	`
	if _, err := tx.ExecContext(ctx, createDefaultAccountsQuery, condo.ID); err != nil {
		return fmt.Errorf("failed to create default accounts: %w", err)
	}

	if err := tx.Commit(); err != nil {
		return fmt.Errorf("failed to commit transaction: %w", err)
	}

	return nil
}

func (r *CondominiumRepository) List(ctx context.Context) ([]domain.Condominium, error) {
	rows, err := r.queries.ListCondominiumsWithCNPJs(ctx)
	if err != nil {
		return nil, fmt.Errorf("failed to query condominiums: %w", err)
	}

	condosByID := make(map[int64]*domain.Condominium)
	var orderedIDs []int64
	for _, row := range rows {
		condo, cnpj, hasCNPJ := mapListCondominiumRow(row)

		existing, found := condosByID[condo.ID]
		if !found {
			condoCopy := condo
			condosByID[condo.ID] = &condoCopy
			orderedIDs = append(orderedIDs, condo.ID)
			existing = &condoCopy
		}

		if hasCNPJ {
			existing.CNPJs = append(existing.CNPJs, cnpj)
		}
	}

	condos := make([]domain.Condominium, 0, len(orderedIDs))
	for _, id := range orderedIDs {
		condos = append(condos, *condosByID[id])
	}

	return condos, nil
}

func (r *CondominiumRepository) ListByPersonID(ctx context.Context, personID int64) ([]domain.Condominium, error) {
	const q = `
		SELECT c.id, c.code, c.name, c.phone, c.email, c.fee_rule, c.land_area, c.built_area_sum, c.street, c.number, c.neighborhood, c.city, c.state, c.zip_code, c.latitude, c.longitude, c.status, c.created_at, c.updated_at,
		       cc.id, cc.condominium_id, cc.cnpj, cc.razao_social, cc.descricao, cc.principal, cc.ativo, cc.data_inicio, cc.data_fim, cc.created_at
		FROM association a
		JOIN condominiums c ON c.id = a.condominium_id
		LEFT JOIN condominium_cnpjs cc ON cc.condominium_id = c.id
		WHERE a.person_id = $1 AND a.active = TRUE
		ORDER BY c.id ASC, cc.id ASC;
	`

	rows, err := r.db.QueryContext(ctx, q, personID)
	if err != nil {
		return nil, fmt.Errorf("failed to query condominiums by person: %w", err)
	}
	defer rows.Close()

	condosByID := make(map[int64]*domain.Condominium)
	var orderedIDs []int64

	for rows.Next() {
		var (
			condoID       int64
			code          string
			name          string
			phone         string
			email         string
			feeRule       string
			landArea      sql.NullFloat64
			builtAreaSum  float64
			street        string
			number        string
			neighborhood  string
			city          string
			state         string
			zipCode       string
			latitude      sql.NullFloat64
			longitude     sql.NullFloat64
			status        string
			createdAt     time.Time
			updatedAt     time.Time
			cnpjID        sql.NullInt64
			cnpjCondoID   sql.NullInt64
			cnpjValue     sql.NullString
			razaoSocial   sql.NullString
			descricao     sql.NullString
			principal     sql.NullBool
			ativo         sql.NullBool
			dataInicio    sql.NullTime
			dataFim       sql.NullTime
			cnpjCreatedAt sql.NullTime
		)

		if err := rows.Scan(
			&condoID,
			&code,
			&name,
			&phone,
			&email,
			&feeRule,
			&landArea,
			&builtAreaSum,
			&street,
			&number,
			&neighborhood,
			&city,
			&state,
			&zipCode,
			&latitude,
			&longitude,
			&status,
			&createdAt,
			&updatedAt,
			&cnpjID,
			&cnpjCondoID,
			&cnpjValue,
			&razaoSocial,
			&descricao,
			&principal,
			&ativo,
			&dataInicio,
			&dataFim,
			&cnpjCreatedAt,
		); err != nil {
			return nil, fmt.Errorf("failed to scan condominiums by person: %w", err)
		}

		existing, found := condosByID[condoID]
		if !found {
			condo := domain.Condominium{
				ID:        condoID,
				Code:      code,
				Name:      name,
				Phone:     phone,
				Email:     email,
				FeeRule:   domain.FeeRule(feeRule),
				BuiltArea: builtAreaSum,
				Address: vo.Address{
					Street:       street,
					Number:       number,
					Neighborhood: neighborhood,
					City:         city,
					State:        state,
					ZipCode:      zipCode,
				},
				Status:    domain.CondominiumStatus(status),
				CreatedAt: createdAt,
				UpdatedAt: updatedAt,
			}
			if landArea.Valid {
				condo.LandArea = &landArea.Float64
			}
			if latitude.Valid {
				condo.Address.Latitude = latitude.Float64
			}
			if longitude.Valid {
				condo.Address.Longitude = longitude.Float64
			}

			condosByID[condoID] = &condo
			orderedIDs = append(orderedIDs, condoID)
			existing = &condo
		}

		if cnpjID.Valid {
			cnpj := domain.CondominiumCNPJ{ID: cnpjID.Int64}
			if cnpjCondoID.Valid {
				cnpj.CondominiumID = cnpjCondoID.Int64
			}
			if cnpjValue.Valid {
				cnpj.CNPJ = cnpjValue.String
			}
			if razaoSocial.Valid {
				cnpj.RazaoSocial = razaoSocial.String
			}
			if descricao.Valid {
				cnpj.Descricao = descricao.String
			}
			if principal.Valid {
				cnpj.Principal = principal.Bool
			}
			if ativo.Valid {
				cnpj.Ativo = ativo.Bool
			}
			if dataInicio.Valid {
				v := dataInicio.Time
				cnpj.DataInicio = &v
			}
			if dataFim.Valid {
				v := dataFim.Time
				cnpj.DataFim = &v
			}
			if cnpjCreatedAt.Valid {
				cnpj.CreatedAt = cnpjCreatedAt.Time
			}

			existing.CNPJs = append(existing.CNPJs, cnpj)
		}
	}

	if err := rows.Err(); err != nil {
		return nil, fmt.Errorf("failed to iterate condominiums by person: %w", err)
	}

	condos := make([]domain.Condominium, 0, len(orderedIDs))
	for _, id := range orderedIDs {
		condos = append(condos, *condosByID[id])
	}

	return condos, nil
}

func (r *CondominiumRepository) FindIDByCode(ctx context.Context, code string) (int64, error) {
	id, err := r.queries.FindCondominiumIDByCode(ctx, code)
	if err != nil {
		if errors.Is(err, sql.ErrNoRows) {
			return 0, domain.ErrCondominiumNotFound
		}
		return 0, fmt.Errorf("failed to find condominium by code: %w", err)
	}

	return id, nil
}

func (r *CondominiumRepository) GetByID(ctx context.Context, id int64) (*domain.Condominium, error) {
	condoRow, err := r.queries.GetCondominiumByID(ctx, id)
	if err != nil {
		if errors.Is(err, sql.ErrNoRows) {
			return nil, domain.ErrCondominiumNotFound
		}
		return nil, fmt.Errorf("failed to query condominium: %w", err)
	}
	condo := mapSQLCCondominium(condoRow)

	condo.CNPJs, err = r.listCNPJsByCondominiumID(ctx, condo.ID)
	if err != nil {
		return nil, err
	}

	return &condo, nil
}

func mapSQLCCondominium(condo sqlcgen.Condominium) domain.Condominium {
	mapped := domain.Condominium{
		ID:        condo.ID,
		Code:      condo.Code,
		Name:      condo.Name,
		Phone:     condo.Phone,
		Email:     condo.Email,
		FeeRule:   domain.FeeRule(condo.FeeRule),
		BuiltArea: condo.BuiltAreaSum,
		Address: vo.Address{
			Street:       condo.Street,
			Number:       condo.Number,
			Neighborhood: condo.Neighborhood,
			City:         condo.City,
			State:        condo.State,
			ZipCode:      condo.ZipCode,
		},
		Status:    domain.CondominiumStatus(condo.Status),
		CreatedAt: condo.CreatedAt,
		UpdatedAt: condo.UpdatedAt,
	}
	if condo.LandArea.Valid {
		mapped.LandArea = &condo.LandArea.Float64
	}
	if condo.Latitude.Valid {
		mapped.Address.Latitude = condo.Latitude.Float64
	}
	if condo.Longitude.Valid {
		mapped.Address.Longitude = condo.Longitude.Float64
	}
	return mapped
}

func mapListCondominiumRow(row sqlcgen.ListCondominiumsWithCNPJsRow) (domain.Condominium, domain.CondominiumCNPJ, bool) {
	condo := domain.Condominium{
		ID:        row.ID,
		Code:      row.Code,
		Name:      row.Name,
		Phone:     row.Phone,
		Email:     row.Email,
		FeeRule:   domain.FeeRule(row.FeeRule),
		BuiltArea: row.BuiltAreaSum,
		Address: vo.Address{
			Street:       row.Street,
			Number:       row.Number,
			Neighborhood: row.Neighborhood,
			City:         row.City,
			State:        row.State,
			ZipCode:      row.ZipCode,
		},
		Status:    domain.CondominiumStatus(row.Status),
		CreatedAt: row.CreatedAt,
		UpdatedAt: row.UpdatedAt,
	}
	if row.LandArea.Valid {
		condo.LandArea = &row.LandArea.Float64
	}
	if row.Latitude.Valid {
		condo.Address.Latitude = row.Latitude.Float64
	}
	if row.Longitude.Valid {
		condo.Address.Longitude = row.Longitude.Float64
	}

	if !row.ID_2.Valid {
		return condo, domain.CondominiumCNPJ{}, false
	}

	cnpj := domain.CondominiumCNPJ{ID: row.ID_2.Int64}
	if row.CondominiumID.Valid {
		cnpj.CondominiumID = row.CondominiumID.Int64
	}
	if row.Cnpj.Valid {
		cnpj.CNPJ = row.Cnpj.String
	}
	if row.RazaoSocial.Valid {
		cnpj.RazaoSocial = row.RazaoSocial.String
	}
	if row.Descricao.Valid {
		cnpj.Descricao = row.Descricao.String
	}
	if row.Principal.Valid {
		cnpj.Principal = row.Principal.Bool
	}
	if row.Ativo.Valid {
		cnpj.Ativo = row.Ativo.Bool
	}
	if row.DataInicio.Valid {
		cnpj.DataInicio = &row.DataInicio.Time
	}
	if row.DataFim.Valid {
		cnpj.DataFim = &row.DataFim.Time
	}
	if row.CreatedAt_2.Valid {
		cnpj.CreatedAt = row.CreatedAt_2.Time
	}

	return condo, cnpj, true
}

func (r *CondominiumRepository) listCNPJsByCondominiumID(ctx context.Context, condominiumID int64) ([]domain.CondominiumCNPJ, error) {
	rows, err := r.queries.ListCondominiumCNPJsByCondominiumID(ctx, condominiumID)
	if err != nil {
		return nil, fmt.Errorf("failed to query condominium cnpjs: %w", err)
	}

	cnpjs := make([]domain.CondominiumCNPJ, 0, len(rows))
	for _, row := range rows {
		cnpjs = append(cnpjs, mapSQLCCondominiumCNPJ(row))
	}

	return cnpjs, nil
}

func mapSQLCCondominiumCNPJ(cnpj sqlcgen.CondominiumCnpj) domain.CondominiumCNPJ {
	mapped := domain.CondominiumCNPJ{
		ID:            cnpj.ID,
		CondominiumID: cnpj.CondominiumID,
		CNPJ:          cnpj.Cnpj,
		RazaoSocial:   cnpj.RazaoSocial,
		Descricao:     cnpj.Descricao,
		Principal:     cnpj.Principal,
		Ativo:         cnpj.Ativo,
		CreatedAt:     cnpj.CreatedAt,
	}
	if cnpj.DataInicio.Valid {
		mapped.DataInicio = &cnpj.DataInicio.Time
	}
	if cnpj.DataFim.Valid {
		mapped.DataFim = &cnpj.DataFim.Time
	}
	return mapped
}

func (r *CondominiumRepository) ExistsByCode(ctx context.Context, code string) (bool, error) {
	exists, err := r.queries.ExistsByCode(ctx, code)
	if err != nil {
		return false, fmt.Errorf("failed to check code existence: %w", err)
	}
	return exists, nil
}

func (r *CondominiumRepository) ExistsByCNPJ(ctx context.Context, cnpj string) (bool, error) {
	exists, err := r.queries.ExistsByCNPJ(ctx, cnpj)
	if err != nil {
		return false, fmt.Errorf("failed to check CNPJ existence: %w", err)
	}
	return exists, nil
}

func (r *CondominiumRepository) UpdateFeeRule(ctx context.Context, condominiumID int64, feeRule domain.FeeRule) error {
	if err := r.queries.UpdateCondominiumFeeRule(ctx, sqlcgen.UpdateCondominiumFeeRuleParams{
		ID:      condominiumID,
		FeeRule: string(feeRule),
	}); err != nil {
		return fmt.Errorf("failed to update condominium fee rule: %w", err)
	}
	return nil
}

func (r *CondominiumRepository) UpdateLandArea(ctx context.Context, condominiumID int64, landArea *float64) error {
	tx, err := r.db.BeginTx(ctx, nil)
	if err != nil {
		return fmt.Errorf("failed to begin transaction: %w", err)
	}
	defer tx.Rollback()

	qtx := r.queries.WithTx(tx)
	if err := qtx.UpdateCondominiumLandArea(ctx, sqlcgen.UpdateCondominiumLandAreaParams{
		ID:       condominiumID,
		LandArea: toNullFloat64(landArea),
	}); err != nil {
		return fmt.Errorf("failed to update condominium land area: %w", err)
	}

	if err := recalculateIdealFractionsWithQueries(ctx, qtx, condominiumID); err != nil {
		return err
	}

	if err := tx.Commit(); err != nil {
		return fmt.Errorf("failed to commit condominium land area update: %w", err)
	}

	return nil
}

func toNullTime(t *time.Time) sql.NullTime {
	if t == nil {
		return sql.NullTime{}
	}
	return sql.NullTime{Time: *t, Valid: true}
}

func toNullFloat64(f *float64) sql.NullFloat64 {
	if f == nil {
		return sql.NullFloat64{}
	}
	return sql.NullFloat64{Float64: *f, Valid: true}
}
