-- +goose Up
CREATE TABLE IF NOT EXISTS condominium_unit_groups (
    id BIGSERIAL PRIMARY KEY,
    condominium_id BIGINT NOT NULL REFERENCES condominiums(id) ON DELETE CASCADE,
    group_type VARCHAR(20) NOT NULL CHECK (group_type IN ('block', 'tower', 'sector', 'court', 'phase')),
    name VARCHAR(20) NOT NULL,
    active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE (condominium_id, group_type, name)
);

CREATE INDEX IF NOT EXISTS idx_condominium_unit_groups_condominium_id
    ON condominium_unit_groups (condominium_id);

-- +goose Down
DROP INDEX IF EXISTS idx_condominium_unit_groups_condominium_id;
DROP TABLE IF EXISTS condominium_unit_groups;
