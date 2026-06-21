interface HeatmapProps {
  data: Array<{ hour: number; day: number; count: number }>;
  className?: string;
}

const dayLabels = ['日', '一', '二', '三', '四', '五', '六'];
const hourLabels = ['0', '3', '6', '9', '12', '15', '18', '21'];

export default function Heatmap({ data, className = '' }: HeatmapProps) {
  const maxCount = Math.max(...data.map((d) => d.count), 1);

  const getColor = (count: number) => {
    if (count === 0) return 'bg-slate-100';
    const intensity = count / maxCount;
    if (intensity < 0.25) return 'bg-sky-200';
    if (intensity < 0.5) return 'bg-sky-400';
    if (intensity < 0.75) return 'bg-sky-500';
    return 'bg-sky-600';
  };

  return (
    <div className={`w-full overflow-x-auto ${className}`}>
      <div className="min-w-[600px]">
        <div className="flex mb-2">
          <div className="w-10 flex-shrink-0" />
          {hourLabels.map((hour, idx) => (
            <div
              key={hour}
              className="flex-1 text-center text-xs text-slate-400"
              style={{ marginLeft: idx === 0 ? '8px' : '0' }}
            >
              {hour}时
            </div>
          ))}
        </div>

        {[0, 1, 2, 3, 4, 5, 6].map((day) => (
          <div key={day} className="flex items-center mb-1">
            <div className="w-10 text-xs text-slate-400 flex-shrink-0 pr-2 text-right">
              {dayLabels[day]}
            </div>
            {[0, 3, 6, 9, 12, 15, 18, 21].map((startHour) => {
              const cells = [];
              for (let h = startHour; h < startHour + 3 && h < 24; h++) {
                const cellData = data.find((d) => d.hour === h && d.day === day);
                const count = cellData?.count || 0;
                cells.push(
                  <div
                    key={h}
                    className={`flex-1 aspect-square rounded-sm ${getColor(count)} transition-all duration-200 hover:ring-2 hover:ring-sky-500`}
                    title={`周${dayLabels[day]} ${h}:00 - ${count}次`}
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
        ))}

        <div className="flex items-center justify-end gap-2 mt-4 pr-2">
          <span className="text-xs text-slate-400">少</span>
          <div className="flex gap-0.5">
            <div className="w-4 h-4 rounded-sm bg-slate-100" />
            <div className="w-4 h-4 rounded-sm bg-sky-200" />
            <div className="w-4 h-4 rounded-sm bg-sky-400" />
            <div className="w-4 h-4 rounded-sm bg-sky-500" />
            <div className="w-4 h-4 rounded-sm bg-sky-600" />
          </div>
          <span className="text-xs text-slate-400">多</span>
        </div>
      </div>
    </div>
  );
}
