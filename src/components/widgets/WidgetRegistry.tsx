import { WidgetType } from '../../types';
import MonthlySplashRateWidget from './MonthlySplashRateWidget';
import ConsecutiveSafeDaysWidget from './ConsecutiveSafeDaysWidget';
import MostDangerousRoadsWidget from './MostDangerousRoadsWidget';
import TodayPredictionOverviewWidget from './TodayPredictionOverviewWidget';
import SplashStatsWidget from './SplashStatsWidget';
import RecentRecordsWidget from './RecentRecordsWidget';
import WeatherAlertWidget from './WeatherAlertWidget';
import UpcomingRemindersWidget from './UpcomingRemindersWidget';
import RoutePlannerWidget from './RoutePlannerWidget';
import WeeklyReportWidget from './WeeklyReportWidget';
import FavoriteRoadsWidget from './FavoriteRoadsWidget';
import RecentNotificationsWidget from './RecentNotificationsWidget';
import TimeAxisWidget from './TimeAxisWidget';

const widgetComponents: Record<WidgetType, React.ComponentType> = {
  monthlySplashRate: MonthlySplashRateWidget,
  consecutiveSafeDays: ConsecutiveSafeDaysWidget,
  mostDangerousRoads: MostDangerousRoadsWidget,
  todayPredictionOverview: TodayPredictionOverviewWidget,
  splashStats: SplashStatsWidget,
  recentRecords: RecentRecordsWidget,
  weatherAlert: WeatherAlertWidget,
  upcomingReminders: UpcomingRemindersWidget,
  routePlanner: RoutePlannerWidget,
  weeklyReport: WeeklyReportWidget,
  favoriteRoads: FavoriteRoadsWidget,
  recentNotifications: RecentNotificationsWidget,
  timeAxis: TimeAxisWidget,
};

export const getWidgetComponent = (type: WidgetType): React.ComponentType | null => {
  return widgetComponents[type] || null;
};
