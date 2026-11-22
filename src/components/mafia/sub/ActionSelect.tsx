"use client";

import { VisiblePlayer } from "../types";

export function ActionSelect({ 
  label, 
  onChange, 
  players, 
  value 
}: { 
  label: string; 
  onChange: (v: string) => void; 
  players: VisiblePlayer[];
  value: string; 
}) {
  return (
    <label className="grid min-w-0 gap-2 text-sm">
      <span className="font-medium text-neutral-200">{label}</span>
      <select 
        aria-label={label}
        className="min-w-0 w-full border border-neutral-700 bg-neutral-950 p-3 text-white outline-none focus:border-red-400"
        onChange={(e) => onChange(e.target.value)} 
        value={value}
      >
        <option value="">대상 선택</option>
        {players.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
      </select>
    </label>
  );
}
