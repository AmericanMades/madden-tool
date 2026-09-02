// app/api/export/[username]/[...segments]/route.js

const CORS_HEADERS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods":
    "GET, POST, PUT, PATCH, DELETE, HEAD, OPTIONS",
  "Access-Control-Allow-Headers": "*",
};

function parseMaddenPath(segments = []) {
  return {
    platform: segments[0] || null,
    leagueId: segments[1] || null,
    type: segments[2] || null,
    seasonType:
      segments[2] === "week" ? segments[3] || null : null,
    week:
      segments[2] === "week" ? segments[4] || null : null,
    statType:
      segments[2] === "week"
        ? segments[5] || null
        : segments[3] || null,
    rawSegments: segments,
  };
}

function safeHeaders(request) {
  const headers = Object.fromEntries(
    request.headers.entries()
  );

  // Don't dump sensitive/internal Vercel auth tokens into logs.
  const hidden = [
    "authorization",
    "x-vercel-oidc-token",
    "x-vercel-proxy-signature",
    "x-vercel-sc-headers",
  ];

  for (const name of hidden) {
    if (headers[name]) {
      headers[name] = "[REDACTED]";
    }
  }

  return headers;
}

function logInChunks(label, text, chunkSize = 3000) {
  if (!text) {
    console.log(`${label} <EMPTY>`);
    return;
  }

  const total = Math.ceil(text.length / chunkSize);

  for (let i = 0; i < total; i++) {
    console.log(
      `${label} [${i + 1}/${total}]`,
      text.slice(
        i * chunkSize,
        (i + 1) * chunkSize
      )
    );
  }
}

async function handleMaddenRequest(request, context) {
  try {
    const { username, segments = [] } =
      await context.params;

    const routeInfo = parseMaddenPath(segments);
    const url = new URL(request.url);

    let rawBuffer = new ArrayBuffer(0);

    // HEAD requests cannot have/use a response body
    if (request.method !== "HEAD") {
      try {
        rawBuffer = await request.arrayBuffer();
      } catch (error) {
        console.error(
          "[MADDEN] Failed reading request body:",
          error
        );
      }
    }

    const bytes = new Uint8Array(rawBuffer);

    let rawText = "";

    if (bytes.length > 0) {
      try {
        rawText = new TextDecoder("utf-8").decode(bytes);
      } catch {
        rawText = "";
      }
    }

    let parsedJson = null;
    let validJson = false;

    if (rawText) {
      try {
        parsedJson = JSON.parse(rawText);
        validJson = true;
      } catch {
        // Not JSON.
      }
    }

    console.log("========================================");
    console.log("[MADDEN REQUEST RECEIVED]");

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
    console.log("[MADDEN] Type:", routeInfo.type);
    console.log(
      "[MADDEN] Season Type:",
      routeInfo.seasonType
    );
    console.log("[MADDEN] Week:", routeInfo.week);
    console.log(
      "[MADDEN] Stat Type:",
      routeInfo.statType
    );
    console.log("[MADDEN] Segments:", segments);

    console.log(
      "[MADDEN] Query Params:",
      Object.fromEntries(
        url.searchParams.entries()
      )
    );

    console.log(
      "[MADDEN] Headers:",
      safeHeaders(request)
    );

    console.log(
      "[MADDEN] Content-Type:",
      request.headers.get("content-type")
    );

    console.log(
      "[MADDEN] Content-Encoding:",
      request.headers.get("content-encoding")
    );

    console.log(
      "[MADDEN] Content-Length:",
      request.headers.get("content-length")
    );

    console.log(
      "[MADDEN] Raw byte size:",
      bytes.length
    );

    console.log(
      "[MADDEN] Decoded text size:",
      rawText.length
    );

    console.log(
      "[MADDEN] Valid JSON:",
      validJson
    );

    if (
      validJson &&
      parsedJson &&
      typeof parsedJson === "object"
    ) {
      console.log(
        "[MADDEN] Top-level keys:",
        Object.keys(parsedJson)
      );

      logInChunks(
        "[MADDEN JSON]",
        JSON.stringify(parsedJson, null, 2)
      );
    } else if (rawText) {
      logInChunks(
        "[MADDEN RAW TEXT]",
        rawText
      );
    } else if (bytes.length > 0) {
      console.log(
        "[MADDEN] Body contained bytes but could not decode as UTF-8."
      );

      console.log(
        "[MADDEN] First 100 bytes:",
        Array.from(bytes.slice(0, 100))
      );
    } else {
      console.log("[MADDEN] BODY IS EMPTY");
    }

    console.log("[MADDEN REQUEST END]");
    console.log("========================================");

    const responsePayload = {
      success: true,
      status: "ok",
      received: bytes.length,
      username,
      platform: routeInfo.platform,
      leagueId: routeInfo.leagueId,
      type: routeInfo.type,
      seasonType: routeInfo.seasonType,
      week: routeInfo.week,
      statType: routeInfo.statType,
    };

    // HEAD responses must not contain a body.
    if (request.method === "HEAD") {
      return new Response(null, {
        status: 200,
        headers: CORS_HEADERS,
      });
    }

    return Response.json(
      responsePayload,
      {
        status: 200,
        headers: CORS_HEADERS,
      }
    );
  } catch (error) {
    console.error(
      "[MADDEN REQUEST ERROR]",
      error
    );

    if (request.method === "HEAD") {
      return new Response(null, {
        status: 500,
        headers: CORS_HEADERS,
      });
    }

    return Response.json(
      {
        success: false,
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

  return new Response(null, {
    status: 204,
    headers: CORS_HEADERS,
  });
}