# PEOPLE & ART — 전체 구현 계획서

> 작성일: 2026-03-20
> 스택: Next.js (App Router) + Supabase + Vercel
> 도메인: people-art.co.kr

---

## 1. 기능 명세 (Feature Specification)

### 1-1. 인증 (Authentication)
| 기능 | 설명 | 우선순위 |
|------|------|---------|
| 소셜 로그인 (카카오) | Supabase Auth + Kakao OAuth | P0 |
| 소셜 로그인 (구글) | Supabase Auth + Google OAuth | P0 |
| 이메일 회원가입/로그인 | 이메일+비밀번호 (Supabase Auth) | P1 |
| 로그아웃 | 세션 종료 | P0 |
| 비밀번호 재설정 | 이메일 링크 발송 | P1 |

### 1-2. 사용자 프로필 관리
| 기능 | 설명 | 우선순위 |
|------|------|---------|
| 온보딩 프로필 설정 | 가입 후 기본 정보 입력 | P0 |
| 프로필 사진 업로드 | Supabase Storage | P0 |
| 서브 사진 관리 (최대 10장) | 추가/삭제/순서 변경 | P0 |
| 영상 자료 관리 | 파일 업로드 + 외부 링크 (YouTube/Vimeo) | P0 |
| 경력사항 CRUD | 드라마/영화/광고 등 11개 카테고리 | P0 |
| 학력 정보 관리 | 학교/학과/졸업상태 | P0 |
| 소셜 링크 관리 | 인스타/유튜브/틱톡 | P0 |
| 포트폴리오 PDF 업로드 | Supabase Storage | P0 |
| 상태 태그 관리 | 13개 태그 다중 선택 | P0 |
| 검색 노출 ON/OFF | 배우 검색에 노출 여부 | P1 |

### 1-3. 멤버십 & 결제
| 기능 | 설명 | 우선순위 |
|------|------|---------|
| 멤버십 가입 | 월 44,000원, 포트원(아임포트) PG 연동 | P0 |
| 가입 보너스 포인트 | 가입 시 15,000P 자동 지급 | P0 |
| 자동 갱신 예약 | 만료 전 자동 결제 예약 | P0 |
| 포인트 우선 차감 | 결제 시 보유 포인트 먼저 사용 | P0 |
| 멤버십 해지 | 즉시 해지 / 기간 만료 후 해지 선택 | P0 |
| 결제 내역 조회 | 마이페이지 결제 히스토리 | P1 |
| 멤버십 만료 알림 | 만료 D-7, D-3, D-1 알림 (이메일) | P2 |

### 1-4. 배우 검색
| 기능 | 설명 | 우선순위 |
|------|------|---------|
| 배우 목록 조회 | 페이지네이션 (20명씩) | P0 |
| 필터 검색 | 성별, 나이, 키, 몸무게, 태그, 학교 | P0 |
| 텍스트 검색 | 이름, 특기, 외국어, 소개 전문 검색 | P0 |
| 배우 상세 페이지 | 프로필, 경력, 사진, 영상 | P0 |
| 멤버십 전용 열람 | 상세 정보는 멤버십 회원만 | P1 |

### 1-5. 오디션 & 이벤트
| 기능 | 설명 | 우선순위 |
|------|------|---------|
| 이벤트 목록 조회 | 진행중/마감 필터링 | P0 |
| 이벤트 상세 | 내용, 마감일, 멤버십 전용 뱃지 | P0 |
| 이벤트 지원 | 로그인 필요, 멤버십 전용 이벤트 제한 | P1 |
| 지원 현황 조회 | 마이페이지 내 지원 목록 | P1 |

### 1-6. 프로필 투어
| 기능 | 설명 | 우선순위 |
|------|------|---------|
| 투어 목록 조회 | 진행중/신규/마감 | P0 |
| 투어 신청 | 멤버십 회원만 가능 | P1 |
| 투어 참가 현황 | 관리자 승인 후 표시 | P1 |

### 1-7. 프로필 지원 기관
| 기능 | 설명 | 우선순위 |
|------|------|---------|
| 지원 기관 목록 | 엔터테인먼트 / 광고에이전시 | P0 |
| 기관 지원 | 기본 5곳, 멤버십 무제한 | P0 |
| 이메일 자동 발송 | Supabase Edge Function + Resend | P1 |

### 1-8. 후기
| 기능 | 설명 | 우선순위 |
|------|------|---------|
| 후기 목록 조회 | 카테고리 필터, 최신순/평점순 | P0 |
| 후기 작성 | 로그인 사용자, 이미지 첨부 가능 | P1 |
| 후기 삭제 | 본인 후기만 | P1 |

### 1-9. 관리자 (Admin)
| 기능 | 설명 | 우선순위 |
|------|------|---------|
| 대시보드 | 전체 통계 (회원수, 멤버십, 결제액) | P0 |
| 회원 목록 & 상세 | 검색, 필터, 등급 변경 | P0 |
| 회원 멤버십 관리 | 강제 해지, 연장, 포인트 지급 | P0 |
| 이벤트/오디션 CRUD | 생성, 수정, 삭제, 마감 처리 | P0 |
| 투어 CRUD | 생성, 수정, 삭제 | P0 |
| 뉴스 CRUD | 생성, 수정, 삭제 | P0 |
| 파트너사 CRUD | 로고, 링크 관리 | P1 |
| 지원 기관 CRUD | 이메일, 카테고리 관리 | P0 |
| 배우 프로필 관리 | 노출 ON/OFF, 강제 수정 | P1 |
| 후기 관리 | 숨김 처리, 삭제 | P1 |
| 결제 내역 조회 | 전체 결제 히스토리 | P0 |
| 투어 참가 승인 | 신청 → 승인/거절 | P1 |
| 이벤트 지원 관리 | 지원자 목록, 합격/불합격 처리 | P1 |

---

## 2. Supabase DB 스키마

### 2-1. 인증 (Supabase Auth 내장)
Supabase `auth.users` 테이블을 기본으로 사용. 커스텀 정보는 `public.profiles`에 저장.

### 2-2. 테이블 정의

```sql
-- =====================
-- 사용자 기본 정보
-- =====================
CREATE TABLE public.profiles (
  id          UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email       TEXT,
  name        TEXT,
  phone       TEXT,
  role        TEXT NOT NULL DEFAULT 'basic' CHECK (role IN ('basic', 'premium', 'admin')),
  created_at  TIMESTAMPTZ DEFAULT now(),
  updated_at  TIMESTAMPTZ DEFAULT now()
);

-- =====================
-- 배우 프로필 (UserProfile과 동일)
-- =====================
CREATE TABLE public.artist_profiles (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id         UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  gender          TEXT CHECK (gender IN ('남성', '여성')),
  birth_date      DATE,
  height          NUMERIC(5,1),
  weight          NUMERIC(5,1),
  bio             TEXT,
  etc_info        TEXT,
  school          TEXT,
  is_public       BOOLEAN DEFAULT true,
  portfolio_url   TEXT,
  created_at      TIMESTAMPTZ DEFAULT now(),
  updated_at      TIMESTAMPTZ DEFAULT now(),
  UNIQUE(user_id)
);

-- =====================
-- 상태 태그 (다대다)
-- =====================
CREATE TABLE public.status_tags (
  id       SERIAL PRIMARY KEY,
  name     TEXT NOT NULL UNIQUE
);

INSERT INTO public.status_tags (name) VALUES
  ('아이돌 연습생 출신'), ('아이돌'), ('외국인'), ('모델'), ('인플루언서'),
  ('유튜버'), ('뮤지컬 배우'), ('가수'), ('성우'), ('개그맨'), ('아나운서'), ('MC'), ('나레이터');

CREATE TABLE public.artist_status_tags (
  artist_id  UUID REFERENCES public.artist_profiles(id) ON DELETE CASCADE,
  tag_id     INT REFERENCES public.status_tags(id) ON DELETE CASCADE,
  PRIMARY KEY (artist_id, tag_id)
);

-- =====================
-- 경력 사항
-- =====================
CREATE TABLE public.career_items (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  category    TEXT NOT NULL CHECK (category IN (
    '드라마','영화','광고','단편','독립','웹드라마','OTT','숏폼','연극','뮤지컬','뮤직비디오'
  )),
  year        TEXT,
  title       TEXT NOT NULL,
  role        TEXT,
  sort_order  INT DEFAULT 0,
  created_at  TIMESTAMPTZ DEFAULT now()
);

-- =====================
-- 학력 정보
-- =====================
CREATE TABLE public.education_info (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id           UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  school            TEXT,
  is_custom_school  BOOLEAN DEFAULT false,
  department        TEXT,
  graduation_status TEXT CHECK (graduation_status IN ('졸업','재학','중퇴','휴학')),
  UNIQUE(user_id)
);

-- =====================
-- 소셜 링크
-- =====================
CREATE TABLE public.social_links (
  id        UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id   UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  instagram TEXT,
  youtube   TEXT,
  tiktok    TEXT,
  UNIQUE(user_id)
);

-- =====================
-- 사진 자료 (서브 이미지)
-- =====================
CREATE TABLE public.artist_photos (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  url         TEXT NOT NULL,
  name        TEXT,
  is_main     BOOLEAN DEFAULT false,
  sort_order  INT DEFAULT 0,
  created_at  TIMESTAMPTZ DEFAULT now()
);

-- =====================
-- 영상 자료
-- =====================
CREATE TABLE public.video_assets (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  type        TEXT NOT NULL CHECK (type IN ('file','link')),
  name        TEXT NOT NULL,
  url         TEXT NOT NULL,
  thumbnail   TEXT,
  duration    TEXT,
  file_size   TEXT,
  platform    TEXT CHECK (platform IN ('youtube','vimeo','other')),
  sort_order  INT DEFAULT 0,
  created_at  TIMESTAMPTZ DEFAULT now()
);

-- =====================
-- 멤버십
-- =====================
CREATE TABLE public.memberships (
  id                    UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id               UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  status                TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active','pending_cancellation','cancelled')),
  started_at            TIMESTAMPTZ DEFAULT now(),
  expires_at            TIMESTAMPTZ NOT NULL,
  auto_renew            BOOLEAN DEFAULT true,
  points                INT DEFAULT 0,
  created_at            TIMESTAMPTZ DEFAULT now(),
  updated_at            TIMESTAMPTZ DEFAULT now(),
  UNIQUE(user_id)
);

-- =====================
-- 결제 내역
-- =====================
CREATE TABLE public.payments (
  id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id             UUID NOT NULL REFERENCES public.profiles(id),
  membership_id       UUID REFERENCES public.memberships(id),
  amount              INT NOT NULL,
  points_used         INT DEFAULT 0,
  payment_method      TEXT CHECK (payment_method IN ('card','kakao_pay','naver_pay','points')),
  status              TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','completed','failed','cancelled')),
  pg_transaction_id   TEXT,
  pg_provider         TEXT,
  created_at          TIMESTAMPTZ DEFAULT now()
);

-- =====================
-- 이벤트/오디션
-- =====================
CREATE TABLE public.events (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  type            TEXT NOT NULL CHECK (type IN ('오디션','특강')),
  title           TEXT NOT NULL,
  description     TEXT,
  location        TEXT,
  event_time      TEXT,
  deadline        DATE,
  status          TEXT NOT NULL DEFAULT '진행중' CHECK (status IN ('진행중','마감')),
  image_url       TEXT,
  is_member_only  BOOLEAN DEFAULT false,
  project_name    TEXT,
  director        TEXT,
  detail_content  TEXT,
  created_at      TIMESTAMPTZ DEFAULT now(),
  updated_at      TIMESTAMPTZ DEFAULT now()
);

-- =====================
-- 이벤트 지원
-- =====================
CREATE TABLE public.event_applications (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id    UUID NOT NULL REFERENCES public.events(id) ON DELETE CASCADE,
  user_id     UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  status      TEXT NOT NULL DEFAULT 'applied' CHECK (status IN ('applied','accepted','rejected','cancelled')),
  applied_at  TIMESTAMPTZ DEFAULT now(),
  updated_at  TIMESTAMPTZ DEFAULT now(),
  UNIQUE(event_id, user_id)
);

-- =====================
-- 프로필 투어
-- =====================
CREATE TABLE public.tours (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  category    TEXT CHECK (category IN ('영화','드라마','광고','기타')),
  title       TEXT NOT NULL,
  status      TEXT NOT NULL DEFAULT 'ongoing' CHECK (status IN ('new','ongoing','closed')),
  description TEXT,
  image_url   TEXT,
  created_at  TIMESTAMPTZ DEFAULT now(),
  updated_at  TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE public.tour_participations (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tour_id         UUID NOT NULL REFERENCES public.tours(id) ON DELETE CASCADE,
  user_id         UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  status          TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','approved','rejected')),
  applied_at      TIMESTAMPTZ DEFAULT now(),
  reviewed_at     TIMESTAMPTZ,
  reviewed_by     UUID REFERENCES public.profiles(id),
  UNIQUE(tour_id, user_id)
);

-- =====================
-- 뉴스/소식
-- =====================
CREATE TABLE public.news (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title         TEXT NOT NULL,
  content       TEXT,
  excerpt       TEXT,
  image_url     TEXT,
  slug          TEXT UNIQUE,
  is_published  BOOLEAN DEFAULT true,
  published_at  TIMESTAMPTZ DEFAULT now(),
  created_at    TIMESTAMPTZ DEFAULT now(),
  updated_at    TIMESTAMPTZ DEFAULT now()
);

-- =====================
-- 제휴업체 (파트너)
-- =====================
CREATE TABLE public.partners (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name        TEXT NOT NULL,
  description TEXT,
  image_url   TEXT,
  link        TEXT,
  sort_order  INT DEFAULT 0,
  created_at  TIMESTAMPTZ DEFAULT now()
);

-- =====================
-- 프로필 지원 기관
-- =====================
CREATE TABLE public.support_agencies (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name        TEXT NOT NULL,
  email       TEXT,
  website     TEXT,
  category    TEXT CHECK (category IN ('엔터테인먼트','광고에이전시')),
  description TEXT,
  sort_order  INT DEFAULT 0,
  is_active   BOOLEAN DEFAULT true,
  created_at  TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE public.agency_applications (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  agency_id   UUID NOT NULL REFERENCES public.support_agencies(id),
  user_id     UUID NOT NULL REFERENCES public.profiles(id),
  applied_at  TIMESTAMPTZ DEFAULT now(),
  UNIQUE(agency_id, user_id)
);

-- =====================
-- 후기
-- =====================
CREATE TABLE public.reviews (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     UUID NOT NULL REFERENCES public.profiles(id),
  category    TEXT NOT NULL CHECK (category IN ('service','acting','event','etc')),
  title       TEXT NOT NULL,
  content     TEXT,
  image_url   TEXT,
  rating      INT CHECK (rating BETWEEN 1 AND 5),
  is_hidden   BOOLEAN DEFAULT false,
  created_at  TIMESTAMPTZ DEFAULT now()
);

-- =====================
-- 관리자 작업 로그
-- =====================
CREATE TABLE public.admin_logs (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  admin_id    UUID NOT NULL REFERENCES public.profiles(id),
  action      TEXT NOT NULL,
  target_type TEXT,
  target_id   UUID,
  old_value   JSONB,
  new_value   JSONB,
  created_at  TIMESTAMPTZ DEFAULT now()
);
```

---

## 3. Supabase Storage 버킷 구조

```
supabase-storage/
├── avatars/          # 프로필 메인 사진 (public)
├── artist-photos/    # 서브 사진 (public)
├── videos/           # 영상 파일 (auth-required)
├── portfolios/       # PDF 포트폴리오 (auth-required)
└── news-images/      # 뉴스/이벤트 이미지 (public)
```

---

## 4. RLS (Row Level Security) 정책 요약

| 테이블 | SELECT | INSERT | UPDATE | DELETE |
|--------|--------|--------|--------|--------|
| profiles | 본인 또는 admin | auth users | 본인 또는 admin | admin |
| artist_profiles | 공개된 것 전체, 본인 | auth users (1인 1개) | 본인 또는 admin | 본인 또는 admin |
| memberships | 본인 또는 admin | server/admin | server/admin | admin |
| payments | 본인 또는 admin | server | - | - |
| events | 전체 공개 | admin | admin | admin |
| reviews | is_hidden=false 전체 | auth users | 본인 또는 admin | 본인 또는 admin |
| admin_logs | admin | admin | - | - |

---

## 5. 외부 서비스 연동

| 서비스 | 용도 | 비고 |
|--------|------|------|
| Supabase Auth | 소셜 로그인 (카카오, 구글) | OAuth 설정 필요 |
| 포트원 (구 아임포트) | 결제 PG 연동 | 월 정기결제 지원 |
| Resend | 이메일 발송 | 멤버십 알림, 지원 이메일 |
| Supabase Edge Functions | 서버사이드 로직 | 멤버십 만료 스케줄러, 결제 webhook |
| Vercel | 배포 | people-art.co.kr 도메인 연결 |

---

## 6. 구현 로드맵

### Phase 1 — 기반 구축 (1~2주)
- [ ] Supabase 프로젝트 생성 및 DB 스키마 마이그레이션
- [ ] Supabase Auth 설정 (카카오, 구글 OAuth)
- [ ] Next.js에 Supabase 클라이언트 연동 (`@supabase/ssr`)
- [ ] Storage 버킷 생성 및 RLS 설정
- [ ] 기존 Context를 Supabase 훅으로 교체

### Phase 2 — 핵심 기능 (2~3주)
- [ ] 회원가입/로그인 플로우 (소셜 로그인)
- [ ] 프로필 관리 (마이페이지 → Supabase CRUD)
- [ ] 배우 검색 (DB 쿼리 기반 필터링)
- [ ] 멤버십 결제 (포트원 연동)
- [ ] 포인트 시스템

### Phase 3 — 콘텐츠 & 어드민 (2~3주)
- [ ] 관리자 페이지 (/admin/*) 구현
  - 대시보드
  - 회원 관리
  - 이벤트/오디션 CRUD
  - 투어 CRUD
  - 뉴스 CRUD
  - 결제 내역
- [ ] 이벤트/투어/뉴스를 DB 기반으로 전환
- [ ] 지원 기관 기능 (이메일 자동 발송)

### Phase 4 — 마무리 (1주)
- [ ] Vercel 배포 설정
- [ ] people-art.co.kr 도메인 연결 (cafe24 → Vercel)
- [ ] Edge Function 배포 (멤버십 만료 스케줄러)
- [ ] 성능 최적화 및 SEO

---

## 7. 어드민 페이지 구조 (/admin)

```
/admin
├── /               # 대시보드 (통계 카드, 최근 가입자, 결제 현황)
├── /members        # 회원 목록 (검색, 등급 필터)
│   └── /[id]       # 회원 상세 (프로필, 멤버십, 결제 내역)
├── /memberships    # 멤버십 현황 (만료 예정자, 자동갱신 목록)
├── /payments       # 결제 내역 전체
├── /events         # 이벤트/오디션 관리
│   ├── /new        # 신규 생성
│   └── /[id]       # 수정
├── /tours          # 투어 관리
│   ├── /new
│   └── /[id]
├── /news           # 뉴스 관리
│   ├── /new
│   └── /[id]
├── /partners       # 파트너사 관리
├── /agencies       # 지원 기관 관리
├── /reviews        # 후기 관리 (숨김 처리)
└── /artists        # 배우 프로필 관리 (노출 ON/OFF)
```

---

## 8. 작업 전 준비 사항 체크리스트

### 즉시 필요한 것 (작업 시작 전)
- [ ] **Supabase 계정 & 프로젝트 생성** → Project URL, anon key, service_role key
- [ ] **포트원 계정 생성** → 가맹점 식별코드, API 키 (정기결제 사용 신청 필요)
- [ ] **카카오 개발자 앱** → REST API 키, Redirect URI 설정
- [ ] **구글 OAuth 앱** → Client ID, Client Secret
- [ ] **Resend 계정** → API 키, 발신 도메인 (people-art.co.kr) 인증

### 환경변수 목록 (.env.local)
```env
# Supabase
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=

# 포트원 (아임포트)
NEXT_PUBLIC_PORTONE_STORE_ID=
PORTONE_API_SECRET=

# Resend
RESEND_API_KEY=

# App
NEXT_PUBLIC_APP_URL=https://people-art.co.kr
```

### Vercel 도메인 설정
1. Vercel 프로젝트에 `people-art.co.kr` 커스텀 도메인 추가
2. cafe24 도메인 DNS → Vercel nameserver로 변경 (또는 CNAME 레코드)
3. Supabase Auth Redirect URL에 `people-art.co.kr` 추가
