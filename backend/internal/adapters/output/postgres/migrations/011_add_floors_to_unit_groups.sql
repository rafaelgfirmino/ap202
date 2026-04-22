-- +goose Up
ALTER TABLE condominium_unit_groups
    ADD COLUMN IF NOT EXISTS floors INTEGER;

ALTER TABLE condominium_unit_groups
    DROP CONSTRAINT IF EXISTS condominium_unit_groups_floors_check;

ALTER TABLE condominium_unit_groups
    ADD CONSTRAINT condominium_unit_groups_floors_check
    CHECK (floors IS NULL OR floors >= 0);

-- +goose Down
ALTER TABLE condominium_unit_groups
    DROP CONSTRAINT IF EXISTS condominium_unit_groups_floors_check;

ALTER TABLE condominium_unit_groups
    DROP COLUMN IF EXISTS floors;
