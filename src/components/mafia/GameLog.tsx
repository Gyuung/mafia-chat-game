import { useEffect, useRef } from "react";
import { Message } from "./types";

export function GameLog({ messages }: { messages: Message[] }) {
  const logEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    logEndRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
  }, [messages.length]);

  return (
    <div className="min-h-80 border border-neutral-800 bg-neutral-950 p-5">
      <h2 className="text-xl font-semibold">진행 로그</h2>
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
