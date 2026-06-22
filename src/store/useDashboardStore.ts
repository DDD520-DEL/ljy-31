import { create } from 'zustand';
import {
  DashboardCardState,
  CardLayout,
  WidgetType,
  WIDGET_CONFIGS,
  StorageKeys,
} from '../types';
import { storage } from '../utils/storage';

const getDefaultCards = (): CardLayout[] => {
  return Object.values(WIDGET_CONFIGS).map((config, index) => ({
    type: config.type,
    visible: config.defaultVisible,
    order: index,
  }));
};

const getInitialCards = (): CardLayout[] => {
  const stored = storage.get<CardLayout[] | null>(StorageKeys.DASHBOARD_CARDS, null);
  if (stored && stored.length > 0) {
    const validTypes = new Set(Object.keys(WIDGET_CONFIGS));
    const filtered = stored.filter((card) => validTypes.has(card.type));
    if (filtered.length === stored.length) {
      return filtered.sort((a, b) => a.order - b.order);
    }
  }
  return getDefaultCards();
};

export const useDashboardStore = create<DashboardCardState>((set, get) => ({
  cards: getInitialCards(),
  isEditing: false,

  setCards: (cards: CardLayout[]) => {
    const sorted = cards.sort((a, b) => a.order - b.order);
    storage.set(StorageKeys.DASHBOARD_CARDS, sorted);
    set({ cards: sorted });
  },

  toggleCardVisibility: (type: WidgetType) => {
    const { cards } = get();
    const newCards = cards.map((card) =>
      card.type === type ? { ...card, visible: !card.visible } : card
    );
    storage.set(StorageKeys.DASHBOARD_CARDS, newCards);
    set({ cards: newCards });
  },

  reorderCards: (fromIndex: number, toIndex: number) => {
    const { cards } = get();
    const visibleCards = cards.filter((c) => c.visible);
    const hiddenCards = cards.filter((c) => !c.visible);

    if (fromIndex < 0 || fromIndex >= visibleCards.length) return;
    if (toIndex < 0 || toIndex >= visibleCards.length) return;

    const newVisibleCards = [...visibleCards];
    const [removed] = newVisibleCards.splice(fromIndex, 1);
    newVisibleCards.splice(toIndex, 0, removed);

    const reordered = newVisibleCards.map((card, index) => ({
      ...card,
      order: index,
    }));

    const finalCards = [
      ...reordered,
      ...hiddenCards.map((card, index) => ({
        ...card,
        order: reordered.length + index,
      })),
    ];

    storage.set(StorageKeys.DASHBOARD_CARDS, finalCards);
    set({ cards: finalCards });
  },

  setIsEditing: (isEditing: boolean) => {
    set({ isEditing });
  },

  resetToDefault: () => {
    const defaultCards = getDefaultCards();
    storage.set(StorageKeys.DASHBOARD_CARDS, defaultCards);
    set({ cards: defaultCards });
  },
}));

export const useDashboardCards = () =>
  useDashboardStore((state) => state.cards);
export const useVisibleDashboardCards = () =>
  useDashboardStore((state) =>
    state.cards.filter((card) => card.visible).sort((a, b) => a.order - b.order)
  );
export const useIsDashboardEditing = () =>
  useDashboardStore((state) => state.isEditing);
export const useSetDashboardCards = () =>
  useDashboardStore((state) => state.setCards);
export const useToggleCardVisibility = () =>
  useDashboardStore((state) => state.toggleCardVisibility);
export const useReorderCards = () =>
  useDashboardStore((state) => state.reorderCards);
export const useSetIsDashboardEditing = () =>
  useDashboardStore((state) => state.setIsEditing);
export const useResetDashboardToDefault = () =>
  useDashboardStore((state) => state.resetToDefault);
