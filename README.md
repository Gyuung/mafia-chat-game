# Mafia Chat Game

Next.js 기반의 채팅형 마피아 게임입니다. 브라우저에서 혼자 접속해도 가상 참가자들과 역할 배정, 밤 행동, 낮 심문, 투표, 승패 판정까지 진행할 수 있습니다.

## 목표

- 별도 설치 없이 브라우저에서 바로 진행하는 솔로형 마피아 게임 제공
- 내 역할만 공개하고 다른 참가자의 역할은 게임 종료 후 공개
- 심문, NPC 응답, 투표, 결과 카드, XP/레벨/칭호 보상 구현
- 이후 채팅형 인터페이스에서도 같은 게임 규칙과 결과 표현을 재사용할 수 있는 구조 유지

## Stack

- Next.js 16 App Router
- React 19
- TypeScript
- Tailwind CSS 4
- ESLint
- Docusaurus 3 문서 사이트

## Scripts

```bash
npm run dev
npm run docs:dev
npm run lint
npm run typecheck
npm run build
npm run verify
npm run docs:build
npm run verify:all
npm run commit
```

`npm run commit`은 자동 커밋 명령입니다. 변경 파일을 AI가 기능 단위로 나누고 한국어 커밋 메시지로 커밋합니다.

## Getting Started

게임 개발 서버:

```bash
npm run dev
```

브라우저에서 [http://localhost:3000](http://localhost:3000)을 엽니다.

문서 개발 서버:

```bash
npm run docs:dev
```

브라우저에서 [http://localhost:3001](http://localhost:3001)을 엽니다.

## Project Docs

- `AGENTS.md`: Codex/AI 작업 규칙과 세션 이어하기 프로토콜
- `docs/SESSION_NOTES.md`: 세션 재개용 현재 상태 노트
- `docs/GIT_UPLOAD.md`: GitHub 업로드 절차 문서
- `docs-site/`: Docusaurus 문서 사이트
- `shared/commit-script.ts`: 자동 커밋 스크립트

## Deploy

Vercel의 Next.js 자동 감지를 기본으로 사용합니다. Node 버전은 `package.json`의 `engines.node`에 맞춰 `22.x`로 관리합니다.

앱 프로젝트에는 `NEXT_PUBLIC_DOCS_URL`을 문서 프로젝트 URL로 설정합니다.
문서 프로젝트에는 `APP_URL`과 `DOCS_SITE_URL`을 설정합니다.
