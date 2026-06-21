import { useEffect, useMemo } from 'react';
import { useWeather, useRefreshWeather, useIsWeatherLoading, useGetWeatherAdjustment } from '../store/useAppStore';
import { getSprinklerHint, getProbabilityChangeText, getProbabilityChangeColor } from '../utils/weather';
import { shouldRefreshWeather } from '../utils/weather';

export const useWeatherData = () => {
  const weather = useWeather();
  const isWeatherLoading = useIsWeatherLoading();
  const refreshWeather = useRefreshWeather();
  const getWeatherAdjustment = useGetWeatherAdjustment();

  useEffect(() => {
    if (!weather || shouldRefreshWeather(weather.lastUpdated)) {
      refreshWeather();
    }

    const interval = setInterval(() => {
      if (weather && shouldRefreshWeather(weather.lastUpdated)) {
        refreshWeather();
      }
    }, 5 * 60 * 1000);

    return () => clearInterval(interval);
  }, [weather, refreshWeather]);

  return {
    weather,
    isWeatherLoading,
    refreshWeather,
    getWeatherAdjustment,
  };
};

export const useWeatherHint = () => {
  const weather = useWeather();

  return useMemo(() => {
    if (!weather) {
      return {
        hint: '正在获取天气信息...',
        icon: '🌤️',
        description: '加载中',
      };
    }

    return {
      hint: getSprinklerHint(weather.type),
      icon: weather.icon,
      description: weather.description,
      temperature: weather.temperature,
      humidity: weather.humidity,
      windSpeed: weather.windSpeed,
    };
  }, [weather]);
};

export const useRoadWeatherAdjustment = (splashProbability: number) => {
  const getWeatherAdjustment = useGetWeatherAdjustment();
  const weather = useWeather();

  return useMemo(() => {
    const adjustment = getWeatherAdjustment(splashProbability);
    return {
      ...adjustment,
      changeText: getProbabilityChangeText(adjustment),
      changeColor: getProbabilityChangeColor(adjustment),
      adjustedPercent: Math.round(adjustment.adjustedProbability * 100),
      originalPercent: Math.round(adjustment.originalProbability * 100),
      hasWeatherData: !!weather,
    };
  }, [splashProbability, getWeatherAdjustment, weather]);
};

export const useOverallWeatherRisk = () => {
  const weather = useWeather();
  const getWeatherAdjustment = useGetWeatherAdjustment();

  return useMemo(() => {
    if (!weather) {
      return {
        riskLevel: 'normal',
        riskText: '正常',
        riskColor: 'text-slate-600',
        bgColor: 'bg-slate-100',
        borderColor: 'border-slate-200',
        description: '暂无天气数据',
      };
    }

    const adjustment = getWeatherAdjustment(0.5);
    const factor = adjustment.adjustmentFactor;

    if (factor >= 1.1) {
      return {
        riskLevel: 'high',
        riskText: '高风险',
        riskColor: 'text-red-600',
        bgColor: 'bg-red-50',
        borderColor: 'border-red-200',
        description: '晴天利于洒水作业，遇到洒水车的概率增加',
      };
    } else if (factor <= 0.3) {
      return {
        riskLevel: 'low',
        riskText: '低风险',
        riskColor: 'text-emerald-600',
        bgColor: 'bg-emerald-50',
        borderColor: 'border-emerald-200',
        description: '降水天气洒水车作业减少，遇到的概率降低',
      };
    } else {
      return {
        riskLevel: 'normal',
        riskText: '正常',
        riskColor: 'text-amber-600',
        bgColor: 'bg-amber-50',
        borderColor: 'border-amber-200',
        description: '天气正常，洒水车按常规频率作业',
      };
    }
  }, [weather, getWeatherAdjustment]);
};
