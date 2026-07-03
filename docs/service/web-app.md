# 웹 서비스 앱 (`apps/app` → app.gigon.io)

Next 16 (App Router, Turbopack) · Tailwind v4 + `@repo/ui` 토큰 · Supabase(@supabase/ssr) · 포트 3001

## 라우트

| 경로 | 내용 |
| --- | --- |
| `/login` | 전화 OTP 로그인 (클라이언트) |
| `/onboarding` | 역할 선택 + 이름/상호/초대코드 + 위치(geolocation, 8초 폴백) |
| `/` | 워커 홈 (서버 게이트 → `WorkerApp`) |
| `/business` | 사장님 콘솔 (서버 게이트 → `BusinessApp`) |
| `/terms` `/privacy` | 약관/개인정보 (공개, `app/(legal)/`) — 드로어/푸터/로그인에서 링크 |

게이트: `proxy.ts`(Next 16 미들웨어)가 세션 갱신+로그인 강제(`/login` `/terms` `/privacy`는
공개), 각 페이지 서버 컴포넌트가 프로필 온보딩/역할/verified 리다이렉트 처리.

## 주요 파일

```
proxy.ts                    세션 리프레시 + /login 게이트 (allowedDevOrigins: 127.0.0.1)
lib/supabase/{client,server}.ts   브라우저 싱글턴 / 서버(cookies) 클라이언트
lib/domain.ts               타입, 상수(필터/태그/사유), 평판·배지·스테퍼 헬퍼
lib/geo.ts                  MACTAN_CENTER, 하버사인 거리, 표시 포맷
components/
  shell.tsx        AppShell: 데스크톱 앱바(계정 메뉴)+모바일 헤더/드로어/스마트배너,
                   ToastProvider(useToast)
  worker-app.tsx   워커 전체: 데이터+realtime, 상태 스트립, 리스트/지도,
                   GigDetailSheet·PinSheet·DisputeSheet 내장
  business-app.tsx 사장님 전체: 사이드바+콘솔, PostGigSheet, 매칭확정/노쇼 confirm
  sheets.tsx       공용 ChatSheet(realtime), RateSheet, CancelSheet(취소 사유 선택)
  map-view.tsx     Google Maps(@vis.gl) ↔ SVG 폴백, PricePin/YouDot
  ui.tsx           Sheet(반응형 오버레이), MonoBadge, MiniStepper, Chip, LiveDot…
  icons.tsx        디자인 SVG 패스 아이콘 세트
```

## 반응형 규칙 (디자인 2벌 = 브레이크포인트 1개)

- `<768px` = `GigOn Web Mobile.dc.html`: 바텀시트, 리스트/지도 토글 필, 햄버거 드로어
- `≥768px(md:)` = `GigOn Web.dc.html`:
  - 앱바(네비/존 칩/알림/계정 드롭다운)
  - 워커 **스플릿 뷰**: 442px 리스트 패널 + 상시 지도
  - 비즈니스: 392px 사이드바(공고 카드) + 메인(지원자 grid, 스테퍼 헤더)
  - `Sheet desktop="panel"` → 우측 슬라이드오버(452px: 공고 상세, 공고 등록)
  - `Sheet desktop="modal"`(기본) → 중앙 모달(PIN/평가/분쟁), floating confirm도 모달화
  - ChatSheet → 우하단 도크(380×540)

## 데이터 패턴

- 클라이언트 컴포넌트가 직접 select(+조인 `profiles!fk`) — RLS는 authenticated 전체 읽기
- 쓰기는 전부 `api.post("/api/…")` (`lib/api.ts` 싱글턴 — @repo/api 클라이언트,
  same-origin + Bearer). 취소: 워커 상태 스트립(MATCHED)·비즈니스 콘솔에
  Cancel 링크 → `/api/matches/:id/cancel` / `/api/gigs/:id/cancel`
- `loadAll()` 첫 줄에서 `expire_stale_gigs` 호출(만료 공고 스윕 — 유일하게 남은 rpc)
- realtime: `postgres_changes` 구독 → 토스트 + `loadAll()` refetch (coarse)
- 거리: 클라이언트 하버사인 계산·정렬

## 환경변수 (Vercel `gigon-app`에 설정됨 / 로컬 `.env.local`)

```
NEXT_PUBLIC_SUPABASE_URL / NEXT_PUBLIC_SUPABASE_ANON_KEY
NEXT_PUBLIC_GOOGLE_MAPS_API_KEY / NEXT_PUBLIC_GOOGLE_MAPS_MAP_ID   (없으면 SVG 지도)
```

## 배포

`main` 푸시 → Vercel 자동 빌드/배포. 수동 확인: `pnpm --filter app build`.
주의: dev 서버 실행 중 `next build` 금지(.next 충돌).
