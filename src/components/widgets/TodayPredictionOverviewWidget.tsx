import { useMemo } from 'react';
import { Calendar, MapPin, ChevronRight } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '../Card';
import { useTodayPredictions } from '../../hooks/usePredictions';
import { getConfidenceLabel, getConfidenceColor } from '../../utils/format';

export default function TodayPredictionOverviewWidget() {
  const todayPredictions = useTodayPredictions();
  const navigate = useNavigate();

  const stats = useMemo(() => {
    const totalRoads = todayPredictions.length;
    const totalTimes = todayPredictions.reduce(
      (sum, p) => sum + p.predictedTimes.length,
      0
    );
    const highRiskRoads = todayPredictions.filter(
      (p) => p.splashProbability >= 0.5
    ).length;

    const nextPrediction = todayPredictions.length > 0 ? todayPredictions[0] : null;

    return { totalRoads, totalTimes, highRiskRoads, nextPrediction };
  }, [todayPredictions]);

  if (todayPredictions.length === 0) {
    return (
      <Card>
        <CardHeader className="pb-2">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-indigo-500 flex items-center justify-center">
              <Calendar className="w-4 h-4 text-white" />
            </div>
            <CardTitle className="text-sm">今日预测概览</CardTitle>
          </div>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-slate-500 text-center py-4">今日暂无预测</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-indigo-500 flex items-center justify-center">
              <Calendar className="w-4 h-4 text-white" />
            </div>
            <CardTitle className="text-sm">今日预测概览</CardTitle>
          </div>
          <button
            onClick={() => navigate('/schedule')}
            className="text-xs text-slate-500 hover:text-slate-700 flex items-center gap-0.5"
          >
            全部
            <ChevronRight className="w-3 h-3" />
          </button>
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="grid grid-cols-3 gap-2">
          <div className="text-center p-2 bg-slate-50 rounded-lg">
            <p className="text-xl font-bold text-slate-800">{stats.totalRoads}</p>
            <p className="text-xs text-slate-500">涉及路段</p>
          </div>
          <div className="text-center p-2 bg-slate-50 rounded-lg">
            <p className="text-xl font-bold text-slate-800">{stats.totalTimes}</p>
            <p className="text-xs text-slate-500">出没次数</p>
          </div>
          <div className="text-center p-2 bg-slate-50 rounded-lg">
            <p className="text-xl font-bold text-amber-600">{stats.highRiskRoads}</p>
            <p className="text-xs text-slate-500">高风险路段</p>
          </div>
        </div>

        {stats.nextPrediction && (
          <div className="p-3 bg-gradient-to-r from-indigo-50 to-purple-50 rounded-lg">
            <p className="text-xs text-slate-500 mb-1">下一个预测</p>
            <div className="flex items-center gap-2">
              <MapPin className="w-4 h-4 text-indigo-500 flex-shrink-0" />
              <p className="text-sm font-medium text-slate-800 truncate flex-1">
                {stats.nextPrediction.roadName}
              </p>
              <span className="text-xs text-slate-500">
                {stats.nextPrediction.predictedTimes[0]?.averageTime}
              </span>
              <span
                className={`text-xs px-2 py-0.5 rounded-full ${getConfidenceColor(
                  stats.nextPrediction.predictedTimes[0]?.confidence || 0
                )}`}
              >
                {getConfidenceLabel(
                  stats.nextPrediction.predictedTimes[0]?.confidence || 0
                )}
              </span>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
