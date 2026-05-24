import { Panel } from "./Common";
import { previewCommands, previewActionGroups } from "./constants";

export function ChatResponsePreview() {
  return (
    <Panel title="채팅 응답 미리보기">
      <div className="grid gap-4 lg:grid-cols-[1fr_1fr]">
        <div className="border border-neutral-800 bg-neutral-950 p-4">
          <h3 className="text-sm font-semibold text-white">명령 예시</h3>
          <div className="mt-3 grid gap-3">
            {previewCommands.map((item) => (
              <div className="border border-neutral-800 bg-neutral-900 p-3" key={item.command}>
                <p className="font-mono text-sm text-red-200">{item.command}</p>
                <p className="mt-2 text-sm leading-6 text-neutral-400">{item.response}</p>
              </div>
            ))}
          </div>
        </div>

        <div className="border border-neutral-800 bg-neutral-950 p-4">
          <h3 className="text-sm font-semibold text-white">버튼 선택지</h3>
          <div className="mt-3 grid gap-3">
            {previewActionGroups.map((group) => (
              <div key={group.label}>
                <p className="text-xs font-semibold text-neutral-500">{group.label}</p>
                <div className="mt-2 flex flex-wrap gap-2">
                  {group.actions.map((action) => (
                    <span
                      className="border border-neutral-700 bg-neutral-900 px-3 py-2 text-xs font-semibold text-neutral-200"
                      key={action}
                    >
                      {action}
                    </span>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="mt-4 border border-red-900 bg-red-950/30 p-4">
        <h3 className="text-sm font-semibold text-red-100">결과 카드 축약 예시</h3>
        <div className="mt-3 grid gap-2 text-sm leading-6 text-neutral-200">
          <p>🏁 시민 팀 승리 · 내 역할 경찰</p>
          <p>💰 +92 XP · Lv. 3 진행도 68/100</p>
          <p>🏷️ 신입 탐정 · 주요 사건: 투표 결과 검은 우산 탈락</p>
        </div>
      </div>
    </Panel>
  );
}
