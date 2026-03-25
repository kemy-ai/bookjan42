# 책잔사이 (bookjan42) -- 프로젝트 스펙

> AI가 코드를 짤 때 지켜야 할 규칙과 절대 하면 안 되는 것.
> 이 문서를 AI에게 항상 함께 공유하세요.

---

## 기술 스택

| 영역 | 선택 | 이유 |
|------|------|------|
| 프레임워크 | Next.js 16 (App Router) | Vercel 최적화, SSR/SSG 지원, 1인 개발자 최다 사용 |
| UI | shadcn/ui + Tailwind CSS | 빠른 UI 구현, 다크모드 기본, 컴포넌트 소유 |
| DB + 인증 + 스토리지 | Supabase | DB+Auth+Storage 올인원, 무료 시작, PostgreSQL 기반 |
| 지도 | 카카오맵 JavaScript SDK | 한국 지도 최적화, 무료 일 30만건 |
| 크롤링 | Scrapling (python3.12) | 이미 설치됨, PlayWrightFetcher/StealthyFetcher 내장 |
| AI 분석 | AI Gateway (Vercel) | 멀티 프로바이더 라우팅, OIDC 인증, 비용 추적 |
| 호스팅 | Vercel | Next.js 네이티브, 무료 시작, 자동 배포 |
| OCR | Tesseract.js | 브라우저 내 OCR, 한국어 지원, 무료 |
| 책 API | 알라딘 + 네이버 + 도서관 정보나루 | Book_api 프로젝트 재활용 (~/01_AI/Book_api/) |

---

## 프로젝트 구조

```
bookjan42/
├── PRD/                    # 디자인 문서 (이 폴더)
├── src/
│   ├── app/                # 페이지 (라우팅)
│   │   ├── page.tsx        # 홈 (지도 + 검색)
│   │   ├── place/
│   │   │   └── [id]/
│   │   │       └── page.tsx  # 장소 상세
│   │   ├── search/
│   │   │   └── page.tsx    # 검색 결과
│   │   ├── review/
│   │   │   └── new/
│   │   │       └── page.tsx  # 후기 작성 (Phase 3)
│   │   ├── profile/
│   │   │   └── page.tsx    # 프로필 (Phase 3)
│   │   ├── auth/
│   │   │   └── callback/
│   │   │       └── route.ts  # 소셜 로그인 콜백 (Phase 3)
│   │   ├── api/
│   │   │   ├── places/
│   │   │   │   └── route.ts  # 장소 API
│   │   │   ├── reviews/
│   │   │   │   └── route.ts  # 후기 API (Phase 3)
│   │   │   └── blog-reviews/
│   │   │       └── route.ts  # AI 리뷰 API (Phase 2)
│   │   └── layout.tsx      # 루트 레이아웃
│   ├── components/         # 재사용 가능한 UI 조각
│   │   ├── ui/             # shadcn/ui 컴포넌트
│   │   ├── map/            # 지도 관련
│   │   ├── place/          # 장소 관련
│   │   └── review/         # 후기 관련
│   ├── lib/                # 유틸리티, DB 연결, 설정
│   │   ├── supabase/       # Supabase 클라이언트
│   │   ├── kakao-map/      # 카카오맵 유틸
│   │   └── utils.ts        # 공통 유틸
│   └── types/              # 데이터 타입 정의
│       └── index.ts
├── scripts/                # 크롤링, 데이터 수집 스크립트 (Python)
│   ├── crawl_blogs.py      # 블로그 크롤링 (Phase 2)
│   └── seed_places.py      # 초기 데이터 시딩
├── public/                 # 이미지, 아이콘
├── .env.local              # 환경변수 (비밀번호 등)
├── package.json            # 의존성 목록
├── next.config.ts          # Next.js 설정
├── tailwind.config.ts      # Tailwind 설정
└── tsconfig.json           # TypeScript 설정
```

---

## 절대 하지 마 (DO NOT)

> AI에게 코드를 시킬 때 이 목록을 반드시 함께 공유하세요.

- [ ] API 키나 비밀번호를 코드에 직접 쓰지 마 (.env.local 파일 사용)
- [ ] 기존 DB 스키마를 캐미 승인 없이 변경하지 마
- [ ] 테스트 없이 배포하지 마
- [ ] 목업/하드코딩 데이터로 완성이라고 하지 마
- [ ] package.json의 기존 의존성 버전을 변경하지 마
- [ ] 카카오맵 API 키를 클라이언트 코드에 노출하지 마 (환경변수 사용)
- [ ] Supabase의 service_role 키를 클라이언트에서 사용하지 마 (서버에서만)
- [ ] Place 데이터를 임의로 삭제/수정하지 마 (캐미가 직접 관리)
- [ ] 크롤링 스크립트에 rate limiting 없이 실행하지 마
- [ ] 사용자 개인정보를 로그에 출력하지 마

---

## 항상 해 (ALWAYS DO)

- [ ] 변경하기 전에 계획을 먼저 보여줘
- [ ] 환경변수는 .env.local에 저장
- [ ] 에러가 발생하면 사용자에게 친절한 한국어 메시지 표시
- [ ] 모바일에서도 사용 가능한 반응형 디자인 (모바일 우선)
- [ ] 모든 외부 API 호출에 timeout 설정 (30초)
- [ ] Supabase RLS (Row Level Security) 설정으로 데이터 접근 제어
- [ ] 이미지는 next/image로 최적화
- [ ] 지도는 lazy loading (페이지 로드 속도)
- [ ] 한국어 UI (모든 텍스트 한국어)
- [ ] 다크모드 기본 (대시보드/커뮤니티 성격)

---

## 테스트 방법

```bash
# 로컬 실행
npm run dev

# 타입 체크
npx tsc --noEmit

# 빌드 확인
npm run build

# 린트
npm run lint
```

---

## 배포 방법

```bash
# Vercel에 연결 (최초 1회)
vercel link

# 환경변수 풀
vercel env pull

# 프리뷰 배포
vercel

# 프로덕션 배포
vercel --prod
```

---

## 환경변수

| 변수명 | 설명 | 어디서 발급 |
|--------|------|------------|
| NEXT_PUBLIC_SUPABASE_URL | Supabase 프로젝트 URL | https://supabase.com/dashboard |
| NEXT_PUBLIC_SUPABASE_ANON_KEY | Supabase 공개 키 | Supabase 대시보드 > Settings > API |
| SUPABASE_SERVICE_ROLE_KEY | Supabase 서비스 키 (서버 전용) | Supabase 대시보드 > Settings > API |
| NEXT_PUBLIC_KAKAO_MAP_KEY | 카카오맵 JavaScript 키 | https://developers.kakao.com |
| KAKAO_REST_API_KEY | 카카오 REST API 키 | https://developers.kakao.com |
| ALADIN_API_KEY | 알라딘 API 키 | https://www.aladin.co.kr/ttb/api |
| NAVER_CLIENT_ID | 네이버 API ID | https://developers.naver.com |
| NAVER_CLIENT_SECRET | 네이버 API 시크릿 | https://developers.naver.com |

> .env.local 파일에 저장. 절대 GitHub에 올리지 마세요.
> .gitignore에 .env.local 포함 필수.

---

## 기존 자산 활용

| 자산 | 위치 | 활용 방법 |
|------|------|----------|
| Book_api | ~/01_AI/Book_api/ | 알라딘/네이버/도서관 API 클라이언트 재활용 |
| Scrapling | 글로벌 python3.12 | 네이버 블로그 크롤링에 사용 |
| Notion MCP | 활성화됨 | 초기 북바 데이터 관리 보조 |

---

## [NEEDS CLARIFICATION]

- [ ] 카카오 개발자 앱 등록 + API 키 발급
- [ ] Supabase 프로젝트 생성 + 테이블 스키마 적용
- [ ] Vercel 프로젝트 연결 + 환경변수 설정
- [ ] 초기 북바 데이터 (캐미 제공)
- [ ] 도메인 구매 여부 (bookjan42.com 등)
