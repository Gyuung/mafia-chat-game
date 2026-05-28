# Codex Project Guide (프로젝트 가이드)

## Project (프로젝트 개요)

- 브라우저 기반의 마피아 소셜 추론 채팅 게임을 위한 Next.js App Router 애플리케이션입니다.
- 첫 화면은 랜딩 페이지가 아닌, 바로 플레이 가능한 게임 화면이어야 합니다.
- React 19와 Next.js 16을 기본 런타임으로 가정합니다.
- 사용자에게 노출되는 문구는 한국어를 원칙으로 합니다. 텍스트 정리 작업이 명시되지 않는 한 기존 문구와 인코딩을 유지하세요.

## Required Skill (필수 기술)

- 이 저장소의 React/Next.js 코드를 작성, 검토 또는 리팩토링할 때는 설치된 Codex 스킬인 `vercel-react-best-practices`를 사용하세요.
- 상세한 규칙 가이드는 `C:\Users\Wang\.codex\skills\react-best-practices\rules`의 관련 파일을 참조하세요.
- Vercel 규칙 우선순위: 폭포수(waterfalls) 제거, 번들 크기 최적화, 서버 측 성능, 클라이언트 측 데이터 페칭, 재렌더링 최적화, 렌더링 성능, JavaScript 성능, 고급 패턴 순입니다.

## React And Next.js Practices (권장 사례)

- 서버 컴포넌트(Server Components)를 선호합니다. 브라우저 API, 이벤트 핸들러, 상태(state), 이펙트(effects), refs 또는 클라이언트 전용 라이브러리가 필요한 경우에만 `"use client"`를 추가하세요.
- 클라이언트 컴포넌트의 props는 작고 직렬화 가능하게 유지하세요. 대규모 서버 데이터나 함수를 클라이언트 컴포넌트로 전달하지 마세요.
- 독립적인 비동기 작업은 일찍 시작하고 `Promise.all`을 사용하여 함께 기다리세요.
- 페이지, 레이아웃, 루트 핸들러 및 서버 유틸리티에서 요청 폭포수(request waterfalls)를 피하세요.
- 서버 측 사이드 이펙트는 루트 핸들러를 사용하고, 비밀 정보는 서버에 보관하세요.
- 구체적인 모듈에서 직접 임포트하세요. UI나 유틸리티 코드에 광범위한 배럴 임포트(barrel imports)를 사용하지 마세요.
- 첫 화면 렌더링에 필요하지 않은 무거운 클라이언트 전용 컴포넌트는 동적 임포트(dynamic import)를 사용하세요.
- 다른 컴포넌트 내부에서 React 컴포넌트를 정의하지 마세요.
- 가능한 경우 렌더링 중에 파생 상태를 계산하세요. 이펙트(effects)는 기본 파생이 아닌 외부 시스템과의 동기화에 사용하세요.
- 이전 상태에 의존하는 콜백의 경우 함수형 상태 업데이트를 사용하세요.
- 의존성 배열은 원시 값 위주로 안정적으로 유지하세요. 상수 배열, 객체, 정규식 및 기본 비원시 props는 컴포넌트 외부로 분리하세요.
- 시각적 자산은 가능한 경우 `next/image`, 명시적 크기 및 안정적인 레이아웃 제약 조건을 사용하세요.

## Vercel Deployment (Vercel 배포)

- `vercel.json`이 특별히 필요한 경우가 아니면 Vercel 프레임워크 자동 감지를 신뢰하세요.
- Node 런타임은 `package.json`의 `engines.node`에 따라 `22.x`로 고정됩니다. 로컬과 Vercel의 Node 버전을 일치시키세요.
- 필요한 환경 변수는 비밀 정보를 제외하고 `.env.example`에 반영되어야 합니다.
- `NEXT_PUBLIC_*` 변수는 공개 브라우저 입력값입니다. 절대 개인 키를 넣지 마세요.

## Validation (검증)

- 코드 변경을 마치기 전, 가장 관련성 높은 체크를 실행하세요.
- React/Next 변경 사항의 경우 시간이 허락한다면 `npm run verify`를 권장합니다.
- 문서만 수정하는 경우 빌드가 필요하지 않습니다.
- 실행할 수 없었던 체크 항목과 그 이유를 보고하세요.

## Session Continuation Protocol (세션 지속 프로토콜)

이 저장소에서 새로운 Codex 세션을 시작할 때:

1. 사용자가 계속하는 방법을 물으면 `CONTINUE.md`를 안내하세요.
2. `AGENTS.md`, `README.md`, `docs/SESSION_NOTES.md`, `docs-site/docs/changelog.md`를 읽으세요.
3. `git status --short`로 현재 git 상태를 확인하세요.
4. `git log --oneline -8`로 최근 작업 내역을 확인하세요.
5. 규칙, 로드맵 또는 변경 로그를 수정할 때는 `docs-site/docs/`의 문서 프론트엔드를 검사하세요.
6. `docs/SESSION_NOTES.md`의 `Next Session TODO` 섹션부터 시작하는 것을 선호합니다.
7. 모든 작업이 완료된 후, 혹은 주요 단계가 끝날 때마다 아래 두 파일을 반드시 업데이트해야 합니다:
    - **`docs/AGENT_WORK_LOG.md`**: 수행한 작업 내용과 절차를 날짜별로 기록 (작업 투명성 확보).
    - **`CHANGELOG_INTERNAL.md`**: 기술적 변경 사항, 아키텍처 리팩토링, 도구 도입 등을 기록 (기술 이력 관리).
8. 작업 세션을 마치기 전, 프로젝트 방향이나 다음 할 일, 알려진 이슈가 변경되었다면 `docs/SESSION_NOTES.md`를 업데이트하세요.
9. 앱 코드 변경 시 `npm run verify`, 문서 변경 시 `npm run docs:build`를 실행한 후, 사용자가 원격 저장을 원하면 `npm run commit`을 사용하여 커밋하고 `origin/main`으로 푸시하세요.

## Versioning & Docs (버전 관리 및 문서)

- 게임 관련 변경 사항만 `docs-site/docs/changelog.md`에 기록하세요.
- 게임과 무관한 변경(예: 빌드 스크립트, CI/CD, 내부 도구)은 변경 로그의 버전 업데이트를 트리거하지 않습니다.

## Git Workflow (Git 작업 흐름)

- 이 저장소에서 변경 사항을 커밋할 때는 `npm run commit`을 사용하세요.
- 모든 파일 수정 시 자동 커밋을 활성화하려면 `npm run commit:watch`를 사용하세요.
- 커밋과 푸시를 자동으로 하려면 `npm run commit:push`를 사용하세요.
- `shared/commit-script.ts`는 사용 가능한 AI CLI 도구(`gemini`, `codex`, `claude`, `ollama`, `gpt`)를 자동으로 감지합니다.
- 사용자가 명시적으로 요청하지 않는 한 `git commit -m`을 직접 사용하지 마세요.
- `npm run commit` 후에는 푸시 전 `git log -1 --oneline` 또는 `git status --short`로 결과를 확인하세요.
- 사용자가 커밋을 요청하면, 명시적인 거부 의사가 없는 한 성공 후 `origin/main`으로 푸시하세요.
- `next-env.d.ts`는 생성된 파일로 취급하며, 사용자가 요청하지 않는 한 커밋에 포함하지 마세요.

## Editing Rules (편집 규칙)

- 변경 범위는 요청된 기능이나 수정 사항으로 제한하세요.
- `.env.local`, 생성된 `.next` 출력물, `tsconfig.tsbuildinfo`를 수정하지 마세요.
- 명확한 이유와 잠금 파일 업데이트 없이 새로운 의존성을 추가하지 마세요.
