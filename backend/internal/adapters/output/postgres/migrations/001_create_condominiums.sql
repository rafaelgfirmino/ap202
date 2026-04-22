-- +goose Up
CREATE TABLE IF NOT EXISTS condominiums (
    id BIGSERIAL PRIMARY KEY,
    code CHAR(7) NOT NULL UNIQUE,
    name VARCHAR(255) NOT NULL,
    phone VARCHAR(20) NOT NULL,
    email VARCHAR(255) NOT NULL,
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
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_condominiums_code ON condominiums(code);
CREATE INDEX idx_condominium_cnpjs_condominium_id ON condominium_cnpjs(condominium_id);
CREATE INDEX idx_condominium_cnpjs_cnpj ON condominium_cnpjs(cnpj);

-- +goose Down
DROP TABLE IF EXISTS condominium_cnpjs;
DROP TABLE IF EXISTS condominiums;
