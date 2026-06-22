import { Droplets, AlertTriangle, BarChart3 } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '../Card';
import { useSplashStatistics } from '../../hooks/usePredictions';

export default function SplashStatsWidget() {
  const splashStats = useSplashStatistics();

  return (
    <Card>
      <CardHeader className="pb-2">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-slate-500 flex items-center justify-center">
            <BarChart3 className="w-4 h-4 text-white" />
          </div>
          <CardTitle className="text-sm">溅水统计</CardTitle>
        </div>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-3 gap-2">
          <div className="text-center p-2">
            <div className="w-10 h-10 mx-auto rounded-xl bg-sky-100 flex items-center justify-center mb-1">
              <Droplets className="w-5 h-5 text-sky-600" />
            </div>
            <p className="text-lg font-bold text-slate-800">{splashStats.total}</p>
            <p className="text-xs text-slate-500">总记录</p>
          </div>
          <div className="text-center p-2">
            <div className="w-10 h-10 mx-auto rounded-xl bg-orange-100 flex items-center justify-center mb-1">
              <AlertTriangle className="w-5 h-5 text-orange-500" />
            </div>
            <p className="text-lg font-bold text-slate-800">{splashStats.splashed}</p>
            <p className="text-xs text-slate-500">被溅次数</p>
          </div>
          <div className="text-center p-2">
            <div className="w-10 h-10 mx-auto rounded-xl bg-emerald-100 flex items-center justify-center mb-1">
              <Droplets className="w-5 h-5 text-emerald-600" />
            </div>
            <p className="text-lg font-bold text-slate-800">
              {Math.round(splashStats.rate * 100)}%
            </p>
            <p className="text-xs text-slate-500">溅水率</p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
