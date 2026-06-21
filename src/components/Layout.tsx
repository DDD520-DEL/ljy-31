import { useEffect } from 'react';
import { Outlet, NavLink, useLocation } from 'react-router-dom';
import { Home, Plus, Clock, History, BarChart3, Bell } from 'lucide-react';
import { cn } from '../lib/utils';
import { NotificationPanel } from './NotificationPanel';
import { NotificationToast } from './NotificationToast';
import GlobalSearch from './GlobalSearch';
import {
  useInitWebSocket,
  useDisconnectWebSocket,
  useUnreadCount,
  useSetShowNotificationPanel,
  useShowNotificationPanel,
} from '../store/useNotificationStore';
import { useSettings } from '../store/useAppStore';
import { websocketService } from '../services/websocket';

const navItems = [
  { to: '/', label: '首页', icon: Home },
  { to: '/schedule', label: '时刻表', icon: Clock },
  { to: '/record', label: '记录', icon: Plus },
  { to: '/history', label: '历史', icon: History },
  { to: '/statistics', label: '统计', icon: BarChart3 },
];

export default function Layout() {
  const location = useLocation();
  const isRecordPage = location.pathname === '/record';
  const initWebSocket = useInitWebSocket();
  const disconnectWebSocket = useDisconnectWebSocket();
  const unreadCount = useUnreadCount();
  const setShowPanel = useSetShowNotificationPanel();
  const showPanel = useShowNotificationPanel();
  const settings = useSettings();

  useEffect(() => {
    initWebSocket();

    return () => {
      disconnectWebSocket();
    };
  }, [initWebSocket, disconnectWebSocket]);

  useEffect(() => {
    websocketService.setFavoriteRoads(settings.favoriteRoads);
  }, [settings.favoriteRoads]);

  const handleBellClick = () => {
    setShowPanel(!showPanel);
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-sky-50 to-white">
      <div className="fixed top-4 right-4 z-40">
        <button
          onClick={handleBellClick}
          className="relative w-10 h-10 rounded-full bg-white shadow-md border border-slate-100 flex items-center justify-center text-slate-600 hover:bg-slate-50 transition-colors"
        >
          <Bell className="w-5 h-5" />
          {unreadCount > 0 && (
            <span className="absolute -top-1 -right-1 min-w-[18px] h-[18px] px-1 rounded-full bg-rose-500 text-white text-xs font-bold flex items-center justify-center">
              {unreadCount > 99 ? '99+' : unreadCount}
            </span>
          )}
        </button>
      </div>

      <main className="pb-40 max-w-2xl mx-auto">
        <Outlet />
      </main>

      <GlobalSearch />

      <nav className="fixed bottom-0 left-0 right-0 bg-white/95 backdrop-blur-sm border-t border-slate-200 z-50">
        <div className="max-w-2xl mx-auto px-4">
          <div className="flex items-center justify-around h-16">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = location.pathname === item.to;
              const isSpecialRecord = item.to === '/record';

              return (
                <NavLink
                  key={item.to}
                  to={item.to}
                  className={cn(
                    'flex flex-col items-center justify-center gap-1 transition-all duration-200',
                    isSpecialRecord
                      ? cn(
                          'relative -top-6 w-14 h-14 rounded-full bg-gradient-to-br from-sky-500 to-blue-600 text-white shadow-lg shadow-sky-500/30 hover:scale-110 active:scale-95',
                          isRecordPage && 'ring-4 ring-sky-200'
                        )
                      : cn(
                          'px-3 py-2 rounded-xl',
                          isActive
                            ? 'text-sky-600'
                            : 'text-slate-400 hover:text-slate-600'
                        )
                  )}
                >
                  {isSpecialRecord ? (
                    <Icon className="w-6 h-6" strokeWidth={2.5} />
                  ) : (
                    <>
                      <Icon
                        className={cn(
                          'w-5 h-5 transition-transform',
                          isActive && 'scale-110'
                        )}
                      />
                      <span className="text-xs font-medium">{item.label}</span>
                      {isActive && (
                        <span className="absolute bottom-1 w-1 h-1 rounded-full bg-sky-500" />
                      )}
                    </>
                  )}
                </NavLink>
              );
            })}
          </div>
        </div>
      </nav>

      <NotificationPanel />
      <NotificationToast />
    </div>
  );
}
