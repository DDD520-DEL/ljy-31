import { useState } from 'react';
import { getProbabilityColor, getProbabilityBgLight, getConfidenceLabel, getConfidenceColor } from '../utils/format';
import { RoadPrediction } from '../types';
import { useIsFavoriteRoad, useToggleFavoriteRoad, useWeather } from '../store/useAppStore';
import { useRoadWeatherAdjustment } from '../hooks/useWeather';
import { Droplets, MapPin, TrendingUp, Star, CloudRain } from 'lucide-react';
import { cn } from '../lib/utils';

interface PredictionCardProps {
  prediction: RoadPrediction;
  onClick?: () => void;
  highlight?: boolean;
  showFavorite?: boolean;
}

export default function PredictionCard({
  prediction,
  onClick,
  highlight = false,
  showFavorite = true,
}: PredictionCardProps) {
  const weather = useWeather();
  const weatherAdjustment = useRoadWeatherAdjustment(prediction.splashProbability);
  const splashPercent = Math.round(prediction.splashProbability * 100);
  const isFavorite = useIsFavoriteRoad(prediction.roadName);
  const toggleFavorite = useToggleFavoriteRoad();
  const [isAnimating, setIsAnimating] = useState(false);

  const handleFavoriteClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsAnimating(true);
    toggleFavorite(prediction.roadName);
    setTimeout(() => setIsAnimating(false), 300);
  };

  return (
    <div
      onClick={onClick}
      className={cn(
        'bg-white rounded-2xl p-5 shadow-sm border border-slate-100 cursor-pointer transition-all duration-300 hover:shadow-md hover:-translate-y-0.5 relative',
        highlight && 'ring-2 ring-sky-500 ring-offset-2'
      )}
    >
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-sky-100 flex items-center justify-center">
            <MapPin className="w-5 h-5 text-sky-600" />
          </div>
          <div>
            <h3 className="font-semibold text-slate-800">{prediction.roadName}</h3>
            <p className="text-sm text-slate-500">{prediction.recordCount} 条记录</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {showFavorite && (
            <button
              onClick={handleFavoriteClick}
              className={cn(
                'w-8 h-8 rounded-xl flex items-center justify-center transition-all duration-200',
                isFavorite
                  ? 'bg-amber-100 hover:bg-amber-200'
                  : 'bg-slate-100 hover:bg-slate-200',
                isAnimating && 'scale-125'
              )}
            >
              <Star
                className={cn(
                  'w-4 h-4 transition-colors',
                  isFavorite ? 'text-amber-500 fill-amber-500' : 'text-slate-400'
                )}
              />
            </button>
          )}
          <div className="text-right">
            <div className="flex items-center gap-1 text-sm">
              <Droplets
                className={`w-4 h-4 ${weatherAdjustment.adjustedPercent >= 40 ? 'text-orange-500' : 'text-slate-400'}`}
              />
              <span
                className={`font-medium ${weatherAdjustment.adjustedPercent >= 40 ? 'text-orange-600' : 'text-slate-600'}`}
              >
                {weatherAdjustment.adjustedPercent}%
              </span>
              {weather && weatherAdjustment.adjustmentFactor !== 1.0 && (
                <span className={cn(
                  'text-xs font-medium ml-1',
                  weatherAdjustment.changeColor
                )}>
                  {weatherAdjustment.changeText}
                </span>
              )}
            </div>
            <p className="text-xs text-slate-400">
              溅水概率
              {weather && weatherAdjustment.adjustmentFactor !== 1.0 && (
                <span className="text-slate-300"> · 原始 {weatherAdjustment.originalPercent}%</span>
              )}
            </p>
          </div>
        </div>
      </div>

      <div className="space-y-2">
        <p className="text-xs font-medium text-slate-500 uppercase tracking-wide">预测时间</p>
        <div className="flex flex-wrap gap-2">
          {prediction.predictedTimes.slice(0, 4).map((time, idx) => (
            <div
              key={idx}
              className={`px-3 py-1.5 rounded-xl text-sm font-medium flex items-center gap-1.5 ${getProbabilityBgLight(time.probability)}`}
            >
              <span className="text-slate-800">{time.averageTime}</span>
              <span className={`text-xs ${getConfidenceColor(time.confidence)}`}>
                {getConfidenceLabel(time.confidence)}
              </span>
            </div>
          ))}
          {prediction.predictedTimes.length > 4 && (
            <div className="px-3 py-1.5 rounded-xl bg-slate-100 text-sm text-slate-500">
              +{prediction.predictedTimes.length - 4}
            </div>
          )}
        </div>
      </div>

      <div className="mt-4 pt-4 border-t border-slate-100">
        <div className="flex items-center gap-2 text-sm text-slate-500">
          <TrendingUp className="w-4 h-4" />
          <span>今日预测</span>
          {weather && weatherAdjustment.adjustmentFactor !== 1.0 && (
            <span className="flex items-center gap-1 text-xs">
              <CloudRain className="w-3 h-3" />
              <span className={weatherAdjustment.changeColor}>
                {weatherAdjustment.changeText}
              </span>
            </span>
          )}
          <div className="flex-1 h-2 bg-slate-100 rounded-full overflow-hidden">
            <div
              className={`h-full ${getProbabilityColor(weatherAdjustment.adjustedProbability)} transition-all duration-500`}
              style={{ width: `${Math.min(weatherAdjustment.adjustedPercent + 20, 100)}%` }}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
