// lib/db.js
//
// Connection helper using Neon's serverless driver, which is built
// specifically to work well in Vercel's serverless functions (unlike
// a traditional long-lived Postgres connection pool, which doesn't
// suit an environment where each request can be a fresh instance).

import { neon } from "@neondatabase/serverless";

export const sql = neon(process.env.DATABASE_URL);

// Saves one incoming export. Call this from the export route after
// parsing the request.
export async function saveExport({
  username,
  platform,
  leagueId,
  exportType,
  seasonType,
  week,
  statType,
  payload,
}) {
  await sql`
    INSERT INTO madden_exports
      (username, platform, league_id, export_type, season_type, week, stat_type, payload)
    VALUES
      (${username}, ${platform}, ${leagueId}, ${exportType}, ${seasonType}, ${week}, ${statType}, ${JSON.stringify(payload)})
  `;
}

// Gets the most recent export of a given type for a league (e.g.
// the latest standings). Returns null if none exists yet.
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
