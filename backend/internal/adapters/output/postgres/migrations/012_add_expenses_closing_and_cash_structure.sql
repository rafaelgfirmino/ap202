-- +goose Up
-- +goose StatementBegin
DROP TABLE IF EXISTS monthly_charges CASCADE;

CREATE TABLE IF NOT EXISTS accounts (
    id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    condominium_id BIGINT NOT NULL REFERENCES condominiums(id),
    name VARCHAR(100) NOT NULL,
    type VARCHAR(20) NOT NULL CHECK (type IN ('checking', 'savings', 'cash', 'reserve_fund')),
    balance NUMERIC(12,2) NOT NULL DEFAULT 0,
    active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE (condominium_id, type)
);

CREATE TABLE IF NOT EXISTS cash_entries (
    id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    condominium_id BIGINT NOT NULL REFERENCES condominiums(id),
    account_id BIGINT NOT NULL REFERENCES accounts(id),
    type VARCHAR(20) NOT NULL CHECK (type IN ('income', 'expense')),
    amount NUMERIC(12,2) NOT NULL CHECK (amount > 0),
    description VARCHAR(300) NOT NULL,
    entry_date DATE NOT NULL,
    reference_month DATE NOT NULL,
    origin VARCHAR(30) NOT NULL CHECK (origin IN ('expense', 'unit_payment', 'extra_income', 'reserve_fund', 'bank_import', 'manual')),
    origin_id BIGINT,
    created_by BIGINT NOT NULL REFERENCES users(id),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_cash_entries_condominium_month ON cash_entries (condominium_id, reference_month);

CREATE TABLE IF NOT EXISTS expenses (
    id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    condominium_id BIGINT NOT NULL REFERENCES condominiums(id),
    group_id BIGINT REFERENCES condominium_unit_groups(id),
    unit_id BIGINT REFERENCES units(id),
    scope VARCHAR(20) NOT NULL CHECK (scope IN ('general', 'group', 'unit')),
    type VARCHAR(20) NOT NULL CHECK (type IN ('expense', 'extra_income')),
    category VARCHAR(50) NOT NULL,
    description VARCHAR(300) NOT NULL,
    amount NUMERIC(12,2) NOT NULL CHECK (amount > 0),
    expense_date DATE NOT NULL,
    reference_month DATE NOT NULL,
    receipt_url VARCHAR(500),
    reversed BOOLEAN NOT NULL DEFAULT FALSE,
    reversal_of_id BIGINT REFERENCES expenses(id),
    created_by BIGINT NOT NULL REFERENCES users(id),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_expenses_condominium_month ON expenses (condominium_id, reference_month);

CREATE TABLE IF NOT EXISTS reserve_fund_settings (
    id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    condominium_id BIGINT NOT NULL REFERENCES condominiums(id) UNIQUE,
    mode VARCHAR(10) NOT NULL CHECK (mode IN ('percent', 'fixed')),
    value NUMERIC(10,2) NOT NULL CHECK (value > 0),
    active BOOLEAN NOT NULL DEFAULT TRUE,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS monthly_closings (
    id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    condominium_id BIGINT NOT NULL REFERENCES condominiums(id),
    reference_month DATE NOT NULL,
    total_expenses NUMERIC(12,2) NOT NULL DEFAULT 0,
    total_extra_income NUMERIC(12,2) NOT NULL DEFAULT 0,
    reserve_fund_total NUMERIC(12,2) NOT NULL DEFAULT 0,
    fee_rule VARCHAR(20) NOT NULL,
    status VARCHAR(20) NOT NULL DEFAULT 'open' CHECK (status IN ('open', 'closed')),
    closed_by BIGINT REFERENCES users(id),
    closed_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE (condominium_id, reference_month)
);

-- Keeping the existing charge unit table intact; this table stores monthly closing allocations.
CREATE TABLE IF NOT EXISTS monthly_unit_charges (
    id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    monthly_closing_id BIGINT NOT NULL REFERENCES monthly_closings(id) ON DELETE CASCADE,
    unit_id BIGINT NOT NULL REFERENCES units(id),
    general_share NUMERIC(10,2) NOT NULL DEFAULT 0,
    group_share NUMERIC(10,2) NOT NULL DEFAULT 0,
    direct_charge NUMERIC(10,2) NOT NULL DEFAULT 0,
    reserve_fund_share NUMERIC(10,2) NOT NULL DEFAULT 0,
    total_amount NUMERIC(10,2) NOT NULL,
    status VARCHAR(20) NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'partial', 'paid')),
    paid_amount NUMERIC(10,2) NOT NULL DEFAULT 0,
    paid_at DATE,
    boleto_generated BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE (monthly_closing_id, unit_id)
);
-- +goose StatementEnd

-- +goose Down
-- +goose StatementBegin
DROP TABLE IF EXISTS monthly_unit_charges CASCADE;
DROP TABLE IF EXISTS monthly_closings CASCADE;
DROP TABLE IF EXISTS reserve_fund_settings CASCADE;
DROP TABLE IF EXISTS expenses CASCADE;
DROP TABLE IF EXISTS cash_entries CASCADE;
DROP TABLE IF EXISTS accounts CASCADE;
-- +goose StatementEnd
