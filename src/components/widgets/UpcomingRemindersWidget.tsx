import { Bell, AlertTriangle } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '../Card';
import { useUpcomingReminders } from '../../hooks/usePredictions';
import { useSettings } from '../../store/useAppStore';
import { getConfidenceLabel } from '../../utils/format';

export default function UpcomingRemindersWidget() {
  const settings = useSettings();
  const upcomingReminders = useUpcomingReminders(settings.reminderMinutes);

  if (!settings.reminderEnabled || upcomingReminders.length === 0) {
    return (
      <Card>
        <CardHeader className="pb-2">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-sky-500 flex items-center justify-center">
              <Bell className="w-4 h-4 text-white" />
            </div>
            <CardTitle className="text-sm">即将提醒</CardTitle>
          </div>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-slate-500 text-center py-4">
            {settings.reminderEnabled ? '暂无即将经过的洒水车' : '提醒功能未开启'}
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card gradient className="overflow-hidden">
      <CardHeader className="pb-2 border-b border-white/20">
        <div className="flex items-center gap-2">
          <Bell className="w-4 h-4 text-white animate-pulse" />
          <CardTitle className="text-white text-sm">即将提醒</CardTitle>
          <span className="px-2 py-0.5 rounded-full bg-white/20 text-white text-xs">
            {upcomingReminders.length}个
          </span>
        </div>
      </CardHeader>
      <CardContent className="space-y-2 pt-3">
        {upcomingReminders.slice(0, 2).map((reminder, idx) => (
          <div
            key={idx}
            className="flex items-center justify-between bg-white/10 rounded-xl p-2.5 backdrop-blur-sm"
          >
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-xl bg-white/20 flex items-center justify-center flex-shrink-0">
                <AlertTriangle className="w-4 h-4 text-yellow-300" />
              </div>
              <div>
                <p className="text-sm font-medium text-white">{reminder.road}</p>
                <p className="text-xs text-sky-100">
                  预计 {reminder.time} · {getConfidenceLabel(reminder.confidence)}
                </p>
              </div>
            </div>
            <div className="text-right">
              <p className="text-lg font-bold text-white">{reminder.minutesLeft}</p>
              <p className="text-xs text-sky-100">分钟后</p>
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}
