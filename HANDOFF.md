# 작업 인계 문서

> 생성일: 2026-03-24
> 갱신일: 2026-03-25 (2차)
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
- [x] 사업자 정보 푸터 추가 (카카오맵 심사 반려 대응)
- [x] **카카오맵 테스트앱으로 지도 활성화** — 앱 ID 1414364 (bookjan42-TEST)
- [x] JavaScript SDK 도메인 등록 (bookjan42.vercel.app)
- [x] 환경변수 변경: NEXT_PUBLIC_KAKAO_MAP_KEY → 362f1ee53444ae82e60f70d9305ed7af (테스트앱 키)
- [x] 마커 클릭 시 지도 이동 버그 수정 (selectedPlaceId useEffect 제거)
- [x] 인포윈도우 정보 보강 (짧은 특징, 운영시간, 휴무일, 상세보기 링크)
- [x] 초기 줌 레벨 개선 (서울 지역 기준 setBounds)
- [x] 마커 색상 구분 (대화가능: 파란색 #4a90d9, 정숙: 주황색 #e67e22, SVG 커스텀 마커)
- [x] **UI 대규모 디자인 리뉴얼** (ui-ux-pro-max 기반)
  - 따뜻한 앰버/브라운 컬러 시스템 (Book & Reading Tracker 팔레트)
  - 다크/라이트 모드 토글 (헤더 Sun/Moon 버튼, localStorage 저장)
  - 깜빡임 방지 스크립트 (head에 theme 초기화)
  - 헤더: sticky + backdrop-blur, 로고 아이콘 개선
  - 카드: rounded-2xl, 호버 효과, 운영시간/상세보기 표시
  - 필터: rounded-full 태그, 부드러운 트랜지션
  - 디자인 시스템: design-system/bookjan42/MASTER.md 생성

## 블로커: 카카오맵 심사 (본 앱)
- **원본 앱(1413974) 심사 반려** — 반려 사유:
  1. 서비스 화면 스크린샷 미첨부
  2. 사이트에 사업자 정보 미표시 → **푸터로 해결 완료**
- **테스트앱(1414364)으로 우회 운영 중** — 심사 없이 카카오맵 사용 가능
- 추후 본 앱 심사 재신청 시: 사이트 스크린샷 3~4장 첨부 필요

## 결정된 사항
- **기술 스택**: Next.js 16 + Supabase + Vercel + 카카오맵 + Tailwind v4
- **카카오 앱**: 테스트앱 bookjan42-TEST (ID: 1414364), JS키: 362f1ee53444ae82e60f70d9305ed7af
- **카카오 원본 앱**: bookjan42 (ID: 1413974), JS키: 5f0456d909ec48bcbb94fdd047224d25 (심사 대기)
- **디자인**: ui-ux-pro-max 스킬 필수 사용 (메모리에 저장됨)
- **컬러**: 앰버/브라운 톤 (다크: #0C0A09 배경, 라이트: #FFFBF5 배경, 액센트: #D97706)
- **배포 URL**: https://bookjan42.vercel.app
- **GitHub**: https://github.com/kemy-ai/bookjan42
- **데이터 관리**: 캐미 수동 관리 (Place 데이터 임의 수정 금지)

## 다음에 해야 할 작업
1. **데이터 품질 보강** (이번 세션에서 중단됨)
   - 음주가의 책방: 주소 `관악구 관악로12길 3-14 지하1층`, 전화 `010-5804-3092` 확인됨 → DB 업데이트 필요
   - 북스피리언스: 인스타 `@booksperience` 확인됨 → DB 업데이트 필요
   - 적온 뮤직바&책바: 매일 18:00~02:00, 일 휴무 정보 확인됨 → DB 업데이트 필요
   - 책잔 Book n Glass: 정보 거의 없음 — 직접 방문 or 인스타 DM 필요
   - Perplexity API 할당량 초과 → WebSearch로 전환 필요
2. **UI 추가 개선**
   - 지도 초기 줌이 여전히 넓음 — setBounds가 서울 외 지역 포함 문제 재확인
   - 상세페이지 디자인 리뉴얼 (ui-ux-pro-max 적용 필요)
   - 라이트 모드 테스트 및 미세 조정
3. **카카오맵 본 앱 심사 재신청** (선택)
   - 사이트 스크린샷 첨부 + 사업자 정보 확인
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
- **카카오맵 환경변수 주의**: 현재 테스트앱 키(`362f...`) 사용 중. 본 앱 심사 완료 시 원본 키(`5f04...`)로 교체 필요
- **ui-ux-pro-max 스킬**: 이 프로젝트 UI/UX 작업 시 반드시 사용 (메모리 feedback_uiux_skill.md)

## 프로젝트 구조
```
bookjan42/
├── PRD/                    # 디자인 문서 4종
├── design-system/
│   └── bookjan42/MASTER.md # ui-ux-pro-max 생성 디자인 시스템
├── src/
│   ├── app/
│   │   ├── layout.tsx      # 루트 레이아웃 (헤더+푸터, 테마 스크립트)
│   │   ├── page.tsx        # 홈 (서버 컴포넌트 → Supabase fetch)
│   │   ├── globals.css     # Tailwind v4 + 라이트/다크 컬러 토큰
│   │   └── place/[id]/page.tsx  # 장소 상세페이지
│   ├── components/
│   │   ├── header.tsx      # sticky 헤더 (로고 + 테마 토글)
│   │   ├── footer.tsx      # 사업자 정보 푸터
│   │   ├── theme-toggle.tsx # 다크/라이트 모드 전환 버튼
│   │   ├── home-client.tsx  # 홈 클라이언트 (검색+지도+목록)
│   │   ├── map/kakao-map.tsx    # 카카오맵 (커스텀 SVG 마커, 클러스터링)
│   │   └── place/
│   │       ├── place-card.tsx   # 장소 카드 (리뉴얼됨)
│   │       ├── place-list.tsx   # 장소 목록
│   │       └── search-filter.tsx # 검색/필터 (리뉴얼됨)
│   ├── lib/
│   │   ├── supabase/       # 서버/클라이언트 Supabase 클라이언트
│   │   ├── kakao-map/      # SDK 로드 + 타입 선언 (MarkerImage 등 추가)
│   │   └── utils.ts        # cn() 유틸리티
│   └── types/index.ts      # Place, MenuItem, PlaceFilter 타입
├── .env.local              # 환경변수 (Supabase + 카카오맵 테스트앱 키)
├── .vercel/                # Vercel 프로젝트 연결
└── package.json
```

## 인프라 ID
- Supabase 프로젝트: `xbbooowddziltpphousx` (리전: ap-northeast-2 서울)
- Supabase 조직: `zjpwmlevyrpvpwixnrdh` (이름: kemy)
- Vercel 프로젝트: `kemys-projects-16c5001d/bookjan42`
- 카카오 원본 앱 ID: 1413974
- 카카오 테스트앱 ID: 1414364
- 카카오 테스트앱 JS키: 362f1ee53444ae82e60f70d9305ed7af

## 관련 파일
- ~/01_AI/bookjan42/PRD/ — 전체 디자인 문서 (4종)
- ~/01_AI/Book_api/ — 기존 책 API 프로젝트 (Phase 3에서 재활용)
- ~/.claude/projects/-Users-kemmyjeon/memory/project_bookjan42.md — 프로젝트 메모리
- ~/.claude/projects/-Users-kemmyjeon/memory/feedback_uiux_skill.md — UI/UX 스킬 필수 사용 메모리
