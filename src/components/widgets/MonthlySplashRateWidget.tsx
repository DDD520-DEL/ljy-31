import { useMemo } from 'react';
import { Droplets, TrendingUp, TrendingDown, Minus } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '../Card';
import { useRecords } from '../../store/useAppStore';
import { cn } from '../../lib/utils';

export default function MonthlySplashRateWidget() {
  const records = useRecords();

  const { currentMonthRate, previousMonthRate, trend } = useMemo(() => {
    const now = new Date();
    const currentMonth = now.getMonth();
    const currentYear = now.getFullYear();
    const prevMonth = currentMonth === 0 ? 11 : currentMonth - 1;
    const prevYear = currentMonth === 0 ? currentYear - 1 : currentYear;

    const currentMonthRecords = records.filter(
      (r) =>
        new Date(r.timestamp).getMonth() === currentMonth &&
        new Date(r.timestamp).getFullYear() === currentYear
    );
    const prevMonthRecords = records.filter(
      (r) =>
        new Date(r.timestamp).getMonth() === prevMonth &&
        new Date(r.timestamp).getFullYear() === prevYear
    );

    const currentRate =
      currentMonthRecords.length > 0
        ? currentMonthRecords.filter((r) => r.isSplashed).length /
          currentMonthRecords.length
        : 0;
    const prevRate =
      prevMonthRecords.length > 0
        ? prevMonthRecords.filter((r) => r.isSplashed).length /
          prevMonthRecords.length
        : 0;

    const diff = currentRate - prevRate;
    let trendType: 'up' | 'down' | 'stable' = 'stable';
    if (Math.abs(diff) < 0.01) trendType = 'stable';
    else if (diff > 0) trendType = 'up';
    else trendType = 'down';

    return {
      currentMonthRate: currentRate,
      previousMonthRate: prevRate,
      trend: trendType,
    };
  }, [records]);

  const TrendIcon = trend === 'up' ? TrendingUp : trend === 'down' ? TrendingDown : Minus;
  const trendColor = trend === 'up' 
    ? 'text-red-500' 
    : trend === 'down' 
      ? 'text-emerald-500' 
      : 'text-slate-400';
  const trendBgColor = trend === 'up' 
    ? 'bg-red-50' 
    : trend === 'down' 
      ? 'bg-emerald-50' 
      : 'bg-slate-50';

  return (
    <Card className="bg-gradient-to-br from-sky-50 to-blue-50 border-sky-100">
      <CardHeader className="pb-2">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-sky-500 flex items-center justify-center">
            <Droplets className="w-4 h-4 text-white" />
          </div>
          <CardTitle className="text-sm">本月溅水率</CardTitle>
        </div>
      </CardHeader>
      <CardContent>
        <div className="flex items-end justify-between">
          <div>
            <p className="text-3xl font-bold text-slate-800">
              {Math.round(currentMonthRate * 100)}%
            </p>
            <p className="text-xs text-slate-500 mt-1">
              较上月 {previousMonthRate > 0 ? `${previousMonthRate * 100 > currentMonthRate * 100 ? '下降' : '上升'} ${Math.abs(Math.round((currentMonthRate - previousMonthRate) * 100))}%` : '持平'}
            </p>
          </div>
          <div className={cn('p-2 rounded-lg', trendBgColor)}>
            <TrendIcon className={cn('w-5 h-5', trendColor)} />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
