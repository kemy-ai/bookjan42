import { createClient } from "@/lib/supabase/server";
import { notFound } from "next/navigation";
import Link from "next/link";
import {
  ArrowLeft,
  MapPin,
  Clock,
  Phone,
  ExternalLink,
  MessageCircle,
  VolumeOff,
  Instagram,
  CalendarOff,
} from "lucide-react";
import type { Place, MenuItem } from "@/types";

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function PlaceDetail({ params }: PageProps) {
  const { id } = await params;
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("places")
    .select("*")
    .eq("id", id)
    .single();

  if (error || !data) {
    notFound();
  }

  const place = data as Place & {
    closed_days?: string | null;
    instagram_url?: string | null;
    naver_place_url?: string | null;
  };

  return (
    <div className="flex-1 overflow-y-auto bg-background">
      {/* 뒤로가기 바 */}
      <div className="border-b border-border bg-background px-4 py-2">
        <div className="mx-auto flex max-w-2xl items-center gap-3">
          <Link
            href="/"
            className="flex items-center gap-1.5 rounded-md px-2 py-1.5 text-sm text-muted-foreground hover:bg-accent hover:text-foreground transition-colors"
          >
            <ArrowLeft className="h-4 w-4" />
            목록으로
          </Link>
        </div>
      </div>

      <main className="mx-auto max-w-2xl px-4 py-6">
        {/* 장소명 */}
        <h2 className="mb-3 text-2xl font-bold text-foreground">
          {place.name}
        </h2>

        {/* 대화 가능 여부 + 가격대 */}
        <div className="mb-4 flex flex-wrap gap-2">
          <span
            className={`flex items-center gap-1.5 rounded-full px-3 py-1 text-sm ${
              place.conversation
                ? "bg-emerald-500/10 text-emerald-400"
                : "bg-amber-500/10 text-amber-400"
            }`}
          >
            {place.conversation ? (
              <>
                <MessageCircle className="h-4 w-4" />
                대화 가능
              </>
            ) : (
              <>
                <VolumeOff className="h-4 w-4" />
                정숙
              </>
            )}
          </span>
          <span className="rounded-full bg-secondary px-3 py-1 text-sm text-secondary-foreground">
            {place.price_range === "저"
              ? "💰 저렴한"
              : place.price_range === "중"
              ? "💰💰 보통"
              : "💰💰💰 비싼"}
          </span>
        </div>

        {/* 설명 */}
        {place.description && (
          <p className="mb-6 text-sm leading-relaxed text-foreground">
            {place.description}
          </p>
        )}

        {/* 정보 카드 */}
        <div className="mb-6 space-y-3 rounded-lg border border-border bg-card p-4">
          <div className="flex items-start gap-3">
            <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground" />
            <span className="text-sm">{place.address}</span>
          </div>

          {place.hours && (
            <div className="flex items-start gap-3">
              <Clock className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground" />
              <span className="text-sm whitespace-pre-line">{place.hours}</span>
            </div>
          )}

          {place.closed_days && (
            <div className="flex items-start gap-3">
              <CalendarOff className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground" />
              <span className="text-sm text-amber-400">
                휴무: {place.closed_days}
              </span>
            </div>
          )}

          {place.phone && (
            <div className="flex items-start gap-3">
              <Phone className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground" />
              <a
                href={`tel:${place.phone}`}
                className="text-sm text-primary hover:underline"
              >
                {place.phone}
              </a>
            </div>
          )}

          {place.instagram_url && (
            <div className="flex items-start gap-3">
              <Instagram className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground" />
              <a
                href={place.instagram_url}
                target="_blank"
                rel="noopener noreferrer"
                className="text-sm text-primary hover:underline"
              >
                인스타그램
              </a>
            </div>
          )}

          {place.naver_place_url && (
            <div className="flex items-start gap-3">
              <ExternalLink className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground" />
              <a
                href={place.naver_place_url}
                target="_blank"
                rel="noopener noreferrer"
                className="text-sm text-primary hover:underline"
              >
                네이버 플레이스
              </a>
            </div>
          )}

          {place.website && !place.instagram_url && (
            <div className="flex items-start gap-3">
              <ExternalLink className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground" />
              <a
                href={place.website}
                target="_blank"
                rel="noopener noreferrer"
                className="text-sm text-primary hover:underline"
              >
                웹사이트
              </a>
            </div>
          )}
        </div>

        {/* 분위기 태그 */}
        {place.atmosphere.length > 0 && (
          <div className="mb-6">
            <h3 className="mb-2 text-sm font-semibold text-foreground">
              분위기
            </h3>
            <div className="flex flex-wrap gap-2">
              {place.atmosphere.map((tag) => (
                <span
                  key={tag}
                  className="rounded-lg bg-secondary px-3 py-1.5 text-sm text-secondary-foreground"
                >
                  {tag}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* 메뉴 */}
        {place.menus && place.menus.length > 0 && (
          <div className="mb-6">
            <h3 className="mb-2 text-sm font-semibold text-foreground">
              대표 메뉴
            </h3>
            <div className="space-y-2 rounded-lg border border-border bg-card p-4">
              {place.menus.map((menu: MenuItem, i: number) => (
                <div
                  key={i}
                  className="flex items-center justify-between text-sm"
                >
                  <span className="text-foreground">{menu.name}</span>
                  <span className="font-mono text-xs text-muted-foreground">
                    {menu.price > 0
                      ? `${menu.price.toLocaleString()}원`
                      : "포함"}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
