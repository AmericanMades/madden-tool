// app/leaders/page.js
//
// Three kinds of leaders now:
//   1. Team leaders — season stats from standings, Madden's own ranks.
//   2. Stat leaders — REAL season performance stats (passing/rushing/
//      receiving yards), aggregated from successful weekly exports.
//      Passing is confirmed real; rushing/receiving field names are
//      inferred from the same naming pattern, same caveat as the
//      overview page.
//   3. Player leaders by RATING — ratings, not performance, pulled
//      from every team's roster.

import Link from "next/link";
import { getLatestExport, getAllRostersForLeague, getSeasonStatLeaders } from "../../lib/db";
import { TEAM_COLORS } from "../../lib/madden";

const USERNAME = "taylor";
const DEFAULT_LEAGUE_ID = "2207259";

function SectionLabel({ children }) {
  return (
    <div className="text-xs font-semibold text-slate-300 uppercase tracking-wider mb-3 px-1 flex items-center gap-2">
      <span className="w-1.5 h-1.5 rounded-full bg-amber-400" />
      {children}
    </div>
  );
}

function TeamLeaderCard({ title, teams, valueKey, rankKey, leagueId, format }) {
  const sorted = [...teams].sort((a, b) => a[rankKey] - b[rankKey]).slice(0, 10);
  return (
    <div>
      <div className="text-[11px] font-semibold text-slate-500 uppercase tracking-wide mb-1.5 px-1">{title}</div>
      <div className="bg-slate-900/50 rounded-xl border border-slate-800/80 shadow-sm shadow-black/20 overflow-hidden">
        {sorted.map((t, i) => (
          <Link
            key={t.teamId}
            href={`/team/${t.teamId}?league=${leagueId}`}
            className={`flex items-center gap-2 px-3 py-2 text-sm hover:bg-slate-800/30 transition-colors ${
              i !== sorted.length - 1 ? "border-b border-slate-800/50" : ""
            }`}
          >
            <span className="text-slate-600 tabular-nums text-xs w-4 font-medium">{i + 1}</span>
            <span className="w-2 h-2 rounded-full flex-shrink-0" style={{ backgroundColor: TEAM_COLORS[t.teamName] || "#64748B" }} />
            <span className="text-slate-200 font-medium flex-1 truncate">{t.teamName}</span>
            <span className="text-amber-400 font-bold tabular-nums">{format ? format(t[valueKey]) : t[valueKey]}</span>
          </Link>
        ))}
      </div>
    </div>
  );
}

function StatLeaderCard({ title, players, valueKey, leagueId }) {
  const sorted = [...players].sort((a, b) => b[valueKey] - a[valueKey]).slice(0, 10);
  if (sorted.length === 0) {
    return (
      <div>
        <div className="text-[11px] font-semibold text-slate-500 uppercase tracking-wide mb-1.5 px-1">{title}</div>
        <div className="bg-slate-900/40 rounded-xl border border-dashed border-slate-800 p-4 text-center text-xs text-slate-600 italic">
          No successful weekly export yet for this stat.
        </div>
      </div>
    );
  }
  return (
    <div>
      <div className="text-[11px] font-semibold text-slate-500 uppercase tracking-wide mb-1.5 px-1">{title}</div>
      <div className="bg-slate-900/50 rounded-xl border border-slate-800/80 shadow-sm shadow-black/20 overflow-hidden">
        {sorted.map((p, i) => (
          <Link
            key={p.rosterId}
            href={`/player/${p.teamId}/${p.rosterId}?league=${leagueId}`}
            className={`flex items-center gap-2 px-3 py-2 text-sm hover:bg-slate-800/30 transition-colors ${
              i !== sorted.length - 1 ? "border-b border-slate-800/50" : ""
            }`}
          >
            <span className="text-slate-600 tabular-nums text-xs w-4 font-medium">{i + 1}</span>
            <span className="text-slate-200 font-medium flex-1 truncate">{p.fullName}</span>
            <span className="text-slate-500 text-[11px]">{p.weeksPlayed}gp</span>
            <span className="text-amber-400 font-bold tabular-nums w-12 text-right">{p[valueKey]}</span>
          </Link>
        ))}
      </div>
    </div>
  );
}

function PlayerLeaderCard({ title, players, valueKey }) {
  const sorted = [...players].sort((a, b) => b[valueKey] - a[valueKey]).slice(0, 10);
  return (
    <div>
      <div className="text-[11px] font-semibold text-slate-500 uppercase tracking-wide mb-1.5 px-1">{title}</div>
      <div className="bg-slate-900/50 rounded-xl border border-slate-800/80 shadow-sm shadow-black/20 overflow-hidden">
        {sorted.map((p, i) => (
          <Link
            key={`${p.teamId}-${p.rosterId}`}
            href={`/player/${p.teamId}/${p.rosterId}?league=${p.leagueId}`}
            className={`flex items-center gap-2 px-3 py-2 text-sm hover:bg-slate-800/30 transition-colors ${
              i !== sorted.length - 1 ? "border-b border-slate-800/50" : ""
            }`}
          >
            <span className="text-slate-600 tabular-nums text-xs w-4 font-medium">{i + 1}</span>
            <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-slate-800 text-slate-400 w-9 text-center flex-shrink-0">
              {p.position}
            </span>
            <span className="text-slate-200 font-medium flex-1 truncate">
              {p.firstName} {p.lastName}
            </span>
            <span className="text-slate-500 text-[11px] truncate max-w-[80px]">{p.teamName}</span>
            <span className="text-amber-400 font-bold tabular-nums w-8 text-right">{p[valueKey]}</span>
          </Link>
        ))}
      </div>
    </div>
  );
}

export default async function LeadersPage({ searchParams }) {
  const sp = await searchParams;
  const leagueId = sp.league || DEFAULT_LEAGUE_ID;

  const [standingsExport, rosters, passingLeaders, rushingLeaders, receivingLeaders] = await Promise.all([
    getLatestExport({ username: USERNAME, leagueId, exportType: "standings" }),
    getAllRostersForLeague({ username: USERNAME, leagueId }),
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
  ]);

  if (!standingsExport) {
    return (
      <div className="min-h-screen bg-slate-950 text-slate-100 flex items-center justify-center p-10 text-center">
        <div className="text-sm text-slate-500">No data yet.</div>
      </div>
    );
  }

  const teams = standingsExport.payload.teamStandingInfoList;
  const teamNamesById = {};
  for (const t of teams) teamNamesById[t.teamId] = t.teamName;

  const allPlayers = [];
  for (const r of rosters) {
    const list = r.payload?.rosterInfoList || [];
    for (const p of list) {
      if (p.isFreeAgent) continue;
      allPlayers.push({ ...p, teamId: r.team_id, teamName: teamNamesById[r.team_id] || "—", leagueId });
    }
  }

  const qbs = allPlayers.filter((p) => p.position === "QB");
  const skillPlayers = allPlayers.filter((p) => ["WR", "TE", "HB"].includes(p.position));
  const hasStatData = passingLeaders.length > 0 || rushingLeaders.length > 0 || receivingLeaders.length > 0;

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100">
      <div className="max-w-[1200px] mx-auto px-6 py-7">
        <div className="flex items-center justify-between mb-7">
          <h1 className="text-2xl font-bold text-slate-50 tracking-tight">League Leaders</h1>
          <Link href={`/?league=${leagueId}`} className="text-xs text-slate-500 hover:text-slate-300 transition-colors">
            ← Back to overview
          </Link>
        </div>

        <SectionLabel>Team Leaders</SectionLabel>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5 mb-9">
          <TeamLeaderCard title="Total Offense (Yards)" teams={teams} valueKey="offTotalYds" rankKey="offTotalYdsRank" leagueId={leagueId} />
          <TeamLeaderCard title="Passing Offense" teams={teams} valueKey="offPassYds" rankKey="offPassYdsRank" leagueId={leagueId} />
          <TeamLeaderCard title="Rushing Offense" teams={teams} valueKey="offRushYds" rankKey="offRushYdsRank" leagueId={leagueId} />
          <TeamLeaderCard title="Total Defense (Yards Allowed)" teams={teams} valueKey="defTotalYds" rankKey="defTotalYdsRank" leagueId={leagueId} />
          <TeamLeaderCard title="Points Scored" teams={teams} valueKey="ptsFor" rankKey="ptsForRank" leagueId={leagueId} />
          <TeamLeaderCard title="Points Allowed" teams={teams} valueKey="ptsAgainst" rankKey="ptsAgainstRank" leagueId={leagueId} />
        </div>

        <SectionLabel>Stat Leaders — Season</SectionLabel>
        {!hasStatData && (
          <div className="text-[11px] text-slate-600 mb-4 px-1 -mt-2">
            Weekly stat exports fail on EA&apos;s end most of the time — these fill in as successful weekly exports come through.
          </div>
        )}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5 mb-9">
          <StatLeaderCard title="Passing Yards" players={passingLeaders} valueKey="passYds" leagueId={leagueId} />
          <StatLeaderCard title="Rushing Yards" players={rushingLeaders} valueKey="rushYds" leagueId={leagueId} />
          <StatLeaderCard title="Receiving Yards" players={receivingLeaders} valueKey="recYds" leagueId={leagueId} />
        </div>

        {allPlayers.length > 0 && (
          <>
            <SectionLabel>Player Leaders — by Rating</SectionLabel>
            <div className="text-[11px] text-slate-600 mb-4 px-1 -mt-2">Ratings, not season performance.</div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
              <PlayerLeaderCard title="Highest Overall" players={allPlayers} valueKey="playerSchemeOvr" />
              <PlayerLeaderCard title="Fastest Players" players={allPlayers} valueKey="speedRating" />
              <PlayerLeaderCard title="Strongest Players" players={allPlayers} valueKey="strengthRating" />
              <PlayerLeaderCard title="Best QBs — Throw Power" players={qbs} valueKey="throwPowerRating" />
              <PlayerLeaderCard title="Best Hands (Catching)" players={skillPlayers} valueKey="catchRating" />
              <PlayerLeaderCard title="Best Tacklers" players={allPlayers} valueKey="tackleRating" />
              <PlayerLeaderCard title="Best Man Coverage" players={allPlayers} valueKey="manCoverRating" />
              <PlayerLeaderCard title="Best Pass Blockers" players={allPlayers} valueKey="passBlockRating" />
              <PlayerLeaderCard title="Highest Awareness" players={allPlayers} valueKey="awareRating" />
            </div>
          </>
        )}
      </div>
    </div>
  );
}
