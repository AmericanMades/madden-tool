// app/injuries/page.js
//
// "Injured" here means isOnIR is true, OR injuryLength > 0 (real
// fields confirmed in the roster export). There's no separate
// weekly game-status field confirmed for roster players beyond
// these two, so this is the most complete real signal available.

import Link from "next/link";
import { getAllRostersForLeague, getLatestExport } from "../../lib/db";
import { TEAM_COLORS } from "../../lib/madden";

const USERNAME = "taylor";
const DEFAULT_LEAGUE_ID = "2207259";

export default async function InjuriesPage({ searchParams }) {
  const sp = await searchParams;
  const leagueId = sp.league || DEFAULT_LEAGUE_ID;

  const [rosters, standingsExport] = await Promise.all([
    getAllRostersForLeague({ username: USERNAME, leagueId }),
    getLatestExport({ username: USERNAME, leagueId, exportType: "standings" }),
  ]);

  const teamNamesById = {};
  if (standingsExport) {
    for (const t of standingsExport.payload.teamStandingInfoList) teamNamesById[t.teamId] = t.teamName;
  }

  const injured = [];
  for (const r of rosters) {
    for (const p of r.payload?.rosterInfoList || []) {
      if (p.isOnIR || p.injuryLength > 0) {
        injured.push({ ...p, teamId: r.team_id, teamName: teamNamesById[r.team_id] || "—" });
      }
    }
  }
  injured.sort((a, b) => b.playerSchemeOvr - a.playerSchemeOvr);

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100">
      <div className="max-w-[900px] mx-auto px-6 py-7">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-bold text-slate-50 tracking-tight">Injury Report</h1>
          <Link href={`/?league=${leagueId}`} className="text-xs text-slate-500 hover:text-slate-300 transition-colors">
            ← Back to overview
          </Link>
        </div>

        {injured.length === 0 ? (
          <div className="text-sm text-slate-500 px-1">No injured players found across the league.</div>
        ) : (
          <div className="bg-slate-900/50 rounded-xl border border-slate-800/80 shadow-sm shadow-black/20 overflow-hidden">
            {injured.map((p, i) => (
              <Link
                key={`${p.teamId}-${p.rosterId}`}
                href={`/player/${p.teamId}/${p.rosterId}?league=${leagueId}`}
                className={`flex items-center gap-2.5 px-3.5 py-2.5 text-sm hover:bg-slate-800/30 transition-colors ${
                  i !== injured.length - 1 ? "border-b border-slate-800/50" : ""
                }`}
              >
                <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-slate-800 text-slate-400 w-9 text-center flex-shrink-0">
                  {p.position}
                </span>
                <span className="text-slate-200 font-medium flex-1 truncate">
                  {p.firstName} {p.lastName}
                </span>
                <span className="flex items-center gap-1.5 text-xs text-slate-500 w-28">
                  <span className="w-2 h-2 rounded-full flex-shrink-0" style={{ backgroundColor: TEAM_COLORS[p.teamName] || "#64748B" }} />
                  <span className="truncate">{p.teamName}</span>
                </span>
                {p.isOnIR ? (
                  <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-rose-500/15 text-rose-400">IR</span>
                ) : (
                  <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-amber-500/15 text-amber-400">
                    Out {p.injuryLength}w
                  </span>
                )}
                <span className="text-amber-400 font-bold tabular-nums w-7 text-right">{p.playerSchemeOvr}</span>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
