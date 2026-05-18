# Codex Project Guide

## Project

- Next.js App Router application for a browser-based Mafia social deduction chat game.
- The first screen should be the playable game, not a landing page.
- React 19 and Next.js 16 are the baseline runtime assumptions.
- Korean user-facing copy is intentional. Preserve wording and encoding unless the task is explicitly about text cleanup.

## Required Skill

- Use the installed Codex skill `vercel-react-best-practices` when writing, reviewing, or refactoring React/Next.js code in this repository.
- For detailed rule guidance, read the relevant files in `C:\Users\Wang\.codex\skills\react-best-practices\rules`.
- Prioritize these Vercel rule groups in this order: eliminating waterfalls, bundle size optimization, server-side performance, client-side data fetching, re-render optimization, rendering performance, JavaScript performance, advanced patterns.

## React And Next.js Practices

- Prefer Server Components. Add `"use client"` only for components that need browser APIs, event handlers, state, effects, refs, or client-only libraries.
- Keep client component props small and serializable. Do not pass large server data or functions into client components.
- Start independent async work early and await it together with `Promise.all`.
- Avoid request waterfalls in pages, layouts, route handlers, and server utilities.
- Use route handlers for server-owned side effects and keep secrets on the server.
- Import directly from concrete modules. Avoid broad barrel imports for UI or utility code.
- Dynamically import heavy client-only components when they are not needed for first paint.
- Do not define React components inside other components.
- Derive renderable state during render when possible. Use effects for synchronization with external systems, not for basic derivation.
- Use functional state updates for callbacks that depend on previous state.
- Keep dependency arrays primitive and stable. Hoist constant arrays, objects, regexes, and default non-primitive props outside components.
- Prefer `next/image`, explicit dimensions, and stable layout constraints for visual assets when practical.

## Vercel Deployment

- Rely on Vercel framework auto-detection for this Next.js app unless a task specifically needs `vercel.json`.
- Node runtime is pinned with `package.json` `engines.node` to `22.x`; keep local and Vercel Node versions aligned.
- Required environment variables should be mirrored in `.env.example` without secrets.
- `NEXT_PUBLIC_*` variables are public browser inputs. Never put private keys in them.

## Validation

- Before finishing code changes, run the narrowest relevant checks.
- For React/Next changes, prefer `npm run verify` when time allows.
- If the change is documentation-only, no build is required.
- Report any check that could not be run and why.

## Session Continuation Protocol

When starting a new Codex session in this repository:

1. Read `AGENTS.md`, `README.md`, and `docs/SESSION_NOTES.md`.
2. Check current git state with `git status --short`.
3. Check recent work with `git log --oneline -8`.
4. Inspect the docs front at `docs-site/docs/` when changing rules, roadmap, or changelog.
5. Prefer continuing from the `Next Session TODO` section in `docs/SESSION_NOTES.md`.
6. Before finishing a work session, update `docs/SESSION_NOTES.md` if the project direction, next TODO, or known issues changed.
7. Run `npm run verify` for app code changes and `npm run docs:build` for docs changes, then use `npm run commit` and push to `origin/main` when the user wants the work saved remotely.

## Git Workflow

- When the user asks to commit changes in this repository, use `npm run commit`.
- Do not create commits with raw `git commit -m` unless the user explicitly asks to bypass `shared/commit-script.ts`.
- After `npm run commit`, inspect the resulting commits with `git log -1 --oneline` or `git status --short` before pushing.
- When the user asks to commit changes, push the new commits to `origin/main` after the commit succeeds unless the user explicitly says not to push.
- Treat `next-env.d.ts` as a Next.js generated file. Do not include it in commits unless the user explicitly asks to commit that file.

## Editing Rules

- Keep changes scoped to the requested feature or fix.
- Do not modify `.env.local`, generated `.next` output, or `tsconfig.tsbuildinfo`.
- Do not add new dependencies without a clear reason and a matching update to the lockfile.
