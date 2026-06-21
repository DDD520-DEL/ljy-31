import { useEffect, useRef } from 'react';
import {
  Bell,
  X,
  MapPin,
  CloudRain,
  BarChart3,
  Settings,
  Trash2,
  CheckCheck,
  Clock,
} from 'lucide-react';
import {
  useNotifications,
  useUnreadCount,
  useMarkAsRead,
  useMarkAllAsRead,
  useRemoveNotification,
  useSetShowNotificationPanel,
  useShowNotificationPanel,
} from '../store/useNotificationStore';
import { NotificationType } from '../types';
import { cn } from '../lib/utils';
import { Empty } from './Empty';

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

  if (diff < 60000) {
    return '刚刚';
  } else if (diff < 3600000) {
    return `${Math.floor(diff / 60000)} 分钟前`;
  } else if (diff < 86400000) {
    return `${Math.floor(diff / 3600000)} 小时前`;
  } else {
    const date = new Date(timestamp);
    return `${date.getMonth() + 1}/${date.getDate()}`;
  }
};

export function NotificationPanel() {
  const notifications = useNotifications();
  const unreadCount = useUnreadCount();
  const markAsRead = useMarkAsRead();
  const markAllAsRead = useMarkAllAsRead();
  const removeNotification = useRemoveNotification();
  const showPanel = useShowNotificationPanel();
  const setShowPanel = useSetShowNotificationPanel();
  const panelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (panelRef.current && !panelRef.current.contains(event.target as Node)) {
        return;
      }
      setShowPanel(false);
    };

    if (showPanel) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showPanel, setShowPanel]);

  const handleNotificationClick = (id: string) => {
    markAsRead(id);
  };

  return (
    <>
      {showPanel && (
        <div className="fixed inset-0 bg-black/20 z-40" onClick={() => setShowPanel(false)} />
      )}

      <div
        ref={panelRef}
        className={cn(
          'fixed top-0 right-0 h-full w-80 bg-white shadow-2xl z-50 transform transition-transform duration-300 ease-out',
          showPanel ? 'translate-x-0' : 'translate-x-full'
        )}
      >
        <div className="flex flex-col h-full">
          <div className="flex items-center justify-between px-4 py-3 border-b border-slate-200">
            <div className="flex items-center gap-2">
              <Bell className="w-5 h-5 text-sky-500" />
              <h2 className="text-lg font-semibold text-slate-800">通知中心</h2>
              {unreadCount > 0 && (
                <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-rose-100 text-rose-600">
                  {unreadCount} 条未读
                </span>
              )}
            </div>
            <button
              onClick={() => setShowPanel(false)}
              className="w-8 h-8 rounded-lg flex items-center justify-center text-slate-400 hover:bg-slate-100 hover:text-slate-600 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          <div className="flex items-center justify-between px-4 py-2 border-b border-slate-100 bg-slate-50">
            <button
              onClick={markAllAsRead}
              disabled={unreadCount === 0}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm text-slate-600 hover:bg-slate-200 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <CheckCheck className="w-4 h-4" />
              全部已读
            </button>
            <button
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm text-slate-600 hover:bg-slate-200 transition-colors disabled:opacity-50"
            >
              <Settings className="w-4 h-4" />
              通知设置
            </button>
          </div>

          <div className="flex-1 overflow-y-auto">
            {notifications.length > 0 ? (
              <div className="divide-y divide-slate-100">
                {notifications.map((notification) => {
                  const { icon: Icon, color, bgColor } = getNotificationIcon(notification.type);
                  return (
                    <div
                      key={notification.id}
                      className={cn(
                        'px-4 py-3 hover:bg-slate-50 cursor-pointer transition-colors group',
                        !notification.read && 'bg-sky-50/50'
                      )}
                      onClick={() => handleNotificationClick(notification.id)}
                    >
                      <div className="flex gap-3">
                        <div className={cn('w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0', bgColor)}>
                          <Icon className={cn('w-5 h-5', color)} />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-start justify-between gap-2">
                            <p className={cn(
                              'text-sm font-medium truncate',
                              notification.read ? 'text-slate-600' : 'text-slate-800'
                            )}>
                              {notification.title}
                            </p>
                            {!notification.read && (
                              <span className="w-2 h-2 rounded-full bg-sky-500 flex-shrink-0 mt-1.5" />
                            )}
                          </div>
                          <p className="text-xs text-slate-500 mt-1 line-clamp-2">
                            {notification.content}
                          </p>
                          <div className="flex items-center gap-1 mt-2 text-xs text-slate-400">
                            <Clock className="w-3 h-3" />
                            <span>{formatNotificationTime(notification.timestamp)}</span>
                          </div>
                        </div>
                        <button
                          onClick={(e) => {
                          e.stopPropagation();
                          removeNotification(notification.id);
                        }}
                          className="w-7 h-7 rounded-lg flex items-center justify-center text-slate-300 hover:text-red-500 hover:bg-red-50 opacity-0 group-hover:opacity-100 transition-all flex-shrink-0"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="py-12">
                <Empty
                  icon={Bell}
                  title="暂无通知"
                  description="开启推送后，有新消息会出现在这里"
                />
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  );
}
