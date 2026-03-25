# 작업 인계 문서

> 생성일: 2026-03-24
> 갱신일: 2026-03-25
> 프로젝트: 책잔사이 (bookjan42)
> 폴더: ~/01_AI/bookjan42/

## 완료된 작업
- [x] 프로젝트 비전 정립 + PRD 4종 문서
- [x] Next.js 16 + Tailwind CSS v4 + TypeScript 프로젝트 초기화
- [x] Git init + GitHub 레포 생성 (https://github.com/kemy-ai/bookjan42)
- [x] Supabase 프로젝트 생성 (bookjan42, ID: xbbooowddziltpphousx, 리전: ap-northeast-2)
- [x] places 테이블 생성 (RLS 활성, 읽기 공개)
- [x] 초기 데이터 시딩 14곳 → 보강 + 신규 4곳 = **총 18곳**
- [x] 환경변수 설정 (.env.local + Vercel 3환경)
- [x] Supabase 클라이언트 (서버/브라우저)
- [x] 카카오맵 컴포넌트 (마커, 클러스터링, 인포윈도우)
- [x] 검색/필터 (키워드, 대화 가능, 가격대, 분위기)
- [x] 장소 카드 목록 + 상세페이지
- [x] 공통 헤더 (layout.tsx, 클릭 시 홈으로)
- [x] 모바일 반응형 (지도/목록 토글)
- [x] 다크모드 기본
- [x] Vercel 프로덕션 배포 (https://bookjan42.vercel.app)
- [x] DB 스키마 확장 (closed_days, instagram_url, naver_place_url 필드 추가)

## 블로커: 카카오맵 심사 대기
- **카카오 개발자 콘솔에서 카카오맵 사용 설정이 OFF → 심사 신청함**
- 심사 완료되면 캐미가 알려줄 예정
- 심사 완료 후 할 일: bookjan42.vercel.app 새로고침하면 지도 자동 표시될 것
- 만약 안 되면: 카카오 콘솔 → 앱 설정 → 일반 → "앱 대표 도메인"에 `https://bookjan42.vercel.app` 등록 필요

## 결정된 사항
- **기술 스택**: Next.js 16 + Supabase + Vercel + 카카오맵 + shadcn/ui + Tailwind v4
- **Supabase 프로젝트**: bookjan42 (ID: xbbooowddziltpphousx)
- **카카오 앱**: bookjan42 (ID: 1413974), JavaScript 키: 5f0456d909ec48bcbb94fdd047224d25
- **GitHub**: https://github.com/kemy-ai/bookjan42
- **배포 URL**: https://bookjan42.vercel.app
- **데이터 관리**: 캐미 수동 관리 (Place 데이터 임의 수정 금지)
- **Phase 2**: 블로그 크롤링 + AI 분석 (카카오맵 심사 완료 후 시작)

## 다음에 해야 할 작업
1. **카카오맵 심사 완료 후 지도 동작 확인**
   - 안 되면: 앱 대표 도메인 등록 확인
2. **데이터 품질 보강**
   - 음주가의 책방, 책잔 Book n Glass, 북스피리언스, 적온 뮤직바&책바 — 정보 매우 부족
   - 네이버 플레이스/카카오맵에서 직접 검색하여 보강 필요
3. **UI 개선**
   - 상세페이지 디자인 보강
   - 홈 목록 카드 개선
   - 인스타그램 링크 연결 확인
4. **Phase 2 시작** (PRD/03_PHASES.md 참조)
   - 네이버 블로그 크롤링 파이프라인 (Scrapling + python3.12)
   - AI 광고/진심 분류
   - 장소 상세페이지에 AI 리뷰 섹션 추가

## 주의사항
- `.env.local`은 .gitignore에 포함 — Git에 커밋 안 됨
- Supabase anon 키는 NEXT_PUBLIC이라 클라이언트 노출 OK (RLS로 보호)
- Book_api의 .env 파일이 git에 커밋되어 있음 → API 키 노출 상태 (나중에 키 교체 필요)
- Supabase 무료 플랜: 1주 미사용 시 자동 일시정지 → 주기적 접속
- 이전 Supabase 프로젝트 "kemy's Project"는 INACTIVE 상태 (삭제해도 됨)

## 프로젝트 구조
```
bookjan42/
├── PRD/                    # 디자인 문서 4종
├── src/
│   ├── app/
│   │   ├── layout.tsx      # 루트 레이아웃 (공통 헤더 포함)
│   │   ├── page.tsx        # 홈 (서버 컴포넌트 → Supabase fetch)
│   │   ├── globals.css     # Tailwind v4 + 다크모드 테마
│   │   └── place/[id]/page.tsx  # 장소 상세페이지
│   ├── components/
│   │   ├── header.tsx      # 공통 헤더 (로고 + 홈 링크)
│   │   ├── home-client.tsx # 홈 클라이언트 (검색+지도+목록)
│   │   ├── map/kakao-map.tsx    # 카카오맵 (dynamic import, ssr:false)
│   │   └── place/
│   │       ├── place-card.tsx   # 장소 카드
│   │       ├── place-list.tsx   # 장소 목록
│   │       └── search-filter.tsx # 검색/필터
│   ├── lib/
│   │   ├── supabase/       # 서버/클라이언트 Supabase 클라이언트
│   │   ├── kakao-map/      # SDK 로드 + 타입 선언
│   │   └── utils.ts        # cn() 유틸리티
│   └── types/index.ts      # Place, MenuItem, PlaceFilter 타입
├── .env.local              # 환경변수 (Supabase + 카카오맵)
├── .vercel/                # Vercel 프로젝트 연결
└── package.json
```

## 관련 파일
- ~/01_AI/bookjan42/PRD/ — 전체 디자인 문서 (4종)
- ~/01_AI/Book_api/ — 기존 책 API 프로젝트 (Phase 3에서 재활용)
- ~/.claude/projects/-Users-kemmyjeon/memory/project_bookjan42.md — 프로젝트 메모리
