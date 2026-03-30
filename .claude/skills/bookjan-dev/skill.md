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
