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

// Every team's latest roster in one query — needed for league-wide
// player leaders. DISTINCT ON gives the newest roster per team.
export async function getAllRostersForLeague({ username, leagueId }) {
  const rows = await sql`
    SELECT DISTINCT ON (team_id) team_id, payload, received_at
    FROM madden_exports
    WHERE username = ${username}
      AND league_id = ${leagueId}
      AND export_type = 'team_roster'
      AND team_id IS NOT NULL
    ORDER BY team_id, received_at DESC
  `;
  return rows;
}

// Fetches every SUCCESSFUL weekly stat export (passing/rushing/
// receiving/etc — success: true, non-empty) and aggregates it into
// season totals per player. Weekly stat exports fail on EA's side
// most of the time (confirmed extensively) — this filters those
// failures out and only uses real data. Dedupes by (rosterId,
// weekIndex) using each record's own weekIndex field, since the
// export URL's week number doesn't reliably match the real week
// inside the data (confirmed: URL said week 3, real weekIndex was 2).
//
// sumFields: array of field names to sum across weeks (e.g.
// ["passYds", "passTDs", "passInts"]). Non-summed fields (fullName,
// teamId, position if present) are taken from the most recent record.
export async function getSeasonStatLeaders({ username, leagueId, exportType, listKey, sumFields }) {
  const rows = await sql`
    SELECT payload, received_at
    FROM madden_exports
    WHERE username = ${username}
      AND league_id = ${leagueId}
      AND export_type = ${exportType}
      AND payload->>'success' = 'true'
    ORDER BY received_at DESC
  `;

  // Dedupe by (rosterId, weekIndex) — keep only the first (most
  // recent, since rows are already ordered DESC) occurrence of each.
  const seenWeeks = new Set();
  const perWeekRecords = [];
  for (const row of rows) {
    const list = row.payload?.[listKey] || [];
    for (const rec of list) {
      const key = `${rec.rosterId}-${rec.weekIndex}`;
      if (seenWeeks.has(key)) continue;
      seenWeeks.add(key);
      perWeekRecords.push(rec);
    }
  }

  // Aggregate into season totals per player.
  const byPlayer = {};
  for (const rec of perWeekRecords) {
    if (!byPlayer[rec.rosterId]) {
      byPlayer[rec.rosterId] = { ...rec, weeksPlayed: 0 };
      for (const f of sumFields) byPlayer[rec.rosterId][f] = 0;
    }
    const agg = byPlayer[rec.rosterId];
    agg.weeksPlayed += 1;
    for (const f of sumFields) agg[f] += rec[f] || 0;
    // Keep the most recent record's non-summed fields (name, team).
    agg.fullName = rec.fullName;
    agg.teamId = rec.teamId;
  }

  return Object.values(byPlayer);
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

// Every distinct REAL week that has a schedule export. The `week`
// column (from the export URL) turned out to be unreliable — every
// export uses "0" in the URL regardless of the actual week, while
// the true week number lives inside each game object's `weekIndex`
// field. This queries that real field directly instead.
export async function getScheduleWeekOptions({ username, leagueId }) {
  const rows = await sql`
    SELECT DISTINCT ON ((payload->'gameScheduleInfoList'->0->>'weekIndex')::int)
      (payload->'gameScheduleInfoList'->0->>'weekIndex')::int as real_week,
      season_type,
      received_at
    FROM madden_exports
    WHERE username = ${username}
      AND league_id = ${leagueId}
      AND export_type = 'week_schedules'
      AND jsonb_array_length(payload->'gameScheduleInfoList') > 0
    ORDER BY (payload->'gameScheduleInfoList'->0->>'weekIndex')::int, received_at DESC
  `;
  return rows.sort((a, b) => a.real_week - b.real_week);
}

// The latest schedule payload for one specific real week.
export async function getScheduleForWeek({ username, leagueId, realWeek }) {
  const rows = await sql`
    SELECT payload, received_at, season_type
    FROM madden_exports
    WHERE username = ${username}
      AND league_id = ${leagueId}
      AND export_type = 'week_schedules'
      AND (payload->'gameScheduleInfoList'->0->>'weekIndex')::int = ${realWeek}
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
