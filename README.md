# Mafia Chat Game

카카오톡 챗봇 beta 입점 신청을 목표로 만드는 Next.js 기반 마피아 채팅 게임입니다.

## 목표

- 카카오톡 채팅 진입점에서 빠르게 방을 만들고 참여하는 마피아 게임 경험 제공
- 사회자 자동 진행, 직업 배정, 낮/밤 토론 흐름, 투표 결과 안내를 웹/챗봇 연동 구조로 구현
- 입점 심사에서 서비스 목적, 사용자 흐름, 개인정보/보안 관리가 명확히 드러나도록 문서와 화면 구성 정리

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

## Kakao Chatbot Notes

- 카카오 API 키, 채널 토큰, webhook secret은 서버 환경 변수로만 관리합니다.
- 브라우저에 노출되는 값은 `NEXT_PUBLIC_*` 환경 변수만 사용합니다.
- 챗봇 webhook과 운영자 기능은 `src/app/api` 아래 route handler로 구현합니다.

## Deploy

Vercel의 Next.js 자동 감지를 기본으로 사용합니다. Node 버전은 `package.json`의 `engines.node`와 맞춰 `22.x`로 관리합니다.
