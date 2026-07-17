"use client";

import { useState } from "react";

interface DailyRecord {
  day: string;
  inbound: number;
  answered: number;
  missed: number;
}

interface DailyTrendChartProps {
  dailyTrends: DailyRecord[];
}

export default function DailyTrendChart({ dailyTrends }: DailyTrendChartProps) {
  const [hoveredIdx, setHoveredIdx] = useState<number | null>(null);

  if (!dailyTrends || dailyTrends.length === 0) return null;

  const width = 800;
  const height = 160;
  const paddingX = 40;
  const paddingY = 20;

  const maxVal = Math.max(...dailyTrends.map(d => Math.max(d.inbound, d.answered, d.missed)), 10);
  const yScale = (val: number) => height - paddingY - (val / maxVal) * (height - 2 * paddingY);
  const xScale = (idx: number) => paddingX + (idx / (dailyTrends.length - 1)) * (width - 2 * paddingX);

  const inboundPoints = dailyTrends.map((d, idx) => ({ x: xScale(idx), y: yScale(d.inbound) }));
  const answeredPoints = dailyTrends.map((d, idx) => ({ x: xScale(idx), y: yScale(d.answered) }));
  const missedPoints = dailyTrends.map((d, idx) => ({ x: xScale(idx), y: yScale(d.missed) }));

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

  const yTicks = [0, Math.round(maxVal / 2), maxVal];

  return (
    <div className="p-6 rounded-xl glass-card shadow-sm space-y-4">
      <div className="flex justify-between items-center">
        <div>
          <h5 className="font-display font-bold text-text-primary text-sm">Daily Volume Trend</h5>
          <p className="text-xs text-text-secondary mt-0.5">Inbound, answered, and missed call trends over the past 7 days</p>
        </div>
        <div className="flex items-center gap-3 text-[10px] font-mono text-text-secondary">
          <div className="flex items-center gap-1">
            <span className="w-2.5 h-0.5 bg-accent-luxury block" />
            <span>Inbound</span>
          </div>
          <div className="flex items-center gap-1">
            <span className="w-2.5 h-0.5 bg-accent-emerald block" />
            <span>Answered</span>
          </div>
          <div className="flex items-center gap-1">
            <span className="w-2.5 h-0.5 bg-red-400 block border-dashed border-t border-red-400" />
            <span>Missed</span>
          </div>
        </div>
      </div>

      <div className="relative w-full aspect-[4/1]">
        <svg viewBox={`0 0 ${width} ${height}`} className="w-full h-full overflow-visible font-mono text-[11px] select-none">
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

          {/* Y Axis ticks labels */}
          {yTicks.map((tick, i) => (
            <text key={i} x={paddingX - 8} y={yScale(tick) + 3} textAnchor="end" className="fill-text-secondary/80">
              {tick}
            </text>
          ))}

          {/* Curves */}
          <path d={getBezierPath(inboundPoints)} fill="none" stroke="#C5A880" strokeWidth="2" strokeLinecap="round" />
          <path d={getBezierPath(answeredPoints)} fill="none" stroke="#10B981" strokeWidth="1.75" strokeLinecap="round" />
          <path d={getBezierPath(missedPoints)} fill="none" stroke="#EF4444" strokeWidth="1.25" strokeLinecap="round" strokeDasharray="3,3" />

          {/* Hover interactive bars */}
          {dailyTrends.map((d, idx) => (
            <rect
              key={idx}
              x={xScale(idx) - (width / dailyTrends.length) / 2}
              y={paddingY}
              width={width / dailyTrends.length}
              height={height - 2 * paddingY}
              fill="transparent"
              className="cursor-pointer"
              onMouseEnter={() => setHoveredIdx(idx)}
              onMouseLeave={() => setHoveredIdx(null)}
            />
          ))}

          {/* Hover interactive lines and dots */}
          {hoveredIdx !== null && (
            <>
              <line
                x1={xScale(hoveredIdx)}
                y1={paddingY}
                x2={xScale(hoveredIdx)}
                y2={height - paddingY}
                stroke="#C5A880"
                strokeWidth="0.75"
                strokeDasharray="3,3"
              />
              <circle cx={xScale(hoveredIdx)} cy={yScale(dailyTrends[hoveredIdx].inbound)} r="4" fill="#C5A880" stroke="#FFF" strokeWidth="1.5" />
              <circle cx={xScale(hoveredIdx)} cy={yScale(dailyTrends[hoveredIdx].answered)} r="3.5" fill="#10B981" stroke="#FFF" strokeWidth="1.5" />
              <circle cx={xScale(hoveredIdx)} cy={yScale(dailyTrends[hoveredIdx].missed)} r="3.5" fill="#EF4444" stroke="#FFF" strokeWidth="1.5" />
            </>
          )}

          {/* X Axis labels */}
          {dailyTrends.map((d, idx) => (
            <text key={idx} x={xScale(idx)} y={height - 4} textAnchor="middle" className="fill-text-secondary font-semibold">
              {d.day}
            </text>
          ))}
        </svg>

        {/* Hover Tooltip */}
        {hoveredIdx !== null && (
          <div 
            className="absolute bg-text-primary text-white text-[9px] font-sans p-2 rounded shadow-lg pointer-events-none space-y-0.5 border border-white/10"
            style={{
              left: `${Math.min(width - 100, Math.max(10, (xScale(hoveredIdx) / width) * 100 - 10))}%`,
              bottom: "75%"
            }}
          >
            <div className="font-bold border-b border-white/10 pb-0.5 mb-1">{dailyTrends[hoveredIdx].day}</div>
            <div className="flex justify-between gap-3 text-white/90">
              <span>Inbound:</span>
              <strong className="text-accent-luxury font-mono">{dailyTrends[hoveredIdx].inbound}</strong>
            </div>
            <div className="flex justify-between gap-3 text-white/90">
              <span>Answered:</span>
              <strong className="text-accent-emerald font-mono">{dailyTrends[hoveredIdx].answered}</strong>
            </div>
            <div className="flex justify-between gap-3 text-white/90">
              <span>Missed:</span>
              <strong className="text-red-350 font-mono">{dailyTrends[hoveredIdx].missed}</strong>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
