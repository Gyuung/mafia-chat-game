# Session Notes

Last updated: 2026-05-26

## Current State

- Project: `mafia-chat-game`
- Remote: `https://github.com/Gyuung/mafia-chat-game.git`
- Main branch: `main`
- App stack: Next.js 16 App Router, React 19, TypeScript, Tailwind CSS 4
- Primary screen: playable solo Mafia chat game at `/`
- Docs front: Docusaurus app in `docs-site/`
- Version: `1.0.0` (Milestone Reached!)

## Recent Changes (v1.0.0)

- **Official Release Milestone Enhancements**:
  - **Career Stats**: Implemented a comprehensive statistics modal showing total games, win rate, role distribution, and average survival.
  - **Enhanced Voting Tells**: NPCs now exhibit personality-based behaviors during the voting phase (e.g., hesitation, mob mentality).
  - **Ambient Visuals High-fidelity**: Added fireflies for night and light rays for day, complementing the fog effect.
  - **Log Export & Improved Sharing**: Added `.txt` log download in LogViewer and refined the clipboard result report.
- **Maintenance**:
  - Fixed PostCSS syntax errors in `globals.css`.
  - Resolved build/lint issues related to hook dependencies.

## Implemented

- Solo Mafia game against virtual participants
- Personality system (Logical, Aggressive, Timid, Emotional, Cynic)
- Career Stats and persistent level/XP system
- Daily Case mode with unique briefings
- Enhanced Game Log Viewer with download capability
- Ambient Effects (Fog, Fireflies, Light Rays, Screen Shake, Blood Splatter)
- Step-by-step Interactive Tutorial
- Mobile-optimized UI with Docs access

## Known Constraints

- NPC dialogue is rule-based, not LLM-generated.
- No production chat-platform adapter yet.

## Next Session TODO

1. Add sound effects (requires external assets).
2. Add more ambient effects (e.g., rain, fireflies refinement).
3. Expand Daily Case variety (more scenarios).
4. Implement "Achievements" system for hidden milestones.
5. Consider a 'Replay' feature (visual step-by-step of past games).

## Future Vision (v2.0.0 Planning)

- **Hybrid Participant System**: Allow users to choose the mix of players (e.g., 2 humans + 4 AIs, or 6 humans). Requires a lobby system and real-time backend.
- **AI-Powered Intelligence**: Integrate LLMs (Gemini, OpenAI) for dynamic NPC dialogue and logical reasoning.
- **Cross-platform Connectivity**: Implement adapters for Discord and Telegram as planned in `platform-response-plan.md`.
- **Persistent Backend**: Move beyond `localStorage` to a real database (Supabase/Firebase) for user accounts and global leaderboards.
- **Advanced Gameplay**: Add complex roles (Godfather, Serial Killer, Medium) and strategic items/skills.
- **Asynchronous Multiplayer**: Challenge virtual versions of other players based on their recorded playstyles.

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
