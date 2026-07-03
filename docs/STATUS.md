# GigOn 구현 현황 — 한 장 요약

> 2026-07-03 기준. 이 문서 하나로 "지금 뭐가 만들어져 있고, 어떻게 돌아가고, 뭐가 남았나"를
> 파악할 수 있게 쓴 오너용 요약. 상세 문서는 맨 아래 [문서 지도](#문서-지도) 참조.

## 한 줄 요약

**필리핀 막탄 파일럿용 위치기반 단기 알바 매칭 서비스의 MVP가 웹·모바일·백엔드 전부
실서비스 상태로 배포되어 있다.** 공고 등록 → 지원 → 매칭 → 도착 → PIN 완료 → 상호 리뷰의
전체 루프 + 취소/노쇼/분쟁/만료까지 동작. 남은 건 실 SMS 연동, 스토어 배포, 푸시 알림.

| 무엇 | 어디 | 상태 |
| --- | --- | --- |
| 랜딩 + 웨이트리스트 | https://gigon.io | ✅ 라이브 |
| 서비스 웹앱 (워커+사장님) | https://app.gigon.io | ✅ 라이브 (반응형: 모바일웹 + 데스크톱) |
| 약관 / 개인정보 | https://app.gigon.io/terms · /privacy | ✅ 라이브 |
| 모바일 앱 (Android 우선) | Expo Go로 실행 (스토어 미배포) | ✅ 기능 완성 / 🔜 EAS 빌드 |
| 백엔드 (DB+인증+실시간) | Supabase 클라우드 `uoeatrexoeghoigbxage` | ✅ 라이브 |

## 제품 원칙 (PRD v1.2)

1. **임금 미개입** — 급여는 현장에서 현금 100%. GigOn은 돈을 만지지 않는다
2. **노동자 무과금** — 워커에게는 영원히 무료
3. **PIN 상호 완료** — 일 끝나고 사장님이 발급한 4자리 PIN을 워커가 입력해야 완료.
   리뷰는 PIN 완료된 매칭에서만 가능(리뷰 신뢰성의 근간)
4. **파일럿 완전 무료** — 매칭 시 ₱0짜리 billable_event만 기록(추후 과금 대비 데이터).
   파일럿 후 사장님 대상 소액 매칭 수수료 예정

## 시스템 구성

```
gigon-mono (turborepo + pnpm)
├── apps/web      → gigon.io        랜딩+웨이트리스트 (Next 16)
├── apps/app      → app.gigon.io    서비스 웹앱 (Next 16 + Supabase)
├── apps/mobile   → Expo 앱 (같은 Supabase 계정/데이터 공유)
├── packages/ui   → @repo/ui        공유 디자인 시스템 (shadcn 63종 + GigOn 토큰)
├── packages/supabase → DB 타입 + 클라이언트 팩토리
└── supabase/     → 스키마·RPC·시드 (마이그레이션 5개)
```

- 웹/모바일 모두 **같은 Supabase 클라우드**를 봄 → 한 계정으로 웹에서 하던 걸 앱에서 이어서 가능
- 디자인은 Claude Design 3벌(`GigOn App` / `GigOn Web Mobile` / `GigOn Web`)을 1:1 구현

## 사용자 여정 (구현된 상태머신)

### 워커

```
탐색(리스트/지도, 거리순) → 1탭 지원(APPLIED) → 사장님이 선택하면 MATCHED
→ 현장 도착 후 "I've arrived"(IN_PROGRESS) → 현금 받고 PIN 입력(COMPLETED)
→ 리뷰 작성(RATED)
```

- 곁가지: **취소**(MATCHED에서만, 사유 선택, 프로필에 기록되고 공고는 재오픈) ·
  **분쟁 열기**(IN_PROGRESS/COMPLETED에서, 24h 내 검토 안내) ·
  PIN 3회 오답 → 서버에서 60초 잠금
- 실시간: 매칭/취소/노쇼/채팅이 토스트로 즉시 반영

### 사장님 (초대코드 `MACTAN-30`으로만 가입 가능)

```
공고 등록(무료, 24h 유효) → 실시간 지원자 비교(거리·평점·완료수·노쇼/취소 이력)
→ 매칭 확정(billable_event ₱0 기록) → 워커 도착 알림 → 일 끝나면 PIN 발급
→ 워커가 PIN 입력하면 COMPLETED → 리뷰
```

- 곁가지: **공고 취소**(매칭 전, 무penalty) · **매칭 취소**(사유 기록+평판 반영) ·
  **노쇼 신고**(워커 프로필에 기록, 공고 재오픈)

### 자동 처리

- **공고 만료**: 등록 24시간 지나면 자동 EXPIRED (DB의 pg_cron 10분 주기 + 앱이 피드
  로드할 때마다 스윕 — 둘 중 뭐가 먼저든 처리됨)
- **감사 로그**: 모든 상태 전이가 append-only `audit_log`에 기록 (분쟁 판정 근거)

## 신뢰/안전 장치

| 장치 | 구현 |
| --- | --- |
| 상태머신 우회 불가 | 모든 전이는 서버 RPC로만 (클라이언트가 DB를 직접 못 씀) |
| PIN 보안 | bcrypt 해시를 API로 읽을 수 없는 별도 테이블에 격리, 3회 오답 60초 잠금 |
| 평판 | 별점 집계 + 완료 수 + **노쇼/취소 이력은 자동 기록** (자진신고 아님) |
| 리뷰 어뷰징 방지 | PIN 완료된 매칭에서만, 참여자당 1건 |
| 채팅 | 매칭된 둘만, 전화번호 비공개, 인앱만 |
| 사장님 진입장벽 | 파일럿 초대코드 필수 (invite-verified 배지) |

## 백엔드 한눈에

- **테이블 11개**: profiles / gigs / applications / matches / match_pins(비밀) / messages /
  reviews / disputes / billable_events / audit_log / invite_codes
- **RPC 16개** (전부 SECURITY DEFINER, 서버에서 권한 검증):
  온보딩 3(complete_onboarding·redeem_invite·set_active_role) ·
  거래 7(post_gig·apply_to_gig·select_applicant·mark_arrived·issue_pin·verify_pin·send_message) ·
  예외 5(report_no_show·open_dispute·cancel_match·cancel_gig·post_review) ·
  유지보수 1(expire_stale_gigs)
- **RLS 방침**: 전 테이블 ON이되 row rule은 권한 레이어가 아님 — 읽기는 로그인 사용자
  전체 허용 한 줄, 쓰기는 정책 0개(RPC만). 비밀값은 grant 없는 테이블로 격리
- **실시간**: gigs/applications/matches/messages 변경 구독 → 토스트+리프레시

## 인증/계정

- 전화번호 + SMS OTP (Supabase Auth). 계정 1개 = 역할 전환 가능(워커↔사장님)
- ⚠️ **현재 실 SMS 미연동** — 테스트 번호만 로그인 가능 (아래 표). 실사용자 오픈 전
  SMS 프로바이더 연동 필요 (Twilio 대신 필리핀 로컬 Semaphore 검토 중 — 비용 1/17)

| 테스트 번호 | OTP | 용도 |
| --- | --- | --- |
| 0917 123 4001 | 123456 | 워커 (Marites Santos) |
| 0917 123 4002 | 123456 | 사장님 (Kape Lokal Annex) |
| 0917 123 4003 | 123456 | 여분 |

## 직접 돌려보기

```bash
# 웹 (프로덕션): app.gigon.io 접속 → 위 테스트 번호로 로그인
# 2계정 동시 테스트(로컬): 워커 localhost:3001 / 사장님 127.0.0.1:3001

pnpm install
pnpm --filter app dev        # 웹앱 (클라우드 DB 사용)
pnpm --filter mobile start   # Expo Go QR — 같은 계정으로 로그인하면 웹과 데이터 공유
```

## 남은 것 (우선순위)

### 파일럿 오픈 전 필수
1. **실 SMS 연동** — Semaphore(₱0.56/건) + Supabase Send SMS Hook 방식 유력.
   Twilio($0.17/건)는 비용상 배제 방향
2. **시드 데모 데이터 결정** — 클라우드의 데모 가맹점 6곳/공고 6건. 자동 만료가 켜져서
   방치하면 24h 후 EXPIRED로 자연 소멸. 유지하려면 시드 갱신 필요
3. **모바일 스토어 배포** — EAS 빌드 + Google Play 계정(계정 주체 결정 필요) +
   Android용 Google Maps 키
4. **푸시 알림** — Expo Notifications 사용(서버는 Expo Push API 하나로 단순).
   단, Android 전송로가 FCM이라 Firebase 프로젝트는 필요. Expo Go에선 테스트 불가
   (SDK 53+) → development build 필요 → 3번과 같이 진행하는 게 효율적

### 기능 보완 (PRD 내, 급하지 않음)
- 관리자 도구(분쟁 처리·초대 관리·제재) · 복수 슬롯(slots>1) 매칭 ·
  공고 여러 개 동시 관리(비즈니스 히스토리 페이지)

### 다듬기
- 알림 벨 실기능 · 프로필 편집 · My gigs/History 페이지 · PostHog 퍼널 · Sentry

## 문서 지도

| 궁금한 것 | 문서 |
| --- | --- |
| 아키텍처/인프라/로컬 시작 | [docs/service/overview.md](service/overview.md) |
| DB 스키마·RPC 상세·배포 런북 | [docs/service/backend.md](service/backend.md) |
| 웹앱 구조·반응형 규칙 | [docs/service/web-app.md](service/web-app.md) |
| 모바일 구조·뷰모델 패턴 | [docs/service/mobile-app.md](service/mobile-app.md) |
| 브랜드/디자인 토큰 | [docs/brand/](brand/README.md) |
| 날짜별 작업 기록·트러블슈팅 | [docs/daily/](daily/) |
