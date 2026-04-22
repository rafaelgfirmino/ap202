-- +goose Up
CREATE TABLE IF NOT EXISTS pending_role_permissions (
    permission_name TEXT NOT NULL,
    role_name TEXT NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    PRIMARY KEY (permission_name, role_name)
);

-- +goose Down
DROP TABLE IF EXISTS pending_role_permissions;
