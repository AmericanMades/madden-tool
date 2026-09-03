// app/team/[teamId]/page.js
//
// Now pulls real roster data when available (getLatestRosterExport),
// falling back to placeholders for teams that don't have a roster
// export saved yet.
//
// One field choice worth flagging: there's no single field plainly
// named "overall" in the real roster payload — the closest
// candidates are playerSchemeOvr, teamSchemeOvr, and playerBestOvr
// (career best). Using playerSchemeOvr as the "OVR" shown throughout
// since it reads as the closest analog to a current rating, but this
// is an inferred choice, not a confirmed field name — worth
// double-checking against what the in-game roster screen shows for
// a specific player if it looks off.

import Link from "next/link";
import { getLatestExport, getLatestRosterExport } from "../../../lib/db";
import { decodeStreak, TEAM_COLORS } from "../../../lib/madden";

const USERNAME = "taylor";
const LEAGUE_ID = "2207259";

const OFFENSE_POS = ["QB", "HB", "FB", "WR", "TE", "LT", "LG", "C", "RG", "RT"];
const DEFENSE_POS = ["LEDG", "REDG", "DT", "MIKE", "SAM", "WILL", "CB", "FS", "SS"];
const SPECIAL_POS = ["K", "P", "LS"];

function classifyPosition(pos) {
  if (OFFENSE_POS.includes(pos)) return "Offense";
  if (DEFENSE_POS.includes(pos)) return "Defense";
  if (SPECIAL_POS.includes(pos)) return "Special Teams";
  return "Other";
}

function playerStatusBadge(p) {
  if (p.isOnIR) return { label: "IR", color: "bg-rose-500/15 text-rose-400" };
  if (p.isOnPracticeSquad) return { label: "PS", color: "bg-amber-500/15 text-amber-400" };
  if (p.isFreeAgent) return { label: "FA", color: "bg-slate-500/15 text-slate-400" };
  return null;
}

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

function CornerstonesPanel({ players }) {
  const top = [...players].filter((p) => !p.isFreeAgent).sort((a, b) => b.playerSchemeOvr - a.playerSchemeOvr).slice(0, 8);
  return (
    <div>
      <div className="text-[11px] font-semibold text-slate-500 uppercase tracking-wide mb-1.5 px-1">Franchise Cornerstones</div>
      <div className="bg-slate-900/60 rounded-lg border border-slate-800 overflow-hidden">
        {top.map((p, i) => (
          <div key={p.rosterId} className={`flex items-center gap-2 px-3 py-1.5 text-sm ${i !== top.length - 1 ? "border-b border-slate-800/60" : ""}`}>
            <span className="text-slate-600 tabular-nums text-xs w-4">{i + 1}</span>
            <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded bg-slate-800 text-slate-400 w-9 text-center flex-shrink-0">{p.position}</span>
            <span className="text-slate-200 font-medium flex-1 truncate">{p.firstName} {p.lastName}</span>
            <span className="text-slate-500 text-xs">Age {p.age}</span>
            <span className="text-slate-100 font-bold tabular-nums w-7 text-right">{p.playerSchemeOvr}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

function ContractWatchPanel({ players }) {
  const watch = [...players]
    .filter((p) => !p.isFreeAgent && p.contractYearsLeft <= 1 && p.contractSalary > 0)
    .sort((a, b) => b.capHit - a.capHit)
    .slice(0, 8);
  if (watch.length === 0) return <PlaceholderPanel title="Contract Watch" note="No contracts expiring within a year." />;
  return (
    <div>
      <div className="text-[11px] font-semibold text-slate-500 uppercase tracking-wide mb-1.5 px-1">Contract Watch — Expiring Soon</div>
      <div className="bg-slate-900/60 rounded-lg border border-slate-800 overflow-hidden">
        {watch.map((p, i) => (
          <div key={p.rosterId} className={`flex items-center gap-2 px-3 py-1.5 text-sm ${i !== watch.length - 1 ? "border-b border-slate-800/60" : ""}`}>
            <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded bg-slate-800 text-slate-400 w-9 text-center flex-shrink-0">{p.position}</span>
            <span className="text-slate-200 font-medium flex-1 truncate">{p.firstName} {p.lastName}</span>
            <span className="text-amber-400 text-[10px] font-semibold px-1.5 py-0.5 rounded bg-amber-500/15">{p.contractYearsLeft}Y LEFT</span>
            <span className="text-slate-100 tabular-nums text-xs w-16 text-right">${(p.contractSalary / 1000000).toFixed(1)}M</span>
          </div>
        ))}
      </div>
    </div>
  );
}

function RosterSection({ players }) {
  const grouped = { Offense: {}, Defense: {}, "Special Teams": {} };
  for (const p of players) {
    const broad = classifyPosition(p.position);
    if (broad === "Other") continue;
    if (!grouped[broad][p.position]) grouped[broad][p.position] = [];
    grouped[broad][p.position].push(p);
  }

  return (
    <div>
      <div className="text-[11px] font-semibold text-slate-500 uppercase tracking-wide mb-1.5 px-1">Roster</div>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {Object.entries(grouped).map(([group, positions]) => (
          <div key={group}>
            <div className="text-xs font-semibold text-slate-400 mb-2">{group}</div>
            <div className="space-y-2">
              {Object.entries(positions).map(([pos, list]) => (
                <div key={pos} className="bg-slate-900/60 rounded-lg border border-slate-800 overflow-hidden">
                  <div className="bg-slate-800/60 px-2 py-1 text-[10px] font-bold text-slate-400">{pos}</div>
                  {list
                    .sort((a, b) => b.playerSchemeOvr - a.playerSchemeOvr)
                    .map((p, i, arr) => {
                      const badge = playerStatusBadge(p);
                      return (
                        <div
                          key={p.rosterId}
                          className={`flex items-center gap-1.5 px-2 py-1 text-xs ${i !== arr.length - 1 ? "border-b border-slate-800/40" : ""}`}
                        >
                          <span className="text-slate-600 w-6 flex-shrink-0">#{p.jerseyNum}</span>
                          <span className="text-slate-200 font-medium truncate flex-1">
                            {p.firstName} {p.lastName}
                          </span>
                          {badge && (
                            <span className={`text-[9px] font-bold px-1 rounded ${badge.color}`}>{badge.label}</span>
                          )}
                          <span className="text-slate-400 tabular-nums w-6 text-right">{p.playerSchemeOvr}</span>
                        </div>
                      );
                    })}
                </div>
              ))}
            </div>
          </div>
        ))}
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

  const rosterExport = await getLatestRosterExport({ username: USERNAME, leagueId: LEAGUE_ID, teamId });
  const players = rosterExport?.payload?.rosterInfoList ?? null;

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
              <span className="text-[10px] font-semibold px-2 py-0.5 rounded bg-slate-800 text-slate-300">{team.conferenceName}</span>
              <span className="text-[10px] font-semibold px-2 py-0.5 rounded bg-slate-800 text-slate-300">{team.divisionName}</span>
              {team.seed > 0 && (
                <span className="text-[10px] font-semibold px-2 py-0.5 rounded bg-sky-500/20 text-sky-400">Seed #{team.seed}</span>
              )}
              {team.playoffStatus === 1 && (
                <span className="text-[10px] font-semibold px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-400">In Playoff Position</span>
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
              <div className="h-full rounded-full" style={{ width: `${Math.min(capPct ?? 0, 100)}%`, backgroundColor: color }} />
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

        {players ? (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5 mb-6">
              <CornerstonesPanel players={players} />
              <ContractWatchPanel players={players} />
            </div>
            <RosterSection players={players} />
          </>
        ) : (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5 mb-6">
              <PlaceholderPanel title="Franchise Cornerstones" note="No roster export saved for this team yet." />
              <PlaceholderPanel title="Contract Watch" note="No roster export saved for this team yet." />
            </div>
            <PlaceholderPanel title="Roster" note="No roster export saved for this team yet — trigger one from the Companion App for this specific team." />
          </>
        )}
      </div>
    </div>
  );
}
