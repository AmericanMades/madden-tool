// app/stats/page.js
//
// Defense stat field names (tackles/sacks/ints) are inferred, not
// confirmed — we've only seen a successful payload for passing so
// far. Structure is ready; will populate once a successful
// week_defense export exists and we can confirm the real field
// names against it.

import Link from "next/link";
import { getAllRostersForLeague, getSeasonStatLeaders, getLatestExport } from "../../lib/db";
import StatsTabs from "../components/StatsTabs";

const USERNAME = "taylor";
const DEFAULT_LEAGUE_ID = "2207259";

function joinWithRoster(players, rosterLookup) {
  return players.map((p) => {
    const rosterInfo = rosterLookup[p.rosterId];
    return {
      ...p,
      position: rosterInfo?.position || null,
      teamName: rosterInfo?.teamName || null,
    };
  });
}

export default async function StatsPage({ searchParams }) {
  const sp = await searchParams;
  const leagueId = sp.league || DEFAULT_LEAGUE_ID;

  const [rosters, standingsExport, passing, rushing, receiving, tackles] = await Promise.all([
    getAllRostersForLeague({ username: USERNAME, leagueId }),
    getLatestExport({ username: USERNAME, leagueId, exportType: "standings" }),
    getSeasonStatLeaders({
      username: USERNAME,
      leagueId,
      exportType: "week_passing",
      listKey: "playerPassingStatInfoList",
      sumFields: ["passYds", "passTDs", "passInts", "passAtt", "passComp"],
    }),
    getSeasonStatLeaders({
      username: USERNAME,
      leagueId,
      exportType: "week_rushing",
      listKey: "playerRushingStatInfoList",
      sumFields: ["rushYds", "rushTDs", "rushAtt"],
    }),
    getSeasonStatLeaders({
      username: USERNAME,
      leagueId,
      exportType: "week_receiving",
      listKey: "playerReceivingStatInfoList",
      sumFields: ["recYds", "recTDs", "recCatches"],
    }),
    getSeasonStatLeaders({
      username: USERNAME,
      leagueId,
      exportType: "week_defense",
      listKey: "playerDefensiveStatInfoList",
      sumFields: ["tackles", "sacks", "ints"],
    }),
  ]);

  // teamId -> real team name, from standings.
  const teamNamesById = {};
  if (standingsExport) {
    for (const t of standingsExport.payload.teamStandingInfoList) teamNamesById[t.teamId] = t.teamName;
  }

  // rosterId -> {position, teamName}, built from every team's roster
  // and cross-referenced against the team-name map above — the stat
  // records themselves only carry teamId, not a readable name, and
  // don't carry position at all.
  const rosterLookup = {};
  for (const r of rosters) {
    for (const p of r.payload?.rosterInfoList || []) {
      rosterLookup[p.rosterId] = {
        position: p.position,
        teamName: teamNamesById[r.team_id] || null,
      };
    }
  }

  const passingJoined = joinWithRoster(passing, rosterLookup).sort((a, b) => b.passYds - a.passYds);
  const rushingJoined = joinWithRoster(rushing, rosterLookup)
    .map((p) => ({ ...p, rushAvg: p.rushAtt > 0 ? p.rushYds / p.rushAtt : 0 }))
    .sort((a, b) => b.rushYds - a.rushYds);
  const receivingJoined = joinWithRoster(receiving, rosterLookup)
    .map((p) => ({ ...p, recAvg: p.recCatches > 0 ? p.recYds / p.recCatches : 0 }))
    .sort((a, b) => b.recYds - a.recYds);

  const tacklesJoined = joinWithRoster(tackles, rosterLookup);
  const byTackles = [...tacklesJoined].sort((a, b) => b.tackles - a.tackles);
  const bySacks = [...tacklesJoined].sort((a, b) => b.sacks - a.sacks);
  const byInts = [...tacklesJoined].sort((a, b) => b.ints - a.ints);

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100">
      <div className="max-w-[1000px] mx-auto px-6 py-7">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-bold text-slate-50 tracking-tight">Stats</h1>
          <Link href={`/?league=${leagueId}`} className="text-xs text-slate-500 hover:text-slate-300 transition-colors">
            ← Back to overview
          </Link>
        </div>

        <StatsTabs
          leagueId={leagueId}
          offense={{ passing: passingJoined.slice(0, 10), rushing: rushingJoined.slice(0, 10), receiving: receivingJoined.slice(0, 10) }}
          defense={{ tackles: byTackles.slice(0, 10), sacks: bySacks.slice(0, 10), ints: byInts.slice(0, 10) }}
        />
      </div>
    </div>
  );
}
