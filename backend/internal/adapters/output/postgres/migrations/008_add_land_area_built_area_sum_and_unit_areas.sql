-- +goose Up
ALTER TABLE condominiums
    ADD COLUMN IF NOT EXISTS land_area DOUBLE PRECISION,
    ADD COLUMN IF NOT EXISTS built_area_sum DOUBLE PRECISION NOT NULL DEFAULT 0;

ALTER TABLE units
    ADD COLUMN IF NOT EXISTS private_area DOUBLE PRECISION,
    ADD COLUMN IF NOT EXISTS ideal_fraction DOUBLE PRECISION;

-- +goose Down
ALTER TABLE units
    DROP COLUMN IF EXISTS ideal_fraction,
    DROP COLUMN IF EXISTS private_area;

ALTER TABLE condominiums
    DROP COLUMN IF EXISTS built_area_sum,
    DROP COLUMN IF EXISTS land_area;
