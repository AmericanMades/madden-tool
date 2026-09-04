// app/cap-space/page.js

import Link from "next/link";
import { getLatestExport } from "../../lib/db";
import { TEAM_COLORS } from "../../lib/madden";

const USERNAME = "taylor";
const DEFAULT_LEAGUE_ID = "2207259";

export default async function CapSpacePage({ searchParams }) {
  const sp = await searchParams;
  const leagueId = sp.league || DEFAULT_LEAGUE_ID;

  const standingsExport = await getLatestExport({ username: USERNAME, leagueId, exportType: "standings" });

  if (!standingsExport) {
    return (
      <div className="min-h-screen bg-slate-950 text-slate-100 flex items-center justify-center p-10 text-center">
        <div className="text-sm text-slate-500">No data yet.</div>
      </div>
    );
  }

  const teams = [...standingsExport.payload.teamStandingInfoList].sort((a, b) => b.capAvailable - a.capAvailable);

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100">
      <div className="max-w-[800px] mx-auto px-6 py-7">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-bold text-slate-50 tracking-tight">Cap Space Leaderboard</h1>
          <Link href={`/?league=${leagueId}`} className="text-xs text-slate-500 hover:text-slate-300 transition-colors">
            ← Back to overview
          </Link>
        </div>

        <div className="bg-slate-900/50 rounded-xl border border-slate-800/80 shadow-sm shadow-black/20 overflow-hidden">
          {teams.map((t, i) => {
            const capPct = t.capRoom ? Math.round((t.capSpent / t.capRoom) * 100) : 0;
            const color = TEAM_COLORS[t.teamName] || "#64748B";
            return (
              <Link
                key={t.teamId}
                href={`/team/${t.teamId}?league=${leagueId}`}
                className={`flex items-center gap-3 px-3.5 py-3 hover:bg-slate-800/30 transition-colors ${
                  i !== teams.length - 1 ? "border-b border-slate-800/50" : ""
                }`}
              >
                <span className="text-slate-600 tabular-nums text-xs w-5 font-medium">{i + 1}</span>
                <span className="w-2 h-2 rounded-full flex-shrink-0" style={{ backgroundColor: color }} />
                <span className="text-slate-200 font-medium w-32 truncate">{t.teamName}</span>
                <div className="flex-1 h-2 rounded-full bg-slate-800 overflow-hidden">
                  <div className="h-full rounded-full" style={{ width: `${Math.min(capPct, 100)}%`, backgroundColor: color }} />
                </div>
                <span className="text-slate-500 text-xs w-10 text-right">{capPct}%</span>
                <span className="text-amber-400 font-bold tabular-nums text-sm w-20 text-right">
                  ${(t.capAvailable / 1000000).toFixed(1)}M
                </span>
              </Link>
            );
          })}
        </div>
      </div>
    </div>
  );
}
