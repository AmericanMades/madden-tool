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

// Gets the most recent roster export for one specific team. Roster
// exports are saved with export_type = "team_roster" and a team_id
// matching the team's Madden teamId.
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
