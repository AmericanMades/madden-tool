// app/api/league-settings/route.js
import { sql } from "../../../lib/db";

const USERNAME = "taylor";

export async function POST(request) {
  const { leagueId, teamId, teamName, label } = await request.json();

  if (!leagueId || !teamId || !teamName) {
    return Response.json({ error: "Missing required fields" }, { status: 400 });
  }

  await sql`
    INSERT INTO league_settings (username, league_id, my_team_id, my_team_name, league_label)
    VALUES (${USERNAME}, ${leagueId}, ${String(teamId)}, ${teamName}, ${label || leagueId})
    ON CONFLICT (username, league_id)
    DO UPDATE SET my_team_id = EXCLUDED.my_team_id, my_team_name = EXCLUDED.my_team_name, league_label = EXCLUDED.league_label
  `;

  return Response.json({ status: "ok" });
}
