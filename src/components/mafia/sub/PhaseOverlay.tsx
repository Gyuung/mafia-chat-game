"use client";

export function PhaseOverlay({ 
  showOverlay, 
  phase, 
  overlayText, 
  round 
}: { 
  showOverlay: boolean; 
  phase: string; 
  overlayText: string; 
  round: number; 
}) {
  if (!showOverlay) return null;

  return (
    <div className="animate-fade-in fixed inset-0 z-50 flex flex-col items-center justify-center bg-black/80 backdrop-blur-md transition-all duration-500">
      <div className={`flex flex-col items-center p-8 sm:p-12 ${phase === "night" ? "animate-pulse-red border border-red-500/30 bg-red-950/20" : ""}`}>
        <p className="text-[10px] font-bold tracking-[0.3em] text-red-500 underline underline-offset-8 sm:text-sm">PHASE TRANSITION</p>
        <h2 className="mt-8 text-5xl font-black text-white tracking-widest sm:text-9xl uppercase">
          {overlayText}
        </h2>
        <p className="mt-6 text-sm font-medium text-neutral-300 sm:text-xl">
          {round}라운드 {overlayText === "밤" ? "비밀스러운 행동의 시간" : "진실을 밝히는 토론의 시간"}
        </p>
      </div>
    </div>
  );
}
