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
  Wine,
  BookOpen,
  Navigation,
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

  const place = data as Place;

  const priceLabel =
    place.price_range === "저"
      ? { text: "$", desc: "저렴한 편" }
      : place.price_range === "중"
      ? { text: "$$", desc: "보통" }
      : { text: "$$$", desc: "비싼 편" };

  const kakaoMapUrl = `https://map.kakao.com/link/to/${encodeURIComponent(place.name)},${place.lat},${place.lng}`;

  return (
    <div className="flex-1 overflow-y-auto bg-background">
      {/* 상단 네비게이션 */}
      <div className="sticky top-0 z-10 border-b border-border bg-background/80 backdrop-blur-md px-4 py-3">
        <div className="mx-auto flex max-w-2xl items-center">
          <Link
            href="/"
            className="flex items-center gap-1.5 rounded-xl px-3 py-2 text-sm font-medium text-muted-foreground hover:bg-secondary hover:text-foreground transition-all duration-200"
          >
            <ArrowLeft className="h-4 w-4" />
            목록으로
          </Link>
        </div>
      </div>

      <main className="mx-auto max-w-2xl px-4 py-8">
        {/* 헤더 섹션 */}
        <div className="mb-8">
          {/* 장소 이름 */}
          <h1 className="mb-4 text-3xl font-bold tracking-tight text-foreground">
            {place.name}
          </h1>

          {/* 배지 그룹 */}
          <div className="flex flex-wrap items-center gap-2">
            <span
              className={`flex items-center gap-1.5 rounded-full px-3.5 py-1.5 text-sm font-medium ${
                place.conversation
                  ? "bg-blue-500/10 text-blue-600 dark:bg-blue-400/10 dark:text-blue-400"
                  : "bg-orange-500/10 text-orange-600 dark:bg-orange-400/10 dark:text-orange-400"
              }`}
            >
              {place.conversation ? (
                <>
                  <MessageCircle className="h-3.5 w-3.5" />
                  대화 가능
                </>
              ) : (
                <>
                  <VolumeOff className="h-3.5 w-3.5" />
                  정숙
                </>
              )}
            </span>
            <span className="flex items-center gap-1.5 rounded-full bg-primary/10 px-3.5 py-1.5 text-sm font-semibold text-primary">
              {priceLabel.text}
              <span className="font-normal text-primary/70">
                {priceLabel.desc}
              </span>
            </span>
          </div>
        </div>

        {/* 설명 */}
        {place.description && (
          <div className="mb-8">
            <p className="text-[15px] leading-relaxed text-foreground/85">
              {place.description}
            </p>
          </div>
        )}

        {/* 기본 정보 카드 */}
        <div className="mb-8 rounded-2xl border border-border bg-card p-6 shadow-sm">
          <h2 className="mb-4 flex items-center gap-2 text-sm font-semibold uppercase tracking-wider text-muted-foreground">
            <BookOpen className="h-4 w-4 text-primary/60" />
            기본 정보
          </h2>
          <div className="space-y-4">
            {/* 주소 */}
            <div className="flex items-start gap-3">
              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-primary/10">
                <MapPin className="h-4 w-4 text-primary" />
              </div>
              <div className="flex-1 pt-1">
                <p className="text-sm text-foreground">{place.address}</p>
                <a
                  href={kakaoMapUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="mt-1 inline-flex items-center gap-1 text-xs font-medium text-primary hover:text-primary/80 transition-colors"
                >
                  <Navigation className="h-3 w-3" />
                  길찾기
                </a>
              </div>
            </div>

            {/* 운영시간 */}
            {place.hours && (
              <div className="flex items-start gap-3">
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-primary/10">
                  <Clock className="h-4 w-4 text-primary" />
                </div>
                <div className="flex-1 pt-1">
                  <p className="whitespace-pre-line text-sm text-foreground">
                    {place.hours}
                  </p>
                </div>
              </div>
            )}

            {/* 휴무일 */}
            {place.closed_days && (
              <div className="flex items-start gap-3">
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-destructive/10">
                  <CalendarOff className="h-4 w-4 text-destructive" />
                </div>
                <div className="flex-1 pt-1">
                  <p className="text-sm font-medium text-destructive">
                    휴무: {place.closed_days}
                  </p>
                </div>
              </div>
            )}

            {/* 전화 */}
            {place.phone && (
              <div className="flex items-start gap-3">
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-primary/10">
                  <Phone className="h-4 w-4 text-primary" />
                </div>
                <div className="flex-1 pt-1">
                  <a
                    href={`tel:${place.phone}`}
                    className="text-sm font-medium text-primary hover:text-primary/80 transition-colors"
                  >
                    {place.phone}
                  </a>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* 분위기 */}
        {place.atmosphere.length > 0 && (
          <div className="mb-8">
            <h2 className="mb-3 text-sm font-semibold uppercase tracking-wider text-muted-foreground">
              분위기
            </h2>
            <div className="flex flex-wrap gap-2">
              {place.atmosphere.map((tag) => (
                <span
                  key={tag}
                  className="rounded-full bg-secondary px-4 py-2 text-sm font-medium text-secondary-foreground"
                >
                  {tag}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* 대표 메뉴 */}
        {place.menus && place.menus.length > 0 && (
          <div className="mb-8">
            <h2 className="mb-3 flex items-center gap-2 text-sm font-semibold uppercase tracking-wider text-muted-foreground">
              <Wine className="h-4 w-4 text-primary/60" />
              대표 메뉴
            </h2>
            <div className="rounded-2xl border border-border bg-card shadow-sm">
              {place.menus.map((menu: MenuItem, i: number) => (
                <div
                  key={i}
                  className={`flex items-center justify-between px-5 py-3.5 ${
                    i < place.menus.length - 1
                      ? "border-b border-border"
                      : ""
                  }`}
                >
                  <span className="text-sm font-medium text-card-foreground">
                    {menu.name}
                  </span>
                  <span className="font-mono text-sm tabular-nums text-muted-foreground">
                    {menu.price > 0
                      ? `${menu.price.toLocaleString()}원`
                      : "포함"}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* 외부 링크 */}
        {(place.instagram_url ||
          place.naver_place_url ||
          place.website) && (
          <div className="mb-8">
            <h2 className="mb-3 text-sm font-semibold uppercase tracking-wider text-muted-foreground">
              링크
            </h2>
            <div className="flex flex-wrap gap-2">
              {place.instagram_url && (
                <a
                  href={place.instagram_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 rounded-xl border border-border bg-card px-4 py-2.5 text-sm font-medium text-card-foreground hover:border-primary/40 hover:text-primary transition-all duration-200"
                >
                  <Instagram className="h-4 w-4" />
                  인스타그램
                </a>
              )}
              {place.naver_place_url && (
                <a
                  href={place.naver_place_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 rounded-xl border border-border bg-card px-4 py-2.5 text-sm font-medium text-card-foreground hover:border-primary/40 hover:text-primary transition-all duration-200"
                >
                  <ExternalLink className="h-4 w-4" />
                  네이버 플레이스
                </a>
              )}
              {place.website && !place.instagram_url && (
                <a
                  href={place.website}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 rounded-xl border border-border bg-card px-4 py-2.5 text-sm font-medium text-card-foreground hover:border-primary/40 hover:text-primary transition-all duration-200"
                >
                  <ExternalLink className="h-4 w-4" />
                  웹사이트
                </a>
              )}
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
