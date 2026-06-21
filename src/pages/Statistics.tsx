import { useMemo, useState, useEffect, useRef } from 'react';
import { useLocation } from 'react-router-dom';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Area,
  AreaChart,
} from 'recharts';
import {
  TrendingUp,
  Droplets,
  AlertTriangle,
  MapPin,
  Calendar,
  BarChart3,
  FileText,
  RefreshCw,
  Download,
  ChevronDown,
  X,
  Info,
  Table as TableIcon,
  Star,
  Layers,
} from 'lucide-react';
import {
  useStatistics,
  usePredictions,
  useRecords,
  useLatestWeeklyReport,
  useWeeklyReports,
  useGenerateWeeklyReport,
  useIsGeneratingReport,
  useExportRecordsCSV,
  useSettings,
} from '../store/useAppStore';
import { useScrollToSection, useClearNavigationParams } from '../store/useSearchStore';
import { Card, CardContent, CardHeader, CardTitle } from '../components/Card';
import Heatmap from '../components/Heatmap';
import WeeklyReportCard from '../components/WeeklyReportCard';
import { getProbabilityBgLight } from '../utils/format';
import { cn } from '../lib/utils';
import { downloadCSV, statisticsToCSV } from '../utils/csv';
import { generateStatistics } from '../utils/analysis';
import { ExportScope } from '../types';
import { Button } from '../components/Button';

type StatsScope = 'all' | 'favorites';

export default function Statistics() {
  const statistics = useStatistics();
  const predictions = usePredictions();
  const allRecords = useRecords();
  const latestReport = useLatestWeeklyReport();
  const weeklyReports = useWeeklyReports();
  const generateWeeklyReport = useGenerateWeeklyReport();
  const isGeneratingReport = useIsGeneratingReport();
  const exportRecordsCSV = useExportRecordsCSV();
  const settings = useSettings();
  const scrollToSection = useScrollToSection();
  const clearNavigationParams = useClearNavigationParams();
  const location = useLocation();

  const [dateStart, setDateStart] = useState('');
  const [dateEnd, setDateEnd] = useState('');
  const [showExportMenu, setShowExportMenu] = useState(false);
  const [showDateRangePicker, setShowDateRangePicker] = useState(false);
  const [pendingExportTarget, setPendingExportTarget] = useState<'records' | 'stats' | null>(null);
  const [statsScope, setStatsScope] = useState<StatsScope>('all');
  const [showComparison, setShowComparison] = useState(false);
  const [activeSection, setActiveSection] = useState<string | null>(null);

  const favoriteRoads = settings.favoriteRoads;
  const sectionRefs = useRef<Record<string, HTMLDivElement | null>>({});

  useEffect(() => {
    if (scrollToSection) {
      setActiveSection(scrollToSection);
      setTimeout(() => {
        const el = sectionRefs.current[scrollToSection];
        if (el) {
          el.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
        clearNavigationParams();
      }, 150);
      setTimeout(() => {
        setActiveSection(null);
      }, 3000);
    }
  }, [scrollToSection, clearNavigationParams, location.pathname]);

  const records = useMemo(() => {
    let result = allRecords;
    if (statsScope === 'favorites') {
      result = result.filter((r) => favoriteRoads.includes(r.road));
    }
    if (dateStart) {
      result = result.filter((r) => r.date >= dateStart);
    }
    if (dateEnd) {
      result = result.filter((r) => r.date <= dateEnd);
    }
    return result;
  }, [allRecords, dateStart, dateEnd, statsScope, favoriteRoads]);

  const favoriteRecords = useMemo(() => {
    let result = allRecords.filter((r) => favoriteRoads.includes(r.road));
    if (dateStart) {
      result = result.filter((r) => r.date >= dateStart);
    }
    if (dateEnd) {
      result = result.filter((r) => r.date <= dateEnd);
    }
    return result;
  }, [allRecords, dateStart, dateEnd, favoriteRoads]);

  const allScopedRecords = useMemo(() => {
    let result = allRecords;
    if (dateStart) {
      result = result.filter((r) => r.date >= dateStart);
    }
    if (dateEnd) {
      result = result.filter((r) => r.date <= dateEnd);
    }
    return result;
  }, [allRecords, dateStart, dateEnd]);

  const favoriteStats = useMemo(() => {
    if (favoriteRecords.length === 0) return null;
    const stats = generateStatistics(favoriteRecords);
    return {
      totalRecords: stats.totalRecords,
      totalSplashed: stats.totalSplashed,
      splashRate: stats.splashRate,
    };
  }, [favoriteRecords]);

  const allStats = useMemo(() => {
    if (allScopedRecords.length === 0) return null;
    const stats = generateStatistics(allScopedRecords);
    return {
      totalRecords: stats.totalRecords,
      totalSplashed: stats.totalSplashed,
      splashRate: stats.splashRate,
    };
  }, [allScopedRecords]);

  const filteredStatistics = useMemo(() => {
    if (!dateStart && !dateEnd) return statistics;
    return generateStatistics(records);
  }, [records, dateStart, dateEnd, statistics]);

  const hasActiveFilters = dateStart || dateEnd;

  const hourlyChartData = useMemo(() => {
    if (!filteredStatistics) return [];
    return filteredStatistics.recordsByHour.map((item) => ({
      hour: `${String(item.hour).padStart(2, '0')}`,
      记录数: item.count,
      被溅数: item.splashed,
    }));
  }, [filteredStatistics]);

  const monthlyChartData = useMemo(() => {
    if (!filteredStatistics) return [];
    return filteredStatistics.monthlyTrend.map((item) => ({
      date: item.date.slice(5),
      记录数: item.count,
    }));
  }, [filteredStatistics]);

  const topRoadsData = useMemo(() => {
    if (!filteredStatistics) return [];
    return filteredStatistics.topRoads.slice(0, 5).map((item) => ({
      road: item.road.length > 4 ? item.road.slice(0, 4) + '...' : item.road,
      fullRoad: item.road,
      记录数: item.count,
      溅水率: Math.round(item.splashRate * 100),
    }));
  }, [filteredStatistics]);

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

  if (!filteredStatistics) return null;

  const splashRatePercent = Math.round(filteredStatistics.splashRate * 100);
  const currentMonthRecords = filteredStatistics.monthlyTrend.filter(
    (d) => d.date.startsWith(new Date().toISOString().slice(0, 7))
  );
  const currentMonthCount = currentMonthRecords.reduce((sum, d) => sum + d.count, 0);

  const handleGenerateReport = () => {
    generateWeeklyReport();
  };

  const exportStatistics = (scope: ExportScope) => {
    if (scope === 'dateRange') {
      setPendingExportTarget('stats');
      setShowDateRangePicker(true);
      setShowExportMenu(false);
      return;
    }

    let targetStats = filteredStatistics;
    let suffix = '';

    if (scope === 'all') {
      targetStats = statistics!;
      suffix = '-all';
    } else if (scope === 'filtered') {
      suffix = hasActiveFilters ? '-filtered' : '-current';
    }

    const csvContent = statisticsToCSV(
      {
        totalRecords: targetStats.totalRecords,
        totalSplashed: targetStats.totalSplashed,
        splashRate: targetStats.splashRate,
      },
      targetStats.recordsByDay,
      targetStats.recordsByHour,
      targetStats.topRoads
    );

    const filename = `sprinkler-stats-${new Date().toISOString().slice(0, 10)}${suffix}.csv`;
    downloadCSV(csvContent, filename);
    setShowExportMenu(false);
  };

  const exportRecords = (scope: ExportScope) => {
    if (scope === 'dateRange') {
      setPendingExportTarget('records');
      setShowDateRangePicker(true);
      setShowExportMenu(false);
      return;
    }

    let content = '';
    let suffix = '';

    if (scope === 'all') {
      content = exportRecordsCSV({ scope: 'all' });
      suffix = '-all';
    } else {
      content = exportRecordsCSV({
        scope: 'filtered',
        filteredIds: records.map((r) => r.id),
      });
      suffix = hasActiveFilters ? '-filtered' : '-current';
    }

    const filename = `sprinkler-records-${new Date().toISOString().slice(0, 10)}${suffix}.csv`;
    downloadCSV(content, filename);
    setShowExportMenu(false);
  };

  const confirmDateRangeExport = () => {
    if (!dateStart || !dateEnd) return;

    const rangeRecords = allRecords.filter(
      (r) => r.date >= dateStart && r.date <= dateEnd
    );

    if (pendingExportTarget === 'stats') {
      const rangeStats = generateStatistics(rangeRecords);
      const csvContent = statisticsToCSV(
        {
          totalRecords: rangeStats.totalRecords,
          totalSplashed: rangeStats.totalSplashed,
          splashRate: rangeStats.splashRate,
        },
        rangeStats.recordsByDay,
        rangeStats.recordsByHour,
        rangeStats.topRoads
      );
      const filename = `sprinkler-stats-${dateStart}_to_${dateEnd}.csv`;
      downloadCSV(csvContent, filename);
    } else if (pendingExportTarget === 'records') {
      const content = exportRecordsCSV({
        scope: 'dateRange',
        dateRange: { start: dateStart, end: dateEnd },
      });
      const filename = `sprinkler-records-${dateStart}_to_${dateEnd}.csv`;
      downloadCSV(content, filename);
    }

    setShowDateRangePicker(false);
    setPendingExportTarget(null);
  };

  return (
    <div className="p-4 space-y-6">
      <div className="pt-2 flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-800 mb-1">统计分析</h1>
          <p className="text-slate-500 text-sm">洒水车出没规律深度分析</p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowComparison(!showComparison)}
            className={cn(
              'flex items-center gap-2 px-3 py-2.5 rounded-xl border transition-colors',
              showComparison
                ? 'border-amber-400 bg-amber-50 text-amber-700'
                : 'border-slate-200 bg-white hover:bg-slate-50 text-slate-600'
            )}
          >
            <Layers className="w-4 h-4" />
            <span className="text-sm font-medium">对比</span>
          </button>
          <div className="relative">
          <button
            onClick={() => setShowExportMenu(!showExportMenu)}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 transition-colors text-slate-600"
          >
            <Download className="w-5 h-5" />
            <span className="text-sm font-medium">导出</span>
            <ChevronDown className="w-4 h-4 opacity-60" />
          </button>
          {showExportMenu && (
            <div className="absolute right-0 top-full mt-2 bg-white rounded-xl shadow-lg border border-slate-100 overflow-hidden z-30 min-w-[240px]">
              <div className="px-4 py-2 text-xs font-medium text-slate-400 border-b border-slate-50 bg-slate-50/50">
                导出统计报告
              </div>
              <button
                onClick={() => exportStatistics('all')}
                className="w-full px-4 py-3 text-left text-sm transition-colors hover:bg-slate-50 text-slate-700 flex items-start gap-3"
              >
                <BarChart3 className="w-4 h-4 mt-0.5 text-indigo-500 flex-shrink-0" />
                <div>
                  <div className="font-medium">全部数据统计</div>
                  <div className="text-xs text-slate-400 mt-0.5">
                    含全部 {allRecords.length} 条记录分析
                  </div>
                </div>
              </button>
              <button
                onClick={() => exportStatistics('filtered')}
                className="w-full px-4 py-3 text-left text-sm transition-colors border-t border-slate-50 hover:bg-slate-50 text-slate-700 flex items-start gap-3"
              >
                <BarChart3 className="w-4 h-4 mt-0.5 text-sky-500 flex-shrink-0" />
                <div>
                  <div className="font-medium">当前筛选范围统计</div>
                  <div className="text-xs text-slate-400 mt-0.5">
                    含 {records.length} 条记录分析
                    {!hasActiveFilters && ' (即全部)'}
                  </div>
                </div>
              </button>
              <button
                onClick={() => exportStatistics('dateRange')}
                className="w-full px-4 py-3 text-left text-sm transition-colors border-t border-slate-50 hover:bg-slate-50 text-slate-700 flex items-start gap-3"
              >
                <Calendar className="w-4 h-4 mt-0.5 text-purple-500 flex-shrink-0" />
                <div>
                  <div className="font-medium">指定日期范围统计...</div>
                  <div className="text-xs text-slate-400 mt-0.5">自定义开始和结束日期</div>
                </div>
              </button>

              <div className="px-4 py-2 text-xs font-medium text-slate-400 border-t border-slate-100 bg-slate-50/50">
                导出记录明细
              </div>
              <button
                onClick={() => exportRecords('all')}
                className="w-full px-4 py-3 text-left text-sm transition-colors hover:bg-slate-50 text-slate-700 flex items-start gap-3"
              >
                <TableIcon className="w-4 h-4 mt-0.5 text-emerald-500 flex-shrink-0" />
                <div>
                  <div className="font-medium">全部记录 (CSV)</div>
                  <div className="text-xs text-slate-400 mt-0.5">共 {allRecords.length} 条</div>
                </div>
              </button>
              <button
                onClick={() => exportRecords('filtered')}
                className="w-full px-4 py-3 text-left text-sm transition-colors border-t border-slate-50 hover:bg-slate-50 text-slate-700 flex items-start gap-3"
              >
                <TableIcon className="w-4 h-4 mt-0.5 text-teal-500 flex-shrink-0" />
                <div>
                  <div className="font-medium">当前范围记录 (CSV)</div>
                  <div className="text-xs text-slate-400 mt-0.5">
                    共 {records.length} 条
                    {!hasActiveFilters && ' (即全部)'}
                  </div>
                </div>
              </button>
              <button
                onClick={() => exportRecords('dateRange')}
                className="w-full px-4 py-3 text-left text-sm transition-colors border-t border-slate-50 hover:bg-slate-50 text-slate-700 flex items-start gap-3"
              >
                <Calendar className="w-4 h-4 mt-0.5 text-amber-500 flex-shrink-0" />
                <div>
                  <div className="font-medium">指定日期范围记录...</div>
                  <div className="text-xs text-slate-400 mt-0.5">自定义日期导出记录</div>
                </div>
              </button>
            </div>
          )}
        </div>
        </div>
      </div>

      <Card className="bg-sky-50/50 border-sky-100">
        <CardContent className="py-3 space-y-3">
          <div className="flex items-center gap-3 flex-wrap">
            <div className="flex items-center gap-2 text-sm">
              <Calendar className="w-4 h-4 text-sky-500" />
              <span className="font-medium text-slate-700">统计范围:</span>
            </div>
            <div className="flex items-center gap-2">
              <input
                type="date"
                value={dateStart}
                onChange={(e) => setDateStart(e.target.value)}
                className="px-3 py-1.5 rounded-lg border border-slate-200 bg-white focus:border-sky-500 focus:ring-2 focus:ring-sky-500/20 outline-none text-sm text-slate-700"
              />
              <span className="text-slate-400">至</span>
              <input
                type="date"
                value={dateEnd}
                onChange={(e) => setDateEnd(e.target.value)}
                className="px-3 py-1.5 rounded-lg border border-slate-200 bg-white focus:border-sky-500 focus:ring-2 focus:ring-sky-500/20 outline-none text-sm text-slate-700"
              />
            </div>
            {(dateStart || dateEnd) && (
              <button
                onClick={() => {
                  setDateStart('');
                  setDateEnd('');
                }}
                className="text-xs text-slate-500 hover:text-slate-700 flex items-center gap-1"
              >
                <X className="w-3 h-3" />
                重置为全部
              </button>
            )}
            <div className="ml-auto flex items-center gap-2 text-xs text-slate-600">
              <Info className="w-3.5 h-3.5 text-sky-500" />
              基于 <span className="font-semibold text-slate-800">{records.length}</span> 条记录分析
              {hasActiveFilters && (
                <span className="text-slate-400">
                  (共 {allRecords.length} 条)
                </span>
              )}
            </div>
          </div>

          <div className="border-t border-sky-100 pt-3">
            <div className="flex items-center gap-2 flex-wrap">
              <div className="flex items-center gap-2 text-sm">
                <Star className="w-4 h-4 text-amber-500" />
                <span className="font-medium text-slate-700">路段范围:</span>
              </div>
              <div className="flex bg-white rounded-xl p-1 shadow-sm border border-slate-200">
                <button
                  onClick={() => setStatsScope('all')}
                  className={cn(
                    'flex items-center gap-1.5 px-4 py-1.5 rounded-lg text-sm font-medium transition-all',
                    statsScope === 'all'
                      ? 'bg-sky-500 text-white shadow-sm'
                      : 'text-slate-600 hover:bg-slate-50'
                  )}
                >
                  <Layers className="w-4 h-4" />
                  全部路段
                </button>
                <button
                  onClick={() => setStatsScope('favorites')}
                  disabled={favoriteRoads.length === 0}
                  className={cn(
                    'flex items-center gap-1.5 px-4 py-1.5 rounded-lg text-sm font-medium transition-all',
                    statsScope === 'favorites'
                      ? 'bg-amber-500 text-white shadow-sm'
                      : favoriteRoads.length === 0
                      ? 'text-slate-300 cursor-not-allowed'
                      : 'text-slate-600 hover:bg-slate-50'
                  )}
                >
                  <Star className={cn('w-4 h-4', statsScope === 'favorites' && 'fill-white')} />
                  收藏路段 ({favoriteRoads.length})
                </button>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {showComparison && favoriteStats && allStats && (
        <Card className="border-2 border-amber-200 bg-gradient-to-br from-amber-50/50 to-sky-50/30">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2">
                <Layers className="w-5 h-5 text-amber-500" />
                收藏路段 vs 全部路段 对比
              </CardTitle>
              <button
                onClick={() => setShowComparison(false)}
                className="text-slate-400 hover:text-slate-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-3 gap-4">
              <div className="text-center p-4 bg-white/80 rounded-xl border border-slate-100">
                <p className="text-xs text-slate-500 mb-2">指标</p>
              </div>
              <div className="text-center p-4 bg-amber-50 rounded-xl border border-amber-200">
                <div className="flex items-center justify-center gap-1 mb-2">
                  <Star className="w-4 h-4 text-amber-500 fill-amber-500" />
                  <p className="text-xs font-medium text-amber-700">收藏路段</p>
                </div>
                <p className="text-xs text-slate-400">{favoriteRoads.length} 条路段</p>
              </div>
              <div className="text-center p-4 bg-sky-50 rounded-xl border border-sky-200">
                <div className="flex items-center justify-center gap-1 mb-2">
                  <Layers className="w-4 h-4 text-sky-500" />
                  <p className="text-xs font-medium text-sky-700">全部路段</p>
                </div>
                <p className="text-xs text-slate-400">{predictions.length} 条路段</p>
              </div>

              <div className="flex items-center justify-center p-4 bg-white/80 rounded-xl border border-slate-100">
                <p className="text-sm font-medium text-slate-700">总记录数</p>
              </div>
              <div className="text-center p-4 bg-white rounded-xl border border-amber-100">
                <p className="text-2xl font-bold text-amber-600">{favoriteStats.totalRecords}</p>
              </div>
              <div className="text-center p-4 bg-white rounded-xl border border-sky-100">
                <p className="text-2xl font-bold text-sky-600">{allStats.totalRecords}</p>
              </div>

              <div className="flex items-center justify-center p-4 bg-white/80 rounded-xl border border-slate-100">
                <p className="text-sm font-medium text-slate-700">被溅次数</p>
              </div>
              <div className="text-center p-4 bg-white rounded-xl border border-amber-100">
                <p className="text-2xl font-bold text-orange-600">{favoriteStats.totalSplashed}</p>
              </div>
              <div className="text-center p-4 bg-white rounded-xl border border-sky-100">
                <p className="text-2xl font-bold text-orange-600">{allStats.totalSplashed}</p>
              </div>

              <div className="flex items-center justify-center p-4 bg-white/80 rounded-xl border border-slate-100">
                <p className="text-sm font-medium text-slate-700">溅水率</p>
              </div>
              <div className="text-center p-4 bg-white rounded-xl border border-amber-100">
                <p className="text-2xl font-bold text-amber-600">{Math.round(favoriteStats.splashRate * 100)}%</p>
                {favoriteStats.splashRate !== allStats.splashRate && (
                  <p className={cn(
                    'text-xs mt-1 font-medium',
                    favoriteStats.splashRate > allStats.splashRate ? 'text-red-500' : 'text-emerald-500'
                  )}>
                    {favoriteStats.splashRate > allStats.splashRate ? '↑' : '↓'} 
                    {Math.abs(Math.round((favoriteStats.splashRate - allStats.splashRate) * 100))}%
                  </p>
                )}
              </div>
              <div className="text-center p-4 bg-white rounded-xl border border-sky-100">
                <p className="text-2xl font-bold text-sky-600">{Math.round(allStats.splashRate * 100)}%</p>
              </div>

              <div className="flex items-center justify-center p-4 bg-white/80 rounded-xl border border-slate-100">
                <p className="text-sm font-medium text-slate-700">平均记录/路段</p>
              </div>
              <div className="text-center p-4 bg-white rounded-xl border border-amber-100">
                <p className="text-2xl font-bold text-amber-600">
                  {favoriteRoads.length > 0 ? Math.round(favoriteStats.totalRecords / favoriteRoads.length) : 0}
                </p>
              </div>
              <div className="text-center p-4 bg-white rounded-xl border border-sky-100">
                <p className="text-2xl font-bold text-sky-600">
                  {predictions.length > 0 ? Math.round(allStats.totalRecords / predictions.length) : 0}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

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

      <div
        className="grid grid-cols-2 gap-3"
        ref={(el) => (sectionRefs.current['overview'] = el)}
      >
        <Card
          gradient
          className={cn(
            'bg-gradient-to-br from-sky-500 to-blue-600 transition-all duration-500',
            activeSection === 'overview' &&
              'ring-4 ring-purple-400 ring-offset-2 ring-offset-purple-50 shadow-lg shadow-purple-200/50 animate-pulse'
          )}
        >
          <CardContent className="py-5">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-xl bg-white/20 flex items-center justify-center">
                <BarChart3 className="w-6 h-6 text-white" />
              </div>
              <div>
                <p className="text-3xl font-bold text-white">{filteredStatistics.totalRecords}</p>
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
                <p className="text-3xl font-bold text-white">{filteredStatistics.totalSplashed}</p>
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
                <p className="text-sm text-slate-500">
                  {hasActiveFilters ? '范围内当月' : '本月记录'}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card
        ref={(el) => (sectionRefs.current['hourly'] = el)}
        className={cn(
          'transition-all duration-500',
          activeSection === 'hourly' &&
            'ring-4 ring-purple-400 ring-offset-2 ring-offset-purple-50 shadow-lg shadow-purple-200/50 animate-pulse'
        )}
      >
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-sky-500" />
            24小时出没分布
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={hourlyChartData}
                margin={{ top: 10, right: 10, left: -20, bottom: 0 }}
              >
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

      <Card
        ref={(el) => (sectionRefs.current['monthly'] = el)}
        className={cn(
          'transition-all duration-500',
          activeSection === 'monthly' &&
            'ring-4 ring-purple-400 ring-offset-2 ring-offset-purple-50 shadow-lg shadow-purple-200/50 animate-pulse'
        )}
      >
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="w-5 h-5 text-sky-500" />
            近30天趋势
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-48">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart
                data={monthlyChartData}
                margin={{ top: 10, right: 10, left: -20, bottom: 0 }}
              >
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

      <Card
        ref={(el) => (sectionRefs.current['heatmap'] = el)}
        className={cn(
          'transition-all duration-500',
          activeSection === 'heatmap' &&
            'ring-4 ring-purple-400 ring-offset-2 ring-offset-purple-50 shadow-lg shadow-purple-200/50 animate-pulse'
        )}
      >
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MapPin className="w-5 h-5 text-sky-500" />
            出没热力图
          </CardTitle>
          <p className="text-sm text-slate-500 mt-1">按星期和小时展示出没频率</p>
        </CardHeader>
        <CardContent>
          <Heatmap data={filteredStatistics.heatmapData} />
        </CardContent>
      </Card>

      <Card
        ref={(el) => (sectionRefs.current['topRoads'] = el)}
        className={cn(
          'transition-all duration-500',
          activeSection === 'topRoads' &&
            'ring-4 ring-purple-400 ring-offset-2 ring-offset-purple-50 shadow-lg shadow-purple-200/50 animate-pulse'
        )}
      >
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
                      style={{ width: `${(item.记录数 / (topRoadsData[0]?.记录数 || 1)) * 100}%` }}
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

      <Card
        ref={(el) => (sectionRefs.current['splashRate'] = el)}
        className={cn(
          'transition-all duration-500',
          activeSection === 'splashRate' &&
            'ring-4 ring-purple-400 ring-offset-2 ring-offset-purple-50 shadow-lg shadow-purple-200/50 animate-pulse'
        )}
      >
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
                <CartesianGrid
                  strokeDasharray="3 3"
                  stroke="#e2e8f0"
                  horizontal={true}
                  vertical={false}
                />
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
                  label={{
                    fill: '#fff',
                    fontSize: 11,
                    position: 'insideRight',
                    formatter: (v: number) => `${v}%`,
                  }}
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

      {showDateRangePicker && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <Card className="w-full max-w-md">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center gap-2">
                  <Calendar className="w-5 h-5 text-sky-500" />
                  选择日期范围
                </CardTitle>
                <button
                  onClick={() => {
                    setShowDateRangePicker(false);
                    setPendingExportTarget(null);
                  }}
                  className="text-slate-400 hover:text-slate-600"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <label className="block text-sm font-medium text-slate-700">开始日期</label>
                <input
                  type="date"
                  value={dateStart}
                  onChange={(e) => setDateStart(e.target.value)}
                  className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:border-sky-500 focus:ring-2 focus:ring-sky-500/20 outline-none"
                />
              </div>
              <div className="space-y-2">
                <label className="block text-sm font-medium text-slate-700">结束日期</label>
                <input
                  type="date"
                  value={dateEnd}
                  onChange={(e) => setDateEnd(e.target.value)}
                  className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:border-sky-500 focus:ring-2 focus:ring-sky-500/20 outline-none"
                />
              </div>
              {dateStart && dateEnd && (
                <div className="text-sm text-slate-500 bg-sky-50 rounded-lg p-3">
                  范围内共有{' '}
                  <span className="font-semibold text-sky-700">
                    {allRecords.filter((r) => r.date >= dateStart && r.date <= dateEnd).length}
                  </span>{' '}
                  条记录
                </div>
              )}
              <div className="bg-slate-50 rounded-lg p-3 text-xs text-slate-500">
                将导出:{' '}
                <span className="font-medium text-slate-700">
                  {pendingExportTarget === 'stats' ? '统计分析报告' : '记录明细 CSV'}
                </span>
              </div>
              <div className="flex items-center justify-end gap-2 pt-2">
                <Button
                  variant="ghost"
                  onClick={() => {
                    setShowDateRangePicker(false);
                    setPendingExportTarget(null);
                  }}
                >
                  取消
                </Button>
                <Button
                  onClick={confirmDateRangeExport}
                  disabled={!dateStart || !dateEnd}
                >
                  确认导出
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
