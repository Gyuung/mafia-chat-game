import { useEffect, useRef } from "react";
import { Message, DialogueFeedback, VisiblePlayer } from "./types";

export function GameLog({ 
  messages, 
  submitDialogueFeedback,
  players 
}: { 
  messages: Message[];
  submitDialogueFeedback?: (f: Omit<DialogueFeedback, "timestamp">) => void;
  players: VisiblePlayer[];
}) {
  const logRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const log = logRef.current;
    log?.scrollTo({ top: log.scrollHeight, behavior: reduceMotion ? "instant" : "smooth" });
  }, [messages.length]);

  const handleFeedback = (message: Message, rating: "good" | "bad") => {
    if (!submitDialogueFeedback) return;
    const speaker = players.find(p => p.name === message.sender);
    submitDialogueFeedback({
      messageId: message.id,
      sender: message.sender,
      text: message.text,
      rating,
      personality: speaker?.personality,
    });
    alert("피드백이 저장되었습니다. 감사합니다!");
  };

  const handleExport = () => {
    if (messages.length === 0) return;
    
    const logText = messages
      .map((m) => `${m.personal ? "[나만 보기] " : ""}${m.system ? "[시스템] " : ""}${m.sender}: ${m.text}`)
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
      <div className="flex flex-wrap items-center justify-between gap-3">
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
      <div className="mt-4 grid max-h-[520px] gap-3 overflow-y-auto scroll-smooth" ref={logRef}>
        {messages.length === 0 ? (
          <p className="text-sm text-neutral-500">아직 메시지가 없습니다.</p>
        ) : (
          messages.map((message) => (
            <article
              className={`animate-fade-in-up group relative min-w-0 border p-3 ${
                message.system
                  ? "border-red-900 bg-red-950/30"
                  : "border-neutral-800 bg-neutral-900"
              }`}
              key={message.id}
            >
              <div className="flex items-center justify-between">
                <p className="text-xs font-semibold text-neutral-400">
                  {message.sender}
                  {message.personal && <span className="ml-2 text-red-300">나만 보기</span>}
                </p>
                {!message.system && players.find(p => p.name === message.sender && !p.human) && (
                  <div className="flex gap-2 opacity-0 transition-opacity group-hover:opacity-100">
                    <button 
                      className="text-[10px] text-neutral-500 hover:text-green-500" 
                      onClick={() => handleFeedback(message, "good")}
                      title="좋은 대사"
                      type="button"
                    >
                      👍
                    </button>
                    <button 
                      className="text-[10px] text-neutral-500 hover:text-red-500" 
                      onClick={() => handleFeedback(message, "bad")}
                      title="부자연스러운 대사"
                      type="button"
                    >
                      👎
                    </button>
                  </div>
                )}
              </div>
              <p className="mt-1 break-words text-sm leading-6 text-neutral-100">
                {message.text}
              </p>
            </article>
          ))
        )}
      </div>
    </div>
  );
}
