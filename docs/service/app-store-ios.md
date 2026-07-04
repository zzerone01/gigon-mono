# iOS App Store 제출 — 입력값 및 체크리스트

> 2026-07-04 기준. App Store Connect 리스팅에 붙여넣을 카피 원본과 제출 진행 상황 기록.
> App Store Connect: https://appstoreconnect.apple.com/apps/6787359152

## 진행 현황

| 단계                                | 상태                                              |
| ----------------------------------- | ------------------------------------------------- |
| EAS iOS production 빌드 (1.0, #1)   | ✅ 완료                                           |
| 크리덴셜 (인증서/프로파일/APNs 키)  | ✅ EAS 서버 관리, zeronics 팀 (R5NMM7793L)        |
| App Store Connect API Key           | ✅ APP_MANAGER 권한으로 EAS에 등록 (이후 자동화)  |
| 바이너리 업로드 (`eas submit`)      | ✅ 완료 — Apple 처리 후 TestFlight에 표시         |
| 푸시 (`aps-environment`)            | ✅ 빌드에 포함 확인 (ipa 엔타이틀먼트 검증)       |
| 리스팅 메타데이터                   | ⬜ 아래 카피 입력                                 |
| 스크린샷 (iPhone / iPad)            | ⬜ supportsTablet 결정 후 캡처                    |
| App Privacy 설문                    | ⬜                                                |
| 심사용 데모 계정 (테스트 전화번호)  | ⬜ Supabase 고정 OTP 설정                         |
| Add for Review                      | ⬜                                                |

계정 참고: 앱은 개인사업자 **zeronics** 계정으로 출시. 추후 공동 사업자/법인 설립 시
App Transfer로 이전 (사용자·리뷰 유지, Sign in with Apple은 이전 후에 도입할 것).

## 복붙용 입력값

### Version Information (1.0 페이지)

**Promotional Text** (170자 제한, 심사 없이 수정 가능):

```
GigOn is live in the Philippines! Find short, local gigs near you and get matched with trusted businesses. Free during the pilot.
```

**Description**:

```
Your gig is on.

GigOn connects local businesses with trusted workers nearby for short gigs — a few hours, same day, close to home. Available across the Philippines.

FOR WORKERS
• See gigs on a map — find work minutes from where you are
• Apply in one tap with your profile
• Get matched and confirm arrival with a simple PIN
• Build your reputation with reviews after every gig

FOR BUSINESSES
• Post a gig in under a minute
• Review applicants and choose who fits
• Verify arrival on site with a PIN
• Rate workers and rebook the ones you trust

WHY GIGON
• Local first: gigs are always near you
• Trust built in: verified phone numbers, reviews, and arrival confirmation
• Free during the pilot — a small per-match fee for businesses is planned later

GigOn is in early access in the Philippines. Questions or feedback? Email us at leo@gigon.io — we read everything.
```

**Keywords** (100자 제한, 현재 88자):

```
gig,part time,job,raket,sideline,philippines,hiring,extra income,same day pay,local,work
```

| 필드          | 값                  |
| ------------- | ------------------- |
| Support URL   | https://gigon.io    |
| Marketing URL | https://gigon.io    |
| Copyright     | 2026 GigOn          |
| Version       | 1.0                 |

### App Information (왼쪽 메뉴)

| 필드               | 값                              |
| ------------------ | ------------------------------- |
| Name               | GigOn                           |
| Subtitle (30자)    | Local gigs near you             |
| Category (Primary) | Business                        |
| Privacy Policy URL | https://app.gigon.io/privacy    |

### Pricing and Availability

- Price: **Free** (0 USD)
- Availability: 필리핀 필수, 그 외 국가는 파일럿 단계라 PH만 여는 것도 무방

### App Review Information

| 필드     | 값                                       |
| -------- | ---------------------------------------- |
| Sign-in required | ✔ (전화번호 인증)                |
| User name / Password | 테스트 전화번호 + 고정 OTP (Supabase 설정 후 기입) |
| Contact  | 이름 / 전화번호 / leo@gigon.io           |

**Notes 초안** (데모 계정 설정 후 번호/OTP 채워서 사용):

```
GigOn uses SMS phone authentication (Philippines +63 numbers).
For review, please use the test account below — it accepts a fixed OTP
without sending a real SMS:

Phone number: +63 9XX XXX XXXX
OTP code: XXXXXX

The app is a two-sided local gig marketplace piloting in the Philippines.
Businesses post short gigs; workers nearby apply and get matched.
```

### App Store Version Release

- **Manually release this version** 권장 — 심사 승인 후 원하는 시점에 수동 출시.

## 스크린샷 규격 메모

- **iPhone**: 1242×2688 / 2688×1242 / 1284×2778 / 2778×1284 중 하나.
  iPhone 17 Pro Max 시뮬레이터 캡처(1320×2868)를 1284×2778로 변환해 사용 예정.
- **iPad 13″**: `supportsTablet: true`인 동안은 필수 (2064×2752 등).
  iPad UI 미정비 시 `supportsTablet: false`로 바꾸고 재빌드하는 선택지 있음 — **결정 필요**.
- 최대 10장, 처음 3장이 설치 시트에 노출됨. 캡처는 sim-use로 시뮬레이터에서 진행.

## 남은 결정/작업

1. `supportsTablet` 유지(iPad 스크린샷 제작) vs 제거(재빌드) — **오너 결정 대기**
2. Supabase 테스트 전화번호 + 고정 OTP 설정 → Review Notes에 기입
3. App Privacy 설문 답안 (수집 항목: 전화번호, 이름, 위치, 사용 데이터 — 코드 기준 정리 예정)
4. 스크린샷 캡처·변환·업로드
5. Build 섹션에서 1.0 빌드 선택 (Apple 처리 완료 후)
6. Add for Review
