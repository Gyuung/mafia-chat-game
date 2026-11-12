# Internal Development Log (기술적 변경 이력)

## 2026-11-12

### 업적 진행도와 결과 판정 연결 복구

- `results.ts`로 내 역할 기준 승패 판정 통일. 업적·통계·결과 공유에 적용.
- `progression.ts`로 업적 판정·프로필 갱신 분리. 저장된 업적 및 대사 피드백 유지, 신규 업적 알림은 이벤트 핸들러에서 생성.
- 프로필에 선택적 `mafiaCaughtTotal` 추가. 기존 최근 기록에서 초기값 복원 후 기록 보관 한도와 별개로 누적.
- 피득표 여부를 게임 전체에서 추적하고 종료 행동 수치를 즉시 반영하여 업적 오판정 방지.
- 새 의존성 없이 Node 테스트 러너와 기존 tsx로 진행도 회귀 테스트 추가.

- 검증: Node v22.22.3 회귀 테스트 6개, `npm run verify`, `npm run docs:build` 통과. React Doctor 변경된 기존 파일 6개 100/100. 실제 브라우저 검증은 미실시.

### 게임 전체 동작 줄이기 지원

- 게임 루트에 범위 클래스를 추가하고 prefers-reduced-motion에서 애니메이션·전환·부드러운 스크롤을 중지.
- 비·안개·빛·먼지·반딧불이·탈락 장식을 숨겨 정지 잔상 방지. 역할 카드와 득표 막대는 즉시 표시.
- GameLog의 명시적 smooth 스크롤도 matchMedia 확인 후 instant로 전환.
- 실제 브라우저 검증은 호스트 연결 불가로 미완료. 데스크톱/모바일 청음 및 화면 점검은 후속 TODO 유지.

- 검증: Node v22.22.3에서 `npm run verify` 통과(샌드박스 포트 제한 후 권한 허용 재실행), `npm run docs:build` 통과, React Doctor 변경 파일 2개 100/100, diff 공백 검사 통과.

## 2026-11-11

### 역할 공개 및 최종 투표 집계 표현

- `Sidebar` 역할 카드에 CSS perspective/rotateY 공개 효과 추가.
- `ResultCard`의 기존 voteRecords를 정렬하고 총 득표 대비 막대 및 접근성 meter 추가. 공동 최다 득표 모두 표시.
- 신규 애니메이션은 prefers-reduced-motion에서 생략. 역할 썸네일 sizes 및 한국어 대체 텍스트 보완.
- 게임 규칙과 저장 데이터 구조 변경 없음.

이 파일은 프로젝트의 기술적 진화 과정, 아키텍처 결정, 리팩토링 및 도구 최적화 내역을 상세히 기록합니다.

- 검증: Node v22.22.3에서 `npm run verify` 통과, `npm run docs:build` 통과, React Doctor 변경 파일 2개 100/100. CRLF를 고려한 diff 공백 검사 통과. 실제 브라우저 시각 확인과 효과음 청음은 미실시.

## 2026-11-10

### 선택형 게임 효과음

- `SoundControl`에서 단계/탈락 이벤트를 구독하고 HTML Audio로 짧은 효과음 재생.
- 오디오 DOM ref로 재생기를 재사용하며 사용자 클릭으로 재생 허용. 실패 시 게임 흐름 유지, 숨겨진 탭에서는 새 효과음 생략.
- `public/sounds/`에 직접 합성한 모노 PCM WAV 5종 추가. 설정은 세션 내 유지하며 기본 꺼짐.

- 검증: Node v22.22.3 `npm run verify`, `npm run docs:build`, React Doctor 전체 29개 파일 100/100, 오디오 이벤트 분기 테스트 및 WAV 포맷 검사 통과. 실제 브라우저 청음은 미실시.

## 2026-11-09

### 개발 환경 이식성

- `AGENTS.md`: macOS/Windows 공통 경로 규칙과 Vercel React 스킬 이름·탐색 방법 명시.
- `README.md`: nvm 기반 MacBook 설정 및 루트/문서 의존성 개별 설치 안내.
- 게임 동작 변경이 없어 게임 버전과 공개 게임 변경 이력은 유지.
- 검증: 문서 의존성을 잠금 파일 기준으로 설치한 뒤 `npm run docs:build` 통과(Node v24.10.0). 앱 코드 변경이 없어 `npm run verify`는 실행하지 않음.

### 에이전트 작업 이력 표기

- Codex가 `AGENT_WORK_LOG.md`의 Gemini CLI 전용 설명을 공통 에이전트 기록으로 수정하고, 신규 작업의 수행 주체 표기 규칙을 추가.

### 문서 사이트 환경 변수 경계 수정

- `docusaurus.config.ts`에서 읽은 `APP_URL`을 `customFields`로 전달하고 홈에서 컨텍스트로 사용.
- 브라우저의 Node.js `process` 전역 의존을 제거하며 내비게이션과 동일한 게임 URL 사용.
- 검증: 문서 타입 검사·빌드, React Doctor 100/100, `process` 없는 VM에서 홈 모듈 및 사용자 지정/기본 게임 URL 확인 통과. 앱 린트·타입 검사 통과, 앱 빌드는 샌드박스 포트 제한으로 실패 후 권한 허용 재실행으로 통과.

## 2026-05-28

### 기능 구현 & UX
- **업적(Achievements) 시스템 구현**:
  - `types.ts`: `Achievement`, `SavedAchievement` 타입 추가.
  - `constants.ts`: 10종 고유 업적 정의 및 조건식(condition) 할당.
  - `useMafiaGame.ts`: 게임 종료 시 상태 기반 자동 해금 로직 및 `localStorage` 갱신.
  - `CareerStats.tsx`: 업적 뱃지 및 설명 툴팁 렌더링.
- **환경 효과(Ambient Effects) 고도화**:
  - `globals.css`: 비(`rain`), 먼지(`dust`) 애니메이션 추가.
  - `AmbientEffects.tsx`: 시나리오별 비 연출, 안개 및 비네트, 순수성(Purity)을 보장하기 위한 정적 좌표 데이터 사용.
- **오늘의 사건 확장**:
  - `constants.ts`: 고난이도를 포함한 5종의 신규 시나리오 추가 (총 14종).

### 아키텍처 & 리팩토링
- **MafiaGame 컴포넌트 전면 리팩토링**:
  - `src/components/MafiaGame.tsx`의 430+ 라인 코드를 기능 단위로 분리하여 `src/components/mafia/sub/`에 모듈화.
  - 분리된 컴포넌트: `ActionSelect`, `AmbientEffects`, `GameMain`, `MobileTopBar`, `PhaseOverlay`, `SetupPanel`, `Sidebar`, `TutorialModal`.
  - 메인 컴포넌트(`MafiaGame`)는 이제 비즈니스 로직(Hook)과 레이아웃 배치에만 집중.
- **성능 최적화 및 안정성**:
  - `Promise.all` 적용: 초기 데이터 로드 및 프로필 처리 시 비동기 작업 병렬화.
  - `React Doctor` 진단 결과 반영: `Hydration` 불일치 에러 해결을 위해 `new Date()` 호출 시점 및 서버/클라이언트 렌더링 값 동기화.
  - Tailwind CSS 4 단축 문법(`size-*`, `inset-*` 등) 일괄 적용으로 스타일 코드 경량화.

### 인프라 및 환경 설정
- **Node.js 런타임 고정**: `react-doctor` 호환성(v22.12.0 이상 필요)을 위해 `.nvmrc`에 `v22.22.3` 명시.
- **기록 체계 수립**: `AGENTS.md`에 작업 로그 기록 의무화 규칙 추가 및 `AGENT_WORK_LOG.md` 생성.

## 2026-05-27

### UI/UX 고도화 기술
- **수사 경력 통계 엔진**:
  - `localStorage`의 `history` 배열을 리듀싱하여 승률, 역할별 수행 횟수, 평균 생존 라운드를 계산하는 고성능 통계 로직 구현.
  - 통계 데이터를 차트나 프로그레스 바로 시각화하기 위한 UI 컴포넌트(`CareerStats.tsx`) 개발.
- **인게임 튜토리얼 시스템**:
  - `tutorialStep` 상태를 기반으로 UI의 특정 영역을 하이라이트하거나 가이드 모달을 띄우는 인터랙티브 워크플로우 구현.

### 게임 로직 심화
- **성격 기반 마피아 단서(Tells)**:
  - 마피아인 NPC가 특정 성격(예: '냉소파')일 때 질문에 대해 회피하거나 공격적으로 변하는 텍스트 패턴 매핑 로직 강화.

## 2026-05-26

### 인프라 및 도구
- **커밋 스크립트 최적화**:
  - Windows PowerShell 환경에서 발생하는 경로 구분자(`\`) 및 인자 쿼팅(`""`) 이슈 해결을 위해 `shared/commit-script.ts` 로직 보완.
- **로그 시스템 아키텍처**:
  - 게임 종료 후에도 전체 발언 내역을 복기할 수 있도록 `PlayHistoryEntry` 타입 내에 `Message[]` 객체를 통째로 보존하는 구조 설계.

## 2026-05-25

### 시스템 설계 (v1.0.0 기반)
- **NPC 성격 유형 시스템**: 
  - `personalityTraits` 객체 도입. `voteThreshold`(투표 결정 임계값), `dialogueStyles`(말투 패턴)를 정의하여 봇마다 다른 인격을 부여.
- **시각 효과 기술**: 
  - `animate-shake`(화면 흔들림) 및 `animate-blood-splatter`(빨간 오버레이)를 위한 전역 CSS 애니메이션 정의.
  - `navigator.clipboard` API를 이용한 결과 카드 복사 기능 및 이미지 내보내기 기초 연구.

## 2026-05-24

### 로직 최적화
- **신뢰도(`trust`) 알고리즘**:
  - NPC들이 서로에게 가진 호감도/신뢰도를 2차원 객체(`Record<string, number>`)로 관리하고, 투표 시 `suspicion` 점수와 합산하여 최종 타겟을 결정하도록 개선.

## 2026-05-23

### 디버깅
- **기술 로그 강화**: NPC가 특정 참가자에게 투표한 '이유'를 추론하기 위해 `VoteDecision` 인터페이스에 `reason` 필드 추가 및 시스템 메시지 노출.

## 2026-05-22

### 신규 모드 기술 구현
- **오늘의 사건(Daily Case)**: 
  - `todayKey`(날짜 문자열)를 시드로 사용하여 결정론적(Deterministic) 랜덤 시나리오를 선택하는 유틸리티 함수 구현.
  - `dailyCases` 배열 내 시나리오별 난이도(`isHard`) 및 경험치 가중치 설정.

## 2026-05-21

### 데이터 레이어 기초
- **데이터 영속성**: `localStorage` 추상화 레이어를 통해 `xp`, `level`, `history` 데이터를 안전하게 JSON 직렬화/역직렬화 처리.

## 2026-05-18

### 초기 아키텍처 수립
- Next.js 16 + React 19(Canary) + TypeScript 기반 프로젝트 구조 설계.
- Docusaurus 기반 문서 자동화 사이트(`docs-site/`) 인프라 구축.
- 원자적(Atomic) 커밋을 유도하는 커스텀 `shared/commit-script.ts` 초기 구현.
