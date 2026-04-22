-- +goose Up
CREATE TABLE IF NOT EXISTS association (
    id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    person_id BIGINT NOT NULL REFERENCES users(id),
    condominium_id BIGINT NOT NULL REFERENCES condominiums(id),
    unit_id BIGINT,
    role VARCHAR(30) NOT NULL CHECK (role IN (
        'manager',
        'administrator',
        'owner',
        'tenant'
    )),
    active BOOLEAN NOT NULL DEFAULT TRUE,
    start_date DATE NOT NULL,
    end_date DATE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_association_person ON association (person_id);
CREATE INDEX idx_association_condominium ON association (condominium_id);
CREATE INDEX idx_association_unit ON association (unit_id);

-- +goose Down
DROP INDEX IF EXISTS idx_association_unit;
DROP INDEX IF EXISTS idx_association_condominium;
DROP INDEX IF EXISTS idx_association_person;
DROP TABLE IF EXISTS association;
