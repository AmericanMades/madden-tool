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
      className={`inline-flex items-center justify-center ${size} rounded-lg font-bold text-white flex-shrink-0 shadow-sm shadow-black/30`}
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
    { label: "Stats", href: `/stats?league=${currentLeagueId}` },
    { label: "League Leaders", href: `/leaders?league=${currentLeagueId}` },
    { label: "Free Agents", href: `/free-agents?league=${currentLeagueId}` },
    { label: "Injury Report", href: `/injuries?league=${currentLeagueId}` },
    { label: "Cap Space", href: `/cap-space?league=${currentLeagueId}` },
    { label: "Rookies", href: `/rookies?league=${currentLeagueId}` },
  ];

  return (
    <div className="w-60 flex-shrink-0 bg-slate-950 border-r border-slate-800/80 min-h-screen flex flex-col">
      <div className="relative border-b border-slate-800/80">
        <button
          onClick={() => setDropdownOpen((v) => !v)}
          className="w-full flex items-center gap-3 px-4 py-4 hover:bg-slate-900/70 text-left transition-colors"
        >
          <TeamBadge teamName={current.myTeamName} />
          <div className="min-w-0 flex-1">
            {current.week != null && (
              <div className="text-[10px] font-semibold text-amber-500/80 uppercase tracking-wider">Week {current.week}</div>
            )}
            <div className="text-sm font-semibold text-slate-100 truncate">{current.label}</div>
          </div>
          <span className={`text-slate-600 text-[10px] transition-transform ${dropdownOpen ? "rotate-180" : ""}`}>▼</span>
        </button>

        {dropdownOpen && (
          <div className="absolute left-0 right-0 top-full z-10 bg-slate-900 border border-slate-800 rounded-b-xl shadow-xl shadow-black/40 overflow-hidden">
            {leagues.map((league) => {
              const isUnconfigured = !league.myTeamId;
              if (isUnconfigured) {
                return (
                  <Link
                    key={league.leagueId}
                    href={`/setup?league=${league.leagueId}`}
                    onClick={() => setDropdownOpen(false)}
                    className="flex items-center gap-2 px-4 py-2.5 text-sm text-amber-400 hover:bg-slate-800/80 border-b border-slate-800/60 last:border-0 transition-colors"
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
                  className={`flex items-center gap-2 px-4 py-2.5 text-sm border-b border-slate-800/60 last:border-0 transition-colors ${
                    league.leagueId === currentLeagueId
                      ? "bg-amber-500/10 text-amber-400"
                      : "text-slate-300 hover:bg-slate-800/80"
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

      <div className="py-3 px-2">
        {navItems.map((item) =>
          item.href ? (
            <Link
              key={item.label}
              href={item.href}
              className="block px-3 py-2 rounded-lg text-sm font-medium text-slate-300 hover:bg-slate-900/70 hover:text-slate-100 transition-colors"
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
