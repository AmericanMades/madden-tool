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

// Every distinct (season_type, week) combo that has a schedule export,
// for building the week-selector dropdown. Doesn't include the full
// payload — just enough to populate the dropdown options.
export async function getScheduleWeekOptions({ username, leagueId }) {
  const rows = await sql`
    SELECT DISTINCT season_type, week
    FROM madden_exports
    WHERE username = ${username}
      AND league_id = ${leagueId}
      AND export_type = 'week_schedules'
  `;
  const seasonTypeOrder = { pre: 0, preseason: 0, reg: 1, regular: 1, post: 2, postseason: 2, playoffs: 2 };
  return rows.sort((a, b) => {
    const orderA = seasonTypeOrder[a.season_type] ?? 1;
    const orderB = seasonTypeOrder[b.season_type] ?? 1;
    if (orderA !== orderB) return orderA - orderB;
    return Number(a.week) - Number(b.week);
  });
}

// The latest schedule payload for one specific (season_type, week).
export async function getScheduleForWeek({ username, leagueId, seasonType, week }) {
  const rows = await sql`
    SELECT payload, received_at
    FROM madden_exports
    WHERE username = ${username}
      AND league_id = ${leagueId}
      AND export_type = 'week_schedules'
      AND season_type = ${seasonType}
      AND week = ${week}
    ORDER BY received_at DESC
    LIMIT 1
  `;
  return rows[0] ?? null;
}

export async function getLeagueSettings({ username, leagueId }) {
  const rows = await sql`
    SELECT my_team_id, my_team_name, league_label
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
    SELECT league_id, my_team_id, my_team_name, league_label
    FROM league_settings
    WHERE username = ${username}
  `;
  const settingsByLeague = {};
  for (const s of settings) settingsByLeague[s.league_id] = s;

  return rows.map((r) => ({
    leagueId: r.league_id,
    platform: r.platform,
    myTeamId: settingsByLeague[r.league_id]?.my_team_id ?? null,
    myTeamName: settingsByLeague[r.league_id]?.my_team_name ?? null,
    label: settingsByLeague[r.league_id]?.league_label ?? r.league_id,
  }));
}
