"use client";

import Link from "next/link";
import { MapPin, MessageCircle, VolumeOff } from "lucide-react";
import type { Place } from "@/types";

interface PlaceCardProps {
  place: Place;
  isSelected?: boolean;
}

export default function PlaceCard({ place, isSelected }: PlaceCardProps) {
  return (
    <Link href={`/place/${place.id}`}>
      <div
        className={`rounded-lg border p-4 transition-all hover:border-primary/50 hover:bg-card ${
          isSelected
            ? "border-primary bg-primary/5"
            : "border-border bg-card"
        }`}
      >
        {/* 이름 + 대화 가능 여부 */}
        <div className="mb-2 flex items-start justify-between gap-2">
          <h3 className="font-semibold text-foreground">{place.name}</h3>
          <span
            className={`flex shrink-0 items-center gap-1 rounded-full px-2 py-0.5 text-[11px] ${
              place.conversation
                ? "bg-emerald-500/10 text-emerald-400"
                : "bg-amber-500/10 text-amber-400"
            }`}
          >
            {place.conversation ? (
              <>
                <MessageCircle className="h-3 w-3" />
                대화 가능
              </>
            ) : (
              <>
                <VolumeOff className="h-3 w-3" />
                정숙
              </>
            )}
          </span>
        </div>

        {/* 주소 */}
        <p className="mb-2 flex items-center gap-1 text-xs text-muted-foreground">
          <MapPin className="h-3 w-3 shrink-0" />
          <span className="truncate">{place.address}</span>
        </p>

        {/* 분위기 태그 */}
        <div className="mb-2 flex flex-wrap gap-1">
          {place.atmosphere.slice(0, 3).map((tag) => (
            <span
              key={tag}
              className="rounded-md bg-secondary px-2 py-0.5 text-[11px] text-secondary-foreground"
            >
              {tag}
            </span>
          ))}
          <span className="rounded-md bg-secondary px-2 py-0.5 text-[11px] text-secondary-foreground">
            {place.price_range === "저"
              ? "💰"
              : place.price_range === "중"
              ? "💰💰"
              : "💰💰💰"}
          </span>
        </div>

        {/* 한 줄 설명 */}
        {place.description && (
          <p className="line-clamp-2 text-xs text-muted-foreground">
            {place.description}
          </p>
        )}
      </div>
    </Link>
  );
}
