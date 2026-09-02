// app/api/export/[username]/route.js
//
// IMPORTANT CHANGE: the previous version relied on writing a file to
// disk as the way to inspect exported data. That works fine locally,
// but WON'T work once deployed to Vercel (or any serverless
// platform) — those environments don't keep files written during one
// request around for the next one. Any file this wrote would just
// disappear.
//
// Fixed by making console.log the PRIMARY way to inspect data now —
// Vercel captures everything logged during a request in its
// dashboard (Project -> Deployments -> your deployment -> Runtime
// Logs), and that persists reliably. The local file write is still
// attempted too (wrapped so it can't crash anything if it fails)
// since it's convenient for local dev testing, but don't rely on it
// once this is deployed.

import fs from "fs";
import path from "path";

const EXPORTS_DIR = path.join(process.cwd(), "data", "exports");

const LOG_CHUNK_SIZE = 3000;

function logInChunks(label, text) {
  if (text.length <= LOG_CHUNK_SIZE) {
    console.log(`${label}: ${text}`);
    return;
  }
  const totalChunks = Math.ceil(text.length / LOG_CHUNK_SIZE);
  for (let i = 0; i < totalChunks; i++) {
    const chunk = text.slice(i * LOG_CHUNK_SIZE, (i + 1) * LOG_CHUNK_SIZE);
    console.log(`${label} [chunk ${i + 1}/${totalChunks}]: ${chunk}`);
  }
}

function tryWriteLocalFile(username, timestamp, content) {
  try {
    if (!fs.existsSync(EXPORTS_DIR)) {
      fs.mkdirSync(EXPORTS_DIR, { recursive: true });
    }
    const filename = `${username}_${timestamp}.json`;
    fs.writeFileSync(path.join(EXPORTS_DIR, filename), content, "utf-8");
    return filename;
  } catch {
    return null;
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
    // Not JSON, or malformed — still logged/saved as raw text below.
  }

  const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
  const toSave = isValidJson ? JSON.stringify(parsed, null, 2) : rawBody;

  const savedFilename = tryWriteLocalFile(username, timestamp, toSave);

  console.log(`[madden-export] ===== Received export for "${username}" =====`);
  console.log(`[madden-export] Body size: ${rawBody.length} bytes`);
  console.log(`[madden-export] Valid JSON: ${isValidJson}`);
  console.log(`[madden-export] Content-Type header: ${request.headers.get("content-type")}`);
  if (savedFilename) {
    console.log(`[madden-export] Also saved locally to: data/exports/${savedFilename}`);
  }
  if (isValidJson && parsed && typeof parsed === "object") {
    console.log(`[madden-export] Top-level keys: ${Object.keys(parsed).join(", ")}`);
  }

  logInChunks("[madden-export] RAW BODY", toSave);
  console.log(`[madden-export] ===== End of export =====`);

  return Response.json({ status: "ok", received: rawBody.length });
}

export async function GET(request, context) {
  const { username } = await context.params;
  return Response.json({
    message: `This endpoint is ready to receive a POST export for username "${username}".`,
  });
}
