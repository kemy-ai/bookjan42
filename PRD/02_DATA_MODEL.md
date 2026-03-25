# 책잔사이 (bookjan42) -- 데이터 모델

> 이 문서는 앱에서 다루는 핵심 데이터의 구조를 정의합니다.
> 개발자가 아니어도 이해할 수 있는 "개념적 ERD"입니다.

---

## 전체 구조

```
[User] 1──N [Review]
  │                │
  │                ├── place_id ──┐
  │                └── book_id ──┤
  │                               │
  1──N [BookQuote]            [Place] 1──N [BlogReview]
  │       │                      │
  │       ├─ book_id ─┐          ├─ tags[]
  │       └─ place_id─┤          ├─ menus[]
  │                   │          └─ photos[]
  │                [Book]
  │          (Book_api 연동)
  │
  1──N [UserTaste]
        (성향 프로필)
```

---

## 엔티티 상세

### Place (북바/서점)
한 곳의 북바 또는 독립서점 정보. 지도에 표시되는 단위.

| 필드 | 설명 | 예시 | 필수 |
|------|------|------|------|
| id | 고유 식별자 (자동 생성) | uuid-abc-123 | O |
| name | 상호명 | 책바 | O |
| address | 주소 | 서울 마포구 망원동 123-4 | O |
| lat | 위도 | 37.5563 | O |
| lng | 경도 | 126.9106 | O |
| phone | 전화번호 | 02-123-4567 | X |
| hours | 영업시간 | 화~일 18:00~01:00 | X |
| conversation | 대화 가능 여부 | true | O |
| price_range | 가격대 | "중" (저/중/고) | O |
| atmosphere | 분위기 태그 | ["조용한", "아늑한", "레트로"] | O |
| menus | 메뉴+가격 목록 | [{"name": "하우스와인", "price": 12000}] | X |
| photos | 사진 URL 목록 | ["https://...jpg"] | X |
| description | 캐미가 작성하는 소개글 | "망원동 골목 안 작은 책방..." | X |
| website | 웹사이트/인스타 | https://instagram.com/... | X |
| created_at | 등록일 (자동) | 2026-03-24 | O |
| updated_at | 수정일 (자동) | 2026-03-24 | O |

### User (사용자)
회원가입한 사용자. 소셜 로그인으로 가입.

| 필드 | 설명 | 예시 | 필수 |
|------|------|------|------|
| id | 고유 식별자 (자동 생성) | uuid-def-456 | O |
| email | 이메일 (로그인용) | kemy@ikda.co | O |
| name | 닉네임 | 캐미 | O |
| profile_img | 프로필 사진 | https://...jpg | X |
| provider | 로그인 제공자 | "kakao" / "naver" / "google" | O |
| points | 누적 포인트 | 150 | O |
| created_at | 가입일 (자동) | 2026-03-24 | O |

### UserTaste (성향 프로필)
사용자의 취향 정보. 추천 알고리즘에 사용. (Phase 4)

| 필드 | 설명 | 예시 | 필수 |
|------|------|------|------|
| user_id | 사용자 (FK) | uuid-def-456 | O |
| prefer_conversation | 대화 선호 여부 | true | X |
| prefer_atmosphere | 선호 분위기 | ["조용한", "아늑한"] | X |
| prefer_books | 선호 장르 | ["에세이", "소설", "시"] | X |
| prefer_drinks | 선호 주류 | ["와인", "위스키"] | X |
| visit_purpose | 주 방문 목적 | ["혼자 독서", "친구와 대화"] | X |
| updated_at | 수정일 (자동) | 2026-03-24 | O |

### Review (사용자 후기)
사용자가 직접 작성하는 질문 기반 후기.

| 필드 | 설명 | 예시 | 필수 |
|------|------|------|------|
| id | 고유 식별자 (자동 생성) | uuid-ghi-789 | O |
| user_id | 작성자 (FK) | uuid-def-456 | O |
| place_id | 대상 장소 (FK) | uuid-abc-123 | O |
| book_id | 연결된 책 (FK, 선택) | isbn-978... | X |
| answers | 질문별 답변 (JSON) | {"alone": true, "mood": "조용히 집중"} | O |
| free_text | 자유 후기 | "와인 리스트가 좋았고..." | X |
| photos | 후기 사진 | ["https://...jpg"] | X |
| points_earned | 획득 포인트 | 10 | O |
| created_at | 작성일 (자동) | 2026-03-24 | O |

### BlogReview (AI 수집 리뷰)
네이버 블로그에서 크롤링한 후 AI가 분석한 리뷰.

| 필드 | 설명 | 예시 | 필수 |
|------|------|------|------|
| id | 고유 식별자 (자동 생성) | uuid-jkl-012 | O |
| place_id | 대상 장소 (FK) | uuid-abc-123 | O |
| source_url | 원본 블로그 URL | https://blog.naver.com/... | O |
| author_name | 블로거 닉네임 | 독서맨 | O |
| content_summary | AI 요약 | "조용한 분위기에서 와인과..." | O |
| trust_score | 신뢰도 점수 (0~1) | 0.85 | O |
| is_ad | 광고 여부 | false | O |
| pros | AI 추출 장점 | ["와인 종류 다양", "조용함"] | O |
| cons | AI 추출 단점 | ["좌석이 불편", "가격대 높음"] | O |
| published_at | 블로그 게시일 | 2026-02-15 | X |
| crawled_at | 수집일 (자동) | 2026-03-24 | O |

### Book (책 정보)
알라딘/네이버 API에서 가져온 책 정보. Book_api 프로젝트 재활용.

| 필드 | 설명 | 예시 | 필수 |
|------|------|------|------|
| isbn13 | ISBN (PK) | 9788936434267 | O |
| title | 제목 | 소년이 온다 | O |
| author | 저자 | 한강 | O |
| publisher | 출판사 | 창비 | O |
| cover | 표지 URL | https://image.aladin.co.kr/... | X |
| description | 책소개 | "광주를 배경으로..." | X |
| pub_date | 출판일 | 2014-05-19 | X |

### BookQuote (책 속 문장)
사용자가 남긴 책 속 인상적인 문장. 장소와 연결 가능.

| 필드 | 설명 | 예시 | 필수 |
|------|------|------|------|
| id | 고유 식별자 (자동 생성) | uuid-mno-345 | O |
| user_id | 작성자 (FK) | uuid-def-456 | O |
| book_id | 책 (FK) | 9788936434267 | O |
| place_id | 장소 (FK, 선택) | uuid-abc-123 | X |
| text | 문장 내용 | "그 봄이 아직도 끝나지 않았다" | O |
| photo_url | 원본 사진 (OCR 전) | https://...jpg | X |
| ocr_source | OCR 변환 여부 | true | O |
| created_at | 작성일 (자동) | 2026-03-24 | O |

---

## 관계

- **User** 1명이 여러 개의 **Review**를 작성할 수 있음
- **User** 1명이 여러 개의 **BookQuote**를 남길 수 있음
- **User** 1명은 1개의 **UserTaste** 프로필을 가짐
- **Place** 1곳에 여러 개의 **Review**가 달릴 수 있음
- **Place** 1곳에 여러 개의 **BlogReview**가 수집될 수 있음
- **Review**는 선택적으로 1개의 **Book**과 연결됨
- **BookQuote**는 1개의 **Book**과 필수 연결, 선택적으로 **Place**와 연결

---

## 왜 이 구조인가

- **Place와 BlogReview 분리**: 블로그 리뷰는 AI가 자동 수집하는 외부 데이터, 사용자 후기(Review)는 직접 작성하는 내부 데이터. 신뢰도 기준이 다르므로 분리
- **UserTaste 별도 테이블**: 성향 프로필은 Phase 4에서 추가. Place/Review 테이블을 건드리지 않고 확장 가능
- **Book은 Book_api 연동**: 이미 구축된 알라딘/네이버 API 시스템 재활용. 중복 구현 방지
- **BookQuote의 place_id 선택적**: 문장은 꼭 특정 장소에서만 남기는 게 아님. 집에서 읽다가도 남길 수 있음

---

## [NEEDS CLARIFICATION]

- [ ] 후기 질문(answers) JSON 구조 확정 (어떤 질문을 넣을지)
- [ ] 포인트 적립 규칙 (후기 작성 10pt? 문장 남기기 5pt?)
- [ ] BlogReview 크롤링 주기 (매일? 매주?)
- [ ] Place 데이터 누가 관리? (캐미 수동 + 사용자 제안?)
