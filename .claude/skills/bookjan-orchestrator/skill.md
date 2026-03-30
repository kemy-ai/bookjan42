---
name: bookjan-orchestrator
description: "bookjan42 에이전트 오케스트레이터. 캐미의 요청을 분석하여 적절한 전문가(frontend, pipeline, analyst, qa)를 호출하고 결과를 조율. 기능 개발, 크롤링, 리뷰 분석, 검증 등 모든 bookjan42 작업 시 이 스킬이 에이전트 라우팅을 담당."
---

# bookjan-orchestrator — 에이전트 조율

bookjan42 프로젝트의 4명의 전문가를 상황에 맞게 호출하고, 결과를 통합하는 오케스트레이터.

## 실행 모드: 서브 에이전트 (전문가 풀)

## 에이전트 구성

| 에이전트 | subagent_type | 역할 | 스킬 | model |
|---------|--------------|------|------|-------|
| bookjan-frontend | bookjan-frontend | Next.js + Supabase + 카카오맵 | bookjan-dev | opus |
| bookjan-pipeline | bookjan-pipeline | Python 크롤링 + 데이터 수집 | bookjan-crawl | opus |
| bookjan-analyst | bookjan-analyst | 리뷰 교차 분석 + 인사이트 | bookjan-analysis | opus |
| bookjan-qa | bookjan-qa | 코드/빌드/데이터 검증 | bookjan-verify | opus |

## 라우팅 규칙

캐미의 요청을 분석하여 적절한 에이전트를 호출한다.

| 요청 키워드 | 에이전트 | 예시 |
|-----------|---------|------|
| 페이지, 컴포넌트, UI, 스타일, 필터, 지도, 로그인, DB 스키마 | **frontend** | "검색 필터에 지역 추가해줘" |
| 크롤링, 블로그, 수집, 재크롤링, 카카오맵 데이터 | **pipeline** | "새 장소 5곳 리뷰 크롤링해줘" |
| 분석, 인사이트, 신뢰도, 교차 검증, 공통 장단점, 추천 | **analyst** | "리뷰 교차 분석 실행해줘" |
| 검증, 빌드, 리뷰, 배포, 테스트, QA | **qa** | "빌드 확인하고 배포 준비해줘" |
| 복합 요청 (여러 영역) | **순차 호출** | "기능 만들고 검증까지" |

## 워크플로우

### 단일 에이전트 호출 (가장 흔함)

```
Phase 1: 요청 분석
  - 캐미의 요청에서 작업 유형 파악
  - 라우팅 규칙에 따라 에이전트 선택

Phase 2: 에이전트 실행
  - Agent(subagent_type: "{agent}", model: "opus", prompt: "{작업 지시}")
  - 에이전트가 해당 스킬을 참조하여 작업 수행

Phase 3: 결과 보고
  - 에이전트 결과를 캐미에게 요약 보고
```

### 기능 개발 + QA (복합 흐름)

```
Phase 1: 요청 분석
  - "기능 만들고 검증까지" → frontend + qa 순차 호출

Phase 2: 프론트엔드 개발
  - Agent(subagent_type: "bookjan-frontend", model: "opus", prompt: "...")
  - 결과: 수정된 파일 목록

Phase 3: 품질 검증
  - Agent(subagent_type: "bookjan-qa", model: "opus", prompt: "Phase 2에서 수정된 파일 검증: {파일 목록}")
  - 결과: 검증 보고서

Phase 4: 결과 보고
  - 개발 + 검증 결과를 캐미에게 통합 보고
  - 이슈 있으면 수정 여부 확인
```

### 크롤링 → 분석 파이프라인

```
Phase 1: 크롤링
  - Agent(subagent_type: "bookjan-pipeline", model: "opus", prompt: "...")
  - 결과: 수집된 리뷰 건수, 성공률

Phase 2: 교차 분석
  - Agent(subagent_type: "bookjan-analyst", model: "opus", prompt: "새로 수집된 리뷰 교차 분석")
  - 결과: place_insights 업데이트

Phase 3: 결과 보고
  - 크롤링 + 분석 결과 통합 보고
```

## 데이터 흐름

```
[캐미 요청]
    ↓ (라우팅)
[frontend] ←→ Supabase (DB 읽기/쓰기)
[pipeline] → blog_reviews (저장) → [analyst] → place_insights (저장)
[qa] ← 다른 에이전트의 산출물 (검증)
    ↓
[캐미에게 결과 보고]
```

## 에러 핸들링

| 상황 | 전략 |
|------|------|
| 에이전트 실패 | 1회 재시도. 재실패 시 캐미에게 보고 + 에러 내용 + 수동 해결 방안 제시 |
| 빌드 실패 (qa) | qa가 수정 시도 (최대 3회) → 실패 시 캐미에게 보고 |
| 크롤링 성공률 저조 | pipeline이 즉시 중단 + 원인 보고. 캐미 승인 후 재시도 |
| 분석 데이터 부족 | analyst가 "데이터 부족" 경고 + 낮은 confidence_level 표시 |
| 라우팅 모호 | 캐미에게 "이 작업은 A와 B 중 어느 전문가가 적합한지" 질문 |

## 테스트 시나리오

### 정상 흐름: 새 기능 개발
1. 캐미: "장소 상세 페이지에 영업 상태 뱃지 추가해줘"
2. 오케스트레이터 → bookjan-frontend (UI 개발)
3. frontend: place/[id]/page.tsx 수정 + 빌드 확인
4. 오케스트레이터 → bookjan-qa (변경 파일 검증)
5. qa: 빌드 통과 + 다크/라이트 확인 + 코드 리뷰
6. 캐미에게 결과 보고

### 에러 흐름: 크롤링 실패
1. 캐미: "새 장소 3곳 크롤링해줘"
2. 오케스트레이터 → bookjan-pipeline
3. pipeline: 네이버 API rate limit → 1곳만 완료, 2곳 실패
4. pipeline: 성공률 33% → 즉시 중단 + 원인 보고
5. 캐미에게 "rate limit으로 1/3만 완료. 내일 재시도하거나 검색어 변경 필요" 보고
