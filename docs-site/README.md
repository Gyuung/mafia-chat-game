# Mafia Chat Game Docs

Docusaurus로 만든 프로젝트 문서 사이트입니다. 게임 룰, 변경 이력, 로드맵, 세션 이어하기 프로토콜을 이곳에서 관리합니다.

## Local Development

루트 프로젝트에서 실행합니다.

```bash
npm run docs:dev
```

문서 사이트는 기본적으로 [http://localhost:3001](http://localhost:3001)에서 확인합니다.

## Build

```bash
npm run docs:build
```

정적 결과물은 `docs-site/build`에 생성됩니다.

## Editing

- 게임 규칙 변경: `docs/game-rules.md`
- 변경 이력 추가: `docs/changelog.md`
- 다음 작업 정리: `docs/roadmap.md`
- 세션 이어하기 절차: `docs/session-continuation.md`
