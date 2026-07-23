"use client";
import { Users, Clock, Activity, TrendingUp, AlertTriangle } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

interface RingCentralData {
  metrics: {
    agentsOnline: number;
    agentsOnCall?: number;
    agentOccupancy: number;
    avgHandleTimeSeconds?: number;
    serviceLevelSLA?: number;
    avgWaitSeconds: number;
  };
  extensions: { id: string; extensionNumber: string; name: string; type: string; status: string; presenceStatus?: string; telephonyStatus?: string; dndStatus?: string; acceptCallQueueCalls?: boolean; activeCallDirection?: string; occupancy: number }[];
  queue8Allocations: { productSpecs: number; damagesDefects: number; wismo: number; unassigned: number };
}

const STATUS_COLORS: Record<string, string> = {
  Available: "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400",
  "On Call":  "bg-blue-500/15 text-blue-600 dark:text-blue-400",
  "In Call":  "bg-blue-500/15 text-blue-600 dark:text-blue-400",
  Busy:       "bg-amber-500/15 text-amber-500 dark:text-amber-400",
  Offline:    "bg-slate-500/15 text-slate-400",
};

function fmtTime(s?: number) {
  if (!s) return "—";
  const m = Math.floor(s / 60);
  const sec = s % 60;
  return `${m}m ${sec.toString().padStart(2, "0")}s`;
}

export default function StaffingDashboard({ data }: { data: RingCentralData }) {
  const { metrics, extensions, queue8Allocations } = data;

  const totalQueueCalls = Object.values(queue8Allocations ?? {}).reduce((a, b) => a + b, 0);
  const queueRows = [
    { label: "Product Specifications", count: queue8Allocations?.productSpecs ?? 0, color: "bg-blue-500" },
    { label: "Damages & Defects", count: queue8Allocations?.damagesDefects ?? 0, color: "bg-red-500" },
    { label: "WISMO / Order Status", count: queue8Allocations?.wismo ?? 0, color: "bg-amber-500" },
    { label: "Unassigned", count: queue8Allocations?.unassigned ?? 0, color: "bg-slate-400" },
  ];

  const occupancyStatus = (metrics?.agentOccupancy ?? 0) >= 95 ? "critical"
    : (metrics?.agentOccupancy ?? 0) >= 80 ? "warn" : "ok";

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* SLA Alert Banner */}
      {occupancyStatus !== "ok" && (
        <div className={`flex items-center gap-3 p-3 rounded-lg border text-sm font-medium
          ${occupancyStatus === "critical"
            ? "bg-red-500/10 border-red-500/30 text-red-400"
            : "bg-amber-500/10 border-amber-500/30 text-amber-400"}`}>
          <AlertTriangle className="w-4 h-4 shrink-0" />
          Agent occupancy at {metrics?.agentOccupancy ?? 0}% —
          {occupancyStatus === "critical" ? " CRITICAL: Team capacity exceeded." : " WARNING: Approaching full capacity."}
        </div>
      )}

      {/* Top KPI Banner (Consistent Context Row) */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: "Agents Online", value: metrics?.agentsOnline ?? 0, icon: Users, color: "text-emerald-400" },
          { label: "Agents On Call", value: metrics?.agentsOnCall ?? "—", icon: Activity, color: "text-blue-400" },
          { label: "Team Occupancy", value: `${metrics?.agentOccupancy ?? 0}%`, icon: TrendingUp,
            color: occupancyStatus === "critical" ? "text-red-400" : occupancyStatus === "warn" ? "text-amber-400" : "text-emerald-400" },
          { label: "Avg Handle Time", value: fmtTime(metrics?.avgHandleTimeSeconds), icon: Clock, color: "text-purple-400" },
        ].map((kpi) => (
          <Card key={kpi.label} className="bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800">
            <CardContent className="pt-5">
              <div className="flex items-center gap-3">
                <div className={`p-2 rounded-lg bg-slate-100 dark:bg-slate-800 ${kpi.color}`}>
                  <kpi.icon className="w-4 h-4" />
                </div>
                <div>
                  <p className="text-xs text-slate-500 dark:text-slate-400">{kpi.label}</p>
                  <p className="text-xl font-bold text-slate-900 dark:text-white">{kpi.value}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Main Staffing Workspace */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Individual Agent Extension Roster Table (2/3 width) */}
        <Card className="lg:col-span-2 bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800">
          <CardHeader>
            <CardTitle className="text-sm font-semibold text-slate-700 dark:text-slate-200 flex items-center gap-2">
              <Users className="w-4 h-4 text-blue-400" /> Individual Agent Roster & Extension Status
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow className="border-slate-200 dark:border-slate-800">
                  <TableHead className="text-xs">Ext #</TableHead>
                  <TableHead className="text-xs">Agent Name</TableHead>
                  <TableHead className="text-xs">Live Status</TableHead>
                  <TableHead className="text-xs">Direction</TableHead>
                  <TableHead className="text-xs">Queue Status</TableHead>
                  <TableHead className="text-xs text-right">Occupancy</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {(!extensions || extensions.filter(e => e.type === "User").length === 0) && (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center text-xs text-slate-500 py-8">
                      No staff extensions returned in today&apos;s telemetry payload.
                    </TableCell>
                  </TableRow>
                )}
                {extensions && extensions.filter(e => e.type === "User").map((ext) => (
                  <TableRow key={ext.id} className="border-slate-100 dark:border-slate-800">
                    <TableCell className="text-xs font-mono text-slate-500 dark:text-slate-400">#{ext.extensionNumber}</TableCell>
                    <TableCell className="text-xs font-medium text-slate-900 dark:text-white">{ext.name}</TableCell>
                    <TableCell>
                      <Badge className={`text-xs px-2 py-0.5 ${STATUS_COLORS[ext.status] ?? STATUS_COLORS["Offline"]}`}>
                        {ext.status}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {ext.activeCallDirection ? (
                        <Badge className="text-[10px] font-mono px-1.5 py-0.5 bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/20">
                          {ext.activeCallDirection}
                        </Badge>
                      ) : <span className="text-xs text-slate-400">—</span>}
                    </TableCell>
                    <TableCell>
                      <span className={`text-xs font-medium ${ext.acceptCallQueueCalls !== false ? "text-emerald-600 dark:text-emerald-400" : "text-amber-500"}`}>
                        {ext.acceptCallQueueCalls !== false ? "Queue Active" : "Queue Off"}
                      </span>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-2">
                        <div className="w-20 h-1.5 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
                          <div
                            className={`h-full rounded-full transition-all
                              ${ext.status === "On Call" ? "bg-blue-500" : ext.occupancy >= 80 ? "bg-amber-500" : "bg-emerald-500"}`}
                            style={{ width: `${Math.min(ext.occupancy, 100)}%` }}
                          />
                        </div>
                        <span className="text-xs font-mono text-slate-600 dark:text-slate-300 w-8 text-right">
                          {ext.occupancy}%
                        </span>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        {/* Queue Skill Group Workload (1/3 width) */}
        <Card className="bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800">
          <CardHeader>
            <CardTitle className="text-sm font-semibold text-slate-700 dark:text-slate-200 flex items-center gap-2">
              <Activity className="w-4 h-4 text-purple-400" /> Queue Skill Distribution
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-xs text-slate-500 dark:text-slate-400">
              {totalQueueCalls} calls routed across queues today
            </p>
            {queueRows.map((q) => (
              <div key={q.label}>
                <div className="flex justify-between mb-1">
                  <span className="text-xs text-slate-700 dark:text-slate-300">{q.label}</span>
                  <span className="text-xs font-mono font-semibold text-slate-900 dark:text-white">{q.count}</span>
                </div>
                <div className="w-full h-2 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
                  <div
                    className={`h-full ${q.color} rounded-full transition-all`}
                    style={{ width: `${totalQueueCalls > 0 ? (q.count / totalQueueCalls) * 100 : 0}%` }}
                  />
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
