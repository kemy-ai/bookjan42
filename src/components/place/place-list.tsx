"use client";

import PlaceCard from "./place-card";
import type { Place } from "@/types";

interface PlaceListProps {
  places: Place[];
  selectedPlaceId?: string | null;
}

export default function PlaceList({ places, selectedPlaceId }: PlaceListProps) {
  if (places.length === 0) {
    return (
      <div className="flex h-40 items-center justify-center text-sm text-muted-foreground">
        검색 결과가 없습니다
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <p className="text-xs text-muted-foreground">
        {places.length}곳의 북바
      </p>
      {places.map((place) => (
        <PlaceCard
          key={place.id}
          place={place}
          isSelected={place.id === selectedPlaceId}
        />
      ))}
    </div>
  );
}
