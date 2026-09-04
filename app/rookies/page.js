// app/rookies/page.js
//
// Rookie = yearsPro === 0 (real confirmed field), rather than
// matching a specific rookieYear value — safer since it doesn't
// require knowing the exact current season year.
//
// Note: a real Rookie of the Year tracker (based on season
// performance, not just being a rookie) depends on the weekly
// player stats export, which is currently broken on EA's end. This
// page is ratings-based for now; revisit ROTY tracking if that ever
// starts working.

import Link from "next/link";
import { getAllRostersForLeague, getLatestExport } from "../../lib/db";
import { sortedDistinctPositions, TEAM_COLORS } from "../../lib/madden";
import PositionFilter from "../components/PositionFilter";

const USERNAME = "taylor";
const DEFAULT_LEAGUE_ID = "2207259";

export default async function RookiesPage({ searchParams }) {
  const sp = await searchParams;
  const leagueId = sp.league || DEFAULT_LEAGUE_ID;
  const positionFilter = sp.position || null;

  const [rosters, standingsExport] = await Promise.all([
    getAllRostersForLeague({ username: USERNAME, leagueId }),
    getLatestExport({ username: USERNAME, leagueId, exportType: "standings" }),
  ]);

  const teamNamesById = {};
  if (standingsExport) {
    for (const t of standingsExport.payload.teamStandingInfoList) teamNamesById[t.teamId] = t.teamName;
  }

  const rookies = [];
  for (const r of rosters) {
    for (const p of r.payload?.rosterInfoList || []) {
      if (p.yearsPro === 0 && !p.isFreeAgent) {
        rookies.push({ ...p, teamId: r.team_id, teamName: teamNamesById[r.team_id] || "—" });
      }
    }
  }

  const positions = sortedDistinctPositions(rookies);
  const filtered = positionFilter ? rookies.filter((p) => p.position === positionFilter) : rookies;
  const sorted = [...filtered].sort((a, b) => b.playerSchemeOvr - a.playerSchemeOvr);

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100">
      <div className="max-w-[900px] mx-auto px-6 py-7">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-bold text-slate-50 tracking-tight">Rookie Tracker</h1>
          <Link href={`/?league=${leagueId}`} className="text-xs text-slate-500 hover:text-slate-300 transition-colors">
            ← Back to overview
          </Link>
        </div>

        {rookies.length === 0 ? (
          <div className="text-sm text-slate-500 px-1">No rookies found — check that roster exports have run for this league.</div>
        ) : (
          <>
            <div className="mb-5 flex items-center gap-3">
              <PositionFilter positions={positions} current={positionFilter} extraParams={`league=${leagueId}`} />
              <span className="text-xs text-slate-500">{sorted.length} rookies</span>
            </div>

            <div className="bg-slate-900/50 rounded-xl border border-slate-800/80 shadow-sm shadow-black/20 overflow-hidden">
              {sorted.map((p, i) => (
                <Link
                  key={`${p.teamId}-${p.rosterId}`}
                  href={`/player/${p.teamId}/${p.rosterId}?league=${leagueId}`}
                  className={`flex items-center gap-2.5 px-3.5 py-2.5 text-sm hover:bg-slate-800/30 transition-colors ${
                    i !== sorted.length - 1 ? "border-b border-slate-800/50" : ""
                  }`}
                >
                  <span className="text-slate-600 tabular-nums text-xs w-5 font-medium">{i + 1}</span>
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
                  <span className="text-slate-500 text-xs">
                    {p.draftPick > 0 ? `R${p.draftRound}P${p.draftPick}` : "UDFA"}
                  </span>
                  <span className="text-amber-400 font-bold tabular-nums w-7 text-right">{p.playerSchemeOvr}</span>
                </Link>
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
