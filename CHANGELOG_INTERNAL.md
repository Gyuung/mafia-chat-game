# Internal Development Log (기술적 변경 이력)

이 파일은 사용자에게 노출되지 않는 내부 코드 수정, 빌드 스크립트, CI/CD, 리팩토링 등의 기술적인 변경 사항을 기록합니다.

## 2026-05-28

### 아키텍처 & 리팩토링
- **MafiaGame 컴포넌트 모듈화**: 434라인의 거대 컴포넌트를 기능별 서브 컴포넌트로 분리하여 구조적 부채 해결.
  - `src/components/mafia/sub/` 디렉토리에 `TutorialModal`, `Sidebar`, `SetupPanel`, `GameMain`, `PhaseOverlay`, `AmbientEffects`, `MobileTopBar`, `ActionSelect`로 분리 및 타입 안전성 확보.
- **상태 관리 최적화**: `useMafiaGame` 커스텀 훅 내 파생 상태(`alivePlayers`, `visibleTargets`)를 `useMemo`로 래핑하여 불필요한 재계산 방지.
- **코드 품질 관리 도구 도입**: `react-doctor`를 프로젝트에 통합하고 에이전트 전용 기술(`SKILL.md`)로 설정하여 지속적인 품질 측정 환경 구축.

### 성능 & 최적화
- **React Doctor 점수 100/100 달성**: 68개의 기술적 이슈를 모두 해결하여 최상의 성능 및 접근성 지표 확보.
- **Tailwind CSS 현대화**: 구식 `w-N h-N` 문법을 최신 `size-N` 축약어로 교체하고, 중복 패딩(`px-N py-N`)을 `p-N`으로 최적화.
- **비동기 성능 향상**: `shared/commit-script.ts` 내 순차적 비동기 호출을 `Promise.all`을 이용한 병렬 처리 방식으로 전환하여 실행 속도 대폭 개선.
- **JavaScript 런타임 최적화**: 불변성 유지를 위해 `[...array].sort()` 패턴을 ES2023 `toSorted()`로 대체.
- **배열 연산 효율화**: 중복 배열 순회를 방지하기 위해 `filter().map()` 체인을 `flatMap()` 또는 단일 루프로 통합 고려 기반 마련.

### 인프라 & 환경 설정
- **Node.js 버전 고정**: 최신 도구(`oxlint` 등)와의 호환성을 위해 Node.js를 `v22.22.3`으로 업데이트하고 `.nvmrc`를 통해 환경 일관성 유지.
- **SEO 및 메타데이터 강화**: Next.js 16 `Metadata` API를 적용하여 홈 페이지의 검색 엔진 최적화 수행.
- **Hydration 이슈 해결**: 서버-클라이언트 간 `new Date()` 불일치로 인한 Hydration 에러를 브라우저 전용 실행 컨텍스트로 격리하여 해결.

### 프로세스 & 기록
- **에이전트 작업 기록 시스템 도입**: `docs/AGENT_WORK_LOG.md`를 신설하고 `AGENTS.md`에 필수 기록 규칙을 추가하여 세션 간 작업 연속성 보장.

## 2026-05-26

### 기능 고도화 & 아키텍처
- **커리어 통계(Career Stats) 및 경험치 시스템**: 
  - `useMafiaGame.ts`에 XP 계산 공식(`calculateXp`) 및 레벨업 로직 구현.
  - `SavedProfile` 타입을 확장하여 누적 XP, 플레이 히스토리, 칭호 관리 기능 추가.
- **데이터 영속성(Persistence) 레이어**:
  - `localStorage`를 활용한 사용자 프로필 자동 저장/불러오기 로직 구현 (`PROFILE_STORAGE_KEY`).
  - 게임 종료 시마다 `PlayHistoryEntry`를 생성하여 최근 10개의 게임 로그 보존 처리.
- **성격 기반 추리 시스템(Tells) 확장**:
  - NPC별 성향(personalityTraits)에 따른 의심 수치 보정 및 투표 임계값(voteThreshold) 차등화.
  - 마피아 전용 심리적 단서(personalityMafiaTells) 템플릿 도입 및 확률적 노출 로직 구현.

### UI/UX & 시각 효과
- **환경 효과 동기화**: `Fog`, `Fireflies`, `Rays` 등 페이즈별 애니메이션의 성능 최적화 및 렌더링 타이밍 정밀 조정.
- **결과 리포트 시스템**: 
  - `ResultCard` 컴포넌트에 심문 횟수, 투표 정확도, 역할별 특수 액션 성공 지표(metrics) 추가.
  - 게임 로그를 텍스트 파일로 내려받는 `LogViewer` 다운로드 기능 구현.
- **모바일 대응 강화**: 
  - 모바일 해상도 전용 상단 바(`MobileTopBar`) 및 슬라이딩 사이드바 구조 도입.
  - `docs-site` 연결 링크 및 모바일 터치 타겟 최적화.

### 버그 수정 & 안정화
- **상태 업데이트 지연 문제 해결**: `finishStep`에서 비동기 `players` 상태에 의존하던 로직을 직접 계산 방식으로 변경하여 '마피아 검거' 수치 오류 수정.
- **Windows 호환성**: `commit-script.ts` 내 쉘 스크립트 실행 시 Windows 환경의 경로 및 인코딩 처리 보완.

## 2026-05-25

### CLI & 개발 도구
- **CLI 사용성 개선**: `allow-shell.toml` 정책 설정을 통해 쉘 명령어 실행 시 매번 발생하는 확인 절차를 자동 허용하도록 개선 (보안 및 편의성 균형).
- **AI 커밋 스크립트 (`shared/commit-script.ts`) 강화**: 
  - Windows 환경에서의 `chcp 65001` (UTF-8) 호환성 코드 추가.
  - 다양한 AI 엔진(gemini, codex, claude 등) 자동 감지 로직 개선.
  - `--watch` 모드 추가로 파일 수정 시 자동 커밋 기능 구현.

### 리팩토링 & 아키텍처
- **코드 구조 대규모 리팩토링**: `MafiaGame.tsx`에서 게임 로직과 UI를 분리하여 모듈화.
  - `src/components/mafia/` 하위에 `types.ts`, `constants.ts`, `useMafiaGame.ts`, `GameLog.tsx` 등으로 분리.
- **커밋 워크플로우 정립**: 작업별 원자적(atomic) 커밋 수행 및 `CHANGELOG_INTERNAL.md`를 통한 내부 이력 관리 체계 구축.

### 버그 수정 & 로직 최적화
- **마피아 역할 로직 수정**: 
  - 결과 카드 지표에서 '마피아 처단 성공'을 '밤 공격 성공'으로 용어 변경 (사용자 피드백 반영).
  - `useMafiaGame.ts`에서 마피아의 밤 공격 성공 시 지표가 정상적으로 증가하도록 로직 누락분 보완.
- **시각적 애니메이션 구현**:
  - `globals.css`에 `fade-in`, `fade-in-up`, `pulse-red` 키프레임 및 유틸리티 클래스 추가.
  - `GameLog` 메시지 등장 시 슬라이드 업 애니메이션 적용.
  - 단계 전환(Phase Transition) 오버레이에 애니메이션 및 밤 단계 한정 펄스 효과 적용.
- **탈락 이벤트 연출 구현**:
  - `types.ts`에 `GameEventType` 추가.
  - `useMafiaGame.ts`에서 탈락 발생 시 (`resolveNight`, `resolveVote`) 이벤트를 트리거하도록 수정.
  - `index.tsx`에서 이벤트를 감지하여 화면 흔들림(`animate-shake`) 및 선혈 효과 오버레이(`animate-blood-splatter`) 노출 로직 추가.
- **NPC 대화 피드백 시스템 구현**:
  - `types.ts`에 `DialogueFeedback` 타입 추가 및 `SavedProfile` 확장.
  - `useMafiaGame.ts`에 `submitDialogueFeedback` 함수 추가 (최근 100개 제한).
  - `GameLog.tsx`에 NPC 메시지별 좋아요/싫어요 버튼 및 호버 시 노출 로직 추가.
  - `index.tsx`에서 훅의 피드백 함수를 로그 컴포넌트로 전달하도록 연동.
- **모바일 반응성 및 UX 개선**:
  - `index.tsx` 레이아웃 구조 조정: 모바일 전용 상단 바 추가 및 `aside`를 좌측 접이식(Collapsible) 메뉴로 변경.
  - 화면 크기에 따른 버튼 및 입력창 크기 동적 조정 (터치 타겟 최적화).
  - 페이즈 전환 시 사이드바 자동 닫힘 로직 추가.
  - JSX 구조 결함 수정 및 빌드 안정성 확보.
- **게임 추리 메커니즘 고도화**:
  - `useMafiaGame.ts` 내 심문(`interrogateTarget`) 시 시민은 일관된 답변, 마피아는 확률적(30%)으로 진술 번복 또는 불안 증세 노출 로직 추가.
  - 일반 대화(`botDiscuss`) 중 마피아 전용 '방어적/불안' 대사 템플릿 삽입 로직 추가.
  - `index.tsx` 대기 단계에 추리 팁을 제공하는 '게임 가이드' 컴포넌트 추가.
- **버그 수정**:
  - `useMafiaGame.ts` 내 `finishStep`에서 비동기 상태 업데이트 지연으로 인해 '마피아 검거' 수치가 0으로 표시되던 문제 수정 (직접 계산 로직으로 변경).

## 2026-05-18

### 초기 설정
- Next.js 16 + React 19 기반 프로젝트 스캐폴딩.
- Docusaurus 기반 문서 사이트 (`docs-site/`) 구축.
- 자동 커밋 스크립트 초기 버전 구현.
