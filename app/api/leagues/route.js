// app/api/leagues/route.js
import { getLeaguesForUser } from "../../../lib/db";

const USERNAME = "taylor";

export async function GET() {
  const leagues = await getLeaguesForUser(USERNAME);
  return Response.json({ leagues });
}
