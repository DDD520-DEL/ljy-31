import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, Settings as SettingsIcon, Edit3, Check, X, Grid3X3 } from 'lucide-react';
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
} from '../store/useAppStore';

export default function Dashboard() {
  const navigate = useNavigate();
  const cards = useDashboardCards();
  const isEditing = useIsDashboardEditing();
  const setIsEditing = useSetIsDashboardEditing();
  const checkAndGenerateWeeklyReport = useCheckAndGenerate();
  const [showCardSelector, setShowCardSelector] = useState(false);

  const handleVoiceRecord = (result: ParsedSpeechResult) => {
    sessionStorage.setItem('voiceRecordData', JSON.stringify(result));
    navigate('/record');
  };

  useEffect(() => {
    checkAndGenerateWeeklyReport();
  }, [checkAndGenerateWeeklyReport]);

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
