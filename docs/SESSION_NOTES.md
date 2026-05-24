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
- NPC voting behavior influenced by suspicion
- Win/loss resolution
- Emoji-style result card with XP, level, and title
- XP, level, title, and recent play history persist in `localStorage`
- Daily case mode offers a date-based briefing and once-per-day bonus XP
- Result card summarizes role, team outcome, XP gained, level progress, title changes, and key events
- Setup screen includes a chat response preview for commands, button choices, and compact result text
- Vote decisions from NPCs are logged with reasons in the progress log
- Result card displays a compact vote summary (who voted for whom) at the end of the game
- Daily case variety expanded (7 cases total) with tuned reward balance
- NPC voting behavior tuned to be more suspicion-driven and less "clairvoyant"
- Role images under `public/roles`
- Log auto-scroll on new messages
- Docusaurus docs site with user-facing rules, changelog, roadmap, and response design notes
- Automatic commit script at `shared/commit-script.ts`

## Known Constraints

- NPC dialogue is rule-based, not LLM-generated.
- No persistent user profile or database yet.
- No production chat-platform adapter yet.
- Role images are generated raster assets and should stay in `public/roles`.

## Next Session TODO

1. Expand NPC dialogue variety to make discussions feel more diverse.
2. Implement a simple "trust/friendship" system where NPCs might protect players they've interacted with positively.
3. Enhance the vote summary UI with small role icons or better layout.
4. Add a "hard mode" daily case with more aggressive NPCs.

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
