import {
  Achievement,
  AchievementProgress,
  SprinklerRecord,
  UserAchievement,
} from '../types';
import { groupRecordsByDate, groupRecordsByRoad } from './analysis';

export const ACHIEVEMENTS: Achievement[] = [
  {
    id: 'first_record',
    title: '初次记录',
    description: '记录你的第一条洒水车出没记录',
    icon: 'Droplets',
    category: 'milestone',
    rarity: 'common',
    targetValue: 1,
    unit: '条',
  },
  {
    id: 'record_10',
    title: '记录达人',
    description: '累计记录10条洒水车出没记录',
    icon: 'FileText',
    category: 'record',
    rarity: 'common',
    targetValue: 10,
    unit: '条',
  },
  {
    id: 'record_50',
    title: '记录专家',
    description: '累计记录50条洒水车出没记录',
    icon: 'BookOpen',
    category: 'record',
    rarity: 'rare',
    targetValue: 50,
    unit: '条',
  },
  {
    id: 'record_100',
    title: '记录大师',
    description: '累计记录100条洒水车出没记录',
    icon: 'Award',
    category: 'record',
    rarity: 'epic',
    targetValue: 100,
    unit: '条',
  },
  {
    id: 'record_500',
    title: '记录传奇',
    description: '累计记录500条洒水车出没记录',
    icon: 'Crown',
    category: 'record',
    rarity: 'legendary',
    targetValue: 500,
    unit: '条',
  },
  {
    id: 'streak_3',
    title: '三天坚持',
    description: '连续3天记录洒水车出没',
    icon: 'Flame',
    category: 'streak',
    rarity: 'common',
    targetValue: 3,
    unit: '天',
  },
  {
    id: 'streak_7',
    title: '周更达人',
    description: '连续7天记录洒水车出没',
    icon: 'Calendar',
    category: 'streak',
    rarity: 'rare',
    targetValue: 7,
    unit: '天',
  },
  {
    id: 'streak_30',
    title: '月度坚持',
    description: '连续30天记录洒水车出没',
    icon: 'CalendarCheck',
    category: 'streak',
    rarity: 'epic',
    targetValue: 30,
    unit: '天',
  },
  {
    id: 'streak_100',
    title: '百日签到',
    description: '连续100天记录洒水车出没',
    icon: 'Trophy',
    category: 'streak',
    rarity: 'legendary',
    targetValue: 100,
    unit: '天',
  },
  {
    id: 'roads_5',
    title: '城市探索者',
    description: '记录覆盖5个不同路段',
    icon: 'MapPin',
    category: 'exploration',
    rarity: 'common',
    targetValue: 5,
    unit: '个',
  },
  {
    id: 'roads_10',
    title: '路段达人',
    description: '记录覆盖10个不同路段',
    icon: 'Map',
    category: 'exploration',
    rarity: 'rare',
    targetValue: 10,
    unit: '个',
  },
  {
    id: 'roads_25',
    title: '活地图',
    description: '记录覆盖25个不同路段',
    icon: 'Compass',
    category: 'exploration',
    rarity: 'epic',
    targetValue: 25,
    unit: '个',
  },
  {
    id: 'roads_50',
    title: '城市通',
    description: '记录覆盖50个不同路段',
    icon: 'Globe',
    category: 'exploration',
    rarity: 'legendary',
    targetValue: 50,
    unit: '个',
  },
  {
    id: 'daily_max_5',
    title: '勤奋的一天',
    description: '单日记录达到5条',
    icon: 'Zap',
    category: 'milestone',
    rarity: 'common',
    targetValue: 5,
    unit: '条',
  },
  {
    id: 'daily_max_10',
    title: '高产日',
    description: '单日记录达到10条',
    icon: 'TrendingUp',
    category: 'milestone',
    rarity: 'rare',
    targetValue: 10,
    unit: '条',
  },
  {
    id: 'daily_max_20',
    title: '纪录日',
    description: '单日记录达到20条',
    icon: 'Rocket',
    category: 'milestone',
    rarity: 'epic',
    targetValue: 20,
    unit: '条',
  },
  {
    id: 'splashed_10',
    title: '水花四溅',
    description: '累计被溅水10次',
    icon: 'Droplet',
    category: 'record',
    rarity: 'common',
    targetValue: 10,
    unit: '次',
  },
  {
    id: 'splashed_50',
    title: '倒霉蛋',
    description: '累计被溅水50次',
    icon: 'CloudRain',
    category: 'record',
    rarity: 'rare',
    targetValue: 50,
    unit: '次',
  },
  {
    id: 'safe_7',
    title: '安全一周',
    description: '连续7天未被溅水',
    icon: 'Shield',
    category: 'streak',
    rarity: 'rare',
    targetValue: 7,
    unit: '天',
  },
  {
    id: 'safe_30',
    title: '安全大师',
    description: '连续30天未被溅水',
    icon: 'ShieldCheck',
    category: 'streak',
    rarity: 'epic',
    targetValue: 30,
    unit: '天',
  },
];

const getStreakDays = (records: SprinklerRecord[]): number => {
  if (records.length === 0) return 0;

  const byDate = groupRecordsByDate(records);
  const dates = Object.keys(byDate).sort().reverse();

  if (dates.length === 0) return 0;

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const todayStr = today.toISOString().split('T')[0];

  const dateSet = new Set(dates);

  let streak = 0;
  let currentDate = new Date(today);

  if (!dateSet.has(todayStr)) {
    currentDate.setDate(currentDate.getDate() - 1);
  }

  while (true) {
    const dateStr = currentDate.toISOString().split('T')[0];
    if (dateSet.has(dateStr)) {
      streak++;
      currentDate.setDate(currentDate.getDate() - 1);
    } else {
      break;
    }
  }

  return streak;
};

const getSafeStreakDays = (records: SprinklerRecord[]): number => {
  if (records.length === 0) return 0;

  const byDate = groupRecordsByDate(records);
  const dates = Object.keys(byDate).sort().reverse();

  if (dates.length === 0) return 0;

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  let streak = 0;
  let currentDate = new Date(today);

  while (true) {
    const dateStr = currentDate.toISOString().split('T')[0];
    const dayRecords = byDate[dateStr];

    if (dayRecords) {
      const hasSplashed = dayRecords.some((r) => r.isSplashed);
      if (!hasSplashed) {
        streak++;
      } else {
        break;
      }
    } else {
      streak++;
    }

    currentDate.setDate(currentDate.getDate() - 1);

    const diffDays = Math.floor(
      (today.getTime() - currentDate.getTime()) / (1000 * 60 * 60 * 24)
    );
    if (diffDays > 365) break;
  }

  return streak;
};

const getMaxDailyRecords = (records: SprinklerRecord[]): number => {
  const byDate = groupRecordsByDate(records);
  let max = 0;
  Object.values(byDate).forEach((dayRecords) => {
    if (dayRecords.length > max) {
      max = dayRecords.length;
    }
  });
  return max;
};

const getUniqueRoadsCount = (records: SprinklerRecord[]): number => {
  const byRoad = groupRecordsByRoad(records);
  return Object.keys(byRoad).length;
};

const getSplashedCount = (records: SprinklerRecord[]): number => {
  return records.filter((r) => r.isSplashed).length;
};

export const calculateAchievementProgress = (
  records: SprinklerRecord[],
  achievements: Achievement[]
): AchievementProgress[] => {
  const totalRecords = records.length;
  const streakDays = getStreakDays(records);
  const safeStreakDays = getSafeStreakDays(records);
  const uniqueRoads = getUniqueRoadsCount(records);
  const maxDaily = getMaxDailyRecords(records);
  const splashedCount = getSplashedCount(records);

  return achievements.map((achievement) => {
    let currentValue = 0;

    switch (achievement.category) {
      case 'record':
        if (achievement.id.startsWith('splashed_')) {
          currentValue = splashedCount;
        } else {
          currentValue = totalRecords;
        }
        break;
      case 'streak':
        if (achievement.id.startsWith('safe_')) {
          currentValue = safeStreakDays;
        } else {
          currentValue = streakDays;
        }
        break;
      case 'exploration':
        currentValue = uniqueRoads;
        break;
      case 'milestone':
        if (achievement.id.startsWith('daily_max_')) {
          currentValue = maxDaily;
        } else if (achievement.id === 'first_record') {
          currentValue = totalRecords > 0 ? 1 : 0;
        }
        break;
    }

    const percentage = Math.min(
      100,
      Math.round((currentValue / achievement.targetValue) * 100)
    );
    const unlocked = currentValue >= achievement.targetValue;

    return {
      achievementId: achievement.id,
      currentValue: Math.min(currentValue, achievement.targetValue),
      targetValue: achievement.targetValue,
      percentage,
      unlocked,
    };
  });
};

export const findNewlyUnlockedAchievements = (
  progressList: AchievementProgress[],
  userAchievements: UserAchievement[]
): Achievement[] => {
  const unlockedIds = new Set(userAchievements.map((ua) => ua.achievementId));

  const newlyUnlocked = progressList.filter(
    (p) => p.unlocked && !unlockedIds.has(p.achievementId)
  );

  return newlyUnlocked
    .map((p) => ACHIEVEMENTS.find((a) => a.id === p.achievementId))
    .filter((a): a is Achievement => a !== undefined);
};
