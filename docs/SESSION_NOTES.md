# Session Notes

Last updated: 2026-11-14

## Current State

- Project: `mafia-chat-game`
- Remote: `https://github.com/Gyuung/mafia-chat-game.git`
- Main branch: `main`
- App stack: Next.js 16 App Router, React 19, TypeScript, Tailwind CSS 4
- Primary screen: playable solo Mafia chat game at `/`
- Docs front: Docusaurus app in `docs-site/`
- Version: `1.2.5` (Rule Validation Foundation)

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

## Latest Fixes (v1.2.4)

- 업적 판정·알림·저장·통계 화면 연결 복구. 승리 여부는 내 진영으로 판정.
- 마지막 행동 수치와 전체 게임 피득표 여부를 업적 조건에 반영. 검거 수는 별도 누적 저장.
- 경력 통계의 승률·역할 분포는 저장된 최근 10개 기록 기준. 기존 데이터에서 이미 지워진 기록의 검거 수는 복원 불가.

## Known Constraints

- v1.2.5: 순수 `engine/rules.ts`와 내부 상태·대상 명령 타입 추가. 훅과 UI에서 역할 구성·승패·대상 검증 공유.
- 탈락자 행동·투표를 제외하고 NPC 결과만 진행. 검증은 TypeScript 내부 호출용이며 외부 요청 스키마·인증·동시성 제어는 후속 단계.

- NPC dialogue is rule-based, not LLM-generated.
- No production chat-platform adapter yet.

## Development Environment

- macOS(MacBook)와 Windows에서 작업 가능하도록 `AGENTS.md`의 스킬 탐색 경로를 환경 독립적으로 변경했습니다.
- Vercel React Best Practices는 `react-best-practices` 이름으로도 제공됩니다. 현재 세션 목록과 숨김 플러그인 디렉터리까지 확인하세요.
- macOS 초기 설정은 `README.md` 참고: `.nvmrc`의 Node 22 선택 후 루트와 `docs-site/` 각각 `npm ci` 실행.
- 기본 Node는 v24.10.0입니다. 2026-11-10에는 npm 임시 Node v22.22.3 환경에서 `npm run verify`를 통과했고, 문서 빌드도 통과했습니다. 지속적인 개발에는 README에 따라 Node 22를 선택하세요.

## Next Session TODO

1. Sound effects implemented with original synthesized WAV assets. Next: manually check audio playback on desktop/mobile browsers.
2. v2 작업 A 완료: 상태·대상 명령 타입, 역할 구성·승패·대상 검증 분리 및 훅 연결. 다음은 B(밤·투표 전체 판정 분리), C(정보 분리), D~F(선택형 AI·혼합 방) 순서. 공급자·인프라는 미선정. 검증 명령은 Node 22에서 `node --import tsx --test tests/*.test.ts`.
3. Visual Polish: 역할 카드 공개 애니메이션과 결과 화면 마지막 투표 집계 시각화 완료. 동작 줄이기 설정을 게임 전체 연출·자동 스크롤에 적용. 브라우저 호스트 연결 불가로 데스크톱·모바일 실제 화면 검증은 미완료.
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
