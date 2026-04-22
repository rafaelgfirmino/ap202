-- +goose Up
CREATE EXTENSION IF NOT EXISTS pgcrypto;

CREATE TABLE IF NOT EXISTS permissions (
    id UUID PRIMARY KEY,
    microservice TEXT NOT NULL,
    resource TEXT NOT NULL,
    action TEXT NOT NULL,
    name TEXT NOT NULL,
    description TEXT NOT NULL DEFAULT '',
    conditions JSONB NOT NULL DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ NOT NULL,
    updated_at TIMESTAMPTZ NOT NULL
);

CREATE UNIQUE INDEX IF NOT EXISTS permissions_microservice_resource_action_uidx
    ON permissions (microservice, resource, action);

CREATE UNIQUE INDEX IF NOT EXISTS permissions_name_uidx
    ON permissions (name);

-- +goose Down
DROP TABLE IF EXISTS permissions;
