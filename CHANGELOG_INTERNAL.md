# Internal Development Log (기술적 변경 이력)

이 파일은 프로젝트의 기술적 진화 과정, 아키텍처 결정, 리팩토링 및 도구 최적화 내역을 상세히 기록합니다.

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
