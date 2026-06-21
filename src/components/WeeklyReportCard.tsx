import { useState } from 'react';
import {
  TrendingUp,
  TrendingDown,
  Minus,
  AlertTriangle,
  BarChart3,
  Calendar,
  Droplets,
  ChevronDown,
  ChevronUp,
  FileText,
  Zap,
} from 'lucide-react';
import { WeeklyReport } from '../types';
import { Card, CardContent, CardHeader, CardTitle } from './Card';
import { cn } from '../lib/utils';
import { getProbabilityBgLight } from '../utils/format';

interface WeeklyReportCardProps {
  report: WeeklyReport;
  compact?: boolean;
  onViewDetail?: () => void;
}

const TrendIcon = ({ trend }: { trend: 'up' | 'down' | 'stable' }) => {
  if (trend === 'up') {
    return <TrendingUp className="w-4 h-4 text-red-500" />;
  }
  if (trend === 'down') {
    return <TrendingDown className="w-4 h-4 text-emerald-500" />;
  }
  return <Minus className="w-4 h-4 text-slate-400" />;
};

const trendText = (trend: 'up' | 'down' | 'stable', changeRate: number) => {
  if (trend === 'stable') return '持平';
  const prefix = trend === 'up' ? '上升' : '下降';
  return `${prefix} ${Math.abs(changeRate)}%`;
};

const getRiskColor = (level: 'high' | 'medium' | 'low') => {
  switch (level) {
    case 'high':
      return {
        bg: 'bg-red-50',
        border: 'border-red-200',
        text: 'text-red-700',
        badge: 'bg-red-100 text-red-700',
      };
    case 'medium':
      return {
        bg: 'bg-amber-50',
        border: 'border-amber-200',
        text: 'text-amber-700',
        badge: 'bg-amber-100 text-amber-700',
      };
    default:
      return {
        bg: 'bg-sky-50',
        border: 'border-sky-200',
        text: 'text-sky-700',
        badge: 'bg-sky-100 text-sky-700',
      };
  }
};

const riskText = (level: 'high' | 'medium' | 'low') => {
  switch (level) {
    case 'high':
      return '高风险';
    case 'medium':
      return '中风险';
    default:
      return '低风险';
  }
};

export default function WeeklyReportCard({
  report,
  compact = false,
  onViewDetail,
}: WeeklyReportCardProps) {
  const [expanded, setExpanded] = useState(!compact);

  const splashRatePercent = Math.round(report.overallSplashRate * 100);
  const prevSplashRatePercent = Math.round(report.prevOverallSplashRate * 100);

  if (compact) {
    return (
      <Card className="bg-gradient-to-br from-indigo-500 via-purple-500 to-pink-500 text-white border-0 overflow-hidden">
        <CardContent className="py-4">
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-2">
                <FileText className="w-5 h-5 text-white/80" />
                <span className="text-sm text-white/80">
                  第 {report.weekNumber} 周周报
                </span>
              </div>
              <p className="text-xs text-white/70 mb-3">
                {report.weekStart} ~ {report.weekEnd}
              </p>
              <div className="flex items-center gap-4">
                <div>
                  <p className="text-2xl font-bold">{report.totalSplashed}</p>
                  <p className="text-xs text-white/70">本周被溅</p>
                </div>
                <div className="w-px h-10 bg-white/20" />
                <div>
                  <p className="text-2xl font-bold">{splashRatePercent}%</p>
                  <p className="text-xs text-white/70">溅水率</p>
                </div>
                <div className="w-px h-10 bg-white/20" />
                <div className="flex items-center gap-1">
                  <TrendIcon trend={report.overallTrend} />
                  <span className="text-sm">
                    {trendText(report.overallTrend, report.overallChange)}
                  </span>
                </div>
              </div>
              {report.highRiskPeriods.length > 0 && (
                <div className="mt-3 pt-3 border-t border-white/20">
                  <div className="flex items-center gap-2 text-sm">
                    <Zap className="w-4 h-4 text-yellow-300" />
                    <span className="text-white/90">
                      下周 {report.highRiskPeriods.length} 个高风险时段预警
                    </span>
                  </div>
                </div>
              )}
            </div>
            {onViewDetail && (
              <button
                onClick={onViewDetail}
                className="px-4 py-2 bg-white/20 hover:bg-white/30 rounded-xl text-sm font-medium transition-colors"
              >
                查看详情
              </button>
            )}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="overflow-hidden">
      <CardHeader className="bg-gradient-to-r from-indigo-50 via-purple-50 to-pink-50 border-b-0">
        <div className="flex items-start justify-between">
          <div>
            <CardTitle className="flex items-center gap-2 text-indigo-900">
              <FileText className="w-5 h-5 text-indigo-500" />
              洒水车出没周报
              <span className="text-sm font-normal text-indigo-400 ml-1">
                第 {report.weekNumber} 周
              </span>
            </CardTitle>
            <div className="flex items-center gap-2 mt-1 text-sm text-indigo-500">
              <Calendar className="w-4 h-4" />
              {report.weekStart} ~ {report.weekEnd}
            </div>
          </div>
          <button
            onClick={() => setExpanded(!expanded)}
            className="p-2 rounded-lg hover:bg-white/60 transition-colors text-indigo-500"
          >
            {expanded ? (
              <ChevronUp className="w-5 h-5" />
            ) : (
              <ChevronDown className="w-5 h-5" />
            )}
          </button>
        </div>
      </CardHeader>

      <CardContent className="space-y-5">
        <div className="grid grid-cols-4 gap-3">
          <div className="text-center p-3 rounded-xl bg-slate-50">
            <BarChart3 className="w-5 h-5 text-slate-400 mx-auto mb-1" />
            <p className="text-xl font-bold text-slate-800">{report.totalRecords}</p>
            <p className="text-xs text-slate-500">总记录</p>
          </div>
          <div className="text-center p-3 rounded-xl bg-orange-50">
            <AlertTriangle className="w-5 h-5 text-orange-400 mx-auto mb-1" />
            <p className="text-xl font-bold text-orange-700">{report.totalSplashed}</p>
            <p className="text-xs text-orange-500">被溅次数</p>
          </div>
          <div className="text-center p-3 rounded-xl bg-sky-50">
            <Droplets className="w-5 h-5 text-sky-400 mx-auto mb-1" />
            <p className="text-xl font-bold text-sky-700">{splashRatePercent}%</p>
            <p className="text-xs text-sky-500">溅水率</p>
            <p className="text-[10px] text-slate-400 mt-0.5">
              上周 {prevSplashRatePercent}%
            </p>
          </div>
          <div className="text-center p-3 rounded-xl bg-purple-50">
            <TrendIcon
              trend={report.overallTrend}
            />
            <p
              className={cn(
                'text-xl font-bold mt-1',
                report.overallTrend === 'up'
                  ? 'text-red-600'
                  : report.overallTrend === 'down'
                  ? 'text-emerald-600'
                  : 'text-slate-600'
              )}
            >
              {report.overallTrend === 'stable'
                ? '—'
                : `${report.overallTrend === 'up' ? '+' : ''}${report.overallChange}%`}
            </p>
            <p className="text-xs text-purple-500">环比变化</p>
          </div>
        </div>

        {expanded && (
          <>
            {report.topSplashRoads.length > 0 && (
              <div>
                <h4 className="text-sm font-semibold text-slate-700 mb-3 flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 text-orange-500" />
                  溅水率最高路段
                </h4>
                <div className="space-y-2">
                  {report.topSplashRoads.map((road) => (
                    <div
                      key={road.road}
                      className="flex items-center gap-3 p-3 rounded-xl bg-slate-50"
                    >
                      <div className="flex-1">
                        <div className="flex items-center justify-between mb-1">
                          <span className="font-medium text-slate-800">
                            {road.road}
                          </span>
                          <div className="flex items-center gap-2">
                            <span className="text-sm text-slate-500">
                              {road.recordCount}次 · {road.splashCount}溅
                            </span>
                            <span
                              className={cn(
                                'inline-flex items-center gap-1 text-xs',
                                road.trend === 'up'
                                  ? 'text-red-500'
                                  : road.trend === 'down'
                                  ? 'text-emerald-500'
                                  : 'text-slate-400'
                              )}
                            >
                              <TrendIcon trend={road.trend} />
                              {trendText(road.trend, road.changeRate)}
                            </span>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <div className="flex-1 h-2 bg-white rounded-full overflow-hidden">
                            <div
                              className="h-full bg-gradient-to-r from-orange-400 to-red-500 rounded-full"
                              style={{
                                width: `${Math.round(road.splashRate * 100)}%`,
                              }}
                            />
                          </div>
                          <span
                            className={cn(
                              'px-2 py-0.5 rounded text-xs font-medium',
                              getProbabilityBgLight(road.splashRate)
                            )}
                          >
                            {Math.round(road.splashRate * 100)}%
                          </span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {report.highRiskPeriods.length > 0 && (
              <div>
                <h4 className="text-sm font-semibold text-slate-700 mb-3 flex items-center gap-2">
                  <Zap className="w-4 h-4 text-yellow-500" />
                  下周高风险时段预警
                </h4>
                <div className="grid grid-cols-2 gap-2">
                  {report.highRiskPeriods.slice(0, 6).map((period, idx) => {
                    const colors = getRiskColor(period.riskLevel);
                    return (
                      <div
                        key={idx}
                        className={cn(
                          'p-3 rounded-xl border',
                          colors.bg,
                          colors.border
                        )}
                      >
                        <div className="flex items-center justify-between mb-1">
                          <span className={cn('text-sm font-medium', colors.text)}>
                            {period.dayName}
                          </span>
                          <span
                            className={cn(
                              'px-2 py-0.5 rounded-full text-xs font-medium',
                              colors.badge
                            )}
                          >
                            {riskText(period.riskLevel)}
                          </span>
                        </div>
                        <p className={cn('text-lg font-bold', colors.text)}>
                          {period.hourRange}
                        </p>
                        <p className="text-xs text-slate-500 mt-0.5">
                          {period.recordCount}次记录 · 溅水率{' '}
                          {Math.round(period.splashRate * 100)}%
                        </p>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {report.dailySummary.length > 0 && (
              <div>
                <h4 className="text-sm font-semibold text-slate-700 mb-3 flex items-center gap-2">
                  <Calendar className="w-4 h-4 text-sky-500" />
                  每日统计
                </h4>
                <div className="grid grid-cols-7 gap-1">
                  {report.dailySummary.map((day) => (
                    <div
                      key={day.date}
                      className={cn(
                        'text-center p-2 rounded-lg',
                        day.recordCount > 0 ? 'bg-slate-50' : 'bg-slate-50/50'
                      )}
                    >
                      <p className="text-xs text-slate-500 mb-1">{day.dayName}</p>
                      <p className="text-sm font-bold text-slate-800">
                        {day.recordCount}
                      </p>
                      <p className="text-[10px] text-orange-500">
                        {day.splashCount}溅
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {report.mostImprovedRoads.length > 0 &&
              report.mostImprovedRoads.some((r) => r.trend === 'down') && (
                <div>
                  <h4 className="text-sm font-semibold text-slate-700 mb-3 flex items-center gap-2">
                    <TrendingDown className="w-4 h-4 text-emerald-500" />
                    改善明显路段
                  </h4>
                  <div className="space-y-2">
                    {report.mostImprovedRoads
                      .filter((r) => r.trend === 'down')
                      .slice(0, 3)
                      .map((road) => (
                        <div
                          key={road.road}
                          className="flex items-center justify-between p-3 rounded-xl bg-emerald-50"
                        >
                          <span className="font-medium text-emerald-800">
                            {road.road}
                          </span>
                          <div className="flex items-center gap-2">
                            <span className="text-sm text-emerald-600">
                              {Math.round(road.prevSplashRate * 100)}% →{' '}
                              {Math.round(road.splashRate * 100)}%
                            </span>
                            <span className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-700 text-xs font-medium">
                              <TrendingDown className="w-3 h-3" />
                              {Math.abs(road.changeRate)}%
                            </span>
                          </div>
                        </div>
                      ))}
                  </div>
                </div>
              )}
          </>
        )}
      </CardContent>
    </Card>
  );
}
