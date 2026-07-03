# GigOn 서비스 아키텍처 개요

> 필리핀 세부/막탄 파일럿용 위치기반 단기 일자리 매칭 플랫폼.
> 제품 기준선: `supabase 프로젝트의 uploads/GigOn_MVP_PRD_v1.2_FINAL.md` (Claude Design 프로젝트에 원본).
> 원칙: 임금 미개입(현장 현금 100%) · 노동자 무과금 · PIN 상호 완료 · 파일럿 완전 무료(₱0 billable_event만 기록).

## 구성

```
gigon-mono/ (turborepo + pnpm)
├── apps/
│   ├── web/      → https://gigon.io        랜딩 + 웨이트리스트 (Next 16)
│   ├── app/      → https://app.gigon.io    서비스 웹앱 (Next 16 + Supabase)  ← docs/service/web-app.md
│   ├── mobile/   → Expo 앱 (Android 우선)                                  ← docs/service/mobile-app.md
│   └── docs/     → (turborepo 기본, 미사용)
├── packages/
│   ├── ui/         @repo/ui — shadcn 기반 공유 디자인 시스템 + 토큰 (docs/brand 참조)
│   ├── supabase/   @repo/supabase — 생성된 DB 타입 + 클라이언트 팩토리
│   └── …config
└── supabase/     스키마·시드 (로컬 CLI + 클라우드 배포; 쓰기는 apps/app/app/api) ← docs/service/backend.md
```

## 배포/인프라

| 항목 | 값 |
| --- | --- |
| Supabase 클라우드 | ref `uoeatrexoeghoigbxage` (ap-northeast-1) |
| Vercel — 랜딩 | 프로젝트 `gigon-web`, root `apps/web` |
| Vercel — 서비스 | 프로젝트 `gigon-app`, root `apps/app`, `main` 푸시 시 자동 배포 |
| 팀/스코프 | GigOn (`gcjang-6163s-projects`) |
| DNS | gigon.io Vercel 네임서버 관리 (`app.` 서브도메인 포함) |
| GitHub | `zzerone01/gigon-mono` — **항상 zzerone01 계정으로 git 작업** |

## 인증/계정

- **전화번호 + OTP** (Supabase Auth) — 웹/모바일이 같은 계정·세션 모델 공유
- 계정 1개 = 활성 역할 1개(worker/employer), 역할 전환은 `POST /api/profile/role`
- 사장님은 파일럿 초대제: 초대코드(`invite_codes` 테이블, 현재 `MACTAN-30`) → `POST /api/invites/redeem`
- 테스트 번호(실 SMS 발송 없음): 09171234001~3 / OTP `123456`
  - 로컬: `supabase/config.toml` `[auth.sms.test_otp]`
  - 클라우드: 같은 파일을 `supabase config push`로 동기화 (Twilio는 현재 더미 값 —
    **실사용자 오픈 전 실 Twilio 연동 필요**)

## 디자인 소스 (Claude Design)

프로젝트: `claude.ai/design/p/ed1114ef-8cc6-471d-8bfe-4d19baf0ed0d`

| 파일 | 구현 위치 |
| --- | --- |
| `GigOn App.dc.html` | apps/mobile 전 화면 |
| `GigOn Web Mobile.dc.html` | apps/app <768px |
| `GigOn Web.dc.html` | apps/app ≥768px |

디자인 토큰은 `@repo/ui`(웹 CSS)와 `@repo/ui/tokens`(RN)로 단일화. 새 UI는 이 토큰만 사용할 것.

## 지도

- **Google Maps 채택** (필리핀 사용자 친숙도)
- 웹: `@vis.gl/react-google-maps` — `NEXT_PUBLIC_GOOGLE_MAPS_API_KEY` 없으면 SVG 폴백
- 모바일: `react-native-maps` — Expo Go는 키 불필요, 스토어 빌드 시 Android 키 필요

## 로컬 개발 빠른 시작

```bash
pnpm install
npx supabase start                  # 로컬 스택 (Docker/Colima)
pnpm --filter app dev               # 웹앱 http://localhost:3001
pnpm --filter mobile start          # Expo Go QR
```

- `apps/app/.env.local`은 현재 **클라우드** Supabase를 가리킴 (로컬 스택 값은 파일 내 주석)
- 모바일 클라이언트 기본값도 클라우드 (`apps/mobile/src/lib/supabase.ts`, EXPO_PUBLIC_로 재정의 가능)
- 2계정 동시 테스트: 워커 `localhost:3001` / 사장님 `127.0.0.1:3001` (쿠키 오리진 분리)
