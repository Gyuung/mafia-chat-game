"use client";

import { Dispatch, SetStateAction } from "react";

export function TutorialModal({ 
  tutorialStep, 
  setTutorialStep 
}: { 
  tutorialStep: number | null; 
  setTutorialStep: Dispatch<SetStateAction<number | null>>; 
}) {
  if (tutorialStep === null) return null;

  const tutorialSteps = [
    { title: "새 게임 설정", content: "이름과 인원, 난이도를 설정하고 게임을 시작하세요. 난이도가 높을수록 NPC들이 더 날카롭게 추리합니다.", target: "setup" },
    { title: "오늘의 사건", content: "매일 새로운 시나리오와 함께 추가 XP 보상을 받을 수 있는 특별 모드입니다.", target: "daily" },
    { title: "밤 행동", content: "각자의 역할에 맞는 비밀 행동을 수행합니다. 마피아는 시민을 제거하고, 경찰은 정체를 조사합니다.", target: "night" },
    { title: "낮 토론 및 심문", content: "생존자들과 대화하며 마피아를 추적하세요. '심문하기'를 통해 특정 참가자의 알리바이를 확인할 수 있습니다.", target: "day" },
    { title: "투표 및 결과", content: "가장 의심스러운 사람에게 투표하세요. 투표 결과에 따라 한 명의 탈락자가 결정됩니다.", target: "vote" },
  ];

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/90 p-4 backdrop-blur-sm">
      <div className="w-full max-w-md border border-neutral-800 bg-neutral-950 p-6 shadow-2xl">
        <div className="flex items-center justify-between">
          <span className="text-[10px] font-bold text-red-500 uppercase tracking-widest">Tutorial {tutorialStep + 1}/{tutorialSteps.length}</span>
          <button 
            className="text-neutral-500 hover:text-white" 
            onClick={() => setTutorialStep(null)}
            type="button"
            aria-label="튜토리얼 닫기"
          >
            ✕
          </button>
        </div>
        <h2 className="mt-4 text-2xl font-bold text-white">{tutorialSteps[tutorialStep].title}</h2>
        <p className="mt-4 text-sm leading-7 text-neutral-400">{tutorialSteps[tutorialStep].content}</p>
        <div className="mt-8 flex gap-3">
          <button 
            className="flex-1 border border-neutral-800 py-3 text-sm font-bold text-neutral-400 hover:bg-neutral-900"
            onClick={() => setTutorialStep(prev => prev !== null && prev > 0 ? prev - 1 : null)}
            type="button"
          >
            {tutorialStep === 0 ? "닫기" : "이전"}
          </button>
          <button 
            className="flex-[2] bg-red-600 py-3 text-sm font-bold text-white hover:bg-red-500"
            onClick={() => setTutorialStep(prev => prev !== null && prev < tutorialSteps.length - 1 ? prev + 1 : null)}
            type="button"
          >
            {tutorialStep < tutorialSteps.length - 1 ? "다음" : "시작하기"}
          </button>
        </div>
      </div>
    </div>
  );
}
