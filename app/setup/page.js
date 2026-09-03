"use client";
// app/setup/page.js

import { Suspense, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";

function SetupPageInner() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const leagueId = searchParams.get("league");

  const [teams, setTeams] = useState(null);
  const [label, setLabel] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!leagueId) return;
    fetch(`/api/league-teams?league=${leagueId}`)
      .then((r) => r.json())
      .then((d) => setTeams(d.teams || []))
      .catch(() => setTeams([]));
  }, [leagueId]);

  async function pickTeam(team) {
    setSaving(true);
    await fetch("/api/league-settings", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        leagueId,
        teamId: team.teamId,
        teamName: team.teamName,
        label: label.trim() || leagueId,
      }),
    });
    router.push(`/?league=${leagueId}`);
  }

  if (!leagueId) {
    return (
      <div className="min-h-screen bg-slate-950 text-slate-100 flex items-center justify-center p-10 text-center text-sm text-slate-500">
        No league specified.
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100">
      <div className="max-w-[600px] mx-auto px-6 py-10">
        <h1 className="text-xl font-bold mb-1">Set up this league</h1>
        <p className="text-sm text-slate-500 mb-6">League ID: {leagueId}</p>

        <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1.5">
          League name (optional)
        </label>
        <input
          type="text"
          value={label}
          onChange={(e) => setLabel(e.target.value)}
          placeholder={leagueId}
          className="w-full mb-6 bg-slate-900 border border-slate-800 rounded-lg px-3 py-2 text-sm text-slate-100 placeholder:text-slate-600"
        />

        <div className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-2">Which team is yours?</div>

        {teams === null && <div className="text-sm text-slate-500">Loading teams…</div>}
        {teams && teams.length === 0 && (
          <div className="text-sm text-slate-500">No standings export found yet for this league.</div>
        )}

        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
          {teams &&
            teams.map((t) => (
              <button
                key={t.teamId}
                disabled={saving}
                onClick={() => pickTeam(t)}
                className="text-left px-3 py-2 rounded-lg bg-slate-900/60 border border-slate-800 text-sm text-slate-200 hover:border-sky-500 hover:bg-slate-900 disabled:opacity-50"
              >
                {t.teamName}
              </button>
            ))}
        </div>
      </div>
    </div>
  );
}

export default function SetupPage() {
  return (
    <Suspense fallback={null}>
      <SetupPageInner />
    </Suspense>
  );
}
