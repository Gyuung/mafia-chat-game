# Session Notes

Last updated: 2026-05-26

## Current State

- Project: `mafia-chat-game`
- Remote: `https://github.com/Gyuung/mafia-chat-game.git`
- Main branch: `main`
- App stack: Next.js 16 App Router, React 19, TypeScript, Tailwind CSS 4
- Primary screen: playable solo Mafia chat game at `/`
- Docs front: Docusaurus app in `docs-site/`
- Version: `0.9.0`

## Recent Changes (v0.9.0)

- **Comprehensive Gameplay & UI Enhancements**:
  - **Personality-specific Tells**: Expanded Mafia interrogation responses based on NPC personality types.
  - **Ambient Effects**: Added animated fog for night phase and subtle lighting for day phase.
  - **Interactive Tutorial**: Implemented a step-by-step onboarding guide for new players.
  - **Setup UI Revamp**: Improved the game configuration panel with better layout and intuitive controls.
  - **Mobile Fix**: Added a "Docs" button to the mobile header for better navigation.
- **Maintenance**:
  - Fixed various build and lint issues.
  - Improved `commit-script.ts` for Windows environment stability.

## Implemented

- Solo Mafia game against virtual participants
- Player role is visible only to the user
- NPC roles stay hidden until the game ends
- Night actions for mafia, doctor, detective, and citizen
- Day discussion with free chat
- Interrogation flow where NPCs answer according to role behavior
- NPC voting behavior influenced by suspicion and trust
- NPC personality system (Logical, Aggressive, Timid, Emotional, Cynic) with unique dialogue and voting styles
- Simple 'trust/friendship' system between participants
- Win/loss resolution
- Emoji-style result card with XP, level, and title
- XP, level, title, and recent play history persist in `localStorage`
- Daily case mode offers a date-based briefing and once-per-day bonus XP
- Result card summarizes role, team outcome, XP gained, level progress, title changes, and key events
- Setup screen includes a chat response preview for commands, button choices, and compact result text
- Vote decisions from NPCs are logged with reasons in the progress log
- Result card displays an enhanced vote summary with role icons and revealing all roles
- Daily case variety expanded
- contextual NPC reactions
- Automatic shell command execution policy
- Log export feature
- Difficulty settings (Easy, Normal, Hard)
- Phase transitions and elimination effects
- Game Log Viewer for past games
- **Implemented Ambient Effects, Personality Tells, and In-game Tutorial.**

## Known Constraints

- NPC dialogue is rule-based, not LLM-generated.
- No persistent user profile or database yet.

## Next Session TODO

1. Add sound effects (assets needed).
2. Add more ambient effects (e.g., rain, fireflies).
3. Expand "Tells" to cover more game situations (e.g., voting patterns).
4. Implement a "Leaderboard" or "Career Stats" page.
5. Consider a 'Share Results' feature improvement or social integration.

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
