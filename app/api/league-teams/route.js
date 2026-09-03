// app/api/league-teams/route.js
import { getLatestExport } from "../../../lib/db";

const USERNAME = "taylor";

export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const leagueId = searchParams.get("league");
  if (!leagueId) return Response.json({ teams: [] });

  const latest = await getLatestExport({ username: USERNAME, leagueId, exportType: "standings" });
  if (!latest) return Response.json({ teams: [] });

  const teams = latest.payload.teamStandingInfoList
    .map((t) => ({ teamId: t.teamId, teamName: t.teamName }))
    .sort((a, b) => a.teamName.localeCompare(b.teamName));

  return Response.json({ teams });
}
