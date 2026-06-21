import { WeatherType, WeatherData, WeatherAdjustment } from '../types';

interface WeatherConfig {
  type: WeatherType;
  factor: number;
  description: string;
  icon: string;
  sprinklerHint: string;
}

const weatherConfigs: Record<WeatherType, WeatherConfig> = {
  sunny: {
    type: 'sunny',
    factor: 1.2,
    description: '晴天',
    icon: '☀️',
    sprinklerHint: '晴天洒水车出没概率增加',
  },
  cloudy: {
    type: 'cloudy',
    factor: 1.0,
    description: '多云',
    icon: '⛅',
    sprinklerHint: '多云天气洒水车正常作业',
  },
  rainy: {
    type: 'rainy',
    factor: 0.4,
    description: '雨天',
    icon: '🌧️',
    sprinklerHint: '雨天洒水车出没概率大幅降低',
  },
  stormy: {
    type: 'stormy',
    factor: 0.1,
    description: '暴雨',
    icon: '⛈️',
    sprinklerHint: '暴雨天气洒水车几乎不出动',
  },
  snowy: {
    type: 'snowy',
    factor: 0.2,
    description: '下雪',
    icon: '❄️',
    sprinklerHint: '雪天洒水车基本不出动',
  },
};

const weatherIcons: Record<WeatherType, string> = {
  sunny: '☀️',
  cloudy: '⛅',
  rainy: '🌧️',
  stormy: '⛈️',
  snowy: '❄️',
};

const weatherDescriptions: Record<WeatherType, string> = {
  sunny: '晴天',
  cloudy: '多云',
  rainy: '雨天',
  stormy: '暴雨',
  snowy: '下雪',
};

export const getWeatherConfig = (type: WeatherType): WeatherConfig => {
  return weatherConfigs[type];
};

export const getWeatherIcon = (type: WeatherType): string => {
  return weatherIcons[type];
};

export const getWeatherDescription = (type: WeatherType): string => {
  return weatherDescriptions[type];
};

export const calculateWeatherAdjustment = (
  originalProbability: number,
  weatherType: WeatherType
): WeatherAdjustment => {
  const config = weatherConfigs[weatherType];
  const adjustedProbability = Math.min(originalProbability * config.factor, 1);

  let reason = '';
  if (config.factor > 1) {
    reason = `${config.description}，洒水车作业频率提升 ${Math.round((config.factor - 1) * 100)}%`;
  } else if (config.factor < 1) {
    reason = `${config.description}，洒水车作业频率降低 ${Math.round((1 - config.factor) * 100)}%`;
  } else {
    reason = `${config.description}，洒水车正常作业`;
  }

  return {
    originalProbability,
    adjustedProbability,
    adjustmentFactor: config.factor,
    reason,
  };
};

export const getWeatherFactor = (type: WeatherType): number => {
  return weatherConfigs[type].factor;
};

export const getSprinklerHint = (type: WeatherType): string => {
  return weatherConfigs[type].sprinklerHint;
};

export const fetchWeatherData = async (): Promise<WeatherData> => {
  await new Promise(resolve => setTimeout(resolve, 500));

  const weatherTypes: WeatherType[] = ['sunny', 'cloudy', 'rainy', 'stormy', 'snowy'];
  const weights = [0.35, 0.30, 0.20, 0.10, 0.05];
  
  let random = Math.random();
  let selectedType: WeatherType = 'sunny';
  for (let i = 0; i < weights.length; i++) {
    if (random < weights[i]) {
      selectedType = weatherTypes[i];
      break;
    }
    random -= weights[i];
  }

  const config = weatherConfigs[selectedType];
  const baseTemp = 25;
  const tempVariation = (Math.random() - 0.5) * 20;
  const temperature = Math.round((baseTemp + tempVariation) * 10) / 10;
  const humidity = Math.round(40 + Math.random() * 50);
  const windSpeed = Math.round((5 + Math.random() * 25) * 10) / 10;

  return {
    type: selectedType,
    temperature,
    humidity,
    description: config.description,
    icon: config.icon,
    windSpeed,
    lastUpdated: Date.now(),
  };
};

export const shouldRefreshWeather = (lastUpdated: number): boolean => {
  const STALE_THRESHOLD = 30 * 60 * 1000;
  return Date.now() - lastUpdated > STALE_THRESHOLD;
};

export const getProbabilityChangeText = (adjustment: WeatherAdjustment): string => {
  const changePercent = Math.round((adjustment.adjustedProbability - adjustment.originalProbability) * 100);
  if (changePercent > 0) {
    return `+${changePercent}%`;
  }
  return `${changePercent}%`;
};

export const getProbabilityChangeColor = (adjustment: WeatherAdjustment): string => {
  if (adjustment.adjustedProbability > adjustment.originalProbability) {
    return 'text-red-500';
  } else if (adjustment.adjustedProbability < adjustment.originalProbability) {
    return 'text-emerald-500';
  }
  return 'text-slate-500';
};
