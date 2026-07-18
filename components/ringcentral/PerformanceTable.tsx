"use client";

import { ArrowUp, ArrowDown } from "lucide-react";
import { Sparkline } from "./Sparkline";

interface MetricRowProps {
  label: string;
  cur: number;
  prev: number;
  change: number;
  pct: number;
  sparkData: number[];
  color?: string;
  isRate?: boolean;
  onClick?: () => void;
}

function MetricRow({ label, cur, prev, change, pct, sparkData, color, isRate = false, onClick }: MetricRowProps) {
  const isPositive = change > 0;
  const isNeutral = change === 0;
  const suffix = isRate ? "%" : "";

  // Answer rate going up is good, missed/abandon rate going up is bad
  const isGoodDirection = (label.includes("Answer") && isPositive) || (!label.includes("Answer") && !isPositive);

  return (
    <tr 
      onClick={onClick}
      onKeyDown={(e) => {
        if (onClick && (e.key === "Enter" || e.key === " ")) {
          e.preventDefault();
          onClick();
        }
      }}
      tabIndex={onClick ? 0 : undefined}
      role={onClick ? "button" : undefined}
      className={`transition-colors border-b border-gray-200/30 text-xs focus:outline-none focus:ring-1 focus:ring-blue-500/50 ${
        onClick 
          ? "cursor-pointer hover:bg-red-500/[0.04] active:bg-red-500/[0.08]" 
          : "hover:bg-bg-secondary/15"
      }`}
    >
      <td className="py-3.5 pl-4 font-medium text-text-primary text-left">{label}</td>
      <td className="py-3.5 text-right font-mono font-semibold text-text-primary">
        {cur.toLocaleString()}{suffix}
      </td>
      <td className="py-3.5 text-right font-mono text-text-secondary">
        {prev.toLocaleString()}{suffix}
      </td>
      <td className={`py-3.5 text-right font-mono font-semibold flex items-center justify-end gap-1 ${
        isNeutral 
          ? "text-text-secondary" 
          : isGoodDirection 
            ? "text-accent-emerald" 
            : "text-red-500"
      }`}>
        {!isNeutral && (isPositive ? <ArrowUp className="w-3 h-3" /> : <ArrowDown className="w-3 h-3" />)}
        <span>
          {isNeutral ? "-" : `${Math.abs(change).toLocaleString()}${isRate ? " pp" : ""}`}
        </span>
        <span className="text-[10px] text-text-secondary/70 font-normal">
          ({isNeutral ? "0%" : `${isPositive ? "+" : "-"}${Math.abs(pct)}%`})
        </span>
      </td>
      <td className="py-2.5 pr-4 text-right">
        <div className="flex justify-end items-center h-8">
          <Sparkline data={sparkData} color={color || (isGoodDirection && !isNeutral ? "#10B981" : "#C5A880")} />
        </div>
      </td>
    </tr>
  );
}

interface PerformanceTableProps {
  comparisonData: Record<
    string,
    Record<string, { current: number; previous: number; change: number; pct: number }>
  >;
  sparklines: Record<string, number[]>;
  period: "DoD" | "WoW" | "MoM" | "QoQ";
  setPeriod: (p: "DoD" | "WoW" | "MoM" | "QoQ") => void;
  onMetricClick?: (metricName: string) => void;
  dataStatus?: "live" | "insufficient_data";
}

export default function PerformanceTable({ comparisonData, sparklines, period, setPeriod, onMetricClick, dataStatus }: PerformanceTableProps) {
  const activeData = comparisonData[period];
  if (!activeData) return null;

  return (
    <div className="p-6 rounded-xl glass-card shadow-sm space-y-4">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 border-b border-gray-250/20 pb-3.5">
        <div className="space-y-1">
          <div className="flex flex-wrap items-center gap-2">
            <h5 className="font-display font-bold text-text-primary text-sm">Call Performance Comparison</h5>
            {dataStatus === "insufficient_data" && (
              <span className="px-2 py-0.5 text-[9px] font-semibold font-mono bg-amber-100 text-amber-800 dark:bg-amber-950/40 dark:text-amber-400 border border-amber-200/50 dark:border-amber-900/30 rounded-full flex items-center gap-1 select-none">
                <span>⚠</span> Simulated — Building history
              </span>
            )}
          </div>
          <p className="text-[11px] text-text-secondary">Statistical metrics comparing current vs historical period</p>
        </div>
        <div className="flex bg-slate-100 dark:bg-slate-900 p-0.5 rounded-lg border border-slate-200 dark:border-slate-800 shrink-0">
          {(["DoD", "WoW", "MoM", "QoQ"] as const).map((p) => (
            <button
              key={p}
              onClick={() => setPeriod(p)}
              className={`px-2.5 py-1 text-[10px] font-mono font-medium rounded-md transition-all cursor-pointer ${
                period === p
                  ? "bg-blue-600 text-white shadow-sm"
                  : "text-slate-550 dark:bg-transparent dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200"
              }`}
            >
              {p}
            </button>
          ))}
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full border-collapse">
          <thead>
            <tr className="border-b border-gray-200/30 text-[10px] font-mono text-text-secondary uppercase tracking-wider">
              <th className="py-2.5 pl-4 text-left font-medium">Metric</th>
              <th className="py-2.5 text-right font-medium">Current</th>
              <th className="py-2.5 text-right font-medium">Previous</th>
              <th className="py-2.5 text-right font-medium">Change</th>
              <th className="py-2.5 pr-4 text-right font-medium">Trend</th>
            </tr>
          </thead>
          <tbody>
            <MetricRow
              label="Inbound Calls"
              cur={activeData.inbound.current}
              prev={activeData.inbound.previous}
              change={activeData.inbound.change}
              pct={activeData.inbound.pct}
              sparkData={sparklines?.inbound || []}
              color="#3b82f6"
            />
            <MetricRow
              label="Answered Calls"
              cur={activeData.answered.current}
              prev={activeData.answered.previous}
              change={activeData.answered.change}
              pct={activeData.answered.pct}
              sparkData={sparklines?.answered || []}
              color="#10b981"
            />
            <MetricRow
              label="Missed Calls"
              cur={activeData.missed.current}
              prev={activeData.missed.previous}
              change={activeData.missed.change}
              pct={activeData.missed.pct}
              sparkData={sparklines?.missed || []}
              color="#ef4444"
              onClick={() => onMetricClick?.("Missed Calls")}
            />
            <MetricRow
              label="Abandoned Calls"
              cur={activeData.abandoned.current}
              prev={activeData.abandoned.previous}
              change={activeData.abandoned.change}
              pct={activeData.abandoned.pct}
              sparkData={sparklines?.abandoned || []}
              color="#f59e0b"
            />
            <MetricRow
              label="Answer Rate"
              cur={activeData.answerRate.current}
              prev={activeData.answerRate.previous}
              change={activeData.answerRate.change}
              pct={activeData.answerRate.pct}
              sparkData={sparklines?.answerRate || []}
              color="#10b981"
              isRate
            />
            <MetricRow
              label="Missed Rate"
              cur={activeData.missedRate.current}
              prev={activeData.missedRate.previous}
              change={activeData.missedRate.change}
              pct={activeData.missedRate.pct}
              sparkData={sparklines?.missedRate || []}
              color="#ef4444"
              isRate
              onClick={() => onMetricClick?.("Missed Calls")}
            />
            <MetricRow
              label="Abandon Rate"
              cur={activeData.abandonRate.current}
              prev={activeData.abandonRate.previous}
              change={activeData.abandonRate.change}
              pct={activeData.abandonRate.pct}
              sparkData={sparklines?.abandonRate || []}
              color="#f59e0b"
              isRate
            />
          </tbody>
        </table>
      </div>
    </div>
  );
}
