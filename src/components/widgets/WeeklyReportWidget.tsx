import { useState } from 'react';
import { FileText, X, ChevronRight } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '../Card';
import WeeklyReportCard from '../WeeklyReportCard';
import {
  useLatestWeeklyReport,
  useDismissWeeklyBanner,
  useWeeklyReportSettings,
} from '../../store/useAppStore';

export default function WeeklyReportWidget() {
  const navigate = useNavigate();
  const latestReport = useLatestWeeklyReport();
  const dismissWeeklyBanner = useDismissWeeklyBanner();
  const weeklyReportSettings = useWeeklyReportSettings();
  const [showReportDetail, setShowReportDetail] = useState(false);

  const shouldShowBanner =
    latestReport && !weeklyReportSettings.bannerDismissed[latestReport.id];

  if (!latestReport) {
    return (
      <Card>
        <CardHeader className="pb-2">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-indigo-500 flex items-center justify-center">
              <FileText className="w-4 h-4 text-white" />
            </div>
            <CardTitle className="text-sm">周报提醒</CardTitle>
          </div>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-slate-500 text-center py-4">暂无周报</p>
        </CardContent>
      </Card>
    );
  }

  const handleDismissBanner = () => {
    if (latestReport) {
      dismissWeeklyBanner(latestReport.id);
    }
  };

  const handleViewReportDetail = () => {
    navigate('/statistics');
  };

  return (
    <div className="relative">
      <Card className="bg-gradient-to-br from-indigo-500 via-purple-500 to-pink-500 text-white border-0 overflow-hidden shadow-lg">
        {shouldShowBanner && (
          <button
            onClick={handleDismissBanner}
            className="absolute top-3 right-3 w-8 h-8 rounded-lg bg-white/10 hover:bg-white/20 flex items-center justify-center transition-colors z-10"
          >
            <X className="w-4 h-4" />
          </button>
        )}
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
  );
}
