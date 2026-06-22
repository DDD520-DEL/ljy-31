import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Users,
  TrendingUp,
  Trophy,
  Upload,
  RefreshCw,
  Shield,
  MapPin,
  Droplets,
  BarChart3,
  Calendar,
  ChevronRight,
  Globe,
  Lock,
  AlertCircle,
  Check,
  Sparkles,
  Award,
  Target,
  Zap,
} from 'lucide-react';
import {
  useCommunityRoadStats,
  useContributionStats,
  useCommunitySettings,
  useIsCommunitySyncing,
  useShareAllRecords,
  useSyncCommunityData,
  useUpdateCommunitySettings,
  useRefreshCommunityRoadStats,
  useRefreshContributionStats,
  useRecords,
  useCommunityRecords,
} from '../store/useAppStore';
import { Card, CardContent, CardHeader, CardTitle } from '../components/Card';
import { Button } from '../components/Button';
import { cn } from '../lib/utils';
import { getProbabilityBgLight, formatDateTime } from '../utils/format';

export default function Community() {
  const navigate = useNavigate();
  const communityRoadStats = useCommunityRoadStats();
  const contributionStats = useContributionStats();
  const communitySettings = useCommunitySettings();
  const isCommunitySyncing = useIsCommunitySyncing();
  const shareAllRecords = useShareAllRecords();
  const syncCommunityData = useSyncCommunityData();
  const updateCommunitySettings = useUpdateCommunitySettings();
  const refreshCommunityRoadStats = useRefreshCommunityRoadStats();
  const refreshContributionStats = useRefreshContributionStats();
  const records = useRecords();
  const communityRecords = useCommunityRecords();

  const [showShareConfirm, setShowShareConfirm] = useState(false);
  const [shareResult, setShareResult] = useState<{ show: boolean; count: number }>({
    show: false,
    count: 0,
  });

  const topRoads = useMemo(() => {
    return [...communityRoadStats]
      .sort((a, b) => b.totalRecords - a.totalRecords)
      .slice(0, 15);
  }, [communityRoadStats]);

  const totalCommunityRecords = useMemo(() => {
    return communityRoadStats.reduce((sum, s) => sum + s.totalRecords, 0);
  }, [communityRoadStats]);

  const totalContributors = useMemo(() => {
    const uniqueContributors = new Set<string>();
    communityRecords.forEach((r) => {
      if (r.contributorId && r.contributorId !== 'anonymous') {
        uniqueContributors.add(r.contributorId);
      }
    });
    return uniqueContributors.size;
  }, [communityRecords]);

  const handleEnableCommunity = () => {
    updateCommunitySettings({ enabled: true, useCommunityData: true });
  };

  const handleShareAll = async () => {
    setShowShareConfirm(false);
    const count = await shareAllRecords();
    setShareResult({ show: true, count });
    setTimeout(() => setShareResult({ show: false, count: 0 }), 3000);
  };

  const handleSync = async () => {
    await syncCommunityData();
    refreshCommunityRoadStats();
    refreshContributionStats();
  };

  const rankIcon = (rank: number) => {
    if (rank === 1) return <Trophy className="w-5 h-5 text-amber-500 fill-amber-500" />;
    if (rank === 2) return <Award className="w-5 h-5 text-slate-400 fill-slate-400" />;
    if (rank === 3) return <Award className="w-5 h-5 text-orange-400 fill-orange-400" />;
    return (
      <span className="w-5 h-5 flex items-center justify-center text-sm font-bold text-slate-400">
        {rank}
      </span>
    );
  };

  if (!communitySettings.enabled) {
    return (
      <div className="p-4 space-y-6">
        <div className="pt-2">
          <h1 className="text-2xl font-bold text-slate-800 mb-1">社区数据共享</h1>
          <p className="text-slate-500 text-sm">与社区共享数据，获取更丰富的预测</p>
        </div>

        <Card className="border-2 border-purple-200 bg-gradient-to-br from-purple-50/80 to-sky-50/50">
          <CardContent className="py-8 text-center">
            <div className="w-20 h-20 mx-auto rounded-full bg-gradient-to-br from-purple-400 to-sky-400 flex items-center justify-center mb-6 shadow-lg shadow-purple-200/50">
              <Globe className="w-10 h-10 text-white" />
            </div>
            <h2 className="text-xl font-bold text-slate-800 mb-3">开启社区数据共享</h2>
            <p className="text-slate-600 text-sm mb-6 max-w-sm mx-auto leading-relaxed">
              匿名分享您的洒水车记录，获取社区其他用户贡献的海量数据，让预测更精准。
            </p>

            <div className="grid grid-cols-3 gap-3 mb-8 max-w-md mx-auto">
              <div className="p-4 bg-white/80 rounded-xl border border-purple-100">
                <Sparkles className="w-6 h-6 text-purple-500 mx-auto mb-2" />
                <p className="text-xs font-medium text-slate-700">更准预测</p>
              </div>
              <div className="p-4 bg-white/80 rounded-xl border border-sky-100">
                <Shield className="w-6 h-6 text-sky-500 mx-auto mb-2" />
                <p className="text-xs font-medium text-slate-700">匿名安全</p>
              </div>
              <div className="p-4 bg-white/80 rounded-xl border border-emerald-100">
                <Users className="w-6 h-6 text-emerald-500 mx-auto mb-2" />
                <p className="text-xs font-medium text-slate-700">社区共建</p>
              </div>
            </div>

            <Button onClick={handleEnableCommunity} size="lg">
              <Globe className="w-5 h-5" />
              开启社区共享
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Shield className="w-5 h-5 text-emerald-500" />
              隐私保护说明
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-sm text-slate-600">
            <div className="flex items-start gap-3">
              <Lock className="w-4 h-4 text-emerald-500 mt-0.5 flex-shrink-0" />
              <div>
                <p className="font-medium text-slate-700">完全匿名</p>
                <p className="text-slate-500 text-xs mt-0.5">
                  默认使用完全匿名模式，不包含任何个人身份信息
                </p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <Target className="w-4 h-4 text-emerald-500 mt-0.5 flex-shrink-0" />
              <div>
                <p className="font-medium text-slate-700">可控范围</p>
                <p className="text-slate-500 text-xs mt-0.5">
                  可在设置中自定义匿名级别，控制分享内容
                </p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <Zap className="w-4 h-4 text-emerald-500 mt-0.5 flex-shrink-0" />
              <div>
                <p className="font-medium text-slate-700">随时开关</p>
                <p className="text-slate-500 text-xs mt-0.5">
                  可随时开启或关闭社区功能，不影响本地数据
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="p-4 space-y-6">
      <div className="pt-2 flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-800 mb-1">社区数据共享</h1>
          <p className="text-slate-500 text-sm">
            {communitySettings.useCommunityData
              ? '已启用社区数据，预测更精准'
              : '社区数据已关闭，仅使用本地数据'}
          </p>
        </div>
        <button
          onClick={() => navigate('/settings')}
          className="flex items-center gap-1 px-3 py-2 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 transition-colors"
        >
          <Shield className="w-4 h-4 text-slate-500" />
          <span className="text-sm text-slate-600">隐私设置</span>
        </button>
      </div>

      <div className="grid grid-cols-3 gap-3">
        <Card gradient className="bg-gradient-to-br from-purple-500 to-indigo-600">
          <CardContent className="py-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center">
                <Globe className="w-5 h-5 text-white" />
              </div>
              <div>
                <p className="text-2xl font-bold text-white">{totalCommunityRecords}</p>
                <p className="text-xs text-purple-100">社区总记录</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card gradient className="bg-gradient-to-br from-sky-500 to-cyan-500">
          <CardContent className="py-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center">
                <Users className="w-5 h-5 text-white" />
              </div>
              <div>
                <p className="text-2xl font-bold text-white">{totalContributors}</p>
                <p className="text-xs text-sky-100">贡献者数量</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card gradient className="bg-gradient-to-br from-emerald-500 to-teal-500">
          <CardContent className="py-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center">
                <MapPin className="w-5 h-5 text-white" />
              </div>
              <div>
                <p className="text-2xl font-bold text-white">{communityRoadStats.length}</p>
                <p className="text-xs text-emerald-100">覆盖路段</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card className="bg-gradient-to-br from-amber-50 to-orange-50 border-amber-200">
        <CardContent className="py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-amber-100 flex items-center justify-center">
                <Trophy className="w-5 h-5 text-amber-600" />
              </div>
              <div>
                <p className="font-semibold text-amber-800">我的贡献</p>
                <p className="text-xs text-amber-600 mt-0.5">
                  已贡献 {contributionStats.totalContributed} 条记录，覆盖{' '}
                  {contributionStats.roadsContributed} 个路段
                </p>
              </div>
            </div>
            <div className="text-right">
              <p className="text-2xl font-bold text-amber-600">
                Lv.{Math.floor(contributionStats.totalContributed / 10) + 1}
              </p>
              <p className="text-xs text-amber-500">贡献等级</p>
            </div>
          </div>

          {contributionStats.weeklyContributions.length > 0 && (
            <div className="mt-4 pt-4 border-t border-amber-200">
              <p className="text-xs font-medium text-amber-700 mb-2 flex items-center gap-1">
                <Calendar className="w-3.5 h-3.5" />
                近 12 周贡献趋势
              </p>
              <div className="flex items-end gap-1 h-12">
                {contributionStats.weeklyContributions.map((week, idx) => {
                  const maxCount = Math.max(
                    ...contributionStats.weeklyContributions.map((w) => w.count),
                    1
                  );
                  const height = (week.count / maxCount) * 100;
                  return (
                    <div
                      key={idx}
                      className="flex-1 rounded-t bg-amber-300 hover:bg-amber-400 transition-colors"
                      style={{ height: `${Math.max(height, 8)}%` }}
                      title={`${week.week}: ${week.count} 条`}
                    />
                  );
                })}
              </div>
            </div>
          )}

          <div className="mt-4 pt-4 border-t border-amber-200 flex gap-2">
            <Button
              onClick={() => setShowShareConfirm(true)}
              className="flex-1 bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600"
            >
              <Upload className="w-4 h-4" />
              贡献我的记录
            </Button>
            <Button variant="outline" onClick={handleSync} disabled={isCommunitySyncing}>
              <RefreshCw
                className={cn('w-4 h-4', isCommunitySyncing && 'animate-spin')}
              />
              同步
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-sky-500" />
            热门贡献路段排行
          </CardTitle>
          <p className="text-sm text-slate-500 mt-1">
            社区用户贡献最多的路段，数据更丰富预测更准
          </p>
        </CardHeader>
        <CardContent className="space-y-3">
          {topRoads.map((road) => (
            <div
              key={road.roadName}
              className={cn(
                'flex items-center gap-3 p-3 rounded-xl transition-colors',
                road.rank <= 3 ? 'bg-gradient-to-r from-slate-50 to-transparent' : 'hover:bg-slate-50'
              )}
            >
              <div
                className={cn(
                  'w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0',
                  road.rank === 1 && 'bg-amber-100',
                  road.rank === 2 && 'bg-slate-100',
                  road.rank === 3 && 'bg-orange-100',
                  road.rank > 3 && 'bg-slate-50'
                )}
              >
                {rankIcon(road.rank)}
              </div>

              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <span className="font-medium text-slate-800 truncate">{road.roadName}</span>
                  <span className="px-1.5 py-0.5 rounded bg-purple-100 text-purple-600 text-xs font-medium flex-shrink-0">
                    {road.contributorCount} 人贡献
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="flex-1 h-1.5 bg-slate-100 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-gradient-to-r from-sky-400 to-purple-400 rounded-full transition-all"
                      style={{
                        width: `${(road.totalRecords / (topRoads[0]?.totalRecords || 1)) * 100}%`,
                      }}
                    />
                  </div>
                  <span className="text-xs text-slate-500 flex-shrink-0">
                    {road.totalRecords} 条
                  </span>
                </div>
              </div>

              <span
                className={cn(
                  'px-2 py-1 rounded-lg text-xs font-medium flex-shrink-0',
                  getProbabilityBgLight(road.splashRate)
                )}
              >
                <Droplets className="w-3 h-3 inline mr-1" />
                {Math.round(road.splashRate * 100)}%
              </span>
            </div>
          ))}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BarChart3 className="w-5 h-5 text-emerald-500" />
            高溅水率路段预警
          </CardTitle>
          <p className="text-sm text-slate-500 mt-1">
            社区数据显示溅水率较高的路段，出行请留意
          </p>
        </CardHeader>
        <CardContent className="space-y-2">
          {[...communityRoadStats]
            .filter((r) => r.totalRecords >= 5)
            .sort((a, b) => b.splashRate - a.splashRate)
            .slice(0, 5)
            .map((road, idx) => (
              <div
                key={road.roadName}
                className="flex items-center justify-between p-3 rounded-xl bg-red-50/50 border border-red-100"
              >
                <div className="flex items-center gap-3">
                  <AlertCircle className="w-4 h-4 text-red-500" />
                  <div>
                    <p className="font-medium text-slate-800 text-sm">{road.roadName}</p>
                    <p className="text-xs text-slate-500">
                      {road.totalRecords} 条记录 · {road.contributorCount} 位贡献者
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-lg font-bold text-red-600">
                    {Math.round(road.splashRate * 100)}%
                  </p>
                  <p className="text-xs text-red-400">溅水率</p>
                </div>
              </div>
            ))}
        </CardContent>
      </Card>

      {communitySettings.lastSyncAt && (
        <div className="text-center text-xs text-slate-400 py-2">
          上次同步: {formatDateTime(communitySettings.lastSyncAt)}
        </div>
      )}

      {showShareConfirm && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <Card className="w-full max-w-md">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Upload className="w-5 h-5 text-amber-500" />
                贡献记录到社区
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="p-4 bg-amber-50 rounded-xl border border-amber-200">
                <div className="flex items-start gap-3">
                  <Shield className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
                  <div className="text-sm">
                    <p className="font-medium text-amber-800 mb-1">隐私保护</p>
                    <p className="text-amber-700">
                      您的记录将以{' '}
                      <span className="font-medium">
                        {communitySettings.anonymityLevel === 'full'
                          ? '完全匿名'
                          : communitySettings.anonymityLevel === 'partial'
                          ? '部分匿名'
                          : '实名'}
                      </span>{' '}
                      方式提交
                    </p>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3 text-center">
                <div className="p-3 bg-slate-50 rounded-xl">
                  <p className="text-2xl font-bold text-slate-800">{records.length}</p>
                  <p className="text-xs text-slate-500">本地记录总数</p>
                </div>
                <div className="p-3 bg-slate-50 rounded-xl">
                  <p className="text-2xl font-bold text-emerald-600">
                    {records.length - contributionStats.totalContributed}
                  </p>
                  <p className="text-xs text-slate-500">待贡献记录</p>
                </div>
              </div>

              <div className="flex items-end gap-2">
                <Button variant="ghost" onClick={() => setShowShareConfirm(false)} className="flex-1">
                  取消
                </Button>
                <Button
                  onClick={handleShareAll}
                  className="flex-1 bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber--600 hover:to-orange-600"
                >
                  <Check className="w-4 h-4" />
                  确认贡献
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {shareResult.show && (
        <div className="fixed left-1/2 -translate-x-1/2 bottom-24 z-50">
          <div className="flex items-center gap-2 px-5 py-3 rounded-2xl shadow-lg bg-emerald-500/95 text-white backdrop-blur-sm">
            <Check className="w-5 h-5" />
            <span className="font-medium text-sm">
              成功贡献 {shareResult.count} 条记录，感谢您的分享！
            </span>
          </div>
        </div>
      )}
    </div>
  );
}
