import { useMemo } from 'react';
import { AlertTriangle, ChevronRight } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '../Card';
import { useStatistics } from '../../store/useAppStore';
import { cn } from '../../lib/utils';

export default function MostDangerousRoadsWidget() {
  const statistics = useStatistics();
  const navigate = useNavigate();

  const topRoads = useMemo(() => {
    if (!statistics) return [];
    return [...statistics.topRoads]
      .sort((a, b) => b.splashRate - a.splashRate)
      .slice(0, 5);
  }, [statistics]);

  const getRiskColor = (rate: number) => {
    if (rate >= 0.7) return 'bg-red-500';
    if (rate >= 0.4) return 'bg-amber-500';
    return 'bg-emerald-500';
  };

  const getRiskTextColor = (rate: number) => {
    if (rate >= 0.7) return 'text-red-600';
    if (rate >= 0.4) return 'text-amber-600';
    return 'text-emerald-600';
  };

  if (!statistics || topRoads.length === 0) {
    return (
      <Card>
        <CardHeader className="pb-2">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-red-500 flex items-center justify-center">
              <AlertTriangle className="w-4 h-4 text-white" />
            </div>
            <CardTitle className="text-sm">最危险路段排行</CardTitle>
          </div>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-slate-500 text-center py-4">暂无数据</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-red-500 flex items-center justify-center">
              <AlertTriangle className="w-4 h-4 text-white" />
            </div>
            <CardTitle className="text-sm">最危险路段排行</CardTitle>
          </div>
          <button
            onClick={() => navigate('/statistics')}
            className="text-xs text-slate-500 hover:text-slate-700 flex items-center gap-0.5"
          >
            详情
            <ChevronRight className="w-3 h-3" />
          </button>
        </div>
      </CardHeader>
      <CardContent className="space-y-2">
        {topRoads.map((road, index) => (
          <div
            key={road.road}
            className="flex items-center gap-3 p-2 rounded-lg hover:bg-slate-50 transition-colors"
          >
            <div
              className={cn(
                'w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold text-white',
                index === 0 ? 'bg-red-500' : index === 1 ? 'bg-orange-500' : index === 2 ? 'bg-amber-500' : 'bg-slate-400'
              )}
            >
              {index + 1}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-slate-800 truncate">
                {road.road}
              </p>
              <div className="flex items-center gap-2 mt-0.5">
                <div className="flex-1 h-1.5 bg-slate-100 rounded-full overflow-hidden">
                  <div
                    className={cn('h-full rounded-full', getRiskColor(road.splashRate))}
                    style={{ width: `${road.splashRate * 100}%` }}
                  />
                </div>
                <span className={cn('text-xs font-medium', getRiskTextColor(road.splashRate))}>
                  {Math.round(road.splashRate * 100)}%
                </span>
              </div>
            </div>
            <span className="text-xs text-slate-400">{road.count}次</span>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}
