import { useState, useMemo, useRef } from 'react';
import { ChevronLeft, ChevronRight, X, Droplets, MapPin, Clock, CalendarDays } from 'lucide-react';
import { useRecords } from '../store/useAppStore';
import { Card, CardContent, CardHeader, CardTitle } from '../components/Card';
import { SprinklerRecord } from '../types';
import { formatDate, getDayName } from '../utils/format';
import { cn } from '../lib/utils';

const WEEKDAYS = ['日', '一', '二', '三', '四', '五', '六'];

export default function Calendar() {
  const records = useRecords();
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [showDayModal, setShowDayModal] = useState(false);

  const touchStartX = useRef<number | null>(null);
  const touchEndX = useRef<number | null>(null);
  const minSwipeDistance = 50;

  const currentYear = currentDate.getFullYear();
  const currentMonth = currentDate.getMonth();

  const calendarData = useMemo(() => {
    const firstDay = new Date(currentYear, currentMonth, 1);
    const lastDay = new Date(currentYear, currentMonth + 1, 0);
    const startDayOfWeek = firstDay.getDay();
    const daysInMonth = lastDay.getDate();

    const days: Array<{
      date: string;
      day: number;
      isCurrentMonth: boolean;
      records: SprinklerRecord[];
      splashCount: number;
    }> = [];

    const prevMonthLastDay = new Date(currentYear, currentMonth, 0).getDate();
    for (let i = startDayOfWeek - 1; i >= 0; i--) {
      const day = prevMonthLastDay - i;
      const date = new Date(currentYear, currentMonth - 1, day);
      const dateStr = formatDate(date.getTime());
      const dayRecords = records.filter((r) => r.date === dateStr);
      days.push({
        date: dateStr,
        day,
        isCurrentMonth: false,
        records: dayRecords,
        splashCount: dayRecords.filter((r) => r.isSplashed).length,
      });
    }

    for (let day = 1; day <= daysInMonth; day++) {
      const date = new Date(currentYear, currentMonth, day);
      const dateStr = formatDate(date.getTime());
      const dayRecords = records.filter((r) => r.date === dateStr);
      days.push({
        date: dateStr,
        day,
        isCurrentMonth: true,
        records: dayRecords,
        splashCount: dayRecords.filter((r) => r.isSplashed).length,
      });
    }

    const remainingDays = 42 - days.length;
    for (let day = 1; day <= remainingDays; day++) {
      const date = new Date(currentYear, currentMonth + 1, day);
      const dateStr = formatDate(date.getTime());
      const dayRecords = records.filter((r) => r.date === dateStr);
      days.push({
        date: dateStr,
        day,
        isCurrentMonth: false,
        records: dayRecords,
        splashCount: dayRecords.filter((r) => r.isSplashed).length,
      });
    }

    return days;
  }, [currentYear, currentMonth, records]);

  const monthStats = useMemo(() => {
    const monthRecords = records.filter((r) => {
      const d = new Date(r.timestamp);
      return d.getFullYear() === currentYear && d.getMonth() === currentMonth;
    });

    const totalRecords = monthRecords.length;
    const totalSplashed = monthRecords.filter((r) => r.isSplashed).length;
    const splashRate = totalRecords > 0 ? (totalSplashed / totalRecords) * 100 : 0;

    const daysWithRecords = new Set(monthRecords.map((r) => r.date)).size;

    const roadCounts: Record<string, number> = {};
    monthRecords.forEach((r) => {
      roadCounts[r.road] = (roadCounts[r.road] || 0) + 1;
    });
    const topRoad = Object.entries(roadCounts).sort((a, b) => b[1] - a[1])[0];

    return {
      totalRecords,
      totalSplashed,
      splashRate: splashRate.toFixed(1),
      daysWithRecords,
      topRoad: topRoad ? topRoad[0] : '-',
      topRoadCount: topRoad ? topRoad[1] : 0,
    };
  }, [records, currentYear, currentMonth]);

  const maxSplashCount = useMemo(() => {
    const counts = calendarData
      .filter((d) => d.isCurrentMonth)
      .map((d) => d.splashCount);
    return Math.max(...counts, 1);
  }, [calendarData]);

  const getHeatColor = (splashCount: number, isCurrentMonth: boolean) => {
    if (!isCurrentMonth) return 'bg-slate-50';
    if (splashCount === 0) return 'bg-white';

    const intensity = splashCount / maxSplashCount;

    if (intensity < 0.25) return 'bg-sky-100';
    if (intensity < 0.5) return 'bg-sky-300';
    if (intensity < 0.75) return 'bg-sky-500';
    return 'bg-sky-700';
  };

  const getTextColor = (splashCount: number, isCurrentMonth: boolean) => {
    if (!isCurrentMonth) return 'text-slate-300';
    if (splashCount === 0) return 'text-slate-700';

    const intensity = splashCount / maxSplashCount;
    if (intensity >= 0.5) return 'text-white';
    return 'text-slate-700';
  };

  const goToPrevMonth = () => {
    setCurrentDate(new Date(currentYear, currentMonth - 1, 1));
  };

  const goToNextMonth = () => {
    setCurrentDate(new Date(currentYear, currentMonth + 1, 1));
  };

  const goToToday = () => {
    setCurrentDate(new Date());
  };

  const handleDayClick = (date: string) => {
    setSelectedDate(date);
    setShowDayModal(true);
  };

  const closeDayModal = () => {
    setShowDayModal(false);
    setSelectedDate(null);
  };

  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartX.current = e.touches[0].clientX;
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    touchEndX.current = e.touches[0].clientX;
  };

  const handleTouchEnd = () => {
    if (touchStartX.current === null || touchEndX.current === null) return;

    const distance = touchStartX.current - touchEndX.current;

    if (Math.abs(distance) > minSwipeDistance) {
      if (distance > 0) {
        goToNextMonth();
      } else {
        goToPrevMonth();
      }
    }

    touchStartX.current = null;
    touchEndX.current = null;
  };

  const selectedDayRecords = useMemo(() => {
    if (!selectedDate) return [];
    return records
      .filter((r) => r.date === selectedDate)
      .sort((a, b) => a.timestamp - b.timestamp);
  }, [selectedDate, records]);

  const isToday = (dateStr: string) => {
    return dateStr === formatDate(Date.now());
  };

  return (
    <div
      className="p-4 space-y-4"
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
    >
      <div className="pt-2">
        <h1 className="text-2xl font-bold text-slate-800 mb-1">日历视图</h1>
        <p className="text-slate-500 text-sm">按月查看洒水车记录分布</p>
      </div>

      <div className="grid grid-cols-3 gap-3">
        <Card hover className="text-center">
          <CardContent className="py-3">
            <p className="text-xl font-bold text-slate-800">{monthStats.totalRecords}</p>
            <p className="text-xs text-slate-500 mt-1">本月记录</p>
          </CardContent>
        </Card>
        <Card hover className="text-center">
          <CardContent className="py-3">
            <p className="text-xl font-bold text-orange-600">{monthStats.totalSplashed}</p>
            <p className="text-xs text-slate-500 mt-1">被溅次数</p>
          </CardContent>
        </Card>
        <Card hover className="text-center">
          <CardContent className="py-3">
            <p className="text-xl font-bold text-sky-600">{monthStats.daysWithRecords}</p>
            <p className="text-xs text-slate-500 mt-1">有记录天数</p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader className="pb-2">
          <div className="flex items-center justify-between">
            <button
              onClick={goToPrevMonth}
              className="p-2 rounded-lg hover:bg-slate-100 transition-colors text-slate-600"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>

            <div className="text-center">
              <h2 className="text-lg font-bold text-slate-800">
                {currentYear}年{currentMonth + 1}月
              </h2>
              <button
                onClick={goToToday}
                className="text-xs text-sky-600 hover:text-sky-700 font-medium"
              >
                回到今天
              </button>
            </div>

            <button
              onClick={goToNextMonth}
              className="p-2 rounded-lg hover:bg-slate-100 transition-colors text-slate-600"
            >
              <ChevronRight className="w-5 h-5" />
            </button>
          </div>

          <div className="flex items-center justify-end gap-2 mt-2">
            <span className="text-xs text-slate-400">溅水少</span>
            <div className="flex gap-0.5">
              <div className="w-4 h-4 rounded-sm bg-white border border-slate-200" />
              <div className="w-4 h-4 rounded-sm bg-sky-100" />
              <div className="w-4 h-4 rounded-sm bg-sky-300" />
              <div className="w-4 h-4 rounded-sm bg-sky-500" />
              <div className="w-4 h-4 rounded-sm bg-sky-700" />
            </div>
            <span className="text-xs text-slate-400">多</span>
          </div>
        </CardHeader>

        <CardContent className="pt-0">
          <div className="grid grid-cols-7 gap-1 mb-2">
            {WEEKDAYS.map((day, idx) => (
              <div
                key={day}
                className={cn(
                  'text-center text-xs font-medium py-2',
                  idx === 0 || idx === 6 ? 'text-rose-400' : 'text-slate-400'
                )}
              >
                {day}
              </div>
            ))}
          </div>

          <div className="grid grid-cols-7 gap-1">
            {calendarData.map((day, idx) => {
              const dayOfWeek = idx % 7;
              const isWeekend = dayOfWeek === 0 || dayOfWeek === 6;
              const today = isToday(day.date);

              return (
                <button
                  key={day.date + idx}
                  onClick={() => day.isCurrentMonth && handleDayClick(day.date)}
                  disabled={!day.isCurrentMonth}
                  className={cn(
                    'aspect-square flex flex-col items-center justify-center rounded-lg transition-all duration-200 relative',
                    getHeatColor(day.splashCount, day.isCurrentMonth),
                    day.isCurrentMonth && 'hover:ring-2 hover:ring-sky-400 cursor-pointer',
                    !day.isCurrentMonth && 'cursor-default',
                    today && 'ring-2 ring-sky-500 ring-offset-1'
                  )}
                >
                  <span
                    className={cn(
                      'text-sm font-medium',
                      getTextColor(day.splashCount, day.isCurrentMonth),
                      isWeekend && day.isCurrentMonth && day.splashCount === 0 && 'text-rose-400',
                      today && 'text-sky-600 font-bold'
                    )}
                  >
                    {day.day}
                  </span>
                  {day.isCurrentMonth && day.splashCount > 0 && (
                    <span
                      className={cn(
                        'text-xs mt-0.5 font-medium',
                        day.splashCount / maxSplashCount >= 0.5 ? 'text-white/90' : 'text-sky-600'
                      )}
                    >
                      {day.splashCount}
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <CalendarDays className="w-5 h-5 text-sky-500" />
            本月概览
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex items-center justify-between text-sm">
            <span className="text-slate-500">溅水率</span>
            <span className="font-medium text-slate-700">{monthStats.splashRate}%</span>
          </div>
          <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-sky-400 to-sky-600 rounded-full transition-all duration-500"
              style={{ width: `${Math.min(Number(monthStats.splashRate), 100)}%` }}
            />
          </div>
          <div className="flex items-center justify-between text-sm pt-2">
            <span className="text-slate-500">最常遇到路段</span>
            <span className="font-medium text-slate-700">
              {monthStats.topRoad}
              {monthStats.topRoadCount > 0 && (
                <span className="text-slate-400 ml-1">({monthStats.topRoadCount}次)</span>
              )}
            </span>
          </div>
        </CardContent>
      </Card>

      {showDayModal && selectedDate && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-end sm:items-center justify-center z-50">
          <div
            className="bg-white w-full max-w-md rounded-t-2xl sm:rounded-2xl max-h-[80vh] flex flex-col animate-slide-up"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between p-4 border-b border-slate-100 flex-shrink-0">
              <div>
                <h3 className="text-lg font-bold text-slate-800">{selectedDate}</h3>
                <p className="text-sm text-slate-500">
                  {getDayName(new Date(selectedDate).getDay())} · 共{' '}
                  {selectedDayRecords.length} 条记录
                </p>
              </div>
              <button
                onClick={closeDayModal}
                className="p-2 rounded-lg hover:bg-slate-100 text-slate-400 hover:text-slate-600 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-4 space-y-3">
              {selectedDayRecords.length > 0 ? (
                selectedDayRecords.map((record) => (
                  <div
                    key={record.id}
                    className={cn(
                      'p-3 rounded-xl border transition-colors',
                      record.isSplashed
                        ? 'bg-orange-50 border-orange-200'
                        : 'bg-slate-50 border-slate-200'
                    )}
                  >
                    <div className="flex items-start gap-3">
                      <div
                        className={cn(
                          'w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0',
                          record.isSplashed
                            ? 'bg-orange-200 text-orange-700'
                            : 'bg-slate-200 text-slate-600'
                        )}
                      >
                        {record.isSplashed ? (
                          <Droplets className="w-5 h-5" />
                        ) : (
                          <Clock className="w-5 h-5" />
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="font-medium text-slate-800">{record.time}</span>
                          <span
                            className={cn(
                              'text-xs px-2 py-0.5 rounded-full',
                              record.isSplashed
                                ? 'bg-orange-200 text-orange-700'
                                : 'bg-slate-200 text-slate-600'
                            )}
                          >
                            {record.isSplashed ? '被溅到' : '未被溅'}
                          </span>
                        </div>
                        <div className="flex items-center gap-1 text-sm text-slate-500 mt-1">
                          <MapPin className="w-3.5 h-3.5 flex-shrink-0" />
                          <span className="truncate">{record.road}</span>
                        </div>
                        {record.note && (
                          <p className="text-xs text-slate-400 mt-1 line-clamp-2">
                            {record.note}
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center py-12">
                  <div className="w-16 h-16 mx-auto rounded-full bg-slate-100 flex items-center justify-center mb-3">
                    <CalendarDays className="w-8 h-8 text-slate-300" />
                  </div>
                  <p className="text-slate-500 text-sm">当天暂无记录</p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      <style>{`
        @keyframes slide-up {
          from {
            transform: translateY(100%);
          }
          to {
            transform: translateY(0);
          }
        }
        .animate-slide-up {
          animation: slide-up 0.3s ease-out;
        }
      `}</style>
    </div>
  );
}
