// app/page.js
//
// Overview page. Standings and playoff race are built from REAL data
// (the Week 14 standings export). The stats leaders section is a
// clearly-labeled placeholder — this export type has no player-level
// data at all, so there's nothing real to show there yet.

import standingsData from "../sample-standings.json";
import { decodeStreak, groupByDivision, getPlayoffRace, TEAM_COLORS } from "../lib/madden";

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

function DivisionTable({ divisionName, teams }) {
  return (
    <div className="mb-4">
      <div className="text-[11px] font-semibold text-slate-500 uppercase tracking-wide mb-1.5 px-1">
        {divisionName}
      </div>
      <div className="bg-slate-900/60 rounded-lg border border-slate-800 overflow-hidden">
        {teams.map((t, i) => (
          <div
            key={t.teamId}
            className={`flex items-center gap-2 px-3 py-1.5 text-sm ${i !== teams.length - 1 ? "border-b border-slate-800/60" : ""}`}
          >
            <TeamDot name={t.teamName} />
            <span className="text-slate-200 font-medium flex-1 truncate">{t.teamName}</span>
            <StreakBadge value={t.winLossStreak} />
            <span className="text-slate-400 tabular-nums w-14 text-right">
              {t.totalWins}-{t.totalLosses}{t.totalTies > 0 ? `-${t.totalTies}` : ""}
            </span>
            <span className="text-slate-500 tabular-nums w-10 text-right text-xs">{t.divWins}-{t.divLosses}</span>
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
      <div className="text-sm font-bold text-slate-300 mb-3 flex items-center justify-between px-1">
        <span>{conference}</span>
        <span className="text-[10px] font-normal text-slate-600 tabular-nums">DIV</span>
      </div>
      {divisionsInOrder.map((d) => (
        <DivisionTable key={d} divisionName={d} teams={divisions[d]} />
      ))}
    </div>
  );
}

function PlayoffRaceColumn({ conference, teams }) {
  const race = getPlayoffRace(teams, conference, 10);
  return (
    <div className="mb-5">
      <div className="text-[11px] font-semibold text-slate-500 uppercase tracking-wide mb-1.5 px-1">
        {conference} Playoff Race
      </div>
      <div className="bg-slate-900/60 rounded-lg border border-slate-800 overflow-hidden">
        {race.map((t, i) => (
          <div
            key={t.teamId}
            className={`flex items-center gap-2 px-3 py-1.5 text-sm ${i !== race.length - 1 ? "border-b border-slate-800/60" : ""} ${
              i < 7 ? "" : "opacity-60"
            }`}
          >
            <span className="text-slate-600 tabular-nums text-xs w-4">{t.seed}</span>
            <TeamDot name={t.teamName} />
            <span className="text-slate-200 font-medium flex-1 truncate">{t.teamName}</span>
            <span className="text-slate-400 tabular-nums text-xs">
              {t.totalWins}-{t.totalLosses}{t.totalTies > 0 ? `-${t.totalTies}` : ""}
            </span>
          </div>
        ))}
      </div>
      <div className="text-[10px] text-slate-600 mt-1 px-1">Seeds 1-7 make the playoffs; 8+ are on the outside</div>
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

export default function OverviewPage() {
  const teams = standingsData.teamStandingInfoList;
  const byDivision = groupByDivision(teams);
  const week = teams[0]?.weekIndex ?? null;

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100">
      <div className="max-w-[1500px] mx-auto px-6 py-6">
        <div className="flex items-baseline justify-between mb-6">
          <h1 className="text-xl font-bold text-slate-100">League Overview</h1>
          {week != null && <span className="text-xs text-slate-500">Week {week}</span>}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-[1fr_1fr_320px] gap-6">
          {/* Left: full standings, AFC + NFC */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 lg:col-span-2">
            <StandingsColumn conference="AFC" divisions={byDivision.AFC} />
            <StandingsColumn conference="NFC" divisions={byDivision.NFC} />
          </div>

          {/* Right: stats placeholder + playoff race stacked */}
          <div>
            <div className="text-sm font-bold text-slate-300 mb-3 px-1">Stat Leaders</div>
            <div className="text-[10px] text-slate-600 mb-3 px-1 -mt-2">
              Placeholder — this export type has no player data yet
            </div>
            <StatsPlaceholderSection title="Passing Yards" />
            <StatsPlaceholderSection title="Rushing Yards" />
            <StatsPlaceholderSection title="Receiving Yards" />

            <div className="mt-6">
              <PlayoffRaceColumn conference="AFC" teams={teams} />
              <PlayoffRaceColumn conference="NFC" teams={teams} />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
