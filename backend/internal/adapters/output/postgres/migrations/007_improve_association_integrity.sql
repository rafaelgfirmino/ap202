-- +goose Up
ALTER TABLE association
    DROP CONSTRAINT IF EXISTS association_unit_id_fkey,
    ADD CONSTRAINT association_unit_id_fkey FOREIGN KEY (unit_id) REFERENCES units(id) ON DELETE CASCADE;

DROP INDEX IF EXISTS idx_association_active_unique_link;
CREATE UNIQUE INDEX idx_association_active_unique_link
    ON association (person_id, condominium_id, COALESCE(unit_id, -1), role)
    WHERE active = TRUE;

-- +goose Down
DROP INDEX IF EXISTS idx_association_active_unique_link;
ALTER TABLE association
    DROP CONSTRAINT IF EXISTS association_unit_id_fkey;
