"use client";

import { useState, useMemo, useCallback } from "react";
import dynamic from "next/dynamic";
import { Map as MapIcon, List } from "lucide-react";
import SearchFilter from "@/components/place/search-filter";
import PlaceList from "@/components/place/place-list";
import type { Place, PlaceFilter } from "@/types";

const KakaoMap = dynamic(() => import("@/components/map/kakao-map"), {
  ssr: false,
  loading: () => (
    <div className="flex h-full items-center justify-center bg-card text-sm text-muted-foreground">
      지도 로딩 중...
    </div>
  ),
});

interface HomeClientProps {
  places: Place[];
}

export default function HomeClient({ places }: HomeClientProps) {
  const [filter, setFilter] = useState<PlaceFilter>({});
  const [selectedPlaceId, setSelectedPlaceId] = useState<string | null>(null);
  const [view, setView] = useState<"map" | "list">("map");

  const filteredPlaces = useMemo(() => {
    return places.filter((place) => {
      if (filter.keyword) {
        const kw = filter.keyword.toLowerCase();
        const matchName = place.name.toLowerCase().includes(kw);
        const matchAddress = place.address.toLowerCase().includes(kw);
        const matchDesc = place.description?.toLowerCase().includes(kw);
        if (!matchName && !matchAddress && !matchDesc) return false;
      }

      if (filter.conversation !== null && filter.conversation !== undefined) {
        if (place.conversation !== filter.conversation) return false;
      }

      if (filter.price_range) {
        if (place.price_range !== filter.price_range) return false;
      }

      if (filter.atmosphere) {
        if (!place.atmosphere.includes(filter.atmosphere)) return false;
      }

      return true;
    });
  }, [places, filter]);

  const handlePlaceSelect = useCallback((place: Place) => {
    setSelectedPlaceId(place.id);
  }, []);

  return (
    <div className="flex h-[calc(100dvh-theme(spacing.14))] flex-col overflow-hidden">
      {/* 검색 + 필터 + 모바일 토글 */}
      <div className="shrink-0 border-b border-border bg-background px-4 py-3">
        <div className="mx-auto max-w-7xl">
          <div className="flex items-start gap-2">
            <div className="min-w-0 flex-1">
              <SearchFilter onFilterChange={setFilter} />
            </div>
            {/* 모바일: 지도/목록 토글 */}
            <div className="flex shrink-0 gap-1 rounded-xl border border-border bg-secondary p-1 md:hidden">
              <button
                onClick={() => setView("map")}
                className={`cursor-pointer rounded-lg p-2 transition-all duration-200 ${
                  view === "map"
                    ? "bg-primary text-primary-foreground shadow-sm"
                    : "text-muted-foreground hover:text-foreground"
                }`}
                aria-label="지도 보기"
              >
                <MapIcon className="h-4 w-4" />
              </button>
              <button
                onClick={() => setView("list")}
                className={`cursor-pointer rounded-lg p-2 transition-all duration-200 ${
                  view === "list"
                    ? "bg-primary text-primary-foreground shadow-sm"
                    : "text-muted-foreground hover:text-foreground"
                }`}
                aria-label="목록 보기"
              >
                <List className="h-4 w-4" />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* 메인 콘텐츠 — 높이 고정 + 너비를 헤더와 동일하게 */}
      <div className="mx-auto flex min-h-0 w-full max-w-7xl flex-1 overflow-hidden">
        {/* 지도 — 남은 공간 차지, min-w-0으로 사이드바 공간 양보 */}
        <div
          className={`min-w-0 flex-1 overflow-hidden ${
            view === "list" ? "hidden md:block" : "block"
          }`}
        >
          <KakaoMap
            places={filteredPlaces}
            onPlaceSelect={handlePlaceSelect}
          />
        </div>

        {/* 목록 사이드바 — 고정 너비, 독립 스크롤 */}
        <div
          className={`shrink-0 overflow-y-auto border-l border-border bg-background p-4 md:w-96 ${
            view === "map" ? "hidden md:block" : "block w-full"
          }`}
        >
          <PlaceList
            places={filteredPlaces}
            selectedPlaceId={selectedPlaceId}
          />
        </div>
      </div>
    </div>
  );
}
