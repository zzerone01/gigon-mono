# docs/service

GigOn 서비스 구현 문서. 새 세션/새 팀원은 이 순서로 읽으면 됩니다.

> 빠른 파악용 한 장 요약: [`docs/STATUS.md`](../STATUS.md)

1. [overview.md](./overview.md) — 아키텍처, 배포/인프라, 인증, 디자인 소스, 로컬 개발 시작
2. [backend.md](./backend.md) — 쓰기 API(Route Handlers)·Supabase 스키마·RLS 방침·realtime·배포 런북·마이그레이션 이력
3. [web-app.md](./web-app.md) — app.gigon.io (Next.js) 구조와 반응형 규칙
4. [mobile-app.md](./mobile-app.md) — Expo 앱 구조와 뷰모델 매핑 패턴
5. [app-store-ios.md](./app-store-ios.md) — iOS App Store 제출 진행 현황·체크리스트 (카피 정본은 docs/brand/assets/app-store/listing.md) (2026-07-04)

> ✅ **완료(2026-07-03): [api-migration.md](./api-migration.md)** — 쓰기 RPC 15개를
> Next.js Route Handlers로 이관 완료. 새 쓰기 기능은 `apps/app/app/api/**`에 추가할 것.

일별 작업 기록: [`docs/daily/`](../daily/) (최신: [2026-07-03](../daily/2026-07-03.md) —
전체 구현 요약 + 다음 할 일 목록)

브랜드/디자인 시스템: [`docs/brand/`](../brand/README.md)
