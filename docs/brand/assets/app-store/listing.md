# App Store (iOS) 등록 준비 — 에셋 + 입력값

> 2026-07-04 작성. Play Store 제출(같은 날, [daily](../../../daily/2026-07-04.md))과
> 짝을 이루는 iOS 버전. App Store Connect에 입력할 값을 전부 여기 모아둔다.
> 스크린샷 재생성: `node docs/brand/assets/app-store.mjs`

## 에셋 체크리스트

| 에셋 | 상태 | 비고 |
| --- | --- | --- |
| 앱 아이콘 | ✅ 빌드에 포함 | `apps/mobile/assets/icon.png` (1024², **알파채널 제거됨** — 있으면 ITMS-90717로 업로드 거부). App Store Connect가 바이너리에서 자동 추출하므로 별도 업로드 불필요 |
| iPhone 6.9" 스크린샷 4장 | ✅ 이 폴더 | 1320×2868, RGB(알파 없음). 6.9" 한 세트면 모든 iPhone 크기 자동 스케일 |
| 실기기 캡처 6장 | ✅ [`../ios-captures/`](../ios-captures/) | 1284×2778(6.5″)·알파 제거 — **ASC 업로드 완료본**(2026-07-04, 테스트 계정 로그인·PH 전체 문구 반영). 이 앱의 ASC 슬롯은 6.5″만 허용하므로 1320×2868은 거부됨 |
| iPad 스크린샷 | ➖ 불필요 | `supportsTablet: false`로 변경(2026-07-04) — iPhone 전용. 근거는 아래 |
| 앱 미리보기 영상 | ➖ 선택 | v1은 생략 |

**스크린샷 순서** (Play와 동일한 서사 — 워커 3장 → 사장님 1장):

1. `01-worker-feed.png` — 히어로 "Your gig is on." + 워커 피드
2. `02-gig-detail.png` — "Everything up front" + 공고 상세(1탭 지원)
3. `03-worker-map.png` — "Map-first, walkable" + 지도
4. `04-business-console.png` — "Hire in minutes" + 지원자 비교

**supportsTablet을 끈 이유**: iPad 지원 선언 시 13" 스크린샷이 의무가 되고
심사도 iPad 레이아웃까지 본다(깨지면 리젝). 폰 퍼스트 MVP라 iPhone 전용으로
제출하고, iPad에서는 호환 모드로 실행된다. iOS 빌드를 아직 제출한 적이 없어
지금 바꿔도 부작용 없음.

## App Store Connect 입력값 (영문, 글자수 확인됨)

| 필드 | 값 | 제한 |
| --- | --- | --- |
| Name | `GigOn – Nearby Cash Gigs` | 24/30 ("GigOn" 단독이 선점됐을 때도 이대로 사용 가능) |
| Subtitle | `1–3 hour gigs, a walk away` | 26/30 |
| Primary category | Business | Play와 동일 |
| Keywords | `gig,gigs,part time,jobs,cash,nearby,hire,staff,worker,side hustle,raket,extra income,cebu,mactan` | 96/100 |
| Support URL | `https://gigon.io` | |
| Marketing URL | `https://gigon.io` | 선택 |
| Privacy Policy URL | `https://app.gigon.io/privacy` | |
| Copyright | `© 2026 GigOn` | |

**Promotional text** (131/170 — 심사 없이 수시 수정 가능):

```
Find cash gigs within walking distance — or post one and match in minutes.
Now live in the Philippines. Free during the pilot.
```

**Description** (messaging.md 4필러 기반, Play full description과 같은 구조):

```
GigOn is a map-first marketplace for short, local gigs in the Philippines —
the 1–3 hour jobs that usually get filled through Facebook groups, minus the
no-shows and the guesswork.

FOR WORKERS
• See gigs within 2–3 km, sorted by distance — pay, time and place up front
• Apply in one tap. When the business picks you, you're matched
• Get paid in cash, on the spot. You keep 100% — GigOn never takes a cut
  from wages
• Build a track record: ratings and completed gigs that businesses can trust

FOR BUSINESSES
• Post a gig in under a minute — free during the pilot
• Compare applicants by distance, rating, completed gigs and no-show history
• Match, then chat in-app. Phone numbers stay private

BUILT ON TRUST
• Mutual PIN check-out: a job only closes when both sides confirm it's done
  and paid — and only confirmed jobs can be reviewed
• Two-way ratings, so reliable people rise
• No-shows and cancellations are recorded automatically, not self-reported

Now piloting across the Philippines. Business accounts currently
require an invite code. Workers ride free — forever.

Your gig is on.
```

## App Privacy (영양라벨) — Play Data safety와 1:1 매핑

전부 **App Functionality** 목적, **Linked to you**, **트래킹 없음**
("Data Not Used to Track You"). 광고 SDK·AdSupport 없음.

| Apple 카테고리 | 항목 | Play 쪽 대응 |
| --- | --- | --- |
| Contact Info | Phone Number, Name | 전화번호·이름 (필수) |
| Identifiers | User ID | User ID (필수) |
| Location | Coarse + Precise Location | 위치 대략+정밀 (선택 — 거부 시 파일럿존 폴백) |
| User Content | Other User Content | 인앱 채팅 |
| Usage Data | Product Interaction | PostHog 분석 (Analytics 목적으로 선언) |

Supabase/PostHog/Semaphore는 위탁 처리자 — Apple 기준으로도 "수집"만
해당하고 제3자 광고/트래킹 공유 아님.

## Age Rating

설문은 사실대로(폭력·성인 콘텐츠 없음 → 계산상 낮게 나옴) 답하고,
**수동 상향(override)으로 17+/18+** 설정 — Play에서 Target audience 18+로
제출한 것과 일관되게 (대면 노동 매칭 + 앱 내 나이 검증 없음).
UGC 문항(사용자 생성 콘텐츠 = 채팅)은 Yes.

## App Review Information

- Sign-in required → **데모 계정 필수 입력**:
  - Worker: phone `+63 917 123 4001`, OTP `123456`
  - Business: phone `+63 917 123 4002`, OTP `123456` (초대코드 `MACTAN-30` 이미 적용됨)
  - ⚠️ Play 리뷰어 계정과 동일 — **삭제·변경 금지** ([STATUS](../../../STATUS.md) 참조)
- Notes란에 넣을 문구:

```
GigOn is a two-sided gig marketplace piloting in the Philippines.

SIGN IN: OTP login uses test numbers (no real SMS is sent). Worker account:
+63 917 123 4001, code 123456. Business account: +63 917 123 4002, code
123456. One account can switch roles (worker ↔ business) from the profile.

LOCATION: used only to show gigs within 2–3 km. If permission is denied the
app falls back to the pilot-zone center (Mactan), so it remains fully usable.

PAYMENTS: none in-app. Pay for gigs is settled in cash between the parties;
the app never processes money.

ACCOUNT DELETION: Profile → Delete account (also at
https://app.gigon.io/account/delete).

CHAT: available only between two matched parties after a successful match
(business selects a worker). Messages can be reported.
```

## 제출 전 체크 (Play 제출에서 얻은 교훈 포함)

- [ ] **데모 공고 시드** — 공고는 24h 후 자동 만료. 심사 제출 직전에 프로드에
      데모 공고 4~6건 게시(안 하면 리뷰어가 빈 피드를 봄)
- [ ] Export compliance: `ITSAppUsesNonExemptEncryption: false`가 app.json에
      있어 제출 시 암호화 문항 안 뜸 ✅
- [ ] 계정 삭제(가이드라인 5.1.1(v)): 인앱 프로필 버튼 + 웹 URL ✅ (`5d6d5aa`)
- [ ] ⚠️ **UGC 차단(block) 기능 미구현** — Apple 가이드라인 1.2는 신고(있음)
      외에 **차단**도 요구. Play보다 리젝 확률 높은 지점. 리젝되면 차단 기능
      추가 후 재제출 (원래 공개 런칭 전 TODO였음 — STATUS 참조)
- [ ] iOS 지도는 Apple Maps(react-native-maps 기본) — Google Maps 키 불필요,
      Android 때 같은 키 세팅 작업 없음

## 남은 사용자 액션 (에셋 밖 — 계정/빌드)

1. **Apple Developer Program** 등록 ($99/년, developer.apple.com) — 조직
   등록이면 D-U-N-S 필요해 며칠 걸림. 개인 등록이 빠름
2. App Store Connect에서 앱 생성 — Bundle ID `com.gigon.app` (app.json과 일치)
3. `cd apps/mobile && npx eas-cli build -p ios --profile production`
   — 인증서·프로비저닝·APNs 푸시 키는 EAS가 대화형으로 자동 생성/관리
4. `npx eas-cli submit -p ios` → App Store Connect에서 위 입력값 채우고 심사 제출
