CREATE TABLE IF NOT EXISTS condominiums (
    id BIGSERIAL PRIMARY KEY,
    code CHAR(7) NOT NULL UNIQUE,
    name VARCHAR(255) NOT NULL,
    phone VARCHAR(20) NOT NULL,
    email VARCHAR(255) NOT NULL,
    fee_rule VARCHAR(20) NOT NULL DEFAULT 'equal' CHECK (fee_rule IN ('equal', 'proportional')),
    land_area DOUBLE PRECISION,
    built_area_sum DOUBLE PRECISION NOT NULL DEFAULT 0,
    street VARCHAR(255) NOT NULL,
    number VARCHAR(20) NOT NULL,
    neighborhood VARCHAR(255) NOT NULL,
    city VARCHAR(255) NOT NULL,
    state VARCHAR(2) NOT NULL,
    zip_code VARCHAR(10) NOT NULL,
    latitude DOUBLE PRECISION DEFAULT 0,
    longitude DOUBLE PRECISION DEFAULT 0,
    status VARCHAR(20) NOT NULL DEFAULT 'active',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS condominium_cnpjs (
    id BIGSERIAL PRIMARY KEY,
    condominium_id BIGINT NOT NULL REFERENCES condominiums(id) ON DELETE CASCADE,
    cnpj CHAR(14) NOT NULL UNIQUE,
    razao_social VARCHAR(200) NOT NULL DEFAULT '',
    descricao VARCHAR(200) NOT NULL DEFAULT '',
    principal BOOLEAN NOT NULL DEFAULT false,
    ativo BOOLEAN NOT NULL DEFAULT true,
    data_inicio DATE,
    data_fim DATE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS users (
    id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    external_auth_id VARCHAR(50),
    first_name VARCHAR(100) NOT NULL DEFAULT '',
    last_name VARCHAR(100) NOT NULL DEFAULT '',
    name VARCHAR(200) NOT NULL,
    email VARCHAR(254) NOT NULL,
    criado_em TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    atualizado_em TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS association (
    id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    person_id BIGINT NOT NULL REFERENCES users(id),
    condominium_id BIGINT NOT NULL REFERENCES condominiums(id),
    unit_id BIGINT REFERENCES units(id) ON DELETE CASCADE,
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

CREATE TABLE IF NOT EXISTS units (
    id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    condominium_id BIGINT NOT NULL REFERENCES condominiums(id),
    code VARCHAR(50) NOT NULL,
    identifier VARCHAR(20) NOT NULL,
    group_type VARCHAR(20),
    group_name VARCHAR(20),
    floor VARCHAR(10),
    description VARCHAR(200),
    private_area DOUBLE PRECISION,
    ideal_fraction DOUBLE PRECISION,
    active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CHECK (
        (group_type IS NULL AND group_name IS NULL) OR
        (
            group_type IS NOT NULL AND
            group_name IS NOT NULL AND
            group_type IN ('block', 'tower', 'sector', 'court', 'phase')
        )
    )
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_units_code ON units (code);
CREATE UNIQUE INDEX IF NOT EXISTS idx_units_condominium_group_name_identifier ON units (condominium_id, COALESCE(group_name, ''), identifier);
CREATE INDEX IF NOT EXISTS idx_units_condominium ON units (condominium_id);
CREATE UNIQUE INDEX IF NOT EXISTS idx_users_external_auth_id ON users (external_auth_id) WHERE external_auth_id IS NOT NULL;
CREATE UNIQUE INDEX IF NOT EXISTS idx_users_email ON users (email);
CREATE INDEX IF NOT EXISTS idx_association_person ON association (person_id);
CREATE INDEX IF NOT EXISTS idx_association_condominium ON association (condominium_id);
CREATE INDEX IF NOT EXISTS idx_association_unit ON association (unit_id);
CREATE INDEX IF NOT EXISTS idx_association_unit_role_active ON association (unit_id, role, active);
CREATE UNIQUE INDEX IF NOT EXISTS idx_association_active_unique_link ON association (person_id, condominium_id, COALESCE(unit_id, -1), role) WHERE active = TRUE;

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

CREATE TABLE IF NOT EXISTS condominium_unit_groups (
    id BIGSERIAL PRIMARY KEY,
    condominium_id BIGINT NOT NULL REFERENCES condominiums(id) ON DELETE CASCADE,
    group_type VARCHAR(20) NOT NULL CHECK (group_type IN ('block', 'tower', 'sector', 'court', 'phase')),
    name VARCHAR(20) NOT NULL,
    floors INTEGER CHECK (floors IS NULL OR floors >= 0),
    active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE (condominium_id, group_type, name)
);

CREATE INDEX IF NOT EXISTS idx_condominium_unit_groups_condominium_id
    ON condominium_unit_groups (condominium_id);

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
