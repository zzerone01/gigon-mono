# 백엔드 (Supabase)

위치: 레포 루트 `supabase/` — config.toml, `migrations/`, `seed.sql`

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
                pin_issued_at(표시용), arrived_at, completed_at
match_pins      PIN 비밀 저장소(bcrypt hash, attempts, locked_until).
                anon/authenticated **grant 없음** — API로 절대 못 읽음
billable_events 매칭 확정 시 ₱0 기록 (Phase 1.5 과금 대비)
messages        매칭당 1:1 채팅
reviews         COMPLETED 매칭만, rater당 1건. 평판 집계 자동 반영
disputes        분쟁 티켓 (사유+상세, OPEN/RESOLVED)
audit_log       append-only 감사 로그 (모든 전이 기록, 클라이언트 접근 불가)
invite_codes    사장님 초대코드 (RPC 전용)
```

## RPC (전부 SECURITY DEFINER, `auth.uid()` 검증)

| RPC | 역할 | 동작 |
| --- | --- | --- |
| `complete_onboarding(name, role, area, lat, lng)` | 공통 | 프로필 확정 |
| `redeem_invite(code, business_name)` | 사장님 | 초대 인증 + employer 전환 |
| `set_active_role(role)` | 공통 | 역할 전환 |
| `post_gig(...)` | 사장님(verified) | 공고 생성 + audit |
| `apply_to_gig(gig)` | 워커 | 1탭 지원 (본인 공고 불가, POSTED만) |
| `select_applicant(application)` | 공고 주인 | 매칭 생성 + gig MATCHED + **billable_event(₱0)** |
| `mark_arrived(match)` | 매칭 워커 | IN_PROGRESS |
| `issue_pin(match)` | 사장님 | 4자리 생성→bcrypt 저장, **평문은 응답으로만** 반환 |
| `verify_pin(match, pin)` | 워커 | 검증. 오답 3회→60초 잠금(서버). 성공→COMPLETED+집계 |
| `report_no_show(match)` | 사장님(MATCHED만) | NO_SHOW + gig 재오픈 + 워커 no_show_count++ |
| `open_dispute(match, reason, detail)` | 참여자 | 티켓 생성, `D-10xx` 반환 |
| `post_review(match, stars, tags, comment)` | 참여자(COMPLETED만) | 리뷰 + 평판 집계 |
| `send_message(match, body)` | 참여자(활성 매칭만) | 채팅 |

`verify_pin` 반환: `{ok:true}` | `{ok:false, error:"wrong_pin", attempts_left}` |
`{error:"locked", locked_for}` | `{error:"no_active_pin"}`

## RLS 방침 (오너 결정 — 새 테이블도 동일 패턴)

- 전 테이블 `enable row level security` (Supabase 어드바이저 경고 방지)
- 읽기: `for select to authenticated using (true)` 한 줄만. **row rule로 권한 제어하지 않음**
- 쓰기 정책 없음 → 모든 쓰기는 RPC 경유. 권한 검증은 RPC 코드 안에서
- 비밀값은 정책이 아니라 **grant 없는 별도 테이블**로 격리 (예: match_pins)
- `invite_codes` / `audit_log` / `match_pins`: 정책 없음(어드바이저에 INFO만 뜸, 정상)

## Realtime

publication `supabase_realtime`: `matches`, `applications`, `messages`, `gigs`.
클라이언트는 postgres_changes 구독 → 이벤트 시 coarse refetch 패턴.

## 로컬 개발

```bash
npx supabase start        # 마이그레이션+시드 자동 적용
npx supabase db reset     # 처음부터 다시
npx supabase migration up # 새 마이그레이션만 적용 (데이터 유지)
```

- config.toml 주의점: `[analytics] enabled=false`(Colima), `[storage.vector] enabled=false`(무료티어),
  `[auth.sms.twilio]` 더미 활성(테스트 OTP 동작 조건), test_otp 번호 3개
- 시드: 막탄 가맹점 6곳 + 워커 3명(NPC) + 공고 6건 + 초대코드

## 클라우드 배포 런북

```bash
npx supabase login                      # 1회 (키체인 저장 — CLI 명령만 사용, 토큰 직접 조회 X)
npx supabase link --project-ref uoeatrexoeghoigbxage -p '<db password>'
npx supabase db push                    # 마이그레이션 반영
npx supabase config push --yes          # config.toml [auth] 등 반영 (site_url, test_otp…)
# 타입 재생성 (스키마 변경 시):
pnpm --filter @repo/supabase gen-types  # 로컬 스택 기준
```

시드는 자동 반영 안 됨 — 필요 시 psql로 `seed.sql` 실행 (로컬 supabase_db 컨테이너의
psql로 pooler URL에 접속하는 방법이 검증됨).

## 마이그레이션 이력

1. `20260702000000_init` — 스키마 + RPC + (구)정책 + realtime
2. `20260702010000_grants` — authenticated GRANT (없으면 PostgREST 404/permission denied)
3. `20260702020000_pin_search_path` — pgcrypto가 extensions 스키마라 PIN 함수 search_path 수정
4. `20260702030000_simplify_rls` — RLS 단순화 + match_pins 분리 + PIN RPC 재작성
