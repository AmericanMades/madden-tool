// app/schedule/page.js
//
// Uses the real weekIndex from inside each game object, not the
// export URL's week segment — that turned out to always be "0"
// regardless of the actual week (confirmed: a real payload showed
// weekIndex: 14 while its URL said week/reg/0/schedules).

import Link from "next/link";
import { getLatestExport, getScheduleWeekOptions, getScheduleForWeek } from "../../lib/db";
import { TEAM_COLORS } from "../../lib/madden";
import WeekSelector from "../components/WeekSelector";

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
    <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-3 px-3.5 py-2.5 border-b border-slate-800/50 last:border-0 hover:bg-slate-800/20 transition-colors">
      <TeamLabel team={away} leagueId={leagueId} />
      <div className="text-center min-w-[74px]">
        {isFinal ? (
          <div className="text-sm font-bold tabular-nums text-slate-100">
            {game.awayScore} - {game.homeScore}
          </div>
        ) : (
          <div className="text-[10px] font-semibold text-slate-500 uppercase tracking-wide">Scheduled</div>
        )}
      </div>
      <TeamLabel team={home} leagueId={leagueId} align="right" />
    </div>
  );
}

export default async function SchedulePage({ searchParams }) {
  const sp = await searchParams;
  const leagueId = sp.league || DEFAULT_LEAGUE_ID;

  const [standingsExport, options] = await Promise.all([
    getLatestExport({ username: USERNAME, leagueId, exportType: "standings" }),
    getScheduleWeekOptions({ username: USERNAME, leagueId }),
  ]);

  if (!standingsExport || options.length === 0) {
    return (
      <div className="min-h-screen bg-slate-950 text-slate-100 flex items-center justify-center p-10 text-center">
        <div className="text-sm text-slate-500">No schedule data yet.</div>
      </div>
    );
  }

  const requestedWeek = sp.week ? Number(sp.week) : null;
  const current = options.find((o) => o.real_week === requestedWeek) || options[options.length - 1];

  const weekData = await getScheduleForWeek({ username: USERNAME, leagueId, realWeek: current.real_week });

  const teams = standingsExport.payload.teamStandingInfoList;
  const teamsById = {};
  for (const t of teams) teamsById[t.teamId] = t;

  const games = weekData?.payload?.gameScheduleInfoList || [];

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100">
      <div className="max-w-[900px] mx-auto px-6 py-7">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-bold text-slate-50 tracking-tight">Schedule</h1>
          <Link href={`/?league=${leagueId}`} className="text-xs text-slate-500 hover:text-slate-300 transition-colors">
            ← Back to overview
          </Link>
        </div>

        <div className="mb-5">
          <WeekSelector options={options} current={current} leagueId={leagueId} />
        </div>

        {games.length === 0 ? (
          <div className="text-sm text-slate-500 px-1">No games found for this week.</div>
        ) : (
          <div className="bg-slate-900/50 rounded-xl border border-slate-800/80 shadow-sm shadow-black/20 overflow-hidden">
            {games.map((g) => (
              <GameRow key={g.scheduleId} game={g} teamsById={teamsById} leagueId={leagueId} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
