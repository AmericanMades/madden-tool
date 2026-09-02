// app/api/export/[username]/[...segments]/route.js

const CORS_HEADERS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type",
};

function parseMaddenPath(segments = []) {
  const result = {
    platform: segments[0] || null,
    leagueId: segments[1] || null,
    type: null,
    seasonType: null,
    week: null,
    statType: null,
    rawSegments: segments,
  };

  // Example:
  // xbsx/2207259/standings
  if (segments[2] === "standings") {
    result.type = "standings";
    return result;
  }

  // Example:
  // xbsx/2207259/freeagents/roster
  if (segments[2] === "freeagents") {
    result.type = "freeagents";
    result.statType = segments[3] || null;
    return result;
  }

  // Example:
  // xbsx/2207259/week/reg/2/kicking
  if (segments[2] === "week") {
    result.type = "week";
    result.seasonType = segments[3] || null;
    result.week = segments[4] || null;
    result.statType = segments[5] || null;
    return result;
  }

  // Fallback for any future Madden endpoint we haven't seen yet
  result.type = segments[2] || "unknown";

  return result;
}

export async function POST(request, context) {
  try {
    const { username, segments } = await context.params;

    const rawBody = await request.text();

    let parsedBody = null;
    let isJson = false;

    try {
      parsedBody = JSON.parse(rawBody);
      isJson = true;
    } catch {
      // Madden may send non-JSON data.
    }

    const routeInfo = parseMaddenPath(segments);

    console.log("========================================");
    console.log("[MADDEN EXPORT RECEIVED]");
    console.log("Username:", username);
    console.log("Platform:", routeInfo.platform);
    console.log("League ID:", routeInfo.leagueId);
    console.log("Type:", routeInfo.type);
    console.log("Season Type:", routeInfo.seasonType);
    console.log("Week:", routeInfo.week);
    console.log("Stat Type:", routeInfo.statType);
    console.log("Segments:", routeInfo.rawSegments);
    console.log("Content-Type:", request.headers.get("content-type"));
    console.log("Body Size:", rawBody.length);
    console.log("Valid JSON:", isJson);

    if (isJson) {
      console.log(
        "Top-Level Keys:",
        parsedBody && typeof parsedBody === "object"
          ? Object.keys(parsedBody)
          : []
      );

      console.log(
        "[MADDEN JSON BODY]",
        JSON.stringify(parsedBody, null, 2)
      );
    } else {
      console.log("[MADDEN RAW BODY]", rawBody);
    }

    console.log("========================================");

    return Response.json(
      {
        status: "ok",
        received: rawBody.length,
        username,

        route: {
          platform: routeInfo.platform,
          leagueId: routeInfo.leagueId,
          type: routeInfo.type,
          seasonType: routeInfo.seasonType,
          week: routeInfo.week,
          statType: routeInfo.statType,
        },
      },
      {
        status: 200,
        headers: CORS_HEADERS,
      }
    );
  } catch (error) {
    console.error("[MADDEN EXPORT ERROR]", error);

    return Response.json(
      {
        status: "error",
        message: error?.message || "Unknown error",
      },
      {
        status: 500,
        headers: CORS_HEADERS,
      }
    );
  }
}

export async function GET(request, context) {
  const { username, segments } = await context.params;

  const routeInfo = parseMaddenPath(segments);

  return Response.json(
    {
      status: "ready",
      username,

      route: {
        platform: routeInfo.platform,
        leagueId: routeInfo.leagueId,
        type: routeInfo.type,
        seasonType: routeInfo.seasonType,
        week: routeInfo.week,
        statType: routeInfo.statType,
      },

      segments,

      message: "Madden Companion export endpoint is ready.",
    },
    {
      status: 200,
      headers: CORS_HEADERS,
    }
  );
}

export async function OPTIONS() {
  return new Response(null, {
    status: 204,
    headers: CORS_HEADERS,
  });
}