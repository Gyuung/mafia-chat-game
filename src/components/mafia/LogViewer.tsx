import { Message, Player } from "./types";
import { roleLabels } from "./constants";

export function LogViewer({ 
  messages, 
  players,
  onClose 
}: { 
  messages: Message[];
  players: Player[];
  onClose: () => void;
}) {
  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 p-4 backdrop-blur-sm">
      <div className="flex h-full max-h-[800px] w-full max-w-2xl flex-col border border-neutral-800 bg-neutral-950 shadow-2xl">
        <div className="flex items-center justify-between border-b border-neutral-800 p-4">
          <div className="flex items-center gap-3">
            <h2 className="text-xl font-bold text-white">게임 로그 기록</h2>
            <button 
              className="text-[10px] bg-neutral-800 px-2 py-1 text-neutral-400 hover:text-white border border-neutral-700 font-bold uppercase tracking-tighter"
              onClick={() => {
                const text = `
[마피아 채팅 게임 - 사건 수사 기록]
종료 시각: ${new Date().toLocaleString()}

■ 참가자 역할 정보:
${players.map(p => `- ${p.name}: ${roleLabels[p.role]} ${p.human ? "(나)" : ""} (${p.alive ? "생존" : "탈락"})`).join("\n")}

■ 진행 메시지:
${messages.map(m => `[${m.sender}] ${m.text}`).join("\n")}

#마피아게임 #수사기록
                `.trim();
                const blob = new Blob([text], { type: "text/plain" });
                const url = URL.createObjectURL(blob);
                const a = document.createElement("a");
                a.href = url;
                a.download = `mafia-log-${new Date().getTime()}.txt`;
                a.click();
                URL.revokeObjectURL(url);
              }}
              type="button"
            >
              📥 로그 다운로드
            </button>
          </div>
          <button 
            className="text-neutral-500 hover:text-white" 
            onClick={onClose}
            type="button"
          >
            <CloseIcon />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-4">
          <section className="mb-6">
            <h3 className="mb-3 text-sm font-semibold text-neutral-400">참가자 역할 정보</h3>
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
              {players.map((p) => (
                <div 
                  className={`border px-3 py-2 text-xs ${
                    p.role === "mafia" ? "border-red-900 bg-red-950/20" : "border-neutral-800 bg-neutral-900"
                  }`} 
                  key={p.id}
                >
                  <div className="flex items-center justify-between">
                    <span className="font-medium text-white">{p.name}</span>
                    <span className={p.alive ? "text-blue-400" : "text-neutral-500"}>
                      {p.alive ? "생존" : "탈락"}
                    </span>
                  </div>
                  <div className="mt-1 text-neutral-400">
                    {roleLabels[p.role]} {p.human && "(나)"}
                  </div>
                </div>
              ))}
            </div>
          </section>

          <section>
            <h3 className="mb-3 text-sm font-semibold text-neutral-400">진행 메시지</h3>
            <div className="grid gap-3">
              {messages.map((m) => (
                <article
                  className={`border p-3 ${
                    m.system
                      ? "border-red-900 bg-red-950/30"
                      : "border-neutral-800 bg-neutral-900"
                  }`}
                  key={m.id}
                >
                  <p className="text-xs font-semibold text-neutral-400">
                    {m.sender}
                  </p>
                  <p className="mt-1 text-sm leading-6 text-neutral-100">
                    {m.text}
                  </p>
                </article>
              ))}
            </div>
          </section>
        </div>

        <div className="border-t border-neutral-800 p-4">
          <button 
            className="w-full bg-neutral-100 py-3 text-sm font-bold text-neutral-950 hover:bg-white"
            onClick={onClose}
            type="button"
          >
            닫기
          </button>
        </div>
      </div>
    </div>
  );
}

function CloseIcon() {
  return (
    <svg 
      className="h-6 w-6" 
      fill="none" 
      stroke="currentColor" 
      strokeWidth={2} 
      viewBox="0 0 24 24" 
      xmlns="http://www.w3.org/2000/svg"
    >
      <path d="M6 18L18 6M6 6l12 12" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}
