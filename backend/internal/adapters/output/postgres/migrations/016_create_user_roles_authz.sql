-- +goose Up
CREATE TABLE IF NOT EXISTS user_roles (
    id UUID PRIMARY KEY,
    user_id BIGINT NOT NULL,
    role_id UUID NOT NULL REFERENCES roles(id) ON DELETE CASCADE,
    tenant_id BIGINT NOT NULL,
    attributes JSONB NOT NULL DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ NOT NULL
);

CREATE UNIQUE INDEX IF NOT EXISTS user_roles_user_role_tenant_uidx
    ON user_roles (user_id, role_id, tenant_id);

CREATE INDEX IF NOT EXISTS user_roles_user_id_idx
    ON user_roles (user_id);

-- +goose Down
DROP TABLE IF EXISTS user_roles;
