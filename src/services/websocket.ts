import { NotificationMessage, WebSocketStatus, NotificationType } from '../types';
import { generateId } from '../utils/format';

type MessageHandler = (message: NotificationMessage) => void;
type StatusHandler = (status: WebSocketStatus) => void;

class WebSocketService {
  private status: WebSocketStatus = {
    connected: false,
    connecting: false,
    lastConnectTime: null,
    lastDisconnectTime: null,
    reconnectAttempts: 0,
  };

  private messageHandlers: Set<MessageHandler> = new Set();
  private statusHandlers: Set<StatusHandler> = new Set();
  private mockInterval: ReturnType<typeof setInterval> | null = null;
  private favoriteRoads: string[] = [];
  private maxReconnectAttempts = 5;
  private reconnectDelay = 3000;
  private mockMode = true;
  private wsUrl = '';

  setFavoriteRoads(roads: string[]) {
    this.favoriteRoads = roads;
  }

  getFavoriteRoads(): string[] {
    return [...this.favoriteRoads];
  }

  connect(url?: string) {
    if (url) {
      this.wsUrl = url;
      this.mockMode = false;
    }

    if (this.status.connected || this.status.connecting) {
      return;
    }

    this.updateStatus({ connecting: true });

    if (this.mockMode) {
      this.simulateMockConnection();
    } else {
      this.connectRealWebSocket();
    }
  }

  disconnect() {
    if (this.mockInterval) {
      clearInterval(this.mockInterval);
      this.mockInterval = null;
    }

    this.updateStatus({
      connected: false,
      connecting: false,
      lastDisconnectTime: Date.now(),
    });
  }

  onMessage(handler: MessageHandler) {
    this.messageHandlers.add(handler);
    return () => this.messageHandlers.delete(handler);
  }

  onStatusChange(handler: StatusHandler) {
    this.statusHandlers.add(handler);
    return () => this.statusHandlers.delete(handler);
  }

  getStatus(): WebSocketStatus {
    return { ...this.status };
  }

  subscribe(topic: string) {
    console.log('WebSocket subscribe:', topic);
  }

  unsubscribe(topic: string) {
    console.log('WebSocket unsubscribe:', topic);
  }

  send(data: Record<string, unknown>) {
    console.log('WebSocket send:', data);
  }

  private updateStatus(updates: Partial<WebSocketStatus>) {
    this.status = { ...this.status, ...updates };
    this.statusHandlers.forEach((handler) => handler({ ...this.status }));
  }

  private simulateMockConnection() {
    setTimeout(() => {
      this.updateStatus({
        connected: true,
        connecting: false,
        lastConnectTime: Date.now(),
        reconnectAttempts: 0,
      });

      this.startMockNotifications();
    }, 1000);
  }

  private startMockNotifications() {
    if (this.mockInterval) {
      clearInterval(this.mockInterval);
    }

    this.mockInterval = setInterval(() => {
      if (this.status.connected && this.favoriteRoads.length > 0) {
        const randomRoad = this.favoriteRoads[Math.floor(Math.random() * this.favoriteRoads.length)];
        const now = new Date();
        const minutesToAdd = Math.floor(Math.random() * 30) + 5;
        now.setMinutes(now.getMinutes() + minutesToAdd);

        const predictedTime = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;

        const message: NotificationMessage = {
          id: generateId(),
          type: 'road_reminder',
          title: '洒水车即将经过提醒',
          content: `收藏路段「${randomRoad}」预计 ${predictedTime} 可能有洒水车经过，请注意避让！`,
          roadName: randomRoad,
          predictedTime,
          probability: Math.round(Math.random() * 30 + 70),
          timestamp: Date.now(),
          read: false,
        };

        this.messageHandlers.forEach((handler) => handler(message));
      }
    }, 60000);
  }

  private connectRealWebSocket() {
    console.log('Real WebSocket connection not implemented yet');
    setTimeout(() => {
      this.updateStatus({
        connected: false,
        connecting: false,
        lastDisconnectTime: Date.now(),
      });
      this.attemptReconnect();
    }, 2000);
  }

  private attemptReconnect() {
    if (this.status.reconnectAttempts >= this.maxReconnectAttempts) {
      console.log('Max reconnect attempts reached');
      return;
    }

    const delay = this.reconnectDelay * Math.pow(2, this.status.reconnectAttempts);

    setTimeout(() => {
      this.updateStatus({
        reconnectAttempts: this.status.reconnectAttempts + 1,
        connecting: true,
      });

      if (this.mockMode) {
        this.simulateMockConnection();
      } else {
        this.connectRealWebSocket();
      }
    }, delay);
  }

  simulateNotification(type: NotificationType, title: string, content: string, data?: Record<string, unknown>) {
    const message: NotificationMessage = {
      id: generateId(),
      type,
      title,
      content,
      timestamp: Date.now(),
      read: false,
      data,
    };
    this.messageHandlers.forEach((handler) => handler(message));
  }
}

export const websocketService = new WebSocketService();
