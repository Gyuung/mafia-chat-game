const gameFlow = [
  ["01", "카카오톡 챗봇으로 게임방 생성"],
  ["02", "참가자 입장 후 자동 직업 배정"],
  ["03", "낮/밤 라운드와 투표 진행"],
  ["04", "결과 요약과 재시작 안내"],
];

export default function Home() {
  return (
    <main className="min-h-screen bg-neutral-950 text-neutral-50">
      <section className="mx-auto flex min-h-screen w-full max-w-6xl flex-col justify-between px-6 py-8 sm:px-10 lg:px-12">
        <header className="flex items-center justify-between gap-4">
          <p className="text-sm font-semibold text-red-300">
            KAKAO CHATBOT BETA
          </p>
          <p className="border border-neutral-700 px-3 py-1 text-xs text-neutral-300">
            Next.js App Router
          </p>
        </header>

        <div className="grid gap-10 py-16 lg:grid-cols-[1.1fr_0.9fr] lg:items-end">
          <div className="max-w-3xl">
            <p className="mb-5 text-base font-medium text-red-300">
              카카오톡에서 바로 시작하는 사회자 자동 진행 마피아 게임
            </p>
            <h1 className="text-5xl font-bold leading-tight text-white sm:text-6xl lg:text-7xl">
              Mafia Chat Game
            </h1>
            <p className="mt-6 max-w-2xl text-lg leading-8 text-neutral-300">
              방 생성, 초대, 직업 배정, 낮 토론, 밤 행동, 투표 결과까지 챗봇
              흐름에 맞춰 설계하는 모바일 우선 소셜 추리 게임입니다.
            </p>
          </div>

          <div className="grid gap-3">
            {gameFlow.map(([step, label]) => (
              <div
                className="flex items-center gap-4 border border-neutral-800 bg-neutral-900/80 p-4"
                key={step}
              >
                <span className="flex h-10 w-10 shrink-0 items-center justify-center bg-red-500 text-sm font-bold text-white">
                  {step}
                </span>
                <span className="text-base font-medium text-neutral-100">
                  {label}
                </span>
              </div>
            ))}
          </div>
        </div>

        <footer className="grid gap-4 border-t border-neutral-800 pt-6 text-sm text-neutral-400 sm:grid-cols-3">
          <p>입점 신청용 서비스 콘셉트 정리</p>
          <p>챗봇 webhook은 서버 route handler로 구현 예정</p>
          <p>비밀 키는 환경 변수로만 관리</p>
        </footer>
      </section>
    </main>
  );
}
