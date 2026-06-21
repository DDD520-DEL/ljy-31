export const formatDate = (timestamp: number): string => {
  const date = new Date(timestamp);
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

export const formatTime = (timestamp: number): string => {
  const date = new Date(timestamp);
  const hours = String(date.getHours()).padStart(2, '0');
  const minutes = String(date.getMinutes()).padStart(2, '0');
  return `${hours}:${minutes}`;
};

export const formatDateTime = (timestamp: number): string => {
  return `${formatDate(timestamp)} ${formatTime(timestamp)}`;
};

export const formatTimeFromParts = (hour: number, minute: number): string => {
  return `${String(hour).padStart(2, '0')}:${String(minute).padStart(2, '0')}`;
};

export const getDayOfWeek = (timestamp: number): number => {
  return new Date(timestamp).getDay();
};

export const getDayName = (day: number): string => {
  const days = ['周日', '周一', '周二', '周三', '周四', '周五', '周六'];
  return days[day];
};

export const getHourName = (hour: number): string => {
  return `${String(hour).padStart(2, '0')}:00`;
};

export const generateId = (): string => {
  return Date.now().toString(36) + Math.random().toString(36).substr(2);
};

export const parseTimeString = (timeStr: string): { hour: number; minute: number } => {
  const [hour, minute] = timeStr.split(':').map(Number);
  return { hour, minute };
};

export const calculateMinutesDiff = (hour1: number, minute1: number, hour2: number, minute2: number): number => {
  return (hour2 - hour1) * 60 + (minute2 - minute1);
};

export const getConfidenceLabel = (confidence: number): string => {
  if (confidence >= 0.8) return '高';
  if (confidence >= 0.5) return '中';
  return '低';
};

export const getConfidenceColor = (confidence: number): string => {
  if (confidence >= 0.8) return 'text-emerald-600';
  if (confidence >= 0.5) return 'text-amber-600';
  return 'text-slate-500';
};

export const getProbabilityColor = (probability: number): string => {
  if (probability >= 0.7) return 'bg-red-500';
  if (probability >= 0.4) return 'bg-amber-500';
  if (probability >= 0.2) return 'bg-sky-500';
  return 'bg-slate-300';
};

export const getProbabilityBgLight = (probability: number): string => {
  if (probability >= 0.7) return 'bg-red-50';
  if (probability >= 0.4) return 'bg-amber-50';
  if (probability >= 0.2) return 'bg-sky-50';
  return 'bg-slate-50';
};

export const getSplashStatusText = (isSplashed: boolean): string => {
  return isSplashed ? '被溅到' : '未被溅到';
};

export const getDirectionText = (direction?: string): string => {
  const map: Record<string, string> = {
    east: '向东',
    west: '向西',
    south: '向南',
    north: '向北',
  };
  return direction ? map[direction] || direction : '';
};

export const getTodayDateString = (): string => {
  return formatDate(Date.now());
};

export const getCurrentTimeString = (): string => {
  return formatTime(Date.now());
};

export const isToday = (timestamp: number): boolean => {
  return formatDate(timestamp) === formatDate(Date.now());
};

export const getRecentDays = (days: number): string[] => {
  const result: string[] = [];
  const now = Date.now();
  for (let i = days - 1; i >= 0; i--) {
    result.push(formatDate(now - i * 24 * 60 * 60 * 1000));
  }
  return result;
};

export const clamp = (value: number, min: number, max: number): number => {
  return Math.min(Math.max(value, min), max);
};
