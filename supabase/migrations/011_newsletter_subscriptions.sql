-- =====================================================
-- NEWSLETTER SUBSCRIPTIONS TABLE
-- =====================================================

CREATE TABLE newsletter_subscriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  newsletter_id UUID NOT NULL REFERENCES newsletters(id) ON DELETE CASCADE,
  subscribed_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  unsubscribed_at TIMESTAMPTZ,
  active BOOLEAN NOT NULL DEFAULT true,
  UNIQUE(user_id, newsletter_id)
);

-- Disable RLS
ALTER TABLE newsletter_subscriptions DISABLE ROW LEVEL SECURITY;

-- Indexes
CREATE INDEX idx_newsletter_subscriptions_user ON newsletter_subscriptions(user_id);
CREATE INDEX idx_newsletter_subscriptions_newsletter ON newsletter_subscriptions(newsletter_id);

-- Comment
COMMENT ON TABLE newsletter_subscriptions IS 'User subscriptions to newsletters';
