# Session Notes

Last updated: 2026-05-26

## Current State

- Project: `mafia-chat-game`
- Remote: `https://github.com/Gyuung/mafia-chat-game.git`
- Main branch: `main`
- App stack: Next.js 16 App Router, React 19, TypeScript, Tailwind CSS 4
- Primary screen: playable solo Mafia chat game at `/`
- Docs front: Docusaurus app in `docs-site/`
- Version: `1.1.0` (Core Interaction Enhanced)

## Recent Changes (v1.1.0)

- **Enhanced Player Identity**:
  - Assigned random names (from the bot name pool) to the human player if no name is provided.
  - Updated bot discussion and interrogation logic to use the player's assigned name naturally.
  - UI now displays the assigned name followed by "(나)" in the sidebar for clarity.
- **v1.0.0 Milestone (Earlier this session)**:
  - Career Stats, Enhanced Voting Tells, Ambient Visuals, Log Export.

## Implemented

- Solo Mafia game against virtual participants
- Personality-based interactions and tells
- Career Stats and persistent level/XP system
- Ambient Effects and Interactive Tutorial
- **Human player real-name identity for better NPC interaction.**

## Known Constraints

- NPC dialogue is rule-based, not LLM-generated.
- No production chat-platform adapter yet.

## Next Session TODO

1. Add sound effects (requires external assets).
2. Add more ambient effects (e.g., rain, fireflies refinement).
3. Expand Daily Case variety.
4. Implement "Achievements" system.
5. v2.0.0 Planning: LLM integration and Hybrid Multiplayer.

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
src/components/MafiaGame.tsx
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
