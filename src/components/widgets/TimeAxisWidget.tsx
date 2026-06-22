import { Clock } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '../Card';
import TimeAxis from '../TimeAxis';
import { useTodayPredictions } from '../../hooks/usePredictions';

export default function TimeAxisWidget() {
  const todayPredictions = useTodayPredictions();

  const timeAxisData = Array.from({ length: 24 }, (_, i) => ({
    hour: i,
    count: todayPredictions.reduce((sum, p) => {
      return sum + p.predictedTimes.filter((t) => t.hour === i).length;
    }, 0),
  }));

  return (
    <Card>
      <CardHeader className="pb-2">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-slate-500 flex items-center justify-center">
            <Clock className="w-4 h-4 text-white" />
          </div>
          <CardTitle className="text-sm">今日24小时分布</CardTitle>
        </div>
      </CardHeader>
      <CardContent>
        <TimeAxis data={timeAxisData} />
      </CardContent>
    </Card>
  );
}
