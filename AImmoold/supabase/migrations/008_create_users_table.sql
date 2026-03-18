-- Create public.users table to sync with auth.users
CREATE TABLE IF NOT EXISTS public.users (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    email VARCHAR(255) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS on users table
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;

-- Policy to allow users to view their own data
DROP POLICY IF EXISTS "Users can view their own data" ON public.users;
CREATE POLICY "Users can view their own data"
    ON public.users FOR SELECT
    USING (auth.uid() = id);

-- Function to handle new user creation
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.users (id, email)
    VALUES (NEW.id, NEW.email)
    ON CONFLICT (id) DO NOTHING;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to automatically create user in public.users when auth.users is created
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Migrate any existing auth.users to public.users first
INSERT INTO public.users (id, email)
SELECT id, email FROM auth.users
ON CONFLICT (id) DO NOTHING;

-- Update existing organization_users foreign key constraint
ALTER TABLE organization_users 
    DROP CONSTRAINT IF EXISTS organization_users_user_id_fkey;

ALTER TABLE organization_users 
    ADD CONSTRAINT organization_users_user_id_fkey 
    FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE;

-- Update documents table foreign key constraint
ALTER TABLE documents 
    DROP CONSTRAINT IF EXISTS documents_uploaded_by_fkey;

ALTER TABLE documents 
    ADD CONSTRAINT documents_uploaded_by_fkey 
    FOREIGN KEY (uploaded_by) REFERENCES public.users(id);

-- Update conversations table foreign key constraint
ALTER TABLE conversations 
    DROP CONSTRAINT IF EXISTS conversations_user_id_fkey;

ALTER TABLE conversations 
    ADD CONSTRAINT conversations_user_id_fkey 
    FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE;

-- Update document_processing table foreign key constraint if it exists
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'document_processing') THEN
        ALTER TABLE document_processing 
            DROP CONSTRAINT IF EXISTS document_processing_validated_by_fkey;
        
        ALTER TABLE document_processing 
            ADD CONSTRAINT document_processing_validated_by_fkey 
            FOREIGN KEY (validated_by) REFERENCES public.users(id);
    END IF;
END $$;
