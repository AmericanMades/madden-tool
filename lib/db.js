// lib/db.js

import { neon } from "@neondatabase/serverless";

export const sql = neon(process.env.DATABASE_URL);

export async function saveExport({
  username,
  platform,
  leagueId,
  exportType,
  seasonType,
  week,
  statType,
  teamId,
  payload,
}) {
  await sql`
    INSERT INTO madden_exports
      (username, platform, league_id, export_type, season_type, week, stat_type, team_id, payload)
    VALUES
      (${username}, ${platform}, ${leagueId}, ${exportType}, ${seasonType}, ${week}, ${statType}, ${teamId}, ${JSON.stringify(payload)})
  `;
}

export async function getLatestExport({ username, leagueId, exportType }) {
  const rows = await sql`
    SELECT payload, received_at, week
    FROM madden_exports
    WHERE username = ${username}
      AND league_id = ${leagueId}
      AND export_type = ${exportType}
    ORDER BY received_at DESC
    LIMIT 1
  `;
  return rows[0] ?? null;
}

export async function getLatestRosterExport({ username, leagueId, teamId }) {
  const rows = await sql`
    SELECT payload, received_at
    FROM madden_exports
    WHERE username = ${username}
      AND league_id = ${leagueId}
      AND team_id = ${String(teamId)}
      AND export_type = 'team_roster'
    ORDER BY received_at DESC
    LIMIT 1
  `;
  return rows[0] ?? null;
}

export async function getAllWeeksForExportType({ username, leagueId, exportType }) {
  const rows = await sql`
    SELECT DISTINCT ON (week) week, payload, received_at
    FROM madden_exports
    WHERE username = ${username}
      AND league_id = ${leagueId}
      AND export_type = ${exportType}
    ORDER BY week, received_at DESC
  `;
  return rows.sort((a, b) => Number(a.week) - Number(b.week));
}

// Every league this user has ever exported data for, with its label
// and "my team" setting joined in from league_settings (if set — a
// league with no settings row yet just shows no label/team).
// A single league's settings (my team, label) — used by pages that
// only need one league's info, rather than the full list.
export async function getLeagueSettings({ username, leagueId }) {
  const rows = await sql`
    SELECT my_team_id, league_label
    FROM league_settings
    WHERE username = ${username} AND league_id = ${leagueId}
  `;
  return rows[0] ?? null;
}

export async function getLeaguesForUser(username) {
  const rows = await sql`
    SELECT DISTINCT m.league_id, m.platform
    FROM madden_exports m
    WHERE m.username = ${username}
    ORDER BY m.league_id
  `;
  const settings = await sql`
    SELECT league_id, my_team_id, league_label
    FROM league_settings
    WHERE username = ${username}
  `;
  const settingsByLeague = {};
  for (const s of settings) settingsByLeague[s.league_id] = s;

  return rows.map((r) => ({
    leagueId: r.league_id,
    platform: r.platform,
    myTeamId: settingsByLeague[r.league_id]?.my_team_id ?? null,
    label: settingsByLeague[r.league_id]?.league_label ?? r.league_id,
  }));
}
