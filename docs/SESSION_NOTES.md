# Session Notes

Last updated: 2026-11-09

## Current State

- Project: `mafia-chat-game`
- Remote: `https://github.com/Gyuung/mafia-chat-game.git`
- Main branch: `main`
- App stack: Next.js 16 App Router, React 19, TypeScript, Tailwind CSS 4
- Primary screen: playable solo Mafia chat game at `/`
- Docs front: Docusaurus app in `docs-site/`
- Version: `1.2.0` (Achievements & Atmosphere)

## Recent Changes (v1.2.0)

- **Achievements System**: Added 10 types of achievements with auto-unlocking and local persistence. Visualized in Career Stats.
- **Enhanced Ambient Effects**: Added scenario-based rain, dust, and vignette effects. Refactored to maintain React purity.
- **Expanded Daily Cases**: Expanded total scenarios to 14, including new "HARD" difficulty cases.
- **Refactoring & Performance**: Split MafiaGame into 8 sub-components. Achieved 100/100 score in React Doctor.

## Implemented

- Solo Mafia game against virtual participants
- Personality-based interactions and tells
- Career Stats and persistent level/XP system
- Interactive Tutorial and Mobile Optimization
- **Achievements system and immersive ambient effects**

## Known Constraints

- NPC dialogue is rule-based, not LLM-generated.
- No production chat-platform adapter yet.

## Development Environment

- macOS(MacBook)와 Windows에서 작업 가능하도록 `AGENTS.md`의 스킬 탐색 경로를 환경 독립적으로 변경했습니다.
- Vercel React Best Practices는 `react-best-practices` 이름으로도 제공됩니다. 현재 세션 목록과 숨김 플러그인 디렉터리까지 확인하세요.
- macOS 초기 설정은 `README.md` 참고: `.nvmrc`의 Node 22 선택 후 루트와 `docs-site/` 각각 `npm ci` 실행.
- 이번 세션에서 확인한 기본 Node는 v24.10.0이며, 앱 작업 전 Node 22 전환과 루트 의존성 설치가 필요합니다. 문서 의존성은 설치했고 `npm run docs:build`가 통과했습니다(Node 24에서 실행).

## Next Session TODO

1. Add sound effects (requires external assets).
2. v2.0.0 Planning: LLM integration and Hybrid Multiplayer.
3. Visual Polish: Add card flipping animations and enhanced voting tally visuals.
4. Expand Role Variety: Consider adding "Serial Killer" or "Cult Leader" for more complex sessions.

## Start Checklist For Codex

If starting a new Codex session, send the prompt saved in `CONTINUE.md` first.

Run these at the beginning of a resumed session:

```bash
git status --short
git log --oneline -8
```

Read these files before editing:

```text
AGENTS.md
README.md
docs/SESSION_NOTES.md
src/components/mafia/index.tsx
docs-site/docs/intro.md
docs-site/docs/changelog.md
docs-site/docs/roadmap.md
```

## Finish Checklist For Codex

For code changes:

```bash
npm run verify
npm run docs:build
npm run commit
git push origin main
```

For documentation-only changes, run `npm run docs:build`.
