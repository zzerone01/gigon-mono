# 모바일 앱 (`apps/mobile`, Expo)

Expo SDK 57 · RN 0.86 · expo-router · zustand · supabase-js(AsyncStorage 세션) ·
react-native-maps · reanimated 4 · `@repo/ui/tokens`

실행: `pnpm --filter mobile start` → **Expo Go**로 QR 스캔 (Android 우선).
번들 검증: `npx tsc --noEmit` + `npx expo export --platform android`.

## 화면 (`app/`, 디자인 `GigOn App.dc.html` 1:1)

```
index.tsx                  세션 게이트 (boot 대기 → phone/role/홈 리다이렉트)
onboarding/ phone → otp → role(이름·상호·초대코드) → location(expo-location)
(worker)/  explore(리스트+실지도) · my-gigs(스테퍼+실히스토리) · chat · profile
(employer)/ postings · chat · profile          ※ Post 탭은 스택 /post 를 push
gig/[id] · active · pin(키패드+잠금) · rate · post · e-applicants · e-active · e-rate · chat-room
```

공용: 커스텀 탭바(역할별 4탭+알림 dot), 토스트(탭하면 라우팅), 매칭확정/노쇼/분쟁 바텀시트.

## 데이터 아키텍처 — 뷰모델 매핑 패턴

핵심: **화면은 디자인 시절의 뷰모델 필드(`gig.t`, `gig.biz`, `applicant.rt`…)를 그대로 사용**하고,
store가 DB row를 그 모양으로 변환한다. 화면 대수술 없이 백엔드가 갈아끼워진 이유.

```
src/lib/supabase.ts    클라이언트 (클라우드 URL/anon 기본값, EXPO_PUBLIC_로 재정의,
                       AppState 기반 토큰 자동갱신)
src/lib/geo.ts         거리 계산/포맷 (웹과 동일)
src/data/mock.ts       ⚠ 이름과 달리 mock 아님 — 뷰모델 타입 + 상수 + mapGig/mapApplicant 매퍼
src/store/gig-store.ts 단일 zustand store:
   · 세션/프로필 (boot, sendOtp, verifyOtp, completeOnboarding, switchRole, signOut)
   · 워커: feed(뷰모델)·applied·wStatus·hist / apply·arrive·enterPinDigit(→
     /api/…/pin/verify, 서버 잠금 반영)·submitRate·fileDispute·cancelActiveMatch(MATCHED 취소)
   · 사장님: posting VM·apps(지원자 VM)·eStatus·pinDigits(발급 응답 평문) /
     postGig·confirmMatch·issuePin·reportNoShow·submitERate·cancelActiveMatch·cancelPosting
     (취소 시트: sheet = "cancel" | "cancelPost", 로드 시 expire_stale_gigs 스윕)
   · chatMsgs + sendChat(/api/…/messages) · 토스트/시트 — 쓰기는 전부
     `src/lib/api.ts`(@repo/api, Bearer → app.gigon.io; EXPO_PUBLIC_API_URL로 오버라이드)
   · realtime: gigs/matches/applications/messages 구독 → 토스트 + reload
   · gigById()/applicantById() — 화면들이 쓰는 뷰모델 조회 (store에서 export)
```

상태 배지/스테퍼 상수(`WORKER_BADGES` 등)도 store에서 export.

## 지도

- explore 지도: `react-native-maps` `<MapView provider={Android?GOOGLE:default}>` +
  커스텀 마커(가격 핀, YOU). **Expo Go에서 키 없이 동작**
- 온보딩/상세/등록의 미니 지도는 디자인의 SVG 아트 유지 (`src/components/maps.tsx`)
- 스토어 배포용 스탠드얼론 빌드 시: GCP에서 "Maps SDK for Android" 활성화 + Android 키 발급 →
  `app.json > expo.android.config.googleMaps.apiKey`

## 빌드/배포 메모

- 아직 EAS 미설정 — 스토어 배포 시 `eas build` 셋업 필요 (app.json에 expo-location 플러그인 등록됨)
- pnpm 모노레포 Metro 주의: `disableHierarchicalLookup` 켜지 말 것,
  `@expo/metro-runtime`은 직접 의존성, `unstable_enablePackageExports` 유지
- 폰트: `@expo-google-fonts/inter·poppins` (weight별 패밀리명 사용 — `src/theme`)
