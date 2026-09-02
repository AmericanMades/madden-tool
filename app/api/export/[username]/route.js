// app/api/export/[username]/route.js
//
// FIXED: in recent Next.js versions (15+), `params` in route handlers
// is a Promise now, not a plain object — it has to be awaited before
// you can read properties off it. That's why username showed as
// "undefined": `{ username } = params` was destructuring the Promise
// itself, which has no `.username` property, instead of the resolved
// value.
//
// Route shape: /api/export/<username> — use any username you want
// when entering the URL in the Companion App, e.g. /api/export/taylor.

import fs from "fs";
import path from "path";

const EXPORTS_DIR = path.join(process.cwd(), "data", "exports");

function ensureExportsDir() {
  if (!fs.existsSync(EXPORTS_DIR)) {
    fs.mkdirSync(EXPORTS_DIR, { recursive: true });
  }
}

export async function POST(request, context) {
  const { username } = await context.params;

  const rawBody = await request.text();

  let parsed = null;
  let isValidJson = false;
  try {
    parsed = JSON.parse(rawBody);
    isValidJson = true;
  } catch {
    // Not JSON, or malformed — still saved as raw text below.
  }

  ensureExportsDir();

  const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
  const filename = `${username}_${timestamp}.json`;
  const filepath = path.join(EXPORTS_DIR, filename);

  const toSave = isValidJson ? JSON.stringify(parsed, null, 2) : rawBody;

  fs.writeFileSync(filepath, toSave, "utf-8");

  console.log(`[madden-export] Received export for "${username}"`);
  console.log(`[madden-export] Saved to: data/exports/${filename}`);
  console.log(`[madden-export] Body size: ${rawBody.length} bytes`);
  console.log(`[madden-export] Valid JSON: ${isValidJson}`);
  if (isValidJson && parsed && typeof parsed === "object") {
    console.log(`[madden-export] Top-level keys: ${Object.keys(parsed).join(", ")}`);
  }
  console.log(`[madden-export] Content-Type header: ${request.headers.get("content-type")}`);

  return Response.json({ status: "ok", received: rawBody.length });
}

export async function GET(request, context) {
  const { username } = await context.params;
  return Response.json({
    message: `This endpoint is ready to receive a POST export for username "${username}".`,
  });
}
