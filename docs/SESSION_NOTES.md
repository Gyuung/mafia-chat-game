# Session Notes

Last updated: 2026-05-23

## Current State

- Project: `mafia-chat-game`
- Remote: `https://github.com/Gyuung/mafia-chat-game.git`
- Main branch: `main`
- App stack: Next.js 16 App Router, React 19, TypeScript, Tailwind CSS 4
- Primary screen: playable solo Mafia chat game at `/`
- Docs front: Docusaurus app in `docs-site/`

## Implemented

- Solo Mafia game against virtual participants
- Player role is visible only to the user
- NPC roles stay hidden until the game ends
- Night actions for mafia, doctor, detective, and citizen
- Day discussion with free chat
- Interrogation flow where NPCs answer according to role behavior
- NPC voting behavior influenced by suspicion and trust
- NPC personality system (Logical, Aggressive, Timid, Emotional) with unique dialogue and voting styles
- Simple 'trust/friendship' system between participants
- Win/loss resolution
- Emoji-style result card with XP, level, and title
- XP, level, title, and recent play history persist in `localStorage`
- Daily case mode offers a date-based briefing and once-per-day bonus XP
- Result card summarizes role, team outcome, XP gained, level progress, title changes, and key events
- Setup screen includes a chat response preview for commands, button choices, and compact result text
- Vote decisions from NPCs are logged with reasons in the progress log
- Result card displays an enhanced vote summary with role icons and revealing all roles
- Daily case variety expanded (9 cases total, including 2 Hard Mode cases)
- NPC dialogue variety expanded for more diverse discussions
- Contextual NPC reactions based on death and round number
- Detailed performance metrics on the result card (Mafia caught, total rounds)
- Automatic shell command execution policy for smoother CLI experience
- Log export feature to save game results as a text file
- Expanded variety of NPC names and personality types (added Cynic personality)
- Difficulty setting for normal games (Easy, Normal, Hard)
- Visual feedback for phase transitions (Phase overlay)
- Share Result feature (Copy to clipboard as formatted text)
- Context-aware NPC dialogue (mentions player names, reacts to Mafia caught)
- Detailed player performance stats (interrogations, correct votes, role success)
- Visual animations (fade-in chat, phase transitions, pulse effects)
- Elimination visual effects (Screen shake, blood splatter)

## Known Constraints

- NPC dialogue is rule-based, not LLM-generated.
- No persistent user profile or database yet.
- No production chat-platform adapter yet.

## Next Session TODO

1. Add sound effects (if assets are available).
2. Implement a 'Report NPC' or 'Feedback' system for dialogue quality.
3. Add a 'Game Replay' or 'Log Viewer' for past games.
4. Improve mobile responsiveness for the result card and overlay.


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
