"""
블로그 크롤링 v2 — 대량 수집 + 콘텐츠 검증 + 토큰 관리 + 자동 재시작

개선사항 (v1 대비):
  - 장소당 15~20건 목표 (검색어 다양화)
  - AI 검증: "이 리뷰가 해당 장소에 대한 것인가?" 필터
  - 중단/재시작: progress.json으로 상태 저장
  - 토큰 한도 감지: claude -p 실패 시 대기 후 재시도
  - 주소 기반 검색어로 동명이인 문제 해결

사용법:
  nohup python3.12 scripts/crawl_blog_reviews_v2.py &
  python3.12 scripts/crawl_blog_reviews_v2.py --test 책익다
"""

import os
import sys
import json
import time
import re
import subprocess
import logging
import argparse
import requests
from pathlib import Path
from datetime import datetime

from scrapling import Fetcher
from supabase import create_client

# ── 경로 ──
SCRIPT_DIR = Path(__file__).parent
PROGRESS_FILE = SCRIPT_DIR / "crawl_progress.json"
LOG_FILE = SCRIPT_DIR / "crawl_v2.log"

# ── 로깅 ──
logging.basicConfig(
    level=logging.INFO,
    format="[%(asctime)s] [%(levelname)s] %(message)s",
    datefmt="%H:%M:%S",
    handlers=[logging.StreamHandler(), logging.FileHandler(LOG_FILE, encoding="utf-8")],
)
logger = logging.getLogger(__name__)

# ── 설정 ──
SUPABASE_URL = "https://xbbooowddziltpphousx.supabase.co"
SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InhiYm9vb3dkZHppbHRwcGhvdXN4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzQzODc1MzQsImV4cCI6MjA4OTk2MzUzNH0.Y3Ie9-qhXZ-Kidr19swCRcDwYAKODSiuVk4vL7XUTgU"
NAVER_ID = os.environ.get("NAVER_CLIENT_ID", "cdlAt4j269eNva0ApUKb")
NAVER_SECRET = os.environ.get("NAVER_CLIENT_SECRET", "0h03gXvTLJ")

MAX_BLOGS_PER_PLACE = 20
NAVER_DISPLAY = 20
CRAWL_DELAY = 1.0
TOKEN_COOLDOWN = 300  # 토큰 한도 시 5분 대기
TOKEN_MAX_RETRIES = 12  # 최대 1시간 대기 (5분 x 12)

# ── Slack ──
sys.path.insert(0, os.path.expanduser("~/.claude"))
try:
    from utils.slack_notifier import notify_success, notify_failure, notify_warning
except ImportError:
    def notify_success(t, details=""): logger.info(f"[SLACK] {t}: {details}")
    def notify_failure(t, details="", error=""): logger.error(f"[SLACK] {t}: {details}")
    def notify_warning(t, details=""): logger.warning(f"[SLACK] {t}: {details}")


# ═══════════════════════════════════════════
# 진행 상태 관리
# ═══════════════════════════════════════════

def load_progress() -> dict:
    """진행 상태 로드 (중단 재시작용)"""
    if PROGRESS_FILE.exists():
        return json.loads(PROGRESS_FILE.read_text())
    return {"completed_places": [], "stats": {"searched": 0, "crawled": 0, "verified": 0, "saved": 0, "rejected": 0, "failed": 0}}

def save_progress(progress: dict):
    """진행 상태 저장"""
    PROGRESS_FILE.write_text(json.dumps(progress, ensure_ascii=False, indent=2))


# ═══════════════════════════════════════════
# 주소에서 동네 추출
# ═══════════════════════════════════════════

def extract_neighborhood(address: str) -> str:
    """주소에서 동네명/구명 추출"""
    # "서울 마포구 동교로23길 40 지하" → "마포구"
    parts = address.replace(",", " ").split()
    for p in parts:
        if p.endswith(("구", "군", "시")):
            return p
    return parts[1] if len(parts) > 1 else ""

def extract_dong(address: str) -> str:
    """주소에서 동 이름 추출"""
    # "서울 마포구 동교로25길 70 (연남동, 서강빌딩)" → "연남동"
    m = re.search(r"\(([^)]*동)", address)
    if m:
        return m.group(1)
    # "서울 마포구 연남동" → "연남동"
    parts = address.replace(",", " ").split()
    for p in parts:
        if p.endswith("동") and len(p) >= 2:
            return p
    return ""

def generate_search_queries(name: str, address: str) -> list[str]:
    """장소별 다양한 검색어 생성"""
    # 이름 정규화 (쉼표, 특수문자 제거)
    clean_name = name.replace(",", "").replace("&", " ").strip()
    # "책,익다" → "책익다"
    compact_name = re.sub(r"[,\s]+", "", name)

    gu = extract_neighborhood(address)
    dong = extract_dong(address)

    queries = []

    # 기본: 정확한 이름 + 후기
    queries.append(f'"{clean_name}" 후기')

    # 컴팩트 이름이 다르면 추가
    if compact_name != clean_name:
        queries.append(f'"{compact_name}" 후기')

    # 이름 + 동네
    if dong:
        queries.append(f'"{clean_name}" {dong}')
    elif gu:
        queries.append(f'"{clean_name}" {gu}')

    # 이름 + 북바/책방
    queries.append(f'"{clean_name}" 북바')
    queries.append(f'"{clean_name}" 책방')

    # 이름 + 방문
    queries.append(f'"{clean_name}" 방문')

    return queries[:6]  # 최대 6개 검색어


# ═══════════════════════════════════════════
# 네이버 블로그 검색
# ═══════════════════════════════════════════

def search_naver_blog(queries: list[str]) -> list[dict]:
    """여러 검색어로 네이버 블로그 검색 (중복 제거)"""
    headers = {"X-Naver-Client-Id": NAVER_ID, "X-Naver-Client-Secret": NAVER_SECRET}
    all_items = []
    seen_urls = set()

    for q in queries:
        try:
            resp = requests.get(
                "https://openapi.naver.com/v1/search/blog.json",
                headers=headers,
                params={"query": q, "display": NAVER_DISPLAY, "sort": "sim"},
                timeout=10,
            )
            resp.raise_for_status()
            for item in resp.json().get("items", []):
                link = item.get("link", "")
                if "blog.naver.com" in link and link not in seen_urls:
                    seen_urls.add(link)
                    all_items.append(item)
        except requests.RequestException as e:
            logger.warning(f"  검색 실패 [{q}]: {e}")
        time.sleep(0.3)  # API rate limit

    return all_items[:MAX_BLOGS_PER_PLACE]


# ═══════════════════════════════════════════
# 블로그 본문 크롤링
# ═══════════════════════════════════════════

def crawl_blog_content(blog_url: str) -> str | None:
    """블로그 본문 크롤링"""
    mobile_url = blog_url.replace("blog.naver.com", "m.blog.naver.com")
    try:
        page = Fetcher.get(mobile_url, timeout=15)
        for sel in ["div.se-main-container", "div#postViewArea", "div.post_ct"]:
            results = page.css(sel)
            if results:
                text = results[0].get_all_text(separator="\n", strip=True)
                if len(text) >= 80:
                    return text[:4000]  # v2: 4000자로 확대
        return None
    except Exception as e:
        logger.debug(f"  크롤링 실패: {e}")
        return None


# ═══════════════════════════════════════════
# AI 검증 + 분류 (claude -p, 토큰 관리)
# ═══════════════════════════════════════════

def call_claude(prompt: str, retries: int = 0) -> str | None:
    """claude -p 호출 (토큰 한도 시 대기 후 재시도)"""
    try:
        result = subprocess.run(
            ["claude", "-p", "--model", "claude-haiku-4-5-20251001", prompt],
            capture_output=True, text=True, timeout=60,
        )
        output = result.stdout.strip()
        stderr = result.stderr.strip()

        # 토큰 한도 감지
        if "rate limit" in stderr.lower() or "overloaded" in stderr.lower() or (result.returncode != 0 and not output):
            if retries >= TOKEN_MAX_RETRIES:
                logger.error(f"  토큰 한도 {TOKEN_MAX_RETRIES}회 재시도 초과 — 중단")
                notify_warning("[bookjan42] 크롤링 토큰 한도 초과", details=f"{TOKEN_MAX_RETRIES}회 재시도 후 중단")
                return None
            wait_min = TOKEN_COOLDOWN // 60
            logger.info(f"  ⏸ 토큰 한도 도달 — {wait_min}분 대기 후 재시도 ({retries+1}/{TOKEN_MAX_RETRIES})")
            if retries == 0:
                notify_warning("[bookjan42] 토큰 한도 도달", details=f"{wait_min}분 대기 후 재시도")
            time.sleep(TOKEN_COOLDOWN)
            return call_claude(prompt, retries + 1)

        if not output:
            return None
        return output

    except subprocess.TimeoutExpired:
        logger.warning("  claude -p 타임아웃")
        return None
    except Exception as e:
        logger.warning(f"  claude -p 에러: {e}")
        return None


def parse_json(text: str) -> dict | None:
    """AI 응답에서 JSON 추출"""
    if not text:
        return None
    # 코드블록 제거
    if "```" in text:
        match = re.search(r"```(?:json)?\s*(\{.*?\})\s*```", text, re.DOTALL)
        if match:
            text = match.group(1)
    # { } 추출
    start = text.find("{")
    end = text.rfind("}") + 1
    if start >= 0 and end > start:
        try:
            return json.loads(text[start:end])
        except json.JSONDecodeError:
            pass
    return None


def verify_and_classify(place_name: str, address: str, blog_text: str) -> dict | None:
    """AI로 검증 + 분류를 한 번에 수행"""
    prompt = f"""다음 블로그 글이 "{place_name}" ({address})에 대한 실제 방문 리뷰인지 판단하고, 맞다면 분석해주세요.

<blog>
{blog_text}
</blog>

반드시 아래 JSON만 응답하세요. 설명 없이 순수 JSON:
{{"relevant": true/false, "is_ad": true/false, "trust_score": 0.0~1.0, "summary": "2~3문장 요약", "pros": ["장점"], "cons": ["단점"]}}

판단 기준:
- relevant: 이 글이 "{place_name}" ({address}) 방문/경험에 대한 것인가? 다른 장소, 다른 주제면 false
- is_ad: 협찬/제공/초대/체험단, 과도한 칭찬만+단점 없음, 홍보성 → true
- trust_score: 0.0(광고)~1.0(매우 신뢰). 구체적 방문 경험, 사진 묘사, 솔직한 장단점 있으면 높게
- relevant이 false면 나머지 필드는 기본값(is_ad:false, trust_score:0, summary:"", pros:[], cons:[])

**장단점 추출 핵심 규칙:**
- 블로그 글에서 실제로 언급한 장단점만 추출하라. 언급하지 않은 것을 장단점으로 만들지 마라.
- 단점이 없으면 cons는 빈 배열 []로 두라. "단점 언급 없음", "사진 미포함", "정보 부족" 같은 것은 단점이 아니다.
- 장점이 없으면 pros는 빈 배열 []로 두라. 억지로 만들지 마라.
- "가격대 정보 부재", "혼잡도 정보 없음" 등 블로그에서 다루지 않은 주제를 단점으로 넣지 마라.
- 블로거 개인 사정(거리가 멀다, 자주 방문 어렵다)은 장단점에서 제외하라."""

    output = call_claude(prompt)
    return parse_json(output)


# ═══════════════════════════════════════════
# DB 저장
# ═══════════════════════════════════════════

def save_review(supabase, data: dict) -> bool:
    """리뷰 저장 (중복 시 업데이트)"""
    try:
        supabase.table("blog_reviews").upsert(data, on_conflict="source_url").execute()
        return True
    except Exception as e:
        logger.warning(f"  저장 실패: {e}")
        return False


def strip_html(text: str) -> str:
    return re.sub(r"<[^>]+>", "", text)


# ═══════════════════════════════════════════
# 메인 루프
# ═══════════════════════════════════════════

def process_place(place: dict, supabase) -> dict:
    """한 장소 처리 — 검색 → 크롤링 → 검증+분류 → 저장"""
    name, pid, address = place["name"], place["id"], place["address"]
    stats = {"searched": 0, "crawled": 0, "verified": 0, "saved": 0, "rejected": 0, "failed": 0}

    # 1. 검색어 생성 + 검색
    queries = generate_search_queries(name, address)
    logger.info(f"  검색어: {queries}")
    blogs = search_naver_blog(queries)
    stats["searched"] = len(blogs)
    logger.info(f"  검색 결과: {len(blogs)}건 (중복 제거)")

    if not blogs:
        return stats

    for j, blog in enumerate(blogs):
        blog_url = blog["link"]
        author = strip_html(blog.get("bloggername", ""))
        postdate = blog.get("postdate", "")
        published = f"{postdate[:4]}-{postdate[4:6]}-{postdate[6:8]}" if len(postdate) == 8 else None

        # 2. 크롤링
        time.sleep(CRAWL_DELAY)
        content = crawl_blog_content(blog_url)
        if not content:
            stats["failed"] += 1
            continue
        stats["crawled"] += 1

        # 3. AI 검증 + 분류
        ai = verify_and_classify(name, address, content)
        if not ai:
            stats["failed"] += 1
            continue

        # 관련성 체크
        if not ai.get("relevant", False):
            stats["rejected"] += 1
            logger.info(f"  [{j+1}/{len(blogs)}] ❌ 무관 — {blog_url}")
            continue

        stats["verified"] += 1
        is_ad = ai.get("is_ad", False)
        trust = ai.get("trust_score", 0.5)
        logger.info(f"  [{j+1}/{len(blogs)}] {'광고' if is_ad else '✅ 진심'} ({trust:.2f}) — {author}")

        # 4. 저장
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
    parser.add_argument("--reset", action="store_true", help="진행 상태 초기화")
    args = parser.parse_args()

    if args.reset and PROGRESS_FILE.exists():
        PROGRESS_FILE.unlink()
        logger.info("진행 상태 초기화 완료")

    supabase = create_client(SUPABASE_URL, SUPABASE_ANON_KEY)
    places = supabase.table("places").select("id, name, address").execute().data
    logger.info(f"총 {len(places)}곳")

    # 진행 상태 로드
    progress = load_progress()
    completed = set(progress["completed_places"])
    total_stats = progress["stats"]

    # 테스트 모드
    if args.test:
        places = [p for p in places if args.test in p["name"]]
        if not places:
            logger.error(f"'{args.test}' 장소를 찾을 수 없습니다")
            return
        completed = set()  # 테스트는 항상 실행

    remaining = [p for p in places if p["id"] not in completed]
    logger.info(f"남은 장소: {len(remaining)}곳 (완료: {len(completed)}곳)")

    if not remaining:
        logger.info("모든 장소 처리 완료!")
        return

    notify_success("[bookjan42] 크롤링 v2 시작", details=f"대상 {len(remaining)}곳 / 완료 {len(completed)}곳")
    start_time = time.time()

    for i, place in enumerate(remaining):
        logger.info(f"\n{'='*50}")
        logger.info(f"[{i+1}/{len(remaining)}] {place['name']} ({place['address']})")
        logger.info(f"{'='*50}")

        stats = process_place(place, supabase)

        # 통계 누적
        for k in stats:
            total_stats[k] = total_stats.get(k, 0) + stats[k]

        # 진행 저장
        progress["completed_places"].append(place["id"])
        progress["stats"] = total_stats
        save_progress(progress)

        logger.info(f"  결과: 검색 {stats['searched']} → 크롤링 {stats['crawled']} → 검증 {stats['verified']} → 저장 {stats['saved']} (무관 {stats['rejected']})")

        # 5곳마다 중간 보고
        done = len(completed) + i + 1
        if (i + 1) % 5 == 0:
            elapsed = (time.time() - start_time) / 60
            notify_success(
                f"[bookjan42] 크롤링 중간 보고 ({done}/{len(places)})",
                details=f"저장 {total_stats['saved']}건 / 무관 {total_stats['rejected']}건 / {elapsed:.0f}분 경과"
            )

    # 완료
    elapsed = (time.time() - start_time) / 60
    logger.info(f"\n{'='*60}")
    logger.info(f"크롤링 v2 완료 | {elapsed:.1f}분")
    logger.info(f"  검색: {total_stats['searched']} → 크롤링: {total_stats['crawled']}")
    logger.info(f"  검증 통과: {total_stats['verified']} | 무관 제거: {total_stats['rejected']}")
    logger.info(f"  DB 저장: {total_stats['saved']} | 실패: {total_stats['failed']}")
    logger.info(f"{'='*60}")

    notify_success(
        "[bookjan42] 크롤링 v2 완료",
        details=f"저장 {total_stats['saved']}건 / 무관 제거 {total_stats['rejected']}건 / {elapsed:.1f}분"
    )

    # 완료 시 진행 파일 삭제
    if PROGRESS_FILE.exists():
        PROGRESS_FILE.unlink()


if __name__ == "__main__":
    main()
