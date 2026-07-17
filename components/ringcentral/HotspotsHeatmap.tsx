"use client";

import { useState } from "react";

interface HotspotsHeatmapProps {
  hotspotData: number[][]; // 7 days x 24 hours matrix
}

export default function HotspotsHeatmap({ hotspotData }: HotspotsHeatmapProps) {
  const [hoveredCell, setHoveredCell] = useState<{
    day: string;
    hour: string;
    count: number;
    clientX: number;
    clientY: number;
  } | null>(null);

  if (!hotspotData || hotspotData.length === 0) return null;

  const daysOfWeek = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
  const hoursLabels = ["12A", "4A", "8A", "12P", "4P", "8P"];

  const formatHourLabel = (h: number) => {
    if (h === 0) return "12 AM";
    if (h === 12) return "12 PM";
    if (h > 12) return `${h - 12} PM`;
    return `${h} AM`;
  };

  // Find maximum value to normalize coloring
  const flatData = hotspotData.flat();
  const maxVal = Math.max(...flatData, 1);

  // Compute color class based on intensity relative to max
  const getCellColorClass = (count: number) => {
    if (count === 0) return "bg-gray-100/40 hover:bg-gray-200/50";
    const ratio = count / maxVal;
    
    // Luxury Gold (#C5A880) tone ranges using Tailwind opacity layers
    if (ratio < 0.2) return "bg-[#C5A880]/15 text-text-primary/70 hover:bg-[#C5A880]/30";
    if (ratio < 0.4) return "bg-[#C5A880]/35 text-text-primary/80 hover:bg-[#C5A880]/50";
    if (ratio < 0.7) return "bg-[#C5A880]/60 text-text-primary hover:bg-[#C5A880]/75";
    return "bg-[#C5A880] text-white font-semibold hover:bg-amber-700/80 shadow-sm"; // Peak hotspot
  };

  const handleMouseMove = (e: React.MouseEvent, dayIdx: number, hourIdx: number, count: number) => {
    const rect = e.currentTarget.getBoundingClientRect();
    setHoveredCell({
      day: daysOfWeek[dayIdx],
      hour: formatHourLabel(hourIdx),
      count,
      clientX: rect.left + window.scrollX + rect.width / 2,
      clientY: rect.top + window.scrollY - 35
    });
  };

  return (
    <div className="p-6 rounded-xl bg-white/60 border border-gray-200/50 shadow-sm backdrop-blur-md space-y-4">
      <div>
        <h5 className="font-display font-bold text-text-primary text-sm">Missed Call Hotspots</h5>
        <p className="text-[11px] text-text-secondary mt-0.5">Average missed calls by hour and day of week</p>
      </div>

      <div className="flex flex-col space-y-2">
        {/* Heatmap Grid wrapper */}
        <div className="grid grid-cols-[28px_1fr] gap-1.5 items-center">
          {/* Empty top-left cell */}
          <div />

          {/* X-axis hours indicators */}
          <div className="flex justify-between text-[8px] font-mono text-text-secondary/70 px-1 select-none">
            {hoursLabels.map((lbl, i) => (
              <span key={i} className="w-6 text-center">{lbl}</span>
            ))}
          </div>

          {/* Rows: Day Name + 24 Hour blocks */}
          {daysOfWeek.map((day, dayIdx) => (
            <div key={day} className="contents">
              {/* Day Y-axis Label */}
              <span className="text-[9px] font-mono font-semibold text-text-secondary select-none">{day}</span>
              
              {/* 24 Hour blocks */}
              <div className="flex gap-[2px]">
                {hotspotData[dayIdx]?.map((count, hourIdx) => (
                  <div
                    key={hourIdx}
                    className={`flex-1 aspect-square rounded-[3px] transition-all cursor-pointer ${getCellColorClass(count)}`}
                    onMouseMove={(e) => handleMouseMove(e, dayIdx, hourIdx, count)}
                    onMouseLeave={() => setHoveredCell(null)}
                  />
                ))}
              </div>
            </div>
          ))}
        </div>

        {/* Legend color key */}
        <div className="flex justify-between items-center pt-2 text-[9px] font-mono text-text-secondary">
          <span>0 (Low)</span>
          <div className="flex gap-[3px] h-3 w-32">
            <div className="flex-1 bg-gray-100/40 rounded-[2px]" />
            <div className="flex-1 bg-[#C5A880]/15 rounded-[2px]" />
            <div className="flex-1 bg-[#C5A880]/35 rounded-[2px]" />
            <div className="flex-1 bg-[#C5A880]/60 rounded-[2px]" />
            <div className="flex-1 bg-[#C5A880] rounded-[2px]" />
          </div>
          <span>{maxVal}+ (Peak)</span>
        </div>
      </div>

      {/* Floating tooltip */}
      {hoveredCell && (
        <div 
          className="fixed bg-text-primary text-white text-[9px] font-sans px-2.5 py-1.5 rounded shadow-lg pointer-events-none z-50 whitespace-nowrap border border-white/10"
          style={{
            left: `${hoveredCell.clientX}px`,
            top: `${hoveredCell.clientY}px`,
            transform: "translate(-50%, -100%)"
          }}
        >
          <strong className="text-accent-luxury">{hoveredCell.day} {hoveredCell.hour}</strong>: {hoveredCell.count} missed calls
        </div>
      )}
    </div>
  );
}
