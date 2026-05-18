---
sidebar_position: 5
---

# 세션 이어하기

Codex 세션이 종료된 뒤 이어서 작업할 때는 아래 순서로 현재 상태를 복구합니다.

## 시작 체크리스트

```bash
git status --short
git log --oneline -8
```

먼저 읽을 파일:

- `AGENTS.md`
- `README.md`
- `docs/SESSION_NOTES.md`
- `src/components/MafiaGame.tsx`
- `docs-site/docs/intro.md`
- `docs-site/docs/changelog.md`
- `docs-site/docs/roadmap.md`

## 종료 체크리스트

코드 변경 후:

```bash
npm run verify
npm run docs:build
npm run commit
git push origin main
```

문서만 바꿨다면 `npm run docs:build`를 우선 확인합니다.
