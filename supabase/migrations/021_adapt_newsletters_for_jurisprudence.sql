-- =====================================================
-- ADAPTATION FOR JURISPRUDENCE NEWSLETTER SYSTEM
-- =====================================================
-- This migration adapts existing newsletter tables for jurisprudence
-- and adds the jurisprudence_articles table

-- 1. Add new columns to newsletters table for jurisprudence compatibility
ALTER TABLE newsletters 
ADD COLUMN IF NOT EXISTS slug TEXT,
ADD COLUMN IF NOT EXISTS theme TEXT DEFAULT 'jurisprudence',
ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT true;

-- Create unique index for slug if not exists
CREATE UNIQUE INDEX IF NOT EXISTS idx_newsletters_slug ON newsletters(slug) WHERE slug IS NOT NULL;

-- Add index for theme
CREATE INDEX IF NOT EXISTS idx_newsletters_theme ON newsletters(theme);

-- 2. Add new columns to newsletter_editions table if they don't exist
ALTER TABLE newsletter_editions 
ADD COLUMN IF NOT EXISTS published_at TIMESTAMPTZ DEFAULT NOW();

-- Update existing editions to have published_at if it's NULL
UPDATE newsletter_editions 
SET published_at = COALESCE(sent_at, created_at) 
WHERE published_at IS NULL;

-- Add index for published_at
CREATE INDEX IF NOT EXISTS idx_newsletter_editions_published_at ON newsletter_editions(published_at);

-- 3. Update newsletter_subscriptions table to match new schema
ALTER TABLE newsletter_subscriptions 
ADD COLUMN IF NOT EXISTS is_subscribed BOOLEAN DEFAULT true,
ADD COLUMN IF NOT EXISTS unsubscribed_at TIMESTAMPTZ;

-- Update existing subscriptions
UPDATE newsletter_subscriptions 
SET is_subscribed = active,
    unsubscribed_at = CASE WHEN active = false THEN NOW() ELSE NULL END
WHERE is_subscribed IS NULL;

-- Add index for is_subscribed
CREATE INDEX IF NOT EXISTS idx_newsletter_subscriptions_is_subscribed ON newsletter_subscriptions(is_subscribed);

-- 4. Create jurisprudence_articles table
CREATE TABLE IF NOT EXISTS jurisprudence_articles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  legifrance_id TEXT UNIQUE NOT NULL,
  title TEXT NOT NULL,
  decision_date DATE,
  is_real_estate BOOLEAN NOT NULL DEFAULT false,
  summary TEXT, -- JSON string containing structured summary
  jurisdiction TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indexes for jurisprudence_articles
CREATE INDEX IF NOT EXISTS idx_jurisprudence_articles_legifrance_id ON jurisprudence_articles(legifrance_id);
CREATE INDEX IF NOT EXISTS idx_jurisprudence_articles_decision_date ON jurisprudence_articles(decision_date);
CREATE INDEX IF NOT EXISTS idx_jurisprudence_articles_is_real_estate ON jurisprudence_articles(is_real_estate);
CREATE INDEX IF NOT EXISTS idx_jurisprudence_articles_created_at ON jurisprudence_articles(created_at);

-- Create trigger for updated_at on jurisprudence_articles
CREATE OR REPLACE FUNCTION update_jurisprudence_articles_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER jurisprudence_articles_updated_at
  BEFORE UPDATE ON jurisprudence_articles
  FOR EACH ROW
  EXECUTE FUNCTION update_jurisprudence_articles_updated_at();

-- 5. Create default jurisprudence newsletter if it doesn't exist
-- First check if slug column exists and has unique constraint
DO $$
BEGIN
  -- Check if newsletter already exists
  IF NOT EXISTS (SELECT 1 FROM newsletters WHERE slug = 'jurisprudence-immobiliere') THEN
    -- Insert only if doesn't exist
    INSERT INTO newsletters (
      id,
      organization_id,
      title,
      category,
      frequency,
      description,
      active,
      slug,
      theme,
      is_active
    ) VALUES (
      gen_random_uuid(),
      (SELECT id FROM organizations LIMIT 1), -- Use first organization as default
      'Jurisprudence Immobilière',
      'regulation', -- Use existing category
      'weekly',
      'Newsletter hebdomadaire sur les dernières décisions de justice en matière de droit immobilier',
      true,
      'jurisprudence-immobiliere',
      'jurisprudence',
      true
    );
    RAISE NOTICE 'Created default jurisprudence newsletter';
  ELSE
    RAISE NOTICE 'Jurisprudence newsletter already exists';
  END IF;
END $$;

-- 6. Add comments
COMMENT ON TABLE jurisprudence_articles IS 'Processed jurisprudence decisions from Legifrance';
COMMENT ON COLUMN newsletters.slug IS 'URL-friendly identifier for newsletters';
COMMENT ON COLUMN newsletters.theme IS 'Theme/category for newsletter grouping';
COMMENT ON COLUMN newsletters.is_active IS 'Whether newsletter is currently active';
COMMENT ON COLUMN newsletter_editions.published_at IS 'When the newsletter was published';
COMMENT ON COLUMN newsletter_subscriptions.is_subscribed IS 'Current subscription status';
COMMENT ON COLUMN newsletter_subscriptions.unsubscribed_at IS 'When user unsubscribed';

-- 7. Create view for active newsletters with subscription info
CREATE OR REPLACE VIEW active_newsletters_with_stats AS
SELECT 
  n.*,
  COUNT(DISTINCT ne.id) as edition_count,
  MAX(ne.published_at) as last_published_at,
  COUNT(DISTINCT ns.id) as subscriber_count
FROM newsletters n
LEFT JOIN newsletter_editions ne ON n.id = ne.newsletter_id
LEFT JOIN newsletter_subscriptions ns ON n.id = ns.newsletter_id AND ns.is_subscribed = true
WHERE n.is_active = true AND n.active = true
GROUP BY n.id, n.organization_id, n.created_at, n.updated_at, n.title, n.category, n.frequency, n.description, n.active, n.slug, n.theme, n.is_active;

-- 8. Create function to get newsletter by slug
CREATE OR REPLACE FUNCTION get_newsletter_by_slug(slug_param TEXT)
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
  updated_at TIMESTAMPTZ,
  edition_count BIGINT,
  subscriber_count BIGINT,
  last_published_at TIMESTAMPTZ
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    n.*,
    COUNT(DISTINCT ne.id) as edition_count,
    COUNT(DISTINCT ns.id) as subscriber_count,
    MAX(ne.published_at) as last_published_at
  FROM newsletters n
  LEFT JOIN newsletter_editions ne ON n.id = ne.newsletter_id
  LEFT JOIN newsletter_subscriptions ns ON n.id = ns.newsletter_id AND ns.is_subscribed = true
  WHERE n.slug = slug_param AND n.is_active = true AND n.active = true
  GROUP BY n.id, n.organization_id, n.created_at, n.updated_at, n.title, n.category, n.frequency, n.description, n.active, n.slug, n.theme, n.is_active;
END;
$$ LANGUAGE plpgsql;
