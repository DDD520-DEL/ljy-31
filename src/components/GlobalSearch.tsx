import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Search,
  X,
  Clock,
  MapPin,
  FileText,
  BarChart3,
  Trash2,
  Flame,
  ChevronRight,
} from 'lucide-react';
import {
  useIsOpen,
  useSetIsOpen,
  useSearchQueryState,
  useSetSearchQuery,
  useSearchResults,
  useSearchHistory,
  useAddToHistory,
  useClearHistory,
  useRemoveFromHistory,
  useHotRoads,
  useSetExpandRoad,
  useSetHighlightRecordId,
  useSetScrollToSection,
} from '../store/useSearchStore';
import { SearchResultItem, SearchResultType } from '../types';
import { cn } from '../lib/utils';

const typeConfig: Record<SearchResultType, { icon: typeof MapPin; label: string; color: string }> = {
  road: { icon: MapPin, label: '路段', color: 'text-sky-600 bg-sky-50' },
  record: { icon: FileText, label: '记录', color: 'text-emerald-600 bg-emerald-50' },
  statistic: { icon: BarChart3, label: '统计', color: 'text-purple-600 bg-purple-50' },
};

export default function GlobalSearch() {
  const navigate = useNavigate();
  const isOpen = useIsOpen();
  const setIsOpen = useSetIsOpen();
  const searchQuery = useSearchQueryState();
  const setSearchQuery = useSetSearchQuery();
  const { results, hasQuery } = useSearchResults(searchQuery);
  const history = useSearchHistory();
  const addToHistory = useAddToHistory();
  const clearHistory = useClearHistory();
  const removeFromHistory = useRemoveFromHistory();
  const hotRoads = useHotRoads();
  const setExpandRoad = useSetExpandRoad();
  const setHighlightRecordId = useSetHighlightRecordId();
  const setScrollToSection = useSetScrollToSection();

  const inputRef = useRef<HTMLInputElement>(null);
  const overlayRef = useRef<HTMLDivElement>(null);
  const [localInput, setLocalInput] = useState('');

  useEffect(() => {
    if (isOpen && inputRef.current) {
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  }, [isOpen]);

  useEffect(() => {
    setLocalInput(searchQuery);
  }, [searchQuery]);

  const handleOpen = () => {
    setIsOpen(true);
  };

  const handleClose = () => {
    setIsOpen(false);
    setSearchQuery('');
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setLocalInput(val);
    setSearchQuery(val);
  };

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (localInput.trim()) {
      addToHistory(localInput.trim());
    }
  };

  const handleClickHistory = (keyword: string) => {
    setLocalInput(keyword);
    setSearchQuery(keyword);
  };

  const handleClickHotRoad = (road: string) => {
    setLocalInput(road);
    setSearchQuery(road);
    addToHistory(road);
  };

  const handleResultClick = (item: SearchResultItem) => {
    addToHistory(localInput.trim() || item.title);
    setIsOpen(false);
    setSearchQuery('');

    if (item.type === 'road' && item.target.roadName) {
      setExpandRoad(item.target.roadName);
      setHighlightRecordId(null);
      setScrollToSection(null);
      navigate('/schedule');
    } else if (item.type === 'record' && item.target.recordId) {
      setExpandRoad(null);
      setHighlightRecordId(item.target.recordId);
      setScrollToSection(null);
      navigate('/history');
    } else if (item.type === 'statistic' && item.target.statisticSection) {
      setExpandRoad(null);
      setHighlightRecordId(null);
      setScrollToSection(item.target.statisticSection);
      navigate('/statistics');
    }
  };

  const groupedResults: Record<SearchResultType, SearchResultItem[]> = {
    road: [],
    record: [],
    statistic: [],
  };
  results.forEach((r) => groupedResults[r.type].push(r));

  if (!isOpen) {
    return (
      <div className="fixed bottom-16 left-0 right-0 z-40 px-4 pb-2">
        <div className="max-w-2xl mx-auto">
          <button
            onClick={handleOpen}
            className="w-full flex items-center gap-3 px-4 py-3 bg-white/95 backdrop-blur-sm rounded-2xl shadow-lg border border-slate-200 hover:border-sky-300 hover:shadow-xl transition-all group"
          >
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-sky-500 to-blue-600 flex items-center justify-center flex-shrink-0 group-hover:scale-105 transition-transform">
              <Search className="w-5 h-5 text-white" />
            </div>
            <div className="flex-1 text-left">
              <p className="text-slate-700 font-medium text-sm">搜索路段、记录或统计指标</p>
              <p className="text-xs text-slate-400 mt-0.5">
                {hotRoads.length > 0 && `热门: ${hotRoads.slice(0, 3).join(' · ')}`}
              </p>
            </div>
            <div className="text-xs text-slate-400 border border-slate-200 rounded-md px-2 py-1">
              /
            </div>
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-50">
      <div
        ref={overlayRef}
        className="absolute inset-0 bg-black/40 backdrop-blur-sm"
        onClick={handleClose}
      />

      <div className="absolute inset-x-0 top-0 max-w-2xl mx-auto h-full flex flex-col bg-gradient-to-b from-sky-50 to-white">
        <div className="bg-white/95 backdrop-blur-sm border-b border-slate-200 px-4 py-3 shadow-sm">
          <form onSubmit={handleSearchSubmit} className="flex items-center gap-3">
            <div className="flex-1 relative">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
              <input
                ref={inputRef}
                type="text"
                value={localInput}
                onChange={handleInputChange}
                placeholder="搜索路段名称、记录内容、统计指标..."
                className="w-full pl-12 pr-12 py-3 rounded-xl border-2 border-sky-200 bg-sky-50/50 focus:border-sky-500 focus:bg-white focus:ring-4 focus:ring-sky-500/10 outline-none transition-all text-slate-800 placeholder-slate-400 text-base"
                autoFocus
              />
              {localInput && (
                <button
                  type="button"
                  onClick={() => {
                    setLocalInput('');
                    setSearchQuery('');
                    inputRef.current?.focus();
                  }}
                  className="absolute right-3 top-1/2 -translate-y-1/2 w-7 h-7 rounded-full bg-slate-200 hover:bg-slate-300 flex items-center justify-center transition-colors"
                >
                  <X className="w-4 h-4 text-slate-600" />
                </button>
              )}
            </div>
            <button
              type="button"
              onClick={handleClose}
              className="px-4 py-3 rounded-xl text-slate-600 hover:bg-slate-100 font-medium text-sm transition-colors"
            >
              取消
            </button>
          </form>
        </div>

        <div className="flex-1 overflow-y-auto px-4 py-4 space-y-6">
          {!hasQuery ? (
            <>
              {history.length > 0 && (
                <section>
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <Clock className="w-4 h-4 text-slate-500" />
                      <h3 className="text-sm font-semibold text-slate-700">最近搜索</h3>
                    </div>
                    <button
                      onClick={clearHistory}
                      className="flex items-center gap-1.5 text-xs text-slate-400 hover:text-rose-500 transition-colors"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      清空
                    </button>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {history.map((item) => (
                      <div
                        key={item.keyword}
                        className="group flex items-center gap-1 bg-white border border-slate-200 rounded-xl pl-4 pr-1 py-2 hover:border-sky-300 hover:bg-sky-50/50 transition-all"
                      >
                        <button
                          onClick={() => handleClickHistory(item.keyword)}
                          className="text-sm text-slate-700 max-w-[200px] truncate"
                        >
                          {item.keyword}
                        </button>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            removeFromHistory(item.keyword);
                          }}
                          className="w-6 h-6 rounded-lg flex items-center justify-center text-slate-300 hover:text-rose-500 hover:bg-rose-50 transition-colors"
                        >
                          <X className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    ))}
                  </div>
                </section>
              )}

              {hotRoads.length > 0 && (
                <section>
                  <div className="flex items-center gap-2 mb-3">
                    <Flame className="w-4 h-4 text-orange-500" />
                    <h3 className="text-sm font-semibold text-slate-700">热门路段推荐</h3>
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    {hotRoads.map((road, idx) => (
                      <button
                        key={road}
                        onClick={() => handleClickHotRoad(road)}
                        className="flex items-center gap-3 bg-white border border-slate-200 rounded-xl p-3 hover:border-orange-300 hover:bg-orange-50/30 transition-all text-left group"
                      >
                        <div
                          className={cn(
                            'w-8 h-8 rounded-lg flex items-center justify-center font-bold text-sm flex-shrink-0',
                            idx === 0
                              ? 'bg-orange-100 text-orange-600'
                              : idx === 1
                              ? 'bg-amber-100 text-amber-600'
                              : idx === 2
                              ? 'bg-yellow-100 text-yellow-700'
                              : 'bg-slate-100 text-slate-500'
                          )}
                        >
                          {idx + 1}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-slate-800 truncate group-hover:text-orange-600 transition-colors">
                            {road}
                          </p>
                        </div>
                        <ChevronRight className="w-4 h-4 text-slate-300 group-hover:text-orange-400 transition-colors flex-shrink-0" />
                      </button>
                    ))}
                  </div>
                </section>
              )}

              <section>
                <div className="flex items-center gap-2 mb-3">
                  <Search className="w-4 h-4 text-slate-400" />
                  <h3 className="text-sm font-semibold text-slate-700">搜索说明</h3>
                </div>
                <div className="bg-white border border-slate-200 rounded-xl p-4 space-y-3">
                  <div className="flex items-start gap-3">
                    <div className="w-7 h-7 rounded-lg bg-sky-50 flex items-center justify-center flex-shrink-0 mt-0.5">
                      <MapPin className="w-4 h-4 text-sky-600" />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-slate-800">搜索路段</p>
                      <p className="text-xs text-slate-500 mt-0.5">
                        输入路段名称，快速跳转到时刻表并自动展开该路段详情
                      </p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <div className="w-7 h-7 rounded-lg bg-emerald-50 flex items-center justify-center flex-shrink-0 mt-0.5">
                      <FileText className="w-4 h-4 text-emerald-600" />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-slate-800">搜索记录</p>
                      <p className="text-xs text-slate-500 mt-0.5">
                        按路段或备注搜索历史记录，跳转后自动高亮并定位
                      </p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <div className="w-7 h-7 rounded-lg bg-purple-50 flex items-center justify-center flex-shrink-0 mt-0.5">
                      <BarChart3 className="w-4 h-4 text-purple-600" />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-slate-800">搜索统计指标</p>
                      <p className="text-xs text-slate-500 mt-0.5">
                        输入关键词如"溅水率""热力图""排行"等，快速定位到对应图表
                      </p>
                    </div>
                  </div>
                </div>
              </section>
            </>
          ) : results.length > 0 ? (
            <div className="space-y-6">
              {(Object.keys(groupedResults) as SearchResultType[]).map((type) => {
                const typeResults = groupedResults[type];
                if (typeResults.length === 0) return null;
                const config = typeConfig[type];
                const TypeIcon = config.icon;

                return (
                  <section key={type}>
                    <div className="flex items-center gap-2 mb-3">
                      <div
                        className={cn(
                          'w-6 h-6 rounded-lg flex items-center justify-center',
                          config.color
                        )}
                      >
                        <TypeIcon className="w-3.5 h-3.5" />
                      </div>
                      <h3 className="text-sm font-semibold text-slate-700">
                        {config.label}
                        <span className="ml-2 text-xs font-normal text-slate-400">
                          {typeResults.length} 条结果
                        </span>
                      </h3>
                    </div>
                    <div className="space-y-2">
                      {typeResults.map((item) => (
                        <button
                          key={item.id}
                          onClick={() => handleResultClick(item)}
                          className="w-full flex items-start gap-3 bg-white border border-slate-200 hover:border-sky-300 rounded-xl p-3 text-left transition-all hover:shadow-md group"
                        >
                          <div
                            className={cn(
                              'w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 group-hover:scale-110 transition-transform',
                              config.color
                            )}
                          >
                            <TypeIcon className="w-5 h-5" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2">
                              <p className="text-sm font-medium text-slate-800 truncate">
                                <HighlightText
                                  text={item.title}
                                  query={localInput.trim()}
                                />
                              </p>
                            </div>
                            {item.subtitle && (
                              <p className="text-xs text-slate-500 mt-1 line-clamp-1">
                                {item.subtitle}
                              </p>
                            )}
                            {item.matchField && (
                              <div className="flex items-center gap-1.5 mt-1.5">
                                <span className="text-[10px] px-1.5 py-0.5 rounded bg-slate-100 text-slate-500">
                                  匹配: {item.matchField}
                                </span>
                                {item.matchText && (
                                  <span className="text-[10px] text-slate-400 truncate max-w-[160px]">
                                    “
                                    <HighlightText
                                      text={item.matchText}
                                      query={localInput.trim()}
                                    />
                                    ”
                                  </span>
                                )}
                              </div>
                            )}
                          </div>
                          <ChevronRight className="w-4 h-4 text-slate-300 group-hover:text-sky-500 transition-colors flex-shrink-0 mt-1" />
                        </button>
                      ))}
                    </div>
                  </section>
                );
              })}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-16 text-center">
              <div className="w-20 h-20 rounded-full bg-slate-100 flex items-center justify-center mb-4">
                <Search className="w-10 h-10 text-slate-300" />
              </div>
              <h3 className="text-lg font-semibold text-slate-700 mb-1">未找到相关结果</h3>
              <p className="text-sm text-slate-500 mb-6">
                尝试搜索路段名称、记录内容或统计指标关键词
              </p>
              <div className="flex flex-wrap justify-center gap-2">
                {hotRoads.slice(0, 4).map((road) => (
                  <button
                    key={road}
                    onClick={() => handleClickHotRoad(road)}
                    className="text-xs px-3 py-1.5 rounded-lg bg-sky-50 text-sky-700 hover:bg-sky-100 transition-colors"
                  >
                    {road}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function HighlightText({ text, query }: { text: string; query: string }) {
  if (!query) return <>{text}</>;

  const lowerText = text.toLowerCase();
  const lowerQuery = query.toLowerCase();
  const idx = lowerText.indexOf(lowerQuery);

  if (idx === -1) return <>{text}</>;

  const before = text.slice(0, idx);
  const match = text.slice(idx, idx + query.length);
  const after = text.slice(idx + query.length);

  return (
    <>
      {before}
      <mark className="bg-yellow-200/70 text-slate-900 rounded px-0.5 font-medium">
        {match}
      </mark>
      {after}
    </>
  );
}
