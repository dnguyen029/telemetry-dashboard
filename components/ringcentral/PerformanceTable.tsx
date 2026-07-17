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
  isRate?: boolean;
}

function MetricRow({ label, cur, prev, change, pct, sparkData, isRate = false }: MetricRowProps) {
  const isPositive = change > 0;
  const isNeutral = change === 0;
  const suffix = isRate ? "%" : "";

  // Answer rate going up is good, missed/abandon rate going up is bad
  const isGoodDirection = (label.includes("Answer") && isPositive) || (!label.includes("Answer") && !isPositive);

  return (
    <tr className="hover:bg-bg-secondary/15 transition-colors border-b border-gray-200/30 text-xs">
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
          <Sparkline data={sparkData} color={isGoodDirection && !isNeutral ? "#10B981" : "#C5A880"} />
        </div>
      </td>
    </tr>
  );
}

interface PerformanceTableProps {
  comparisonData: any;
  sparklines: any;
  period: "DoD" | "WoW" | "MoM" | "QoQ";
}

export default function PerformanceTable({ comparisonData, sparklines, period }: PerformanceTableProps) {
  const activeData = comparisonData[period];
  if (!activeData) return null;

  return (
    <div className="p-6 rounded-xl glass-card shadow-sm space-y-4">
      <div>
        <h5 className="font-display font-bold text-text-primary text-sm">Call Performance Comparison</h5>
        <p className="text-[11px] text-text-secondary mt-0.5">Statistical metrics comparing current vs historical period</p>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full border-collapse">
          <thead>
            <tr className="border-b border-gray-200/60 text-[10px] font-mono text-text-secondary uppercase tracking-wider">
              <th className="py-2 pl-4 text-left font-semibold">Metric</th>
              <th className="py-2 text-right font-semibold">Current</th>
              <th className="py-2 text-right font-semibold">Previous</th>
              <th className="py-2 text-right font-semibold">Change</th>
              <th className="py-2 pr-4 text-right font-semibold">Trend (12 Days)</th>
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
            />
            <MetricRow
              label="Answered Calls"
              cur={activeData.answered.current}
              prev={activeData.answered.previous}
              change={activeData.answered.change}
              pct={activeData.answered.pct}
              sparkData={sparklines?.answered || []}
            />
            <MetricRow
              label="Missed Calls"
              cur={activeData.missed.current}
              prev={activeData.missed.previous}
              change={activeData.missed.change}
              pct={activeData.missed.pct}
              sparkData={sparklines?.missed || []}
            />
            <MetricRow
              label="Abandoned Calls"
              cur={activeData.abandoned.current}
              prev={activeData.abandoned.previous}
              change={activeData.abandoned.change}
              pct={activeData.abandoned.pct}
              sparkData={sparklines?.abandoned || []}
            />
            <MetricRow
              label="Answer Rate"
              cur={activeData.answerRate.current}
              prev={activeData.answerRate.previous}
              change={activeData.answerRate.change}
              pct={activeData.answerRate.pct}
              sparkData={sparklines?.answerRate || []}
              isRate
            />
            <MetricRow
              label="Missed Rate"
              cur={activeData.missedRate.current}
              prev={activeData.missedRate.previous}
              change={activeData.missedRate.change}
              pct={activeData.missedRate.pct}
              sparkData={sparklines?.missedRate || []}
              isRate
            />
            <MetricRow
              label="Abandon Rate"
              cur={activeData.abandonRate.current}
              prev={activeData.abandonRate.previous}
              change={activeData.abandonRate.change}
              pct={activeData.abandonRate.pct}
              sparkData={sparklines?.abandonRate || []}
              isRate
            />
          </tbody>
        </table>
      </div>
    </div>
  );
}
