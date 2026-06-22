import { CloudRain, RefreshCw, AlertTriangle } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '../Card';
import {
  useWeatherData,
  useWeatherHint,
  useOverallWeatherRisk,
} from '../../hooks/useWeather';
import { useSettings } from '../../store/useAppStore';
import { Droplets as DropletsIcon, Wind } from 'lucide-react';
import { cn } from '../../lib/utils';

export default function WeatherAlertWidget() {
  const settings = useSettings();
  const { weather, isWeatherLoading, refreshWeather } = useWeatherData();
  const weatherHint = useWeatherHint();
  const weatherRisk = useOverallWeatherRisk();

  if (!settings.weatherNotificationEnabled) {
    return null;
  }

  return (
    <Card
      className={cn('border-2 overflow-hidden', weatherRisk.borderColor, weatherRisk.bgColor)}
    >
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <CloudRain className={cn('w-5 h-5', weatherRisk.riskColor)} />
            <CardTitle>天气预警</CardTitle>
          </div>
          <button
            onClick={() => refreshWeather()}
            disabled={isWeatherLoading}
            className="w-8 h-8 rounded-lg flex items-center justify-center hover:bg-white/50 transition-colors disabled:opacity-50"
          >
            <RefreshCw
              className={cn(
                'w-4 h-4',
                isWeatherLoading && 'animate-spin',
                weatherRisk.riskColor
              )}
            />
          </button>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-start gap-4">
          <div className="text-4xl">{isWeatherLoading ? '🌤️' : weatherHint.icon}</div>
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-1">
              <span className="text-lg font-bold text-slate-800">
                {isWeatherLoading ? '加载中...' : weatherHint.description}
              </span>
              <span
                className={cn(
                  'px-2 py-0.5 rounded-full text-xs font-medium',
                  weatherRisk.bgColor,
                  weatherRisk.riskColor
                )}
              >
                {weatherRisk.riskText}
              </span>
            </div>
            {weather && (
              <div className="flex flex-wrap gap-3 text-sm text-slate-600">
                <span className="flex items-center gap-1">
                  🌡️ {weather.temperature}°C
                </span>
                <span className="flex items-center gap-1">
                  <DropletsIcon className="w-3.5 h-3.5" />
                  {weather.humidity}%
                </span>
                <span className="flex items-center gap-1">
                  <Wind className="w-3.5 h-3.5" />
                  {weather.windSpeed}km/h
                </span>
              </div>
            )}
          </div>
        </div>

        <div className="bg-white/60 rounded-xl p-3 backdrop-blur-sm">
          <div className="flex items-start gap-2">
            <AlertTriangle className={cn('w-4 h-4 flex-shrink-0 mt-0.5', weatherRisk.riskColor)} />
            <div>
              <p className={cn('text-sm font-medium mb-0.5', weatherRisk.riskColor)}>
                {weatherHint.hint}
              </p>
              <p className="text-xs text-slate-600">{weatherRisk.description}</p>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
