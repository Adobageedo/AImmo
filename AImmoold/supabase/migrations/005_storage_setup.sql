-- Configuration Supabase Storage
-- À exécuter dans le dashboard Supabase > Storage

-- 1. Créer le bucket "documents" (via UI ou SQL)
-- Dashboard > Storage > New Bucket
-- Name: documents
-- Public: false (privé)

-- 2. Policies RLS pour le bucket documents
-- Ces policies permettent aux utilisateurs d'accéder uniquement aux documents de leurs organisations

-- Policy: Les utilisateurs peuvent lire les documents de leurs organisations
CREATE POLICY "Users can read their organization documents"
ON storage.objects FOR SELECT
TO authenticated
USING (
  bucket_id = 'documents' 
  AND (storage.foldername(name))[1] IN (
    SELECT organization_id::text 
    FROM organization_users 
    WHERE user_id = auth.uid()
  )
);

-- Policy: Les utilisateurs peuvent uploader dans leurs organisations
CREATE POLICY "Users can upload to their organizations"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'documents'
  AND (storage.foldername(name))[1] IN (
    SELECT organization_id::text 
    FROM organization_users 
    WHERE user_id = auth.uid()
  )
);

-- Policy: Les utilisateurs peuvent supprimer les documents de leurs organisations
CREATE POLICY "Users can delete their organization documents"
ON storage.objects FOR DELETE
TO authenticated
USING (
  bucket_id = 'documents'
  AND (storage.foldername(name))[1] IN (
    SELECT organization_id::text 
    FROM organization_users 
    WHERE user_id = auth.uid()
  )
);

-- Policy: Les utilisateurs peuvent mettre à jour les documents de leurs organisations
CREATE POLICY "Users can update their organization documents"
ON storage.objects FOR UPDATE
TO authenticated
USING (
  bucket_id = 'documents'
  AND (storage.foldername(name))[1] IN (
    SELECT organization_id::text 
    FROM organization_users 
    WHERE user_id = auth.uid()
  )
);
