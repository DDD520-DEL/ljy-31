import { useMemo } from 'react';
import { HeatmapRoadData } from '../types';
import { cn } from '../lib/utils';

interface RoadRiskHeatmapProps {
  data: HeatmapRoadData[];
  className?: string;
}

export default function RoadRiskHeatmap({ data, className = '' }: RoadRiskHeatmapProps) {
  const hourLabels = useMemo(() => {
    return ['0', '3', '6', '9', '12', '15', '18', '21'];
  }, []);

  const getRiskColor = (risk: number) => {
    if (risk < 0.15) return 'bg-emerald-200';
    if (risk < 0.3) return 'bg-sky-200';
    if (risk < 0.45) return 'bg-amber-300';
    if (risk < 0.6) return 'bg-orange-400';
    return 'bg-red-500';
  };

  const getRiskTextColor = (risk: number) => {
    if (risk < 0.3) return 'text-emerald-600';
    if (risk < 0.5) return 'text-amber-600';
    return 'text-red-600';
  };

  const getRiskLabel = (risk: number) => {
    if (risk < 0.2) return '低';
    if (risk < 0.4) return '较低';
    if (risk < 0.6) return '中';
    if (risk < 0.8) return '较高';
    return '高';
  };

  return (
    <div className={`w-full overflow-x-auto ${className}`}>
      <div className="min-w-[600px]">
        <div className="flex mb-2">
          <div className="w-28 flex-shrink-0" />
          {hourLabels.map((hour, idx) => (
            <div
              key={hour}
              className="flex-1 text-center text-xs text-slate-400"
              style={{ marginLeft: idx === 0 ? '4px' : '0' }}
            >
              {hour}时
            </div>
          ))}
        </div>

        {data.map((road) => (
          <div key={road.roadName} className="flex items-center mb-1">
            <div className="w-28 text-xs text-slate-500 flex-shrink-0 pr-2 text-right truncate" title={road.roadName}>
              {road.roadName}
            </div>
            <div className="flex-1 flex gap-0.5">
              {[0, 3, 6, 9, 12, 15, 18, 21].map((startHour) => {
                const cells = [];
                for (let h = startHour; h < startHour + 3 && h < 24; h++) {
                  const hourData = road.hourlyData.find((d) => d.hour === h);
                  const risk = hourData?.risk || 0;
                  cells.push(
                    <div
                      key={h}
                      className={cn(
                        'flex-1 aspect-square rounded-sm transition-all duration-200 hover:ring-2 hover:ring-sky-500 cursor-pointer',
                        getRiskColor(risk)
                      )}
                      title={`${road.roadName} ${h}:00 - 风险 ${Math.round(risk * 100)}%`}
                    />
                  );
                }
                return (
                  <div key={startHour} className="flex-1 flex gap-0.5 px-0.5">
                    {cells}
                  </div>
                );
              })}
            </div>
            <div className="w-12 flex-shrink-0 pl-2">
              <span className={cn('text-xs font-medium', getRiskTextColor(road.overallRisk))}>
                {Math.round(road.overallRisk * 100)}%
              </span>
            </div>
          </div>
        ))}

        <div className="flex items-center justify-between mt-4 pr-14">
          <span className="text-xs text-slate-400">风险低</span>
          <div className="flex gap-0.5">
            <div className="w-5 h-5 rounded-sm bg-emerald-200" />
            <div className="w-5 h-5 rounded-sm bg-sky-200" />
            <div className="w-5 h-5 rounded-sm bg-amber-300" />
            <div className="w-5 h-5 rounded-sm bg-orange-400" />
            <div className="w-5 h-5 rounded-sm bg-red-500" />
          </div>
          <span className="text-xs text-slate-400">风险高</span>
        </div>
      </div>
    </div>
  );
}
