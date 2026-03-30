#!/usr/bin/env python3.12
"""
bookjan42 리뷰 교차 분석 스크립트

역할: blog_reviews의 개별 리뷰를 장소별로 교차 분석하여,
블로거 신뢰도 가중치 적용 + 공통 장단점 추출 + 개인 호불호 분리.
결과를 blogger_profiles, place_insights 테이블에 저장.

실행법: python3.12 scripts/analyze_reviews.py
환경변수: .env.local 에서 SUPABASE_URL, SUPABASE_KEY 로드
"""

import json
import logging
import os
import subprocess
import sys
import time
from collections import defaultdict
from datetime import datetime
from pathlib import Path
from urllib.parse import urlparse

# 글로벌 Slack 알림 모듈
sys.path.insert(0, os.path.expanduser("~/.claude"))
try:
    from utils.slack_notifier import notify_success, notify_failure, notify_warning
    HAS_SLACK = True
except ImportError:
    HAS_SLACK = False
    def notify_success(title, details=""): pass
    def notify_failure(title, details="", error=""): pass
    def notify_warning(title, details=""): pass

from supabase import create_client, Client

# --- 로깅 설정 ---
LOG_DIR = Path(__file__).parent
LOG_FILE = LOG_DIR / "analyze_reviews.log"

logging.basicConfig(
    level=logging.INFO,
    format="[%(asctime)s] [%(levelname)s] [analyzer] %(message)s",
    datefmt="%Y-%m-%d %H:%M:%S",
    handlers=[
        logging.FileHandler(LOG_FILE, encoding="utf-8"),
        logging.StreamHandler()
    ]
)
logger = logging.getLogger(__name__)


# --- Supabase 클라이언트 ---
def get_supabase() -> Client:
    """Supabase 클라이언트 생성. .env.local에서 환경변수 로드."""
    env_path = Path(__file__).parent.parent / ".env.local"
    if env_path.exists():
        for line in env_path.read_text().splitlines():
            line = line.strip()
            if line and not line.startswith("#") and "=" in line:
                key, _, value = line.partition("=")
                value = value.strip().strip('"').strip("'")
                os.environ.setdefault(key.strip(), value)

    url = os.environ.get("NEXT_PUBLIC_SUPABASE_URL")
    key = os.environ.get("NEXT_PUBLIC_SUPABASE_ANON_KEY")
    if not url or not key:
        raise RuntimeError("SUPABASE_URL 또는 SUPABASE_KEY가 설정되지 않음")
    return create_client(url, key)


# --- 블로거 신뢰도 산정 ---
def calculate_blogger_profiles(reviews: list[dict]) -> dict[str, dict]:
    """
    블로거별 신뢰도를 산정한다.
    신뢰도 = (1 - 광고비율) × 0.3 + 장단점균형 × 0.3 + 구체성 × 0.2 + 평균신뢰도 × 0.2

    입력: blog_reviews 전체 리스트
    출력: {blog_domain: {profile_data}} 딕셔너리
    """
    blogger_reviews: dict[str, list[dict]] = defaultdict(list)

    for r in reviews:
        # 블로거 식별: source_url의 도메인 + 경로 첫 세그먼트 (블로그 ID)
        parsed = urlparse(r["source_url"])
        blog_id = parsed.netloc
        path_parts = parsed.path.strip("/").split("/")
        if path_parts and path_parts[0]:
            blog_id = f"{parsed.netloc}/{path_parts[0]}"
        blogger_reviews[blog_id].append(r)

    profiles = {}
    for blog_id, revs in blogger_reviews.items():
        total = len(revs)
        ad_count = sum(1 for r in revs if r.get("is_ad", False))
        ad_ratio = ad_count / total if total > 0 else 0

        # 장단점 균형: pros와 cons 모두 있는 리뷰 비율
        balanced = sum(1 for r in revs if r.get("pros") and r.get("cons")) / total if total > 0 else 0

        # 구체성: content_summary 길이 기반 (100자 이상이면 구체적)
        avg_length = sum(len(r.get("content_summary", "") or "") for r in revs) / total if total > 0 else 0
        specificity = min(avg_length / 150, 1.0)  # 150자 이상이면 만점

        # 평균 trust_score
        avg_trust = sum(r.get("trust_score", 0) for r in revs) / total if total > 0 else 0

        # 종합 신뢰도
        reliability = (
            (1 - ad_ratio) * 0.3
            + balanced * 0.3
            + specificity * 0.2
            + avg_trust * 0.2
        )

        author_names = [r.get("author_name") for r in revs if r.get("author_name")]
        author_name = author_names[0] if author_names else None

        profiles[blog_id] = {
            "blog_url": blog_id,
            "author_name": author_name,
            "review_count": total,
            "avg_trust_score": round(avg_trust, 3),
            "ad_ratio": round(ad_ratio, 3),
            "balance_score": round(balanced, 3),
            "specificity_score": round(specificity, 3),
            "reliability_score": round(reliability, 3),
        }

    return profiles


# --- Claude AI 교차 분석 ---
def analyze_place_with_claude(place_name: str, reviews: list[dict], profiles: dict[str, dict]) -> dict | None:
    """
    Claude를 사용하여 장소의 리뷰를 교차 분석한다.
    CLI 하이브리드 패턴: Python(I/O) → Claude(텍스트 분석) → Python(저장)

    입력: 장소명, 해당 장소 리뷰 목록, 블로거 프로필
    출력: 분석 결과 딕셔너리 또는 None (실패 시)
    """
    # 리뷰 데이터 구성
    review_lines = []
    for r in reviews:
        parsed = urlparse(r["source_url"])
        blog_id = parsed.netloc
        path_parts = parsed.path.strip("/").split("/")
        if path_parts and path_parts[0]:
            blog_id = f"{parsed.netloc}/{path_parts[0]}"

        profile = profiles.get(blog_id, {})
        reliability = profile.get("reliability_score", 0.5)

        pros_str = ", ".join(r.get("pros", [])) if r.get("pros") else "없음"
        cons_str = ", ".join(r.get("cons", [])) if r.get("cons") else "없음"
        date_str = r.get("published_at", "날짜 불명")

        review_lines.append(
            f"- 블로거 신뢰도: {reliability:.2f} | 날짜: {date_str}\n"
            f"  장점: {pros_str}\n"
            f"  단점: {cons_str}"
        )

    reviews_text = "\n".join(review_lines)
    total_reviewers = len(reviews)

    prompt = f"""다음은 "{place_name}"에 대한 {total_reviewers}명의 블로그 리뷰에서 추출한 장단점입니다.
각 리뷰에는 블로거 신뢰도(0~1)가 표시되어 있습니다.

{reviews_text}

다음 규칙에 따라 분석하세요:

1. 의미가 유사한 장단점을 그룹으로 묶으세요 (예: "조용한 분위기"와 "시끄럽지 않음"은 같은 그룹)
2. 각 그룹의 대표 문구를 자연스러운 한국어로 선택하세요
3. 그룹별 언급한 블로거 수를 세세요
4. 분류 기준:
   - 3명+ 언급 = "공통" (전체의 70%+ 이면 "핵심")
   - 1~2명만 언급 = "개인" (type에 "pro" 또는 "con" 표시)
5. 이 장소의 전체적인 분위기를 1~2문장으로 요약하세요
6. 최근 리뷰(2025년 이후)와 이전 리뷰 사이에 평가 변화가 있으면 trend_changes에 기록하세요

반드시 아래 JSON 형식으로만 응답하세요. 다른 텍스트 없이 JSON만:
{{
  "common_pros": [{{"text": "문구", "count": 숫자, "label": "핵심 또는 공통"}}],
  "common_cons": [{{"text": "문구", "count": 숫자, "label": "핵심 또는 공통"}}],
  "personal_opinions": [{{"text": "문구", "count": 1, "type": "pro 또는 con", "label": "개인 또는 소수"}}],
  "trend_changes": ["변화 설명 문장"],
  "overall_vibe": "전체 분위기 요약"
}}"""

    try:
        result = subprocess.run(
            ["claude", "-p", "--model", "haiku", prompt],
            capture_output=True,
            text=True,
            timeout=120,
        )

        if result.returncode != 0:
            logger.error(f"Claude 호출 실패 ({place_name}): {result.stderr[:200]}")
            return None

        response = result.stdout.strip()

        # JSON 추출 (응답에 ```json 등이 포함될 수 있음)
        if "```json" in response:
            response = response.split("```json")[1].split("```")[0].strip()
        elif "```" in response:
            response = response.split("```")[1].split("```")[0].strip()

        # { 로 시작하는 부분 찾기
        json_start = response.find("{")
        json_end = response.rfind("}") + 1
        if json_start >= 0 and json_end > json_start:
            response = response[json_start:json_end]

        parsed = json.loads(response)
        return parsed

    except json.JSONDecodeError as e:
        logger.error(f"JSON 파싱 실패 ({place_name}): {e}")
        logger.debug(f"원시 응답: {response[:300]}")
        return None
    except subprocess.TimeoutExpired:
        logger.error(f"Claude 타임아웃 ({place_name})")
        return None
    except Exception as e:
        logger.error(f"Claude 분석 중 에러 ({place_name}): {e}")
        return None


def fallback_analysis(reviews: list[dict]) -> dict:
    """
    Claude 실패 시 단순 빈도 기반 분석 (fallback).
    AI 없이 동일 문자열 카운팅만 수행.
    """
    from collections import Counter

    all_pros = [p for r in reviews for p in (r.get("pros") or []) if p]
    all_cons = [c for r in reviews for c in (r.get("cons") or []) if c]

    pros_count = Counter(all_pros).most_common(10)
    cons_count = Counter(all_cons).most_common(10)

    total = len(reviews)
    threshold_common = 3
    threshold_key = max(1, int(total * 0.7))

    common_pros = []
    personal_pros = []
    for text, count in pros_count:
        if count >= threshold_common:
            label = "핵심" if count >= threshold_key else "공통"
            common_pros.append({"text": text, "count": count, "label": label})
        else:
            personal_pros.append({"text": text, "count": count, "type": "pro", "label": "개인" if count == 1 else "소수"})

    common_cons = []
    personal_cons = []
    for text, count in cons_count:
        if count >= threshold_common:
            label = "핵심" if count >= threshold_key else "공통"
            common_cons.append({"text": text, "count": count, "label": label})
        else:
            personal_cons.append({"text": text, "count": count, "type": "con", "label": "개인" if count == 1 else "소수"})

    return {
        "common_pros": common_pros,
        "common_cons": common_cons,
        "personal_opinions": personal_pros + personal_cons,
        "trend_changes": [],
        "overall_vibe": None,
    }


# --- 메인 실행 ---
def main():
    start_time = time.time()
    logger.info("=== 리뷰 교차 분석 시작 ===")

    supabase = get_supabase()

    # 1. 전체 리뷰 조회
    logger.info("Supabase에서 리뷰 조회 중...")
    result = supabase.table("blog_reviews").select("*").eq("is_ad", False).execute()
    all_reviews = result.data
    logger.info(f"총 {len(all_reviews)}건 리뷰 조회 완료")

    # 2. 장소 목록 조회
    places_result = supabase.table("places").select("id, name").execute()
    places = {p["id"]: p["name"] for p in places_result.data}
    logger.info(f"총 {len(places)}곳 장소")

    # 3. 블로거 프로필 산정
    logger.info("블로거 신뢰도 산정 중...")
    profiles = calculate_blogger_profiles(all_reviews)
    logger.info(f"{len(profiles)}명 블로거 프로필 산정 완료")

    # 4. 블로거 프로필 저장
    logger.info("블로거 프로필 저장 중...")
    for blog_id, profile in profiles.items():
        try:
            supabase.table("blogger_profiles").upsert(
                {**profile, "last_analyzed_at": datetime.now().isoformat()},
                on_conflict="blog_url"
            ).execute()
        except Exception as e:
            logger.warning(f"블로거 프로필 저장 실패 ({blog_id}): {e}")

    # 5. 장소별 교차 분석
    reviews_by_place: dict[str, list[dict]] = defaultdict(list)
    for r in all_reviews:
        reviews_by_place[r["place_id"]].append(r)

    success_count = 0
    fail_count = 0
    skip_count = 0

    for place_id, place_reviews in reviews_by_place.items():
        place_name = places.get(place_id, "알 수 없는 장소")
        review_count = len(place_reviews)

        if review_count < 2:
            logger.info(f"[SKIP] {place_name}: 리뷰 {review_count}건 — 분석 불가 (최소 2건)")
            skip_count += 1
            continue

        logger.info(f"[분석] {place_name}: {review_count}건 리뷰...")

        # Claude 교차 분석 시도
        analysis = analyze_place_with_claude(place_name, place_reviews, profiles)

        if analysis is None:
            logger.warning(f"[FALLBACK] {place_name}: Claude 실패 → 단순 빈도 분석")
            analysis = fallback_analysis(place_reviews)

        # 신뢰도 수준 산정
        confidence = min(review_count / 10, 1.0)  # 10건 이상이면 최대 신뢰도
        if review_count < 5:
            confidence *= 0.7  # 5건 미만이면 감점

        # weighted_score 추가 (Claude 결과에 없을 수 있음)
        for item in analysis.get("common_pros", []):
            if "weighted_score" not in item:
                item["weighted_score"] = round(item.get("count", 1) / review_count, 2)
        for item in analysis.get("common_cons", []):
            if "weighted_score" not in item:
                item["weighted_score"] = round(item.get("count", 1) / review_count, 2)

        # place_insights 저장
        insight = {
            "place_id": place_id,
            "analysis_version": 1,
            "common_pros": json.dumps(analysis.get("common_pros", []), ensure_ascii=False),
            "common_cons": json.dumps(analysis.get("common_cons", []), ensure_ascii=False),
            "personal_opinions": json.dumps(analysis.get("personal_opinions", []), ensure_ascii=False),
            "trend_changes": json.dumps(analysis.get("trend_changes", []), ensure_ascii=False),
            "overall_vibe": analysis.get("overall_vibe"),
            "confidence_level": round(confidence, 2),
            "total_reviews_analyzed": review_count,
            "analyzed_at": datetime.now().isoformat(),
        }

        try:
            supabase.table("place_insights").upsert(
                insight, on_conflict="place_id"
            ).execute()
            success_count += 1
            logger.info(f"[OK] {place_name}: 공통 장점 {len(analysis.get('common_pros', []))}개, "
                        f"공통 단점 {len(analysis.get('common_cons', []))}개, "
                        f"신뢰도 {confidence:.0%}")
        except Exception as e:
            fail_count += 1
            logger.error(f"[FAIL] {place_name} 인사이트 저장 실패: {e}")

        # API rate limit 대응: 각 분석 사이 짧은 대기
        time.sleep(2)

    elapsed = time.time() - start_time
    elapsed_min = elapsed / 60

    # 결과 보고
    logger.info("=== 분석 완료 ===")
    logger.info(f"소요 시간: {elapsed_min:.1f}분")
    logger.info(f"성공: {success_count}곳 / 실패: {fail_count}곳 / 스킵: {skip_count}곳")
    logger.info(f"블로거 프로필: {len(profiles)}명")

    total = success_count + fail_count
    success_rate = success_count / total * 100 if total > 0 else 0

    if HAS_SLACK:
        if success_rate >= 90:
            notify_success(
                "[bookjan42] 리뷰 교차 분석 완료",
                details=f"{success_count}곳 분석 완료 / {fail_count}곳 실패 / {skip_count}곳 스킵 ({elapsed_min:.1f}분 소요)"
            )
        elif success_rate >= 50:
            notify_warning(
                "[bookjan42] 리뷰 분석 부분 완료",
                details=f"성공률 {success_rate:.0f}% — {success_count}/{total}곳 ({elapsed_min:.1f}분)"
            )
        else:
            notify_failure(
                "[bookjan42] 리뷰 분석 실패",
                details=f"성공률 {success_rate:.0f}% — 원인 분석 필요",
                error=f"{fail_count}곳 실패"
            )


if __name__ == "__main__":
    main()
