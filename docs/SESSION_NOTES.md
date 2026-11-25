# Session Notes

Last updated: 2026-11-25

## Current State

- Project: `mafia-chat-game`
- Remote: `https://github.com/Gyuung/mafia-chat-game.git`
- Main branch: `main`
- App stack: Next.js 16 App Router, React 19, TypeScript, Tailwind CSS 4
- Primary screen: playable solo Mafia chat game at `/`
- Docs front: Docusaurus app in `docs-site/`
- Version: `1.2.8` (Responsive Layout & Scoped Log Scroll)

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

- 2026-11-25 로그아웃 HTTP 처리기 구현: POST·고정 출처 검사 후 서버 세션 폐기 완료 시 쿠키 삭제·204 반환. 오류 상세 비노출·캐시 금지·재전송·취소 검증. 신규 5개 포함 전체 117개. 공개 라우트·영속 저장소·입장 처리·UI는 미연결.

- 2026-11-24 참가자 세션 모듈 구현: 무작위 토큰·해시 저장소 계약·쿠키·만료·폐기 검증을 요청 처리기에 연결 테스트. 신규 9개 포함 전체 112개. 운영 저장소·서버 입장/로그아웃 라우트·계정 로그인·UI는 미연결. 입장 처리에서 확정한 참가자 ID로만 발급해야 함.

- 2026-11-23 E2 요청 접근 검증 처리기 구현: `request-handler.ts`가 POST JSON·출처·본문 크기·인증 결과·사람 참가/생존·대상 NPC·예상 단계/라운드를 검사한 뒤 공유 조정기에 전달. 응답 직전 세션·게임 재검사, 참가자별 요청 ID 분리, 오류·응답 필드 제한. 18개 신규 테스트 포함 전체 103개. 실제 로그인 검증 함수·서버 게임/영속 저장소·Next 공개 라우트·UI는 미연결.

- 2026-11-22 레이아웃 수정: 그리드 상단 정렬·최소 너비, 로그 내부 자동 스크롤, 모바일 상단 줄바꿈·사이드바 스크롤/닫기·결과 버튼 배치 보완. 네이티브 Chrome으로 320·400·640·1024px 및 데스크톱 화면 확인. 6인 경찰·4인 마피아 두 판 종료, 밤 선택·생존/탈락 후 진행·채팅·심문·투표·결과·로그 모달·새 게임 확인. 실제 모바일 기기·청음·연속 클릭·새로고침 검증은 남음.

- 2026-11-20 선택형 OpenAI HTTP 어댑터 구현: `openai-provider.ts`가 입력 토큰 조회 → 예산 예약 → Responses 생성 → 구조화 응답 검사를 연결. 키 미설정 시 비활성, 모델은 명시 설정. 모의 HTTP 테스트 14개 추가, 전체 85개. 실제 키·모델·단가·예산·운영 공급자 확정 및 실호출 검증은 미완료.
- 서버용 환경 변수 이름 `OPENAI_API_KEY`·`OPENAI_DIALOGUE_MODEL`을 `.env.example`에 빈 값으로 추가. 자동으로 읽거나 호출하는 공개 API·UI는 아직 없으므로 설정만으로 게임에 AI가 켜지지 않음. 인증·영속 요청/예산 저장소·서버 API·UI를 다음으로 연결해야 함.

- 2026-11-19 E2 공통 호출 경로 구현: `src/server/dialogue/metered-provider.ts`로 대사 조정기·예산·준비/생성 함수를 연결. 계산 전후 현재 단계 확인, 취소·시간 초과 후 지연 생성 차단, 새 예약만 생성하고 출력 토큰 상한 전달. 연결 테스트 13개 추가, 전체 71개. 실제 공급자·인증·영속 저장소·공개 API·UI는 미연결.
- 공급자 선택 질문에는 아직 답변 없음. 첫 구현 선택지로 OpenAI 어댑터를 추가했으나 운영 공급자·모델·단가·예산은 미확정. API 키는 채팅·브라우저에 넣지 않고 실제 연동 시 서버 환경 변수로 설정.

- 2026-11-18 E1 완료: `dialogue/budget.ts`에 공급자 중립 게임별 예산 예약 장부 추가. 전체 입력·출력 최대 비용을 정수 마이크로달러로 예약하고 중복·충돌·토큰·요청 수·금액 상한을 검사. 10개 신규 테스트 포함 전체 58개 통과. E2 서버 래퍼로 조정기와 연결 가능하며 공개 API·UI는 미연결.
- E2에서 공급자·운영 예산·단가·토크나이저를 선정하고 인증·영속 요청/예산 저장소·출력 제한과 연결해야 함. 메모리 예약 장부는 실제 청구액이나 다중 프로세스 원자성을 보장하지 않음.

- 2026-11-17 작업 D 완료: `dialogue/`에 최소 NPC 입력·공급자 계약·중복/시간 제한/취소/단일 소비 조정기 추가. 가짜 공급자는 테스트에만 있으며 현재 게임 훅에는 연결하지 않음. 게임 버전 v1.2.7 유지.
- 호출자는 게임당 인스턴스를 만들고 `request` 완료 후 `claim`한 결과만 게시해야 함. 새 게임·종료 시 `dispose`, 단계 변경 시 최신 상태 검사와 취소 필요. 상세 계약은 `docs-site/docs/dialogue-adapter.md`.
- D는 외부 API·키·공급자·실제 금액 예산·서버 인증을 포함하지 않음. 내부 중복 제어는 한 프로세스·게임 인스턴스 범위.

- v1.2.7: `engine/view.ts`에서 참가자별 상태·개인 로그 투영. 렌더러에는 `VisiblePlayer`/`RevealedPlayer`만 전달. 원본 전체 상태는 솔로 브라우저 메모리에 유지되며 서버 인증은 아직 없음.
- 새 완료 기록은 본인에게 보이는 메시지·최종 공개 역할만 저장. 기존 로컬 기록은 소급 분류하지 않으며 멀티 공용 로그로 재사용 금지.
- 비공개 역할로 밤 선택지 필터링하지 않음. 부적합한 선택은 본인에게 일반 오류로 안내. 행동 성공·실패를 통한 추론은 여전히 가능.

- v1.2.6: 밤·투표 전체 판정을 `engine/resolve.ts`로 분리. 훅은 NPC 결정·메시지·보상을 연결. 단계별 중복 실행 차단 및 마지막 단계 로그 보존.
- 규칙·진행도·판정 테스트 25개. 엔진 단계 흐름과 Chrome 두 판 진행은 확인. 연속 클릭·새로고침 점검은 남아 있음.

- v1.2.5: 순수 `engine/rules.ts`와 내부 상태·대상 명령 타입 추가. 훅과 UI에서 역할 구성·승패·대상 검증 공유.
- 탈락자 행동·투표를 제외하고 NPC 결과만 진행. 검증은 TypeScript 내부 호출용이며 외부 요청 스키마·인증·동시성 제어는 후속 단계.

- NPC dialogue is rule-based, not LLM-generated.
- No production chat-platform adapter yet.

## Development Environment

- 사용자 작업 규칙의 원본은 `AGENTS.md`: 독립적인 기능·버그 수정·도구·문서는 작업 의도별 분할 커밋, 모든 설명용 코드·설정 주석은 한국어. 도구 지시문·식별자 문법은 유지.
- 커밋 분할·메시지는 `npm run commit`의 자동 분석에 맡기며, 직접 `COMMIT_PLAN`을 주입하지 않음. 분할 지침은 커밋 스크립트의 분석 프롬프트에도 반영.

- 2026-11-16 Git 신원 복구: 이 저장소 로컬 설정은 `King <79718172+Gyuung@users.noreply.github.com>`, `user.useConfigOnly=true`. GitHub 로그인과 별개이며 다른 PC나 새 clone에는 별도 설정 필요.
- 잘못된 맥 이메일의 15개 커밋은 내용·날짜 보존 후 ID 변경 및 원격 반영(`bd329e2` → `6b031ae`). 복구 전 이력은 로컬 `backup/identity-before-20261116`에 보관. 다른 체크아웃의 미저장 작업을 먼저 보존하고 새 이력과 동기화할 것.

- macOS(MacBook)와 Windows에서 작업 가능하도록 `AGENTS.md`의 스킬 탐색 경로를 환경 독립적으로 변경했습니다.
- Vercel React Best Practices는 `react-best-practices` 이름으로도 제공됩니다. 현재 세션 목록과 숨김 플러그인 디렉터리까지 확인하세요.
- macOS 초기 설정은 `README.md` 참고: `.nvmrc`의 Node 22 선택 후 루트와 `docs-site/` 각각 `npm ci` 실행.
- 기본 Node는 v24.10.0입니다. 2026-11-10에는 npm 임시 Node v22.22.3 환경에서 `npm run verify`를 통과했고, 문서 빌드도 통과했습니다. 지속적인 개발에는 README에 따라 Node 22를 선택하세요.

## Next Session TODO

1. Sound effects implemented with original synthesized WAV assets. Next: manually check audio playback on desktop/mobile browsers.
2. v2 작업 A~D 코드·테스트 완료. E1 예산 예약, E2의 조정기·예산 공통 호출 경로, 선택형 OpenAI HTTP 어댑터 및 요청 접근 검증 처리기 완료. 다음은 참가자 세션 모듈에 영속 저장소·서버 입장 처리와 구현된 로그아웃 HTTP 처리기의 공개 라우트를 연결하고, E2의 권위 있는 서버 게임/영속 요청·예산 저장소를 요청 처리기에 연결하고 운영 설정·실제 검증·공개 라우트·UI 연결, F(혼합 방). B·C 기본 흐름은 Chrome 두 판으로 확인했으며 추가 경계·재시작 점검은 남음. 공급자·인프라는 미선정. 검증 명령은 Node 22에서 `node --import tsx --test tests/*.test.ts` (117개).
3. Visual Polish: 역할 카드 공개 애니메이션과 결과 화면 마지막 투표 집계 시각화 완료. 동작 줄이기 설정을 게임 전체 연출·자동 스크롤에 적용. 네이티브 Chrome 데스크톱·반응형 화면 검증 완료. 실제 모바일 기기·청음은 후속 점검.
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
