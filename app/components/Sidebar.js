"use client";
// app/components/Sidebar.js

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import { TEAM_COLORS } from "../../lib/madden";

const TEAM_ABBR = {
  Jets: "NYJ",
  Dolphins: "MIA",
  Patriots: "NE",
  Bills: "BUF",
};

function TeamBadge({ teamName }) {
  if (!teamName) return null;
  const color = TEAM_COLORS[teamName] || "#64748B";
  const abbr = TEAM_ABBR[teamName] || teamName.slice(0, 3).toUpperCase();
  return (
    <span
      className="inline-flex items-center justify-center w-6 h-6 rounded text-[9px] font-bold text-white flex-shrink-0"
      style={{ backgroundColor: color }}
    >
      {abbr}
    </span>
  );
}

export default function Sidebar() {
  const [leagues, setLeagues] = useState([]);
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const activeLeagueId = searchParams.get("league");

  useEffect(() => {
    fetch("/api/leagues")
      .then((r) => r.json())
      .then((d) => setLeagues(d.leagues || []))
      .catch(() => setLeagues([]));
  }, []);

  if (leagues.length === 0) return null;

  return (
    <div className="w-56 flex-shrink-0 bg-slate-950 border-r border-slate-800 min-h-screen px-3 py-5">
      <div className="text-[10px] font-semibold text-slate-600 uppercase tracking-wide mb-3 px-2">Leagues</div>
      <div className="space-y-1">
        {leagues.map((league) => {
          const isActive = activeLeagueId ? activeLeagueId === league.leagueId : leagues[0]?.leagueId === league.leagueId;
          const isUnconfigured = !league.myTeamId;

          if (isUnconfigured) {
            return (
              <Link
                key={league.leagueId}
                href={`/setup?league=${league.leagueId}`}
                className="flex items-center gap-2 px-2 py-2 rounded-lg text-sm truncate border border-dashed border-amber-500/40 text-amber-400 hover:bg-slate-900"
              >
                <span className="w-6 h-6 rounded flex items-center justify-center text-[9px] font-bold bg-amber-500/15 flex-shrink-0">
                  ?
                </span>
                <span className="truncate">{league.label} — set up</span>
              </Link>
            );
          }

          return (
            <Link
              key={league.leagueId}
              href={`${pathname}?league=${league.leagueId}`}
              className={`flex items-center gap-2 px-2 py-2 rounded-lg text-sm truncate ${
                isActive ? "bg-sky-500/15 text-sky-400 font-semibold" : "text-slate-400 hover:bg-slate-900 hover:text-slate-200"
              }`}
            >
              <TeamBadge teamName={league.myTeamName} />
              <span className="truncate">{league.label}</span>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
