# Session Notes

Last updated: 2026-05-18

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
- Role images under `public/roles`
- Log auto-scroll on new messages
- Docusaurus docs site with rules, changelog, roadmap, session continuation, and response design notes
- Automatic commit script at `shared/commit-script.ts`

## Known Constraints

- XP is currently session-only and resets on new game/page reload.
- NPC dialogue is rule-based, not LLM-generated.
- No persistent user profile or database yet.
- No production chat-platform adapter yet.
- Role images are generated raster assets and should stay in `public/roles`.

## Next Session TODO

1. Persist XP, level, title, and play history in `localStorage`.
2. Improve result card with richer emoji summary:
   - role
   - team result
   - XP gained
   - level progress
   - title unlock
   - key round events
3. Add a daily case mode and daily reward concept.
4. Add a chat-platform response preview page or panel:
   - command examples
   - button choices
   - compact result card text
5. Update `docs-site/docs/changelog.md` whenever gameplay behavior changes.

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
