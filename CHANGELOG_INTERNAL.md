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

## 2026-05-18

### 초기 설정
- Next.js 16 + React 19 기반 프로젝트 스캐폴딩.
- Docusaurus 기반 문서 사이트 (`docs-site/`) 구축.
- 자동 커밋 스크립트 초기 버전 구현.
