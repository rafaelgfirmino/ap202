-- +goose Up
ALTER TABLE condominium_cnpjs
    ADD COLUMN razao_social VARCHAR(200) NOT NULL DEFAULT '',
    ADD COLUMN descricao VARCHAR(200) NOT NULL DEFAULT '',
    ADD COLUMN principal BOOLEAN NOT NULL DEFAULT false,
    ADD COLUMN ativo BOOLEAN NOT NULL DEFAULT true,
    ADD COLUMN data_inicio DATE,
    ADD COLUMN data_fim DATE;

CREATE UNIQUE INDEX idx_condominium_cnpjs_principal_ativo
    ON condominium_cnpjs (condominium_id)
    WHERE principal = true AND ativo = true;

-- +goose Down
DROP INDEX IF EXISTS idx_condominium_cnpjs_principal_ativo;

ALTER TABLE condominium_cnpjs
    DROP COLUMN IF EXISTS razao_social,
    DROP COLUMN IF EXISTS descricao,
    DROP COLUMN IF EXISTS principal,
    DROP COLUMN IF EXISTS ativo,
    DROP COLUMN IF EXISTS data_inicio,
    DROP COLUMN IF EXISTS data_fim;
