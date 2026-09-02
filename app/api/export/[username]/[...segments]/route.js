// app/api/export/[username]/[...segments]/route.js

const CORS_HEADERS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
  "Access-Control-Allow-Headers": "*",
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

  // Handles other Madden endpoints such as:
  // xbsx/2207259/leagueteams
  result.type = segments[2] || "unknown";

  return result;
}

function logBodyInChunks(text, chunkSize = 3000) {
  if (!text) {
    console.log("[MADDEN RAW BODY] <EMPTY>");
    return;
  }

  if (text.length <= chunkSize) {
    console.log("[MADDEN RAW BODY]", text);
    return;
  }

  const totalChunks = Math.ceil(text.length / chunkSize);

  for (let i = 0; i < totalChunks; i++) {
    const chunk = text.slice(
      i * chunkSize,
      (i + 1) * chunkSize
    );

    console.log(
      `[MADDEN RAW BODY ${i + 1}/${totalChunks}]`,
      chunk
    );
  }
}

export async function POST(request, context) {
  try {
    const { username, segments } = await context.params;

    const routeInfo = parseMaddenPath(segments);

    // Get complete URL information
    const url = new URL(request.url);

    // Capture headers
    const headers = Object.fromEntries(
      request.headers.entries()
    );

    // Capture query parameters
    const queryParams = Object.fromEntries(
      url.searchParams.entries()
    );

    // Read the complete body
    const rawBody = await request.text();

    // Try parsing body as JSON
    let parsedBody = null;
    let isJson = false;

    if (rawBody.length > 0) {
      try {
        parsedBody = JSON.parse(rawBody);
        isJson = true;
      } catch {
        // Madden may send something other than JSON.
      }
    }

    // ============================================
    // REQUEST INFORMATION
    // ============================================

    console.log("========================================");
    console.log("[MADDEN EXPORT RECEIVED]");

    console.log("[MADDEN] Method:", request.method);
    console.log("[MADDEN] URL:", request.url);

    console.log("[MADDEN] Username:", username);

    console.log(
      "[MADDEN] Platform:",
      routeInfo.platform
    );

    console.log(
      "[MADDEN] League ID:",
      routeInfo.leagueId
    );

    console.log(
      "[MADDEN] Type:",
      routeInfo.type
    );

    console.log(
      "[MADDEN] Season Type:",
      routeInfo.seasonType
    );

    console.log(
      "[MADDEN] Week:",
      routeInfo.week
    );

    console.log(
      "[MADDEN] Stat Type:",
      routeInfo.statType
    );

    console.log(
      "[MADDEN] Segments:",
      routeInfo.rawSegments
    );

    // ============================================
    // HTTP INFORMATION
    // ============================================

    console.log(
      "[MADDEN] Headers:",
      headers
    );

    console.log(
      "[MADDEN] Query Params:",
      queryParams
    );

    console.log(
      "[MADDEN] Content-Type:",
      request.headers.get("content-type")
    );

    console.log(
      "[MADDEN] Content-Length:",
      request.headers.get("content-length")
    );

    // ============================================
    // BODY INFORMATION
    // ============================================

    console.log(
      "[MADDEN] Body Size:",
      rawBody.length
    );

    console.log(
      "[MADDEN] Valid JSON:",
      isJson
    );

    if (
      isJson &&
      parsedBody &&
      typeof parsedBody === "object"
    ) {
      console.log(
        "[MADDEN] Top-Level Keys:",
        Object.keys(parsedBody)
      );
    }

    if (isJson) {
      const prettyJson = JSON.stringify(
        parsedBody,
        null,
        2
      );

      logBodyInChunks(prettyJson);
    } else {
      logBodyInChunks(rawBody);
    }

    console.log("[MADDEN EXPORT END]");
    console.log("========================================");

    // Tell Madden we successfully received it
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
    console.error(
      "[MADDEN EXPORT ERROR]",
      error
    );

    return Response.json(
      {
        status: "error",
        message:
          error?.message ||
          "Unknown Madden export error",
      },
      {
        status: 500,
        headers: CORS_HEADERS,
      }
    );
  }
}

export async function GET(request, context) {
  try {
    const { username, segments } = await context.params;

    const routeInfo = parseMaddenPath(segments);

    console.log("========================================");
    console.log("[MADDEN GET REQUEST]");
    console.log("[MADDEN] Method:", request.method);
    console.log("[MADDEN] URL:", request.url);
    console.log("[MADDEN] Username:", username);
    console.log("[MADDEN] Segments:", segments);
    console.log("[MADDEN] Route:", routeInfo);
    console.log("========================================");

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

        message:
          "Madden Companion export endpoint is ready.",
      },
      {
        status: 200,
        headers: CORS_HEADERS,
      }
    );
  } catch (error) {
    console.error("[MADDEN GET ERROR]", error);

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

export async function OPTIONS(request) {
  console.log("========================================");
  console.log("[MADDEN OPTIONS REQUEST]");
  console.log("[MADDEN] URL:", request.url);
  console.log(
    "[MADDEN] Headers:",
    Object.fromEntries(request.headers.entries())
  );
  console.log("========================================");

  return new Response(null, {
    status: 204,
    headers: CORS_HEADERS,
  });
}