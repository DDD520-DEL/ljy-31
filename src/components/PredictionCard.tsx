import { getProbabilityColor, getProbabilityBgLight, getConfidenceLabel, getConfidenceColor } from '../utils/format';
import { RoadPrediction } from '../types';
import { Droplets, MapPin, TrendingUp } from 'lucide-react';

interface PredictionCardProps {
  prediction: RoadPrediction;
  onClick?: () => void;
  highlight?: boolean;
}

export default function PredictionCard({ prediction, onClick, highlight = false }: PredictionCardProps) {
  const splashPercent = Math.round(prediction.splashProbability * 100);

  return (
    <div
      onClick={onClick}
      className={`bg-white rounded-2xl p-5 shadow-sm border border-slate-100 cursor-pointer transition-all duration-300 hover:shadow-md hover:-translate-y-0.5 ${
        highlight ? 'ring-2 ring-sky-500 ring-offset-2' : ''
      }`}
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
        <div className="text-right">
          <div className="flex items-center gap-1 text-sm">
            <Droplets className={`w-4 h-4 ${splashPercent >= 40 ? 'text-orange-500' : 'text-slate-400'}`} />
            <span className={`font-medium ${splashPercent >= 40 ? 'text-orange-600' : 'text-slate-600'}`}>
              {splashPercent}%
            </span>
          </div>
          <p className="text-xs text-slate-400">溅水概率</p>
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
          <div className="flex-1 h-2 bg-slate-100 rounded-full overflow-hidden">
            <div
              className={`h-full ${getProbabilityColor(prediction.splashProbability)} transition-all duration-500`}
              style={{ width: `${Math.min(splashPercent + 20, 100)}%` }}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
