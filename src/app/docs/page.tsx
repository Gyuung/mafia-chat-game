import Link from "next/link";

const changelog = [
  {
    version: "0.4.0",
    date: "2026-05-18",
    items: [
      "낮 심문 기능 추가",
      "역할별 카드 이미지 추가",
      "진행 로그 자동 스크롤 적용",
      "사용하지 않는 기본 이미지 정리",
    ],
  },
  {
    version: "0.3.0",
    date: "2026-05-18",
    items: [
      "솔로 플레이와 가상 참가자 구조 추가",
      "내 역할만 공개하고 다른 역할은 종료 후 공개",
      "가상 참가자 자동 발언과 투표 로직 추가",
    ],
  },
  {
    version: "0.2.0",
    date: "2026-05-18",
    items: ["마피아 게임 라운드, 밤 행동, 낮 토론, 투표, 승패 판정 구현"],
  },
];

const rules = [
  {
    title: "목표",
    body: "시민 팀은 모든 마피아를 찾아내야 하고, 마피아 팀은 생존 마피아 수가 시민 수 이상이 되도록 만들어야 합니다.",
  },
  {
    title: "밤",
    body: "마피아는 제거 대상을 고르고, 의사는 보호 대상을 고르며, 경찰은 한 명을 조사합니다. 시민은 밤 행동이 없습니다.",
  },
  {
    title: "낮",
    body: "가상 참가자를 심문하고 채팅 로그를 보며 의심 대상을 좁힙니다. 마피아는 시민인 척 답변합니다.",
  },
  {
    title: "투표",
    body: "의심되는 참가자를 선택하면 가상 참가자들도 각자의 판단으로 투표합니다. 가장 많은 표를 받은 참가자가 탈락합니다.",
  },
];

const roadmap = [
  "XP, 레벨, 칭호 보상 시스템",
  "이모지 기반 결과 카드",
  "하루 1회 사건 모드",
  "결과 공유용 메시지 카드",
  "채팅 플랫폼용 응답 포맷 어댑터",
];

export default function DocsPage() {
  return (
    <main className="min-h-screen bg-neutral-950 text-neutral-100">
      <div className="mx-auto grid w-full max-w-7xl gap-8 px-5 py-8 lg:grid-cols-[260px_1fr]">
        <aside className="self-start border border-neutral-800 bg-neutral-900 p-5 lg:sticky lg:top-6">
          <Link className="text-sm text-red-300 hover:text-red-200" href="/">
            게임으로 돌아가기
          </Link>
          <h1 className="mt-5 text-2xl font-bold text-white">Docs</h1>
          <nav className="mt-6 grid gap-3 text-sm text-neutral-300">
            <a className="hover:text-white" href="#overview">
              개요
            </a>
            <a className="hover:text-white" href="#rules">
              게임 룰
            </a>
            <a className="hover:text-white" href="#changelog">
              변경이력
            </a>
            <a className="hover:text-white" href="#roadmap">
              로드맵
            </a>
          </nav>
        </aside>

        <section className="grid gap-8">
          <header id="overview" className="border border-neutral-800 bg-neutral-900 p-6">
            <p className="text-sm font-semibold text-red-300">Mafia Chat Game</p>
            <h2 className="mt-3 text-4xl font-bold text-white">프로젝트 문서</h2>
            <p className="mt-4 max-w-3xl leading-7 text-neutral-300">
              이 문서는 게임 룰, 변경이력, 향후 기능 방향을 버전별로 관리하기 위한
              내부 문서 프론트입니다. 현재는 Next.js 앱 안에서 운영하고, 문서가
              커지면 별도 문서 사이트로 분리할 수 있습니다.
            </p>
          </header>

          <section id="rules" className="border border-neutral-800 bg-neutral-900 p-6">
            <h2 className="text-2xl font-bold text-white">게임 룰</h2>
            <div className="mt-5 grid gap-4 md:grid-cols-2">
              {rules.map((rule) => (
                <article className="border border-neutral-800 bg-neutral-950 p-4" key={rule.title}>
                  <h3 className="font-semibold text-white">{rule.title}</h3>
                  <p className="mt-2 text-sm leading-6 text-neutral-400">{rule.body}</p>
                </article>
              ))}
            </div>
          </section>

          <section id="changelog" className="border border-neutral-800 bg-neutral-900 p-6">
            <h2 className="text-2xl font-bold text-white">변경이력</h2>
            <div className="mt-5 grid gap-4">
              {changelog.map((entry) => (
                <article className="border border-neutral-800 bg-neutral-950 p-4" key={entry.version}>
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <h3 className="text-lg font-semibold text-white">v{entry.version}</h3>
                    <time className="text-sm text-neutral-500">{entry.date}</time>
                  </div>
                  <ul className="mt-3 grid gap-2 text-sm text-neutral-300">
                    {entry.items.map((item) => (
                      <li key={item}>- {item}</li>
                    ))}
                  </ul>
                </article>
              ))}
            </div>
          </section>

          <section id="roadmap" className="border border-neutral-800 bg-neutral-900 p-6">
            <h2 className="text-2xl font-bold text-white">로드맵</h2>
            <ul className="mt-5 grid gap-3 text-neutral-300">
              {roadmap.map((item) => (
                <li className="border border-neutral-800 bg-neutral-950 p-4" key={item}>
                  {item}
                </li>
              ))}
            </ul>
          </section>
        </section>
      </div>
    </main>
  );
}
