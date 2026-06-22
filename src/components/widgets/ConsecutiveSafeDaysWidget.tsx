import { useMemo } from 'react';
import { Shield, Flame } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '../Card';
import { useRecords } from '../../store/useAppStore';

export default function ConsecutiveSafeDaysWidget() {
  const records = useRecords();

  const consecutiveSafeDays = useMemo(() => {
    const sortedRecords = [...records].sort((a, b) => b.timestamp - a.timestamp);
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    let days = 0;
    const currentDate = new Date(today);

    while (true) {
      const dateStr = currentDate.toISOString().split('T')[0];
      const dayRecords = sortedRecords.filter((r) => r.date === dateStr);
      const hasSplash = dayRecords.some((r) => r.isSplashed);

      if (hasSplash) {
        break;
      }

      days++;
      currentDate.setDate(currentDate.getDate() - 1);

      if (days > 365) break;
    }

    return days;
  }, [records]);

  const getBadgeColor = () => {
    if (consecutiveSafeDays >= 7) return 'bg-emerald-500';
    if (consecutiveSafeDays >= 3) return 'bg-amber-500';
    return 'bg-red-500';
  };

  const getMessage = () => {
    if (consecutiveSafeDays >= 14) return '太棒了！保持这个势头';
    if (consecutiveSafeDays >= 7) return '非常棒，已经一周安全啦';
    if (consecutiveSafeDays >= 3) return '不错，继续保持';
    if (consecutiveSafeDays >= 1) return '今天很安全';
    return '小心哦，今天注意避让';
  };

  return (
    <Card className="bg-gradient-to-br from-emerald-50 to-teal-50 border-emerald-100">
      <CardHeader className="pb-2">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-emerald-500 flex items-center justify-center">
            <Shield className="w-4 h-4 text-white" />
          </div>
          <CardTitle className="text-sm">连续安全天数</CardTitle>
        </div>
      </CardHeader>
      <CardContent>
        <div className="flex items-end justify-between">
          <div>
            <div className="flex items-center gap-2">
              <p className="text-3xl font-bold text-slate-800">
                {consecutiveSafeDays}
              </p>
              <span className="text-sm text-slate-500">天</span>
              {consecutiveSafeDays >= 7 && (
                <Flame className="w-5 h-5 text-orange-500 animate-pulse" />
              )}
            </div>
            <p className="text-xs text-slate-500 mt-1">{getMessage()}</p>
          </div>
          <div className={`w-3 h-3 rounded-full ${getBadgeColor()} animate-pulse`} />
        </div>
      </CardContent>
    </Card>
  );
}
