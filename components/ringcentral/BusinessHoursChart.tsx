"use client";

interface VolumeMetric {
  inbound: number;
  answered: number;
  missed: number;
}

interface BusinessHoursChartProps {
  businessHoursData: {
    businessHours: VolumeMetric;
    afterHours: VolumeMetric;
  };
}

export default function BusinessHoursChart({ businessHoursData }: BusinessHoursChartProps) {
  if (!businessHoursData) return null;

  const { businessHours, afterHours } = businessHoursData;
  const totalInbound = Math.max(businessHours.inbound + afterHours.inbound, 1);

  // Percent ratios relative to overall totals
  const getPercentOfTotal = (val: number) => Math.round((val / totalInbound) * 100);

  return (
    <div className="p-6 rounded-xl bg-white/60 border border-gray-200/50 shadow-sm backdrop-blur-md space-y-5">
      <div>
        <h5 className="font-display font-bold text-text-primary text-sm">Business Hours vs After-Hours</h5>
        <p className="text-[11px] text-text-secondary mt-0.5">Performance comparison by time frames</p>
      </div>

      <div className="space-y-6">
        {/* Business Hours Segment (8 AM - 6 PM) */}
        <div className="space-y-2">
          <div className="flex justify-between items-baseline text-xs">
            <span className="font-semibold text-text-primary">Business Hours (8 AM – 6 PM)</span>
            <span className="font-mono text-text-secondary">{businessHours.inbound} calls ({getPercentOfTotal(businessHours.inbound)}%)</span>
          </div>
          
          <div className="space-y-1.5">
            {/* Inbound Bar */}
            <div className="space-y-1">
              <div className="flex justify-between text-[9px] text-text-secondary/80 font-mono">
                <span>Inbound</span>
                <span>{businessHours.inbound}</span>
              </div>
              <div className="h-2 w-full bg-gray-200/40 rounded-full overflow-hidden">
                <div 
                  className="h-full bg-accent-luxury/80 rounded-full transition-all duration-500" 
                  style={{ width: `${getPercentOfTotal(businessHours.inbound)}%` }} 
                />
              </div>
            </div>

            {/* Answered Bar */}
            <div className="space-y-1">
              <div className="flex justify-between text-[9px] text-text-secondary/80 font-mono">
                <span>Answered</span>
                <span>{businessHours.answered}</span>
              </div>
              <div className="h-2 w-full bg-gray-200/40 rounded-full overflow-hidden">
                <div 
                  className="h-full bg-accent-emerald/80 rounded-full transition-all duration-500" 
                  style={{ width: `${getPercentOfTotal(businessHours.answered)}%` }} 
                />
              </div>
            </div>

            {/* Missed Bar */}
            <div className="space-y-1">
              <div className="flex justify-between text-[9px] text-text-secondary/80 font-mono">
                <span>Missed</span>
                <span>{businessHours.missed}</span>
              </div>
              <div className="h-2 w-full bg-gray-200/40 rounded-full overflow-hidden">
                <div 
                  className="h-full bg-red-400/80 rounded-full transition-all duration-500" 
                  style={{ width: `${getPercentOfTotal(businessHours.missed)}%` }} 
                />
              </div>
            </div>
          </div>
        </div>

        {/* After Hours Segment (6 PM - 8 AM) */}
        <div className="space-y-2 border-t border-gray-200/30 pt-4">
          <div className="flex justify-between items-baseline text-xs">
            <span className="font-semibold text-text-primary">After-Hours (6 PM – 8 AM)</span>
            <span className="font-mono text-text-secondary">{afterHours.inbound} calls ({getPercentOfTotal(afterHours.inbound)}%)</span>
          </div>

          <div className="space-y-1.5">
            {/* Inbound Bar */}
            <div className="space-y-1">
              <div className="flex justify-between text-[9px] text-text-secondary/80 font-mono">
                <span>Inbound</span>
                <span>{afterHours.inbound}</span>
              </div>
              <div className="h-2 w-full bg-gray-200/40 rounded-full overflow-hidden">
                <div 
                  className="h-full bg-accent-luxury/60 rounded-full transition-all duration-500" 
                  style={{ width: `${getPercentOfTotal(afterHours.inbound)}%` }} 
                />
              </div>
            </div>

            {/* Answered Bar */}
            <div className="space-y-1">
              <div className="flex justify-between text-[9px] text-text-secondary/80 font-mono">
                <span>Answered</span>
                <span>{afterHours.answered}</span>
              </div>
              <div className="h-2 w-full bg-gray-200/40 rounded-full overflow-hidden">
                <div 
                  className="h-full bg-accent-emerald/60 rounded-full transition-all duration-500" 
                  style={{ width: `${getPercentOfTotal(afterHours.answered)}%` }} 
                />
              </div>
            </div>

            {/* Missed Bar */}
            <div className="space-y-1">
              <div className="flex justify-between text-[9px] text-text-secondary/80 font-mono">
                <span>Missed</span>
                <span>{afterHours.missed}</span>
              </div>
              <div className="h-2 w-full bg-gray-200/40 rounded-full overflow-hidden">
                <div 
                  className="h-full bg-red-400/60 rounded-full transition-all duration-500" 
                  style={{ width: `${getPercentOfTotal(afterHours.missed)}%` }} 
                />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
