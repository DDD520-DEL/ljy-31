interface TimeAxisProps {
  data: Array<{ hour: number; count: number }>;
  highlightCurrentHour?: boolean;
  className?: string;
}

export default function TimeAxis({ data, highlightCurrentHour = true, className = '' }: TimeAxisProps) {
  const maxCount = Math.max(...data.map((d) => d.count), 1);
  const currentHour = new Date().getHours();

  return (
    <div className={`w-full ${className}`}>
      <div className="flex items-end justify-between h-24 gap-1">
        {data.map((item) => {
          const heightPercent = maxCount > 0 ? (item.count / maxCount) * 100 : 0;
          const isCurrentHour = highlightCurrentHour && item.hour === currentHour;
          const isNearHour =
            highlightCurrentHour && Math.abs(item.hour - currentHour) <= 2;

          return (
            <div key={item.hour} className="flex-1 flex flex-col items-center gap-1">
              <div
                className={`w-full rounded-t-lg transition-all duration-300 ${
                  isCurrentHour
                    ? 'bg-gradient-to-t from-orange-500 to-orange-400 animate-pulse'
                    : isNearHour
                    ? 'bg-gradient-to-t from-sky-500 to-sky-400'
                    : 'bg-gradient-to-t from-sky-300 to-sky-200'
                }`}
                style={{ height: `${Math.max(heightPercent, 8)}%` }}
                title={`${item.hour}:00 - ${item.count}次`}
              />
              <span
                className={`text-xs ${
                  isCurrentHour ? 'text-orange-600 font-semibold' : 'text-slate-400'
                }`}
              >
                {String(item.hour).padStart(2, '0')}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
