// app/schedule/page.js
//
// Built from confirmed real week_schedules data. Team IDs in the
// schedule payload are cross-referenced against the standings export
// to show real team names/colors instead of raw numeric IDs.
//
// One inference worth flagging: status appears to be 3 for a
// completed game (the one real example had status 3 with real
// scores) and 1 for a game not yet played (0-0 scores). That's
// inferred from a single example, not confirmed — worth a sanity
// check once real completed games show up across more weeks.

import Link from "next/link";
import { getLatestExport, getAllWeeksForExportType } from "../../lib/db";
import { TEAM_COLORS } from "../../lib/madden";

const USERNAME = "taylor";
const LEAGUE_ID = "2207259";

function TeamLabel({ team, align = "left" }) {
  if (!team) return <span className="text-slate-600 text-sm">Unknown</span>;
  const color = TEAM_COLORS[team.teamName] || "#64748B";
  return (
    <Link
      href={`/team/${team.teamId}`}
      className={`flex items-center gap-1.5 hover:underline ${align === "right" ? "flex-row-reverse text-right" : ""}`}
    >
      <span className="w-2 h-2 rounded-full flex-shrink-0" style={{ backgroundColor: color }} />
      <span className="text-slate-200 font-medium text-sm">{team.teamName}</span>
    </Link>
  );
}

function GameRow({ game, teamsById }) {
  const away = teamsById[game.awayTeamId];
  const home = teamsById[game.homeTeamId];
  const isFinal = game.status === 3;

  return (
    <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-3 px-3 py-2 border-b border-slate-800/60 last:border-0">
      <TeamLabel team={away} />
      <div className="text-center min-w-[70px]">
        {isFinal ? (
          <div className="text-sm font-bold tabular-nums text-slate-100">
            {game.awayScore} - {game.homeScore}
          </div>
        ) : (
          <div className="text-[10px] text-slate-500 uppercase tracking-wide">Scheduled</div>
        )}
      </div>
      <TeamLabel team={home} align="right" />
    </div>
  );
}

export default async function SchedulePage() {
  const standingsExport = await getLatestExport({ username: USERNAME, leagueId: LEAGUE_ID, exportType: "standings" });
  const weeks = await getAllWeeksForExportType({ username: USERNAME, leagueId: LEAGUE_ID, exportType: "week_schedules" });

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
          <Link href="/" className="text-xs text-slate-500 hover:text-slate-300">
            ← Back to overview
          </Link>
        </div>

        {weeks.map((w) => {
          const games = w.payload.gameScheduleInfoList || [];
          return (
            <div key={w.week} className="mb-6">
              <div className="text-[11px] font-semibold text-slate-500 uppercase tracking-wide mb-1.5 px-1">
                Week {w.week}
              </div>
              <div className="bg-slate-900/60 rounded-lg border border-slate-800 overflow-hidden">
                {games.map((g) => (
                  <GameRow key={g.scheduleId} game={g} teamsById={teamsById} />
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
