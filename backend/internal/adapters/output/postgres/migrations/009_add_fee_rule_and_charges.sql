-- +goose Up
ALTER TABLE condominiums
    ADD COLUMN IF NOT EXISTS fee_rule VARCHAR(20) NOT NULL DEFAULT 'equal';

ALTER TABLE condominiums
    DROP CONSTRAINT IF EXISTS condominiums_fee_rule_check;

ALTER TABLE condominiums
    ADD CONSTRAINT condominiums_fee_rule_check
    CHECK (fee_rule IN ('equal', 'proportional'));

CREATE TABLE IF NOT EXISTS charges (
    id BIGSERIAL PRIMARY KEY,
    condominium_id BIGINT NOT NULL REFERENCES condominiums(id) ON DELETE CASCADE,
    description VARCHAR(200) NOT NULL DEFAULT '',
    total_amount_centavos BIGINT NOT NULL CHECK (total_amount_centavos > 0),
    fee_rule_snapshot VARCHAR(20) NOT NULL CHECK (fee_rule_snapshot IN ('equal', 'proportional')),
    created_by BIGINT NOT NULL REFERENCES users(id),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_charges_condominium_id ON charges (condominium_id);
CREATE INDEX IF NOT EXISTS idx_charges_created_by ON charges (created_by);

CREATE TABLE IF NOT EXISTS unit_charges (
    id BIGSERIAL PRIMARY KEY,
    charge_id BIGINT NOT NULL REFERENCES charges(id) ON DELETE CASCADE,
    unit_id BIGINT NOT NULL REFERENCES units(id),
    amount_centavos BIGINT NOT NULL CHECK (amount_centavos >= 0),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE (charge_id, unit_id)
);

CREATE INDEX IF NOT EXISTS idx_unit_charges_charge_id ON unit_charges (charge_id);
CREATE INDEX IF NOT EXISTS idx_unit_charges_unit_id ON unit_charges (unit_id);

-- +goose Down
DROP TABLE IF EXISTS unit_charges;
DROP TABLE IF EXISTS charges;

ALTER TABLE condominiums
    DROP CONSTRAINT IF EXISTS condominiums_fee_rule_check;

ALTER TABLE condominiums
    DROP COLUMN IF EXISTS fee_rule;
