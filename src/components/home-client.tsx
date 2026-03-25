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
    <div className="flex flex-1 flex-col">
      {/* 검색 + 모바일 토글 */}
      <div className="shrink-0 border-b border-border bg-background px-4 py-3">
        <div className="mx-auto max-w-7xl">
          <div className="flex items-center gap-2">
            <div className="flex-1">
              <SearchFilter onFilterChange={setFilter} />
            </div>
            {/* 모바일: 지도/목록 토글 */}
            <div className="flex gap-1 md:hidden">
              <button
                onClick={() => setView("map")}
                className={`rounded-md p-2 ${
                  view === "map"
                    ? "bg-primary text-primary-foreground"
                    : "text-muted-foreground hover:bg-accent"
                }`}
                aria-label="지도 보기"
              >
                <MapIcon className="h-4 w-4" />
              </button>
              <button
                onClick={() => setView("list")}
                className={`rounded-md p-2 ${
                  view === "list"
                    ? "bg-primary text-primary-foreground"
                    : "text-muted-foreground hover:bg-accent"
                }`}
                aria-label="목록 보기"
              >
                <List className="h-4 w-4" />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* 메인 콘텐츠 */}
      <div className="flex min-h-0 flex-1">
        {/* 지도 */}
        <div
          className={`flex-1 ${
            view === "list" ? "hidden md:block" : "block"
          }`}
        >
          <KakaoMap
            places={filteredPlaces}
            onPlaceSelect={handlePlaceSelect}
          />
        </div>

        {/* 목록 사이드바 */}
        <div
          className={`w-full overflow-y-auto border-l border-border bg-background p-4 md:w-96 ${
            view === "map" ? "hidden md:block" : "block"
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
