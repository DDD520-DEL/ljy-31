import { Bell, ChevronRight, MapPin, CloudRain, BarChart3 } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '../Card';
import {
  useNotifications,
  useUnreadCount,
  useMarkAsRead,
  useSetShowNotificationPanel,
} from '../../store/useNotificationStore';
import { NotificationType } from '../../types';
import { cn } from '../../lib/utils';

export default function RecentNotificationsWidget() {
  const notifications = useNotifications();
  const unreadCount = useUnreadCount();
  const markAsRead = useMarkAsRead();
  const setShowNotificationPanel = useSetShowNotificationPanel();

  const getNotificationIcon = (type: NotificationType) => {
    switch (type) {
      case 'road_reminder':
        return { icon: MapPin, color: 'text-sky-500', bgColor: 'bg-sky-100' };
      case 'weather_alert':
        return { icon: CloudRain, color: 'text-emerald-500', bgColor: 'bg-emerald-100' };
      case 'weekly_report':
        return { icon: BarChart3, color: 'text-indigo-500', bgColor: 'bg-indigo-100' };
      case 'system':
        return { icon: Bell, color: 'text-amber-500', bgColor: 'bg-amber-100' };
      default:
        return { icon: Bell, color: 'text-slate-500', bgColor: 'bg-slate-100' };
    }
  };

  const formatNotificationTime = (timestamp: number): string => {
    const now = Date.now();
    const diff = now - timestamp;

    if (diff < 60000) return '刚刚';
    if (diff < 3600000) return `${Math.floor(diff / 60000)} 分钟前`;
    if (diff < 86400000) return `${Math.floor(diff / 3600000)} 小时前`;
    const date = new Date(timestamp);
    return `${date.getMonth() + 1}/${date.getDate()}`;
  };

  const handleNotificationClick = (id: string) => {
    markAsRead(id);
  };

  const handleViewAllNotifications = () => {
    setShowNotificationPanel(true);
  };

  if (notifications.length === 0) {
    return (
      <Card>
        <CardHeader className="pb-2">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-rose-500 flex items-center justify-center">
              <Bell className="w-4 h-4 text-white" />
            </div>
            <CardTitle className="text-sm">最近通知</CardTitle>
          </div>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-slate-500 text-center py-4">暂无通知</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-rose-500 flex items-center justify-center shadow-md">
              <Bell className="w-4 h-4 text-white" />
            </div>
            <div>
              <CardTitle className="text-slate-800 text-sm">最近通知</CardTitle>
              <p className="text-xs text-slate-500 mt-0.5">
                {unreadCount > 0 ? `${unreadCount} 条未读` : '全部已读'}
              </p>
            </div>
          </div>
          <button
            onClick={handleViewAllNotifications}
            className="text-rose-600 text-xs font-medium flex items-center gap-0.5 hover:gap-1 transition-all px-2 py-1 rounded-lg hover:bg-rose-50"
          >
            全部
            <ChevronRight className="w-3 h-3" />
          </button>
        </div>
      </CardHeader>
      <CardContent className="space-y-2">
        {notifications.slice(0, 3).map((notification) => {
          const { icon: Icon, color, bgColor } = getNotificationIcon(notification.type);
          return (
            <div
              key={notification.id}
              onClick={() => handleNotificationClick(notification.id)}
              className={cn(
                'flex items-start gap-2 p-2 rounded-xl cursor-pointer transition-colors',
                notification.read ? 'bg-white' : 'bg-rose-50/50'
              )}
            >
              <div
                className={cn(
                  'w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0',
                  bgColor
                )}
              >
                <Icon className={cn('w-4 h-4', color)} />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-start justify-between gap-1">
                  <p
                    className={cn(
                      'text-sm font-medium truncate',
                      notification.read ? 'text-slate-600' : 'text-slate-800'
                    )}
                  >
                    {notification.title}
                  </p>
                  {!notification.read && (
                    <span className="w-2 h-2 rounded-full bg-rose-500 flex-shrink-0 mt-1.5" />
                  )}
                </div>
                <p className="text-xs text-slate-500 mt-0.5 line-clamp-1">
                  {notification.content}
                </p>
                <p className="text-xs text-slate-400 mt-1">
                  {formatNotificationTime(notification.timestamp)}
                </p>
              </div>
            </div>
          );
        })}
      </CardContent>
    </Card>
  );
}
