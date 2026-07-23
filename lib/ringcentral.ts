// Shared RingCentral utilities for API and cron routes

export interface RingCentralPresenceRecord {
  presenceStatus?: string;
  telephonyStatus?: string;
}

export interface CallBounds {
  dateFrom: string;
  dateTo: string;
  isToday: boolean;
}

export interface RingCentralExtension {
  id: string;
  extensionNumber: string;
  name: string;
  type: string;
  status: string;
  occupancy?: number;
}

export interface RingCentralCallLog {
  id?: string;
  sessionId?: string;
  telephonySessionId?: string;
  direction: string;
  result: string;
  action?: string;
  duration?: number;
  startTime?: string;
  from?: { name?: string; phoneNumber?: string; extensionNumber?: string };
  to?: { name?: string; phoneNumber?: string; extensionNumber?: string };
}

export function getPacificDateBounds(dateStr?: string): CallBounds {
  const dateStrLA = dateStr || new Date().toLocaleDateString("en-CA", { timeZone: "America/Los_Angeles" });
  const parts = dateStrLA.split("-").map(Number);

  // Create a UTC date at midnight of the target day
  const utcDate = new Date(Date.UTC(parts[0], parts[1] - 1, parts[2], 0, 0, 0));
  
  // Format the UTC date in America/Los_Angeles to see what local hour it corresponds to
  const laHour = parseInt(
    new Intl.DateTimeFormat("en-US", { 
      timeZone: "America/Los_Angeles", 
      hour: "2-digit", 
      hour12: false 
    }).format(utcDate), 
    10
  );

  // The local hour tells us the offset (e.g. 17:00 means offset is -7 hours, 16:00 means -8 hours)
  const offsetHours = laHour >= 12 ? laHour - 24 : laHour;

  // Set UTC bounds shifted by the local timezone offset to cover 00:00:00 to 23:59:59 Pacific time
  const dateFrom = new Date(Date.UTC(parts[0], parts[1] - 1, parts[2], -offsetHours, 0, 0)).toISOString();
  const dateTo = new Date(Date.UTC(parts[0], parts[1] - 1, parts[2], -offsetHours + 23, 59, 59, 999)).toISOString();

  const todayLA = new Date().toLocaleDateString("en-CA", { timeZone: "America/Los_Angeles" });
  const isTodayDate = !dateStr || dateStr === todayLA;

  return { dateFrom, dateTo, isToday: isTodayDate };
}

export async function getAccessToken(
  server: string,
  clientId: string,
  clientSecret: string,
  jwt: string
): Promise<string> {
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
    }),
    cache: "no-store"
  });

  if (!res.ok) {
    const errText = await res.text();
    throw new Error(`Authentication failed: ${errText}`);
  }

  const data = await res.json();
  return data.access_token;
}

export interface AggregatedMetrics {
  queueLogs: RingCentralCallLog[];
  totalCalls: number;
  answeredCalls: number;
  missedCalls: number;
  abandonedCalls: number;
  avgWaitSeconds: number;
  avgHandleTimeSeconds: number;
  serviceLevelSLA: number;
  hourlyVolume: number[];
  hourlyAnswered: number[];
  hourlyMissed: number[];
}

export function aggregateCallLogs(
  logs: RingCentralCallLog[],
  recordsList: RingCentralExtension[],
  userPhoneNumbers: Set<string>
): AggregatedMetrics {
  const userNames = recordsList.filter((r: RingCentralExtension) => r.type === "User").map((r: RingCentralExtension) => r.name);
  const userExts = recordsList.filter((r: RingCentralExtension) => r.type === "User").map((r: RingCentralExtension) => r.extensionNumber);

  // Filter logs for Inbound Queue/Support Calls only (exclude direct calls to agent personal extensions)
  const queueLogs = logs.filter((l: RingCentralCallLog) => {
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

  const isAcceptedCall = (log: RingCentralCallLog) => log.result === "Accepted" || log.result === "Call connected";
  const isMissedStatusCall = (log: RingCentralCallLog) => missedResultStatuses.includes(log.result) || log.action === "Missed";

  // Group queue logs by Session ID (or caller phone + 3-min window fallback)
  const sessionMap = new Map<string, RingCentralCallLog[]>();
  queueLogs.forEach((log) => {
    const fromPhone = log.from?.phoneNumber || log.from?.name || log.from?.extensionNumber;
    const timeKey = log.startTime
      ? String(Math.floor(new Date(log.startTime).getTime() / (5 * 60 * 1000)))
      : Math.random().toString();
    const sessionKey = log.sessionId || log.telephonySessionId || (fromPhone ? `${fromPhone}_${timeKey}` : (log.id || `anon_${Math.random()}`));

    if (!sessionMap.has(sessionKey)) {
      sessionMap.set(sessionKey, []);
    }
    sessionMap.get(sessionKey)!.push(log);
  });

  // 1. Answered: Any session where at least 1 leg was an accepted conversation (duration >= 45s)
  answeredCalls = 0;
  let uniqueMissedCalls = 0;
  let uniqueAbandonedCalls = 0;

  sessionMap.forEach((sessionLogs) => {
    const hasAnsweredLeg = sessionLogs.some(l => isAcceptedCall(l) && (l.duration || 0) >= 45);
    if (hasAnsweredLeg) {
      answeredCalls++;
      return;
    }

    const hasMissedLeg = sessionLogs.some(l => isMissedStatusCall(l) && (l.duration || 0) >= 9);
    const hasExplicitAbandon = sessionLogs.some(l => abandonedResultStatuses.includes(l.result));
    const hasShortLeg = sessionLogs.some(l => (l.duration || 0) <= 8);

    if (hasMissedLeg) {
      uniqueMissedCalls++;
    } else if (hasExplicitAbandon || hasShortLeg) {
      uniqueAbandonedCalls++;
    }
  });

  missedCalls = uniqueMissedCalls;
  abandonedCalls = uniqueAbandonedCalls;

  // Proxy wait time from Simple Call Log data (no dedicated wait-time field available).
  // The RingCentral Simple API only returns total call duration (ring + talk time combined),
  // not queue hold time. We use these bounded estimates to approximate queue wait:
  // - Answered calls (>= 45s): caller waited while routing — cap at 25s (realistic queue max)
  // - Short accepted calls (< 45s): answered near-instantly — cap at 10s
  // - Unanswered/abandoned calls: ring duration IS the caller's wait, capped at 45s
  const waitTimes = queueLogs.map((l: RingCentralCallLog) => {
    const dur = l.duration || 0;
    const isAnswered = isAcceptedCall(l) && dur >= 45;
    const isShortAccepted = isAcceptedCall(l) && dur < 45;
    if (isAnswered) return Math.min(dur, 25);
    if (isShortAccepted) return Math.min(dur, 10);
    return Math.min(dur, 45);
  });

  if (waitTimes.length > 0) {
    avgWaitSeconds = Math.round(waitTimes.reduce((a: number, b: number) => a + b, 0) / waitTimes.length);
  }

  // Populate hourly trends (in America/Los_Angeles timezone)
  queueLogs.forEach((log: RingCentralCallLog) => {
    if (log.startTime) {
      const hourStr = new Intl.DateTimeFormat("en-US", {
        timeZone: "America/Los_Angeles",
        hour: "numeric",
        hourCycle: "h23"
      }).format(new Date(log.startTime));
      const hour = (parseInt(hourStr, 10) || 0) % 24;

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

  // Calculate Average Handle Time (AHT = Total talk duration / Answered calls)
  const answeredLogsList = queueLogs.filter((l: RingCentralCallLog) => isAcceptedCall(l) && (l.duration || 0) >= 45);
  const totalTalkSeconds = answeredLogsList.reduce((acc, log) => acc + (log.duration || 0), 0);
  const avgHandleTimeSeconds = answeredCalls > 0 ? Math.round(totalTalkSeconds / answeredCalls) : 0;

  // Calculate Service Level SLA % (Percentage of answered calls with wait duration <= 20s)
  const answeredWithin20s = answeredLogsList.filter((l: RingCentralCallLog) => (l.duration || 0) <= 20).length;
  const serviceLevelSLA = totalCalls > 0 ? Math.round((answeredWithin20s / totalCalls) * 100) : 100;

  return {
    queueLogs,
    totalCalls,
    answeredCalls,
    missedCalls,
    abandonedCalls,
    avgWaitSeconds,
    avgHandleTimeSeconds,
    serviceLevelSLA,
    hourlyVolume,
    hourlyAnswered,
    hourlyMissed
  };
}

export async function getAgentPresenceCounts(
  server: string,
  accessToken: string
): Promise<{ online: number; onCall: number; available: number; dnd: number; offline: number; presenceMap: Map<string, RingCentralPresenceRecord> }> {
  const presenceUrl = `${server}/restapi/v1.0/account/~/presence?perPage=100`;
  const res = await fetch(presenceUrl, {
    headers: {
      "Authorization": `Bearer ${accessToken}`,
      "Accept": "application/json"
    },
    cache: "no-store"
  });

  if (!res.ok) {
    throw new Error(`Failed to fetch batch presence: ${res.statusText}`);
  }

  const data = await res.json();
  const records = (data.records || []) as (RingCentralPresenceRecord & { extension?: { id?: number; extensionNumber?: string } })[];

  const presenceMap = new Map<string, RingCentralPresenceRecord>();
  let online = 0;
  let onCall = 0;
  let available = 0;
  let dnd = 0;
  let offline = 0;

  records.forEach((r) => {
    const extNum = r.extension?.extensionNumber ? String(r.extension.extensionNumber) : "";
    const extId = r.extension?.id ? String(r.extension.id) : "";
    if (extNum) presenceMap.set(extNum, r);
    if (extId) presenceMap.set(extId, r);

    const pStatus = r.presenceStatus;
    const tStatus = r.telephonyStatus;

    if (tStatus === "CallConnected" || tStatus === "Ringing") {
      onCall++;
      online++;
    } else if (pStatus === "Available") {
      available++;
      online++;
    } else if (pStatus === "Busy" || pStatus === "DND") {
      dnd++;
      online++;
    } else {
      offline++;
    }
  });

  return { online, onCall, available, dnd, offline, presenceMap };
}

export async function getActiveQueueCount(
  server: string,
  accessToken: string
): Promise<number> {
  const activeCallsUrl = `${server}/restapi/v1.0/account/~/active-calls?direction=Inbound&view=Simple`;
  const res = await fetch(activeCallsUrl, {
    headers: {
      "Authorization": `Bearer ${accessToken}`,
      "Accept": "application/json"
    },
    cache: "no-store"
  });

  if (!res.ok) {
    throw new Error(`Failed to fetch active calls: ${res.statusText}`);
  }

  const data = await res.json();
  const records = (data.records || []) as { telephonyStatus?: string }[];

  return records.filter((c) => c.telephonyStatus === "Ringing").length;
}

export async function fetchExtensions(
  server: string,
  accessToken: string
): Promise<RingCentralExtension[]> {
  const extUrl = `${server}/restapi/v1.0/account/~/extension?status=Enabled&perPage=50`;
  const res = await fetch(extUrl, {
    headers: {
      "Authorization": `Bearer ${accessToken}`,
      "Accept": "application/json"
    },
    cache: "no-store"
  });

  if (!res.ok) {
    throw new Error(`Failed to fetch extensions: ${res.statusText}`);
  }

  const extData = await res.json();
  return extData.records || [];
}

export async function fetchUserPhoneNumbers(
  server: string,
  accessToken: string,
  recordsList: RingCentralExtension[]
): Promise<Set<string>> {
  const userPhoneNumbers = new Set<string>();
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
  return userPhoneNumbers;
}

/**
 * Anonymizes caller PII before sending to the browser or caching.
 * - Names: "John Smith" → "John S."
 * - Phones: "+12065550199" → "+1206555****"
 */
export function maskPII(
  name: string | undefined,
  phone: string | undefined
): { maskedName: string; maskedPhone: string } {
  const maskedName = name
    ? name
        .trim()
        .split(" ")
        .map((part, i) => (i === 0 ? part : part.charAt(0) + "."))
        .join(" ")
    : "Unknown";

  const maskedPhone = phone
    ? phone.replace(/(\d{4})$/, "****")
    : "Unknown";

  return { maskedName, maskedPhone };
}
