-- Insert default roles
INSERT INTO roles (name, description, permissions) VALUES
(
    'admin',
    'Administrator with full access',
    '{
        "organizations": ["create", "read", "update", "delete"],
        "properties": ["create", "read", "update", "delete"],
        "tenants": ["create", "read", "update", "delete"],
        "leases": ["create", "read", "update", "delete"],
        "documents": ["create", "read", "update", "delete"],
        "conversations": ["create", "read", "update", "delete"],
        "users": ["create", "read", "update", "delete"]
    }'::jsonb
),
(
    'user',
    'Standard user with read and limited write access',
    '{
        "organizations": ["read"],
        "properties": ["read"],
        "tenants": ["read"],
        "leases": ["read"],
        "documents": ["create", "read"],
        "conversations": ["create", "read", "update", "delete"]
    }'::jsonb
);
