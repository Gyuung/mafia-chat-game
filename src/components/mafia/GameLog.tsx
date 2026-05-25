import { useEffect, useRef } from "react";
import { Message } from "./types";

export function GameLog({ messages }: { messages: Message[] }) {
  const logEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    logEndRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
  }, [messages.length]);

  const handleExport = () => {
    if (messages.length === 0) return;
    
    const logText = messages
      .map((m) => `${m.system ? "[시스템] " : ""}${m.sender}: ${m.text}`)
      .join("\n");
    
    const blob = new Blob([logText], { type: "text/plain;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    const dateStr = new Date().toISOString().split("T")[0];
    const timeStr = new Date().toLocaleTimeString("ko-KR", { hour12: false }).replace(/:/g, "");
    
    link.href = url;
    link.download = `mafia_log_${dateStr}_${timeStr}.txt`;
    link.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="min-h-80 border border-neutral-800 bg-neutral-950 p-5">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold">진행 로그</h2>
        <button
          className="bg-neutral-800 px-3 py-1.5 text-xs font-medium text-neutral-300 hover:bg-neutral-700 disabled:opacity-50"
          disabled={messages.length === 0}
          onClick={handleExport}
          type="button"
        >
          로그 내보내기 (.txt)
        </button>
      </div>
      <div className="mt-4 grid max-h-[520px] gap-3 overflow-y-auto scroll-smooth">
        {messages.length === 0 ? (
          <p className="text-sm text-neutral-500">아직 메시지가 없습니다.</p>
        ) : (
          messages.map((message) => (
            <article
              className={`border p-3 ${
                message.system
                  ? "border-red-900 bg-red-950/30"
                  : "border-neutral-800 bg-neutral-900"
              }`}
              key={message.id}
            >
              <p className="text-xs font-semibold text-neutral-400">
                {message.sender}
              </p>
              <p className="mt-1 text-sm leading-6 text-neutral-100">
                {message.text}
              </p>
            </article>
          ))
        )}
        <div ref={logEndRef} />
      </div>
    </div>
  );
}
