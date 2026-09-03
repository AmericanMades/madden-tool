// app/player/[teamId]/[rosterId]/page.js

import Link from "next/link";
import { getLatestRosterExport } from "../../../../lib/db";

const USERNAME = "taylor";
const DEFAULT_LEAGUE_ID = "2207259";

const DEV_TRAIT_LABELS = { 0: "Normal", 1: "Star", 2: "Superstar", 3: "X-Factor" };

function AttrRow({ label, value }) {
  return (
    <div className="flex items-center justify-between py-1 text-sm">
      <span className="text-slate-400">{label}</span>
      <span className="text-slate-100 font-semibold tabular-nums">{value}</span>
    </div>
  );
}

function AttrCard({ title, rows }) {
  return (
    <div className="bg-slate-900/50 rounded-xl border border-slate-800/80 shadow-sm shadow-black/20 p-3.5">
      <div className="text-[10px] font-semibold text-slate-500 uppercase tracking-wide mb-2">{title}</div>
      {rows.map(([label, value]) => (
        <AttrRow key={label} label={label} value={value} />
      ))}
    </div>
  );
}

function InfoRow({ label, value }) {
  return (
    <div className="flex items-center justify-between px-3 py-2 border-b border-slate-800/50 last:border-0 text-sm">
      <span className="text-slate-400">{label}</span>
      <span className="text-slate-100 font-semibold">{value}</span>
    </div>
  );
}

export default async function PlayerPage({ params, searchParams }) {
  const { teamId, rosterId } = await params;
  const sp = await searchParams;
  const leagueId = sp.league || DEFAULT_LEAGUE_ID;

  const rosterExport = await getLatestRosterExport({ username: USERNAME, leagueId, teamId });
  const players = rosterExport?.payload?.rosterInfoList ?? [];
  const p = players.find((pl) => String(pl.rosterId) === String(rosterId));

  if (!p) {
    return (
      <div className="min-h-screen bg-slate-950 text-slate-100 flex items-center justify-center p-10 text-center">
        <div>
          <div className="text-lg font-semibold mb-2">Player not found</div>
          <Link href={`/team/${teamId}?league=${leagueId}`} className="text-amber-400 text-sm hover:underline">
            ← Back to team
          </Link>
        </div>
      </div>
    );
  }

  const abilities = (p.signatureSlotList || []).filter((s) => !s.isEmpty && s.signatureAbility?.signatureTitle);
  const draftText = p.draftPick > 0 ? `Round ${p.draftRound}, Pick ${p.draftPick}` : "Undrafted";

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100">
      <div className="max-w-[1000px] mx-auto px-6 py-7">
        <Link
          href={`/team/${teamId}?league=${leagueId}`}
          className="text-xs text-slate-500 hover:text-slate-300 mb-4 inline-block transition-colors"
        >
          ← Back to team
        </Link>

        <div className="flex items-center gap-4 mb-7 bg-slate-900/50 border border-slate-800/80 shadow-sm shadow-black/20 rounded-2xl p-6">
          <div className="w-16 h-16 rounded-xl flex items-center justify-center text-lg font-bold text-white flex-shrink-0 bg-slate-800 shadow-sm">
            {p.position}
          </div>
          <div className="flex-1 min-w-0">
            <div className="text-[11px] font-semibold text-slate-500 mb-0.5 tracking-wide">
              {p.position} #{p.jerseyNum}
            </div>
            <h1 className="text-2xl font-bold text-slate-50 truncate tracking-tight">
              {p.firstName} {p.lastName}
            </h1>
            <div className="flex items-center gap-1.5 flex-wrap mt-2">
              {p.isOnIR && <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-rose-500/15 text-rose-400">IR</span>}
              {p.isOnPracticeSquad && (
                <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-amber-500/15 text-amber-400">Practice Squad</span>
              )}
              {p.isFreeAgent && (
                <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-slate-500/15 text-slate-400">Free Agent</span>
              )}
              {DEV_TRAIT_LABELS[p.devTrait] && p.devTrait > 0 && (
                <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-amber-500/15 text-amber-400">
                  {DEV_TRAIT_LABELS[p.devTrait]}
                </span>
              )}
            </div>
          </div>
          <div className="text-right flex-shrink-0">
            <div className="text-[10px] font-semibold text-slate-500 uppercase tracking-wide">Overall</div>
            <div className="text-4xl font-bold tabular-nums text-slate-50 tracking-tight">{p.playerSchemeOvr}</div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-5 mb-7">
          <div>
            <div className="text-[11px] font-semibold text-slate-500 uppercase tracking-wide mb-1.5 px-1">Details</div>
            <div className="bg-slate-900/50 rounded-xl border border-slate-800/80 shadow-sm shadow-black/20 overflow-hidden">
              <InfoRow label="Age" value={p.age} />
              <InfoRow label="Height / Weight" value={`${Math.floor(p.height / 12)}'${p.height % 12}", ${p.weight} lbs`} />
              <InfoRow label="College" value={p.college} />
              <InfoRow label="Years Pro" value={p.yearsPro} />
              <InfoRow label="Rookie Year" value={p.rookieYear} />
              <InfoRow label="Draft" value={draftText} />
              <InfoRow label="Hometown" value={p.homeTown} />
            </div>
          </div>

          <div className="md:col-span-2">
            <div className="text-[11px] font-semibold text-slate-500 uppercase tracking-wide mb-1.5 px-1">Contract</div>
            <div className="bg-slate-900/50 rounded-xl border border-slate-800/80 shadow-sm shadow-black/20 overflow-hidden grid grid-cols-2">
              <InfoRow label="Cap Hit" value={`$${(p.capHit * 1000).toLocaleString()}`} />
              <InfoRow label="Salary" value={`$${(p.contractSalary / 1000000).toFixed(2)}M`} />
              <InfoRow label="Bonus" value={`$${(p.contractBonus / 1000000).toFixed(2)}M`} />
              <InfoRow label="Years Left / Length" value={`${p.contractYearsLeft} / ${p.contractLength}`} />
              <InfoRow label="Release Net Savings" value={`$${(p.capReleaseNetSavings / 1000000).toFixed(2)}M`} />
              <InfoRow label="Release Penalty" value={`$${(p.capReleasePenalty * 1000).toLocaleString()}`} />
            </div>
          </div>
        </div>

        {abilities.length > 0 && (
          <div className="mb-7">
            <div className="text-[11px] font-semibold text-slate-500 uppercase tracking-wide mb-1.5 px-1">Signature Abilities</div>
            <div className="bg-slate-900/50 rounded-xl border border-slate-800/80 shadow-sm shadow-black/20 divide-y divide-slate-800/50">
              {abilities.map((s, i) => (
                <div key={i} className="p-3.5">
                  <div className="text-sm font-bold text-amber-400 mb-1">{s.signatureAbility.signatureTitle}</div>
                  <div className="text-xs text-slate-400 leading-relaxed">{s.signatureAbility.signatureDescription}</div>
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="text-xs font-semibold text-slate-300 uppercase tracking-wider mb-3 px-1 flex items-center gap-2">
          <span className="w-1.5 h-1.5 rounded-full bg-amber-400" />
          Attributes
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3.5">
          <AttrCard
            title="Core"
            rows={[
              ["Speed", p.speedRating],
              ["Acceleration", p.accelRating],
              ["Agility", p.agilityRating],
              ["Strength", p.strengthRating],
              ["Awareness", p.awareRating],
              ["Jump", p.jumpRating],
              ["Stamina", p.staminaRating],
              ["Toughness", p.toughRating],
              ["Injury", p.injuryRating],
            ]}
          />
          <AttrCard
            title="Passing"
            rows={[
              ["Throw Power", p.throwPowerRating],
              ["Short Accuracy", p.throwAccShortRating],
              ["Mid Accuracy", p.throwAccMidRating],
              ["Deep Accuracy", p.throwAccDeepRating],
              ["Throw On Run", p.throwOnRunRating],
              ["Play Action", p.playActionRating],
              ["Break Sack", p.breakSackRating],
              ["Under Pressure", p.throwUnderPressureRating],
            ]}
          />
          <AttrCard
            title="Rushing"
            rows={[
              ["Carry", p.carryRating],
              ["Change of Direction", p.changeOfDirectionRating],
              ["Spin Move", p.spinMoveRating],
              ["Juke Move", p.jukeMoveRating],
              ["Break Tackle", p.breakTackleRating],
              ["Ball Carry Vision", p.bCVRating],
              ["Trucking", p.truckRating],
              ["Stiff Arm", p.stiffArmRating],
            ]}
          />
          <AttrCard
            title="Receiving"
            rows={[
              ["Catch", p.catchRating],
              ["Spectacular Catch", p.specCatchRating],
              ["Catch In Traffic", p.cITRating],
              ["Release", p.releaseRating],
              ["Short Route Running", p.routeRunShortRating],
              ["Med Route Running", p.routeRunMedRating],
              ["Deep Route Running", p.routeRunDeepRating],
              ["Kick Return", p.kickRetRating],
            ]}
          />
          <AttrCard
            title="Blocking"
            rows={[
              ["Pass Block", p.passBlockRating],
              ["Pass Block Power", p.passBlockPowerRating],
              ["Pass Block Finesse", p.passBlockFinesseRating],
              ["Run Block", p.runBlockRating],
              ["Run Block Power", p.runBlockPowerRating],
              ["Run Block Finesse", p.runBlockFinesseRating],
              ["Lead Block", p.leadBlockRating],
              ["Impact Block", p.impactBlockRating],
            ]}
          />
          <AttrCard
            title="Defense"
            rows={[
              ["Tackle", p.tackleRating],
              ["Hit Power", p.hitPowerRating],
              ["Pursuit", p.pursuitRating],
              ["Play Recognition", p.playRecRating],
              ["Block Shedding", p.blockShedRating],
              ["Man Coverage", p.manCoverRating],
              ["Zone Coverage", p.zoneCoverRating],
              ["Press", p.pressRating],
            ]}
          />
          <AttrCard
            title="Kicking"
            rows={[
              ["Kick Power", p.kickPowerRating],
              ["Kick Accuracy", p.kickAccRating],
            ]}
          />
        </div>
      </div>
    </div>
  );
}
