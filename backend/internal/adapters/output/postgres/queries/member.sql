-- name: CreateBond :one
INSERT INTO association (person_id, condominium_id, unit_id, role, active, start_date, end_date, created_at)
VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
RETURNING id;

-- name: DeactivateBond :execrows
UPDATE association
SET active = FALSE,
    end_date = $4
WHERE id = $1
  AND condominium_id = $2
  AND unit_id = $3
  AND active = TRUE;

-- name: ListMembersByUnitID :many
SELECT a.id, a.person_id, a.unit_id, u.name, u.email, a.role, a.active, a.start_date, a.end_date, a.created_at
FROM association a
JOIN users u ON u.id = a.person_id
WHERE a.unit_id = $1
ORDER BY a.id ASC;
