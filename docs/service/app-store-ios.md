# iOS App Store 제출 — 진행 현황 및 체크리스트

> ✅ **2026-07-04 심사 제출 완료** (최대 48시간 소요, 결과는 메일 통보).
> 승인 후 수동 출시(Manually release) 설정 — App Store Connect에서 Release 버튼을 눌러야 공개된다.
>
> 2026-07-04 기준. **ASC에 입력할 카피/키워드/프라이버시 라벨의 정본은
> [`docs/brand/assets/app-store/listing.md`](../brand/assets/app-store/listing.md)**
> — 이 문서는 제출 진행 상황과 계정·빌드 전략만 기록한다.
> App Store Connect: https://appstoreconnect.apple.com/apps/6787359152

## 진행 현황

| 단계                                | 상태                                              |
| ----------------------------------- | ------------------------------------------------- |
| EAS iOS production 빌드 #1          | ✅ (구 Mactan 문구 — 사용 안 함)                  |
| EAS iOS production 빌드 (buildNumber 4) | ✅ 업로드됨 — PH 전체 문구·iPhone 전용, **이 빌드 선택** |
| 크리덴셜 (인증서/프로파일/APNs 키)  | ✅ EAS 서버 관리, zeronics 팀 (R5NMM7793L)        |
| App Store Connect API Key           | ✅ APP_MANAGER 권한으로 EAS에 등록 (제출 자동화)  |
| 푸시 (`aps-environment`)            | ✅ 빌드에 포함 확인 (ipa 엔타이틀먼트 검증)       |
| `supportsTablet: false`             | ✅ 빌드 4에 반영 (`UIDeviceFamily: [1]`) — iPad 스크린샷 불필요 |
| 스크린샷                            | ✅ ASC 업로드 완료 — 업로드본 6장 `docs/brand/assets/ios-captures/` (1284×2778·알파 제거) |
| 심사용 데모 계정                    | ✅ 워커 `0917 123 4001` / 사장님 `0917 123 4002`, OTP `123456` (Play 리뷰어와 동일 — 삭제 금지) |
| 리스팅 메타데이터 입력              | ✅                                                |
| Age Ratings                         | ✅ 18+ (수동 상향 — Play와 일관, 한국 19+)        |
| Content Rights                      | ✅ 서드파티(사용자 제공) 콘텐츠 포함·권리 보유    |
| App Privacy 설문                    | ✅ listing.md 매핑대로 입력·Publish               |
| Add for Review                      | ✅ **2026-07-04 제출 완료**                       |

## 계정 전략

앱은 개인사업자 **zeronics** 계정으로 출시. 추후 공동 사업자/법인 설립 시
App Transfer로 이전 (사용자·리뷰 유지). Sign in with Apple은 팀 이전을
복잡하게 만드니 **이전 후에 도입**할 것.

## 제출 시 선택 사항

- Pricing: Free · Availability: 필리핀 필수 (그 외 국가는 선택)
- App Store Version Release: **Manually release this version** 권장 —
  승인 직후 자동 공개 사고 방지

## 스크린샷 촬영 메모 (2026-07-04)

- ⚠️ **이 앱의 ASC 스크린샷 슬롯은 6.5″(1284×2778 등)만 허용** — 1320×2868(6.9″)
  원본을 그대로 올리면 dimension 오류로 거부됨. 업로드 전 변환 필수
  (알파 채널도 제거해야 함). 프레임판(`app-store/`, 1320×2868)도 동일하게 변환 필요:

  ```sh
  sips --resampleWidth 1284 --cropToHeightWidth 2778 1284 in.png --out out.png
  node -e "require('sharp')('out.png').removeAlpha().png().toFile('final.png')"
  ```

- 시뮬레이터 iPhone 17 Pro Max로 촬영(원본 1320×2868) 후 위 레시피로 변환 —
  `ios-captures/`에는 **변환·업로드 완료본(1284×2778)만 보관** (원본은 재촬영 가능:
  테스트 계정 로그인 + `xcrun simctl status_bar override --time 9:41` + sim-use)
- sim-use로 캡처 (관련 세팅: `~/.claude/skills/sim-use`)
- 촬영 위해 프로덕션 데모 데이터 2건 수정 — 스모크 테스트 공고 제목
  `PostHog smoke test — ignore` → `Restock shelves — morning`(id c981c864),
  `Café deep clean — afternoon`(id 2ac8cefb)의 created_at을 최신으로 변경
  (원값 2026-07-03 17:21:52+00)
