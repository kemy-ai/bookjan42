"use client";

import { useState } from "react";
import { Search, SlidersHorizontal, X } from "lucide-react";
import type { PlaceFilter } from "@/types";

interface SearchFilterProps {
  onFilterChange: (filter: PlaceFilter) => void;
}

const ATMOSPHERE_OPTIONS = [
  "조용한",
  "아늑한",
  "살롱형",
  "바 무드",
  "문화공간",
  "동네책방",
  "혼자",
  "모임형",
];

export default function SearchFilter({ onFilterChange }: SearchFilterProps) {
  const [keyword, setKeyword] = useState("");
  const [conversation, setConversation] = useState<boolean | null>(null);
  const [priceRange, setPriceRange] = useState<string | null>(null);
  const [atmosphere, setAtmosphere] = useState<string | null>(null);
  const [showFilters, setShowFilters] = useState(false);

  const applyFilter = (updates: Partial<PlaceFilter> = {}) => {
    const filter: PlaceFilter = {
      keyword: updates.keyword ?? keyword,
      conversation: updates.conversation !== undefined ? updates.conversation : conversation,
      price_range: updates.price_range !== undefined ? updates.price_range : priceRange,
      atmosphere: updates.atmosphere !== undefined ? updates.atmosphere : atmosphere,
    };
    onFilterChange(filter);
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    applyFilter();
  };

  const resetFilters = () => {
    setKeyword("");
    setConversation(null);
    setPriceRange(null);
    setAtmosphere(null);
    onFilterChange({});
  };

  const hasActiveFilters = conversation !== null || priceRange !== null || atmosphere !== null;

  return (
    <div className="space-y-3">
      {/* 검색바 */}
      <form onSubmit={handleSearch} className="flex gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <input
            type="text"
            placeholder="북바 이름, 지역으로 검색"
            value={keyword}
            onChange={(e) => {
              setKeyword(e.target.value);
              applyFilter({ keyword: e.target.value });
            }}
            className="h-10 w-full rounded-xl border border-input bg-card pl-10 pr-4 text-sm text-foreground placeholder:text-muted-foreground transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-ring focus:border-primary"
          />
        </div>
        <button
          type="button"
          onClick={() => setShowFilters(!showFilters)}
          className={`flex h-10 items-center gap-1.5 cursor-pointer rounded-xl border px-3 text-sm transition-all duration-200 ${
            hasActiveFilters
              ? "border-primary bg-primary/10 text-primary"
              : "border-input bg-card text-foreground hover:bg-accent"
          }`}
        >
          <SlidersHorizontal className="h-4 w-4" />
          <span className="hidden sm:inline">필터</span>
        </button>
      </form>

      {/* 필터 패널 */}
      {showFilters && (
        <div className="space-y-4 rounded-2xl border border-border bg-card p-5 shadow-sm">
          {/* 대화 가능 여부 */}
          <div>
            <p className="mb-2 text-xs font-medium text-muted-foreground">
              대화 가능 여부
            </p>
            <div className="flex gap-2">
              {[
                { label: "전체", value: null },
                { label: "💬 대화 가능", value: true },
                { label: "🤫 정숙", value: false },
              ].map((opt) => (
                <button
                  key={String(opt.value)}
                  onClick={() => {
                    setConversation(opt.value);
                    applyFilter({ conversation: opt.value });
                  }}
                  className={`cursor-pointer rounded-full px-3 py-1.5 text-xs font-medium transition-all duration-200 ${
                    conversation === opt.value
                      ? "bg-primary text-primary-foreground"
                      : "bg-secondary text-secondary-foreground hover:bg-accent"
                  }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>

          {/* 가격대 */}
          <div>
            <p className="mb-2 text-xs font-medium text-muted-foreground">
              가격대
            </p>
            <div className="flex gap-2">
              {[
                { label: "전체", value: null },
                { label: "💰 저", value: "저" },
                { label: "💰💰 중", value: "중" },
                { label: "💰💰💰 고", value: "고" },
              ].map((opt) => (
                <button
                  key={String(opt.value)}
                  onClick={() => {
                    setPriceRange(opt.value);
                    applyFilter({ price_range: opt.value });
                  }}
                  className={`cursor-pointer rounded-full px-3 py-1.5 text-xs font-medium transition-all duration-200 ${
                    priceRange === opt.value
                      ? "bg-primary text-primary-foreground"
                      : "bg-secondary text-secondary-foreground hover:bg-accent"
                  }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>

          {/* 분위기 */}
          <div>
            <p className="mb-2 text-xs font-medium text-muted-foreground">
              분위기
            </p>
            <div className="flex flex-wrap gap-2">
              {ATMOSPHERE_OPTIONS.map((atm) => (
                <button
                  key={atm}
                  onClick={() => {
                    const next = atmosphere === atm ? null : atm;
                    setAtmosphere(next);
                    applyFilter({ atmosphere: next });
                  }}
                  className={`cursor-pointer rounded-full px-3 py-1.5 text-xs font-medium transition-all duration-200 ${
                    atmosphere === atm
                      ? "bg-primary text-primary-foreground"
                      : "bg-secondary text-secondary-foreground hover:bg-accent"
                  }`}
                >
                  {atm}
                </button>
              ))}
            </div>
          </div>

          {/* 필터 초기화 */}
          {hasActiveFilters && (
            <button
              onClick={resetFilters}
              className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground"
            >
              <X className="h-3 w-3" />
              필터 초기화
            </button>
          )}
        </div>
      )}
    </div>
  );
}
