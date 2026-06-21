import { useMemo } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line, Area, AreaChart, Legend } from 'recharts';
import { TrendingUp, Droplets, AlertTriangle, MapPin, Calendar, BarChart3, FileText, RefreshCw } from 'lucide-react';
import {
  useStatistics,
  usePredictions,
  useRecords,
  useLatestWeeklyReport,
  useWeeklyReports,
  useGenerateWeeklyReport,
  useIsGeneratingReport,
} from '../store/useAppStore';
import { Card, CardContent, CardHeader, CardTitle } from '../components/Card';
import Heatmap from '../components/Heatmap';
import WeeklyReportCard from '../components/WeeklyReportCard';
import { getProbabilityBgLight } from '../utils/format';
import { cn } from '../lib/utils';

export default function Statistics() {
  const statistics = useStatistics();
  const predictions = usePredictions();
  const records = useRecords();
  const latestReport = useLatestWeeklyReport();
  const weeklyReports = useWeeklyReports();
  const generateWeeklyReport = useGenerateWeeklyReport();
  const isGeneratingReport = useIsGeneratingReport();

  const hourlyChartData = useMemo(() => {
    if (!statistics) return [];
    return statistics.recordsByHour.map((item) => ({
      hour: `${String(item.hour).padStart(2, '0')}`,
      记录数: item.count,
      被溅数: item.splashed,
    }));
  }, [statistics]);

  const monthlyChartData = useMemo(() => {
    if (!statistics) return [];
    return statistics.monthlyTrend.map((item) => ({
      date: item.date.slice(5),
      记录数: item.count,
    }));
  }, [statistics]);

  const topRoadsData = useMemo(() => {
    if (!statistics) return [];
    return statistics.topRoads.slice(0, 5).map((item) => ({
      road: item.road.length > 4 ? item.road.slice(0, 4) + '...' : item.road,
      fullRoad: item.road,
      记录数: item.count,
      溅水率: Math.round(item.splashRate * 100),
    }));
  }, [statistics]);

  if (!statistics) {
    return (
      <div className="p-4 flex items-center justify-center min-h-[60vh]">
        <div className="text-center">
          <div className="animate-spin w-8 h-8 border-4 border-sky-500 border-t-transparent rounded-full mx-auto mb-4" />
          <p className="text-slate-500">加载统计数据中...</p>
        </div>
      </div>
    );
  }

  const splashRatePercent = Math.round(statistics.splashRate * 100);
  const currentMonthRecords = statistics.monthlyTrend.filter(
    (d) => d.date.startsWith(new Date().toISOString().slice(0, 7))
  );
  const currentMonthCount = currentMonthRecords.reduce((sum, d) => sum + d.count, 0);

  const handleGenerateReport = () => {
    generateWeeklyReport();
  };

  return (
    <div className="p-4 space-y-6">
      <div className="pt-2">
        <h1 className="text-2xl font-bold text-slate-800 mb-1">统计分析</h1>
        <p className="text-slate-500 text-sm">洒水车出没规律深度分析</p>
      </div>

      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <FileText className="w-5 h-5 text-indigo-500" />
              洒水车周报
            </CardTitle>
            <button
              onClick={handleGenerateReport}
              disabled={isGeneratingReport}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-indigo-50 text-indigo-600 text-sm font-medium hover:bg-indigo-100 transition-colors disabled:opacity-50"
            >
              <RefreshCw className={cn('w-4 h-4', isGeneratingReport && 'animate-spin')} />
              {isGeneratingReport ? '生成中...' : latestReport ? '重新生成' : '生成本周周报'}
            </button>
          </div>
          {weeklyReports.length > 0 && (
            <p className="text-xs text-slate-400 mt-1">
              已生成 {weeklyReports.length} 份历史周报
            </p>
          )}
        </CardHeader>
        <CardContent>
          {latestReport ? (
            <WeeklyReportCard report={latestReport} />
          ) : (
            <div className="text-center py-8">
              <FileText className="w-12 h-12 text-slate-300 mx-auto mb-3" />
              <p className="text-slate-500 mb-2">还没有周报</p>
              <p className="text-sm text-slate-400 mb-4">
                {records.length === 0
                  ? '先记录一些洒水车出没记录吧'
                  : '点击上方按钮生成本周周报'}
              </p>
              <button
                onClick={handleGenerateReport}
                disabled={isGeneratingReport || records.length === 0}
                className={cn(
                  'px-5 py-2.5 rounded-xl text-sm font-medium transition-colors',
                  records.length === 0
                    ? 'bg-slate-100 text-slate-400 cursor-not-allowed'
                    : 'bg-gradient-to-r from-indigo-500 to-purple-500 text-white hover:opacity-90'
                )}
              >
                立即生成第一份周报
              </button>
            </div>
          )}
        </CardContent>
      </Card>

      <div className="grid grid-cols-2 gap-3">
        <Card gradient className="bg-gradient-to-br from-sky-500 to-blue-600">
          <CardContent className="py-5">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-xl bg-white/20 flex items-center justify-center">
                <BarChart3 className="w-6 h-6 text-white" />
              </div>
              <div>
                <p className="text-3xl font-bold text-white">{statistics.totalRecords}</p>
                <p className="text-sm text-sky-100">总记录数</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card gradient className="bg-gradient-to-br from-orange-500 to-red-500">
          <CardContent className="py-5">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-xl bg-white/20 flex items-center justify-center">
                <AlertTriangle className="w-6 h-6 text-white" />
              </div>
              <div>
                <p className="text-3xl font-bold text-white">{statistics.totalSplashed}</p>
                <p className="text-sm text-orange-100">被溅总次数</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card hover>
          <CardContent className="py-5">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-xl bg-amber-100 flex items-center justify-center">
                <Droplets className="w-6 h-6 text-amber-600" />
              </div>
              <div>
                <p className="text-3xl font-bold text-slate-800">{splashRatePercent}%</p>
                <p className="text-sm text-slate-500">整体溅水率</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card hover>
          <CardContent className="py-5">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-xl bg-emerald-100 flex items-center justify-center">
                <Calendar className="w-6 h-6 text-emerald-600" />
              </div>
              <div>
                <p className="text-3xl font-bold text-slate-800">{currentMonthCount}</p>
                <p className="text-sm text-slate-500">本月记录</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-sky-500" />
            24小时出没分布
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={hourlyChartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" vertical={false} />
                <XAxis
                  dataKey="hour"
                  tick={{ fontSize: 11, fill: '#64748b' }}
                  tickLine={false}
                  axisLine={{ stroke: '#e2e8f0' }}
                  interval={2}
                />
                <YAxis
                  tick={{ fontSize: 11, fill: '#64748b' }}
                  tickLine={false}
                  axisLine={false}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: 'white',
                    border: '1px solid #e2e8f0',
                    borderRadius: '12px',
                    boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)',
                  }}
                />
                <Bar dataKey="记录数" fill="#0ea5e9" radius={[6, 6, 0, 0]} />
                <Bar dataKey="被溅数" fill="#f97316" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="w-5 h-5 text-sky-500" />
            近30天趋势
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-48">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={monthlyChartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorRecords" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#0ea5e9" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#0ea5e9" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" vertical={false} />
                <XAxis
                  dataKey="date"
                  tick={{ fontSize: 10, fill: '#64748b' }}
                  tickLine={false}
                  axisLine={{ stroke: '#e2e8f0' }}
                  interval={4}
                />
                <YAxis
                  tick={{ fontSize: 11, fill: '#64748b' }}
                  tickLine={false}
                  axisLine={false}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: 'white',
                    border: '1px solid #e2e8f0',
                    borderRadius: '12px',
                    boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)',
                  }}
                />
                <Area
                  type="monotone"
                  dataKey="记录数"
                  stroke="#0ea5e9"
                  strokeWidth={2}
                  fillOpacity={1}
                  fill="url(#colorRecords)"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MapPin className="w-5 h-5 text-sky-500" />
            出没热力图
          </CardTitle>
          <p className="text-sm text-slate-500 mt-1">按星期和小时展示出没频率</p>
        </CardHeader>
        <CardContent>
          <Heatmap data={statistics.heatmapData} />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-sky-500" />
            高发路段排行
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {topRoadsData.map((item, idx) => (
            <div key={item.road} className="flex items-center gap-3">
              <div
                className={cn(
                  'w-8 h-8 rounded-lg flex items-center justify-center font-bold text-sm',
                  idx === 0
                    ? 'bg-amber-100 text-amber-700'
                    : idx === 1
                    ? 'bg-slate-100 text-slate-600'
                    : idx === 2
                    ? 'bg-orange-100 text-orange-700'
                    : 'bg-slate-50 text-slate-500'
                )}
              >
                {idx + 1}
              </div>
              <div className="flex-1">
                <div className="flex items-center justify-between mb-1">
                  <span className="font-medium text-slate-800" title={item.fullRoad}>
                    {item.fullRoad}
                  </span>
                  <span className="text-sm text-slate-500">{item.记录数} 次</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="flex-1 h-2 bg-slate-100 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-gradient-to-r from-sky-400 to-sky-600 rounded-full transition-all duration-500"
                      style={{ width: `${(item.记录数 / topRoadsData[0].记录数) * 100}%` }}
                    />
                  </div>
                  <span
                    className={cn(
                      'px-2 py-0.5 rounded text-xs font-medium',
                      getProbabilityBgLight(item.溅水率 / 100)
                    )}
                  >
                    溅水率 {item.溅水率}%
                  </span>
                </div>
              </div>
            </div>
          ))}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BarChart3 className="w-5 h-5 text-sky-500" />
            路段溅水率排名
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-48">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={topRoadsData}
                layout="vertical"
                margin={{ top: 5, right: 30, left: 60, bottom: 5 }}
              >
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" horizontal={true} vertical={false} />
                <XAxis
                  type="number"
                  domain={[0, 100]}
                  tick={{ fontSize: 11, fill: '#64748b' }}
                  tickLine={false}
                  axisLine={{ stroke: '#e2e8f0' }}
                  tickFormatter={(value) => `${value}%`}
                />
                <YAxis
                  dataKey="road"
                  type="category"
                  tick={{ fontSize: 11, fill: '#475569' }}
                  tickLine={false}
                  axisLine={false}
                  width={60}
                />
                <Tooltip
                  formatter={(value: number) => [`${value}%`, '溅水率']}
                  contentStyle={{
                    backgroundColor: 'white',
                    border: '1px solid #e2e8f0',
                    borderRadius: '12px',
                    boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)',
                  }}
                />
                <Bar
                  dataKey="溅水率"
                  fill="#f97316"
                  radius={[0, 6, 6, 0]}
                  label={{ fill: '#fff', fontSize: 11, position: 'insideRight', formatter: (v: number) => `${v}%` }}
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      <div className="text-center text-sm text-slate-400 py-4">
        <p>数据基于 {records.length} 条记录分析生成</p>
        <p className="mt-1">覆盖 {predictions.length} 个路段</p>
      </div>
    </div>
  );
}
