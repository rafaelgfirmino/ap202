-- +goose Up
ALTER TABLE users
    ALTER COLUMN external_auth_id DROP NOT NULL;

DROP INDEX IF EXISTS idx_users_external_auth_id;
CREATE UNIQUE INDEX idx_users_external_auth_id ON users (external_auth_id) WHERE external_auth_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_association_unit_role_active ON association (unit_id, role, active);

-- +goose Down
DROP INDEX IF EXISTS idx_association_unit_role_active;
DROP INDEX IF EXISTS idx_users_external_auth_id;
CREATE UNIQUE INDEX idx_users_external_auth_id ON users (external_auth_id);
ALTER TABLE users
    ALTER COLUMN external_auth_id SET NOT NULL;
