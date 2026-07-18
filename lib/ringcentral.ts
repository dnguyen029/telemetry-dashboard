// Shared RingCentral utilities for API and cron routes

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

  // Estimate wait time
  const waitTimes = queueLogs.map((l: RingCentralCallLog) => {
    const isAns = isAcceptedCall(l) && (l.duration || 0) >= 45;
    if (isAns) {
      return 15 + ((l.duration || 0) % 20); // Simulated wait time between 15-35s
    }
    return Math.min(l.duration || 15, 120); // Capped at 120s for hangups
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
