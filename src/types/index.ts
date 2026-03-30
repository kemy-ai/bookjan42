export interface Place {
  id: string;
  name: string;
  address: string;
  lat: number;
  lng: number;
  phone: string | null;
  hours: string | null;
  conversation: boolean;
  price_range: "저" | "중" | "고";
  atmosphere: string[];
  menus: MenuItem[];
  photos: string[];
  description: string | null;
  website: string | null;
  closed_days: string | null;
  instagram_url: string | null;
  naver_place_url: string | null;
  created_at: string;
  updated_at: string;
}

export interface MenuItem {
  name: string;
  price: number;
}

export interface BlogReview {
  id: string;
  place_id: string;
  source_url: string;
  author_name: string | null;
  content_summary: string | null;
  trust_score: number;
  is_ad: boolean;
  pros: string[];
  cons: string[];
  published_at: string | null;
  crawled_at: string;
}

export interface PlaceFilter {
  keyword?: string;
  conversation?: boolean | null;
  price_range?: string | null;
  atmosphere?: string | null;
}

// 교차 분석 인사이트
export interface InsightItem {
  text: string;
  count: number;
  weighted_score: number;
  label: "핵심" | "공통";
}

export interface PersonalOpinion {
  text: string;
  count: number;
  type: "pro" | "con";
  label: "개인" | "소수";
}

export interface PlaceInsight {
  id: string;
  place_id: string;
  analysis_version: number;
  common_pros: InsightItem[];
  common_cons: InsightItem[];
  personal_opinions: PersonalOpinion[];
  trend_changes: string[];
  overall_vibe: string | null;
  confidence_level: number;
  total_reviews_analyzed: number;
  analyzed_at: string;
}
