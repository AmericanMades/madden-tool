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

// Weekly export types (schedules, passing, rushing, etc.) all share
// ONE export_type value — only the `week` column tells them apart.
// Returns the most recent snapshot for EACH distinct week, so a
// season-wide view gets every week instead of only whichever one was
// exported most recently.
export async function getAllWeeksForExportType({ username, leagueId, exportType }) {
  const rows = await sql`
    SELECT DISTINCT ON (week) week, payload, received_at
    FROM madden_exports
    WHERE username = ${username}
      AND league_id = ${leagueId}
      AND export_type = ${exportType}
    ORDER BY week, received_at DESC
  `;
  // week is stored as text, so DISTINCT ON's sort can put "10" before
  // "2" — re-sort numerically here.
  return rows.sort((a, b) => Number(a.week) - Number(b.week));
}
