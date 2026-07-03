# API 마이그레이션 — Supabase RPC → Next.js Route Handlers

> **오너 결정 (2026-07-03): 출시 전에 쓰기 경로를 SQL RPC에서 Next.js Route Handlers(TS)로 이관한다.**
> 이유: 비즈니스 로직을 TypeScript로(디버깅·Sentry·단위테스트·로직 이력 관리),
> 추후 side effect(푸시·과금·외부 API)를 넣을 자리 확보, SQL/PLpgSQL 유지보수 부담 제거.
>
> 이 문서는 **새 세션이 이 문서만 보고 끝까지 수행**할 수 있게 쓴 실행 스펙이다.
> 배경 아키텍처는 [backend.md](./backend.md), 현재 RPC 의미는 `supabase/migrations/*.sql`이 원본.

## 0. 원칙 — 옮기는 것 / 남기는 것

| | 결정 |
| --- | --- |
| **쓰기(상태 전이) 15개** | Route Handlers로 이관 (`apps/app/app/api/**`) — 이 문서의 §4 |
| 읽기(select/조인) | **그대로** supabase-js + PostgREST (RLS `authenticated read`) |
| Realtime 구독 | **그대로** (서버가 쓰든 클라가 쓰든 WAL 이벤트는 동일하게 발생) |
| Auth | **그대로** Supabase Auth (phone OTP + Semaphore 훅). API는 JWT 검증만 |
| `expire_stale_gigs()` | **DB에 유지** (pg_cron + 클라이언트 스윕 호출 그대로) — 유일하게 남는 클라 호출 RPC |
| `handle_new_user` 트리거 | **DB에 유지** (auth.users → profiles 자동 생성) |
| DB 스키마 진실 | **계속 `supabase/migrations/`** (supabase CLI). drizzle은 **쿼리 전용**, 마이그레이션 도구로 쓰지 않는다 |
| RLS 방침 | 변경 없음 (읽기 open / 쓰기 정책 0개). API는 직결 커넥션이라 RLS 미적용 |
| 나머지 RPC 15개 + `audit()` | 클라 전환 완료 후 **DROP** (§5 락다운 마이그레이션) |
| tRPC | 쓰지 않음 (오너가 Route Handlers 선택). 공유 zod 스키마+fetch 클라이언트로 타입 안전 확보 |

**타이밍 주의: 모바일이 아직 스토어 미배포(Expo Go만)라서 하드 컷오버가 가능하다.
EAS 스토어 배포 전에 이 마이그레이션을 끝내야 API 버저닝 부담이 없다.**

## 1. 목표 아키텍처

```
웹 (app.gigon.io)                 모바일 (Expo)
  읽기: supabase-js ────────────────┐ 읽기: supabase-js
  실시간: supabase realtime ────────┤ 실시간: supabase realtime
  쓰기: fetch /api/* (쿠키 세션)     │ 쓰기: fetch https://app.gigon.io/api/* (Bearer JWT)
        │                          │
        ▼                          ▼
  Next.js Route Handlers (apps/app/app/api/**)   ← 비즈니스 로직 (TS)
        │  requireUser(): Bearer 우선, 쿠키 폴백 (supabase.auth.getUser)
        ▼
  drizzle + postgres.js ── Supavisor 트랜잭션 풀러(:6543) ──► Postgres
                                                (트랜잭션·행잠금·audit_log 기록)
```

- 모바일도 그냥 HTTPS 호출이므로 CORS 불필요(네이티브 fetch는 CORS 없음, 웹은 same-origin).
- 웹은 API와 같은 Next 앱이라 **배포가 원자적** — 클라/서버 버전 스큐 없음.

## 2. Phase 0 — 스캐폴딩

### 2.1 의존성 (apps/app)

```bash
pnpm --filter app add drizzle-orm postgres zod bcryptjs
pnpm --filter app add -D drizzle-kit @types/bcryptjs
```

### 2.2 환경변수 `DATABASE_URL` (서버 전용 — NEXT_PUBLIC 아님!)

- 클라우드(Vercel `gigon-app` env Production/Preview + `apps/app/.env.local`):
  `postgresql://postgres.uoeatrexoeghoigbxage:<DB_PASSWORD>@aws-1-ap-northeast-1.pooler.supabase.com:6543/postgres`
  — **트랜잭션 모드 풀러(:6543)**. 정확한 호스트는 대시보드 Connect > Transaction pooler에서 복사.
  DB 비밀번호는 오너 보유(supabase link 때 사용한 것). 레포에 커밋 금지.
- 로컬 스택: `postgresql://postgres:postgres@127.0.0.1:54322/postgres`
- Vercel env 등록은 CLI(`vercel env add`) 또는 대시보드. `.env.local`은 이미 gitignored.

### 2.3 파일 레이아웃

```
apps/app/
  lib/server/
    db.ts          drizzle 클라이언트 (아래 코드)
    schema.ts      drizzle 테이블 정의 (drizzle-kit pull로 introspect 후 정리, 커밋)
    auth.ts        requireUser(req) → { id } | 401 throw
    errors.ts      ApiError + 에러 응답 헬퍼
    audit.ts       audit(tx, event, {gigId?, matchId?, actorId?, payload?})
  app/api/**       엔드포인트 (§4)
packages/api/      @repo/api — zod 스키마 + fetch 클라이언트 (§4.3, 웹·모바일 공용)
```

### 2.4 공통 헬퍼 스펙

**db.ts** — 풀러는 트랜잭션 모드라 `prepare: false` 필수, 커넥션 소수 유지:

```ts
import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import * as schema from "./schema";

const client = postgres(process.env.DATABASE_URL!, { prepare: false, max: 2 });
export const db = drizzle(client, { schema });
```

**auth.ts** — Bearer 우선(모바일), 쿠키 폴백(웹). 검증은 GoTrue에 위임:

```ts
// Authorization: Bearer <access_token> 있으면 supabase.auth.getUser(token)
// 없으면 @repo/supabase server(쿠키) 클라이언트로 getUser()
// 실패 → throw new ApiError(401, "unauthorized", "sign in required")
// 반환: { id: string }  (auth.uid()에 해당)
```

anon key로 만든 `createClient(URL, ANON_KEY).auth.getUser(token)`이 서명·만료·폐기를
모두 검증한다(권위 소스). 요청당 GoTrue 1회 호출은 허용 범위 — 최적화(jose 로컬 검증)는
나중 과제.

**errors.ts** — 응답 규약:

```ts
// 실패: HTTP status + { error: { code, message } }
// 코드: unauthorized(401) forbidden(403) not_found(404)
//       invalid_input(400, zod 실패 포함) invalid_state(409)
// route.ts 공통 래퍼: try { ... } catch (e) { toResponse(e) } — 미지정 예외는 500 + Sentry
```

성공은 `200 { data }`. **예외: `pin/verify`는 현재 계약 유지** — 항상 200에
`{ok:true} | {ok:false, error:"wrong_pin"|"locked"|"no_active_pin", ...}` (클라이언트가
이 형태를 데이터로 소비 중이라 교체 비용 최소화).

**audit.ts** — 트랜잭션 안에서 `audit_log` insert (기존 SQL `audit()`와 같은 컬럼:
event, gig_id, match_id, actor_id, payload).

### 2.5 ⚠️ proxy.ts에서 /api 제외 (치명 함정)

현재 `proxy.ts` matcher가 `/api/*`도 잡는다 → 쿠키 없는 모바일 요청이 **/login으로 307
리다이렉트**되어 HTML을 받는다. 반드시 제외:

```ts
export const config = {
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico)$).*)"],
};
```

인증은 각 핸들러의 `requireUser()`가 담당(401 JSON).

## 3. 이관 대상 RPC → 엔드포인트 매핑

전부 POST. `:id`는 URL 세그먼트.

| # | RPC | 엔드포인트 | body (zod) | 성공 응답 |
| --- | --- | --- | --- | --- |
| 1 | complete_onboarding | `/api/onboarding` | `{name, role:"worker"\|"employer", area, lat?, lng?}` | `{}` |
| 2 | redeem_invite | `/api/invites/redeem` | `{code, businessName?}` | `{ok:boolean}` |
| 3 | set_active_role | `/api/profile/role` | `{role}` | `{}` |
| 4 | post_gig | `/api/gigs` | `{title,type,description?,pay,duration,whenLabel,area,lat,lng,slots}` | `{id}` |
| 5 | apply_to_gig | `/api/gigs/:id/apply` | `{}` | `{id}` (application id) |
| 6 | cancel_gig | `/api/gigs/:id/cancel` | `{reason?}` | `{}` |
| 7 | select_applicant | `/api/applications/:id/select` | `{}` | `{matchId}` |
| 8 | mark_arrived | `/api/matches/:id/arrive` | `{}` | `{}` |
| 9 | issue_pin | `/api/matches/:id/pin` | `{}` | `{pin}` (평문은 응답으로만) |
| 10 | verify_pin | `/api/matches/:id/pin/verify` | `{pin}` | `{ok:...}` (§2.4 예외 계약) |
| 11 | report_no_show | `/api/matches/:id/no-show` | `{}` | `{}` |
| 12 | cancel_match | `/api/matches/:id/cancel` | `{reason?}` | `{}` |
| 13 | open_dispute | `/api/matches/:id/dispute` | `{reason, detail?}` | `{ticket}` ("D-10xx") |
| 14 | post_review | `/api/matches/:id/review` | `{stars:1..5, tags:string[], comment?}` | `{}` |
| 15 | send_message | `/api/matches/:id/messages` | `{body:1..2000자}` | `{id}` |

## 4. 엔드포인트별 상세 스펙 (SQL 의미의 정확한 이식)

모두 `requireUser()` 선행, **본문 전체가 하나의 `db.transaction`**. 원본 SQL:
`20260702000000_init.sql`(1~15), `20260702030000_simplify_rls.sql`(PIN 2개),
`20260703000000_cancel_and_expiry.sql`(취소 2개). 이식 후 동작이 동일해야 한다.

**동시성 원칙**: 상태 가드는 "읽고 나서 쓰기"가 아니라 **조건부 UPDATE의 rowCount**로
검증한다 (`UPDATE … WHERE id=$ AND status='POSTED'` → 0행이면 409 invalid_state).
PIN 시도 카운터만 `SELECT … FOR UPDATE` 필요.

1. **onboarding** — `profiles` 갱신: `full_name = trim(name)이 비면 기존값 유지`,
   `active_role`, `area/lat/lng는 null이면 기존값(coalesce)`, `onboarded=true`.
2. **invites/redeem** — tx: `UPDATE invite_codes SET uses_left=uses_left-1 WHERE
   code=upper(trim($code)) AND uses_left>0 RETURNING` → 0행이면 `{ok:false}`(200).
   성공 시 `profiles SET employer_verified=true, active_role='employer',
   business_name=coalesce(nullif(trim($bn)),기존)` → `{ok:true}`.
3. **profile/role** — `UPDATE profiles SET active_role=$role WHERE id=uid`.
4. **gigs (등록)** — 가드: `profiles.employer_verified` 아니면 403 forbidden
   ("employer not invite-verified"). insert gigs(기본값: status POSTED,
   expires_at now()+24h — DB default 사용). audit `gig_posted` {pay}. → {id}.
5. **gigs/:id/apply** — 가드: gig가 `status='POSTED' AND expires_at>now()` 아니면 409
   ("gig is not open"); `employer_id=uid`면 403 ("cannot apply to your own gig").
   `INSERT applications(gig_id,worker_id) ON CONFLICT (gig_id,worker_id) DO UPDATE SET
   status='APPLIED' RETURNING id`. audit `applied`.
6. **gigs/:id/cancel** — `UPDATE gigs SET status='CANCELLED' WHERE id=$ AND
   employer_id=uid AND status='POSTED'` → 0행 409 ("gig is not an open posting of
   yours"). `UPDATE applications SET status='REJECTED' WHERE gig_id=$ AND
   status='APPLIED'`. audit `gig_cancelled` {reason}.
7. **applications/:id/select** — application+gig 로드(없으면 404). `gig.employer_id
   ≠uid` → 403 ("not your gig"). tx 내 레이스 가드:
   `UPDATE gigs SET status='MATCHED' WHERE id=$gig AND status='POSTED'` → 0행 409
   ("gig is not open"). `INSERT matches(gig_id, application_id, worker_id,
   employer_id)` → matchId. `UPDATE applications SET status='SELECTED'`.
   `INSERT billable_events(match_id,'match_confirmed',0)`. audit `match_confirmed`
   {billable:true, amount:0}.
8. **matches/:id/arrive** — `UPDATE matches SET status='IN_PROGRESS', arrived_at=now()
   WHERE id=$ AND worker_id=uid AND status='MATCHED'` → 0행 409 ("match not in
   MATCHED state"). audit `arrived`.
9. **matches/:id/pin (발급)** — 가드: match `employer_id=uid AND status='IN_PROGRESS'`
   아니면 409. PIN: `crypto.randomInt(0,10000)` 4자리 zero-pad. bcryptjs
   `hash(pin, 10)`. `INSERT match_pins ... ON CONFLICT (match_id) DO UPDATE SET
   pin_hash=…, issued_at=now(), attempts=0, locked_until=null`.
   `UPDATE matches SET pin_issued_at=now()`. audit `pin_issued`. → {pin}.
10. **matches/:id/pin/verify** — tx:
    - match 로드 `worker_id=uid` 아니면 404("match not found"); status≠IN_PROGRESS → 409.
    - `SELECT * FROM match_pins WHERE match_id=$ FOR UPDATE` — 없거나
      `issued_at < now()-24h` → `{ok:false, error:"no_active_pin"}`.
    - `locked_until > now()` → `{ok:false, error:"locked", locked_for:ceil(초)}`.
    - bcryptjs `compare(pin, hash)` 성공 → matches COMPLETED+completed_at,
      gigs COMPLETED, `profiles.jobs_completed++`(워커), `DELETE match_pins`,
      audit `pin_verified_completed` → `{ok:true}`.
    - 실패: `attempts+1>=3` → attempts=0, locked_until=now()+60s, audit `pin_locked`,
      `{ok:false,error:"locked",locked_for:60}`; 아니면 attempts++,
      `{ok:false,error:"wrong_pin",attempts_left:3-(attempts+1)}`.
11. **matches/:id/no-show** — `UPDATE matches SET status='NO_SHOW' WHERE id=$ AND
    employer_id=uid AND status='MATCHED' RETURNING *` → 0행 409 ("match not in
    MATCHED state"). application REJECTED. gig 재오픈 — **개선 포함**(cancel_match와
    통일): `status = expires_at>now() ? 'POSTED' : 'EXPIRED'` WHERE id AND
    status='MATCHED'. `profiles.no_show_count++`(워커). audit `no_show_recorded`
    {worker}.
12. **matches/:id/cancel** — `UPDATE matches SET status='CANCELLED',
    cancelled_by=uid, cancel_reason=$reason, cancelled_at=now() WHERE id=$ AND
    status='MATCHED' AND (worker_id=uid OR employer_id=uid) RETURNING *` → 0행이면
    follow-up select로 404("match not found") vs 409("only a MATCHED gig can be
    cancelled — after arrival use no-show or dispute") 구분. 취소자
    `profiles.cancel_count++`. `DELETE match_pins`. 워커 취소: application
    WITHDRAWN + gig `POSTED/EXPIRED`(만료 여부) WHERE status='MATCHED'. 사장님 취소:
    application REJECTED + gig CANCELLED WHERE status='MATCHED'. audit
    `match_cancelled` {by:"worker"|"employer", reason}.
13. **matches/:id/dispute** — 참여자 아니면 403 ("not a participant"). insert
    disputes → id. audit `dispute_opened` {reason}. → `{ticket: "D-"+(1000+id)}`.
14. **matches/:id/review** — 참여자 404/403; status≠COMPLETED → 409 ("reviews unlock
    only after PIN completion"). ratee = 상대방. insert reviews — unique(match_id,
    rater_id) 충돌 시 409 invalid_state("already reviewed"). ratee `profiles
    rating_sum+=stars, rating_count++`. audit `review_posted` {stars}.
15. **matches/:id/messages** — 참여자 + status ∈ (MATCHED, IN_PROGRESS, COMPLETED)
    아니면 403 ("chat is only open on an active match"). insert messages → {id}.
    (Realtime이 INSERT를 브로드캐스트하므로 클라 동작 불변.)

### 4.3 공유 클라이언트 `@repo/api` (packages/api)

- `src/schemas.ts` — 위 body들의 zod 스키마 + 응답 타입 (서버와 클라가 같은 것 import).
- `src/client.ts`:

```ts
export function createApiClient(opts: {
  baseUrl: string;                       // 웹 "" (same-origin) · 모바일 EXPO_PUBLIC_API_URL ?? "https://app.gigon.io"
  getToken: () => Promise<string | null>; // 양쪽 다 supabase.auth.getSession()?.access_token
}) {
  // post<T>(path, body): fetch POST, Authorization: Bearer 첨부(있으면),
  // !res.ok → throw new ApiClientError(code, message)  (res.json().error)
  // 200 → data 반환. pin/verify는 {ok:...}를 그대로 반환
}
```

- 웹: `apps/app/lib/api.ts`에서 싱글턴 생성(supabaseBrowser 세션 사용).
- 모바일: `src/lib/api.ts` 생성(src/lib/supabase의 클라이언트 세션 사용).
  metro는 워크스페이스 패키지 해석 가능(@repo/ui/tokens 전례, `unstable_enablePackageExports`).
- 기존 UI는 `error.message`를 토스트에 그대로 쓰므로 **ApiClientError.message에 서버
  message를 담으면 클라 코드 변경이 호출부 교체로 끝난다.**

## 5. 클라이언트 교체 지점 (전수 목록 — 2026-07-03 grep 기준)

`expire_stale_gigs` 호출(웹 2·모바일 2)은 **교체하지 않고 유지**.

**웹 (apps/app):**

| 파일 | RPC → API |
| --- | --- |
| `app/onboarding/page.tsx` | redeem_invite, complete_onboarding |
| `components/shell.tsx` (switchRole) | set_active_role |
| `components/sheets.tsx` (ChatSheet.send) | send_message — 응답 {id}로 낙관적 append 유지 |
| `components/worker-app.tsx` | apply_to_gig, mark_arrived, cancel_match, post_review, verify_pin(PinSheet), open_dispute(DisputeSheet) |
| `components/business-app.tsx` | select_applicant, issue_pin, report_no_show, cancel_match, cancel_gig, post_review, post_gig(PostGigSheet) |

**모바일 (전부 `apps/mobile/src/store/gig-store.ts`):**
redeem_invite · complete_onboarding · set_active_role · apply_to_gig · mark_arrived ·
verify_pin(enterPinDigit) · post_review×2(submitRate/submitERate) · open_dispute ·
cancel_match(cancelActiveMatch) · cancel_gig(cancelPosting) · send_message(sendChat) ·
post_gig · select_applicant · issue_pin · report_no_show — 화면 코드는 무변경(스토어가 봉합선).

## 6. 락다운 마이그레이션 (클라 전환 검증 후 마지막에)

`supabase/migrations/<ts>_drop_rpc_layer.sql`:

```sql
-- 상태머신은 이제 app.gigon.io/api 가 담당. 남는 것: expire_stale_gigs, handle_new_user.
drop function if exists public.complete_onboarding(text, public.app_role, text, double precision, double precision);
drop function if exists public.redeem_invite(text, text);
drop function if exists public.set_active_role(public.app_role);
drop function if exists public.post_gig(text, public.gig_type, text, integer, text, text, text, double precision, double precision, integer);
drop function if exists public.apply_to_gig(uuid);
drop function if exists public.select_applicant(uuid);
drop function if exists public.mark_arrived(uuid);
drop function if exists public.issue_pin(uuid);
drop function if exists public.verify_pin(uuid, text);
drop function if exists public.report_no_show(uuid);
drop function if exists public.open_dispute(uuid, text, text);
drop function if exists public.post_review(uuid, integer, text[], text);
drop function if exists public.send_message(uuid, text);
drop function if exists public.cancel_match(uuid, text);
drop function if exists public.cancel_gig(uuid, text);
drop function if exists public.audit(text, uuid, uuid, jsonb); -- expire는 직접 insert라 미사용
-- 남은 직접 쓰기 경로도 폐쇄 (현 UI 미사용, 20260702010000에서 부여했던 것)
revoke update on public.profiles from authenticated;
notify pgrst, 'reload schema';
```

적용 후 `pnpm --filter @repo/supabase gen-types` 재생성(로컬 스택 기준) —
클라 코드에 남은 rpc 참조는 expire_stale_gigs뿐이어야 컴파일 통과.

## 7. 검증 계획

1. **API 통합 테스트 (vitest, 로컬 스택 필요 — `npx supabase start`)**
   `apps/app/tests/api/*.test.ts` — 핸들러 함수를 직접 import해 Request로 호출하거나
   `next dev` 상대로 fetch. 시드 계정(20000000-…/10000000-…)과 로컬 DATABASE_URL 사용.
   케이스(기존 SQL 스모크의 이식 + 추가):
   - 풀 해피패스: post→apply→select(billable_event ₱0)→arrive→pin 발급→오답 2회
     (attempts_left 검증)→정답→양측 review→집계 확인, audit_log 이벤트 순서
   - PIN: 3회 오답→locked 60s→잠금 중 재시도 locked→(시간 조작 또는 locked_until
     직접 갱신 후) 성공, no_active_pin(발급 전), 24h 만료
   - 취소 A/B/C/D: 워커 취소(재오픈+WITHDRAWN+cancel_count), 사장 취소(CANCELLED+
     REJECTED), 공고 취소(무penalty), 이중 취소 409
   - no-show: 재오픈 + no_show_count, 만료 지난 공고는 EXPIRED로
   - 권한: 남의 공고 select 403, 비참여자 dispute/review/message 403, 미인증 401,
     employer 미인증 post_gig 403
   - 리뷰: COMPLETED 전 409, 중복 409
2. **웹 E2E** — Playwright 2-오리진(워커 localhost:3001 / 사장 127.0.0.1:3001) 풀 루프
   재실행 (7/2와 동일 시나리오 + 취소 경로 1개).
3. **모바일** — `npx tsc --noEmit` + `npx expo export --platform android` +
   Expo Go 실기기로 로그인→지원→(웹에서 매칭)→도착→PIN 스모크. 로컬 서버 상대 테스트는
   `EXPO_PUBLIC_API_URL=http://<맥IP>:3001`.
4. **프로덕션** — 배포 후: 미인증 `curl -X POST https://app.gigon.io/api/matches/x/arrive`
   → 401 JSON(HTML 리다이렉트면 §2.5 미적용), 테스트 계정으로 apply→cancel 1루프.
   락다운 후 구 RPC 404 확인: `POST /rest/v1/rpc/apply_to_gig` → 404.

## 8. 실행 순서 (커밋 단위 제안)

1. `feat(app): api scaffolding` — 의존성, db/schema/auth/errors/audit 헬퍼,
   proxy.ts /api 제외, DATABASE_URL(로컬+Vercel), `@repo/api` 패키지 골격
2. `feat(app): port write RPCs to route handlers` — 15개 엔드포인트 + vitest 통합 테스트
3. `feat(app): switch web writes to /api` — §5 웹 교체 + Playwright 재검증
4. `feat(mobile): switch writes to /api` — gig-store 교체 + tsc/export/실기기 스모크
5. `feat(supabase): drop rpc layer` — §6 마이그레이션, 타입 재생성, 클라우드
   `db push`, 프로드 스모크
6. `docs: backend/web/mobile/STATUS/daily 갱신` — backend.md를 "API 서버" 중심으로
   재작성(스키마·RLS·expire·Realtime 절만 유지), 이 문서에 "완료" 표기

각 단계 끝에서 빌드/테스트 통과 후 커밋. 3~5는 같은 날 안에 몰아서(클라 전환과 락다운
사이에 프로드에서 구·신 경로가 잠시 공존하는 건 무해 — 둘 다 같은 DB 의미).

## 9. 함정 목록 (아는 것 전부)

- **proxy.ts /api 제외** 안 하면 모바일 401이 아니라 307 HTML (§2.5)
- 풀러(:6543)는 **트랜잭션 모드** → `postgres()`에 `prepare: false` 필수, `max` 작게(2)
- **bcryptjs ↔ pgcrypto 호환**: 둘 다 `$2a$` — 기존 발급 PIN도 검증됨. 단 native
  `bcrypt` 패키지는 Vercel 빌드 이슈 있으니 **bcryptjs**(pure JS) 사용
- PIN 4자리 생성은 `Math.random` 말고 `crypto.randomInt`
- drizzle enum: DB enum(gig_status 등)은 schema.ts에서 `pgEnum`으로 introspect됨 —
  상태 문자열 오타는 컴파일로 못 잡으니 zod/상수로 감쌀 것
- `send_message` 낙관적 append(웹 ChatSheet)는 응답 {id} 의존 — 응답에 id 필수
- 웹 fetch는 same-origin이라 쿠키 자동 전송(Authorization 불필요하지만 getToken 경로로
  통일해도 무방); 모바일은 반드시 Bearer
- 세션 만료 401 시 클라 처리: supabase-js가 토큰 자동갱신하므로 getToken이 최신을
  반환 — 401을 받으면 한 번 재시도 후 /login 유도(웹) · signOut(모바일)
- audit_log의 actor_id는 이제 auth.uid()가 아니라 **핸들러가 명시 전달** — 누락 주의
- Vercel Fluid Compute 재사용으로 커넥션은 인스턴스당 유지 — 문제 시 Supabase 대시보드
  pooler 커넥션 수 확인
- 락다운 전까지는 구 RPC도 살아 있으므로 **웹·모바일 코드가 전부 전환됐는지 §5 목록으로
  전수 확인** 후 6단계 진행
- `docs/STATUS.md`·`docs/service/backend.md`의 RPC 서술은 6단계에서 반드시 갱신

## 10. 완료 기준

- [ ] 15개 엔드포인트가 §4 스펙과 동일 동작 (통합 테스트 그린)
- [ ] 웹·모바일에서 `supabase.rpc` 호출은 `expire_stale_gigs` 4곳만 남음
- [ ] Playwright 풀 루프 + 모바일 스모크 통과
- [ ] 클라우드에 락다운 마이그레이션 적용, `/rest/v1/rpc/apply_to_gig` 404
- [ ] `@repo/supabase` 타입 재생성 & 전체 빌드 그린
- [ ] 문서 갱신 (backend.md 재작성, STATUS.md, daily log, 이 문서 완료 표기)
