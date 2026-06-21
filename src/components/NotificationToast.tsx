import { useState, useEffect, useCallback } from 'react';
import { Bell, X, MapPin, CloudRain, BarChart3, Volume2, Vibrate } from 'lucide-react';
import { NotificationMessage, NotificationType } from '../types';
import { usePushSettings, useMarkAsRead, useSetShowNotificationPanel } from '../store/useNotificationStore';
import { cn } from '../lib/utils';

const getNotificationIcon = (type: NotificationType) => {
  switch (type) {
    case 'road_reminder':
      return {
        icon: MapPin,
        color: 'text-sky-500',
        bgColor: 'bg-sky-100',
        borderColor: 'border-sky-200',
        gradientColor: 'bg-gradient-to-r from-sky-400 to-sky-600',
      };
    case 'weather_alert':
      return {
        icon: CloudRain,
        color: 'text-emerald-500',
        bgColor: 'bg-emerald-100',
        borderColor: 'border-emerald-200',
        gradientColor: 'bg-gradient-to-r from-emerald-400 to-emerald-600',
      };
    case 'weekly_report':
      return {
        icon: BarChart3,
        color: 'text-indigo-500',
        bgColor: 'bg-indigo-100',
        borderColor: 'border-indigo-200',
        gradientColor: 'bg-gradient-to-r from-indigo-400 to-indigo-600',
      };
    case 'system':
      return {
        icon: Bell,
        color: 'text-amber-500',
        bgColor: 'bg-amber-100',
        borderColor: 'border-amber-200',
        gradientColor: 'bg-gradient-to-r from-amber-400 to-amber-600',
      };
    default:
      return {
        icon: Bell,
        color: 'text-slate-500',
        bgColor: 'bg-slate-100',
        borderColor: 'border-slate-200',
        gradientColor: 'bg-gradient-to-r from-slate-400 to-slate-600',
      };
  }
};

export function NotificationToast() {
  const [currentToast, setCurrentToast] = useState<NotificationMessage | null>(null);
  const [isVisible, setIsVisible] = useState(false);
  const pushSettings = usePushSettings();
  const markAsRead = useMarkAsRead();
  const setShowPanel = useSetShowNotificationPanel();

  const showNotification = useCallback((message: NotificationMessage) => {
    setCurrentToast(message);
    setIsVisible(true);

    if (pushSettings.sound) {
      try {
        const audioContext = new (window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext)();
        const oscillator = audioContext.createOscillator();
        const gainNode = audioContext.createGain();
        oscillator.connect(gainNode);
        gainNode.connect(audioContext.destination);
        oscillator.frequency.value = 800;
        oscillator.type = 'sine';
        gainNode.gain.setValueAtTime(0.1, audioContext.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.3);
        oscillator.start(audioContext.currentTime);
        oscillator.stop(audioContext.currentTime + 0.3);
      } catch {
        // Audio not supported
      }
    }

    if (pushSettings.vibrate && navigator.vibrate) {
      navigator.vibrate([200, 100, 200]);
    }

    setTimeout(() => {
      setIsVisible(false);
      setTimeout(() => {
        setCurrentToast(null);
      }, 300);
    }, 5000);
  }, [pushSettings.sound, pushSettings.vibrate]);

  useEffect(() => {
    const handleNewNotification = (event: CustomEvent<NotificationMessage>) => {
      if (pushSettings.enabled && !pushSettings.doNotDisturb) {
        showNotification(event.detail);
      }
    };

    window.addEventListener('new-notification', handleNewNotification as EventListener);

    return () => {
      window.removeEventListener('new-notification', handleNewNotification as EventListener);
    };
  }, [pushSettings.enabled, pushSettings.doNotDisturb, showNotification]);

  const handleClose = () => {
    setIsVisible(false);
    setTimeout(() => {
      setCurrentToast(null);
    }, 300);
  };

  const handleClick = () => {
    if (currentToast) {
      markAsRead(currentToast.id);
      setShowPanel(true);
      handleClose();
    }
  };

  if (!currentToast) return null;

  const { icon: Icon, color, bgColor, borderColor, gradientColor } = getNotificationIcon(currentToast.type);

  return (
    <div
      className={cn(
        'fixed top-4 left-4 right-4 z-50 max-w-sm mx-auto transition-all duration-300 transform',
        isVisible ? 'translate-y-0 opacity-100' : '-translate-y-4 opacity-0'
      )}
    >
      <div
        className={cn(
          'bg-white rounded-2xl shadow-xl shadow-slate-200/50 border overflow-hidden cursor-pointer hover:shadow-lg transition-shadow',
          borderColor
        )}
        onClick={handleClick}
      >
        <div className={cn('h-1.5', gradientColor)} />
        <div className="p-4">
          <div className="flex items-start gap-3">
            <div className={cn('w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0', bgColor)}>
              <Icon className={cn('w-5 h-5', color)} />
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-semibold text-slate-800 text-sm">{currentToast.title}</p>
              <p className="text-sm text-slate-500 mt-1 line-clamp-2">
                {currentToast.content}
              </p>
            </div>
            <button
              onClick={(e) => {
                e.stopPropagation();
                handleClose();
              }}
              className="w-7 h-7 rounded-lg flex items-center justify-center text-slate-400 hover:bg-slate-100 hover:text-slate-600 transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          <div className="flex items-center gap-3 mt-3 pt-3 border-t border-slate-100">
            <div className="flex items-center gap-1 text-xs text-slate-400">
              {pushSettings.sound && <Volume2 className="w-3 h-3" />}
              {pushSettings.vibrate && <Vibrate className="w-3 h-3" />}
            </div>
            <span className="text-xs text-slate-400 ml-auto">
              点击查看详情
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
