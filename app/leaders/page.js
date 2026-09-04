// app/leaders/page.js
//
// Two kinds of leaders, both from confirmed real data:
//   1. Team leaders — season stats from the standings export, which
//      Madden already ranks 1-32 itself.
//   2. Player leaders by RATING — pulled from every team's roster
//      export. Note this is ratings (speed, throw power, overall),
//      NOT performance stats (yards, TDs) — those come from the
//      weekly player stat exports, which fail on EA's end.

import Link from "next/link";
import { getLatestExport, getAllRostersForLeague } from "../../lib/db";
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

function TeamLeaderCard({ title, teams, valueKey, rankKey, leagueId, format, lowerIsBetter }) {
  // Madden already provides a rank for each of these stats, so sort
  // by that rather than recomputing — it's their own ranking.
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

function PlayerLeaderCard({ title, players, valueKey, subtitle }) {
  const sorted = [...players].sort((a, b) => b[valueKey] - a[valueKey]).slice(0, 10);

  return (
    <div>
      <div className="text-[11px] font-semibold text-slate-500 uppercase tracking-wide mb-1.5 px-1">{title}</div>
      {subtitle && <div className="text-[10px] text-slate-600 mb-1.5 px-1 -mt-1">{subtitle}</div>}
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

  const [standingsExport, rosters] = await Promise.all([
    getLatestExport({ username: USERNAME, leagueId, exportType: "standings" }),
    getAllRostersForLeague({ username: USERNAME, leagueId }),
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

  // Flatten every team's roster into one league-wide player list,
  // tagging each player with their team so leader rows can show it.
  const allPlayers = [];
  for (const r of rosters) {
    const list = r.payload?.rosterInfoList || [];
    for (const p of list) {
      if (p.isFreeAgent) continue;
      allPlayers.push({
        ...p,
        teamId: r.team_id,
        teamName: teamNamesById[r.team_id] || "—",
        leagueId,
      });
    }
  }

  const qbs = allPlayers.filter((p) => p.position === "QB");
  const skillPlayers = allPlayers.filter((p) => ["WR", "TE", "HB"].includes(p.position));

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

        {allPlayers.length > 0 ? (
          <>
            <SectionLabel>Player Leaders — by Rating</SectionLabel>
            <div className="text-[11px] text-slate-600 mb-4 px-1 -mt-2">
              Ratings, not season performance — Madden&apos;s weekly player stat exports are currently failing on EA&apos;s end.
            </div>
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
        ) : (
          <div className="bg-slate-900/40 rounded-xl border border-dashed border-slate-800 p-6 text-center text-sm text-slate-600 italic">
            No roster exports saved yet for this league — player leaders will appear once rosters are exported.
          </div>
        )}
      </div>
    </div>
  );
}
