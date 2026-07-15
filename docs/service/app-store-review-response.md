# iOS 심사 Reject 대응 — Guideline 4 Design (2026-07-15)

> Submission ID: `24785b60-d94c-4189-969a-4d4eefba3227` · Version 1.1 (8)
> 리뷰 기기: iPad Air 11" (M3) · iPadOS 26.5.2 · 리뷰일: 2026-07-15
> 사유: **Guideline 4 — Design / "could not proceed past the first screen due to a layout issue"**

## 근본 원인 — iPad 문제가 아니라 **작은 화면** 문제

리뷰어는 1.0(4) 때부터 **매번 iPad Air 11"로 심사**한다. `app.json`은 `supportsTablet: false`
(2026-07-04부터)라 앱은 iPad에서 **iPhone 호환 모드**로 뜨는데, iPadOS 26이 주는 캔버스가
**375x667 — iPhone 8/SE 크기**다. 온보딩은 요즘 iPhone(852pt) 높이를 전제로 짜여 있었다.

`onboarding/phone.tsx`가 `KeyboardAvoidingView behavior="padding"` + **ScrollView 없음** 구조라,
전화번호 필드를 탭해 키보드가 올라오면:

- `main`(flex:1, justifyContent:center)이 눌리는데 자식들은 고정 높이라 **넘침**
- 로고 타일이 화면 위로 **잘림**
- **"Send code" 버튼과 약관 텍스트가 겹쳐** 뭉개짐 → 번호를 넣고 진행할 수 없음

→ 리뷰어 표현 "crowded / could not proceed past the first screen"과 정확히 일치.
iPad Air 11" 시뮬레이터에서 재현·수정 후 재검증 완료.

**중요**: 이건 리뷰어 전용 이슈가 아니다. 필리핀 시장의 iPhone SE/8 실사용자도 같은 화면을 본다.

## 조치 (2026-07-15) — 코드 수정, **새 빌드 필요 (build 9)**

| 파일 | 변경 |
| --- | --- |
| `onboarding/phone.tsx` | ScrollView로 감싸고 `main` `flex:1`→`flexGrow:1`, `keyboardShouldPersistTaps="handled"` |
| `onboarding/otp.tsx` | 동일 (autoFocus라 키보드가 즉시 뜸) |
| `onboarding/role.tsx` | `KeyboardAvoidingView` 추가 — 하단 고정 CTA가 키보드에 가려짐 |
| `post.tsx` | `KeyboardAvoidingView` 추가 (동일 사유) |
| `(employer)/postings.tsx` | 헤더 zoneChip `flexShrink:1` + `numberOfLines={1}` — 긴 업체명이 화면 밖으로 넘침 |
| `(worker)/explore.tsx` | 동일 안전장치 |

핵심 패턴: **`flex:1` 대신 `flexGrow:1` + ScrollView**. 큰 화면에선 기존처럼 중앙 정렬이 유지되고
(iPhone 17에서 회귀 없음 확인), 키보드가 뷰포트를 줄이면 겹치는 대신 스크롤된다.

### 검증 결과

- iPad Air 11" (375x667) 키보드 오픈 상태: 겹침 해소, CTA 정상 노출
- 데모 계정 `9171234002`/`123456` 로그인 → 비즈니스 대시보드(활성 공고 + 지원자 3명) 정상
- iPhone 17 (402x874): 레이아웃 기존과 동일 — 회귀 없음

## Resolution Center — Apple 회신 (복사용, English)

```
Hello,

Thank you for the detailed report — the iPad Air screenshot made the problem easy
to find, and we have fixed it.

Issue: on the first screen (phone number entry), tapping the phone field brought up
the keyboard, and our layout did not reflow correctly on the shorter canvas. The
"Send code" button overlapped the terms text and the logo was clipped, which is why
review could not proceed past that screen.

Fix (included in this new build):
  • The sign-in and verification screens are now scrollable and keyboard-aware, so
    all content and controls stay fully visible and tappable while the keyboard is
    shown, on every supported screen size.
  • The same keyboard handling was applied to the role/profile step and the
    "Post a gig" form.
  • Header labels now truncate instead of overflowing the screen edge.

We reproduced the original failure on an iPad Air 11-inch running iPadOS 26 and
confirmed the fix on the same device, and verified there is no regression on iPhone.

To sign in, please use the demo account (no SMS is sent — the code is a FIXED value):
  • Phone number: 9171234002
  • Verification code: 123456
Enter 123456 directly on the code screen; there is no need to wait for a text message.
The Business dashboard has an active job with applicants, so you can review
applicants, match, issue the arrival PIN, chat, and post new jobs.

Thank you for your time and for the clear report.
```

## 재제출 절차

1. **새 빌드 필요** — 코드 수정이므로 build 9를 EAS로 빌드 → TestFlight 처리 완료 대기.
2. 해당 버전에 build 9 선택 → Resolution Center에 위 회신 전송 → **Resubmit to App Review**.
3. App Review Information의 데모 계정/노트는 그대로 유지 (변경 불필요).

---

# iOS 심사 Reject 대응 — Guideline 2.1(a) (2026-07-09)

> Submission ID: `b7986c8d-ed99-4ffa-bd88-88a350f1f957` · Version 1.0 (4)
> 리뷰 기기: iPad Air 11" (M3) · 리뷰일: 2026-07-09
> 사유: **Guideline 2.1(a) — Information Needed / "provide a Business demo account"**

## 근본 원인 (재해석)

데모 계정은 **이미 ASC에 제출돼 있었다** (워커 `0917 123 4001` / 사장님 `0917 123 4002`,
OTP `123456`). 그런데도 reject된 이유는 다음 둘의 조합으로 판단:

1. **OTP가 고정코드(123456)라는 안내 부재** — 로그인은 전화번호 + SMS OTP인데,
   test_otp 번호는 **SMS를 보내지 않는다**. 리뷰어가 번호 입력 후 "Send code"를 누르고
   오지 않는 문자를 기다리다 OTP 화면에서 막혔을 가능성이 큼. (코드가 123456인 걸 몰랐음)
2. **심사 시점에 앱이 비어 있었음** — seed gig들이 24h expiry로 전부 만료(2026-07-09 기준
   POSTED 0개). 로그인해도 활성 공고·지원자·지도 핀이 없어 기능 검증 불가.

## 조치 완료 (2026-07-09, 프로덕션 DB 직접 반영)

- ✅ **test_otp 프로덕션 ACTIVE 확인** — `9171234002`/`123456` 라이브 로그인 세션 발급 검증
  (리뷰어 경로 auth→PostgREST→RLS 동일 확인). 추가 config push 불필요.
- ✅ **활성 gig 7개 재시딩** (`40000000-…` UUID, `expires_at = now()+60d` → 재심사 기간 생존).
  데모 사장님(Kape Lokal Annex)에 활성 공고 1개 + 나머지 6개 업체 공고 → 지도 채움.
- ✅ **지원자 2명 시딩** (Analyn Dela Cruz·Jomar Bacus) → 사장님 콘솔에서 지원자 검토→매칭→PIN
  풀 플로우 시연 가능.
- ✅ **데모 계정 2개 정리** (막탄 위치·역할·프로필 정합성):
  - 워커 `639171234001` = Juan Ramos (worker, Mactan)
  - 사장님 `639171234002` = Rico Villanueva Jr / Kape Lokal Annex (employer, verified)
- 적용 SQL: `scratchpad/reseed_review_gigs.sql` + 지원자/프로필 정리 쿼리(본 문서 하단).

---

## 1) ASC → App Review Information 입력값 (복사용)

App Store Connect → 해당 버전 → **App Review Information**:

| 필드 | 값 |
| --- | --- |
| Sign-In required | **ON** |
| User Name | `9171234002` |
| Password | `123456` |
| Notes | 아래 블록 붙여넣기 |

**Notes (English, 붙여넣기):**

```
Sign-in uses a phone number + a one-time code. For these demo accounts NO SMS is
sent — the verification code is a FIXED value: 123456. Enter it directly on the
code screen (do not wait for a text message).

BUSINESS (employer) demo account — as requested:
  • Phone number: 9171234002
  • Verification code: 123456
Steps:
  1) On the first screen the phone field already shows the "+63" prefix.
  2) Type 9171234002 and tap "Send code".
  3) Enter 123456 and tap "Verify & continue" (fixed demo code, no SMS is sent).
  4) You arrive in the Business dashboard: an active job "Café mid-shift clean"
     with two applicants. You can review applicants, select one to match, issue
     the arrival PIN, chat, and post new jobs.

WORKER demo account (to review the other account type):
  • Phone number: 9171234001
  • Verification code: 123456
  Sign out from the Profile tab, then sign in with this number + 123456.
  The worker sees a map of nearby jobs and can apply.

Both accounts are pre-loaded with live demo data in Cebu (Mactan), Philippines.
```

## 2) Resolution Center — Apple 회신 (복사용, English)

```
Hello,

Thank you for the review. We'd like to clarify how to sign in so you can access
all features.

GigOn signs in with a phone number and a one-time verification code. For the demo
accounts below, no SMS is sent — the code is a FIXED value, 123456. Please enter
it directly on the code screen; there is no need to wait for a text message.

Business (employer) demo account — as requested:
  • Phone number: 9171234002
  • Verification code: 123456

Steps:
  1. Launch the app. On the first screen, the phone field already shows the
     "+63" country code.
  2. Type 9171234002 into the phone field and tap "Send code".
  3. On the next screen, enter 123456 and tap "Verify & continue". (This is a
     fixed demo code; no SMS is sent.)
  4. You will arrive in the Business dashboard. It has an active job posting
     ("Café mid-shift clean") with two applicants, so you can review applicants,
     select one to create a match, issue the arrival PIN, chat with the worker,
     and post additional jobs.

Worker demo account (to review the other account type):
  • Phone number: 9171234001
  • Verification code: 123456
  Sign out from the Profile tab, then sign in with this number and the same code
  123456. The worker sees a map of nearby jobs and can apply.

Both accounts are pre-loaded with live demo data in Cebu (Mactan), Philippines,
so the full functionality is available for review.

Please let us know if there is anything else we can provide. Thank you!
```

## 3) 재제출 절차

1. App Review Information 저장 (위 1번).
2. Resolution Center에 회신 전송 (위 2번) — 선택이지만 권장.
3. **새 빌드 불필요** — 데모 계정/데이터가 프로덕션 백엔드에서 동작하므로 동일 빌드(1.0.0 · 4)
   그대로 **Resubmit to App Review**.
4. (선택) `docs/service/app-store-ios.md` 체크리스트의 데모 계정 줄 갱신.

## 참고 — 승인 후 정리 (선택)

재심사용 시드 데이터는 그대로 둬도 실제 콘텐츠로 무해하나, 정리하려면:

```sql
-- 재심사용 공고 7개 제거 (연결된 시드 지원자는 FK cascade로 함께 삭제)
delete from public.gigs where id::text like '40000000-%';
```

데모 계정(`639171234001/2`)과 test_otp 매핑은 **Play 리뷰어와 공유** — 삭제 금지.
