import { Clock, ChevronRight } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '../Card';
import RecordCard from '../RecordCard';
import { useRecentRecords } from '../../hooks/usePredictions';

export default function RecentRecordsWidget() {
  const recentRecords = useRecentRecords(7);
  const navigate = useNavigate();

  const displayRecords = recentRecords.slice(0, 3);

  if (displayRecords.length === 0) {
    return (
      <Card>
        <CardHeader className="pb-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-slate-500 flex items-center justify-center">
                <Clock className="w-4 h-4 text-white" />
              </div>
              <CardTitle className="text-sm">最近记录</CardTitle>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-slate-500 text-center py-4">暂无记录</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-slate-500 flex items-center justify-center">
              <Clock className="w-4 h-4 text-white" />
            </div>
            <CardTitle className="text-sm">最近记录</CardTitle>
          </div>
          <button
            onClick={() => navigate('/history')}
            className="text-xs text-slate-500 hover:text-slate-700 flex items-center gap-0.5"
          >
            全部
            <ChevronRight className="w-3 h-3" />
          </button>
        </div>
      </CardHeader>
      <CardContent className="space-y-2">
        {displayRecords.map((record) => (
          <RecordCard key={record.id} record={record} showActions={false} />
        ))}
      </CardContent>
    </Card>
  );
}
