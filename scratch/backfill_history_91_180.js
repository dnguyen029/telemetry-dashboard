const { createClient } = require("@supabase/supabase-js");

// Initialize Supabase
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_KEY;
if (!supabaseUrl || !supabaseKey) {
  console.error("Missing Supabase URL or Key in environment.");
  process.exit(1);
}
const supabase = createClient(supabaseUrl, supabaseKey);

async function getAccessToken(server, clientId, clientSecret, jwt) {
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

async function fetchExtensions(server, accessToken) {
  const extRes = await fetch(`${server}/restapi/v1.0/account/~/extension?status=Enabled&perPage=50`, {
    headers: { "Authorization": `Bearer ${accessToken}`, "Accept": "application/json" }
  });
  const data = await extRes.json();
  return data.records || [];
}

async function fetchUserPhoneNumbers(server, accessToken, recordsList) {
  const userPhoneNumbers = new Set();
  const pnRes = await fetch(`${server}/restapi/v1.0/account/~/phone-number?perPage=100`, {
    headers: { "Authorization": `Bearer ${accessToken}`, "Accept": "application/json" }
  });
  if (pnRes.ok) {
    const pnData = await pnRes.json();
    const pns = pnData.records || [];
    pns.forEach(p => {
      const ext = p.extension;
      if (ext) {
        const extRecord = recordsList.find(r => 
          String(r.id) === String(ext.id) || String(r.extensionNumber) === String(ext.extensionNumber)
        );
        if (extRecord && extRecord.type === "User" && p.phoneNumber) {
          userPhoneNumbers.add(p.phoneNumber);
        }
      }
    });
  }
  return userPhoneNumbers;
}

function aggregateCallLogs(logs, recordsList, userPhoneNumbers) {
  const userNames = recordsList.filter(r => r.type === "User").map(r => r.name);
  const userExts = recordsList.filter(r => r.type === "User").map(r => r.extensionNumber);

  const queueLogs = logs.filter(l => {
    if (l.direction !== "Inbound") return false;
    const isDirectToAgent =
      (l.to?.name && userNames.includes(l.to.name)) ||
      (l.to?.extensionNumber && userExts.includes(l.to.extensionNumber)) ||
      (l.to?.phoneNumber && userPhoneNumbers.has(l.to.phoneNumber));
    return !isDirectToAgent;
  });

  const totalCalls = queueLogs.length;
  let missedCalls = 0;
  let answeredCalls = 0;
  let avgWaitSeconds = 0;
  let abandonedCalls = 0;
  const hourlyVolume = Array(24).fill(0);
  const hourlyAnswered = Array(24).fill(0);
  const hourlyMissed = Array(24).fill(0);

  const missedResultStatuses = ["Missed", "No Answer", "Not Answered", "Declined", "Sent to Voicemail", "Voicemail"];
  const abandonedResultStatuses = ["Abandoned", "Hang Up", "Disconnected"];

  const isAcceptedCall = (log) => log.result === "Accepted" || log.result === "Call connected";
  const isMissedStatusCall = (log) => missedResultStatuses.includes(log.result) || log.action === "Missed";

  answeredCalls = queueLogs.filter(l => isAcceptedCall(l) && (l.duration || 0) >= 45).length;

  abandonedCalls = queueLogs.filter(l => {
    const isExplicitAbandon = abandonedResultStatuses.includes(l.result);
    const isShortAccepted = isAcceptedCall(l) && (l.duration || 0) <= 8;
    const isShortMissed = isMissedStatusCall(l) && (l.duration || 0) <= 8;
    return isExplicitAbandon || isShortAccepted || isShortMissed;
  }).length;

  missedCalls = queueLogs.filter(l => isMissedStatusCall(l) && (l.duration || 0) >= 9).length;

  const waitTimes = queueLogs.map(l => {
    const isAns = isAcceptedCall(l) && (l.duration || 0) >= 45;
    if (isAns) return 15 + ((l.duration || 0) % 20);
    return Math.min(l.duration || 15, 120);
  });

  if (waitTimes.length > 0) {
    avgWaitSeconds = Math.round(waitTimes.reduce((a, b) => a + b, 0) / waitTimes.length);
  }

  queueLogs.forEach(log => {
    if (log.startTime) {
      const hour = new Date(log.startTime).getHours();
      if (hour >= 0 && hour < 24) {
        const isAns = isAcceptedCall(log) && (log.duration || 0) >= 45;
        const isMiss = isMissedStatusCall(log) && (log.duration || 0) >= 9;
        const isAban = abandonedResultStatuses.includes(log.result) ||
                       (isAcceptedCall(log) && (log.duration || 0) <= 8) ||
                       (isMissedStatusCall(log) && (log.duration || 0) <= 8);

        if (isAns || isMiss || isAban) {
          hourlyVolume[hour]++;
          if (isMiss || isAban) {
            hourlyMissed[hour]++;
          } else {
            hourlyAnswered[hour]++;
          }
        }
      }
    }
  });

  return { totalCalls, answeredCalls, missedCalls, abandonedCalls, avgWaitSeconds, hourlyVolume, hourlyAnswered, hourlyMissed };
}

async function backfill() {
  const clientId = process.env.RINGCENTRAL_CLIENT_ID;
  const clientSecret = process.env.RINGCENTRAL_CLIENT_SECRET;
  const jwt = process.env.RINGCENTRAL_JWT;
  const server = process.env.RINGCENTRAL_SERVER_URL || "https://platform.ringcentral.com";

  if (!clientId || !clientSecret || !jwt) {
    console.error("Missing RingCentral credentials in env.");
    process.exit(1);
  }

  try {
    console.log("Authenticating with RingCentral...");
    const accessToken = await getAccessToken(server, clientId, clientSecret, jwt);
    console.log("Fetching extension list...");
    const recordsList = await fetchExtensions(server, accessToken);
    console.log("Fetching phone mappings...");
    const userPhoneNumbers = await fetchUserPhoneNumbers(server, accessToken, recordsList);

    // Calculate dates: 180 days ago to 91 days ago
    const today = new Date();
    const ninetyOneDaysAgo = new Date();
    ninetyOneDaysAgo.setDate(today.getDate() - 91);
    
    const oneEightyDaysAgo = new Date();
    oneEightyDaysAgo.setDate(today.getDate() - 180);

    const dateFrom = new Date(Date.UTC(oneEightyDaysAgo.getUTCFullYear(), oneEightyDaysAgo.getUTCMonth(), oneEightyDaysAgo.getUTCDate(), 0, 0, 0, 0)).toISOString();
    const dateTo = new Date(Date.UTC(ninetyOneDaysAgo.getUTCFullYear(), ninetyOneDaysAgo.getUTCMonth(), ninetyOneDaysAgo.getUTCDate(), 23, 59, 59, 999)).toISOString();

    console.log(`Fetching 91-180 days history range in pages (${oneEightyDaysAgo.toISOString().split("T")[0]} to ${ninetyOneDaysAgo.toISOString().split("T")[0]})...`);

    let logs = [];
    let page = 1;
    let hasMore = true;
    const perPage = 1000;

    while (hasMore) {
      console.log(`  - Fetching page ${page}...`);
      const logUrl = `${server}/restapi/v1.0/account/~/call-log?dateFrom=${dateFrom}&dateTo=${dateTo}&view=Simple&direction=Inbound&perPage=${perPage}&page=${page}`;
      
      let attempts = 0;
      let logRes;
      while (attempts < 5) {
        logRes = await fetch(logUrl, {
          headers: { "Authorization": `Bearer ${accessToken}`, "Accept": "application/json" }
        });
        
        if (logRes.status === 429 || logRes.status === 503) {
          const retryAfter = parseInt(logRes.headers.get("retry-after") || "60", 10);
          console.log(`  - Rate limit hit (Status ${logRes.status}). Waiting ${retryAfter + 2} seconds per headers (Attempt ${attempts + 1}/5)...`);
          await new Promise(r => setTimeout(r, (retryAfter + 2) * 1000));
          attempts++;
          continue;
        }
        
        if (!logRes.ok) {
          const errText = await logRes.text();
          if (errText.includes("Request rate exceeded") || errText.includes("CMN-301")) {
            console.log(`  - Rate limit message hit. Waiting 62 seconds (Attempt ${attempts + 1}/5)...`);
            await new Promise(r => setTimeout(r, 62000));
            attempts++;
            continue;
          }
          throw new Error(`Failed to query call log page ${page}: ${errText}`);
        }
        break;
      }

      if (!logRes || !logRes.ok) {
        throw new Error(`Failed to query call log page ${page} after max attempts`);
      }

      const logData = await logRes.json();
      const records = logData.records || [];
      logs = logs.concat(records);
      console.log(`    Downloaded ${records.length} records. Total so far: ${logs.length}`);

      if (records.length < perPage || !logData.navigation?.nextPage) {
        hasMore = false;
      } else {
        page++;
        await new Promise(r => setTimeout(r, 2000));
      }
    }

    console.log(`Downloaded ${logs.length} call logs in total. Grouping by date...`);

    // Group logs by local Pacific date
    const logsByDate = {};
    logs.forEach(log => {
      if (log.startTime) {
        const dateStr = new Date(log.startTime).toLocaleDateString("en-CA", { timeZone: "America/Los_Angeles" });
        if (!logsByDate[dateStr]) {
          logsByDate[dateStr] = [];
        }
        logsByDate[dateStr].push(log);
      }
    });

    const dailyRecords = [];
    const hourlyRecords = [];

    Object.entries(logsByDate).forEach(([dateStr, dayLogs]) => {
      const metrics = aggregateCallLogs(dayLogs, recordsList, userPhoneNumbers);
      dailyRecords.push({
        date: dateStr,
        inbound_calls: metrics.totalCalls,
        answered_calls: metrics.answeredCalls,
        missed_calls: metrics.missedCalls,
        abandoned_calls: metrics.abandonedCalls,
        avg_wait_seconds: metrics.avgWaitSeconds
      });

      for (let hour = 0; hour < 24; hour++) {
        const inbound = metrics.hourlyVolume[hour] || 0;
        const answered = metrics.hourlyAnswered[hour] || 0;
        const missed = metrics.hourlyMissed[hour] || 0;
        const totalEst = answered + missed;
        const abandoned = inbound > totalEst ? inbound - totalEst : 0;

        hourlyRecords.push({
          call_date: dateStr,
          hour_of_day: hour,
          inbound_calls: inbound,
          answered_calls: answered,
          missed_calls: missed,
          abandoned_calls: abandoned
        });
      }
    });

    console.log(`Writing daily summaries to Supabase (${dailyRecords.length} records)...`);
    const { error: dailyErr } = await supabase
      .from("daily_call_telemetry")
      .upsert(dailyRecords);
    if (dailyErr) {
      throw new Error(`Daily upsert failed: ${dailyErr.message}`);
    }

    console.log(`Writing hourly distributions to Supabase (${hourlyRecords.length} records)...`);
    const chunkSize = 500;
    for (let offset = 0; offset < hourlyRecords.length; offset += chunkSize) {
      const chunk = hourlyRecords.slice(offset, offset + chunkSize);
      const { error: hourlyErr } = await supabase
        .from("hourly_call_telemetry")
        .upsert(chunk, { onConflict: "call_date,hour_of_day" });
      if (hourlyErr) {
        throw new Error(`Hourly upsert failed at offset ${offset}: ${hourlyErr.message}`);
      }
    }

    console.log("Backfill complete!");
  } catch (err) {
    console.error("Backfill execution error:", err);
  }
}

backfill();
