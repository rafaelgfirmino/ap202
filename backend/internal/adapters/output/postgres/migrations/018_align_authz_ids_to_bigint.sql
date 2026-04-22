-- +goose Up
-- +goose StatementBegin
DO $$
DECLARE
    roles_tenant_type text;
    user_roles_user_type text;
    user_roles_tenant_type text;
    roles_has_data boolean;
    user_roles_has_data boolean;
BEGIN
    SELECT data_type
      INTO roles_tenant_type
      FROM information_schema.columns
     WHERE table_name = 'roles'
       AND column_name = 'tenant_id';

    IF roles_tenant_type = 'uuid' THEN
        SELECT EXISTS (
            SELECT 1
              FROM roles
             WHERE tenant_id IS NOT NULL
        ) INTO roles_has_data;

        IF roles_has_data THEN
            RAISE EXCEPTION 'Cannot auto-convert roles.tenant_id from UUID to BIGINT while data exists';
        END IF;

        ALTER TABLE roles
            ALTER COLUMN tenant_id TYPE BIGINT USING NULL;
    END IF;

    SELECT data_type
      INTO user_roles_user_type
      FROM information_schema.columns
     WHERE table_name = 'user_roles'
       AND column_name = 'user_id';

    SELECT data_type
      INTO user_roles_tenant_type
      FROM information_schema.columns
     WHERE table_name = 'user_roles'
       AND column_name = 'tenant_id';

    IF user_roles_user_type = 'uuid' OR user_roles_tenant_type = 'uuid' THEN
        SELECT EXISTS (
            SELECT 1
              FROM user_roles
        ) INTO user_roles_has_data;

        IF user_roles_has_data THEN
            RAISE EXCEPTION 'Cannot auto-convert user_roles.user_id/tenant_id from UUID to BIGINT while data exists';
        END IF;

        IF user_roles_user_type = 'uuid' THEN
            ALTER TABLE user_roles
                ALTER COLUMN user_id TYPE BIGINT USING NULL;
        END IF;

        IF user_roles_tenant_type = 'uuid' THEN
            ALTER TABLE user_roles
                ALTER COLUMN tenant_id TYPE BIGINT USING NULL;
        END IF;
    END IF;
END $$;
-- +goose StatementEnd

-- +goose Down
-- +goose StatementBegin
DO $$
DECLARE
    roles_tenant_type text;
    user_roles_user_type text;
    user_roles_tenant_type text;
BEGIN
    SELECT data_type
      INTO roles_tenant_type
      FROM information_schema.columns
     WHERE table_name = 'roles'
       AND column_name = 'tenant_id';

    IF roles_tenant_type = 'bigint' THEN
        ALTER TABLE roles
            ALTER COLUMN tenant_id TYPE UUID USING NULL;
    END IF;

    SELECT data_type
      INTO user_roles_user_type
      FROM information_schema.columns
     WHERE table_name = 'user_roles'
       AND column_name = 'user_id';

    SELECT data_type
      INTO user_roles_tenant_type
      FROM information_schema.columns
     WHERE table_name = 'user_roles'
       AND column_name = 'tenant_id';

    IF user_roles_user_type = 'bigint' THEN
        ALTER TABLE user_roles
            ALTER COLUMN user_id TYPE UUID USING NULL;
    END IF;

    IF user_roles_tenant_type = 'bigint' THEN
        ALTER TABLE user_roles
            ALTER COLUMN tenant_id TYPE UUID USING NULL;
    END IF;
END $$;
-- +goose StatementEnd
