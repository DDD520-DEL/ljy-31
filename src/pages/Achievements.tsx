import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Trophy,
  Award,
  Star,
  Flame,
  MapPin,
  Calendar,
  Zap,
  Crown,
  Droplets,
  Droplet,
  CloudRain,
  Shield,
  ShieldCheck,
  FileText,
  BookOpen,
  Map,
  Compass,
  Globe,
  TrendingUp,
  Rocket,
  CalendarCheck,
  Check,
  Lock,
  ChevronRight,
  Sparkles,
} from 'lucide-react';
import {
  useAchievements,
  useUserAchievements,
  useAchievementProgress,
  useNewAchievements,
  useMarkAchievementAsRead,
  useMarkAllAchievementsAsRead,
} from '../store/useAppStore';
import { Card, CardContent, CardHeader, CardTitle } from '../components/Card';
import { cn } from '../lib/utils';
import { AchievementCategory, AchievementRarity } from '../types';

const iconMap: Record<string, React.FC<{ className?: string }>> = {
  Droplets,
  Droplet,
  CloudRain,
  Award,
  Crown,
  Trophy,
  Star,
  Flame,
  MapPin,
  Map,
  Compass,
  Globe,
  Calendar,
  CalendarCheck,
  Zap,
  TrendingUp,
  Rocket,
  FileText,
  BookOpen,
  Shield,
  ShieldCheck,
};

const rarityConfig: Record<AchievementRarity, { bg: string; text: string; border: string; glow: string; label: string }> = {
  common: {
    bg: 'bg-slate-100',
    text: 'text-slate-600',
    border: 'border-slate-200',
    glow: '',
    label: '普通',
  },
  rare: {
    bg: 'bg-sky-100',
    text: 'text-sky-600',
    border: 'border-sky-200',
    glow: 'shadow-sky-200/50',
    label: '稀有',
  },
  epic: {
    bg: 'bg-purple-100',
    text: 'text-purple-600',
    border: 'border-purple-200',
    glow: 'shadow-purple-200/50',
    label: '史诗',
  },
  legendary: {
    bg: 'bg-amber-100',
    text: 'text-amber-600',
    border: 'border-amber-200',
    glow: 'shadow-amber-200/50',
    label: '传说',
  },
};

const categoryConfig: Record<AchievementCategory, { label: string; icon: React.FC<{ className?: string }>; color: string }> = {
  record: { label: '记录数量', icon: FileText, color: 'text-sky-500' },
  streak: { label: '连续坚持', icon: Flame, color: 'text-orange-500' },
  exploration: { label: '探索发现', icon: MapPin, color: 'text-emerald-500' },
  milestone: { label: '里程碑', icon: Trophy, color: 'text-amber-500' },
};

type FilterTab = 'all' | AchievementCategory;

export default function Achievements() {
  const navigate = useNavigate();
  const achievements = useAchievements();
  const userAchievements = useUserAchievements();
  const progressList = useAchievementProgress();
  const newAchievements = useNewAchievements();
  const markAsRead = useMarkAchievementAsRead();
  const markAllAsRead = useMarkAllAchievementsAsRead();

  const [activeTab, setActiveTab] = useState<FilterTab>('all');
  const [showUnlockedOnly, setShowUnlockedOnly] = useState(false);

  const unlockedCount = userAchievements.length;
  const totalCount = achievements.length;
  const progressPercent = Math.round((unlockedCount / totalCount) * 100);

  const filteredAchievements = useMemo(() => {
    let result = achievements;

    if (activeTab !== 'all') {
      result = result.filter((a) => a.category === activeTab);
    }

    if (showUnlockedOnly) {
      const unlockedIds = new Set(userAchievements.map((ua) => ua.achievementId));
      result = result.filter((a) => unlockedIds.has(a.id));
    }

    return result.sort((a, b) => {
      const aUnlocked = userAchievements.some((ua) => ua.achievementId === a.id);
      const bUnlocked = userAchievements.some((ua) => ua.achievementId === b.id);
      if (aUnlocked && !bUnlocked) return -1;
      if (!aUnlocked && bUnlocked) return 1;
      return a.targetValue - b.targetValue;
    });
  }, [achievements, activeTab, showUnlockedOnly, userAchievements]);

  const getProgress = (achievementId: string) => {
    return progressList.find((p) => p.achievementId === achievementId);
  };

  const getUserAchievement = (achievementId: string) => {
    return userAchievements.find((ua) => ua.achievementId === achievementId);
  };

  const isNew = (achievementId: string) => {
    return newAchievements.some((na) => na.achievementId === achievementId);
  };

  const handleAchievementClick = (achievementId: string) => {
    if (isNew(achievementId)) {
      markAsRead(achievementId);
    }
  };

  const formatDate = (timestamp: number) => {
    const d = new Date(timestamp);
    return `${d.getFullYear()}/${d.getMonth() + 1}/${d.getDate()}`;
  };

  const tabs: { key: FilterTab; label: string; icon: React.FC<{ className?: string }> }[] = [
    { key: 'all', label: '全部', icon: Trophy },
    { key: 'record', label: '记录', icon: FileText },
    { key: 'streak', label: '坚持', icon: Flame },
    { key: 'exploration', label: '探索', icon: MapPin },
    { key: 'milestone', label: '里程碑', icon: Star },
  ];

  return (
    <div className="p-4 space-y-6 pb-20">
      <div className="pt-2">
        <h1 className="text-2xl font-bold text-slate-800 mb-1">成就徽章</h1>
        <p className="text-slate-500 text-sm">记录你的每一次进步</p>
      </div>

      <Card className="bg-gradient-to-br from-amber-50 via-orange-50 to-rose-50 border-amber-200">
        <CardContent className="py-5">
          <div className="flex items-center gap-4">
            <div className="relative">
              <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center shadow-lg shadow-amber-200">
                <Trophy className="w-8 h-8 text-white" />
              </div>
              {newAchievements.length > 0 && (
                <div className="absolute -top-1 -right-1 w-6 h-6 bg-rose-500 text-white text-xs font-bold rounded-full flex items-center justify-center">
                  {newAchievements.length}
                </div>
              )}
            </div>
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-1">
                <p className="text-lg font-bold text-slate-800">
                  已解锁 {unlockedCount}/{totalCount}
                </p>
                <span className="text-amber-600 font-medium">{progressPercent}%</span>
              </div>
              <div className="h-2 bg-amber-100 rounded-full overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-amber-400 to-orange-500 rounded-full transition-all duration-500"
                  style={{ width: `${progressPercent}%` }}
                />
              </div>
              <p className="text-xs text-slate-500 mt-2">
                继续努力，解锁更多成就徽章！
              </p>
            </div>
            {newAchievements.length > 0 && (
              <button
                onClick={markAllAsRead}
                className="px-3 py-1.5 rounded-lg bg-white border border-amber-200 text-amber-600 text-xs font-medium hover:bg-amber-50 transition-colors"
              >
                全部已读
              </button>
            )}
          </div>
        </CardContent>
      </Card>

      <div className="flex items-center gap-2 overflow-x-auto pb-2">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.key;
          return (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={cn(
                'flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-medium whitespace-nowrap transition-all',
                isActive
                  ? 'bg-sky-500 text-white shadow-md shadow-sky-200'
                  : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'
              )}
            >
              <Icon className="w-4 h-4" />
              {tab.label}
            </button>
          );
        })}
        <div className="ml-auto flex items-center gap-2">
          <label className="flex items-center gap-2 text-sm text-slate-600 cursor-pointer">
            <input
              type="checkbox"
              checked={showUnlockedOnly}
              onChange={(e) => setShowUnlockedOnly(e.target.checked)}
              className="w-4 h-4 rounded text-sky-500 focus:ring-sky-500"
            />
            仅显示已解锁
          </label>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3">
        {filteredAchievements.map((achievement) => {
          const Icon = iconMap[achievement.icon] || Award;
          const progress = getProgress(achievement.id);
          const userAch = getUserAchievement(achievement.id);
          const unlocked = !!userAch;
          const rarity = rarityConfig[achievement.rarity];
          const category = categoryConfig[achievement.category];
          const isNewBadge = isNew(achievement.id);

          return (
            <div
              key={achievement.id}
              onClick={() => handleAchievementClick(achievement.id)}
              className={cn(
                'relative rounded-2xl p-4 transition-all duration-300 cursor-pointer',
                'border-2',
                unlocked
                  ? cn(
                      rarity.border,
                      rarity.bg,
                      'shadow-lg',
                      rarity.glow,
                      isNewBadge && 'ring-4 ring-amber-300 ring-opacity-50 animate-pulse'
                    )
                  : 'bg-white/60 border-slate-100 opacity-70'
              )}
            >
              {isNewBadge && (
                <div className="absolute -top-2 -right-2 z-10">
                  <div className="flex items-center gap-0.5 px-2 py-1 bg-gradient-to-r from-rose-500 to-pink-500 text-white text-xs font-bold rounded-full shadow-md">
                    <Sparkles className="w-3 h-3" />
                    新!
                  </div>
                </div>
              )}

              <div className="flex items-start justify-between mb-3">
                <div
                  className={cn(
                    'w-12 h-12 rounded-xl flex items-center justify-center',
                    unlocked ? rarity.bg : 'bg-slate-100',
                    unlocked && 'shadow-inner'
                  )}
                >
                  {unlocked ? (
                    <Icon className={cn('w-6 h-6', rarity.text)} />
                  ) : (
                    <Lock className="w-5 h-5 text-slate-400" />
                  )}
                </div>
                <span
                  className={cn(
                    'text-xs font-medium px-2 py-0.5 rounded-full',
                    rarity.bg,
                    rarity.text
                  )}
                >
                  {rarity.label}
                </span>
              </div>

              <h3
                className={cn(
                  'font-bold text-sm mb-1',
                  unlocked ? 'text-slate-800' : 'text-slate-500'
                )}
              >
                {achievement.title}
              </h3>
              <p
                className={cn(
                  'text-xs mb-3 line-clamp-2',
                  unlocked ? 'text-slate-600' : 'text-slate-400'
                )}
              >
                {achievement.description}
              </p>

              {unlocked && userAch ? (
                <div className="flex items-center gap-1.5 text-xs text-slate-500">
                  <Check className="w-3.5 h-3.5 text-emerald-500" />
                  <span>{formatDate(userAch.unlockedAt)} 解锁</span>
                </div>
              ) : (
                <div>
                  <div className="flex items-center justify-between text-xs text-slate-500 mb-1.5">
                    <span>进度</span>
                    <span>
                      {progress?.currentValue || 0}/{achievement.targetValue}
                      {achievement.unit}
                    </span>
                  </div>
                  <div className="h-1.5 bg-slate-100 rounded-full overflow-hidden">
                    <div
                      className={cn(
                        'h-full rounded-full transition-all duration-500',
                        unlocked
                          ? 'bg-gradient-to-r from-emerald-400 to-emerald-500'
                          : 'bg-gradient-to-r from-sky-400 to-sky-500'
                      )}
                      style={{ width: `${progress?.percentage || 0}%` }}
                    />
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {filteredAchievements.length === 0 && (
        <div className="text-center py-12">
          <div className="w-16 h-16 rounded-full bg-slate-100 flex items-center justify-center mx-auto mb-4">
            <Trophy className="w-8 h-8 text-slate-300" />
          </div>
          <p className="text-slate-500 mb-2">暂无符合条件的成就</p>
          <p className="text-sm text-slate-400">继续记录洒水车出没，解锁更多成就吧！</p>
        </div>
      )}
    </div>
  );
}
