# Mafia Chat Game

Next.js 기반 마피아 채팅 게임입니다. 브라우저에서 참가자를 입력하고, 역할 배정부터 밤 행동, 낮 토론, 투표, 승패 판정까지 한 화면에서 진행할 수 있습니다.

## 목표

- 별도 설치 없이 브라우저에서 바로 진행되는 파티형 마피아 게임 제공
- 사회자 진행을 보조하는 역할 배정, 밤 행동, 투표, 승패 판정 구현
- 추후 온라인 방, 초대 링크, 실시간 동기화 구조로 확장하기 쉬운 코드 구성

## Stack

- Next.js 16 App Router
- React 19
- TypeScript
- Tailwind CSS 4
- ESLint

## Scripts

```bash
npm run dev
npm run lint
npm run typecheck
npm run build
npm run verify
npm run commit
```

`npm run commit`은 자동 커밋 명령입니다. 변경 파일을 AI가 논리 단위로 나눠 한국어 커밋 메시지로 커밋합니다.

## Getting Started

개발 서버를 실행합니다.

```bash
npm run dev
```

브라우저에서 [http://localhost:3000](http://localhost:3000)을 엽니다.

## Project Docs

- `AGENTS.md`: Codex/AI 작업 규칙
- `docs/GIT_UPLOAD.md`: GitHub 업로드 절차
- `shared/commit-script.ts`: 자동 커밋 스크립트

## Deploy

Vercel의 Next.js 자동 감지를 기본으로 사용합니다. Node 버전은 `package.json`의 `engines.node`와 맞춰 `22.x`로 관리합니다.
