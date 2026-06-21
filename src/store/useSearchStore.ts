import { create } from 'zustand';
import {
  SearchHistoryItem,
  SearchResultItem,
  StorageKeys,
} from '../types';
import { storage } from '../utils/storage';
import {
  useRecords,
  usePredictions,
  useStatistics,
} from './useAppStore';

const MAX_HISTORY = 10;
const MAX_RESULTS_PER_TYPE = 5;

interface SearchState {
  isOpen: boolean;
  searchQuery: string;
  history: SearchHistoryItem[];
  expandRoad: string | null;
  highlightRecordId: string | null;
  scrollToSection: string | null;
  setIsOpen: (open: boolean) => void;
  setSearchQuery: (query: string) => void;
  addToHistory: (keyword: string) => void;
  clearHistory: () => void;
  removeFromHistory: (keyword: string) => void;
  setExpandRoad: (road: string | null) => void;
  setHighlightRecordId: (id: string | null) => void;
  setScrollToSection: (section: string | null) => void;
  clearNavigationParams: () => void;
}

const getInitialHistory = (): SearchHistoryItem[] => {
  return storage.get<SearchHistoryItem[]>(StorageKeys.SEARCH_HISTORY, []);
};

export const useSearchStore = create<SearchState>((set, get) => ({
  isOpen: false,
  searchQuery: '',
  history: getInitialHistory(),
  expandRoad: null,
  highlightRecordId: null,
  scrollToSection: null,

  setIsOpen: (open) => set({ isOpen: open }),
  setSearchQuery: (query) => set({ searchQuery: query }),

  addToHistory: (keyword) => {
    if (!keyword.trim()) return;
    const trimmed = keyword.trim();
    const { history } = get();
    const filtered = history.filter((h) => h.keyword !== trimmed);
    const newHistory = [
      { keyword: trimmed, timestamp: Date.now() },
      ...filtered,
    ].slice(0, MAX_HISTORY);
    storage.set(StorageKeys.SEARCH_HISTORY, newHistory);
    set({ history: newHistory });
  },

  clearHistory: () => {
    storage.set(StorageKeys.SEARCH_HISTORY, []);
    set({ history: [] });
  },

  removeFromHistory: (keyword) => {
    const { history } = get();
    const newHistory = history.filter((h) => h.keyword !== keyword);
    storage.set(StorageKeys.SEARCH_HISTORY, newHistory);
    set({ history: newHistory });
  },

  setExpandRoad: (road) => set({ expandRoad: road }),
  setHighlightRecordId: (id) => set({ highlightRecordId: id }),
  setScrollToSection: (section) => set({ scrollToSection: section }),

  clearNavigationParams: () =>
    set({
      expandRoad: null,
      highlightRecordId: null,
      scrollToSection: null,
    }),
}));

export const useSearchResults = (
  query: string
): { results: SearchResultItem[]; hasQuery: boolean } => {
  const records = useRecords();
  const predictions = usePredictions();
  const statistics = useStatistics();

  if (!query.trim()) {
    return { results: [], hasQuery: false };
  }

  const lowerQuery = query.toLowerCase().trim();
  const results: SearchResultItem[] = [];

  const matchedRoads = predictions
    .filter((p) => p.roadName.toLowerCase().includes(lowerQuery))
    .slice(0, MAX_RESULTS_PER_TYPE)
    .map<SearchResultItem>((p) => ({
      type: 'road',
      id: `road-${p.roadName}`,
      title: p.roadName,
      subtitle: `${p.recordCount} 条记录 · 溅水率 ${Math.round(p.splashProbability * 100)}%`,
      matchField: '路段名称',
      matchText: p.roadName,
      target: { roadName: p.roadName },
    }));
  results.push(...matchedRoads);

  const matchedRecords = records
    .filter(
      (r) =>
        r.road.toLowerCase().includes(lowerQuery) ||
        (r.note && r.note.toLowerCase().includes(lowerQuery))
    )
    .slice(0, MAX_RESULTS_PER_TYPE)
    .map<SearchResultItem>((r) => {
      const matchInNote =
        r.note && r.note.toLowerCase().includes(lowerQuery);
      return {
        type: 'record',
        id: `record-${r.id}`,
        title: `${r.date} ${r.time} · ${r.road}`,
        subtitle: matchInNote
          ? `备注: ${r.note}`
          : r.isSplashed
          ? '已被溅到'
          : '未被溅到',
        matchField: matchInNote ? '备注' : '路段',
        matchText: matchInNote ? r.note! : r.road,
        target: { recordId: r.id, roadName: r.road },
      };
    });
  results.push(...matchedRecords);

  if (statistics) {
    const statKeywords: Array<{
      keyword: string;
      section: SearchResultItem['target']['statisticSection'];
      title: string;
      subtitle: string;
    }> = [
      {
        keyword: '总记录',
        section: 'overview',
        title: '总记录数统计',
        subtitle: `共 ${statistics.totalRecords} 条记录`,
      },
      {
        keyword: '记录数',
        section: 'overview',
        title: '总记录数统计',
        subtitle: `共 ${statistics.totalRecords} 条记录`,
      },
      {
        keyword: '总数',
        section: 'overview',
        title: '总记录数统计',
        subtitle: `共 ${statistics.totalRecords} 条记录`,
      },
      {
        keyword: '被溅',
        section: 'overview',
        title: '被溅总次数',
        subtitle: `共被溅 ${statistics.totalSplashed} 次`,
      },
      {
        keyword: '溅水',
        section: 'overview',
        title: '整体溅水率',
        subtitle: `溅水率 ${Math.round(statistics.splashRate * 100)}%`,
      },
      {
        keyword: '溅水率',
        section: 'splashRate',
        title: '路段溅水率排名',
        subtitle: `溅水率 ${Math.round(statistics.splashRate * 100)}%`,
      },
      {
        keyword: '小时',
        section: 'hourly',
        title: '24小时出没分布',
        subtitle: '按小时展示洒水车出没频率',
      },
      {
        keyword: '时间',
        section: 'hourly',
        title: '24小时出没分布',
        subtitle: '按小时展示洒水车出没频率',
      },
      {
        keyword: '时段',
        section: 'hourly',
        title: '24小时出没分布',
        subtitle: '按小时展示洒水车出没频率',
      },
      {
        keyword: '趋势',
        section: 'monthly',
        title: '近30天趋势',
        subtitle: '近30天记录变化趋势',
      },
      {
        keyword: '月',
        section: 'monthly',
        title: '近30天趋势',
        subtitle: '近30天记录变化趋势',
      },
      {
        keyword: '热力图',
        section: 'heatmap',
        title: '出没热力图',
        subtitle: '按星期和小时展示出没频率',
      },
      {
        keyword: '热力',
        section: 'heatmap',
        title: '出没热力图',
        subtitle: '按星期和小时展示出没频率',
      },
      {
        keyword: '星期',
        section: 'heatmap',
        title: '出没热力图',
        subtitle: '按星期和小时展示出没频率',
      },
      {
        keyword: '排行',
        section: 'topRoads',
        title: '高发路段排行',
        subtitle: '记录最多的TOP5路段',
      },
      {
        keyword: '排名',
        section: 'topRoads',
        title: '高发路段排行',
        subtitle: '记录最多的TOP5路段',
      },
      {
        keyword: '高发',
        section: 'topRoads',
        title: '高发路段排行',
        subtitle: '记录最多的TOP5路段',
      },
      {
        keyword: '路段',
        section: 'topRoads',
        title: '高发路段排行',
        subtitle: '记录最多的TOP5路段',
      },
    ];

    const matchedStats = statKeywords
      .filter((s) => s.keyword.includes(lowerQuery) || lowerQuery.includes(s.keyword))
      .slice(0, MAX_RESULTS_PER_TYPE)
      .map<SearchResultItem>((s, idx) => ({
        type: 'statistic',
        id: `stat-${s.section}-${idx}`,
        title: s.title,
        subtitle: s.subtitle,
        matchField: '统计指标',
        matchText: s.keyword,
        target: { statisticSection: s.section },
      }));

    const matchedTopRoads = statistics.topRoads
      .filter((r) => r.road.toLowerCase().includes(lowerQuery))
      .slice(0, 3)
      .map<SearchResultItem>((r) => ({
        type: 'statistic',
        id: `stat-road-${r.road}`,
        title: `统计: ${r.road}`,
        subtitle: `${r.count} 次记录 · 溅水率 ${Math.round(r.splashRate * 100)}%`,
        matchField: '高发路段',
        matchText: r.road,
        target: { statisticSection: 'topRoads' },
      }));

    results.push(...matchedStats, ...matchedTopRoads);
  }

  return { results, hasQuery: true };
};

export const useHotRoads = (): string[] => {
  const predictions = usePredictions();
  return predictions
    .slice()
    .sort((a, b) => b.recordCount - a.recordCount)
    .slice(0, 6)
    .map((p) => p.roadName);
};

export const useIsOpen = () => useSearchStore((s) => s.isOpen);
export const useSetIsOpen = () => useSearchStore((s) => s.setIsOpen);
export const useSearchQueryState = () => useSearchStore((s) => s.searchQuery);
export const useSetSearchQuery = () => useSearchStore((s) => s.setSearchQuery);
export const useSearchHistory = () => useSearchStore((s) => s.history);
export const useAddToHistory = () => useSearchStore((s) => s.addToHistory);
export const useClearHistory = () => useSearchStore((s) => s.clearHistory);
export const useRemoveFromHistory = () => useSearchStore((s) => s.removeFromHistory);
export const useExpandRoad = () => useSearchStore((s) => s.expandRoad);
export const useSetExpandRoad = () => useSearchStore((s) => s.setExpandRoad);
export const useHighlightRecordId = () => useSearchStore((s) => s.highlightRecordId);
export const useSetHighlightRecordId = () => useSearchStore((s) => s.setHighlightRecordId);
export const useScrollToSection = () => useSearchStore((s) => s.scrollToSection);
export const useSetScrollToSection = () => useSearchStore((s) => s.setScrollToSection);
export const useClearNavigationParams = () => useSearchStore((s) => s.clearNavigationParams);
