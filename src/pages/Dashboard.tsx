import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Droplets, Plus, Bell, AlertTriangle, ChevronRight, Star, Settings as SettingsIcon, CloudRain, Wind, Droplets as DropletsIcon, RefreshCw, FileText, X, TrendingUp, TrendingDown, Minus, Zap } from 'lucide-react';
import { useTodayPredictions, useSplashStatistics, useRecentRecords, useUpcomingReminders } from '../hooks/usePredictions';
import {
  useSettings,
  useFavoritePredictions,
  useLatestWeeklyReport,
  useCheckAndGenerateWeeklyReport,
  useDismissWeeklyBanner,
  useWeeklyReportSettings,
} from '../store/useAppStore';
import { useWeatherData, useWeatherHint, useOverallWeatherRisk } from '../hooks/useWeather';
import { Card, CardContent, CardHeader, CardTitle } from '../components/Card';
import { Button } from '../components/Button';
import PredictionCard from '../components/PredictionCard';
import RecordCard from '../components/RecordCard';
import TimeAxis from '../components/TimeAxis';
import WeeklyReportCard from '../components/WeeklyReportCard';
import { getConfidenceLabel, getConfidenceColor } from '../utils/format';
import { cn } from '../lib/utils';

export default function Dashboard() {
  const navigate = useNavigate();
  const todayPredictions = useTodayPredictions();
  const splashStats = useSplashStatistics();
  const recentRecords = useRecentRecords(3);
  const settings = useSettings();
  const favoritePredictions = useFavoritePredictions();
  const upcomingReminders = useUpcomingReminders(settings.reminderMinutes);
  const { weather, isWeatherLoading, refreshWeather } = useWeatherData();
  const weatherHint = useWeatherHint();
  const weatherRisk = useOverallWeatherRisk();
  const latestReport = useLatestWeeklyReport();
  const checkAndGenerateWeeklyReport = useCheckAndGenerateWeeklyReport();
  const dismissWeeklyBanner = useDismissWeeklyBanner();
  const weeklyReportSettings = useWeeklyReportSettings();
  const [showReportDetail, setShowReportDetail] = useState(false);

  useEffect(() => {
    checkAndGenerateWeeklyReport();
  }, [checkAndGenerateWeeklyReport]);

  const shouldShowBanner =
    latestReport && !weeklyReportSettings.bannerDismissed[latestReport.id];

  const handleDismissBanner = () => {
    if (latestReport) {
      dismissWeeklyBanner(latestReport.id);
    }
  };

  const handleViewReportDetail = () => {
    navigate('/statistics');
  };

  const currentHour = new Date().getHours();
  const timeAxisData = Array.from({ length: 24 }, (_, i) => ({
    hour: i,
    count: todayPredictions.reduce((sum, p) => {
      return sum + p.predictedTimes.filter((t) => t.hour === i).length;
    }, 0),
  }));

  const greeting = () => {
    const hour = new Date().getHours();
    if (hour < 6) return '夜深了';
    if (hour < 9) return '早上好';
    if (hour < 12) return '上午好';
    if (hour < 14) return '中午好';
    if (hour < 18) return '下午好';
    if (hour < 22) return '晚上好';
    return '夜深了';
  };

  return (
    <div className="p-4 space-y-6">
      <div className="flex items-center justify-between pt-2">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">{greeting()} ☀️</h1>
          <p className="text-slate-500 text-sm mt-1">今天也要小心洒水车哦</p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => navigate('/settings')}
            className="w-12 h-12 rounded-2xl bg-white shadow-sm border border-slate-100 flex items-center justify-center text-slate-600 hover:bg-slate-50 transition-colors"
          >
            <SettingsIcon className="w-5 h-5" />
          </button>
          <button
            onClick={() => navigate('/record')}
            className="w-12 h-12 rounded-2xl bg-gradient-to-br from-sky-500 to-blue-600 text-white shadow-lg shadow-sky-500/30 flex items-center justify-center hover:scale-105 active:scale-95 transition-transform"
          >
            <Plus className="w-6 h-6" strokeWidth={2.5} />
          </button>
        </div>
      </div>

      {shouldShowBanner && latestReport && (
        <div className="relative">
          <Card className="bg-gradient-to-br from-indigo-500 via-purple-500 to-pink-500 text-white border-0 overflow-hidden shadow-lg">
            <button
              onClick={handleDismissBanner}
              className="absolute top-3 right-3 w-8 h-8 rounded-lg bg-white/10 hover:bg-white/20 flex items-center justify-center transition-colors z-10"
            >
              <X className="w-4 h-4" />
            </button>
            <CardContent className="py-4">
              {!showReportDetail ? (
                <WeeklyReportCard
                  report={latestReport}
                  compact
                  onViewDetail={() => setShowReportDetail(true)}
                />
              ) : (
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <FileText className="w-5 h-5 text-white/80" />
                      <span className="text-sm text-white/80">
                        第 {latestReport.weekNumber} 周周报详情
                      </span>
                    </div>
                    <button
                      onClick={handleViewReportDetail}
                      className="text-sm text-white/80 hover:text-white flex items-center gap-1"
                    >
                      统计页查看
                      <ChevronRight className="w-4 h-4" />
                    </button>
                  </div>
                  <WeeklyReportCard report={latestReport} />
                  <button
                    onClick={() => setShowReportDetail(false)}
                    className="w-full py-2 rounded-xl bg-white/10 hover:bg-white/20 text-sm font-medium transition-colors"
                  >
                    收起详情
                  </button>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      )}

      {settings.weatherNotificationEnabled && (
        <Card className={cn(
          'border-2 overflow-hidden',
          weatherRisk.borderColor,
          weatherRisk.bgColor
        )}>
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <CloudRain className={cn('w-5 h-5', weatherRisk.riskColor)} />
                <CardTitle>天气预警</CardTitle>
              </div>
              <button
                onClick={() => refreshWeather()}
                disabled={isWeatherLoading}
                className="w-8 h-8 rounded-lg flex items-center justify-center hover:bg-white/50 transition-colors disabled:opacity-50"
              >
                <RefreshCw className={cn('w-4 h-4', isWeatherLoading && 'animate-spin', weatherRisk.riskColor)} />
              </button>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-start gap-4">
              <div className="text-5xl">
                {isWeatherLoading ? '🌤️' : weatherHint.icon}
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-xl font-bold text-slate-800">
                    {isWeatherLoading ? '加载中...' : weatherHint.description}
                  </span>
                  <span className={cn(
                    'px-2 py-0.5 rounded-full text-xs font-medium',
                    weatherRisk.bgColor,
                    weatherRisk.riskColor
                  )}>
                    {weatherRisk.riskText}
                  </span>
                </div>
                {weather && (
                  <div className="flex flex-wrap gap-4 text-sm text-slate-600">
                    <span className="flex items-center gap-1">
                      🌡️ {weather.temperature}°C
                    </span>
                    <span className="flex items-center gap-1">
                      <DropletsIcon className="w-3.5 h-3.5" />
                      {weather.humidity}%
                    </span>
                    <span className="flex items-center gap-1">
                      <Wind className="w-3.5 h-3.5" />
                      {weather.windSpeed}km/h
                    </span>
                  </div>
                )}
              </div>
            </div>

            <div className="bg-white/60 rounded-xl p-4 backdrop-blur-sm">
              <div className="flex items-start gap-3">
                <AlertTriangle className={cn('w-5 h-5 flex-shrink-0 mt-0.5', weatherRisk.riskColor)} />
                <div>
                  <p className={cn('font-medium mb-1', weatherRisk.riskColor)}>
                    {weatherHint.hint}
                  </p>
                  <p className="text-sm text-slate-600">
                    {weatherRisk.description}
                  </p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {settings.reminderEnabled && upcomingReminders.length > 0 && (
        <Card gradient className="overflow-hidden">
          <CardHeader className="border-b border-white/20">
            <div className="flex items-center gap-2">
              <Bell className="w-5 h-5 animate-pulse" />
              <CardTitle className="text-white">即将提醒</CardTitle>
            </div>
          </CardHeader>
          <CardContent className="space-y-3">
            {upcomingReminders.slice(0, 2).map((reminder, idx) => (
              <div
                key={idx}
                className="flex items-center justify-between bg-white/10 rounded-xl p-3 backdrop-blur-sm"
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center">
                    <AlertTriangle className="w-5 h-5 text-yellow-300" />
                  </div>
                  <div>
                    <p className="font-medium text-white">{reminder.road}</p>
                    <p className="text-sm text-sky-100">预计 {reminder.time} 经过</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-xl font-bold text-white">{reminder.minutesLeft}</p>
                  <p className="text-xs text-sky-100">分钟后</p>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      <div className="grid grid-cols-3 gap-3">
        <Card hover className="text-center">
          <CardContent className="py-5">
            <div className="w-12 h-12 mx-auto rounded-xl bg-sky-100 flex items-center justify-center mb-2">
              <Droplets className="w-6 h-6 text-sky-600" />
            </div>
            <p className="text-2xl font-bold text-slate-800">{splashStats.total}</p>
            <p className="text-xs text-slate-500 mt-1">总记录</p>
          </CardContent>
        </Card>
        <Card hover className="text-center">
          <CardContent className="py-5">
            <div className="w-12 h-12 mx-auto rounded-xl bg-orange-100 flex items-center justify-center mb-2">
              <AlertTriangle className="w-6 h-6 text-orange-500" />
            </div>
            <p className="text-2xl font-bold text-slate-800">{splashStats.splashed}</p>
            <p className="text-xs text-slate-500 mt-1">被溅次数</p>
          </CardContent>
        </Card>
        <Card hover className="text-center">
          <CardContent className="py-5">
            <div className="w-12 h-12 mx-auto rounded-xl bg-emerald-100 flex items-center justify-center mb-2">
              <Droplets className="w-6 h-6 text-emerald-600" />
            </div>
            <p className="text-2xl font-bold text-slate-800">
              {Math.round(splashStats.rate * 100)}%
            </p>
            <p className="text-xs text-slate-500 mt-1">溅水率</p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>今日 24 小时分布</CardTitle>
        </CardHeader>
        <CardContent>
          <TimeAxis data={timeAxisData} />
        </CardContent>
      </Card>

      {favoritePredictions.length > 0 && (
        <div>
          <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Star className="w-5 h-5 text-amber-500 fill-amber-500" />
            <h2 className="text-lg font-semibold text-slate-800">常用路段预测</h2>
          </div>
            <button
              onClick={() => navigate('/schedule')}
              className="text-sky-600 text-sm font-medium flex items-center gap-1 hover:gap-2 transition-all"
            >
              管理
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
          <div className="space-y-3">
            {favoritePredictions.slice(0, 3).map((prediction) => (
              <PredictionCard
                key={prediction.roadName}
                prediction={prediction}
                highlight={true}
                onClick={() => navigate('/schedule')}
              />
            ))}
          </div>
        </div>
      )}

      {todayPredictions.length > 0 && (
        <div>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-slate-800">今日预测路段</h2>
            <button
              onClick={() => navigate('/schedule')}
              className="text-sky-600 text-sm font-medium flex items-center gap-1 hover:gap-2 transition-all"
            >
              查看全部
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
          <div className="space-y-3">
            {todayPredictions.slice(0, 3).map((prediction) => (
              <PredictionCard
                key={prediction.roadName}
                prediction={prediction}
                onClick={() => navigate('/schedule')}
              />
            ))}
          </div>
        </div>
      )}

      {recentRecords.length > 0 && (
        <div>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-slate-800">最近记录</h2>
            <button
              onClick={() => navigate('/history')}
              className="text-sky-600 text-sm font-medium flex items-center gap-1 hover:gap-2 transition-all"
            >
              查看全部
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
          <div className="space-y-3">
            {recentRecords.slice(0, 3).map((record) => (
              <RecordCard
                key={record.id}
                record={record}
                showActions={false}
              />
            ))}
          </div>
        </div>
      )}

      {todayPredictions.length === 0 && recentRecords.length === 0 && (
        <Card>
          <CardContent className="text-center py-12">
            <div className="w-20 h-20 mx-auto rounded-full bg-sky-100 flex items-center justify-center mb-4">
              <Droplets className="w-10 h-10 text-sky-400" />
            </div>
            <h3 className="text-lg font-semibold text-slate-800 mb-2">还没有记录</h3>
            <p className="text-slate-500 text-sm mb-6">开始记录洒水车出没，积累数据后就能生成预测啦</p>
            <Button onClick={() => navigate('/record')} size="lg">
              <Plus className="w-5 h-5" />
              记录第一次
            </Button>
          </CardContent>
        </Card>
      )}

      {settings.reminderEnabled && upcomingReminders.length > 0 && (
        <div className="bg-gradient-to-r from-amber-50 to-orange-50 border border-amber-200 rounded-2xl p-4">
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-100 flex items-center justify-center flex-shrink-0">
              <Bell className="w-5 h-5 text-amber-600" />
            </div>
            <div className="flex-1">
              <p className="font-medium text-amber-800 mb-1">出行提醒</p>
              <p className="text-sm text-amber-700">
                未来 {settings.reminderMinutes * 2} 分钟内有 {upcomingReminders.length} 个路段可能遇到洒水车，注意避开！
              </p>
              <div className="flex flex-wrap gap-2 mt-3">
                {upcomingReminders.slice(0, 3).map((r, idx) => (
                  <span
                    key={idx}
                    className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-white text-xs font-medium text-amber-700"
                  >
                    {r.road} {r.time}
                    <span className={`${getConfidenceColor(r.confidence)}`}>
                      ({getConfidenceLabel(r.confidence)})
                    </span>
                  </span>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
