// app/api/export/[username]/route.js
//
// Receives Madden Companion App exports.
//
// On Vercel, files written to disk are temporary, so console.log is
// the main way to inspect incoming export data. Local file saving is
// still attempted for development/testing.

import fs from "fs";
import path from "path";

const EXPORTS_DIR = path.join(process.cwd(), "data", "exports");
const LOG_CHUNK_SIZE = 3000;

const CORS_HEADERS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type",
};

function logInChunks(label, text) {
  if (text.length <= LOG_CHUNK_SIZE) {
    console.log(`${label}: ${text}`);
    return;
  }

  const totalChunks = Math.ceil(text.length / LOG_CHUNK_SIZE);

  for (let i = 0; i < totalChunks; i++) {
    const chunk = text.slice(
      i * LOG_CHUNK_SIZE,
      (i + 1) * LOG_CHUNK_SIZE
    );

    console.log(
      `${label} [chunk ${i + 1}/${totalChunks}]: ${chunk}`
    );
  }
}

function tryWriteLocalFile(username, timestamp, content) {
  try {
    if (!fs.existsSync(EXPORTS_DIR)) {
      fs.mkdirSync(EXPORTS_DIR, { recursive: true });
    }

    const filename = `${username}_${timestamp}.json`;

    fs.writeFileSync(
      path.join(EXPORTS_DIR, filename),
      content,
      "utf-8"
    );

    return filename;
  } catch (error) {
    console.log(
      `[madden-export] Local file write skipped/failed: ${error.message}`
    );

    return null;
  }
}

export async function POST(request, context) {
  try {
    const { username } = await context.params;
    const rawBody = await request.text();

    let parsed = null;
    let isValidJson = false;

    try {
      parsed = JSON.parse(rawBody);
      isValidJson = true;
    } catch {
      // Body was not JSON. Keep the raw text instead.
    }

    const timestamp = new Date()
      .toISOString()
      .replace(/[:.]/g, "-");

    const toSave = isValidJson
      ? JSON.stringify(parsed, null, 2)
      : rawBody;

    const savedFilename = tryWriteLocalFile(
      username,
      timestamp,
      toSave
    );

    console.log(
      `[madden-export] ===== Received export for "${username}" =====`
    );

    console.log(
      `[madden-export] Body size: ${rawBody.length} bytes`
    );

    console.log(
      `[madden-export] Valid JSON: ${isValidJson}`
    );

    console.log(
      `[madden-export] Content-Type header: ${request.headers.get(
        "content-type"
      )}`
    );

    if (savedFilename) {
      console.log(
        `[madden-export] Also saved locally to: data/exports/${savedFilename}`
      );
    }

    if (
      isValidJson &&
      parsed &&
      typeof parsed === "object"
    ) {
      console.log(
        `[madden-export] Top-level keys: ${Object.keys(parsed).join(", ")}`
      );
    }

    logInChunks(
      "[madden-export] RAW BODY",
      toSave
    );

    console.log(
      `[madden-export] ===== End of export =====`
    );

    return Response.json(
      {
        status: "ok",
        received: rawBody.length,
        username,
      },
      {
        status: 200,
        headers: CORS_HEADERS,
      }
    );
  } catch (error) {
    console.error(
      "[madden-export] POST error:",
      error
    );

    return Response.json(
      {
        status: "error",
        message: "Failed to process Madden export",
      },
      {
        status: 500,
        headers: CORS_HEADERS,
      }
    );
  }
}

export async function GET(request, context) {
  const { username } = await context.params;

  return Response.json(
    {
      status: "ok",
      message: `This endpoint is ready to receive a POST export for username "${username}".`,
      endpoint: `/api/export/${username}`,
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