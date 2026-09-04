// app/free-agents/page.js
//
// Assumes freeagents_roster uses the same rosterInfoList structure
// as team_roster (same underlying Madden data model, different
// player pool) — this hasn't been directly confirmed by inspecting
// the payload, so if the list shows empty despite exports existing,
// that assumption is the first thing to check.

import Link from "next/link";
import { getLatestExport } from "../../lib/db";
import { sortedDistinctPositions } from "../../lib/madden";
import PositionFilter from "../components/PositionFilter";

const USERNAME = "taylor";
const DEFAULT_LEAGUE_ID = "2207259";

export default async function FreeAgentsPage({ searchParams }) {
  const sp = await searchParams;
  const leagueId = sp.league || DEFAULT_LEAGUE_ID;
  const positionFilter = sp.position || null;

  const faExport = await getLatestExport({ username: USERNAME, leagueId, exportType: "freeagents_roster" });

  if (!faExport) {
    return (
      <div className="min-h-screen bg-slate-950 text-slate-100 flex items-center justify-center p-10 text-center">
        <div>
          <div className="text-lg font-semibold mb-2">No free agent data yet</div>
          <div className="text-sm text-slate-500">Trigger a free agents export from the Companion App.</div>
        </div>
      </div>
    );
  }

  const players = faExport.payload.rosterInfoList || [];

  if (players.length === 0) {
    return (
      <div className="min-h-screen bg-slate-950 text-slate-100 flex items-center justify-center p-10 text-center">
        <div className="text-sm text-slate-500 max-w-md">
          Export exists but has no players in the expected field — the payload's real structure may differ from what was
          assumed. Worth checking the raw payload directly.
        </div>
      </div>
    );
  }

  const positions = sortedDistinctPositions(players);
  const filtered = positionFilter ? players.filter((p) => p.position === positionFilter) : players;
  const sorted = [...filtered].sort((a, b) => b.playerSchemeOvr - a.playerSchemeOvr);

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100">
      <div className="max-w-[900px] mx-auto px-6 py-7">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-bold text-slate-50 tracking-tight">Free Agents</h1>
          <Link href={`/?league=${leagueId}`} className="text-xs text-slate-500 hover:text-slate-300 transition-colors">
            ← Back to overview
          </Link>
        </div>

        <div className="mb-5 flex items-center gap-3">
          <PositionFilter positions={positions} current={positionFilter} extraParams={`league=${leagueId}`} />
          <span className="text-xs text-slate-500">{sorted.length} players</span>
        </div>

        <div className="bg-slate-900/50 rounded-xl border border-slate-800/80 shadow-sm shadow-black/20 overflow-hidden">
          {sorted.map((p, i) => (
            <div
              key={p.rosterId}
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
              <span className="text-slate-500 text-xs">Age {p.age}</span>
              <span className="text-slate-500 text-xs w-20 text-right">
                {p.desiredSalary > 0 ? `$${(p.desiredSalary / 1000000).toFixed(1)}M ask` : "—"}
              </span>
              <span className="text-amber-400 font-bold tabular-nums w-7 text-right">{p.playerSchemeOvr}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
