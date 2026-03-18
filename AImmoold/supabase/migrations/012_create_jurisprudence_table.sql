-- Migration: Create jurisprudence_articles table for tracking processed articles
-- This table stores articles fetched from Legifrance and their analysis results

-- Create jurisprudence_articles table
CREATE TABLE IF NOT EXISTS jurisprudence_articles (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    legifrance_id TEXT UNIQUE NOT NULL,
    title TEXT NOT NULL,
    decision_date DATE,
    fetched_date TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    is_real_estate BOOLEAN NOT NULL DEFAULT FALSE,
    summary TEXT,
    processed BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_jurisprudence_is_real_estate 
ON jurisprudence_articles(is_real_estate);

CREATE INDEX IF NOT EXISTS idx_jurisprudence_decision_date 
ON jurisprudence_articles(decision_date);

CREATE INDEX IF NOT EXISTS idx_jurisprudence_created_at 
ON jurisprudence_articles(created_at);

CREATE INDEX IF NOT EXISTS idx_jurisprudence_legifrance_id 
ON jurisprudence_articles(legifrance_id);

-- Add trigger to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_jurisprudence_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_jurisprudence_articles_updated_at
    BEFORE UPDATE ON jurisprudence_articles
    FOR EACH ROW
    EXECUTE FUNCTION update_jurisprudence_updated_at();

-- Enable RLS
ALTER TABLE jurisprudence_articles ENABLE ROW LEVEL SECURITY;

-- RLS Policies: Anyone authenticated can read, only system can write
CREATE POLICY "Authenticated users can view jurisprudence articles"
    ON jurisprudence_articles FOR SELECT
    USING (auth.role() = 'authenticated');

CREATE POLICY "Service role can insert jurisprudence articles"
    ON jurisprudence_articles FOR INSERT
    WITH CHECK (auth.role() = 'service_role' OR auth.role() = 'authenticated');

CREATE POLICY "Service role can update jurisprudence articles"
    ON jurisprudence_articles FOR UPDATE
    USING (auth.role() = 'service_role' OR auth.role() = 'authenticated');

-- Add comment
COMMENT ON TABLE jurisprudence_articles IS 'Stores processed jurisprudence articles from Legifrance with AI analysis results';
