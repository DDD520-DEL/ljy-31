import { create } from 'zustand';
import {
  NotificationMessage,
  PushSettings,
  QuietHours,
  WebSocketStatus,
  StorageKeys,
  NotificationType,
} from '../types';
import { storage } from '../utils/storage';
import { websocketService } from '../services/websocket';

const defaultQuietHours: QuietHours = {
  enabled: false,
  startHour: 22,
  startMinute: 0,
  endHour: 8,
  endMinute: 0,
};

const defaultPushSettings: PushSettings = {
  enabled: true,
  roadReminderEnabled: true,
  weatherAlertEnabled: true,
  weeklyReportEnabled: true,
  quietHours: defaultQuietHours,
  doNotDisturb: false,
  vibrate: true,
  sound: true,
};

const getInitialPushSettings = (): PushSettings => {
  const stored = storage.get<PushSettings>(StorageKeys.PUSH_SETTINGS, defaultPushSettings);
  return {
    ...defaultPushSettings,
    ...stored,
    quietHours: {
      ...defaultQuietHours,
      ...(stored.quietHours || {}),
    },
  };
};

const getInitialNotifications = (): NotificationMessage[] => {
  return storage.get<NotificationMessage[]>(StorageKeys.NOTIFICATIONS, []);
};

interface NotificationState {
  notifications: NotificationMessage[];
  pushSettings: PushSettings;
  wsStatus: WebSocketStatus;
  showNotificationPanel: boolean;

  unreadCount: number;

  initWebSocket: () => void;
  disconnectWebSocket: () => void;

  addNotification: (message: NotificationMessage) => void;
  markAsRead: (id: string) => void;
  markAllAsRead: () => void;
  clearNotifications: () => void;
  removeNotification: (id: string) => void;

  updatePushSettings: (settings: Partial<PushSettings>) => void;
  updateQuietHours: (quietHours: Partial<QuietHours>) => void;
  toggleDoNotDisturb: () => void;

  setShowNotificationPanel: (show: boolean) => void;

  isInQuietHours: () => boolean;
  shouldShowNotification: (type: NotificationType) => boolean;
}

const isTimeInQuietHours = (quietHours: QuietHours): boolean => {
  if (!quietHours.enabled) return false;

  const now = new Date();
  const currentMinutes = now.getHours() * 60 + now.getMinutes();
  const startMinutes = quietHours.startHour * 60 + quietHours.startMinute;
  const endMinutes = quietHours.endHour * 60 + quietHours.endMinute;

  if (startMinutes <= endMinutes) {
    return currentMinutes >= startMinutes && currentMinutes < endMinutes;
  } else {
    return currentMinutes >= startMinutes || currentMinutes < endMinutes;
  }
};

export const useNotificationStore = create<NotificationState>((set, get) => {
  const initialNotifications = getInitialNotifications();
  const initialPushSettings = getInitialPushSettings();
  const initialUnreadCount = initialNotifications.filter((n) => !n.read).length;

  return {
    notifications: initialNotifications,
    pushSettings: initialPushSettings,
    wsStatus: websocketService.getStatus(),
    showNotificationPanel: false,
    unreadCount: initialUnreadCount,

    initWebSocket: () => {
      const { pushSettings } = get();

      websocketService.onMessage((message) => {
        const state = get();
        if (state.shouldShowNotification(message.type)) {
          state.addNotification(message);
        }
      });

      websocketService.onStatusChange((status) => {
        set({ wsStatus: status });
      });

      if (pushSettings.enabled) {
        websocketService.connect();
      }
    },

    disconnectWebSocket: () => {
      websocketService.disconnect();
    },

    addNotification: (message: NotificationMessage) => {
      set((state) => {
        const newNotifications = [message, ...state.notifications].slice(0, 100);
        storage.set(StorageKeys.NOTIFICATIONS, newNotifications);

        if (!message.read) {
          const event = new CustomEvent('new-notification', { detail: message });
          window.dispatchEvent(event);
        }

        return {
          notifications: newNotifications,
          unreadCount: state.unreadCount + (message.read ? 0 : 1),
        };
      });
    },

    markAsRead: (id: string) => {
      set((state) => {
        const newNotifications = state.notifications.map((n) =>
          n.id === id ? { ...n, read: true } : n
        );
        storage.set(StorageKeys.NOTIFICATIONS, newNotifications);
        const unreadCount = newNotifications.filter((n) => !n.read).length;
        return { notifications: newNotifications, unreadCount };
      });
    },

    markAllAsRead: () => {
      set((state) => {
        const newNotifications = state.notifications.map((n) => ({ ...n, read: true }));
        storage.set(StorageKeys.NOTIFICATIONS, newNotifications);
        return { notifications: newNotifications, unreadCount: 0 };
      });
    },

    clearNotifications: () => {
      storage.set(StorageKeys.NOTIFICATIONS, []);
      set({ notifications: [], unreadCount: 0 });
    },

    removeNotification: (id: string) => {
      set((state) => {
        const newNotifications = state.notifications.filter((n) => n.id !== id);
        storage.set(StorageKeys.NOTIFICATIONS, newNotifications);
        const unreadCount = newNotifications.filter((n) => !n.read).length;
        return { notifications: newNotifications, unreadCount };
      });
    },

    updatePushSettings: (settings: Partial<PushSettings>) => {
      set((state) => {
        const newSettings = { ...state.pushSettings, ...settings };
        storage.set(StorageKeys.PUSH_SETTINGS, newSettings);

        if (settings.enabled !== undefined) {
          if (settings.enabled) {
            websocketService.connect();
          } else {
            websocketService.disconnect();
          }
        }

        return { pushSettings: newSettings };
      });
    },

    updateQuietHours: (quietHours: Partial<QuietHours>) => {
      set((state) => {
        const newQuietHours = { ...state.pushSettings.quietHours, ...quietHours };
        const newSettings = {
          ...state.pushSettings,
          quietHours: newQuietHours,
        };
        storage.set(StorageKeys.PUSH_SETTINGS, newSettings);
        return { pushSettings: newSettings };
      });
    },

    toggleDoNotDisturb: () => {
      set((state) => {
        const newSettings = {
          ...state.pushSettings,
          doNotDisturb: !state.pushSettings.doNotDisturb,
        };
        storage.set(StorageKeys.PUSH_SETTINGS, newSettings);
        return { pushSettings: newSettings };
      });
    },

    setShowNotificationPanel: (show: boolean) => {
      set({ showNotificationPanel: show });
    },

    isInQuietHours: () => {
      const { pushSettings } = get();
      return isTimeInQuietHours(pushSettings.quietHours);
    },

    shouldShowNotification: (type: NotificationType): boolean => {
      const { pushSettings } = get();

      if (!pushSettings.enabled) return false;
      if (pushSettings.doNotDisturb) return false;
      if (isTimeInQuietHours(pushSettings.quietHours)) return false;

      switch (type) {
        case 'road_reminder':
          return pushSettings.roadReminderEnabled;
        case 'weather_alert':
          return pushSettings.weatherAlertEnabled;
        case 'weekly_report':
          return pushSettings.weeklyReportEnabled;
        case 'system':
          return true;
        default:
          return true;
      }
    },
  };
});

export const useNotifications = () =>
  useNotificationStore((state) => state.notifications);
export const useUnreadCount = () =>
  useNotificationStore((state) => state.unreadCount);
export const usePushSettings = () =>
  useNotificationStore((state) => state.pushSettings);
export const useWsStatus = () =>
  useNotificationStore((state) => state.wsStatus);
export const useShowNotificationPanel = () =>
  useNotificationStore((state) => state.showNotificationPanel);

export const useAddNotification = () =>
  useNotificationStore((state) => state.addNotification);
export const useMarkAsRead = () =>
  useNotificationStore((state) => state.markAsRead);
export const useMarkAllAsRead = () =>
  useNotificationStore((state) => state.markAllAsRead);
export const useClearNotifications = () =>
  useNotificationStore((state) => state.clearNotifications);
export const useRemoveNotification = () =>
  useNotificationStore((state) => state.removeNotification);

export const useUpdatePushSettings = () =>
  useNotificationStore((state) => state.updatePushSettings);
export const useUpdateQuietHours = () =>
  useNotificationStore((state) => state.updateQuietHours);
export const useToggleDoNotDisturb = () =>
  useNotificationStore((state) => state.toggleDoNotDisturb);

export const useSetShowNotificationPanel = () =>
  useNotificationStore((state) => state.setShowNotificationPanel);

export const useInitWebSocket = () =>
  useNotificationStore((state) => state.initWebSocket);
export const useDisconnectWebSocket = () =>
  useNotificationStore((state) => state.disconnectWebSocket);

export const useShouldShowNotification = () =>
  useNotificationStore((state) => state.shouldShowNotification);
export const useIsInQuietHours = () =>
  useNotificationStore((state) => state.isInQuietHours);
