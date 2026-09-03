// app/schedule/page.js

import Link from "next/link";
import { getLatestExport, getAllWeeksForExportType } from "../../lib/db";
import { TEAM_COLORS } from "../../lib/madden";

const USERNAME = "taylor";
const DEFAULT_LEAGUE_ID = "2207259";

function TeamLabel({ team, leagueId, align = "left" }) {
  if (!team) return <span className="text-slate-600 text-sm">Unknown</span>;
  const color = TEAM_COLORS[team.teamName] || "#64748B";
  return (
    <Link
      href={`/team/${team.teamId}?league=${leagueId}`}
      className={`flex items-center gap-1.5 hover:underline ${align === "right" ? "flex-row-reverse text-right" : ""}`}
    >
      <span className="w-2 h-2 rounded-full flex-shrink-0" style={{ backgroundColor: color }} />
      <span className="text-slate-200 font-medium text-sm">{team.teamName}</span>
    </Link>
  );
}

function GameRow({ game, teamsById, leagueId }) {
  const away = teamsById[game.awayTeamId];
  const home = teamsById[game.homeTeamId];
  const isFinal = game.status === 3;

  return (
    <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-3 px-3 py-2 border-b border-slate-800/60 last:border-0">
      <TeamLabel team={away} leagueId={leagueId} />
      <div className="text-center min-w-[70px]">
        {isFinal ? (
          <div className="text-sm font-bold tabular-nums text-slate-100">
            {game.awayScore} - {game.homeScore}
          </div>
        ) : (
          <div className="text-[10px] text-slate-500 uppercase tracking-wide">Scheduled</div>
        )}
      </div>
      <TeamLabel team={home} leagueId={leagueId} align="right" />
    </div>
  );
}

export default async function SchedulePage({ searchParams }) {
  const sp = await searchParams;
  const leagueId = sp.league || DEFAULT_LEAGUE_ID;

  const standingsExport = await getLatestExport({ username: USERNAME, leagueId, exportType: "standings" });
  const weeks = await getAllWeeksForExportType({ username: USERNAME, leagueId, exportType: "week_schedules" });

  if (!standingsExport || weeks.length === 0) {
    return (
      <div className="min-h-screen bg-slate-950 text-slate-100 flex items-center justify-center p-10 text-center">
        <div className="text-sm text-slate-500">No schedule data yet.</div>
      </div>
    );
  }

  const teams = standingsExport.payload.teamStandingInfoList;
  const teamsById = {};
  for (const t of teams) teamsById[t.teamId] = t;

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100">
      <div className="max-w-[900px] mx-auto px-6 py-6">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-xl font-bold text-slate-100">Schedule</h1>
          <Link href={`/?league=${leagueId}`} className="text-xs text-slate-500 hover:text-slate-300">
            ← Back to overview
          </Link>
        </div>

        {weeks.map((w) => {
          const games = w.payload.gameScheduleInfoList || [];
          return (
            <div key={w.week} className="mb-6">
              <div className="text-[11px] font-semibold text-slate-500 uppercase tracking-wide mb-1.5 px-1">Week {w.week}</div>
              <div className="bg-slate-900/60 rounded-lg border border-slate-800 overflow-hidden">
                {games.map((g) => (
                  <GameRow key={g.scheduleId} game={g} teamsById={teamsById} leagueId={leagueId} />
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
