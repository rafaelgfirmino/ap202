-- +goose Up
CREATE TABLE IF NOT EXISTS units (
    id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    condominium_id BIGINT NOT NULL REFERENCES condominiums(id),
    code VARCHAR(50) NOT NULL,
    identifier VARCHAR(20) NOT NULL,
    group_type VARCHAR(20),
    group_name VARCHAR(20),
    floor VARCHAR(10),
    description VARCHAR(200),
    active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CHECK (
        (group_type IS NULL AND group_name IS NULL) OR
        (
            group_type IS NOT NULL AND
            group_name IS NOT NULL AND
            group_type IN ('block', 'tower', 'sector', 'court')
        )
    )
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_units_code ON units (code);
CREATE UNIQUE INDEX IF NOT EXISTS idx_units_condominium_group_name_identifier ON units (condominium_id, COALESCE(group_name, ''), identifier);
CREATE INDEX IF NOT EXISTS idx_units_condominium ON units (condominium_id);

-- +goose Down
DROP INDEX IF EXISTS idx_units_condominium;
DROP INDEX IF EXISTS idx_units_condominium_group_name_identifier;
DROP INDEX IF EXISTS idx_units_code;
DROP TABLE IF EXISTS units;
