"use client";

import { useState } from "react";

interface HourTrend {
  hour: string;
  inbound: number;
  answered: number;
  missed: number;
}

interface CallsByHourChartProps {
  hourlyTrends: HourTrend[];
}

export default function CallsByHourChart({ hourlyTrends }: CallsByHourChartProps) {
  const [hoveredPoint, setHoveredPoint] = useState<{
    idx: number;
    hour: string;
    inbound: number;
    answered: number;
    missed: number;
    x: number;
  } | null>(null);

  if (!hourlyTrends || hourlyTrends.length === 0) return null;

  // Render variables
  const width = 500;
  const height = 180;
  const paddingX = 40;
  const paddingY = 20;

  // Max value for Y scale
  const maxVal = Math.max(...hourlyTrends.map(t => Math.max(t.inbound, t.answered, t.missed)), 10);
  const yScale = (val: number) => height - paddingY - (val / maxVal) * (height - 2 * paddingY);
  const xScale = (idx: number) => paddingX + (idx / (hourlyTrends.length - 1)) * (width - 2 * paddingX);

  // Generate coordinate points
  const inboundPoints = hourlyTrends.map((t, idx) => ({ x: xScale(idx), y: yScale(t.inbound) }));
  const answeredPoints = hourlyTrends.map((t, idx) => ({ x: xScale(idx), y: yScale(t.answered) }));
  const missedPoints = hourlyTrends.map((t, idx) => ({ x: xScale(idx), y: yScale(t.missed) }));

  // Helper to generate bezier path
  const getBezierPath = (points: { x: number; y: number }[]) => {
    if (points.length === 0) return "";
    let d = `M ${points[0].x} ${points[0].y}`;
    for (let i = 0; i < points.length - 1; i++) {
      const curr = points[i];
      const next = points[i + 1];
      const cp1x = curr.x + (next.x - curr.x) / 3;
      const cp1y = curr.y;
      const cp2x = curr.x + 2 * (next.x - curr.x) / 3;
      const cp2y = next.y;
      d += ` C ${cp1x} ${cp1y}, ${cp2x} ${cp2y}, ${next.x} ${next.y}`;
    }
    return d;
  };

  // Helper to generate area path under the line
  const getAreaPath = (points: { x: number; y: number }[]) => {
    if (points.length === 0) return "";
    const linePath = getBezierPath(points);
    return `${linePath} L ${points[points.length - 1].x} ${height - paddingY} L ${points[0].x} ${height - paddingY} Z`;
  };

  // Y-axis tick intervals
  const yTicks = [0, Math.round(maxVal / 2), maxVal];

  // X-axis key intervals to draw (focusing on active business hours 6 AM to 8 PM)
  const xTicksIndices = [6, 8, 10, 12, 14, 16, 18, 20];

  return (
    <div className="p-6 rounded-xl glass-card shadow-sm space-y-4">
      <div className="flex justify-between items-start">
        <div>
          <h5 className="font-display font-bold text-text-primary text-sm">Calls by Hour</h5>
          <p className="text-xs text-text-secondary mt-0.5">Real-time call volume patterns comparing trends</p>
        </div>
        <div className="flex items-center gap-3 text-[10px] font-mono text-text-secondary">
          <div className="flex items-center gap-1">
            <span className="w-2 h-2 rounded-full bg-accent-luxury" />
            <span>Inbound</span>
          </div>
          <div className="flex items-center gap-1">
            <span className="w-2 h-2 rounded-full bg-accent-emerald" />
            <span>Answered</span>
          </div>
          <div className="flex items-center gap-1">
            <span className="w-2 h-2 rounded-full bg-red-400" />
            <span>Missed</span>
          </div>
        </div>
      </div>

      <div className="relative w-full aspect-[5/2]">
        <svg viewBox={`0 0 ${width} ${height}`} className="w-full h-full overflow-visible font-mono text-[11px] select-none">
          {/* Gradients */}
          <defs>
            <linearGradient id="inboundGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#C5A880" stopOpacity="0.18" />
              <stop offset="100%" stopColor="#C5A880" stopOpacity="0.0" />
            </linearGradient>
            <linearGradient id="answeredGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#10B981" stopOpacity="0.12" />
              <stop offset="100%" stopColor="#10B981" stopOpacity="0.0" />
            </linearGradient>
          </defs>

          {/* Grid lines */}
          {yTicks.map((tick, i) => (
            <line
              key={i}
              x1={paddingX}
              y1={yScale(tick)}
              x2={width - paddingX}
              y2={yScale(tick)}
              stroke="#E5E7EB"
              strokeWidth="0.5"
              strokeDasharray="2,2"
            />
          ))}

          {/* Y-axis Ticks Labels */}
          {yTicks.map((tick, i) => (
            <text key={i} x={paddingX - 8} y={yScale(tick) + 3} textAnchor="end" className="fill-text-secondary/80">
              {tick}
            </text>
          ))}

          {/* Fill Areas */}
          <path d={getAreaPath(inboundPoints)} fill="url(#inboundGrad)" />
          <path d={getAreaPath(answeredPoints)} fill="url(#answeredGrad)" />

          {/* Line Curves */}
          <path d={getBezierPath(inboundPoints)} fill="none" stroke="#C5A880" strokeWidth="1.75" strokeLinecap="round" />
          <path d={getBezierPath(answeredPoints)} fill="none" stroke="#10B981" strokeWidth="1.5" strokeLinecap="round" />
          <path d={getBezierPath(missedPoints)} fill="none" stroke="#EF4444" strokeWidth="1" strokeLinecap="round" strokeDasharray="3,3" />

          {/* Hover interactive bars */}
          {hourlyTrends.map((t, idx) => (
            <rect
              key={idx}
              x={xScale(idx) - (width / hourlyTrends.length) / 2}
              y={paddingY}
              width={width / hourlyTrends.length}
              height={height - 2 * paddingY}
              fill="transparent"
              className="cursor-pointer"
              onMouseEnter={() => setHoveredPoint({ ...t, idx, x: xScale(idx) })}
              onMouseLeave={() => setHoveredPoint(null)}
            />
          ))}

          {/* Hover highlight line */}
          {hoveredPoint && (
            <>
              <line
                x1={hoveredPoint.x}
                y1={paddingY}
                x2={hoveredPoint.x}
                y2={height - paddingY}
                stroke="#C5A880"
                strokeWidth="0.75"
                strokeDasharray="3,3"
              />
              <circle cx={hoveredPoint.x} cy={yScale(hoveredPoint.inbound)} r="3.5" fill="#C5A880" stroke="#FFF" strokeWidth="1.5" />
              <circle cx={hoveredPoint.x} cy={yScale(hoveredPoint.answered)} r="3" fill="#10B981" stroke="#FFF" strokeWidth="1.5" />
              <circle cx={hoveredPoint.x} cy={yScale(hoveredPoint.missed)} r="3" fill="#EF4444" stroke="#FFF" strokeWidth="1.5" />
            </>
          )}

          {/* X Axis Labels */}
          {xTicksIndices.map((idx) => (
            <text key={idx} x={xScale(idx)} y={height - 5} textAnchor="middle" className="fill-text-secondary">
              {hourlyTrends[idx]?.hour}
            </text>
          ))}
        </svg>

        {/* Hover Tooltip Overlay */}
        {hoveredPoint && (
          <div 
            className="absolute bg-text-primary text-white text-[9px] font-sans p-2 rounded shadow-lg pointer-events-none space-y-0.5 border border-white/10"
            style={{
              left: `${Math.min(width - 90, Math.max(10, (hoveredPoint.x / width) * 100 - 10))}%`,
              bottom: "75%"
            }}
          >
            <div className="font-bold border-b border-white/10 pb-0.5 mb-1">{hoveredPoint.hour}</div>
            <div className="flex justify-between gap-3 text-white/90">
              <span>Inbound:</span>
              <strong className="text-accent-luxury font-mono">{hoveredPoint.inbound}</strong>
            </div>
            <div className="flex justify-between gap-3 text-white/90">
              <span>Answered:</span>
              <strong className="text-accent-emerald font-mono">{hoveredPoint.answered}</strong>
            </div>
            <div className="flex justify-between gap-3 text-white/90">
              <span>Missed:</span>
              <strong className="text-red-300 font-mono">{hoveredPoint.missed}</strong>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
