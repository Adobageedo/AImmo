-- =====================================================
-- FIX NEWSLETTER EDITIONS STRUCTURE FOR NEW SERVICE
-- =====================================================
-- This migration fixes the newsletter_editions table to work with the new service
-- that doesn't require organization_id and uses published_at instead of sent_at

-- 1. Make organization_id nullable in newsletter_editions
ALTER TABLE newsletter_editions 
ALTER COLUMN organization_id DROP NOT NULL;

-- 2. Add default values for created_at if needed
ALTER TABLE newsletter_editions 
ALTER COLUMN created_at SET DEFAULT NOW();

-- 3. Update existing records to have proper published_at values
UPDATE newsletter_editions 
SET published_at = COALESCE(sent_at, created_at) 
WHERE published_at IS NULL;

-- 4. Add constraint to ensure newsletter_id is not null (already exists but double-check)
ALTER TABLE newsletter_editions 
ALTER COLUMN newsletter_id SET NOT NULL;

-- 5. Create a function to get newsletter by slug (if not exists)
CREATE OR REPLACE FUNCTION get_newsletter_by_slug_v2(slug_param TEXT)
RETURNS TABLE (
    id UUID,
    organization_id UUID,
    title TEXT,
    category TEXT,
    frequency TEXT,
    description TEXT,
    active BOOLEAN,
    slug TEXT,
    theme TEXT,
    is_active BOOLEAN,
    created_at TIMESTAMPTZ,
    updated_at TIMESTAMPTZ
) AS $$
BEGIN
    RETURN QUERY
    SELECT n.*
    FROM newsletters n
    WHERE n.slug = slug_param AND n.is_active = true AND n.active = true
    LIMIT 1;
END;
$$ LANGUAGE plpgsql;

-- 6. Update comments
COMMENT ON COLUMN newsletter_editions.organization_id IS 'Organization ID (nullable for new service)';
COMMENT ON COLUMN newsletter_editions.published_at IS 'Publication date (used instead of sent_at)';

-- 7. Create a simplified view for newsletter editions without organization requirement
CREATE OR REPLACE VIEW newsletter_editions_simple AS
SELECT 
    ne.id,
    ne.created_at,
    ne.updated_at,
    ne.newsletter_id,
    ne.title,
    ne.content,
    ne.published_at,
    ne.sent_at,
    ne.recipient_count,
    ne.open_rate,
    ne.click_rate,
    n.title as newsletter_title,
    n.slug as newsletter_slug
FROM newsletter_editions ne
JOIN newsletters n ON ne.newsletter_id = n.id
WHERE n.is_active = true AND n.active = true;

-- 8. Create trigger to automatically set created_at if not provided
CREATE OR REPLACE FUNCTION set_newsletter_editions_created_at()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.created_at IS NULL THEN
        NEW.created_at = NOW();
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER newsletter_editions_set_created_at
    BEFORE INSERT ON newsletter_editions
    FOR EACH ROW
    EXECUTE FUNCTION set_newsletter_editions_created_at();

-- 9. Add index for performance
CREATE INDEX IF NOT EXISTS idx_newsletter_editions_newsletter_published 
ON newsletter_editions(newsletter_id, published_at DESC);
