// app/page.js
//
// Team names are now links to /team/[teamId].

import Link from "next/link";
import { getLatestExport } from "../lib/db";
import { decodeStreak, groupByDivision, getPlayoffRace, TEAM_COLORS } from "../lib/madden";

const USERNAME = "taylor";
const LEAGUE_ID = "2207259";

const DIVISION_ORDER = ["AFC East", "AFC North", "AFC South", "AFC West", "NFC East", "NFC North", "NFC South", "NFC West"];

function TeamDot({ name }) {
  const color = TEAM_COLORS[name] || "#64748B";
  return <span className="inline-block w-2 h-2 rounded-full flex-shrink-0" style={{ backgroundColor: color }} />;
}

function StreakBadge({ value }) {
  const streak = decodeStreak(value);
  if (!streak) return null;
  return (
    <span
      className={`text-[10px] font-semibold px-1.5 py-0.5 rounded ${
        streak.type === "W" ? "bg-emerald-500/15 text-emerald-400" : "bg-rose-500/15 text-rose-400"
      }`}
    >
      {streak.label}
    </span>
  );
}

function TeamLink({ team }) {
  return (
    <Link href={`/team/${team.teamId}`} className="flex items-center gap-1.5 min-w-0 hover:underline">
      <TeamDot name={team.teamName} />
      <span className="text-slate-200 font-medium truncate">{team.teamName}</span>
    </Link>
  );
}

function PlayoffRaceTable({ conference, teams }) {
  const race = getPlayoffRace(teams, conference, 10);
  return (
    <div>
      <div className="text-xs font-semibold text-slate-400 uppercase tracking-wide mb-2 px-1 flex items-center gap-2">
        <span className="w-1.5 h-1.5 rounded-full bg-sky-500" />
        {conference} Playoff Race
      </div>
      <div className="bg-slate-900/60 rounded-lg border border-slate-800 overflow-hidden">
        <div className="grid grid-cols-[28px_1fr_32px_32px_32px] gap-2 px-3 py-1.5 text-[10px] text-slate-500 uppercase tracking-wide border-b border-slate-800">
          <span>Seed</span>
          <span>Team</span>
          <span className="text-right">W</span>
          <span className="text-right">L</span>
          <span className="text-right">T</span>
        </div>
        {race.map((t, i) => (
          <div
            key={t.teamId}
            className={`grid grid-cols-[28px_1fr_32px_32px_32px] gap-2 items-center px-3 py-1.5 text-sm ${
              i !== race.length - 1 ? "border-b border-slate-800/60" : ""
            } ${i >= 7 ? "opacity-50" : ""}`}
          >
            <span className="text-slate-500 tabular-nums text-xs">{t.seed}</span>
            <TeamLink team={t} />
            <span className="text-slate-300 tabular-nums text-right text-xs">{t.totalWins}</span>
            <span className="text-slate-300 tabular-nums text-right text-xs">{t.totalLosses}</span>
            <span className="text-slate-300 tabular-nums text-right text-xs">{t.totalTies}</span>
          </div>
        ))}
      </div>
      <div className="text-[10px] text-slate-600 mt-1 px-1">Seeds 1-7 make the playoffs</div>
    </div>
  );
}

function DivisionTable({ divisionName, teams }) {
  return (
    <div className="mb-4">
      <div className="text-[11px] font-semibold text-slate-500 uppercase tracking-wide mb-1.5 px-1">
        {divisionName}
      </div>
      <div className="bg-slate-900/60 rounded-lg border border-slate-800 overflow-hidden">
        <div className="grid grid-cols-[1fr_auto_28px_28px_28px] gap-2 px-3 py-1 text-[10px] text-slate-500 uppercase tracking-wide border-b border-slate-800">
          <span>Team</span>
          <span></span>
          <span className="text-right">W</span>
          <span className="text-right">L</span>
          <span className="text-right">T</span>
        </div>
        {teams.map((t, i) => (
          <div
            key={t.teamId}
            className={`grid grid-cols-[1fr_auto_28px_28px_28px] gap-2 items-center px-3 py-1.5 text-sm ${
              i !== teams.length - 1 ? "border-b border-slate-800/60" : ""
            }`}
          >
            <TeamLink team={t} />
            <StreakBadge value={t.winLossStreak} />
            <span className="text-slate-300 tabular-nums text-right text-xs">{t.totalWins}</span>
            <span className="text-slate-300 tabular-nums text-right text-xs">{t.totalLosses}</span>
            <span className="text-slate-300 tabular-nums text-right text-xs">{t.totalTies}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

function StandingsColumn({ conference, divisions }) {
  const divisionsInOrder = DIVISION_ORDER.filter((d) => d.startsWith(conference) && divisions[d]);
  return (
    <div>
      <div className="text-xs font-semibold text-slate-400 uppercase tracking-wide mb-3 px-1 flex items-center gap-2">
        <span className="w-1.5 h-1.5 rounded-full bg-sky-500" />
        {conference} Standings
      </div>
      {divisionsInOrder.map((d) => (
        <DivisionTable key={d} divisionName={d} teams={divisions[d]} />
      ))}
    </div>
  );
}

function StatsPlaceholderSection({ title }) {
  return (
    <div className="mb-4">
      <div className="text-[11px] font-semibold text-slate-500 uppercase tracking-wide mb-1.5 px-1">{title}</div>
      <div className="bg-slate-900/60 rounded-lg border border-dashed border-slate-800 overflow-hidden">
        {[1, 2, 3, 4, 5].map((n) => (
          <div
            key={n}
            className={`flex items-center gap-2 px-3 py-1.5 text-sm ${n !== 5 ? "border-b border-slate-800/40" : ""}`}
          >
            <span className="text-slate-700 tabular-nums text-xs w-4">{n}</span>
            <span className="text-slate-700 italic flex-1">Awaiting player data</span>
            <span className="text-slate-800 tabular-nums text-xs">--</span>
          </div>
        ))}
      </div>
    </div>
  );
}

export default async function OverviewPage() {
  const latest = await getLatestExport({ username: USERNAME, leagueId: LEAGUE_ID, exportType: "standings" });

  if (!latest) {
    return (
      <div className="min-h-screen bg-slate-950 text-slate-100 flex items-center justify-center p-10 text-center">
        <div>
          <div className="text-lg font-semibold mb-2">No standings data yet</div>
          <div className="text-sm text-slate-500">
            Trigger a standings export from the Madden Companion App and this page will populate automatically.
          </div>
        </div>
      </div>
    );
  }

  const teams = latest.payload.teamStandingInfoList;
  const byDivision = groupByDivision(teams);
  const week = latest.week || teams[0]?.weekIndex || null;

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100">
      <div className="max-w-[1500px] mx-auto px-6 py-6">
        <div className="flex items-baseline justify-between mb-6">
          <h1 className="text-xl font-bold text-slate-100">League Overview</h1>
          <div className="flex items-center gap-3 text-xs text-slate-500">
            {week != null && <span>Week {week}</span>}
            <span>·</span>
            <span>Updated {new Date(latest.received_at).toLocaleString()}</span>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-[1fr_1fr_320px] gap-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 lg:col-span-2">
            <StandingsColumn conference="AFC" divisions={byDivision.AFC} />
            <StandingsColumn conference="NFC" divisions={byDivision.NFC} />
          </div>

          <div>
            <PlayoffRaceTable conference="AFC" teams={teams} />
            <div className="mt-5">
              <PlayoffRaceTable conference="NFC" teams={teams} />
            </div>

            <div className="mt-6">
              <div className="text-xs font-semibold text-slate-400 uppercase tracking-wide mb-3 px-1 flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-sky-500" />
                Stat Leaders
              </div>
              <div className="text-[10px] text-slate-600 mb-3 px-1 -mt-2">Awaiting a player-data export type</div>
              <StatsPlaceholderSection title="Passing Yards" />
              <StatsPlaceholderSection title="Rushing Yards" />
              <StatsPlaceholderSection title="Receiving Yards" />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
