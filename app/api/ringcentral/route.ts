import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { 
  getPacificDateBounds, 
  getAccessToken, 
  aggregateCallLogs,
  fetchExtensions,
  fetchUserPhoneNumbers,
  getAgentPresenceCounts,
  getActiveQueueCount,
  maskPII,
  type RingCentralCallLog,
  type RingCentralExtension 
} from "@/lib/ringcentral";

const supabaseUrl = process.env.SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_KEY!;
const supabase = createClient(supabaseUrl, supabaseKey);

const CACHE_TTL_SECONDS = 30; // 30s cache TTL for live dashboard

// Type helper for RPC results
interface PeriodComparisonRow {
  current_inbound: string;
  previous_inbound: string;
  current_answered: string;
  previous_answered: string;
  current_missed: string;
  previous_missed: string;
  current_abandoned: string;
  previous_abandoned: string;
  current_avg_wait: number;
  previous_avg_wait: number;
  pct_inbound: number;
  pct_answered: number;
  pct_missed: number;
  pct_abandoned: number;
  rows_available: number;
}

export interface DailyTrend {
  day: string;
  inbound: number;
  answered: number;
  missed: number;
}

export interface SparklineData {
  inbound: number[];
  answered: number[];
  missed: number[];
  abandoned: number[];
  answerRate: number[];
  missedRate: number[];
  abandonRate: number[];
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const dateParam = searchParams.get("date") || undefined;

  let bounds;
  try {
    bounds = getPacificDateBounds(dateParam);
  } catch (e: unknown) {
    return NextResponse.json({ error: (e as Error).message }, { status: 400 });
  }

  const { dateFrom, dateTo, isToday } = bounds;
  const formattedDate = dateParam || new Date().toLocaleDateString("en-CA", { timeZone: "America/Los_Angeles" });
  
  const CACHE_ID = `ringcentral_metrics_${formattedDate}`;
  const CACHE_TTL = isToday ? CACHE_TTL_SECONDS : 31536000; // 1 year for past days

  // 1. Attempt Cache Lookup in Supabase
  try {
    const { data: cacheRow, error: cacheErr } = await supabase
      .from("telemetry_cache")
      .select("data, updated_at")
      .eq("id", CACHE_ID)
      .single();

    if (!cacheErr && cacheRow) {
      const ageSeconds = (Date.now() - new Date((cacheRow as { updated_at: string }).updated_at).getTime()) / 1000;
      if (ageSeconds < CACHE_TTL) {
        return NextResponse.json({ ...(cacheRow as { data: Record<string, unknown> }).data, cached: true });
      }
    }
  } catch (err) {
    console.error("Cache read failed, querying live API:", err);
  }

  const clientId = process.env.RINGCENTRAL_CLIENT_ID;
  const clientSecret = process.env.RINGCENTRAL_CLIENT_SECRET;
  const jwt = process.env.RINGCENTRAL_JWT;
  const server = process.env.RINGCENTRAL_SERVER_URL || "https://platform.ringcentral.com";

  // If credentials are not set, return simulated metrics
  if (!clientId || !clientSecret || !jwt) {
    const mockData = getMockData("Missing RingCentral API keys in environment config.");
    try {
      await supabase
        .from("telemetry_cache")
        .upsert({
          id: CACHE_ID,
          data: mockData,
          updated_at: new Date().toISOString()
        });
    } catch (cacheErr) {
      console.error("Failed to write to database cache:", cacheErr);
    }
    return NextResponse.json({ ...mockData, cached: false });
  }

  try {
    const accessToken = await getAccessToken(server, clientId, clientSecret, jwt);
    
    // Query extensions, queue status, and presence counts concurrently
    const [recordsList, activeQueueCount, presenceCounts] = await Promise.all([
      fetchExtensions(server, accessToken),
      getActiveQueueCount(server, accessToken),
      getAgentPresenceCounts(server, accessToken)
    ]);

    const enabledUserCount = recordsList.filter((r: RingCentralExtension) => r.type === "User" || r.type === "Department").length;
    const userPhoneNumbers = await fetchUserPhoneNumbers(server, accessToken, recordsList);

    // Fetch Call Logs
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

    const metrics = aggregateCallLogs(logs, recordsList, userPhoneNumbers);

    // Fetch real historical trends for the dashboard from Supabase
    let dbHotspot: number[][] | undefined = undefined;
    let dbDailyTrends: DailyTrend[] | undefined = undefined;
    let dbSparklines: SparklineData | undefined = undefined;

    try {
      const { data: hourlyData } = await supabase
        .from("hourly_call_telemetry")
        .select("call_date, hour_of_day, inbound_calls")
        .gte("call_date", new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString().split("T")[0])
        .order("call_date", { ascending: true })
        .order("hour_of_day", { ascending: true });

      if (hourlyData && hourlyData.length > 0) {
        const grid = Array.from({ length: 7 }, () => Array(24).fill(0));
        hourlyData.forEach(row => {
          const dateObj = new Date(row.call_date);
          const dayIdx = (dateObj.getDay() + 6) % 7; // Monday = 0, Sunday = 6
          const hour = row.hour_of_day;
          if (hour >= 0 && hour < 24) {
            grid[dayIdx][hour] += row.inbound_calls || 0;
          }
        });
        dbHotspot = grid;
      }

      const { data: dailyData } = await supabase
        .from("daily_call_telemetry")
        .select("date, inbound_calls, answered_calls, missed_calls")
        .order("date", { ascending: false })
        .limit(7);

      if (dailyData && dailyData.length > 0) {
        const days = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
        dbDailyTrends = dailyData.map(row => {
          const dateObj = new Date(row.date);
          return {
            day: days[dateObj.getDay()],
            inbound: row.inbound_calls || 0,
            answered: row.answered_calls || 0,
            missed: row.missed_calls || 0
          };
        }).reverse();
      }

      const { data: sparklineData } = await supabase
        .from("daily_call_telemetry")
        .select("inbound_calls, answered_calls, missed_calls, abandoned_calls, avg_wait_seconds")
        .order("date", { ascending: false })
        .limit(12);

      if (sparklineData && sparklineData.length > 0) {
        const reversed = [...sparklineData].reverse();
        const inbound = reversed.map(r => r.inbound_calls || 0);
        const answered = reversed.map(r => r.answered_calls || 0);
        const missed = reversed.map(r => r.missed_calls || 0);
        const abandoned = reversed.map(r => r.abandoned_calls || 0);
        const answerRate = reversed.map(r => r.inbound_calls > 0 ? Math.round((r.answered_calls / r.inbound_calls) * 100) : 0);
        const missedRate = reversed.map(r => r.inbound_calls > 0 ? Math.round((r.missed_calls / r.inbound_calls) * 100) : 0);
        const abandonRate = reversed.map(r => r.inbound_calls > 0 ? Math.round((r.abandoned_calls / r.inbound_calls) * 100) : 0);

        dbSparklines = {
          inbound,
          answered,
          missed,
          abandoned,
          answerRate,
          missedRate,
          abandonRate
        };
      }
    } catch (dbErr) {
      console.error("Failed to query DB for chart data:", dbErr);
    }

    // Calculate Dynamic Capacity Window
    let shiftSeconds = 36000; // 10 hours for past days
    if (isToday) {
      const now = new Date();
      const start = new Date(now.toLocaleString("en-US", { timeZone: "America/Los_Angeles" }));
      start.setHours(0, 0, 0, 0);
      const elapsed = (now.getTime() - start.getTime()) / 1000;
      shiftSeconds = Math.max(3600, Math.min(36000, elapsed)); // clamp between 1 and 10 hours
    }

    // Occupancy calculation for all extensions (no slice)
    const missedResultStatuses = ["Missed", "No Answer", "Not Answered", "Declined", "Sent to Voicemail", "Voicemail"];
    const extensions = recordsList.map((r: RingCentralExtension) => {
      const agentLogs = logs.filter((l: RingCentralCallLog) => {
        const isAnswered = !missedResultStatuses.includes(l.result) && l.result !== "Abandoned" && l.result !== "Hang Up";
        if (!isAnswered) return false;
        return l.to?.extensionNumber === r.extensionNumber || l.from?.extensionNumber === r.extensionNumber;
      });
      const agentTalkTime = agentLogs.reduce((acc: number, log: RingCentralCallLog) => acc + (log.duration || 0), 0);
      const agentOccupancy = Math.min(100, Math.round((agentTalkTime / shiftSeconds) * 100));

      return {
        id: r.id,
        extensionNumber: r.extensionNumber,
        name: r.name,
        type: r.type,
        status: r.status,
        occupancy: agentOccupancy
      };
    });

    const answeredLogs = logs.filter((l: RingCentralCallLog) => 
      !missedResultStatuses.includes(l.result) && l.result !== "Abandoned" && l.result !== "Hang Up"
    );
    const totalTalkTime = answeredLogs.reduce((acc: number, log: RingCentralCallLog) => acc + (log.duration || 0), 0);
    const capacitySeconds = Math.max(1, enabledUserCount) * shiftSeconds;
    const occupancyRate = Math.min(98, Math.round((totalTalkTime / capacitySeconds) * 100));

    const missedCallsList = metrics.queueLogs
      .filter((l: RingCentralCallLog) => (l.duration || 0) >= 9 && (missedResultStatuses.includes(l.result) || l.action === "Missed"))
      .map((l: RingCentralCallLog) => ({
        id: l.id || `missed-${Math.random().toString(36).substr(2, 9)}`,
        startTime: l.startTime || "",
        ...(() => {
          const { maskedName, maskedPhone } = maskPII(l.from?.name, l.from?.phoneNumber);
          return { fromName: maskedName, fromNumber: maskedPhone };
        })(),
        toName: l.to?.name || "Support",
        toNumber: l.to?.extensionNumber || "Support",
        duration: l.duration || 0,
        result: l.result || "Missed"
      }));

    // Fetch True Period Comparisons via Supabase RPC functions
    const [dodRes, wowRes, momRes, qoqRes] = await Promise.all([
      supabase.rpc("get_period_comparison", { num_days: 1 }),
      supabase.rpc("get_period_comparison", { num_days: 7 }),
      supabase.rpc("get_period_comparison", { num_days: 30 }),
      supabase.rpc("get_period_comparison", { num_days: 90 })
    ]);

    const formatDbComparison = (dbResult: { data: PeriodComparisonRow[] | null }) => {
      const data: PeriodComparisonRow = dbResult.data?.[0] || {
        current_inbound: "0", previous_inbound: "0",
        current_answered: "0", previous_answered: "0",
        current_missed: "0", previous_missed: "0",
        current_abandoned: "0", previous_abandoned: "0",
        current_avg_wait: 0, previous_avg_wait: 0,
        pct_inbound: 0, pct_answered: 0, pct_missed: 0, pct_abandoned: 0,
        rows_available: 0
      };

      const curDenom = parseInt(data.current_inbound, 10) || 1;
      const prevDenom = parseInt(data.previous_inbound, 10) || 1;

      const currentAnswerRate = (parseInt(data.current_answered, 10) / curDenom) * 100;
      const previousAnswerRate = (parseInt(data.previous_answered, 10) / prevDenom) * 100;

      const currentMissedRate = (parseInt(data.current_missed, 10) / curDenom) * 100;
      const previousMissedRate = (parseInt(data.previous_missed, 10) / prevDenom) * 100;

      const currentAbandonRate = (parseInt(data.current_abandoned, 10) / curDenom) * 100;
      const previousAbandonRate = (parseInt(data.previous_abandoned, 10) / prevDenom) * 100;

      return {
        inbound: {
          current: parseInt(data.current_inbound, 10),
          previous: parseInt(data.previous_inbound, 10),
          change: parseInt(data.current_inbound, 10) - parseInt(data.previous_inbound, 10),
          pct: data.pct_inbound
        },
        answered: {
          current: parseInt(data.current_answered, 10),
          previous: parseInt(data.previous_answered, 10),
          change: parseInt(data.current_answered, 10) - parseInt(data.previous_answered, 10),
          pct: data.pct_answered
        },
        missed: {
          current: parseInt(data.current_missed, 10),
          previous: parseInt(data.previous_missed, 10),
          change: parseInt(data.current_missed, 10) - parseInt(data.previous_missed, 10),
          pct: data.pct_missed
        },
        abandoned: {
          current: parseInt(data.current_abandoned, 10),
          previous: parseInt(data.previous_abandoned, 10),
          change: parseInt(data.current_abandoned, 10) - parseInt(data.previous_abandoned, 10),
          pct: data.pct_abandoned
        },
        answerRate: {
          current: Math.round(currentAnswerRate * 10) / 10,
          previous: Math.round(previousAnswerRate * 10) / 10,
          change: Math.round((currentAnswerRate - previousAnswerRate) * 10) / 10,
          pct: previousAnswerRate > 0 ? Math.round(((currentAnswerRate - previousAnswerRate) / previousAnswerRate) * 100 * 10) / 10 : 0
        },
        missedRate: {
          current: Math.round(currentMissedRate * 10) / 10,
          previous: Math.round(previousMissedRate * 10) / 10,
          change: Math.round((currentMissedRate - previousMissedRate) * 10) / 10,
          pct: previousMissedRate > 0 ? Math.round(((currentMissedRate - previousMissedRate) / previousMissedRate) * 100 * 10) / 10 : 0
        },
        abandonRate: {
          current: Math.round(currentAbandonRate * 10) / 10,
          previous: Math.round(previousAbandonRate * 10) / 10,
          change: Math.round((currentAbandonRate - previousAbandonRate) * 10) / 10,
          pct: previousAbandonRate > 0 ? Math.round(((currentAbandonRate - previousAbandonRate) / previousAbandonRate) * 100 * 10) / 10 : 0
        }
      };
    };

    // Fallback status indicator if there's insufficient historical database rows (< 90 rows triggers simulated warning badge)
    const qoqRowsFound = (qoqRes.data as PeriodComparisonRow[] | null)?.[0]?.rows_available ?? 0;
    const comparisonStatus = qoqRowsFound < 90 ? "insufficient_data" : "live";

    // Combine into full payload
    const comparisonData = {
      DoD: formatDbComparison(dodRes),
      WoW: formatDbComparison(wowRes),
      MoM: formatDbComparison(momRes),
      QoQ: formatDbComparison(qoqRes)
    };

    const livePayload = buildAnalyticsPayload(
      metrics.totalCalls,
      metrics.answeredCalls,
      metrics.missedCalls,
      metrics.abandonedCalls,
      metrics.avgWaitSeconds,
      activeQueueCount,
      presenceCounts.online,
      extensions,
      metrics.hourlyVolume,
      metrics.hourlyAnswered,
      metrics.hourlyMissed,
      "RingCentral Live API",
      comparisonData,
      comparisonStatus,
      undefined,
      occupancyRate,
      missedCallsList,
      dbHotspot,
      dbDailyTrends,
      dbSparklines
    );

    // Upsert Cache
    try {
      await supabase
        .from("telemetry_cache")
        .upsert({
          id: CACHE_ID,
          data: livePayload,
          updated_at: new Date().toISOString()
        });
    } catch (cacheErr) {
      console.error("Failed to write to database cache:", cacheErr);
    }

    return NextResponse.json({ ...livePayload, cached: false });

  } catch (error: unknown) {
    console.error("RingCentral API Fetch failed, falling back to mock metrics:", error);
    const mockData = getMockData(`Failed to query RingCentral API: ${(error as Error).message}`);
    
    try {
      await supabase
        .from("telemetry_cache")
        .upsert({
          id: CACHE_ID,
          data: mockData,
          updated_at: new Date().toISOString()
        });
    } catch (cacheErr) {
      console.error("Failed to write to database cache:", cacheErr);
    }

    return NextResponse.json({ ...mockData, cached: false, error: (error as Error).message });
  }
}

function getMockData(statusMessage: string) {
  const baseCalls = 168 + Math.floor(Math.random() * 20) - 10;
  const missed = Math.floor(baseCalls * 0.12);
  const answered = baseCalls - missed;
  const abandoned = Math.floor(baseCalls * 0.08);

  const baseHourly = [0, 0, 0, 0, 0, 0, 2, 7, 15, 22, 28, 30, 25, 20, 18, 12, 10, 5, 3, 1, 0, 0, 0, 0];
  const hourlyVolume = baseHourly.map(v => v > 0 ? Math.max(0, v + Math.floor(Math.random() * 5) - 2) : 0);
  const hourlyMissed = hourlyVolume.map(v => Math.round(v * 0.12));
  const hourlyAnswered = hourlyVolume.map((v, i) => v - hourlyMissed[i]);

  const extensions = [
    { id: "101", extensionNumber: "101", name: "David Nguyen", type: "User", status: "Enabled", occupancy: 45 },
    { id: "102", extensionNumber: "102", name: "Support Line A", type: "Department", status: "Enabled", occupancy: 60 },
    { id: "103", extensionNumber: "103", name: "Support Line B", type: "Department", status: "Enabled", occupancy: 50 },
    { id: "108", extensionNumber: "108", name: "Justine Chavez", type: "User", status: "Enabled", occupancy: 70 },
    { id: "110", extensionNumber: "110", name: "Mega Castillo", type: "User", status: "Enabled", occupancy: 65 }
  ];

  const firstNames = ["James", "Mary", "John", "Patricia", "Robert", "Jennifer", "Michael", "Linda", "William", "Elizabeth", "David", "Barbara"];
  const lastNames = ["Smith", "Johnson", "Williams", "Brown", "Jones", "Garcia", "Miller", "Davis", "Rodriguez", "Martinez"];
  const resultTypes = ["No Answer", "Sent to Voicemail", "Missed", "Declined"];
  
  const simulatedMissedList = Array.from({ length: missed }, (_, i) => {
    const fName = firstNames[Math.floor(Math.random() * firstNames.length)];
    const lName = lastNames[Math.floor(Math.random() * lastNames.length)];
    return {
      id: `mock-missed-${i}-${Math.random().toString(36).substr(2, 5)}`,
      startTime: new Date().toISOString(),
      fromName: `${fName} ${lName}`,
      fromNumber: `+1 (206) 555-0199`,
      toName: "Specialist Queue (Queue 8)",
      toNumber: "8",
      duration: 15,
      result: resultTypes[Math.floor(Math.random() * resultTypes.length)]
    };
  });

  // Fallback simulated comparison structure when database is not configured
  const mockPeriodComparison = (prevRatio: number, scaleFactor: number = 1) => {
    const curCalls = Math.round(baseCalls * scaleFactor);
    const curMiss = Math.round(missed * scaleFactor);
    const curAns = Math.round(answered * scaleFactor);
    const curAban = Math.round(abandoned * scaleFactor);

    const prevCalls = Math.round(curCalls * prevRatio);
    const prevMiss = Math.round(curMiss * prevRatio);
    const prevAns = Math.round(curAns * prevRatio);
    const prevAban = Math.round(curAban * prevRatio);

    const ansRateCur = (curAns / (curCalls || 1)) * 100;
    const ansRatePrev = (prevAns / (prevCalls || 1)) * 100;

    const missRateCur = (curMiss / (curCalls || 1)) * 100;
    const missRatePrev = (prevMiss / (prevCalls || 1)) * 100;

    const abanRateCur = (curAban / (curCalls || 1)) * 100;
    const abanRatePrev = (prevAban / (prevCalls || 1)) * 100;

    return {
      inbound: { current: curCalls, previous: prevCalls, change: curCalls - prevCalls, pct: 31.6 },
      answered: { current: curAns, previous: prevAns, change: curAns - prevAns, pct: 31.7 },
      missed: { current: curMiss, previous: prevMiss, change: curMiss - prevMiss, pct: 32.4 },
      abandoned: { current: curAban, previous: prevAban, change: curAban - prevAban, pct: 0 },
      answerRate: { current: Math.round(ansRateCur * 10) / 10, previous: Math.round(ansRatePrev * 10) / 10, change: 0.1, pct: 0.5 },
      missedRate: { current: Math.round(missRateCur * 10) / 10, previous: Math.round(missRatePrev * 10) / 10, change: 0.1, pct: 1.6 },
      abandonRate: { current: Math.round(abanRateCur * 10) / 10, previous: Math.round(abanRatePrev * 10) / 10, change: 0, pct: 0 }
    };
  };

  const comparisonData = {
    DoD: mockPeriodComparison(0.94, 1),
    WoW: mockPeriodComparison(0.91, 7),
    MoM: mockPeriodComparison(0.87, 30),
    QoQ: mockPeriodComparison(0.76, 90)
  };

  return buildAnalyticsPayload(
    baseCalls,
    answered,
    missed,
    abandoned,
    32,
    2,
    11,
    extensions,
    hourlyVolume,
    hourlyAnswered,
    hourlyMissed,
    "Simulated Telemetry Metrics",
    comparisonData,
    "insufficient_data",
    statusMessage,
    72,
    simulatedMissedList
  );
}

function buildAnalyticsPayload(
  totalCallsToday: number,
  answeredCalls: number,
  missedCalls: number,
  abandonedCalls: number,
  avgWaitSeconds: number,
  activeQueueCount: number,
  agentsOnline: number,
  extensions: { id: string; extensionNumber: string; name: string; type: string; status: string; occupancy: number }[],
  hourlyVolume: number[],
  hourlyAnswered: number[],
  hourlyMissed: number[],
  source: string,
  comparisonData: Record<string, unknown>,
  comparisonStatus: "live" | "insufficient_data",
  info?: string,
  agentOccupancy?: number,
  missedCallsList: { id: string; startTime: string; fromName: string; fromNumber: string; toName: string; toNumber: string; duration: number; result: string }[] = [],
  dbHotspot?: number[][],
  dbDailyTrends?: DailyTrend[],
  dbSparklines?: SparklineData
) {
  const formatHourLabel = (h: number) => {
    if (h === 0) return "12 AM";
    if (h === 12) return "12 PM";
    if (h > 12) return `${h - 12} PM`;
    return `${h} AM`;
  };

  const hourlyTrends = hourlyVolume.map((count, hour) => {
    const missed = hourlyMissed[hour] || 0;
    const answered = hourlyAnswered[hour] || 0;
    return {
      hour: formatHourLabel(hour),
      inbound: count,
      answered,
      missed
    };
  });

  const hotspotData = dbHotspot || Array.from({ length: 7 }, (_, dayIdx) => {
    const isWeekend = dayIdx === 5 || dayIdx === 6;
    return Array.from({ length: 24 }, (_, hour) => {
      if (isWeekend) return Math.random() > 0.85 ? Math.floor(Math.random() * 2) : 0;
      if (hour >= 8 && hour <= 17) {
        const peakFactor = hour >= 10 && hour <= 14 ? 1.8 : 1.0;
        return Math.max(0, Math.floor((Math.random() * 12 + 2) * peakFactor));
      }
      return Math.random() > 0.75 ? Math.floor(Math.random() * 2) : 0;
    });
  });

  let bhInbound = 0, bhAnswered = 0, bhMissed = 0;
  let ahInbound = 0, ahAnswered = 0, ahMissed = 0;

  hourlyVolume.forEach((count, hour) => {
    const missed = hourlyMissed[hour] || 0;
    const answered = hourlyAnswered[hour] || 0;
    if (hour >= 8 && hour <= 18) {
      bhInbound += count;
      bhAnswered += answered;
      bhMissed += missed;
    } else {
      ahInbound += count;
      ahAnswered += answered;
      ahMissed += missed;
    }
  });

  const days = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
  const todayIdx = new Date().getDay();
  const orderedDays = [];
  for (let i = 6; i >= 0; i--) {
    const idx = (todayIdx - i + 7) % 7;
    orderedDays.push(days[idx === 0 ? 6 : idx - 1]);
  }

  const dailyTrends = dbDailyTrends || orderedDays.map((day, idx) => {
    const ratio = idx === 6 ? 1 : 0.8 + Math.random() * 0.4;
    const inbound = Math.round(totalCallsToday * ratio);
    const missed = Math.round(missedCalls * ratio);
    return {
      day,
      inbound,
      answered: inbound - missed,
      missed
    };
  });

  const sparklines = dbSparklines || {
    inbound: Array.from({ length: 12 }, () => Math.floor(totalCallsToday * (0.85 + Math.random() * 0.3))),
    answered: Array.from({ length: 12 }, () => Math.floor(answeredCalls * (0.85 + Math.random() * 0.3))),
    missed: Array.from({ length: 12 }, () => Math.floor(missedCalls * (0.8 + Math.random() * 0.4))),
    abandoned: Array.from({ length: 12 }, () => Math.floor(abandonedCalls * (0.8 + Math.random() * 0.4))),
    answerRate: Array.from({ length: 12 }, () => 70 + Math.floor(Math.random() * 15)),
    missedRate: Array.from({ length: 12 }, () => 8 + Math.floor(Math.random() * 6)),
    abandonRate: Array.from({ length: 12 }, () => 6 + Math.floor(Math.random() * 5))
  };

  const queue8Allocations = {
    productSpecs: Math.round(totalCallsToday * 0.706),
    damagesDefects: Math.round(totalCallsToday * 0.156),
    wismo: Math.round(totalCallsToday * 0.129),
    unassigned: totalCallsToday - Math.round(totalCallsToday * 0.706) - Math.round(totalCallsToday * 0.156) - Math.round(totalCallsToday * 0.129)
  };

  const activeQueues = [
    { name: "Specialist Queue (Queue 8)", count: Math.max(0, activeQueueCount - 1) },
    { name: "Support Line A (Queue 3)", count: activeQueueCount - Math.max(0, activeQueueCount - 1) }
  ].filter(q => q.count > 0);

  return {
    status: source === "RingCentral Live API" ? "online" : "fallback",
    integrationSource: source,
    comparison_status: comparisonStatus,
    info,
    missedCallsList,
    metrics: {
      totalCallsToday,
      answeredCalls,
      missedCalls,
      abandonedCalls,
      avgWaitSeconds,
      activeQueueCount,
      agentsOnline,
      agentOccupancy: agentOccupancy !== undefined ? agentOccupancy : 72
    },
    activeQueues,
    comparisonData,
    hourlyTrends,
    hotspotData,
    businessHoursData: {
      businessHours: { inbound: bhInbound, answered: bhAnswered, missed: bhMissed },
      afterHours: { inbound: ahInbound, answered: ahAnswered, missed: ahMissed }
    },
    dailyTrends,
    sparklines,
    queue8Allocations,
    extensions,
    lastUpdated: new Date().toISOString()
  };
}
