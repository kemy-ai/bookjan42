---
name: bookjan-dev
description: "bookjan42 프론트엔드 개발 가이드. Next.js 16 App Router, Supabase SSR, 카카오맵 통합, Tailwind 테마 컨벤션. TSX/TS 파일 수정, 페이지 추가, 컴포넌트 개발, DB 스키마 변경 시 반드시 참조."
---

# bookjan-dev — 프론트엔드 개발 가이드

bookjan42 프로젝트의 프론트엔드 코드를 작성할 때 따르는 컨벤션과 패턴.

## 프로젝트 구조

```
src/app/              — App Router 페이지 (서버 컴포넌트 기본)
src/components/       — 클라이언트 컴포넌트
src/lib/supabase/     — server.ts (서버용), client.ts (브라우저용)
src/types/index.ts    — 모든 타입 중앙 관리
src/app/globals.css   — Tailwind + CSS 변수 테마
```

## Next.js 16 컨벤션

- 서버 컴포넌트가 기본. `'use client'`는 인터랙티브 필요 시에만
- 비동기 요청 API: `await cookies()`, `await headers()`, `await params`, `await searchParams`
- `proxy.ts`는 `src/` 폴더 안에 `app/`과 같은 레벨에 배치
- Turbopack이 기본 번들러 (next.config.ts에 `turbopack: {}`)

## Supabase 패턴

서버 컴포넌트에서:
```typescript
import { createClient } from '@/lib/supabase/server'
const supabase = await createClient()
const { data } = await supabase.from('places').select('*')
```

클라이언트 컴포넌트에서:
```typescript
import { createClient } from '@/lib/supabase/client'
const supabase = createClient()
```

RLS 정책 현황:
- `blog_reviews`: read(all), insert(anon), update(anon)
- `places`: read(all) — insert/update는 서비스 키로만

## 카카오맵 패턴

- `next/dynamic`으로 ssr: false 로딩
- SDK 로드: `loadKakaoMapScript()` (lib/kakao-map/load-script.ts)
- `MarkerClusterer` 사용 시 `minLevel: 6`
- **핵심 버그 방지**: `addMarkers()` 호출 후 300ms 타임아웃 뒤 `setCenter()` + `setLevel()` 재설정. 클러스터러가 비동기 레이아웃을 수행하므로 즉시 호출하면 중심이 어긋남
- 중심 좌표: 홍대입구역 (37.5569, 126.9238)

## 테마/스타일

- CSS 변수 기반: `var(--primary)`, `var(--background)` 등
- 다크 모드: `.dark` 클래스 on `<html>` (ThemeToggle에서 localStorage 기반 전환)
- 라이트 모드: 따뜻한 갈색 계열 (#FFFBF5 bg, #B45309 primary)
- 다크 모드: 진한 갈색 계열 (#0C0A09 bg, #D97706 primary)
- 텍스트 대비: AA 이상 필수 (라이트 모드에서 특히 주의 — 950/900 톤 사용)

## 디자인 원칙 (frontend-design 기반)

bookjan42는 "동네 책방의 따뜻함"을 디지털로 옮긴 서비스. AI가 만든 듯한 제네릭 UI를 피하고, 책방에 들어선 느낌을 줘야 한다.

### 톤 & 무드
- **따뜻한 서재** — amber/brown 팔레트가 핵심. 차갑거나 기업적인 느낌 금지
- 코딩 전에 "이 UI가 책방에 어울리는가?" 자문. 어울리지 않으면 다시 생각

### 타이포그래피
- Geist Sans (본문) + Geist Mono (데이터/수치)가 기본
- 한글 제목에 개성 있는 폰트 검토 가능 (Noto Serif KR 등 서체 느낌)
- Inter, Roboto 같은 제네릭 폰트 사용 금지

### 색상
- **지배색**(amber) + **날카로운 악센트**(green/red 장단점)가 핵심 구조
- 색상을 고르게 분산시키지 말 것. 지배색이 확실하고, 악센트는 의미 있는 곳에만
- CSS 변수 기반 — 하드코딩 색상 금지

### 모션 & 인터랙션
- 페이지 전환, 카드 hover에 의미 있는 트랜지션 추가 (transition-all duration-200 패턴)
- 과도한 애니메이션 금지 — 책방의 차분한 분위기 유지
- 고영향 순간에 집중: 페이지 로드 시 staggered reveal이 산발적 micro-interaction보다 나음

### 공간 & 레이아웃
- 넉넉한 여백(padding/margin)으로 콘텐츠에 숨 쉴 공간
- 카드 간격, 섹션 간격이 빡빡하면 책방이 아니라 뉴스 피드 느낌
- rounded-xl/2xl 곡선으로 부드러운 느낌 유지

### 제네릭 UI 금지
- 보라색 그라데이션 + 흰 배경 = AI가 만든 티. 금지
- 모든 UI 요소에 bookjan42의 톤이 반영되어야 함
- "다른 서비스에서도 쓸 수 있는 디자인"이면 개성이 부족한 것

## 타입 정의

모든 타입은 `src/types/index.ts`에 정의. 새 타입 추가 시 여기에 추가:
- `Place`: 장소 (24필드)
- `BlogReview`: 블로그 리뷰 (is_ad, trust_score, pros, cons 등)
- Phase 3+에서 `User`, `UserReview`, `Book`, `BookQuote` 추가 예정

## DB 스키마 변경 시

1. Supabase SQL Editor에서 실행할 DDL 스크립트 제공
2. RLS 정책 함께 제공
3. 타입 정의(`types/index.ts`) 동시 업데이트
4. 관련 페이지의 쿼리 업데이트
