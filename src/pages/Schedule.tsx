import { useState, useMemo } from 'react';
import { Search, MapPin, Droplets, Clock, ChevronDown, ChevronUp, Filter, CloudRain } from 'lucide-react';
import { usePredictions, useWeather, useGetWeatherAdjustment, useRefreshWeather, useIsWeatherLoading } from '../store/useAppStore';
import { Card, CardContent, CardHeader, CardTitle } from '../components/Card';
import PredictionCard from '../components/PredictionCard';
import TimeAxis from '../components/TimeAxis';
import { getProbabilityColor, getConfidenceLabel, getConfidenceColor } from '../utils/format';
import { getProbabilityChangeText, getProbabilityChangeColor } from '../utils/weather';
import { cn } from '../lib/utils';

type SortType = 'recordCount' | 'splashProbability' | 'roadName';

export default function Schedule() {
  const predictions = usePredictions();
  const weather = useWeather();
  const getWeatherAdjustment = useGetWeatherAdjustment();
  const refreshWeather = useRefreshWeather();
  const isWeatherLoading = useIsWeatherLoading();
  const [searchQuery, setSearchQuery] = useState('');
  const [sortType, setSortType] = useState<SortType>('recordCount');
  const [expandedRoad, setExpandedRoad] = useState<string | null>(null);
  const [showSortMenu, setShowSortMenu] = useState(false);

  const filteredPredictions = useMemo(() => {
    let result = [...predictions];

    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      result = result.filter((p) => p.roadName.toLowerCase().includes(query));
    }

    switch (sortType) {
      case 'recordCount':
        result.sort((a, b) => b.recordCount - a.recordCount);
        break;
      case 'splashProbability':
        result.sort((a, b) => b.splashProbability - a.splashProbability);
        break;
      case 'roadName':
        result.sort((a, b) => a.roadName.localeCompare(b.roadName));
        break;
    }

    return result;
  }, [predictions, searchQuery, sortType]);

  const timeAxisData = Array.from({ length: 24 }, (_, i) => ({
    hour: i,
    count: predictions.reduce((sum, p) => {
      return sum + p.predictedTimes.filter((t) => t.hour === i).length;
    }, 0),
  }));

  const sortOptions: Array<{ value: SortType; label: string }> = [
    { value: 'recordCount', label: '记录最多' },
    { value: 'splashProbability', label: '溅水概率' },
    { value: 'roadName', label: '路段名称' },
  ];

  return (
    <div className="p-4 space-y-6">
      <div className="pt-2">
        <h1 className="text-2xl font-bold text-slate-800 mb-1">洒水车时刻表</h1>
        <p className="text-slate-500 text-sm">各路段洒水车出没预测时间</p>
      </div>

      {weather && (
        <Card className="border-2 border-sky-200 bg-sky-50/50">
          <CardContent className="py-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="text-3xl">{weather.icon}</div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-slate-800">{weather.description}</span>
                    <span className="text-sm text-slate-500">{weather.temperature}°C</span>
                  </div>
                  <p className="text-sm text-slate-500">
                    已根据天气调整预测概率
                    {weather.type !== 'cloudy' && (
                      <span className="ml-1 text-sky-600 font-medium">
                        {getProbabilityChangeText(getWeatherAdjustment(0.5))}
                      </span>
                    )}
                  </p>
                </div>
              </div>
              <button
                onClick={() => refreshWeather()}
                disabled={isWeatherLoading}
                className="w-10 h-10 rounded-xl bg-white shadow-sm border border-slate-100 flex items-center justify-center text-slate-600 hover:bg-slate-50 transition-colors disabled:opacity-50"
              >
                <CloudRain className={cn('w-5 h-5', isWeatherLoading && 'animate-spin')} />
              </button>
            </div>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle>24小时出没分布</CardTitle>
        </CardHeader>
        <CardContent>
          <TimeAxis data={timeAxisData} />
        </CardContent>
      </Card>

      <div className="flex items-center gap-3">
        <div className="flex-1 relative">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="搜索路段..."
            className="w-full pl-12 pr-4 py-3 rounded-xl border border-slate-200 bg-white focus:border-sky-500 focus:ring-2 focus:ring-sky-500/20 outline-none transition-all text-slate-800 placeholder-slate-400"
          />
        </div>
        <div className="relative">
          <button
            onClick={() => setShowSortMenu(!showSortMenu)}
            className="flex items-center gap-2 px-4 py-3 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 transition-colors"
          >
            <Filter className="w-5 h-5 text-slate-500" />
            <span className="text-sm font-medium text-slate-700">
              {sortOptions.find((o) => o.value === sortType)?.label}
            </span>
          </button>
          {showSortMenu && (
            <div className="absolute right-0 top-full mt-2 bg-white rounded-xl shadow-lg border border-slate-100 overflow-hidden z-10 min-w-[140px]">
              {sortOptions.map((option) => (
                <button
                  key={option.value}
                  onClick={() => {
                    setSortType(option.value);
                    setShowSortMenu(false);
                  }}
                  className={cn(
                    'w-full px-4 py-3 text-left text-sm transition-colors border-b border-slate-50 last:border-b-0',
                    sortType === option.value
                      ? 'bg-sky-50 text-sky-700 font-medium'
                      : 'text-slate-600 hover:bg-slate-50'
                  )}
                >
                  {option.label}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {filteredPredictions.length > 0 ? (
        <div className="space-y-4">
          {filteredPredictions.map((prediction) => (
            <div key={prediction.roadName} className="space-y-3">
              <PredictionCard
                prediction={prediction}
                onClick={() =>
                  setExpandedRoad(expandedRoad === prediction.roadName ? null : prediction.roadName)
                }
              />

              {expandedRoad === prediction.roadName && (
                <Card className="border-2 border-sky-100 bg-sky-50/30">
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-3 gap-4 text-center">
                      <div>
                        <p className="text-2xl font-bold text-slate-800">{prediction.recordCount}</p>
                        <p className="text-xs text-slate-500">总记录数</p>
                      </div>
                      <div>
                        <p className="text-2xl font-bold text-orange-600">{prediction.splashCount}</p>
                        <p className="text-xs text-slate-500">被溅次数</p>
                      </div>
                      <div>
                        <div className="flex items-center justify-center gap-1">
                          <p className="text-2xl font-bold text-sky-600">
                            {Math.round(getWeatherAdjustment(prediction.splashProbability).adjustedProbability * 100)}%
                          </p>
                          {weather && getWeatherAdjustment(prediction.splashProbability).adjustmentFactor !== 1.0 && (
                            <span className={cn(
                              'text-sm font-medium',
                              getProbabilityChangeColor(getWeatherAdjustment(prediction.splashProbability))
                            )}>
                              {getProbabilityChangeText(getWeatherAdjustment(prediction.splashProbability))}
                            </span>
                          )}
                        </div>
                        <p className="text-xs text-slate-500">
                          溅水概率
                          {weather && getWeatherAdjustment(prediction.splashProbability).adjustmentFactor !== 1.0 && (
                            <span className="text-slate-400"> · 原始 {Math.round(prediction.splashProbability * 100)}%</span>
                          )}
                        </p>
                      </div>
                    </div>

                    <div className="space-y-3">
                      <p className="text-sm font-medium text-slate-700 flex items-center gap-2">
                        <Clock className="w-4 h-4" />
                        预测经过时间
                      </p>
                      <div className="space-y-2">
                        {prediction.predictedTimes.map((time, idx) => {
                          const adjusted = getWeatherAdjustment(time.probability);
                          return (
                            <div
                              key={idx}
                              className="flex items-center justify-between p-3 bg-white rounded-xl"
                            >
                              <div className="flex items-center gap-3">
                                <div
                                  className={`w-3 h-3 rounded-full ${getProbabilityColor(adjusted.adjustedProbability)}`}
                                />
                                <span className="font-semibold text-slate-800">{time.averageTime}</span>
                              </div>
                              <div className="flex items-center gap-4">
                                <span
                                  className={`text-sm ${getConfidenceColor(time.confidence)}`}
                                >
                                  置信度 {getConfidenceLabel(time.confidence)} ({Math.round(time.confidence * 100)}%)
                                </span>
                                <div className="flex items-center gap-1">
                                  <span className="text-sm text-slate-500">
                                    溅水概率 {Math.round(adjusted.adjustedProbability * 100)}%
                                  </span>
                                  {weather && adjusted.adjustmentFactor !== 1.0 && (
                                    <span className={cn(
                                      'text-xs font-medium',
                                      getProbabilityChangeColor(adjusted)
                                    )}>
                                      {getProbabilityChangeText(adjusted)}
                                    </span>
                                  )}
                                </div>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>

                    <div className="space-y-3">
                      <p className="text-sm font-medium text-slate-700 flex items-center gap-2">
                        <Droplets className="w-4 h-4" />
                        小时分布
                      </p>
                      <div className="grid grid-cols-12 gap-1">
                        {Array.from({ length: 24 }, (_, i) => {
                          const count = prediction.hourlyDistribution[i] || 0;
                          const maxCount = Math.max(...Object.values(prediction.hourlyDistribution), 1);
                          const intensity = count / maxCount;
                          return (
                            <div
                              key={i}
                              className={`aspect-square rounded ${
                                intensity === 0
                                  ? 'bg-slate-100'
                                  : intensity < 0.3
                                  ? 'bg-sky-200'
                                  : intensity < 0.6
                                  ? 'bg-sky-400'
                                  : 'bg-sky-600'
                              }`}
                              title={`${i}:00 - ${count}次`}
                            />
                          );
                        })}
                      </div>
                      <div className="flex justify-between text-xs text-slate-400 px-1">
                        <span>0时</span>
                        <span>6时</span>
                        <span>12时</span>
                        <span>18时</span>
                        <span>24时</span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>
          ))}
        </div>
      ) : (
        <Card>
          <CardContent className="text-center py-12">
            <div className="w-20 h-20 mx-auto rounded-full bg-slate-100 flex items-center justify-center mb-4">
              <MapPin className="w-10 h-10 text-slate-400" />
            </div>
            <h3 className="text-lg font-semibold text-slate-800 mb-2">
              {searchQuery ? '未找到匹配路段' : '暂无预测数据'}
            </h3>
            <p className="text-slate-500 text-sm">
              {searchQuery ? '请尝试其他关键词' : '记录更多洒水车出没数据后，系统将自动生成预测'}
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
