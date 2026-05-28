"use client";

import { Phase } from "../types";

export function AmbientEffects({ phase }: { phase: Phase }) {
  if (phase === "night") {
    return (
      <>
        <div className="pointer-events-none fixed inset-0 z-[5] bg-[url('https://www.transparenttextures.com/patterns/fog.png')] opacity-20 animate-fog" />
        <div className="pointer-events-none fixed inset-0 z-[6]">
          <div className="absolute top-1/4 left-1/4 size-1 bg-yellow-200 rounded-full animate-fireflies opacity-0" />
          <div className="absolute top-1/3 left-2/3 size-1 bg-yellow-200 rounded-full animate-fireflies opacity-0 [animation-delay:1s]" />
          <div className="absolute top-2/3 left-1/2 h-1.5 w-1.5 bg-yellow-100 rounded-full animate-fireflies opacity-0 [animation-delay:2s]" />
          <div className="absolute top-1/2 left-1/5 size-1 bg-yellow-200 rounded-full animate-fireflies opacity-0 [animation-delay:1.5s]" />
        </div>
      </>
    );
  }

  if (phase === "day") {
    return (
      <>
        <div className="pointer-events-none fixed inset-0 z-[5] bg-blue-500/5 transition-colors duration-1000" />
        <div className="pointer-events-none fixed -top-20 -left-20 w-96 h-[800px] bg-white/10 blur-3xl animate-rays origin-top-left z-[6]" />
      </>
    );
  }

  return null;
}
