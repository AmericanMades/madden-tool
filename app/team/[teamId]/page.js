// app/team/[teamId]/page.js
//
// Redesigned closer to the FHQ dashboard reference: header banner
// with conference/division/seed badges, a row of top stat cards, and
// a cap usage bar — all built from confirmed real standings fields.
//
// Deliberately NOT included (unlike the reference): "Franchise
// Cornerstones" (top players) and "Contract Watch" (player contract
// list) need real player-level data we don't have confirmed yet —
// shown as honest placeholders instead of fabricated content. Same
// for "DIVISION CLINCHED"-style badges — a genuine clinch requires
// remaining-schedule + tiebreaker logic we don't have; the
// playoffStatus field only tells us CURRENT position, not a
// mathematical clinch, so that's worded carefully below.

import Link from "next/link";
import { getLatestExport } from "../../../lib/db";
import { decodeStreak, TEAM_COLORS } from "../../../lib/madden";

const USERNAME = "taylor";
const LEAGUE_ID = "2207259";

function StatRow({ label, value, rank }) {
  return (
    <div className="flex items-center justify-between px-3 py-1.5 border-b border-slate-800/60 last:border-0 text-sm">
      <span className="text-slate-400">{label}</span>
      <span className="flex items-center gap-2">
        <span className="text-slate-100 font-medium tabular-nums">{value}</span>
        {rank != null && <span className="text-[10px] text-slate-500 tabular-nums">#{rank}</span>}
      </span>
    </div>
  );
}

function StatCard({ title, children }) {
  return (
    <div>
      <div className="text-[11px] font-semibold text-slate-500 uppercase tracking-wide mb-1.5 px-1">{title}</div>
      <div className="bg-slate-900/60 rounded-lg border border-slate-800 overflow-hidden">{children}</div>
    </div>
  );
}

function SummaryTile({ label, value, sub }) {
  return (
    <div className="bg-slate-900/60 rounded-lg border border-slate-800 p-3">
      <div className="text-[10px] font-semibold text-slate-500 uppercase tracking-wide mb-1">{label}</div>
      <div className="text-2xl font-bold text-slate-100 tabular-nums">{value}</div>
      {sub && <div className="text-[11px] text-slate-500 mt-0.5">{sub}</div>}
    </div>
  );
}

function PlaceholderPanel({ title, note }) {
  return (
    <div>
      <div className="text-[11px] font-semibold text-slate-500 uppercase tracking-wide mb-1.5 px-1">{title}</div>
      <div className="bg-slate-900/60 rounded-lg border border-dashed border-slate-800 p-6 text-center text-sm text-slate-600 italic">
        {note}
      </div>
    </div>
  );
}

export default async function TeamPage({ params }) {
  const { teamId } = await params;

  const latest = await getLatestExport({ username: USERNAME, leagueId: LEAGUE_ID, exportType: "standings" });

  if (!latest) {
    return (
      <div className="min-h-screen bg-slate-950 text-slate-100 flex items-center justify-center p-10 text-center">
        <div className="text-sm text-slate-500">No standings data yet.</div>
      </div>
    );
  }

  const teams = latest.payload.teamStandingInfoList;
  const team = teams.find((t) => String(t.teamId) === String(teamId));

  if (!team) {
    return (
      <div className="min-h-screen bg-slate-950 text-slate-100 flex items-center justify-center p-10 text-center">
        <div>
          <div className="text-lg font-semibold mb-2">Team not found</div>
          <Link href="/" className="text-sky-400 text-sm hover:underline">
            Back to overview
          </Link>
        </div>
      </div>
    );
  }

  const color = TEAM_COLORS[team.teamName] || "#64748B";
  const streak = decodeStreak(team.winLossStreak);
  const capPct = team.capRoom ? Math.round((team.capSpent / team.capRoom) * 100) : null;

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100">
      <div className="max-w-[1100px] mx-auto px-6 py-6">
        <Link href="/" className="text-xs text-slate-500 hover:text-slate-300 mb-4 inline-block">
          ← Back to overview
        </Link>

        <div
          className="rounded-xl p-5 mb-5 flex items-center justify-between"
          style={{ backgroundColor: `${color}22`, border: `1px solid ${color}55` }}
        >
          <div>
            <div className="flex items-center gap-2 mb-2">
              <span className="w-3 h-3 rounded-full" style={{ backgroundColor: color }} />
              <h1 className="text-2xl font-bold text-slate-100">{team.teamName}</h1>
            </div>
            <div className="flex items-center gap-1.5 flex-wrap">
              <span className="text-[10px] font-semibold px-2 py-0.5 rounded bg-slate-800 text-slate-300">
                {team.conferenceName}
              </span>
              <span className="text-[10px] font-semibold px-2 py-0.5 rounded bg-slate-800 text-slate-300">
                {team.divisionName}
              </span>
              {team.seed > 0 && (
                <span className="text-[10px] font-semibold px-2 py-0.5 rounded bg-sky-500/20 text-sky-400">
                  Seed #{team.seed}
                </span>
              )}
              {team.playoffStatus === 1 && (
                <span className="text-[10px] font-semibold px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-400">
                  In Playoff Position
                </span>
              )}
            </div>
          </div>
          <div className="text-right">
            <div className="text-3xl font-bold tabular-nums text-slate-100">
              {team.totalWins}-{team.totalLosses}
              {team.totalTies > 0 ? `-${team.totalTies}` : ""}
            </div>
            {streak && (
              <span
                className={`text-xs font-semibold px-1.5 py-0.5 rounded inline-block mt-1 ${
                  streak.type === "W" ? "bg-emerald-500/15 text-emerald-400" : "bg-rose-500/15 text-rose-400"
                }`}
              >
                {streak.label}
              </span>
            )}
          </div>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
          <SummaryTile label="Team OVR" value={team.teamOvr} sub={`League rank #${team.rank}`} />
          <SummaryTile label="Record" value={`${team.totalWins}-${team.totalLosses}`} sub={team.divisionName} />
          <SummaryTile
            label="Cap Space"
            value={`$${(team.capAvailable / 1000000).toFixed(1)}M`}
            sub={capPct != null ? `${capPct}% used` : undefined}
          />
          <SummaryTile label="Turnover Diff." value={team.tODiff > 0 ? `+${team.tODiff}` : team.tODiff} />
        </div>

        <div className="mb-6">
          <div className="text-[11px] font-semibold text-slate-500 uppercase tracking-wide mb-1.5 px-1">Cap Usage</div>
          <div className="bg-slate-900/60 rounded-lg border border-slate-800 p-4">
            <div className="flex items-center justify-between text-sm mb-2">
              <span className="text-slate-400">
                Spent <span className="text-slate-100 font-medium">${(team.capSpent / 1000000).toFixed(2)}M</span>
              </span>
              <span className="text-slate-400">
                Total <span className="text-slate-100 font-medium">${(team.capRoom / 1000000).toFixed(2)}M</span>
              </span>
            </div>
            <div className="h-2 rounded-full bg-slate-800 overflow-hidden">
              <div
                className="h-full rounded-full"
                style={{ width: `${Math.min(capPct ?? 0, 100)}%`, backgroundColor: color }}
              />
            </div>
            <div className="text-[11px] text-slate-500 mt-1.5">
              Available: <span className="text-slate-300">${(team.capAvailable / 1000000).toFixed(2)}M</span>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-5 mb-6">
          <StatCard title="Offense">
            <StatRow label="Total Yards" value={team.offTotalYds} rank={team.offTotalYdsRank} />
            <StatRow label="Passing Yards" value={team.offPassYds} rank={team.offPassYdsRank} />
            <StatRow label="Rushing Yards" value={team.offRushYds} rank={team.offRushYdsRank} />
            <StatRow label="Points For" value={team.ptsFor} rank={team.ptsForRank} />
          </StatCard>

          <StatCard title="Defense">
            <StatRow label="Total Yards Allowed" value={team.defTotalYds} rank={team.defTotalYdsRank} />
            <StatRow label="Passing Yards Allowed" value={team.defPassYds} rank={team.defPassYdsRank} />
            <StatRow label="Rushing Yards Allowed" value={team.defRushYds} rank={team.defRushYdsRank} />
            <StatRow label="Points Against" value={team.ptsAgainst} rank={team.ptsAgainstRank} />
          </StatCard>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-5 mb-6">
          <StatCard title="Record Splits">
            <StatRow label="Home" value={`${team.homeWins}-${team.homeLosses}${team.homeTies > 0 ? `-${team.homeTies}` : ""}`} />
            <StatRow label="Away" value={`${team.awayWins}-${team.awayLosses}${team.awayTies > 0 ? `-${team.awayTies}` : ""}`} />
            <StatRow label="Division" value={`${team.divWins}-${team.divLosses}${team.divTies > 0 ? `-${team.divTies}` : ""}`} />
            <StatRow label="Conference" value={`${team.confWins}-${team.confLosses}${team.confTies > 0 ? `-${team.confTies}` : ""}`} />
          </StatCard>

          <div className="md:col-span-2">
            <PlaceholderPanel
              title="Franchise Cornerstones"
              note="Awaiting a roster-type export — top players by rating will show here once that data is confirmed."
            />
          </div>
        </div>

        <PlaceholderPanel
          title="Contract Watch"
          note="Awaiting a roster-type export — expiring/notable contracts will show here once that data is confirmed."
        />

        <div className="mt-6">
          <PlaceholderPanel title="Roster" note="Awaiting a roster-type export — full roster will show here once that data is confirmed." />
        </div>
      </div>
    </div>
  );
}
