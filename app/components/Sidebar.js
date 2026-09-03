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

function TeamBadge({ teamName, size = "w-9 h-9 text-[11px]" }) {
  const color = teamName ? TEAM_COLORS[teamName] || "#64748B" : "#334155";
  const abbr = teamName ? TEAM_ABBR[teamName] || teamName.slice(0, 3).toUpperCase() : "?";
  return (
    <span
      className={`inline-flex items-center justify-center ${size} rounded-lg font-bold text-white flex-shrink-0`}
      style={{ backgroundColor: color }}
    >
      {abbr}
    </span>
  );
}

export default function Sidebar() {
  const [leagues, setLeagues] = useState([]);
  const [dropdownOpen, setDropdownOpen] = useState(false);
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

  const current = leagues.find((l) => l.leagueId === activeLeagueId) || leagues[0];
  const currentLeagueId = current.leagueId;

  const navItems = [
    { label: "Home", href: `/?league=${currentLeagueId}` },
    { label: "My Team", href: current.myTeamId ? `/team/${current.myTeamId}?league=${currentLeagueId}` : null },
    { label: "Schedule", href: `/schedule?league=${currentLeagueId}` },
  ];

  return (
    <div className="w-60 flex-shrink-0 bg-slate-950 border-r border-slate-800 min-h-screen flex flex-col">
      {/* Team/league card — acts as the league switcher */}
      <div className="relative border-b border-slate-800">
        <button
          onClick={() => setDropdownOpen((v) => !v)}
          className="w-full flex items-center gap-3 px-4 py-4 hover:bg-slate-900/60 text-left"
        >
          <TeamBadge teamName={current.myTeamName} />
          <div className="min-w-0 flex-1">
            {current.week != null && (
              <div className="text-[10px] text-slate-500 uppercase tracking-wide">Week {current.week}</div>
            )}
            <div className="text-sm font-semibold text-slate-100 truncate">{current.label}</div>
          </div>
          <span className="text-slate-600 text-xs">{dropdownOpen ? "▲" : "▼"}</span>
        </button>

        {dropdownOpen && (
          <div className="absolute left-0 right-0 top-full z-10 bg-slate-900 border border-slate-800 rounded-b-lg shadow-xl overflow-hidden">
            {leagues.map((league) => {
              const isUnconfigured = !league.myTeamId;
              if (isUnconfigured) {
                return (
                  <Link
                    key={league.leagueId}
                    href={`/setup?league=${league.leagueId}`}
                    onClick={() => setDropdownOpen(false)}
                    className="flex items-center gap-2 px-4 py-2.5 text-sm text-amber-400 hover:bg-slate-800 border-b border-slate-800 last:border-0"
                  >
                    <TeamBadge teamName={null} size="w-6 h-6 text-[9px]" />
                    <span className="truncate">{league.label} — set up</span>
                  </Link>
                );
              }
              return (
                <Link
                  key={league.leagueId}
                  href={`${pathname}?league=${league.leagueId}`}
                  onClick={() => setDropdownOpen(false)}
                  className={`flex items-center gap-2 px-4 py-2.5 text-sm border-b border-slate-800 last:border-0 ${
                    league.leagueId === currentLeagueId ? "bg-sky-500/10 text-sky-400" : "text-slate-300 hover:bg-slate-800"
                  }`}
                >
                  <TeamBadge teamName={league.myTeamName} size="w-6 h-6 text-[9px]" />
                  <span className="truncate">{league.label}</span>
                </Link>
              );
            })}
          </div>
        )}
      </div>

      {/* Nav menu — only pages that actually exist */}
      <div className="py-3 px-2">
        {navItems.map((item) =>
          item.href ? (
            <Link
              key={item.label}
              href={item.href}
              className="block px-3 py-2 rounded-lg text-sm text-slate-300 hover:bg-slate-900 hover:text-slate-100"
            >
              {item.label}
            </Link>
          ) : (
            <span key={item.label} className="block px-3 py-2 rounded-lg text-sm text-slate-700 cursor-not-allowed">
              {item.label}
            </span>
          )
        )}
      </div>
    </div>
  );
}
