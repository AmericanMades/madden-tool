"use client";
// app/components/Sidebar.js

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";

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
          return (
            <Link
              key={league.leagueId}
              href={`${pathname}?league=${league.leagueId}`}
              className={`block px-2 py-2 rounded-lg text-sm truncate ${
                isActive ? "bg-sky-500/15 text-sky-400 font-semibold" : "text-slate-400 hover:bg-slate-900 hover:text-slate-200"
              }`}
            >
              {league.label}
            </Link>
          );
        })}
      </div>
    </div>
  );
}
