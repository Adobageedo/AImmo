-- Enable Row Level Security (RLS) on all tables
ALTER TABLE organizations ENABLE ROW LEVEL SECURITY;
ALTER TABLE organization_users ENABLE ROW LEVEL SECURITY;
ALTER TABLE roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE properties ENABLE ROW LEVEL SECURITY;
ALTER TABLE tenants ENABLE ROW LEVEL SECURITY;
ALTER TABLE leases ENABLE ROW LEVEL SECURITY;
ALTER TABLE documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;

-- Helper function to check if user belongs to organization
CREATE OR REPLACE FUNCTION user_belongs_to_org(org_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1 FROM organization_users
        WHERE organization_id = org_id
        AND user_id = auth.uid()
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Organizations policies
CREATE POLICY "Users can view organizations they belong to"
    ON organizations FOR SELECT
    USING (user_belongs_to_org(id));

CREATE POLICY "Users can update organizations they belong to"
    ON organizations FOR UPDATE
    USING (user_belongs_to_org(id));

CREATE POLICY "Authenticated users can create organizations"
    ON organizations FOR INSERT
    WITH CHECK (auth.uid() IS NOT NULL);

-- Organization users policies
CREATE POLICY "Users can view their organization memberships"
    ON organization_users FOR SELECT
    USING (user_id = auth.uid() OR user_belongs_to_org(organization_id));

CREATE POLICY "Organization admins can manage members"
    ON organization_users FOR ALL
    USING (user_belongs_to_org(organization_id));

-- Roles policies (read-only for all authenticated users)
CREATE POLICY "Authenticated users can view roles"
    ON roles FOR SELECT
    USING (auth.uid() IS NOT NULL);

-- Properties policies
CREATE POLICY "Users can view properties in their organizations"
    ON properties FOR SELECT
    USING (user_belongs_to_org(organization_id));

CREATE POLICY "Users can manage properties in their organizations"
    ON properties FOR ALL
    USING (user_belongs_to_org(organization_id));

-- Tenants policies
CREATE POLICY "Users can view tenants in their organizations"
    ON tenants FOR SELECT
    USING (user_belongs_to_org(organization_id));

CREATE POLICY "Users can manage tenants in their organizations"
    ON tenants FOR ALL
    USING (user_belongs_to_org(organization_id));

-- Leases policies
CREATE POLICY "Users can view leases in their organizations"
    ON leases FOR SELECT
    USING (user_belongs_to_org(organization_id));

CREATE POLICY "Users can manage leases in their organizations"
    ON leases FOR ALL
    USING (user_belongs_to_org(organization_id));

-- Documents policies
CREATE POLICY "Users can view documents in their organizations"
    ON documents FOR SELECT
    USING (user_belongs_to_org(organization_id));

CREATE POLICY "Users can manage documents in their organizations"
    ON documents FOR ALL
    USING (user_belongs_to_org(organization_id));

-- Conversations policies
CREATE POLICY "Users can view their own conversations"
    ON conversations FOR SELECT
    USING (user_id = auth.uid());

CREATE POLICY "Users can manage their own conversations"
    ON conversations FOR ALL
    USING (user_id = auth.uid());

-- Messages policies
CREATE POLICY "Users can view messages in their conversations"
    ON messages FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM conversations
            WHERE conversations.id = messages.conversation_id
            AND conversations.user_id = auth.uid()
        )
    );

CREATE POLICY "Users can create messages in their conversations"
    ON messages FOR INSERT
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM conversations
            WHERE conversations.id = messages.conversation_id
            AND conversations.user_id = auth.uid()
        )
    );
