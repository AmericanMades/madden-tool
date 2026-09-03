// app/api/export/[username]/[...segments]/route.js

import { saveExport } from "../../../../../lib/db";

const CORS_HEADERS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, PATCH, DELETE, HEAD, OPTIONS",
  "Access-Control-Allow-Headers": "*",
};

// FIXED: real URL structure confirmed from an actual export:
//   /api/export/{username}/{platform}/{leagueId}/team/{teamId}/roster
// segments = ['xbsx', '2207259', 'team', '777781272', 'roster']
// Previously, segments[3] (the team ID) was being saved into
// `statType`, and the sub-type ("roster") was dropped entirely. Now:
// when segments[2] === "team", segments[3] is recognized as teamId
// and segments[4] as the sub-type (e.g. "roster") instead.
function parseMaddenPath(segments = []) {
  const isTeamScoped = segments[2] === "team";
  return {
    platform: segments[0] || null,
    leagueId: segments[1] || null,
    type: segments[2] || null,
    seasonType: segments[2] === "week" ? segments[3] || null : null,
    week: segments[2] === "week" ? segments[4] || null : null,
    statType: segments[2] === "week" ? segments[5] || null : isTeamScoped ? segments[4] || null : segments[3] || null,
    teamId: isTeamScoped ? segments[3] || null : null,
    rawSegments: segments,
  };
}

function safeHeaders(request) {
  const headers = Object.fromEntries(request.headers.entries());
  const hiddenHeaders = ["authorization", "x-vercel-oidc-token", "x-vercel-proxy-signature", "x-vercel-sc-headers"];
  for (const header of hiddenHeaders) {
    if (headers[header]) headers[header] = "[REDACTED]";
  }
  return headers;
}

function logInChunks(label, text, chunkSize = 3000) {
  if (!text) {
    console.log(`${label} <EMPTY>`);
    return;
  }
  const totalChunks = Math.ceil(text.length / chunkSize);
  for (let i = 0; i < totalChunks; i++) {
    console.log(`${label} [${i + 1}/${totalChunks}]`, text.slice(i * chunkSize, (i + 1) * chunkSize));
  }
}

async function handleMaddenRequest(request, context) {
  try {
    const { username, segments = [] } = await context.params;
    const routeInfo = parseMaddenPath(segments);
    const url = new URL(request.url);

    let rawBuffer = new ArrayBuffer(0);
    if (request.method !== "HEAD" && request.method !== "GET") {
      try {
        rawBuffer = await request.arrayBuffer();
      } catch (error) {
        console.error("[MADDEN] Failed to read body:", error);
      }
    }

    const bytes = new Uint8Array(rawBuffer);

    console.log("========================================");
    console.log("[MADDEN REQUEST RECEIVED]");
    console.log("[MADDEN] Method:", request.method);
    console.log("[MADDEN] URL:", request.url);
    console.log("[MADDEN] Username:", username);
    console.log("[MADDEN] Platform:", routeInfo.platform);
    console.log("[MADDEN] League ID:", routeInfo.leagueId);
    console.log("[MADDEN] Type:", routeInfo.type);
    console.log("[MADDEN] Team ID:", routeInfo.teamId);
    console.log("[MADDEN] Season Type:", routeInfo.seasonType);
    console.log("[MADDEN] Week:", routeInfo.week);
    console.log("[MADDEN] Stat Type:", routeInfo.statType);
    console.log("[MADDEN] Segments:", segments);
    console.log("[MADDEN] Query Params:", Object.fromEntries(url.searchParams.entries()));
    console.log("[MADDEN] Headers:", safeHeaders(request));
    console.log("[MADDEN] Content-Type:", request.headers.get("content-type"));
    console.log("[MADDEN] Content-Encoding:", request.headers.get("content-encoding"));
    console.log("[MADDEN] Content-Length:", request.headers.get("content-length"));
    console.log("[MADDEN] Raw byte size:", bytes.length);

    if (bytes.length === 0) {
      console.warn("[MADDEN] EMPTY BODY — accepting request so export can continue");
      console.log("[MADDEN REQUEST END]");
      console.log("========================================");

      if (request.method === "HEAD") {
        return new Response(null, { status: 200, headers: CORS_HEADERS });
      }

      return Response.json(
        { success: true, status: "ok", warning: "EMPTY_BODY", received: 0, username, route: routeInfo },
        { status: 200, headers: CORS_HEADERS }
      );
    }

    let rawText = "";
    try {
      rawText = new TextDecoder("utf-8").decode(bytes);
    } catch (error) {
      console.error("[MADDEN] UTF-8 decode failed:", error);
    }

    let parsedJson = null;
    let validJson = false;
    if (rawText) {
      try {
        parsedJson = JSON.parse(rawText);
        validJson = true;
      } catch {
        validJson = false;
      }
    }

    console.log("[MADDEN] Decoded text size:", rawText.length);
    console.log("[MADDEN] Valid JSON:", validJson);

    if (validJson && parsedJson !== null) {
      if (typeof parsedJson === "object") {
        console.log("[MADDEN] Top-level keys:", Object.keys(parsedJson));
      }
      logInChunks("[MADDEN JSON]", JSON.stringify(parsedJson, null, 2));
    } else if (rawText) {
      logInChunks("[MADDEN RAW TEXT]", rawText);
    } else if (bytes.length > 0) {
      console.log("[MADDEN] Binary/non-text body detected");
      console.log("[MADDEN] First 100 bytes:", Array.from(bytes.slice(0, 100)));
    }

    let dbSaveStatus = "skipped (not valid JSON)";
    if (validJson && parsedJson !== null) {
      try {
        await saveExport({
          username,
          platform: routeInfo.platform,
          leagueId: routeInfo.leagueId,
          exportType: routeInfo.teamId ? `team_${routeInfo.statType}` : routeInfo.type,
          seasonType: routeInfo.seasonType,
          week: routeInfo.week,
          statType: routeInfo.statType,
          teamId: routeInfo.teamId,
          payload: parsedJson,
        });
        dbSaveStatus = "ok";
        console.log("[MADDEN] Saved to database successfully");
      } catch (error) {
        dbSaveStatus = `failed: ${error.message}`;
        console.error("[MADDEN] Database save FAILED:", error);
      }
    }

    console.log("[MADDEN REQUEST END]");
    console.log("========================================");

    if (request.method === "HEAD") {
      return new Response(null, { status: 200, headers: CORS_HEADERS });
    }

    return Response.json(
      { success: true, status: "ok", received: bytes.length, username, route: routeInfo, db: dbSaveStatus },
      { status: 200, headers: CORS_HEADERS }
    );
  } catch (error) {
    console.error("[MADDEN REQUEST ERROR]", error);
    if (request.method === "HEAD") {
      return new Response(null, { status: 500, headers: CORS_HEADERS });
    }
    return Response.json(
      { success: false, status: "error", message: error?.message || "Unknown Madden export error" },
      { status: 500, headers: CORS_HEADERS }
    );
  }
}

export async function POST(request, context) {
  return handleMaddenRequest(request, context);
}
export async function PUT(request, context) {
  return handleMaddenRequest(request, context);
}
export async function PATCH(request, context) {
  return handleMaddenRequest(request, context);
}
export async function DELETE(request, context) {
  return handleMaddenRequest(request, context);
}
export async function GET(request, context) {
  return handleMaddenRequest(request, context);
}
export async function HEAD(request, context) {
  return handleMaddenRequest(request, context);
}
export async function OPTIONS(request) {
  console.log("[MADDEN OPTIONS]", request.url);
  return new Response(null, { status: 204, headers: CORS_HEADERS });
}
