-- name: GetUserByExternalAuthID :one
SELECT id, external_auth_id, first_name, last_name, name, email, criado_em, atualizado_em
FROM users
WHERE external_auth_id = $1;

-- name: GetUserByEmail :one
SELECT id, external_auth_id, first_name, last_name, name, email, criado_em, atualizado_em
FROM users
WHERE email = $1;

-- name: GetUserByID :one
SELECT id, external_auth_id, first_name, last_name, name, email, criado_em, atualizado_em
FROM users
WHERE id = $1;

-- name: CreateUser :one
INSERT INTO users (external_auth_id, first_name, last_name, name, email, criado_em, atualizado_em)
VALUES ($1, $2, $3, $4, $5, $6, $7)
RETURNING id;

-- name: UpdateUserIdentity :exec
UPDATE users
SET external_auth_id = $2,
    first_name = $3,
    last_name = $4,
    name = $5,
    email = $6,
    atualizado_em = $7
WHERE id = $1;
