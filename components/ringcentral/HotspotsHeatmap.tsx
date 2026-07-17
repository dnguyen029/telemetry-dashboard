"use client";

import React, { useState } from "react";

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

  const daysOfWeek = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];
  const businessHoursRange = Array.from({ length: 12 }, (_, i) => i + 6); // hours 6 to 17

  const formatHourLabel = (h: number) => {
    if (h === 0) return "12 AM";
    if (h === 12) return "12 PM";
    if (h > 12) return `${h - 12} PM`;
    return `${h} AM`;
  };

  // Slice hotspot data to business hours: 6 AM to 5 PM (indices 6 to 17 inclusive)
  const slicedData = hotspotData.map(row => row.slice(6, 18));

  // Find max value in business hours data for scaling
  const maxVal = Math.max(...slicedData.flat(), 1);

  // Red Warning Color Ramp
  const getCellColorClass = (count: number) => {
    if (count === 0) return "bg-[#FFF5F5]/30 text-slate-350 dark:text-slate-700 hover:bg-[#FFF5F5]/50";
    const ratio = count / maxVal;
    
    if (ratio < 0.25) return "bg-red-50 text-red-750 hover:bg-red-100/80 dark:bg-red-950/15 dark:text-red-400";
    if (ratio < 0.5) return "bg-red-100 text-red-900 hover:bg-red-200/80 dark:bg-red-950/40 dark:text-red-300";
    if (ratio < 0.75) return "bg-red-400 text-white hover:bg-red-500/90 dark:bg-red-700 dark:text-white";
    return "bg-red-700 text-white font-bold hover:bg-red-800/90 dark:bg-red-600 dark:text-white animate-pulse shadow-sm"; // Peak failure alert
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
    <div className="p-6 rounded-xl glass-card shadow-sm space-y-4 col-span-1 md:col-span-2">
      <div>
        <h5 className="font-display font-bold text-text-primary text-sm">Hourly Call Failure Matrix (Missed/Abandoned Inbound Counts)</h5>
        <p className="text-[11px] text-text-secondary mt-0.5">Average missed and abandoned call volume by day and hour</p>
      </div>

      <div className="grid grid-cols-[85px_1fr_45px] gap-2 items-center">
        {/* Main Grid Wrapper */}
        <div className="col-span-2 flex flex-col space-y-2">
          <div className="grid grid-cols-[85px_1fr] gap-x-2 gap-y-1.5 items-center">
            {/* Empty top-left cell */}
            <div />

            {/* X-axis hours (6 - 17) */}
            <div className="grid grid-cols-12 gap-[3px] text-[9px] font-mono font-bold text-text-secondary/70 text-center select-none">
              {businessHoursRange.map((h) => (
                <span key={h} className="w-full">{h}</span>
              ))}
            </div>

            {/* Matrix rows: Full day name + 12 business hour blocks */}
            {daysOfWeek.map((day, dayIdx) => (
              <React.Fragment key={day}>
                {/* Day label */}
                <span className="text-[10px] font-sans font-medium text-text-secondary/80 select-none truncate pr-1">
                  {day}
                </span>

                {/* 12 Heatmap blocks */}
                <div className="grid grid-cols-12 gap-[3px]">
                  {slicedData[dayIdx]?.map((count, index) => {
                    const hourVal = index + 6; // Hour values 6 to 17
                    return (
                      <div
                        key={index}
                        className={`aspect-square rounded-[3px] flex items-center justify-center text-[9px] font-mono transition-all cursor-pointer ${getCellColorClass(count)}`}
                        onMouseMove={(e) => handleMouseMove(e, dayIdx, hourVal, count)}
                        onMouseLeave={() => setHoveredCell(null)}
                      >
                        {count}
                      </div>
                    );
                  })}
                </div>
              </React.Fragment>
            ))}
          </div>

          {/* X-Axis Title */}
          <div className="grid grid-cols-[85px_1fr] gap-x-2">
            <div />
            <div className="text-center text-[9px] font-sans font-bold text-text-secondary/70 tracking-wider pt-2 uppercase select-none">
              Hour of Day (24-Hour Format)
            </div>
          </div>
        </div>

        {/* Right Column: Vertical Color Scale Legend */}
        <div className="flex flex-col items-center justify-between text-[8px] font-mono font-bold text-text-secondary/70 h-[190px] pl-3 border-l border-slate-200 dark:border-slate-800/80 select-none">
          <span className="text-center">{maxVal}+</span>
          <div className="w-2 flex-1 mx-2 my-1.5 bg-gradient-to-t from-red-50 to-red-700 dark:from-red-950/20 dark:to-red-600 rounded-sm" />
          <span className="text-center">0</span>
        </div>
      </div>

      {/* Tooltip */}
      {hoveredCell && (
        <div 
          className="fixed bg-text-primary text-white text-[9px] font-sans px-2.5 py-1.5 rounded shadow-lg pointer-events-none z-50 whitespace-nowrap border border-white/10"
          style={{
            left: `${hoveredCell.clientX}px`,
            top: `${hoveredCell.clientY}px`,
            transform: "translate(-50%, -100%)"
          }}
        >
          <strong className="text-red-300">{hoveredCell.day} {hoveredCell.hour}</strong>: {hoveredCell.count} missed calls
        </div>
      )}
    </div>
  );
}
