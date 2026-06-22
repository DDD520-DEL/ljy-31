import { useState, useCallback } from 'react';
import { GripVertical, EyeOff } from 'lucide-react';
import { CardLayout, WidgetType, WIDGET_CONFIGS } from '../types';
import { getWidgetComponent } from './widgets/WidgetRegistry';
import {
  useReorderCards,
  useToggleCardVisibility,
  useIsDashboardEditing,
} from '../store/useDashboardStore';
import { cn } from '../lib/utils';

interface DraggableCardGridProps {
  cards: CardLayout[];
}

export default function DraggableCardGrid({ cards }: DraggableCardGridProps) {
  const isEditing = useIsDashboardEditing();
  const reorderCards = useReorderCards();
  const toggleCardVisibility = useToggleCardVisibility();
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);
  const [dragOverIndex, setDragOverIndex] = useState<number | null>(null);

  const visibleCards = cards.filter((c) => c.visible);

  const handleDragStart = useCallback(
    (e: React.DragEvent, index: number) => {
      if (!isEditing) return;
      setDraggedIndex(index);
      e.dataTransfer.effectAllowed = 'move';
      e.dataTransfer.setData('text/plain', index.toString());
    },
    [isEditing]
  );

  const handleDragOver = useCallback(
    (e: React.DragEvent, index: number) => {
      e.preventDefault();
      if (!isEditing) return;
      e.dataTransfer.dropEffect = 'move';
      setDragOverIndex(index);
    },
    [isEditing]
  );

  const handleDragLeave = useCallback(() => {
    setDragOverIndex(null);
  }, []);

  const handleDrop = useCallback(
    (e: React.DragEvent, toIndex: number) => {
      e.preventDefault();
      if (!isEditing || draggedIndex === null) return;

      const fromIndex = draggedIndex;
      if (fromIndex !== toIndex) {
        reorderCards(fromIndex, toIndex);
      }

      setDraggedIndex(null);
      setDragOverIndex(null);
    },
    [isEditing, draggedIndex, reorderCards]
  );

  const handleDragEnd = useCallback(() => {
    setDraggedIndex(null);
    setDragOverIndex(null);
  }, []);

  const handleHideCard = (e: React.MouseEvent, type: WidgetType) => {
    e.stopPropagation();
    toggleCardVisibility(type);
  };

  if (visibleCards.length === 0) {
    return (
      <div className="text-center py-12">
        <div className="w-20 h-20 mx-auto rounded-full bg-slate-100 flex items-center justify-center mb-4">
          <EyeOff className="w-10 h-10 text-slate-400" />
        </div>
        <h3 className="text-lg font-semibold text-slate-800 mb-2">暂无显示的卡片</h3>
        <p className="text-slate-500 text-sm">点击右上角编辑按钮，选择要显示的卡片</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {visibleCards.map((card, index) => {
        const config = WIDGET_CONFIGS[card.type];
        const WidgetComponent = getWidgetComponent(card.type);
        const isDragging = draggedIndex === index;
        const isDragOver = dragOverIndex === index;

        if (!WidgetComponent) return null;

        return (
          <div
            key={card.type}
            className={cn(
              'relative transition-all duration-200',
              isDragging && 'opacity-50 scale-98',
              isDragOver && 'ring-2 ring-sky-500 ring-offset-2 rounded-2xl',
              isEditing && 'group'
            )}
            draggable={isEditing}
            onDragStart={(e) => handleDragStart(e, index)}
            onDragOver={(e) => handleDragOver(e, index)}
            onDragLeave={handleDragLeave}
            onDrop={(e) => handleDrop(e, index)}
            onDragEnd={handleDragEnd}
          >
            {isEditing && (
              <>
                <div className="absolute -left-2 top-1/2 -translate-y-1/2 z-10 opacity-0 group-hover:opacity-100 transition-opacity cursor-grab active:cursor-grabbing">
                  <div className="w-8 h-12 bg-white rounded-lg shadow-md border border-slate-200 flex items-center justify-center hover:bg-slate-50">
                    <GripVertical className="w-4 h-4 text-slate-400" />
                  </div>
                </div>
                <div className="absolute -right-2 top-4 z-10 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button
                    onClick={(e) => handleHideCard(e, card.type)}
                    className="w-8 h-8 bg-white rounded-lg shadow-md border border-slate-200 flex items-center justify-center hover:bg-red-50 hover:border-red-200 transition-colors"
                    title="隐藏此卡片"
                  >
                    <EyeOff className="w-4 h-4 text-slate-400 hover:text-red-500" />
                  </button>
                </div>
                <div className="absolute -top-2 left-1/2 -translate-x-1/2 z-10 opacity-0 group-hover:opacity-100 transition-opacity">
                  <div className="px-2 py-1 bg-sky-500 text-white text-xs rounded-md shadow-md whitespace-nowrap">
                    {config.title}
                  </div>
                </div>
              </>
            )}
            <WidgetComponent />
          </div>
        );
      })}
    </div>
  );
}
