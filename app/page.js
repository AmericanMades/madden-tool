// app/page.js

import Link from "next/link";
import { getLatestExport, getLeagueSettings } from "../lib/db";
import { decodeStreak, groupByDivision, getPlayoffRace, TEAM_COLORS } from "../lib/madden";

const USERNAME = "taylor";
const DEFAULT_LEAGUE_ID = "2207259";

const DIVISION_ORDER = ["AFC East", "AFC North", "AFC South", "AFC West", "NFC East", "NFC North", "NFC South", "NFC West"];

function SectionLabel({ children }) {
  return (
    <div className="text-xs font-semibold text-slate-300 uppercase tracking-wider mb-3 px-1 flex items-center gap-2">
      <span className="w-1.5 h-1.5 rounded-full bg-amber-400" />
      {children}
    </div>
  );
}

function TeamDot({ name }) {
  const color = TEAM_COLORS[name] || "#64748B";
  return <span className="inline-block w-2 h-2 rounded-full flex-shrink-0" style={{ backgroundColor: color }} />;
}

function StreakBadge({ value }) {
  const streak = decodeStreak(value);
  if (!streak) return null;
  return (
    <span
      className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${
        streak.type === "W" ? "bg-emerald-500/15 text-emerald-400" : "bg-rose-500/15 text-rose-400"
      }`}
    >
      {streak.label}
    </span>
  );
}

function TeamLink({ team, leagueId, myTeamId }) {
  const isMine = myTeamId && String(team.teamId) === String(myTeamId);
  return (
    <Link
      href={`/team/${team.teamId}?league=${leagueId}`}
      className={`flex items-center gap-1.5 min-w-0 hover:underline ${isMine ? "font-bold" : ""}`}
    >
      <TeamDot name={team.teamName} />
      <span className={`font-medium truncate ${isMine ? "text-amber-400" : "text-slate-200"}`}>{team.teamName}</span>
      {isMine && <span className="text-[9px] text-amber-500">★</span>}
    </Link>
  );
}

function PlayoffRaceTable({ conference, teams, leagueId, myTeamId }) {
  const race = getPlayoffRace(teams, conference, 10);
  return (
    <div>
      <SectionLabel>{conference} Playoff Race</SectionLabel>
      <div className="bg-slate-900/50 rounded-xl border border-slate-800/80 shadow-sm shadow-black/20 overflow-hidden">
        <div className="grid grid-cols-[28px_1fr_32px_32px_32px] gap-2 px-3 py-2 text-[10px] font-semibold text-slate-500 uppercase tracking-wide border-b border-slate-800/80">
          <span>Seed</span>
          <span>Team</span>
          <span className="text-right">W</span>
          <span className="text-right">L</span>
          <span className="text-right">T</span>
        </div>
        {race.map((t, i) => (
          <div
            key={t.teamId}
            className={`grid grid-cols-[28px_1fr_32px_32px_32px] gap-2 items-center px-3 py-2 text-sm hover:bg-slate-800/30 transition-colors ${
              i !== race.length - 1 ? "border-b border-slate-800/50" : ""
            } ${i >= 7 ? "opacity-45" : ""}`}
          >
            <span className="text-slate-500 tabular-nums text-xs font-medium">{t.seed}</span>
            <TeamLink team={t} leagueId={leagueId} myTeamId={myTeamId} />
            <span className="text-slate-300 tabular-nums text-right text-xs">{t.totalWins}</span>
            <span className="text-slate-300 tabular-nums text-right text-xs">{t.totalLosses}</span>
            <span className="text-slate-300 tabular-nums text-right text-xs">{t.totalTies}</span>
          </div>
        ))}
      </div>
      <div className="text-[11px] text-slate-600 mt-1.5 px-1">Seeds 1-7 make the playoffs</div>
    </div>
  );
}

function DivisionTable({ divisionName, teams, leagueId, myTeamId }) {
  return (
    <div className="mb-4">
      <div className="text-[11px] font-semibold text-slate-500 uppercase tracking-wide mb-1.5 px-1">{divisionName}</div>
      <div className="bg-slate-900/50 rounded-xl border border-slate-800/80 shadow-sm shadow-black/20 overflow-hidden">
        <div className="grid grid-cols-[1fr_auto_28px_28px_28px] gap-2 px-3 py-1.5 text-[10px] font-semibold text-slate-500 uppercase tracking-wide border-b border-slate-800/80">
          <span>Team</span>
          <span></span>
          <span className="text-right">W</span>
          <span className="text-right">L</span>
          <span className="text-right">T</span>
        </div>
        {teams.map((t, i) => (
          <div
            key={t.teamId}
            className={`grid grid-cols-[1fr_auto_28px_28px_28px] gap-2 items-center px-3 py-2 text-sm hover:bg-slate-800/30 transition-colors ${
              i !== teams.length - 1 ? "border-b border-slate-800/50" : ""
            }`}
          >
            <TeamLink team={t} leagueId={leagueId} myTeamId={myTeamId} />
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

function StandingsColumn({ conference, divisions, leagueId, myTeamId }) {
  const divisionsInOrder = DIVISION_ORDER.filter((d) => d.startsWith(conference) && divisions[d]);
  return (
    <div>
      <SectionLabel>{conference} Standings</SectionLabel>
      {divisionsInOrder.map((d) => (
        <DivisionTable key={d} divisionName={d} teams={divisions[d]} leagueId={leagueId} myTeamId={myTeamId} />
      ))}
    </div>
  );
}

function StatsPlaceholderSection({ title }) {
  return (
    <div className="mb-4">
      <div className="text-[11px] font-semibold text-slate-500 uppercase tracking-wide mb-1.5 px-1">{title}</div>
      <div className="bg-slate-900/40 rounded-xl border border-dashed border-slate-800 overflow-hidden">
        {[1, 2, 3, 4, 5].map((n) => (
          <div key={n} className={`flex items-center gap-2 px-3 py-1.5 text-sm ${n !== 5 ? "border-b border-slate-800/30" : ""}`}>
            <span className="text-slate-700 tabular-nums text-xs w-4">{n}</span>
            <span className="text-slate-700 italic flex-1">Awaiting player data</span>
            <span className="text-slate-800 tabular-nums text-xs">--</span>
          </div>
        ))}
      </div>
    </div>
  );
}

export default async function OverviewPage({ searchParams }) {
  const params = await searchParams;
  const leagueId = params.league || DEFAULT_LEAGUE_ID;

  const [latest, settings] = await Promise.all([
    getLatestExport({ username: USERNAME, leagueId, exportType: "standings" }),
    getLeagueSettings({ username: USERNAME, leagueId }),
  ]);

  if (!latest) {
    return (
      <div className="min-h-screen bg-slate-950 text-slate-100 flex items-center justify-center p-10 text-center">
        <div>
          <div className="text-lg font-semibold mb-2">No standings data yet</div>
          <div className="text-sm text-slate-500">Trigger a standings export and this page will populate automatically.</div>
        </div>
      </div>
    );
  }

  const teams = latest.payload.teamStandingInfoList;
  const byDivision = groupByDivision(teams);
  const week = latest.week || teams[0]?.weekIndex || null;
  const myTeamId = settings?.my_team_id ?? null;

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100">
      <div className="max-w-[1500px] mx-auto px-6 py-7">
        <div className="flex items-baseline justify-between mb-7">
          <h1 className="text-2xl font-bold text-slate-50 tracking-tight">League Overview</h1>
          <div className="flex items-center gap-3 text-xs text-slate-500">
            {week != null && <span className="font-medium text-slate-400">Week {week}</span>}
            <span className="text-slate-700">·</span>
            <span>Updated {new Date(latest.received_at).toLocaleString()}</span>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-[1fr_1fr_320px] gap-7">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-7 lg:col-span-2">
            <StandingsColumn conference="AFC" divisions={byDivision.AFC} leagueId={leagueId} myTeamId={myTeamId} />
            <StandingsColumn conference="NFC" divisions={byDivision.NFC} leagueId={leagueId} myTeamId={myTeamId} />
          </div>

          <div>
            <PlayoffRaceTable conference="AFC" teams={teams} leagueId={leagueId} myTeamId={myTeamId} />
            <div className="mt-6">
              <PlayoffRaceTable conference="NFC" teams={teams} leagueId={leagueId} myTeamId={myTeamId} />
            </div>

            <div className="mt-7">
              <SectionLabel>Stat Leaders</SectionLabel>
              <div className="text-[11px] text-slate-600 mb-3 px-1 -mt-3">Awaiting a player-data export type</div>
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
