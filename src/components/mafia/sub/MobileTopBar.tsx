"use client";

import { Phase } from "../types";

export function MobileTopBar({ 
  phase, 
  round, 
  overlayText, 
  docsUrl, 
  isSidebarOpen, 
  setIsSidebarOpen 
}: { 
  phase: Phase; 
  round: number; 
  overlayText: string; 
  docsUrl: string; 
  isSidebarOpen: boolean; 
  setIsSidebarOpen: (v: boolean) => void; 
}) {
  return (
    <div className="flex items-center justify-between border border-neutral-800 bg-neutral-900 p-4 lg:hidden relative z-20">
      <div className="flex items-center gap-4">
        <h1 className="text-xl font-bold text-white">Mafia Game</h1>
        <a className="text-[10px] text-neutral-400 hover:text-white underline underline-offset-4" href={docsUrl} rel="noreferrer" target="_blank">Docs</a>
      </div>
      <div className="flex items-center gap-3">
        <span className="bg-red-500 px-2 py-0.5 text-[10px] font-bold text-white uppercase tracking-tighter">
          {phase === "setup" ? "Standby" : `${round}R ${overlayText}`}
        </span>
        <button 
          className="text-neutral-400 hover:text-white"
          onClick={() => setIsSidebarOpen(!isSidebarOpen)}
          type="button"
          aria-label={isSidebarOpen ? "메뉴 닫기" : "메뉴 열기"}
        >
          {isSidebarOpen ? "✕ 닫기" : "☰ 메뉴"}
        </button>
      </div>
    </div>
  );
}
