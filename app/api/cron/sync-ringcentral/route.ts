import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { 
  getPacificDateBounds, 
  getAccessToken, 
  aggregateCallLogs,
  type RingCentralCallLog,
  type RingCentralExtension 
} from "@/lib/ringcentral";

const supabaseUrl = process.env.SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_KEY!;
const supabase = createClient(supabaseUrl, supabaseKey);

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const dateParam = searchParams.get("date") || undefined;

  // 1. Verify Authorization: Bearer <CRON_SECRET>
  const authHeader = request.headers.get("authorization");
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const clientId = process.env.RINGCENTRAL_CLIENT_ID;
  const clientSecret = process.env.RINGCENTRAL_CLIENT_SECRET;
  const jwt = process.env.RINGCENTRAL_JWT;
  const server = process.env.RINGCENTRAL_SERVER_URL || "https://platform.ringcentral.com";

  // If credentials are not set, fail hard. Never write mock data to telemetry history.
  if (!clientId || !clientSecret || !jwt) {
    return NextResponse.json({ error: "Missing RingCentral credentials in environment." }, { status: 500 });
  }

  try {
    // Determine bounds for the query date.
    // If dateParam is not set, default to yesterday's date to sync the completed day.
    let targetDate = dateParam;
    if (!targetDate) {
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);
      targetDate = yesterday.toLocaleDateString("en-CA", { timeZone: "America/Los_Angeles" });
    }

    const { dateFrom, dateTo } = getPacificDateBounds(targetDate);
    const accessToken = await getAccessToken(server, clientId, clientSecret, jwt);

    // Fetch extensions
    const extUrl = `${server}/restapi/v1.0/account/~/extension?status=Enabled&perPage=50`;
    const extRes = await fetch(extUrl, {
      headers: {
        "Authorization": `Bearer ${accessToken}`,
        "Accept": "application/json"
      },
      cache: "no-store"
    });

    if (!extRes.ok) {
      throw new Error(`Failed to fetch extensions: ${extRes.statusText}`);
    }

    const extData = await extRes.json();
    const recordsList: RingCentralExtension[] = extData.records || [];

    // Fetch account phone numbers
    const userPhoneNumbers = new Set<string>();
    try {
      const pnUrl = `${server}/restapi/v1.0/account/~/phone-number?perPage=100`;
      const pnRes = await fetch(pnUrl, {
        headers: {
          "Authorization": `Bearer ${accessToken}`,
          "Accept": "application/json"
        },
        cache: "no-store"
      });
      if (pnRes.ok) {
        const pnData = await pnRes.json();
        const pns = pnData.records || [];
        pns.forEach((p: { phoneNumber?: string; extension?: { id: string | number; extensionNumber: string } }) => {
          const ext = p.extension;
          if (ext) {
            const extRecord = recordsList.find((r: RingCentralExtension) => 
              String(r.id) === String(ext.id) || 
              String(r.extensionNumber) === String(ext.extensionNumber)
            );
            if (extRecord && extRecord.type === "User" && p.phoneNumber) {
              userPhoneNumbers.add(p.phoneNumber);
            }
          }
        });
      }
    } catch (pnErr) {
      console.error("Failed to fetch phone number mapping during cron:", pnErr);
    }

    // Fetch Call Logs (Paginated)
    let logs: RingCentralCallLog[] = [];
    let page = 1;
    let hasMore = true;
    const perPage = 1000;

    while (hasMore) {
      const logUrl = `${server}/restapi/v1.0/account/~/call-log?dateFrom=${dateFrom}&dateTo=${dateTo}&view=Simple&direction=Inbound&perPage=${perPage}&page=${page}`;
      const logRes = await fetch(logUrl, {
        headers: {
          "Authorization": `Bearer ${accessToken}`,
          "Accept": "application/json"
        },
        cache: "no-store"
      });

      if (!logRes.ok) {
        throw new Error(`Failed to query call log: ${await logRes.text()}`);
      }

      const logData = await logRes.json();
      const records = logData.records || [];
      logs = logs.concat(records);

      if (records.length < perPage || !logData.navigation?.nextPage) {
        hasMore = false;
      } else {
        page++;
      }
    }

    // Aggregate metrics
    const metrics = aggregateCallLogs(logs, recordsList, userPhoneNumbers);

    // Upsert into Supabase daily_call_telemetry
    const { error: dbErr } = await supabase
      .from("daily_call_telemetry")
      .upsert({
        date: targetDate,
        inbound_calls: metrics.totalCalls,
        answered_calls: metrics.answeredCalls,
        missed_calls: metrics.missedCalls,
        abandoned_calls: metrics.abandonedCalls,
        avg_wait_seconds: metrics.avgWaitSeconds
      });

    if (dbErr) {
      throw new Error(`Supabase DB Write Error: ${dbErr.message}`);
    }

    return NextResponse.json({
      status: "ok",
      date: targetDate,
      metrics: {
        inbound: metrics.totalCalls,
        answered: metrics.answeredCalls,
        missed: metrics.missedCalls,
        abandoned: metrics.abandonedCalls,
        avg_wait: metrics.avgWaitSeconds
      }
    });

  } catch (err: unknown) {
    console.error("Cron sync execution failed:", err);
    return NextResponse.json({ error: (err as Error).message }, { status: 500 });
  }
}
