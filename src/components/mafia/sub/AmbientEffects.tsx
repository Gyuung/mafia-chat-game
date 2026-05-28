"use client";

import { Phase } from "../types";

// 불순한 Math.random()을 피하기 위해 정적 데이터 사용 (렌더링 순수성 유지)
const STATIC_RAIN_DROPS = [
  { left: "10%", top: "-5%", delay: "0.2s", duration: "0.5s" },
  { left: "25%", top: "-15%", delay: "0.5s", duration: "0.4s" },
  { left: "40%", top: "-10%", delay: "0.1s", duration: "0.6s" },
  { left: "55%", top: "-20%", delay: "0.8s", duration: "0.45s" },
  { left: "70%", top: "-5%", delay: "0.3s", duration: "0.55s" },
  { left: "85%", top: "-12%", delay: "1.2s", duration: "0.4s" },
  { left: "5%", top: "-18%", delay: "0.9s", duration: "0.65s" },
  { left: "95%", top: "-8%", delay: "0.4s", duration: "0.4s" },
  { left: "33%", top: "-14%", delay: "1.5s", duration: "0.5s" },
  { left: "66%", top: "-6%", delay: "0.7s", duration: "0.4s" },
  { left: "15%", top: "-11%", delay: "0.1s", duration: "0.6s" },
  { left: "45%", top: "-19%", delay: "1.8s", duration: "0.5s" },
  { left: "75%", top: "-4%", delay: "0.2s", duration: "0.4s" },
  { left: "20%", top: "-16%", delay: "0.6s", duration: "0.7s" },
  { left: "50%", top: "-9%", delay: "1.1s", duration: "0.45s" },
  { left: "80%", top: "-13%", delay: "0.5s", duration: "0.5s" },
  { left: "12%", top: "-17%", delay: "1.4s", duration: "0.4s" },
  { left: "38%", top: "-3%", delay: "0.3s", duration: "0.6s" },
  { left: "62%", top: "-10%", delay: "0.9s", duration: "0.5s" },
  { left: "88%", top: "-15%", delay: "0.4s", duration: "0.4s" },
];

const STATIC_FIREFLIES = [
  { top: "25%", left: "15%", delay: "0.5s", duration: "3.5s" },
  { top: "40%", left: "65%", delay: "1.2s", duration: "4.2s" },
  { top: "65%", left: "50%", delay: "2.5s", duration: "3.8s" },
  { top: "50%", left: "20%", delay: "0.1s", duration: "4.5s" },
  { top: "30%", left: "80%", delay: "3.2s", duration: "3.2s" },
  { top: "75%", left: "30%", delay: "1.8s", duration: "4.0s" },
  { top: "20%", left: "45%", delay: "0.8s", duration: "3.6s" },
  { top: "55%", left: "85%", delay: "2.1s", duration: "4.8s" },
];

const STATIC_DUST = [
  { top: "10%", left: "20%", delay: "1s" },
  { top: "30%", left: "80%", delay: "5s" },
  { top: "50%", left: "40%", delay: "2s" },
  { top: "70%", left: "10%", delay: "8s" },
  { top: "20%", left: "60%", delay: "3s" },
  { top: "85%", left: "90%", delay: "6s" },
  { top: "40%", left: "15%", delay: "4s" },
  { top: "60%", left: "75%", delay: "9s" },
  { top: "15%", left: "45%", delay: "0.5s" },
  { top: "90%", left: "30%", delay: "7s" },
  { top: "45%", left: "55%", delay: "1.5s" },
  { top: "75%", left: "65%", delay: "2.5s" },
];

export function AmbientEffects({ 
  phase,
  dailyCaseTitle
}: { 
  phase: Phase;
  dailyCaseTitle?: string;
}) {
  const isRainy = dailyCaseTitle?.includes("비") || dailyCaseTitle?.includes("항구");

  if (phase === "night") {
    return (
      <>
        {/* 안개 효과 */}
        <div className="pointer-events-none fixed inset-0 z-[5] bg-[url('https://www.transparenttextures.com/patterns/fog.png')] opacity-20 animate-fog" />
        
        {/* 비 효과 (특정 시나리오) */}
        {isRainy && (
          <div className="pointer-events-none fixed inset-0 z-[7] overflow-hidden">
            {STATIC_RAIN_DROPS.map((drop, i) => (
              <div 
                className="absolute w-[1px] h-10 bg-white/20 animate-rain" 
                key={i}
                style={{ 
                  left: drop.left, 
                  top: drop.top,
                  animationDelay: drop.delay,
                  animationDuration: drop.duration
                }} 
              />
            ))}
          </div>
        )}

        {/* 반딧불이 효과 강화 */}
        <div className="pointer-events-none fixed inset-0 z-[6]">
          {STATIC_FIREFLIES.map((fly, i) => (
            <div 
              className="absolute size-1 bg-yellow-200 rounded-full animate-fireflies opacity-0" 
              key={i}
              style={{ 
                top: fly.top, 
                left: fly.left,
                animationDelay: fly.delay,
                animationDuration: fly.duration
              }} 
            />
          ))}
        </div>

        {/* 비네트 효과 */}
        <div className="pointer-events-none fixed inset-0 z-[8] shadow-[inset_0_0_150px_rgba(0,0,0,0.5)]" />
      </>
    );
  }

  if (phase === "day") {
    return (
      <>
        <div className="pointer-events-none fixed inset-0 z-[5] bg-blue-500/5 transition-colors duration-1000" />
        
        {/* 먼지/빛가루 효과 */}
        <div className="pointer-events-none fixed inset-0 z-[6]">
          {STATIC_DUST.map((dust, i) => (
            <div 
              className="absolute size-1 bg-white/30 rounded-full animate-dust opacity-0" 
              key={i}
              style={{ 
                top: dust.top, 
                left: dust.left,
                animationDelay: dust.delay
              }} 
            />
          ))}
        </div>

        {/* 빛내림 효과 */}
        <div className="pointer-events-none fixed -top-20 -left-20 w-96 h-[800px] bg-white/10 blur-3xl animate-rays origin-top-left z-[7]" />
        
        {/* 비 효과 (낮에도 비가 올 수 있음) */}
        {isRainy && (
          <div className="pointer-events-none fixed inset-0 z-[8] overflow-hidden">
            {STATIC_RAIN_DROPS.slice(0, 15).map((drop, i) => (
              <div 
                className="absolute w-[1px] h-10 bg-white/10 animate-rain" 
                key={i}
                style={{ 
                  left: drop.left, 
                  top: drop.top,
                  animationDelay: drop.delay,
                  animationDuration: drop.duration
                }} 
              />
            ))}
          </div>
        )}
      </>
    );
  }

  return null;
}
