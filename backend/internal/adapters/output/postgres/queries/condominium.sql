-- name: CreateCondominium :one
INSERT INTO condominiums (code, name, phone, email, land_area, street, number, neighborhood, city, state, zip_code, latitude, longitude, status, created_at, updated_at)
VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16)
RETURNING id;

-- name: ExistsByCode :one
SELECT EXISTS(SELECT 1 FROM condominiums WHERE code = $1);

-- name: ListCondominiumsWithCNPJs :many
SELECT c.id, c.code, c.name, c.phone, c.email, c.fee_rule, c.land_area, c.built_area_sum, c.street, c.number, c.neighborhood, c.city, c.state, c.zip_code, c.latitude, c.longitude, c.status, c.created_at, c.updated_at,
       cc.id, cc.condominium_id, cc.cnpj, cc.razao_social, cc.descricao, cc.principal, cc.ativo, cc.data_inicio, cc.data_fim, cc.created_at
FROM condominiums c
LEFT JOIN condominium_cnpjs cc ON cc.condominium_id = c.id
ORDER BY c.id ASC, cc.id ASC;

-- name: CreateCondominiumCNPJ :one
INSERT INTO condominium_cnpjs (condominium_id, cnpj, razao_social, descricao, principal, ativo, data_inicio, data_fim)
VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
RETURNING id;

-- name: CreateAssociation :exec
INSERT INTO association (person_id, condominium_id, unit_id, role, active, start_date, end_date, created_at)
VALUES ($1, $2, $3, $4, $5, $6, $7, $8);

-- name: ExistsByCNPJ :one
SELECT EXISTS(SELECT 1 FROM condominium_cnpjs WHERE cnpj = $1);

-- name: FindCondominiumIDByCode :one
SELECT id
FROM condominiums
WHERE code = $1;

-- name: GetCondominiumByID :one
SELECT id, code, name, phone, email, fee_rule, land_area, built_area_sum, street, number, neighborhood, city, state, zip_code, latitude, longitude, status, created_at, updated_at
FROM condominiums
WHERE id = $1;

-- name: UpdateCondominiumFeeRule :exec
UPDATE condominiums
SET fee_rule = $2,
    updated_at = NOW()
WHERE id = $1;

-- name: UpdateCondominiumLandArea :exec
UPDATE condominiums
SET land_area = $2,
    updated_at = NOW()
WHERE id = $1;

-- name: ListCondominiumCNPJsByCondominiumID :many
SELECT id, condominium_id, cnpj, razao_social, descricao, principal, ativo, data_inicio, data_fim, created_at
FROM condominium_cnpjs
WHERE condominium_id = $1
ORDER BY id ASC;

-- name: HasActiveManagerAssociation :one
SELECT EXISTS (
    SELECT 1
    FROM association
    WHERE person_id = $1
      AND condominium_id = $2
      AND role = 'manager'
      AND active = TRUE
);
