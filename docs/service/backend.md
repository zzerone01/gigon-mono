# 백엔드 — API 서버(Next.js) + Supabase

> ✅ **2026-07-03 마이그레이션 완료**: 쓰기 경로는 SQL RPC에서
> **Next.js Route Handlers(`apps/app/app/api/**`)로 이관**됐다 — 배경과 실행 기록은
> [api-migration.md](./api-migration.md). DB에 남은 함수는 `expire_stale_gigs`와
> `handle_new_user` 트리거뿐. **새 쓰기 기능은 Route Handler로 추가할 것.**

## 아키텍처

```
웹 (app.gigon.io)                 모바일 (Expo)
  읽기: supabase-js ────────────────┐ 읽기: supabase-js
  실시간: supabase realtime ────────┤ 실시간: supabase realtime
  쓰기: fetch /api/* (쿠키 or Bearer)│ 쓰기: fetch https://app.gigon.io/api/* (Bearer JWT)
        ▼                          ▼
  Next.js Route Handlers (apps/app/app/api/**)   ← 비즈니스 로직 (TS)
        │  requireUser(): Bearer 우선, 쿠키 폴백 (supabase.auth.getUser)
        ▼
  drizzle + postgres.js ── Supavisor 트랜잭션 풀러(:6543) ──► Postgres
                                     (트랜잭션·FOR UPDATE·audit_log 기록)
```

- 서버 헬퍼: `apps/app/lib/server/{db,schema,auth,errors,audit}.ts`.
  drizzle은 **쿼리 전용** — 스키마 진실은 계속 `supabase/migrations/`(supabase CLI).
- 공유 계약: `packages/api`(@repo/api) — zod 스키마 + fetch 클라이언트를
  서버·웹·모바일이 같이 import.
- 인증: Supabase Auth 그대로 (phone OTP + Semaphore 훅). API는 JWT 검증만.
- `DATABASE_URL`(서버 전용): 트랜잭션 풀러 `:6543` + `prepare:false, max:2`.
  Vercel gigon-app env(Production/Preview/Development) + `apps/app/.env.local`.
- `proxy.ts` matcher는 `/api`를 **제외** — 핸들러가 직접 401 JSON을 반환
  (제외 안 하면 모바일이 /login 307 HTML을 받는 치명 함정).

## 쓰기 API (전부 POST, 성공 `200 {data}`, 실패 `{error:{code,message}}`)

| 엔드포인트 | 역할 | 동작 |
| --- | --- | --- |
| `/api/onboarding` | 공통 | 프로필 확정 (이름 공백이면 기존값 유지) |
| `/api/invites/redeem` | 사장님 | 초대 인증 + employer 전환 → `{ok:boolean}` (실패도 200) |
| `/api/profile/role` | 공통 | 역할 전환 |
| `/api/gigs` | 사장님(verified) | 공고 생성 + audit → `{id}`. `startsOn`은 오늘 ~ **`MAX_DAYS_AHEAD`(30일)** 밖이면 422 — 모바일 post 폼의 피커 `maximumDate`와 **반드시 같이 움직여야** 함 |
| `/api/gigs/:id/apply` | 워커 | 1탭 지원 (본인 공고 403, POSTED+미만료만) → `{id}`. **멱등**: 이미 APPLIED면 같은 id를 돌려주되 푸시·`gig_applied` 트래킹을 건너뜀 (중복 탭이 사장님에게 알림을 재발송하던 버그). WITHDRAWN 후 재지원은 진짜 지원으로 카운트 |
| `/api/gigs/:id/cancel` | 공고 주인(POSTED만) | 공고 철회 + 지원 REJECTED. 무penalty |
| `/api/applications/:id/select` | 공고 주인 | 조건부 UPDATE 레이스 가드로 매칭 + **billable_event(₱0)** → `{matchId}` |
| `/api/applications/:id/withdraw` | 지원 당사자 | 답 오기 전 지원 취소. **APPLIED→WITHDRAWN만** (조건부 UPDATE 레이스 가드 — 방금 선택된 매칭을 되돌릴 수 없음). 매칭 취소와 달리 **cancel_count 페널티 없음** |
| `/api/matches/:id/arrive` | 매칭 워커 | IN_PROGRESS |
| `/api/matches/:id/pin` | 사장님(IN_PROGRESS) | `crypto.randomInt` 4자리 → bcryptjs 해시 upsert, **평문은 응답으로만** → `{pin}` |
| `/api/matches/:id/pin/verify` | 워커 | **예외 계약**: 항상 200 `{ok:…}` (wrong_pin/locked/no_active_pin). 시도 카운터는 `FOR UPDATE` |
| `/api/matches/:id/no-show` | 사장님(MATCHED만) | NO_SHOW + gig 재오픈(만료 시 EXPIRED) + no_show_count++ |
| `/api/matches/:id/cancel` | 참여자(MATCHED만) | 시작 전 취소. cancel_count++, 워커→재오픈 / 사장님→CANCELLED |
| `/api/matches/:id/dispute` | 참여자 | 티켓 생성 → `{ticket:"D-10xx"}` |
| `/api/matches/:id/review` | 참여자(COMPLETED만) | 리뷰 + 평판 집계. 중복 409 |
| `/api/matches/:id/messages` | 참여자(활성 매칭) | 채팅 insert → `{id}` (Realtime이 브로드캐스트) |
| `/api/push/register` | 공통 | Expo 푸시 토큰 upsert (`push_tokens`, 기기당 1행) |
| `/api/push/unregister` | 토큰 소유자 | 로그아웃 시 토큰 삭제 |

에러 코드: `unauthorized(401) forbidden(403) not_found(404) invalid_input(400)
invalid_state(409) internal(500)`. UI는 `error.message`를 토스트에 그대로 사용.

**동시성 원칙**: 상태 가드는 조건부 `UPDATE … WHERE status='…'`의 반환 행 수로
검증(0행→409). PIN 시도 카운터만 `SELECT … FOR UPDATE`.

**audit_log**: 핸들러가 트랜잭션 안에서 직접 insert — actor_id는 명시 전달
(`lib/server/audit.ts`). 이벤트·페이로드는 구 RPC와 동일.

**푸시 알림**: 지원·매칭·채팅·매칭취소·노쇼 5개 이벤트에서 핸들러가
`lib/server/push.ts`(Expo Push API)로 발송 — 트랜잭션 커밋 후 `defer()`
(next/server `after()` 래퍼)로 응답 지연 없이. 죽은 토큰(DeviceNotRegistered)은
자동 삭제. `PUSH_DISABLED=1`이면 발송 안 함(테스트·운영 킬스위치).
**Android 실기기 수신은 Firebase(FCM V1) 연결 후부터** — mobile-app.md 참고.

**테스트**: `apps/app/tests/api/` (vitest, 34 케이스) —
로컬 스택(`npx supabase start`) 상대로 실행: `pnpm --filter app test`.

## DB에 남는 것

| | |
| --- | --- |
| `expire_stale_gigs()` | POSTED & 만료 → EXPIRED + audit. **pg_cron 10분 주기** + 클라이언트 loadAll 시 호출. 유일하게 남은 클라 호출 RPC |
| `handle_new_user` | auth.users insert 트리거 → profiles 자동 생성 |
| 스키마·RLS·Realtime | 아래 절 그대로 |

## 스키마 (PRD §4.1 상태머신)

```
profiles        auth.users 1:1 (트리거 자동생성). active_role, employer_verified,
                skills, lat/lng, 평판 집계(rating_sum/count, jobs_completed,
                no_show_count, cancel_count), onboarded
gigs            공고. type(Cleaning/Laundry/Delivery/Errands), pay, when_label,
                lat/lng, slots, status(POSTED→MATCHED→COMPLETED | CLOSED/CANCELLED/EXPIRED),
                expires_at(+24h)
applications    지원. unique(gig_id, worker_id). APPLIED/SELECTED/REJECTED/WITHDRAWN
matches         매칭 = 거래 단위. MATCHED→IN_PROGRESS→COMPLETED | NO_SHOW/CANCELLED.
                pin_issued_at(표시용), arrived_at, completed_at,
                cancelled_by/cancel_reason/cancelled_at(취소 기록)
match_pins      PIN 비밀 저장소(bcrypt hash, attempts, locked_until).
                anon/authenticated **grant 없음** — API 서버(직결)만 접근
billable_events 매칭 확정 시 ₱0 기록 (Phase 1.5 과금 대비)
messages        매칭당 1:1 채팅
reviews         COMPLETED 매칭만, rater당 1건. 평판 집계 자동 반영
disputes        분쟁 티켓 (사유+상세, OPEN/RESOLVED)
audit_log       append-only 감사 로그 (모든 전이 기록, 클라이언트 접근 불가)
invite_codes    사장님 초대코드 (API 전용)
```

drizzle 미러: `apps/app/lib/server/schema.ts` — **마이그레이션이 생기면 손으로 동기화**.

## RLS 방침 (오너 결정 — 새 테이블도 동일 패턴)

- 전 테이블 `enable row level security` (Supabase 어드바이저 경고 방지)
- 읽기: `for select to authenticated using (true)` 한 줄만. **row rule로 권한 제어하지 않음**
- 쓰기 정책 없음 + `profiles` update grant도 revoke됨 → **모든 쓰기는 /api 경유**.
  API는 직결 커넥션(postgres role)이라 RLS 미적용 — 권한 검증은 핸들러 코드 안에서
- 비밀값은 정책이 아니라 **grant 없는 별도 테이블**로 격리 (예: match_pins)
- `invite_codes` / `audit_log` / `match_pins`: 정책 없음(어드바이저에 INFO만 뜸, 정상)

## SMS (Twilio Verify — 네이티브 provider)

실 OTP 발송은 **Twilio Verify**(Supabase 내장 SMS provider). Semaphore·일반 Twilio와
달리 **발신자명(Sender ID) 등록이 불필요** — Twilio가 OTP 발신 경로를 관리하므로
필리핀 발송이 승인 대기 없이 바로 됨:

- 설정: 대시보드 Auth → Providers → Phone → **Twilio Verify**(Account SID /
  Auth Token / Verify Service SID). config.toml `[auth.sms.twilio_verify]`로도 동일 표현
- 비밀값: `supabase/.env.local`(**gitignored**) — `TWILIO_ACCOUNT_SID`,
  `TWILIO_VERIFY_SERVICE_SID`(VA…), `TWILIO_AUTH_TOKEN`. config엔 env() 치환으로 주입.
  `message_service_sid` 키에 Verify Service SID(VA…)가 들어감
- 설정 반영: `set -a; source supabase/.env.local; set +a; npx supabase config push --yes`
- test_otp 번호(09171234001~5)는 provider를 우회 → Twilio 호출 없음
- 트라이얼 계정은 **인증된(Verified) 번호로만** 발송(Twilio 에러 21608) → 실오픈 전
  Billing 등록해 pay-as-you-go 전환 필요(전환 시 Identity Type=**Individual**이 서류 최소)
- (DEPRECATED) Semaphore 훅: `supabase/functions/send-sms/index.ts` +
  `[auth.hook.send_sms]`(현재 `enabled=false`). 발신자명 "GigOn" 승인이 계속 Pending이라
  로그인이 막혀 Twilio Verify로 전환. 함수는 폴백용으로 배포된 채 유지 — Semaphore
  Sender Name 승인 시에만 재활성화. 상태: `GET api.semaphore.co/api/v4/account?apikey=…`

## Realtime

publication `supabase_realtime`: `matches`, `applications`, `messages`, `gigs`.
클라이언트는 postgres_changes 구독 → 이벤트 시 coarse refetch 패턴.
(쓰기가 서버로 이동해도 WAL 이벤트는 동일 — 클라 구독 코드 무변경.)

## 로컬 개발

```bash
npx supabase start        # 마이그레이션+시드 자동 적용
npx supabase db reset     # 처음부터 다시
npx supabase migration up # 새 마이그레이션만 적용 (데이터 유지)
```

- config.toml 주의점: `[analytics] enabled=false`(Colima), `[storage.vector] enabled=false`(무료티어),
  `[auth.sms.twilio_verify]` 활성(env creds; 테스트 OTP 동작 조건), test_otp 번호 5개
- 시드: 막탄 가맹점 6곳 + 워커 3명(NPC) + 공고 6건 + 초대코드
- API 로컬 실행: `apps/app`에서 로컬 스택 env로 `next dev --port 3001`
  (vitest는 `vitest.config.ts`가 로컬 env를 강제)

## 클라우드 배포 런북

```bash
npx supabase login                      # 1회 (키체인 저장 — CLI 명령만 사용, 토큰 직접 조회 X)
npx supabase link --project-ref uoeatrexoeghoigbxage -p '<db password>'
npx supabase db push                    # 마이그레이션 반영
npx supabase config push --yes          # config.toml [auth] 등 반영 (site_url, test_otp…)
# 타입 재생성 (스키마 변경 시) — 루트에서:
npx supabase gen types typescript --local > packages/supabase/src/database.types.ts
# API 배포 (쓰기 로직 변경 시):
cd apps/app && vercel deploy --prod --yes
```

- DB 비밀번호는 2026-07-03 마이그레이션 때 재설정됨 — `apps/app/.env.local`의
  `DATABASE_URL`과 Vercel env에 기록 (레포 커밋 금지)
- 시드는 자동 반영 안 됨 — 필요 시 psql로 `seed.sql` 실행
- 프로드 스모크: 미인증 `POST https://app.gigon.io/api/matches/x/arrive` → 401 JSON,
  test_otp 계정(클라우드에도 등록, ~2036)으로 post→apply→cancel 1루프

## 마이그레이션 이력

1. `20260702000000_init` — 스키마 + (구)RPC + (구)정책 + realtime
2. `20260702010000_grants` — authenticated GRANT (없으면 PostgREST 404/permission denied)
3. `20260702020000_pin_search_path` — pgcrypto가 extensions 스키마라 PIN 함수 search_path 수정
4. `20260702030000_simplify_rls` — RLS 단순화 + match_pins 분리 + PIN RPC 재작성
5. `20260703000000_cancel_and_expiry` — cancel_match/cancel_gig RPC, matches 취소 컬럼,
   expire_stale_gigs + pg_cron 스케줄(가능한 환경에서만; 실패 시 notice 후 통과)
6. `20260703090000_drop_rpc_layer` — 쓰기 RPC 15개 + audit() DROP, profiles update
   grant revoke. 상태머신은 이제 app.gigon.io/api
