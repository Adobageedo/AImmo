-- =====================================================
-- NEWSLETTER EDITIONS TABLE
-- =====================================================

CREATE TABLE newsletter_editions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  newsletter_id UUID NOT NULL REFERENCES newsletters(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  sent_at TIMESTAMPTZ,
  recipient_count INTEGER,
  open_rate NUMERIC,
  click_rate NUMERIC
);

-- Disable RLS
ALTER TABLE newsletter_editions DISABLE ROW LEVEL SECURITY;

-- Indexes
CREATE INDEX idx_newsletter_editions_newsletter ON newsletter_editions(newsletter_id);
CREATE INDEX idx_newsletter_editions_sent_at ON newsletter_editions(sent_at);

-- Trigger for updated_at
CREATE TRIGGER update_newsletter_editions_updated_at 
  BEFORE UPDATE ON newsletter_editions 
  FOR EACH ROW 
  EXECUTE FUNCTION update_updated_at_column();

-- Comment
COMMENT ON TABLE newsletter_editions IS 'Newsletter editions sent to subscribers';
