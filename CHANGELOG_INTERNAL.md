# Internal Development Log (기술적 변경 이력)

이 파일은 사용자에게 노출되지 않는 내부 코드 수정, 빌드 스크립트, CI/CD, 리팩토링 등의 기술적인 변경 사항을 기록합니다.

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

## 2026-05-18

### 초기 설정
- Next.js 16 + React 19 기반 프로젝트 스캐폴딩.
- Docusaurus 기반 문서 사이트 (`docs-site/`) 구축.
- 자동 커밋 스크립트 초기 버전 구현.
