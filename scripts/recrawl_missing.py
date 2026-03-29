"""
리뷰 0건 장소 재크롤링 — 검색어 커스터마이징 버전

- 기존 v2의 크롤링/검증/저장 로직 재활용
- 장소별 동네명·역 이름 기반 검색어 수동 설정
- 대상: 리뷰 0건인 9곳

사용법:
  python3.12 scripts/recrawl_missing.py
  python3.12 scripts/recrawl_missing.py --test 주책다방
"""

import sys
import os
import time
import logging
import argparse
from datetime import datetime

# v2 스크립트 임포트 (같은 디렉토리)
sys.path.insert(0, os.path.dirname(__file__))
from crawl_blog_reviews_v2 import (
    search_naver_blog,
    crawl_blog_content,
    verify_and_classify,
    save_review,
    strip_html,
    CRAWL_DELAY,
)

from supabase import create_client

# ── 설정 ──
SUPABASE_URL = "https://xbbooowddziltpphousx.supabase.co"
SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InhiYm9vb3dkZHppbHRwcGhvdXN4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzQzODc1MzQsImV4cCI6MjA4OTk2MzUzNH0.Y3Ie9-qhXZ-Kidr19swCRcDwYAKODSiuVk4vL7XUTgU"
MAX_BLOGS = 20

# ── 로깅 ──
logging.basicConfig(
    level=logging.INFO,
    format="[%(asctime)s] [%(levelname)s] %(message)s",
    datefmt="%H:%M:%S",
    handlers=[
        logging.StreamHandler(),
        logging.FileHandler(
            os.path.join(os.path.dirname(__file__), "recrawl_missing.log"),
            encoding="utf-8",
        ),
    ],
)
logger = logging.getLogger(__name__)

# ── Slack ──
sys.path.insert(0, os.path.expanduser("~/.claude"))
try:
    from utils.slack_notifier import notify_success, notify_failure
except ImportError:
    def notify_success(t, details=""): logger.info(f"[SLACK] {t}: {details}")
    def notify_failure(t, details="", error=""): logger.error(f"[SLACK] {t}: {details}")


# ═══════════════════════════════════════════
# 장소별 커스텀 검색어 (동네명·역 이름 기반)
# ═══════════════════════════════════════════

CUSTOM_QUERIES = {
    "주책다방": [
        '"주책다방" 후기',
        '"주책다방" 연남동',
        '"주책다방" 홍대',
        '"주책다방" 북카페',
        '"주책다방" 리뷰',
        '"주책다방" 술',
    ],
    "북바이북": [
        '"북바이북" 후기',
        '"북바이북" 망원동',
        '"북바이북" 합정',
        '"북바이북" 북카페',
        '"북바이북" 리뷰',
        '"북바이북" 책방',
    ],
    "엉금책방": [
        '"엉금책방" 후기',
        '"엉금책방" 신림',
        '"엉금책방" 서울대입구',
        '"엉금책방" 책방',
        '"엉금책방" 리뷰',
        '"엉금책방" 술',
    ],
    "책읽는고양이": [
        '"책읽는고양이" 후기',
        '"책읽는고양이" 혜화',
        '"책읽는고양이" 대학로',
        '"책읽는고양이" 북카페',
        '"책읽는고양이" 리뷰',
        '"책읽는고양이" 낙산',
    ],
    "셀레스트": [
        '"셀레스트" 북바',
        '"셀레스트" 신림',
        '"셀레스트" 서울대입구',
        '"셀레스트" 책방',
        '"셀레스트" 술 책',
        '"셀레스트" 북카페 관악',
    ],
    "리브레리": [
        '"리브레리" 북바',
        '"리브레리" 영등포',
        '"리브레리" 당산',
        '"리브레리" 책방',
        '"리브레리" 술 책',
        '"리브레리" 북카페',
    ],
    "바람길": [
        '"바람길" 북바',
        '"바람길" 중랑',
        '"바람길" 망우',
        '"바람길" 책방',
        '"바람길" 술 책',
        '"바람길" 북카페',
    ],
    "책잔 Book n Glass": [
        '"책잔" 이수',
        '"책잔" 사당',
        '"책잔" 북바',
        '"Book n Glass" 이수',
        '"책잔" 술 책',
        '"책잔" 리뷰',
    ],
    "초콜릿책방": [
        '"초콜릿책방" 후기',
        '"초콜릿책방" 연희동',
        '"초콜릿책방" 연남',
        '"초콜릿책방" 서대문',
        '"초콜릿책방" 리뷰',
        '"초콜릿책방" 책방',
    ],
}


def process_place(place: dict, supabase) -> dict:
    """한 장소 처리 — 커스텀 검색어로 검색 → 크롤링 → 검증 → 저장"""
    name = place["name"]
    pid = place["id"]
    address = place["address"]
    stats = {"searched": 0, "crawled": 0, "verified": 0, "saved": 0, "rejected": 0, "failed": 0}

    queries = CUSTOM_QUERIES.get(name)
    if not queries:
        logger.warning(f"  {name}: 커스텀 검색어 없음 — 건너뜀")
        return stats

    logger.info(f"  검색어: {queries}")
    blogs = search_naver_blog(queries)
    stats["searched"] = len(blogs)
    logger.info(f"  검색 결과: {len(blogs)}건 (중복 제거)")

    if not blogs:
        logger.info(f"  {name}: 검색 결과 없음")
        return stats

    for j, blog in enumerate(blogs[:MAX_BLOGS]):
        blog_url = blog["link"]
        author = strip_html(blog.get("bloggername", ""))
        postdate = blog.get("postdate", "")
        published = f"{postdate[:4]}-{postdate[4:6]}-{postdate[6:8]}" if len(postdate) == 8 else None

        time.sleep(CRAWL_DELAY)
        content = crawl_blog_content(blog_url)
        if not content:
            stats["failed"] += 1
            continue
        stats["crawled"] += 1

        ai = verify_and_classify(name, address, content)
        if not ai:
            stats["failed"] += 1
            continue

        if not ai.get("relevant", False):
            stats["rejected"] += 1
            logger.info(f"  [{j+1}/{len(blogs)}] ❌ 무관 — {blog_url}")
            continue

        stats["verified"] += 1
        is_ad = ai.get("is_ad", False)
        trust = ai.get("trust_score", 0.5)
        logger.info(f"  [{j+1}/{len(blogs)}] {'광고' if is_ad else '✅ 진심'} ({trust:.2f}) — {author}")

        review = {
            "place_id": pid,
            "source_url": blog_url,
            "author_name": author,
            "content_summary": ai.get("summary", ""),
            "trust_score": trust,
            "is_ad": is_ad,
            "pros": ai.get("pros", []),
            "cons": ai.get("cons", []),
            "published_at": published,
        }
        if save_review(supabase, review):
            stats["saved"] += 1
        else:
            stats["failed"] += 1

    return stats


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--test", type=str, help="특정 장소만 테스트 (이름 일부)")
    args = parser.parse_args()

    start_time = time.time()
    logger.info("=" * 60)
    logger.info("리뷰 0건 재크롤링 시작")
    logger.info("=" * 60)

    supabase = create_client(SUPABASE_URL, SUPABASE_ANON_KEY)

    # 대상 장소 조회
    target_names = list(CUSTOM_QUERIES.keys())
    if args.test:
        target_names = [n for n in target_names if args.test in n]
        if not target_names:
            logger.error(f"'{args.test}'에 매칭되는 장소 없음")
            return

    # DB에서 장소 정보 가져오기
    places_resp = supabase.table("places").select("id, name, address").in_("name", target_names).execute()
    places = places_resp.data
    logger.info(f"대상: {len(places)}곳 — {[p['name'] for p in places]}")

    total_stats = {"searched": 0, "crawled": 0, "verified": 0, "saved": 0, "rejected": 0, "failed": 0}

    for i, place in enumerate(places):
        logger.info(f"\n[{i+1}/{len(places)}] {place['name']}")
        stats = process_place(place, supabase)

        for k in total_stats:
            total_stats[k] += stats[k]

        logger.info(f"  결과: 검색 {stats['searched']} → 크롤링 {stats['crawled']} → 검증 {stats['verified']} → 저장 {stats['saved']} (무관 {stats['rejected']})")

    elapsed = (time.time() - start_time) / 60
    logger.info(f"\n{'=' * 60}")
    logger.info(f"재크롤링 완료 | {elapsed:.1f}분")
    logger.info(f"  검색: {total_stats['searched']} → 크롤링: {total_stats['crawled']}")
    logger.info(f"  검증 통과: {total_stats['verified']} | 무관 제거: {total_stats['rejected']}")
    logger.info(f"  DB 저장: {total_stats['saved']} | 실패: {total_stats['failed']}")
    logger.info("=" * 60)

    notify_success(
        "✅ [bookjan42] 재크롤링 완료",
        details=f"저장 {total_stats['saved']}건 / 무관 {total_stats['rejected']}건 / {elapsed:.1f}분",
    )


if __name__ == "__main__":
    main()
