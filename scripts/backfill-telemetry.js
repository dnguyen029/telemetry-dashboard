import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load environment variables from .env if present
const envPath = path.join(__dirname, '..', '.env');
if (fs.existsSync(envPath)) {
  const envContent = fs.readFileSync(envPath, 'utf8');
  envContent.split('\n').forEach(line => {
    const parts = line.split('=');
    if (parts.length >= 2) {
      const k = parts[0].trim();
      let v = parts.slice(1).join('=').trim();
      while ((v.startsWith('"') && v.endsWith('"')) || (v.startsWith("'") && v.endsWith("'"))) {
        v = v.slice(1, -1).trim();
      }
      process.env[k] = v;
    }
  });
}

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_KEY;
const clientId = process.env.RINGCENTRAL_CLIENT_ID;
const clientSecret = process.env.RINGCENTRAL_CLIENT_SECRET;
const jwt = process.env.RINGCENTRAL_JWT;
const server = process.env.RINGCENTRAL_SERVER_URL || "https://platform.ringcentral.com";

if (!supabaseUrl || !supabaseKey || !clientId || !clientSecret || !jwt) {
  console.error("Missing required environment variables.");
  process.exit(1);
}

async function getAccessToken() {
  const tokenUrl = `${server}/restapi/oauth/token`;
  const authHeader = Buffer.from(`${clientId}:${clientSecret}`).toString("base64");
  const res = await fetch(tokenUrl, {
    method: "POST",
    headers: {
      "Authorization": `Basic ${authHeader}`,
      "Content-Type": "application/x-www-form-urlencoded"
    },
    body: new URLSearchParams({
      grant_type: "urn:ietf:params:oauth:grant-type:jwt-bearer",
      assertion: jwt
    })
  });
  if (!res.ok) throw new Error(`Auth failed: ${await res.text()}`);
  const data = await res.json();
  return data.access_token;
}

function getPacificDateBounds(dateStr) {
  const parts = dateStr.split("-").map(Number);
  const utcDate = new Date(Date.UTC(parts[0], parts[1] - 1, parts[2], 0, 0, 0));
  const laHour = parseInt(
    new Intl.DateTimeFormat("en-US", { 
      timeZone: "America/Los_Angeles", 
      hour: "numeric", 
      hourCycle: "h23"
    }).format(utcDate), 
    10
  );
  const offsetHours = laHour >= 12 ? laHour - 24 : laHour;
  const dateFrom = new Date(Date.UTC(parts[0], parts[1] - 1, parts[2], -offsetHours, 0, 0)).toISOString();
  const dateTo = new Date(Date.UTC(parts[0], parts[1] - 1, parts[2], -offsetHours + 23, 59, 59, 999)).toISOString();
  return { dateFrom, dateTo };
}

async function fetchExtensions(accessToken) {
  const url = `${server}/restapi/v1.0/account/~/extension?perPage=1000`;
  const res = await fetch(url, {
    headers: { Authorization: `Bearer ${accessToken}`, Accept: "application/json" }
  });
  if (!res.ok) return [];
  const data = await res.json();
  return (data.records || []).map(r => ({ id: r.id, extensionNumber: r.extensionNumber, name: r.name, type: r.type, status: r.status }));
}

async function backfillDate(targetDate, accessToken, extensions) {
  console.log(`\n=== Backfilling date: ${targetDate} ===`);
  const { dateFrom, dateTo } = getPacificDateBounds(targetDate);
  const userNames = extensions.filter(r => r.type === "User").map(r => r.name);
  const userExts = extensions.filter(r => r.type === "User").map(r => r.extensionNumber);

  let logs = [];
  let page = 1;
  let hasMore = true;
  while (hasMore) {
    const logUrl = `${server}/restapi/v1.0/account/~/call-log?dateFrom=${dateFrom}&dateTo=${dateTo}&view=Simple&direction=Inbound&perPage=1000&page=${page}`;
    const logRes = await fetch(logUrl, {
      headers: { Authorization: `Bearer ${accessToken}`, Accept: "application/json" }
    });
    if (!logRes.ok) break;
    const logData = await logRes.json();
    const records = logData.records || [];
    logs = logs.concat(records);
    if (records.length < 1000 || !logData.navigation?.nextPage) hasMore = false;
    else page++;
  }

  console.log(`Fetched ${logs.length} raw inbound logs for ${targetDate}`);

  // Filter for Queue/Support calls
  const queueLogs = logs.filter(l => {
    if (l.direction !== "Inbound") return false;
    const isDirectToAgent =
      (l.to?.name && userNames.includes(l.to.name)) ||
      (l.to?.extensionNumber && userExts.includes(l.to.extensionNumber));
    return !isDirectToAgent;
  });

  const totalCalls = queueLogs.length;
  let answeredCalls = 0;
  let missedCalls = 0;
  let abandonedCalls = 0;
  const hourlyVolume = Array(24).fill(0);
  const hourlyAnswered = Array(24).fill(0);
  const hourlyMissed = Array(24).fill(0);

  const missedStatuses = ["Missed", "No Answer", "Not Answered", "Declined", "Sent to Voicemail", "Voicemail"];
  const abandonedStatuses = ["Abandoned", "Hang Up", "Disconnected"];

  const sessionMap = new Map();
  queueLogs.forEach(log => {
    const fromPhone = log.from?.phoneNumber || log.from?.name || log.from?.extensionNumber;
    const timeKey = log.startTime ? String(Math.floor(new Date(log.startTime).getTime() / (5 * 60 * 1000))) : Math.random().toString();
    const sessionKey = log.sessionId || log.telephonySessionId || (fromPhone ? `${fromPhone}_${timeKey}` : log.id || `anon_${Math.random()}`);
    if (!sessionMap.has(sessionKey)) sessionMap.set(sessionKey, []);
    sessionMap.get(sessionKey).push(log);
  });

  sessionMap.forEach(sessionLogs => {
    const hasAnswered = sessionLogs.some(l => (l.result === "Accepted" || l.result === "Call connected") && (l.duration || 0) >= 45);
    if (hasAnswered) {
      answeredCalls++;
      return;
    }
    const hasMissed = sessionLogs.some(l => (missedStatuses.includes(l.result) || l.action === "Missed") && (l.duration || 0) >= 9);
    const hasAbandon = sessionLogs.some(l => abandonedStatuses.includes(l.result) || (l.duration || 0) <= 8);
    if (hasMissed) missedCalls++;
    else if (hasAbandon) abandonedCalls++;
  });

  // Calculate Pacific Time hourly distribution
  queueLogs.forEach(log => {
    if (log.startTime) {
      const hourStr = new Intl.DateTimeFormat("en-US", {
        timeZone: "America/Los_Angeles",
        hour: "numeric",
        hourCycle: "h23"
      }).format(new Date(log.startTime));
      const hour = (parseInt(hourStr, 10) || 0) % 24;
      hourlyVolume[hour]++;

      const isAns = (log.result === "Accepted" || log.result === "Call connected") && (log.duration || 0) >= 45;
      const isMiss = (missedStatuses.includes(log.result) || log.action === "Missed") && (log.duration || 0) >= 9;
      if (isMiss) hourlyMissed[hour]++;
      else if (isAns) hourlyAnswered[hour]++;
    }
  });

  const waitTimes = queueLogs.map(l => {
    const dur = l.duration || 0;
    const isAns = (l.result === "Accepted" || l.result === "Call connected") && dur >= 45;
    if (isAns) return Math.min(dur, 25);
    return Math.min(dur, 45);
  });
  const avgWait = waitTimes.length > 0 ? Math.round(waitTimes.reduce((a, b) => a + b, 0) / waitTimes.length) : 0;

  console.log(`Calculated: Inbound=${totalCalls}, Answered=${answeredCalls}, Missed=${missedCalls}, Abandoned=${abandonedCalls}, AvgWait=${avgWait}s`);

  // Write daily telemetry to Supabase
  const dailyRes = await fetch(`${supabaseUrl}/rest/v1/daily_call_telemetry`, {
    method: "POST",
    headers: {
      apikey: supabaseKey,
      Authorization: `Bearer ${supabaseKey}`,
      "Content-Type": "application/json",
      Prefer: "resolution=merge-duplicates"
    },
    body: JSON.stringify({
      date: targetDate,
      inbound_calls: totalCalls,
      answered_calls: answeredCalls,
      missed_calls: missedCalls,
      abandoned_calls: abandonedCalls,
      avg_wait_seconds: avgWait
    })
  });
  if (!dailyRes.ok) console.error(`Failed to upsert daily telemetry: ${await dailyRes.text()}`);
  else console.log(`Successfully upserted daily_call_telemetry for ${targetDate}`);

  // Write hourly telemetry to Supabase
  const hourlyRecords = [];
  for (let h = 0; h < 24; h++) {
    hourlyRecords.push({
      call_date: targetDate,
      hour_of_day: h,
      inbound_calls: hourlyVolume[h],
      answered_calls: hourlyAnswered[h],
      missed_calls: hourlyMissed[h],
      abandoned_calls: Math.max(0, hourlyVolume[h] - hourlyAnswered[h] - hourlyMissed[h])
    });
  }

  const hourlyRes = await fetch(`${supabaseUrl}/rest/v1/hourly_call_telemetry`, {
    method: "POST",
    headers: {
      apikey: supabaseKey,
      Authorization: `Bearer ${supabaseKey}`,
      "Content-Type": "application/json",
      Prefer: "resolution=merge-duplicates"
    },
    body: JSON.stringify(hourlyRecords)
  });
  if (!hourlyRes.ok) console.error(`Failed to upsert hourly telemetry: ${await hourlyRes.text()}`);
  else console.log(`Successfully upserted 24 hourly records for ${targetDate}`);
}

async function run() {
  try {
    const token = await getAccessToken();
    const exts = await fetchExtensions(token);
    const dates = ["2026-07-20", "2026-07-21", "2026-07-22"];
    for (const d of dates) {
      await backfillDate(d, token, exts);
    }
    console.log("\n✅ Backfill script completed successfully.");
  } catch (err) {
    console.error("Backfill failed:", err);
    process.exit(1);
  }
}

run();
