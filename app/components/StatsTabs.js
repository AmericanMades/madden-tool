"use client";
// app/components/StatsTabs.js

import { useState } from "react";
import Link from "next/link";
import { TEAM_COLORS } from "../../lib/madden";

function PlayerCell({ player, leagueId }) {
  return (
    <Link
      href={`/player/${player.teamId}/${player.rosterId}?league=${leagueId}`}
      className="flex items-center gap-2 min-w-0 hover:underline"
    >
      <span className="text-slate-200 font-medium truncate">{player.fullName}</span>
    </Link>
  );
}

function TeamCell({ teamName }) {
  return (
    <span className="flex items-center gap-1.5 text-slate-400 text-sm">
      <span className="w-2 h-2 rounded-full flex-shrink-0" style={{ backgroundColor: TEAM_COLORS[teamName] || "#64748B" }} />
      {teamName || "—"}
    </span>
  );
}

function LeaderTable({ title, players, columns, leagueId }) {
  return (
    <div className="mb-6">
      <div className="text-lg font-bold text-slate-50 mb-3">{title}</div>
      {players.length === 0 ? (
        <div className="bg-slate-900/40 rounded-xl border border-dashed border-slate-800 p-6 text-center text-sm text-slate-600 italic">
          No successful weekly export yet for this stat.
        </div>
      ) : (
        <div className="bg-slate-900/50 rounded-xl border border-slate-800/80 shadow-sm shadow-black/20 overflow-hidden">
          <div
            className="grid gap-3 px-4 py-2 text-[10px] font-semibold text-slate-500 uppercase tracking-wide border-b border-slate-800/80"
            style={{ gridTemplateColumns: `24px 1fr 90px 50px ${columns.map(() => "60px").join(" ")}` }}
          >
            <span>#</span>
            <span>Player</span>
            <span>Team</span>
            <span>Pos</span>
            {columns.map((c) => (
              <span key={c.key} className="text-right">
                {c.label}
              </span>
            ))}
          </div>
          {players.map((p, i) => (
            <div
              key={p.rosterId}
              className={`grid gap-3 items-center px-4 py-2.5 text-sm hover:bg-slate-800/30 transition-colors ${
                i !== players.length - 1 ? "border-b border-slate-800/50" : ""
              }`}
              style={{ gridTemplateColumns: `24px 1fr 90px 50px ${columns.map(() => "60px").join(" ")}` }}
            >
              <span className="text-slate-600 tabular-nums text-xs">{i + 1}</span>
              <PlayerCell player={p} leagueId={leagueId} />
              <TeamCell teamName={p.teamName} />
              <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-slate-800 text-slate-400 text-center w-9">
                {p.position || "—"}
              </span>
              {columns.map((c) => (
                <span key={c.key} className="text-right tabular-nums font-semibold text-amber-400 text-sm">
                  {p[c.key] != null ? c.format ? c.format(p[c.key]) : p[c.key] : "—"}
                </span>
              ))}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default function StatsTabs({ offense, defense, leagueId }) {
  const [tab, setTab] = useState("offense");

  return (
    <div>
      <div className="flex border-b border-slate-800 mb-6">
        {["offense", "defense"].map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`px-5 py-3 text-sm font-bold uppercase tracking-wide border-b-2 transition-colors ${
              tab === t ? "border-amber-400 text-amber-400" : "border-transparent text-slate-500 hover:text-slate-300"
            }`}
          >
            {t}
          </button>
        ))}
      </div>

      {tab === "offense" ? (
        <div>
          <LeaderTable
            title="Passing Leaders"
            players={offense.passing}
            leagueId={leagueId}
            columns={[
              { key: "passYds", label: "Yds" },
              { key: "passTDs", label: "TD" },
              { key: "passInts", label: "Int" },
            ]}
          />
          <LeaderTable
            title="Rushing Leaders"
            players={offense.rushing}
            leagueId={leagueId}
            columns={[
              { key: "rushYds", label: "Yds" },
              { key: "rushAvg", label: "Avg", format: (v) => v.toFixed(1) },
              { key: "rushTDs", label: "TD" },
            ]}
          />
          <LeaderTable
            title="Receiving Leaders"
            players={offense.receiving}
            leagueId={leagueId}
            columns={[
              { key: "recYds", label: "Yds" },
              { key: "recAvg", label: "Avg", format: (v) => v.toFixed(1) },
              { key: "recTDs", label: "TD" },
            ]}
          />
        </div>
      ) : (
        <div>
          <LeaderTable
            title="Tackle Leaders"
            players={defense.tackles}
            leagueId={leagueId}
            columns={[
              { key: "tackles", label: "Tkl" },
              { key: "sacks", label: "Sack" },
              { key: "ints", label: "Int" },
            ]}
          />
          <LeaderTable
            title="Sack Leaders"
            players={defense.sacks}
            leagueId={leagueId}
            columns={[
              { key: "tackles", label: "Tkl" },
              { key: "sacks", label: "Sack" },
              { key: "ints", label: "Int" },
            ]}
          />
          <LeaderTable
            title="Interception Leaders"
            players={defense.ints}
            leagueId={leagueId}
            columns={[
              { key: "tackles", label: "Tkl" },
              { key: "sacks", label: "Sack" },
              { key: "ints", label: "Int" },
            ]}
          />
        </div>
      )}
    </div>
  );
}
