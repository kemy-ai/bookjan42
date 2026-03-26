"use client";

import Link from "next/link";
import { MapPin, MessageCircle, VolumeOff, Clock, ChevronRight } from "lucide-react";
import type { Place } from "@/types";

interface PlaceCardProps {
  place: Place;
  isSelected?: boolean;
}

export default function PlaceCard({ place, isSelected }: PlaceCardProps) {
  const priceLabel =
    place.price_range === "저" ? "$" : place.price_range === "중" ? "$$" : "$$$";

  return (
    <Link href={`/place/${place.id}`} className="group block cursor-pointer">
      <div
        className={`rounded-2xl border p-4 transition-all duration-200 group-hover:border-primary/40 group-hover:shadow-md ${
          isSelected
            ? "border-primary/60 bg-primary/5 shadow-sm"
            : "border-border bg-card"
        }`}
      >
        {/* 상단: 이름 + 배지 */}
        <div className="mb-3 flex items-start justify-between gap-2">
          <h3 className="text-[15px] font-semibold leading-snug text-card-foreground group-hover:text-primary transition-colors duration-200">
            {place.name}
          </h3>
          <span
            className={`flex shrink-0 items-center gap-1 rounded-full px-2.5 py-1 text-[11px] font-medium ${
              place.conversation
                ? "bg-blue-500/10 text-blue-700 dark:bg-blue-400/10 dark:text-blue-400"
                : "bg-orange-500/10 text-orange-700 dark:bg-orange-400/10 dark:text-orange-400"
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
        <p className="mb-2 flex items-center gap-1.5 text-xs text-muted-foreground">
          <MapPin className="h-3 w-3 shrink-0 text-primary/60" />
          <span className="truncate">{place.address}</span>
        </p>

        {/* 운영시간 */}
        {place.hours && (
          <p className="mb-2 flex items-center gap-1.5 text-xs text-muted-foreground">
            <Clock className="h-3 w-3 shrink-0 text-primary/60" />
            <span className="truncate">{place.hours}</span>
          </p>
        )}

        {/* 분위기 태그 + 가격대 */}
        <div className="mb-3 flex flex-wrap gap-1.5">
          {place.atmosphere.slice(0, 3).map((tag) => (
            <span
              key={tag}
              className="rounded-full bg-secondary px-2.5 py-0.5 text-[11px] font-medium text-secondary-foreground"
            >
              {tag}
            </span>
          ))}
          <span className="rounded-full bg-primary/10 px-2.5 py-0.5 text-[11px] font-semibold text-primary">
            {priceLabel}
          </span>
        </div>

        {/* 한 줄 설명 + 상세보기 */}
        {place.description && (
          <p className="mb-2 line-clamp-2 text-xs leading-relaxed text-muted-foreground">
            {place.description}
          </p>
        )}

        <div className="flex items-center gap-0.5 text-xs font-medium text-primary/70 group-hover:text-primary transition-colors duration-200">
          상세보기
          <ChevronRight className="h-3 w-3" />
        </div>
      </div>
    </Link>
  );
}
