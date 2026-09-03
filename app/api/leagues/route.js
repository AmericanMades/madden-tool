// app/api/leagues/route.js
import { getLeaguesForUser, getLatestExport } from "../../../lib/db";

const USERNAME = "taylor";

export async function GET() {
  const leagues = await getLeaguesForUser(USERNAME);

  const withWeek = await Promise.all(
    leagues.map(async (league) => {
      const standings = await getLatestExport({ username: USERNAME, leagueId: league.leagueId, exportType: "standings" });
      const week = standings?.week || standings?.payload?.teamStandingInfoList?.[0]?.weekIndex || null;
      return { ...league, week };
    })
  );

  return Response.json({ leagues: withWeek });
}
