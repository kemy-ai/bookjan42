# 작업 인계 문서

> 생성일: 2026-03-24
> 갱신일: 2026-03-25
> 프로젝트: 책잔사이 (bookjan42)
> 폴더: ~/01_AI/bookjan42/

## 완료된 작업
- [x] 프로젝트 비전 정립 (술+독서 커뮤니티 플랫폼)
- [x] 프로젝트 이름 확정: 책잔사이 (bookjan42)
- [x] 프로젝트 폴더 생성: ~/01_AI/bookjan42/
- [x] 메모리 저장: ~/.claude/projects/-Users-kemmyjeon/memory/project_bookjan42.md
- [x] PRD 4종 문서 생성 (/show-me-the-prd)
  - PRD/01_PRD.md — 제품 요구사항
  - PRD/02_DATA_MODEL.md — 데이터 모델 (7개 엔티티)
  - PRD/03_PHASES.md — Phase 1~5 분리 계획
  - PRD/04_PROJECT_SPEC.md — 기술 스택 + AI 규칙
  - PRD/README.md — 네비게이션

## 결정된 사항
- **기술 스택**: Next.js 16 + Supabase + Vercel + 카카오맵 + shadcn/ui
- **크롤링**: Scrapling (글로벌 python3.12 설치됨)
- **AI 분석**: AI Gateway (Vercel)
- **OCR**: Tesseract.js
- **로그인**: 소셜 로그인 (카카오/네이버/구글) — Supabase Auth
- **수익 모델**: 미정 (MVP 피드백 후 결정)
- **책 API**: ~/01_AI/Book_api/ 재활용 (알라딘+네이버+도서관정보나루)
- **Phase 1~2 = 4주 (1개월)**: 지도+검색+상세+AI리뷰

## 이번 세션 완료 (2026-03-25)
- [x] Supabase MCP 설치 + Access Token 방식으로 연결 설정
  - HTTP OAuth 방식 → npx + PAT 방식으로 전환 (브라우저 인증 불안정 문제 해결)
  - 토큰: ~/.claude.json의 supabase args에 저장됨
  - **세션 재시작(/clear) 후 연결 확인 필요**
- [x] Supabase 프로젝트 생성 완료: bookjan42

## 다음에 해야 할 작업
1. **Supabase MCP 연결 확인** — /clear 후 `claude mcp list`에서 supabase ✓ Connected 확인
2. **캐미 준비물 확인 (남은 것)**
   - 초기 북바 목록 10~15곳 (상호명+주소+대화가능여부+특징)
   - 카카오 개발자 앱 등록 → API 키 발급
2. **Phase 1 시작** (PRD/03_PHASES.md의 "Phase 1 시작 프롬프트" 사용)
   - Next.js 16 프로젝트 초기화
   - Supabase 테이블 생성 (Place 스키마)
   - 카카오맵 연동
   - 북바 지도 + 검색 + 장소 상세페이지
   - Vercel 배포

## 주의사항
- Book_api의 .env 파일이 git에 커밋되어 있음 → API 키 노출 상태. 나중에 키 교체 필요
- 후기 질문 목록은 아직 미확정 (Phase 3 전에 결정)
- 포인트 적립 규칙 미확정 (Phase 3 전에 결정)
- 프로젝트 이름 "책잔사이"는 추후 변경 가능 (캐미 의향)

## 관련 파일
- ~/01_AI/bookjan42/PRD/ — 전체 디자인 문서 (4종)
- ~/01_AI/Book_api/ — 기존 책 API 프로젝트 (재활용 대상)
- ~/.claude/projects/-Users-kemmyjeon/memory/project_bookjan42.md — 프로젝트 메모리

## 주의사항 (추가)
- Supabase MCP: HTTP(OAuth) 방식은 브라우저 열기 불안정 → npx + Access Token 방식 사용
- Access Token이 ~/.claude.json에 평문 저장됨 — 보안 주의

## 마지막 상태
- git 초기화 안 됨 (Phase 1 시작 시 git init)
- 코드 없음 (PRD만 완성)
- 배포 없음
- Supabase 프로젝트: bookjan42 (생성 완료, MCP 연결은 재시작 후 확인)
