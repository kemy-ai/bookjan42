"use client";

import { useState } from "react";
import { Search, X } from "lucide-react";
import type { PlaceFilter } from "@/types";

interface SearchFilterProps {
  onFilterChange: (filter: PlaceFilter) => void;
}

const CONVERSATION_OPTIONS = [
  { label: "대화 가능", value: true },
  { label: "정숙", value: false },
] as const;

const PRICE_OPTIONS = [
  { label: "$", value: "저" },
  { label: "$$", value: "중" },
  { label: "$$$", value: "고" },
] as const;

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

  const chipBase = "cursor-pointer rounded-full px-3 py-1 text-xs font-medium transition-all duration-200 whitespace-nowrap";
  const chipActive = "bg-primary text-primary-foreground";
  const chipInactive = "bg-secondary text-secondary-foreground hover:bg-accent";

  return (
    <div className="space-y-2.5">
      {/* 검색바 */}
      <form onSubmit={handleSearch}>
        <div className="relative">
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
      </form>

      {/* 필터 칩 — 항상 노출 */}
      <div className="flex items-center gap-3 overflow-x-auto pb-0.5 scrollbar-none">
        {/* 대화 가능 여부 */}
        <div className="flex shrink-0 items-center gap-1.5">
          {CONVERSATION_OPTIONS.map((opt) => (
            <button
              key={String(opt.value)}
              onClick={() => {
                const next = conversation === opt.value ? null : opt.value;
                setConversation(next);
                applyFilter({ conversation: next });
              }}
              className={`${chipBase} ${conversation === opt.value ? chipActive : chipInactive}`}
            >
              {opt.label}
            </button>
          ))}
        </div>

        <span className="h-4 w-px shrink-0 bg-border" />

        {/* 가격대 */}
        <div className="flex shrink-0 items-center gap-1.5">
          {PRICE_OPTIONS.map((opt) => (
            <button
              key={opt.value}
              onClick={() => {
                const next = priceRange === opt.value ? null : opt.value;
                setPriceRange(next);
                applyFilter({ price_range: next });
              }}
              className={`${chipBase} ${priceRange === opt.value ? chipActive : chipInactive}`}
            >
              {opt.label}
            </button>
          ))}
        </div>

        <span className="h-4 w-px shrink-0 bg-border" />

        {/* 분위기 */}
        <div className="flex shrink-0 items-center gap-1.5">
          {ATMOSPHERE_OPTIONS.map((atm) => (
            <button
              key={atm}
              onClick={() => {
                const next = atmosphere === atm ? null : atm;
                setAtmosphere(next);
                applyFilter({ atmosphere: next });
              }}
              className={`${chipBase} ${atmosphere === atm ? chipActive : chipInactive}`}
            >
              {atm}
            </button>
          ))}
        </div>

        {/* 필터 초기화 */}
        {hasActiveFilters && (
          <>
            <span className="h-4 w-px shrink-0 bg-border" />
            <button
              onClick={resetFilters}
              className="flex shrink-0 cursor-pointer items-center gap-1 rounded-full bg-destructive/10 px-2.5 py-1 text-xs font-medium text-destructive transition-all duration-200 hover:bg-destructive/20"
            >
              <X className="h-3 w-3" />
              초기화
            </button>
          </>
        )}
      </div>
    </div>
  );
}
