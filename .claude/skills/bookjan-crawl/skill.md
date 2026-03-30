---
name: bookjan-crawl
description: "bookjan42 크롤링 파이프라인 가이드. Python 3.12 + 네이버 블로그 API + Claude AI 검증 + Supabase 저장. 블로그 크롤링, 장소 데이터 추출, 데이터 보강 작업 시 반드시 참조."
---

# bookjan-crawl — 크롤링 파이프라인 가이드

bookjan42의 외부 데이터 수집 파이프라인 작성 가이드.

## 환경 설정

- Python: `python3.12` (`/opt/homebrew/bin/python3.12`)
- 기본 `python3`는 3.9이므로 사용 불가
- 필수 환경변수: `CURL_CA_BUNDLE=/etc/ssl/cert.pem` (SSL 검증)
- Supabase 클라이언트: `supabase-py` 패키지

## 크롤링 v2 아키텍처

```
네이버 블로그 API 검색 (장소명 + 키워드)
    ↓
블로그 본문 크롤링 (HTML 파싱)
    ↓
Claude haiku AI 검증 (관련성 + 광고 판별)
    ↓ 통과한 것만
장단점/신뢰도/요약 추출
    ↓
Supabase blog_reviews에 upsert (source_url 기준 중복 방지)
```

## CLI 하이브리드 패턴

`claude -p` (비대화형)에서 haiku는 텍스트 생성은 잘하지만 MCP 도구 호출은 불안정.

```
[Python] 데이터 수집/가공 → [Claude CLI haiku] 텍스트 요약만 → [Python] 파일 저장/API 호출
```

AI에게는 텍스트 생성만, I/O는 Python이 직접 처리.

## 핵심 규칙

1. **AI 검증 없이 저장 금지** — v1에서 무관한 블로그 105건이 오염 데이터로 저장되어 전삭한 경험
2. **토큰 관리** — 일일 한도 초과 시 자동 중단, 다음 날 재시작
3. **중복 방지** — source_url 기준 upsert, 같은 블로그 다시 크롤링 안 함
4. **로깅 필수** — `logging` 모듈, 파일+콘솔 동시, 포맷: `[시간] [레벨] [모듈명] 메시지`

## 네이버 블로그 API

- 엔드포인트: `https://openapi.naver.com/v1/search/blog.json`
- 인증: `X-Naver-Client-Id`, `X-Naver-Client-Secret` 헤더
- 검색어 조합 전략: `"장소명" + 후기` 또는 커스텀 키워드 (recrawl_missing.py 참고)

## 카카오맵 데이터 추출

Playwright로 카카오맵 Pinia 스토어 접근:
```
#app.__vue_app__.config.globalProperties.$pinia.state.value.home.state
├── summary.phone_numbers[0].tel     — 전화번호
├── open_hours.week_from_today.week_periods — 영업시간
└── menu.menus.items                 — 메뉴 (name, price)
```

## 장시간 작업 시

- Slack 알림 포함 필수 (글로벌 모듈: `~/.claude/utils/slack_notifier.py`)
- Pre-flight: 시간 예측 + 성공 기준 + 즉시 중단 조건 설정
- 모니터링: 4-Point Checklist (프로세스 생존 → 진행률 → 성공률 → 이상 패턴)
- 실패 시 재실행 금지 → 원인 분석 → 수정 → 단건 테스트 → 재실행
