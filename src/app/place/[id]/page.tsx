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
  ThumbsUp,
  ThumbsDown,
  Sparkles,
  ShieldCheck,
  ShieldAlert,
} from "lucide-react";
import type { Place, MenuItem, BlogReview } from "@/types";

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

  // 블로그 리뷰 (진심 리뷰만, 신뢰도순)
  const { data: reviewsData } = await supabase
    .from("blog_reviews")
    .select("*")
    .eq("place_id", id)
    .eq("is_ad", false)
    .order("trust_score", { ascending: false });

  const reviews = (reviewsData || []) as BlogReview[];

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
                  ? "bg-blue-500/10 text-blue-700 dark:bg-blue-400/10 dark:text-blue-400"
                  : "bg-orange-500/10 text-orange-700 dark:bg-orange-400/10 dark:text-orange-400"
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
        {/* AI 블로그 리뷰 */}
        {reviews.length === 0 ? (
          <div className="mb-8">
            <h2 className="mb-4 flex items-center gap-2 text-sm font-semibold uppercase tracking-wider text-muted-foreground">
              <Sparkles className="h-4 w-4 text-primary/60" />
              블로그 리뷰
            </h2>
            <p className="text-sm text-muted-foreground">
              아직 블로그 리뷰가 없습니다. 직접 방문 후 리뷰를 남겨주세요!
            </p>
          </div>
        ) : (
          <div className="mb-8">
            <h2 className="mb-4 flex items-center gap-2 text-sm font-semibold uppercase tracking-wider text-muted-foreground">
              <Sparkles className="h-4 w-4 text-primary/60" />
              블로그 리뷰 ({reviews.length})
            </h2>
            {reviews.length <= 3 && (
              <p className="mb-4 text-sm text-muted-foreground">
                아직 리뷰가 많지 않습니다. 더 많은 리뷰가 모이면 정확한 분석이 가능해요.
              </p>
            )}

            {/* 장단점 요약 (언급 횟수 표시) */}
            {(() => {
              const allPros = reviews.flatMap((r) => r.pros).filter(Boolean);
              const allCons = reviews.flatMap((r) => r.cons).filter(Boolean);
              const countMap = (arr: string[]) => {
                const map = new Map<string, number>();
                arr.forEach((s) => map.set(s, (map.get(s) || 0) + 1));
                return [...map.entries()].sort((a, b) => b[1] - a[1]).slice(0, 5);
              };
              const topPros = countMap(allPros);
              const topCons = countMap(allCons);

              if (topPros.length === 0 && topCons.length === 0) return null;

              return (
                <div className="mb-4 grid grid-cols-1 gap-3 sm:grid-cols-2">
                  {topPros.length > 0 && (
                    <div className="rounded-xl border border-green-500/20 bg-green-500/5 p-4">
                      <p className="mb-2 flex items-center gap-1.5 text-xs font-semibold text-green-900 dark:text-green-400">
                        <ThumbsUp className="h-3.5 w-3.5" />
                        장점
                      </p>
                      <ul className="space-y-1.5">
                        {topPros.map(([text, count]) => (
                          <li key={text} className="flex items-start gap-1.5 text-sm text-green-950 dark:text-green-300/80">
                            <span className="flex-1">{text}</span>
                            {count > 1 && (
                              <span className="shrink-0 rounded-full bg-green-500/15 px-1.5 py-0.5 text-[10px] font-semibold text-green-900 dark:text-green-400">
                                {count}명
                              </span>
                            )}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                  {topCons.length > 0 && (
                    <div className="rounded-xl border border-red-500/20 bg-red-500/5 p-4">
                      <p className="mb-2 flex items-center gap-1.5 text-xs font-semibold text-red-900 dark:text-red-400">
                        <ThumbsDown className="h-3.5 w-3.5" />
                        단점
                      </p>
                      <ul className="space-y-1.5">
                        {topCons.map(([text, count]) => (
                          <li key={text} className="flex items-start gap-1.5 text-sm text-red-950 dark:text-red-300/80">
                            <span className="flex-1">{text}</span>
                            {count > 1 && (
                              <span className="shrink-0 rounded-full bg-red-500/15 px-1.5 py-0.5 text-[10px] font-semibold text-red-900 dark:text-red-400">
                                {count}명
                              </span>
                            )}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              );
            })()}

            {/* 개별 리뷰 카드 */}
            <div className="space-y-3">
              {reviews.map((review) => (
                <div
                  key={review.id}
                  className="rounded-xl border border-border bg-card p-4 shadow-sm"
                >
                  <div className="mb-2 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      {review.author_name && (
                        <span className="text-sm font-medium text-card-foreground">
                          {review.author_name}
                        </span>
                      )}
                      {review.published_at && (
                        <span className="text-xs text-muted-foreground">
                          {review.published_at}
                        </span>
                      )}
                    </div>
                    <span
                      className={`flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-medium ${
                        review.trust_score >= 0.8
                          ? "bg-green-500/10 text-green-900 dark:text-green-400"
                          : review.trust_score >= 0.6
                          ? "bg-yellow-500/10 text-yellow-900 dark:text-yellow-400"
                          : "bg-red-500/10 text-red-900 dark:text-red-400"
                      }`}
                    >
                      {review.trust_score >= 0.8 ? (
                        <ShieldCheck className="h-3 w-3" />
                      ) : (
                        <ShieldAlert className="h-3 w-3" />
                      )}
                      신뢰도 {Math.round(review.trust_score * 100)}%
                    </span>
                  </div>

                  {review.content_summary && (
                    <p className="mb-3 text-sm leading-relaxed text-foreground/80">
                      {review.content_summary}
                    </p>
                  )}

                  {/* 개별 리뷰 장단점 */}
                  {(review.pros.length > 0 || review.cons.length > 0) && (
                    <div className="mb-3 flex flex-wrap gap-1.5">
                      {review.pros.map((pro) => (
                        <span
                          key={pro}
                          className="rounded-full bg-green-500/10 px-2 py-0.5 text-[11px] text-green-950 dark:text-green-400"
                        >
                          + {pro}
                        </span>
                      ))}
                      {review.cons.map((con) => (
                        <span
                          key={con}
                          className="rounded-full bg-red-500/10 px-2 py-0.5 text-[11px] text-red-950 dark:text-red-400"
                        >
                          - {con}
                        </span>
                      ))}
                    </div>
                  )}

                  <a
                    href={review.source_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 text-xs font-medium text-primary/70 hover:text-primary transition-colors"
                  >
                    <ExternalLink className="h-3 w-3" />
                    원문 보기
                  </a>
                </div>
              ))}
            </div>

            <p className="mt-3 text-[11px] text-muted-foreground/60">
              AI가 블로그 리뷰를 분석했습니다. 광고성 리뷰는 자동으로 제외됩니다.
            </p>
          </div>
        )}
      </main>
    </div>
  );
}
