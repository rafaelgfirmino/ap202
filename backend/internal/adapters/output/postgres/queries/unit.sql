-- name: CreateUnit :one
INSERT INTO units (condominium_id, code, identifier, group_type, group_name, floor, description, private_area, active, created_at, updated_at)
VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
RETURNING id;

-- name: ListUnitsByCondominiumID :many
SELECT id, condominium_id, code, identifier, group_type, group_name, floor, description, private_area, ideal_fraction, active, created_at, updated_at
FROM units
WHERE condominium_id = $1
ORDER BY id ASC;

-- name: GetUnitByIDAndCondominiumID :one
SELECT id, condominium_id, code, identifier, group_type, group_name, floor, description, private_area, ideal_fraction, active, created_at, updated_at
FROM units
WHERE id = $1 AND condominium_id = $2;

-- name: GetUnitByGroupNameAndIdentifier :one
SELECT id, condominium_id, code, identifier, group_type, group_name, floor, description, private_area, ideal_fraction, active, created_at, updated_at
FROM units
WHERE condominium_id = $1
  AND COALESCE(group_name, '') = COALESCE($2, '')
  AND identifier = $3;

-- name: UnitBelongsToCondominium :one
SELECT EXISTS(
    SELECT 1
    FROM units
    WHERE id = $1 AND condominium_id = $2
);

-- name: ExistsUnitByGroupNameAndIdentifier :one
SELECT EXISTS(
    SELECT 1
    FROM units
    WHERE condominium_id = $1
      AND COALESCE(group_name, '') = COALESCE($2, '')
      AND identifier = $3
);

-- name: GetCondominiumAreasForUnitCalc :one
SELECT land_area, built_area_sum
FROM condominiums
WHERE id = $1;

-- name: UpdateCondominiumBuiltAreaSumDelta :exec
UPDATE condominiums
SET built_area_sum = built_area_sum + $2
WHERE id = $1;

-- name: ListActiveUnitsForIdealFractionRecalc :many
SELECT id, private_area
FROM units
WHERE condominium_id = $1 AND active = TRUE
ORDER BY id ASC;

-- name: UpdateUnitIdealFraction :exec
UPDATE units
SET ideal_fraction = $2
WHERE id = $1;

-- name: ClearIdealFractionForActiveUnits :exec
UPDATE units
SET ideal_fraction = NULL
WHERE condominium_id = $1 AND active = TRUE;

-- name: UpdateUnitPrivateArea :exec
UPDATE units
SET private_area = $2,
    updated_at = $3
WHERE id = $1;
