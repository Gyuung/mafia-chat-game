import { Metadata } from "next";
import { MafiaGame } from "@/components/MafiaGame";

export const metadata: Metadata = {
  title: "Mafia Chat Game | 가상 참가자와 즐기는 마피아 게임",
  description: "가상 참가자들과 대화하며 마피아를 추적하는 솔로 소셜 추론 게임입니다. 나만의 전략으로 승리하세요.",
};

export default function Home() {
  return (
    <main className="min-h-screen bg-neutral-950">
      <MafiaGame />
    </main>
  );
}
