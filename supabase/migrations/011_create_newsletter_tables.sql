-- Newsletter Tables Migration

-- 1. Newsletters table
CREATE TABLE IF NOT EXISTS newsletters (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    slug VARCHAR(255) UNIQUE NOT NULL,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    theme VARCHAR(100) NOT NULL,
    frequency VARCHAR(50) NOT NULL,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 2. Newsletter editions table
CREATE TABLE IF NOT EXISTS newsletter_editions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    newsletter_id UUID NOT NULL REFERENCES newsletters(id) ON DELETE CASCADE,
    title VARCHAR(255) NOT NULL,
    content TEXT NOT NULL,
    published_at TIMESTAMP WITH TIME ZONE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 3. Newsletter subscriptions table
CREATE TABLE IF NOT EXISTS newsletter_subscriptions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL,
    newsletter_id UUID NOT NULL REFERENCES newsletters(id) ON DELETE CASCADE,
    is_subscribed BOOLEAN DEFAULT true,
    subscribed_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    unsubscribed_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(user_id, newsletter_id)
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_newsletters_is_active ON newsletters(is_active);
CREATE INDEX IF NOT EXISTS idx_newsletters_slug ON newsletters(slug);
CREATE INDEX IF NOT EXISTS idx_newsletter_editions_newsletter_id ON newsletter_editions(newsletter_id);
CREATE INDEX IF NOT EXISTS idx_newsletter_editions_published_at ON newsletter_editions(published_at DESC);
CREATE INDEX IF NOT EXISTS idx_newsletter_subscriptions_user_id ON newsletter_subscriptions(user_id);
CREATE INDEX IF NOT EXISTS idx_newsletter_subscriptions_newsletter_id ON newsletter_subscriptions(newsletter_id);
CREATE INDEX IF NOT EXISTS idx_newsletter_subscriptions_is_subscribed ON newsletter_subscriptions(is_subscribed);

-- RLS Policies
ALTER TABLE newsletters ENABLE ROW LEVEL SECURITY;
ALTER TABLE newsletter_editions ENABLE ROW LEVEL SECURITY;
ALTER TABLE newsletter_subscriptions ENABLE ROW LEVEL SECURITY;

-- Public read access to active newsletters
CREATE POLICY "Anyone can view active newsletters"
    ON newsletters FOR SELECT
    USING (is_active = true);

-- Public read access to newsletter editions
CREATE POLICY "Anyone can view newsletter editions"
    ON newsletter_editions FOR SELECT
    USING (true);

-- Users can view their own subscriptions
CREATE POLICY "Users can view their own subscriptions"
    ON newsletter_subscriptions FOR SELECT
    USING (auth.uid() = user_id);

-- Users can insert their own subscriptions
CREATE POLICY "Users can create their own subscriptions"
    ON newsletter_subscriptions FOR INSERT
    WITH CHECK (auth.uid() = user_id);

-- Users can update their own subscriptions
CREATE POLICY "Users can update their own subscriptions"
    ON newsletter_subscriptions FOR UPDATE
    USING (auth.uid() = user_id);

-- Trigger to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_newsletters_updated_at BEFORE UPDATE ON newsletters
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_newsletter_editions_updated_at BEFORE UPDATE ON newsletter_editions
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_newsletter_subscriptions_updated_at BEFORE UPDATE ON newsletter_subscriptions
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Seed data for newsletters
INSERT INTO newsletters (slug, title, description, theme, frequency) VALUES
('marche-immobilier', 'Marché Immobilier', 'Actualités et tendances du marché immobilier français', 'marche', 'weekly'),
('fiscalite-immobiliere', 'Fiscalité Immobilière', 'Optimisation fiscale et réglementation', 'fiscalite', 'monthly'),
('gestion-locative', 'Gestion Locative', 'Conseils pratiques pour la gestion de vos biens', 'gestion', 'biweekly')
ON CONFLICT (slug) DO NOTHING;
