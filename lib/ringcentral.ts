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
  direction: string;
  result: string;
  action?: string;
  duration?: number;
  startTime?: string;
  from?: { name?: string; phoneNumber?: string; extensionNumber?: string };
  to?: { name?: string; phoneNumber?: string; extensionNumber?: string };
}

export function getPacificDateBounds(dateStr?: string): CallBounds {
  let year: number;
  let month: number;
  let day: number;

  if (dateStr) {
    if (!/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) {
      throw new Error("Invalid date format. Expected YYYY-MM-DD");
    }
    const parts = dateStr.split("-");
    year = parseInt(parts[0], 10);
    month = parseInt(parts[1], 10) - 1; // 0-indexed
    day = parseInt(parts[2], 10);
  } else {
    // Get current date in UTC Time
    const utcDate = new Date();
    year = utcDate.getUTCFullYear();
    month = utcDate.getUTCMonth();
    day = utcDate.getUTCDate();
  }

  // UTC Midnight boundaries
  const dateFrom = new Date(Date.UTC(year, month, day, 0, 0, 0, 0)).toISOString();
  const dateTo = new Date(Date.UTC(year, month, day, 23, 59, 59, 999)).toISOString();

  const todayUTC = new Date().toISOString().split("T")[0];
  const isTodayDate = !dateStr || dateStr === todayUTC;

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

  // 1. Answered: Accepted connection with duration >= 45s (agent conversation)
  answeredCalls = queueLogs.filter((l: RingCentralCallLog) => {
    return isAcceptedCall(l) && (l.duration || 0) >= 45;
  }).length;

  // 2. Abandoned: Explicit hang-up, OR any call (accepted/missed) under 9s (IVR drops)
  abandonedCalls = queueLogs.filter((l: RingCentralCallLog) => {
    const isExplicitAbandon = abandonedResultStatuses.includes(l.result);
    const isShortAccepted = isAcceptedCall(l) && (l.duration || 0) <= 8;
    const isShortMissed = isMissedStatusCall(l) && (l.duration || 0) <= 8;
    return isExplicitAbandon || isShortAccepted || isShortMissed;
  }).length;

  // 3. Missed: Unanswered status with duration >= 9s (rings through to VM or timeout)
  missedCalls = queueLogs.filter((l: RingCentralCallLog) => {
    return isMissedStatusCall(l) && (l.duration || 0) >= 9;
  }).length;

  // Proxy wait time from Simple Call Log data (no dedicated wait-time field available):
  // - Answered calls (>= 45s): subtract 30s talk-floor estimate to isolate hold portion
  // - Short accepted calls (< 45s): answered too quickly to attribute meaningful wait — proxy as 0
  // - Unanswered/abandoned calls: full ring duration IS the caller's wait time, capped at 120s
  const waitTimes = queueLogs.map((l: RingCentralCallLog) => {
    const dur = l.duration || 0;
    const isAnswered = isAcceptedCall(l) && dur >= 45;
    const isShortAccepted = isAcceptedCall(l) && dur < 45;
    if (isAnswered) return Math.max(0, dur - 30);
    if (isShortAccepted) return 0;
    return Math.min(dur, 120);
  });

  if (waitTimes.length > 0) {
    avgWaitSeconds = Math.round(waitTimes.reduce((a: number, b: number) => a + b, 0) / waitTimes.length);
  }

  // Populate hourly trends
  queueLogs.forEach((log: RingCentralCallLog) => {
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

  return {
    queueLogs,
    totalCalls,
    answeredCalls,
    missedCalls,
    abandonedCalls,
    avgWaitSeconds,
    hourlyVolume,
    hourlyAnswered,
    hourlyMissed
  };
}

export async function getAgentPresenceCounts(
  server: string,
  accessToken: string
): Promise<{ online: number; onCall: number; available: number; dnd: number; offline: number }> {
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
  const records = (data.records || []) as RingCentralPresenceRecord[];

  let online = 0;
  let onCall = 0;
  let available = 0;
  let dnd = 0;
  let offline = 0;

  records.forEach((r) => {
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

  return { online, onCall, available, dnd, offline };
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
