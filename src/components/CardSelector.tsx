import { X, Eye, EyeOff, RotateCcw, Info,
  Droplets, Shield, AlertTriangle, Calendar, BarChart3, Clock,
  CloudRain, Bell, Route, FileText, Star, GripVertical,
} from 'lucide-react';
import { WIDGET_CONFIGS, CardLayout } from '../types';
import {
  useToggleCardVisibility,
  useResetDashboardToDefault,
} from '../store/useDashboardStore';
import { cn } from '../lib/utils';

interface CardSelectorProps {
  cards: CardLayout[];
  onClose: () => void;
}

const iconMap: Record<string, React.ComponentType<{ className?: string }>> = {
  Droplets,
  Shield,
  AlertTriangle,
  Calendar,
  BarChart3,
  Clock,
  CloudRain,
  Bell,
  Route,
  FileText,
  Star,
};

export default function CardSelector({ cards, onClose }: CardSelectorProps) {
  const toggleCardVisibility = useToggleCardVisibility();
  const resetToDefault = useResetDashboardToDefault();

  const cardVisibilityMap = new Map(cards.map((c) => [c.type, c.visible]));

  const widgetList = Object.values(WIDGET_CONFIGS).sort((a, b) => {
    const cardA = cards.find((c) => c.type === a.type);
    const cardB = cards.find((c) => c.type === b.type);
    return (cardA?.order ?? 0) - (cardB?.order ?? 0);
  });

  const handleReset = () => {
    if (confirm('确定要恢复默认布局吗？所有自定义设置将被清除。')) {
      resetToDefault();
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[80vh] flex flex-col overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between bg-slate-50">
          <div>
            <h2 className="text-lg font-semibold text-slate-800">管理首页卡片</h2>
            <p className="text-sm text-slate-500 mt-0.5">选择要显示的卡片</p>
          </div>
          <button
            onClick={onClose}
            className="w-10 h-10 rounded-xl hover:bg-slate-200 flex items-center justify-center transition-colors"
          >
            <X className="w-5 h-5 text-slate-500" />
          </button>
        </div>

        <div className="px-6 py-3 border-b border-slate-100 bg-slate-50/50">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-sm text-slate-500">
              <Info className="w-4 h-4" />
              <span>拖拽卡片左侧手柄可调整顺序</span>
            </div>
            <button
              onClick={handleReset}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm text-slate-600 hover:bg-slate-200 transition-colors"
            >
              <RotateCcw className="w-4 h-4" />
              恢复默认
            </button>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-4 space-y-2">
          {widgetList.map((config) => {
            const isVisible = cardVisibilityMap.get(config.type) ?? config.defaultVisible;
            const IconComponent = iconMap[config.icon] || Droplets;

            return (
              <div
                key={config.type}
                className={cn(
                  'flex items-center gap-3 p-3 rounded-xl border transition-all',
                  isVisible
                    ? 'border-sky-200 bg-sky-50/50'
                    : 'border-slate-200 bg-slate-50/50 opacity-60'
                )}
              >
                <div className="cursor-grab text-slate-300 hover:text-slate-400">
                  <GripVertical className="w-5 h-5" />
                </div>
                <div
                  className={cn(
                    'w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0',
                    isVisible ? 'bg-sky-500 text-white' : 'bg-slate-200 text-slate-400'
                  )}
                >
                  <IconComponent className="w-5 h-5" />
                </div>
                <div className="flex-1 min-w-0">
                  <p
                    className={cn(
                      'font-medium text-sm',
                      isVisible ? 'text-slate-800' : 'text-slate-500'
                    )}
                  >
                    {config.title}
                  </p>
                  <p className="text-xs text-slate-500 mt-0.5 line-clamp-1">
                    {config.description}
                  </p>
                </div>
                <button
                  onClick={() => toggleCardVisibility(config.type)}
                  className={cn(
                    'w-10 h-10 rounded-xl flex items-center justify-center transition-colors flex-shrink-0',
                    isVisible
                      ? 'bg-sky-100 text-sky-600 hover:bg-sky-200'
                      : 'bg-slate-100 text-slate-400 hover:bg-slate-200'
                  )}
                  title={isVisible ? '隐藏' : '显示'}
                >
                  {isVisible ? (
                    <Eye className="w-5 h-5" />
                  ) : (
                    <EyeOff className="w-5 h-5" />
                  )}
                </button>
              </div>
            );
          })}
        </div>

        <div className="px-6 py-4 border-t border-slate-200 bg-slate-50 flex justify-end">
          <button
            onClick={onClose}
            className="px-6 py-2.5 rounded-xl bg-sky-500 text-white font-medium hover:bg-sky-600 transition-colors"
          >
            完成
          </button>
        </div>
      </div>
    </div>
  );
}
