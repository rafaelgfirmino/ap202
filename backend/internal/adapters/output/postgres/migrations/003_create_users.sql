-- +goose Up
CREATE TABLE IF NOT EXISTS users (
    id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    external_auth_id VARCHAR(50) NOT NULL,
    first_name VARCHAR(100) NOT NULL DEFAULT '',
    last_name VARCHAR(100) NOT NULL DEFAULT '',
    name VARCHAR(200) NOT NULL,
    email VARCHAR(254) NOT NULL,
    criado_em TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    atualizado_em TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_users_external_auth_id ON users (external_auth_id);
CREATE UNIQUE INDEX IF NOT EXISTS idx_users_email ON users (email);

-- +goose StatementBegin
CREATE OR REPLACE FUNCTION fn_set_atualizado_em()
RETURNS TRIGGER AS $$
BEGIN
    NEW.atualizado_em = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;
-- +goose StatementEnd

CREATE OR REPLACE TRIGGER trg_users_atualizado_em
    BEFORE UPDATE ON users
    FOR EACH ROW EXECUTE FUNCTION fn_set_atualizado_em();

-- +goose Down
DROP TRIGGER IF EXISTS trg_users_atualizado_em ON users;
DROP FUNCTION IF EXISTS fn_set_atualizado_em();
DROP INDEX IF EXISTS idx_users_email;
DROP INDEX IF EXISTS idx_users_external_auth_id;
DROP TABLE IF EXISTS users;
