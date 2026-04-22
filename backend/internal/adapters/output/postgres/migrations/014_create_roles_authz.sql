-- +goose Up
CREATE TABLE IF NOT EXISTS roles (
    id UUID PRIMARY KEY,
    tenant_id BIGINT NULL,
    template_id UUID NULL REFERENCES roles(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    description TEXT NOT NULL DEFAULT '',
    scope TEXT NOT NULL,
    created_at TIMESTAMPTZ NOT NULL,
    updated_at TIMESTAMPTZ NOT NULL,
    CONSTRAINT roles_scope_consistency_chk CHECK (
        (tenant_id IS NULL AND scope = 'global') OR
        (tenant_id IS NOT NULL AND scope = 'tenant')
    ),
    CONSTRAINT roles_template_consistency_chk CHECK (
        (tenant_id IS NULL AND template_id IS NULL) OR
        (tenant_id IS NOT NULL AND template_id IS NOT NULL)
    )
);

CREATE UNIQUE INDEX IF NOT EXISTS roles_global_name_uidx
    ON roles (name)
    WHERE tenant_id IS NULL;

CREATE UNIQUE INDEX IF NOT EXISTS roles_tenant_name_uidx
    ON roles (tenant_id, name)
    WHERE tenant_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS roles_template_id_idx
    ON roles (template_id)
    WHERE template_id IS NOT NULL;

-- +goose Down
DROP TABLE IF EXISTS roles;
