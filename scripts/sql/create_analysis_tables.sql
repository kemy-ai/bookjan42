-- bookjan42 리뷰 교차 분석 테이블
-- Supabase SQL Editor에서 실행

-- 1. 블로거 프로필 (신뢰도 산정)
CREATE TABLE IF NOT EXISTS blogger_profiles (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  blog_url TEXT UNIQUE NOT NULL,
  author_name TEXT,
  review_count INTEGER DEFAULT 0,
  avg_trust_score REAL DEFAULT 0,
  ad_ratio REAL DEFAULT 0,
  balance_score REAL DEFAULT 0,
  specificity_score REAL DEFAULT 0,
  reliability_score REAL DEFAULT 0,
  last_analyzed_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. 장소별 교차 분석 인사이트
CREATE TABLE IF NOT EXISTS place_insights (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  place_id UUID NOT NULL REFERENCES places(id) ON DELETE CASCADE,
  analysis_version INTEGER DEFAULT 1,
  common_pros JSONB DEFAULT '[]'::jsonb,
  common_cons JSONB DEFAULT '[]'::jsonb,
  personal_opinions JSONB DEFAULT '[]'::jsonb,
  trend_changes JSONB DEFAULT '[]'::jsonb,
  overall_vibe TEXT,
  confidence_level REAL DEFAULT 0,
  total_reviews_analyzed INTEGER DEFAULT 0,
  analyzed_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(place_id)
);

-- 인덱스
CREATE INDEX IF NOT EXISTS idx_place_insights_place_id ON place_insights(place_id);
CREATE INDEX IF NOT EXISTS idx_blogger_profiles_blog_url ON blogger_profiles(blog_url);

-- RLS 정책
ALTER TABLE blogger_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE place_insights ENABLE ROW LEVEL SECURITY;

-- 읽기: 모든 사용자
CREATE POLICY "blogger_profiles_read" ON blogger_profiles FOR SELECT USING (true);
CREATE POLICY "place_insights_read" ON place_insights FOR SELECT USING (true);

-- 쓰기: anon 키로도 가능 (분석 스크립트용)
CREATE POLICY "blogger_profiles_insert" ON blogger_profiles FOR INSERT WITH CHECK (true);
CREATE POLICY "blogger_profiles_update" ON blogger_profiles FOR UPDATE USING (true);
CREATE POLICY "place_insights_insert" ON place_insights FOR INSERT WITH CHECK (true);
CREATE POLICY "place_insights_update" ON place_insights FOR UPDATE USING (true);
