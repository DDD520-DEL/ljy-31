import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Plus,
  Settings as SettingsIcon,
  Edit3,
  Check,
  X,
  Grid3X3,
  Trophy,
  Sparkles,
  ChevronRight,
  Award,
  Droplets,
  Flame,
  MapPin,
  FileText,
  BookOpen,
  Star,
  Crown,
  Calendar,
  Zap,
  TrendingUp,
  Rocket,
  CalendarCheck,
  Map,
  Compass,
  Globe,
  Droplet,
  CloudRain,
  Shield,
  ShieldCheck,
} from 'lucide-react';
import VoiceInputButton from '../components/VoiceInputButton';
import DraggableCardGrid from '../components/DraggableCardGrid';
import CardSelector from '../components/CardSelector';
import { ParsedSpeechResult } from '../utils/speechParser';
import {
  useDashboardCards,
  useIsDashboardEditing,
  useSetIsDashboardEditing,
} from '../store/useDashboardStore';
import {
  useCheckAndGenerateWeeklyReport as useCheckAndGenerate,
  useNewAchievements,
  useAchievements,
  useMarkAchievementAsRead,
  useUserAchievements,
  useCheckAchievements,
} from '../store/useAppStore';
import { cn } from '../lib/utils';
import { AchievementRarity } from '../types';

export default function Dashboard() {
  const navigate = useNavigate();
  const cards = useDashboardCards();
  const isEditing = useIsDashboardEditing();
  const setIsEditing = useSetIsDashboardEditing();
  const checkAndGenerateWeeklyReport = useCheckAndGenerate();
  const newAchievements = useNewAchievements();
  const allAchievements = useAchievements();
  const userAchievements = useUserAchievements();
  const markAchievementAsRead = useMarkAchievementAsRead();
  const checkAchievements = useCheckAchievements();
  const [showCardSelector, setShowCardSelector] = useState(false);

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

  const rarityConfig: Record<AchievementRarity, { bg: string; text: string; border: string }> = {
    common: { bg: 'bg-slate-100', text: 'text-slate-600', border: 'border-slate-200' },
    rare: { bg: 'bg-sky-100', text: 'text-sky-600', border: 'border-sky-200' },
    epic: { bg: 'bg-purple-100', text: 'text-purple-600', border: 'border-purple-200' },
    legendary: { bg: 'bg-amber-100', text: 'text-amber-600', border: 'border-amber-200' },
  };

  const newAchievementDetails = newAchievements
    .map((na) => {
      const achievement = allAchievements.find((a) => a.id === na.achievementId);
      return achievement ? { ...achievement, unlockedAt: na.unlockedAt, isNew: na.isNew } : null;
    })
    .filter(Boolean)
    .slice(0, 3);

  const handleVoiceRecord = (result: ParsedSpeechResult) => {
    sessionStorage.setItem('voiceRecordData', JSON.stringify(result));
    navigate('/record');
  };

  useEffect(() => {
    checkAndGenerateWeeklyReport();
    checkAchievements();
  }, [checkAndGenerateWeeklyReport, checkAchievements]);

  const greeting = () => {
    const hour = new Date().getHours();
    if (hour < 6) return '夜深了';
    if (hour < 9) return '早上好';
    if (hour < 12) return '上午好';
    if (hour < 14) return '中午好';
    if (hour < 18) return '下午好';
    if (hour < 22) return '晚上好';
    return '夜深了';
  };

  const toggleEditMode = () => {
    setIsEditing(!isEditing);
  };

  const visibleCount = cards.filter((c) => c.visible).length;
  const totalCount = cards.length;

  return (
    <div className="p-4 space-y-6">
      <div className="flex items-center justify-between pt-2">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">{greeting()} ☀️</h1>
          <p className="text-slate-500 text-sm mt-1">今天也要小心洒水车哦</p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => navigate('/achievements')}
            className="relative w-12 h-12 rounded-2xl bg-white shadow-sm border border-slate-100 flex items-center justify-center text-slate-600 hover:bg-slate-50 transition-colors"
          >
            <Trophy className="w-5 h-5" />
            {newAchievements.length > 0 && (
              <span className="absolute -top-1 -right-1 min-w-[18px] h-[18px] px-1 rounded-full bg-rose-500 text-white text-xs font-bold flex items-center justify-center">
                {newAchievements.length > 9 ? '9+' : newAchievements.length}
              </span>
            )}
          </button>
          <button
            onClick={() => navigate('/settings')}
            className="w-12 h-12 rounded-2xl bg-white shadow-sm border border-slate-100 flex items-center justify-center text-slate-600 hover:bg-slate-50 transition-colors"
          >
            <SettingsIcon className="w-5 h-5" />
          </button>
          <VoiceInputButton onResult={handleVoiceRecord} size="md" variant="secondary" />
          <button
            onClick={() => navigate('/record')}
            className="w-12 h-12 rounded-2xl bg-gradient-to-br from-sky-500 to-blue-600 text-white shadow-lg shadow-sky-500/30 flex items-center justify-center hover:scale-105 active:scale-95 transition-transform"
          >
            <Plus className="w-6 h-6" strokeWidth={2.5} />
          </button>
        </div>
      </div>

      {newAchievementDetails.length > 0 && (
        <div className="bg-gradient-to-r from-amber-50 via-orange-50 to-rose-50 rounded-2xl p-4 border border-amber-200 shadow-sm">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center">
                <Sparkles className="w-4 h-4 text-white" />
              </div>
              <div>
                <p className="font-bold text-slate-800 text-sm">恭喜获得新徽章！</p>
                <p className="text-xs text-amber-700">
                  解锁了 {newAchievements.length} 个新成就
                </p>
              </div>
            </div>
            <button
              onClick={() => navigate('/achievements')}
              className="flex items-center gap-1 text-xs font-medium text-amber-600 hover:text-amber-700 transition-colors"
            >
              查看全部
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>
          <div className="flex gap-3">
            {newAchievementDetails.map((achievement) => {
              if (!achievement) return null;
              const Icon = iconMap[achievement.icon] || Award;
              const rarity = rarityConfig[achievement.rarity];
              return (
                <div
                  key={achievement.id}
                  onClick={() => {
                    markAchievementAsRead(achievement.id);
                    navigate('/achievements');
                  }}
                  className={cn(
                    'flex-1 flex flex-col items-center p-3 rounded-xl border-2 cursor-pointer transition-all hover:scale-105',
                    rarity.border,
                    rarity.bg,
                    'shadow-md'
                  )}
                >
                  <div className={cn('w-10 h-10 rounded-lg flex items-center justify-center mb-2', rarity.bg)}>
                    <Icon className={cn('w-5 h-5', rarity.text)} />
                  </div>
                  <p className={cn('text-xs font-bold text-center', rarity.text)}>
                    {achievement.title}
                  </p>
                  <div className="flex items-center gap-0.5 mt-1">
                    <Star className="w-3 h-3 text-amber-400 fill-amber-400" />
                    <span className="text-[10px] text-slate-500">新解锁</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Grid3X3 className="w-4 h-4 text-slate-400" />
          <span className="text-sm text-slate-500">
            已显示 {visibleCount}/{totalCount} 个卡片
          </span>
        </div>
        <div className="flex items-center gap-2">
          {isEditing ? (
            <>
              <button
                onClick={toggleEditMode}
                className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-emerald-500 text-white text-sm font-medium hover:bg-emerald-600 transition-colors"
              >
                <Check className="w-4 h-4" />
                完成
              </button>
              <button
                onClick={() => setShowCardSelector(true)}
                className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-sky-500 text-white text-sm font-medium hover:bg-sky-600 transition-colors"
              >
                <Grid3X3 className="w-4 h-4" />
                管理卡片
              </button>
            </>
          ) : (
            <button
              onClick={toggleEditMode}
              className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-slate-100 text-slate-700 text-sm font-medium hover:bg-slate-200 transition-colors"
            >
              <Edit3 className="w-4 h-4" />
              编辑布局
            </button>
          )}
        </div>
      </div>

      {isEditing && (
        <div className="bg-sky-50 border border-sky-200 rounded-xl p-4">
          <div className="flex items-start gap-3">
            <div className="w-8 h-8 rounded-lg bg-sky-100 flex items-center justify-center flex-shrink-0">
              <Edit3 className="w-4 h-4 text-sky-600" />
            </div>
            <div>
              <p className="font-medium text-sky-800">编辑模式已开启</p>
              <p className="text-sm text-sky-600 mt-1">
                拖拽卡片左侧的手柄可以调整顺序，点击卡片右上角的眼睛图标可以隐藏卡片。
              </p>
            </div>
            <button
              onClick={toggleEditMode}
              className="ml-auto w-8 h-8 rounded-lg bg-sky-100 hover:bg-sky-200 flex items-center justify-center transition-colors"
            >
              <X className="w-4 h-4 text-sky-600" />
            </button>
          </div>
        </div>
      )}

      <DraggableCardGrid cards={cards} />

      {showCardSelector && (
        <CardSelector cards={cards} onClose={() => setShowCardSelector(false)} />
      )}
    </div>
  );
}
