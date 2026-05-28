"use client";

import { useState, useEffect } from "react";
import { useMafiaGame } from "./useMafiaGame";
import { Player, Phase, Difficulty, PlayHistoryEntry } from "./types";
import { LogViewer } from "./LogViewer";
import { CareerStats } from "./CareerStats";

// Sub-components
import { AmbientEffects } from "./sub/AmbientEffects";
import { MobileTopBar } from "./sub/MobileTopBar";
import { TutorialModal } from "./sub/TutorialModal";
import { Sidebar } from "./sub/Sidebar";
import { SetupPanel } from "./sub/SetupPanel";
import { GameMain } from "./sub/GameMain";
import { PhaseOverlay } from "./sub/PhaseOverlay";

export function MafiaGame() {
  const {
    phase, round, myName, setMyName, playerCount, setPlayerCount, players, alivePlayers,
    visibleTargets, messages, chatText, setChatText, questionTargetId, setQuestionTargetId,
    nightTargetId, setNightTargetId, voteTargetId, setVoteTargetId, winner,
    gameResultSummary, profile, todayKey, dailyCase, dailyRewardAvailable,
    me, level, currentLevelXp, lastEvent, resetEvent,
    submitDialogueFeedback,
    startGame, submitChat, interrogateTarget, resolveNight, startVote, resolveVote, resetGame
  } = useMafiaGame();

  const [setupDifficulty, setSetupDifficulty] = useState<Difficulty>("normal");
  const [showOverlay, setShowOverlay] = useState(false);
  const [isEliminating, setIsEliminating] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [viewingHistory, setViewingHistory] = useState<PlayHistoryEntry | null>(null);
  const [tutorialStep, setTutorialStep] = useState<number | null>(null);
  const [showStats, setShowStats] = useState(false);

  useEffect(() => {
    if (phase !== "setup") {
      requestAnimationFrame(() => setShowOverlay(true));
      const timer = setTimeout(() => setShowOverlay(false), 1500);
      return () => clearTimeout(timer);
    }
  }, [phase]);

  useEffect(() => {
    if (lastEvent === "elimination") {
      requestAnimationFrame(() => setIsEliminating(true));
      const timer = setTimeout(() => {
        setIsEliminating(false);
        resetEvent();
      }, 1000);
      return () => clearTimeout(timer);
    }
  }, [lastEvent, resetEvent]);

  useEffect(() => {
    requestAnimationFrame(() => setIsSidebarOpen(false));
  }, [phase]);

  const overlayText = getPhaseLabel(phase);
  const docsUrl = process.env.NEXT_PUBLIC_DOCS_URL ?? "http://localhost:3001";

  return (
    <section className={`mx-auto grid min-h-screen w-full max-w-7xl gap-6 px-4 py-5 text-neutral-100 sm:px-6 lg:grid-cols-[320px_1fr] lg:px-8 ${isEliminating ? "animate-shake" : ""} relative overflow-hidden`}>
      {isEliminating && (
        <div className="animate-blood-splatter fixed inset-0 z-[60] pointer-events-none bg-red-900/20 mix-blend-multiply" />
      )}

      <AmbientEffects phase={phase} />
      
      <MobileTopBar 
        docsUrl={docsUrl} 
        isSidebarOpen={isSidebarOpen} 
        overlayText={overlayText} 
        phase={phase} 
        round={round} 
        setIsSidebarOpen={setIsSidebarOpen} 
      />

      {phase === "setup" && (
        <button 
          className="fixed bottom-6 right-6 z-[80] flex h-14 w-14 items-center justify-center rounded-full bg-red-600 text-white shadow-2xl hover:scale-110 transition-transform active:scale-95"
          onClick={() => setTutorialStep(0)}
          title="도움말 보기"
          type="button"
        >
          <svg className="size-6" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
            <path d="M9.879 7.519c1.171-1.025 3.071-1.025 4.242 0 1.172 1.025 1.172 2.687 0 3.712-.203.179-.43.326-.67.442-.745.361-1.45.999-1.45 1.827v.75M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-9 5.25h.008v.008H12v-.008z" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </button>
      )}

      <TutorialModal setTutorialStep={setTutorialStep} tutorialStep={tutorialStep} />

      <PhaseOverlay overlayText={overlayText} phase={phase} round={round} showOverlay={showOverlay} />

      <Sidebar 
        alivePlayers={alivePlayers} 
        currentLevelXp={currentLevelXp} 
        docsUrl={docsUrl} 
        isSidebarOpen={isSidebarOpen} 
        level={level} 
        me={me} 
        myName={myName} 
        phase={phase} 
        playerCount={playerCount} 
        players={players} 
        profile={profile} 
        round={round} 
        setShowStats={setShowStats} 
        setViewingHistory={setViewingHistory} 
        winner={winner} 
      />

      <div className="grid gap-4">
        {phase === "setup" ? (
          <SetupPanel 
            dailyCase={dailyCase} 
            dailyRewardAvailable={dailyRewardAvailable} 
            myName={myName} 
            playerCount={playerCount} 
            setMyName={setMyName} 
            setPlayerCount={setPlayerCount} 
            setSetupDifficulty={setSetupDifficulty} 
            setupDifficulty={setupDifficulty} 
            startGame={startGame} 
            todayKey={todayKey} 
          />
        ) : (
          <GameMain 
            chatText={chatText} 
            gameResultSummary={gameResultSummary} 
            interrogateTarget={interrogateTarget} 
            level={level} 
            me={me} 
            messages={messages} 
            nightTargetId={nightTargetId} 
            phase={phase} 
            players={players} 
            questionTargetId={questionTargetId} 
            resetGame={resetGame} 
            resolveNight={resolveNight} 
            resolveVote={resolveVote} 
            round={round} 
            setChatText={setChatText} 
            setNightTargetId={setNightTargetId} 
            setQuestionTargetId={setQuestionTargetId} 
            setViewingHistory={setViewingHistory} 
            setVoteTargetId={setVoteTargetId} 
            startVote={startVote} 
            submitChat={submitChat} 
            submitDialogueFeedback={submitDialogueFeedback} 
            visibleTargets={visibleTargets} 
            voteTargetId={voteTargetId} 
            winner={winner} 
          />
        )}
      </div>

      {viewingHistory && (
        <LogViewer 
          messages={viewingHistory.messages || []} 
          onClose={() => setViewingHistory(null)} 
          players={viewingHistory.players || []} 
        />
      )}

      {showStats && (
        <CareerStats 
          history={profile.history} 
          onClose={() => setShowStats(false)} 
        />
      )}
    </section>
  );
}

function getPhaseLabel(phase: Phase) {
  return { setup: "대기", night: "밤", day: "낮", vote: "투표", ended: "종료" }[phase];
}
