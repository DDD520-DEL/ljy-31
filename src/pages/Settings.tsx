import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Settings,
  Bell,
  Clock,
  Star,
  ChevronRight,
  ArrowLeft,
  Download,
  RefreshCw,
  Trash2,
  AlertTriangle,
  Info,
  CloudRain,
  FileText,
  Calendar,
  Wifi,
  WifiOff,
  Volume2,
  Vibrate,
  Moon,
  BellRing,
  MapPin,
  BarChart3,
  HardDrive,
  Camera,
  Image,
  Globe,
  Users,
  UserX,
  Eye,
  EyeOff,
  ShieldCheck,
  Share2,
  Database,
  Trophy,
} from 'lucide-react';
import {
  useSettings,
  useAppStore,
  useLoadMockData,
  useExportData,
  useRecords,
  useWeeklyReports,
  useLatestWeeklyReport,
  useGenerateWeeklyReport,
  useIsGeneratingReport,
  useStorageInfo,
  usePhotos,
  useSetStorageQuota,
  useClearAllPhotos,
  useCommunitySettings,
  useUpdateCommunitySettings,
  useContributionStats,
  useShareAllRecords,
  useIsCommunitySyncing,
} from '../store/useAppStore';
import { formatSize, getStorageUsagePercentage, DEFAULT_STORAGE_QUOTA_MB } from '../utils/storageManager';
import {
  usePushSettings,
  useWsStatus,
  useUpdatePushSettings,
  useUpdateQuietHours,
  useToggleDoNotDisturb,
  useMarkAllAsRead,
  useClearNotifications,
  useNotifications,
  useUnreadCount,
} from '../store/useNotificationStore';
import { websocketService } from '../services/websocket';
import { Card, CardContent, CardHeader, CardTitle } from '../components/Card';
import { Button } from '../components/Button';
import { cn } from '../lib/utils';

const reminderOptions = [
  { value: 5, label: '5 分钟' },
  { value: 10, label: '10 分钟' },
  { value: 15, label: '15 分钟' },
  { value: 30, label: '30 分钟' },
  { value: 60, label: '1 小时' },
];

const weekDayOptions = [
  { value: 1, label: '周一' },
  { value: 2, label: '周二' },
  { value: 3, label: '周三' },
  { value: 4, label: '周四' },
  { value: 5, label: '周五' },
  { value: 6, label: '周六' },
  { value: 7, label: '周日' },
];

const pushHourOptions = Array.from({ length: 24 }, (_, i) => ({
  value: i,
  label: `${String(i).padStart(2, '0')}:00`,
}));

export default function SettingsPage() {
  const navigate = useNavigate();
  const settings = useSettings();
  const updateSettings = useAppStore((state) => state.updateSettings);
  const loadMockData = useLoadMockData();
  const exportData = useExportData();
  const records = useRecords();
  const weeklyReports = useWeeklyReports();
  const latestReport = useLatestWeeklyReport();
  const generateWeeklyReport = useGenerateWeeklyReport();
  const isGeneratingReport = useIsGeneratingReport();
  const storageInfo = useStorageInfo();
  const photos = usePhotos();
  const setStorageQuota = useSetStorageQuota();
  const clearAllPhotos = useClearAllPhotos();
  const [showResetConfirm, setShowResetConfirm] = useState(false);
  const [showClearPhotosConfirm, setShowClearPhotosConfirm] = useState(false);
  const [showQuotaSettings, setShowQuotaSettings] = useState(false);
  const [showShareAllConfirm, setShowShareAllConfirm] = useState(false);

  const communitySettings = useCommunitySettings();
  const updateCommunitySettings = useUpdateCommunitySettings();
  const contributionStats = useContributionStats();
  const shareAllRecords = useShareAllRecords();
  const isCommunitySyncing = useIsCommunitySyncing();

  const quotaOptions = [50, 100, 200, 500, 1000];
  const currentQuotaMB = Math.round(storageInfo.quotaLimit / (1024 * 1024));
  const usagePercent = getStorageUsagePercentage(storageInfo);

  const pushSettings = usePushSettings();
  const wsStatus = useWsStatus();
  const updatePushSettings = useUpdatePushSettings();
  const updateQuietHours = useUpdateQuietHours();
  const toggleDoNotDisturb = useToggleDoNotDisturb();
  const markAllAsRead = useMarkAllAsRead();
  const clearNotifications = useClearNotifications();
  const notifications = useNotifications();
  const unreadCount = useUnreadCount();

  const handlePushToggle = () => {
    updatePushSettings({ enabled: !pushSettings.enabled });
  };

  const handleRoadReminderToggle = () => {
    updatePushSettings({ roadReminderEnabled: !pushSettings.roadReminderEnabled });
  };

  const handleWeatherAlertToggle = () => {
    updatePushSettings({ weatherAlertEnabled: !pushSettings.weatherAlertEnabled });
  };

  const handleWeeklyReportPushToggle = () => {
    updatePushSettings({ weeklyReportEnabled: !pushSettings.weeklyReportEnabled });
  };

  const handleSoundToggle = () => {
    updatePushSettings({ sound: !pushSettings.sound });
  };

  const handleVibrateToggle = () => {
    updatePushSettings({ vibrate: !pushSettings.vibrate });
  };

  const handleQuietHoursToggle = () => {
    updateQuietHours({ enabled: !pushSettings.quietHours.enabled });
  };

  const handleQuietHoursStartChange = (hour: number, minute: number) => {
    updateQuietHours({ startHour: hour, startMinute: minute });
  };

  const handleQuietHoursEndChange = (hour: number, minute: number) => {
    updateQuietHours({ endHour: hour, endMinute: minute });
  };

  const handleTestNotification = () => {
    websocketService.simulateNotification(
      'road_reminder',
      '测试推送通知',
      '这是一条测试通知，用于验证推送功能是否正常工作。',
      { test: true }
    );
  };

  const handleReminderToggle = () => {
    updateSettings({ reminderEnabled: !settings.reminderEnabled });
  };

  const handleReminderMinutesChange = (minutes: number) => {
    updateSettings({ reminderMinutes: minutes });
  };

  const handleWeatherNotificationToggle = () => {
    updateSettings({ weatherNotificationEnabled: !settings.weatherNotificationEnabled });
  };

  const handleWeeklyAutoGenerateToggle = () => {
    updateSettings({
      weeklyReport: {
        ...settings.weeklyReport,
        autoGenerate: !settings.weeklyReport.autoGenerate,
      },
    });
  };

  const handlePushDayChange = (day: number) => {
    updateSettings({
      weeklyReport: {
        ...settings.weeklyReport,
        pushDay: day,
      },
    });
  };

  const handlePushHourChange = (hour: number) => {
    updateSettings({
      weeklyReport: {
        ...settings.weeklyReport,
        pushHour: hour,
      },
    });
  };

  const handleGenerateNow = () => {
    generateWeeklyReport();
  };

  const handleExport = () => {
    const data = exportData();
    const blob = new Blob([data], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `sprinkler-data-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleReset = () => {
    localStorage.clear();
    window.location.reload();
  };

  const handleClearPhotos = () => {
    clearAllPhotos();
    setShowClearPhotosConfirm(false);
  };

  const handleQuotaChange = (quotaMB: number) => {
    setStorageQuota(quotaMB);
  };

  const handleCommunityToggle = () => {
    updateCommunitySettings({ enabled: !communitySettings.enabled });
  };

  const handleUseCommunityDataToggle = () => {
    updateCommunitySettings({ useCommunityData: !communitySettings.useCommunityData });
  };

  const handleAutoShareToggle = () => {
    updateCommunitySettings({ autoShare: !communitySettings.autoShare });
  };

  const handleShareNotesToggle = () => {
    updateCommunitySettings({ shareNotes: !communitySettings.shareNotes });
  };

  const handleSharePhotosToggle = () => {
    updateCommunitySettings({ sharePhotos: !communitySettings.sharePhotos });
  };

  const handleAnonymityLevelChange = (level: 'full' | 'partial' | 'none') => {
    updateCommunitySettings({ anonymityLevel: level });
  };

  const handleShareAll = () => {
    shareAllRecords();
    setShowShareAllConfirm(false);
  };

  const toggleSwitchClass = (enabled: boolean) =>
    cn(
      'relative inline-flex h-7 w-12 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-sky-500 focus:ring-offset-2',
      enabled ? 'bg-sky-500' : 'bg-slate-200'
    );

  const toggleDotClass = (enabled: boolean) =>
    cn(
      'pointer-events-none inline-block h-6 w-6 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out',
      enabled ? 'translate-x-5' : 'translate-x-0'
    );

  return (
    <div className="p-4 space-y-6">
      <div className="flex items-center gap-3 pt-2">
        <button
          onClick={() => navigate(-1)}
          className="w-10 h-10 rounded-xl bg-white shadow-sm border border-slate-100 flex items-center justify-center text-slate-600 hover:bg-slate-50 transition-colors"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>
        <h1 className="text-xl font-bold text-slate-800">设置</h1>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Bell className="w-5 h-5 text-sky-500" />
            提醒设置
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="flex items-center justify-between">
            <div className="flex-1">
              <p className="font-medium text-slate-800">开启提醒</p>
              <p className="text-sm text-slate-500 mt-0.5">
                在预测时间前提醒您避开洒水路段
              </p>
            </div>
            <button
              onClick={handleReminderToggle}
              className={toggleSwitchClass(settings.reminderEnabled)}
              aria-pressed={settings.reminderEnabled}
            >
              <span
                aria-hidden="true"
                className={toggleDotClass(settings.reminderEnabled)}
              />
            </button>
          </div>

          <div className={cn(!settings.reminderEnabled && 'opacity-50 pointer-events-none')}>
            <div className="flex items-center gap-2 mb-3">
              <Clock className="w-4 h-4 text-slate-500" />
              <p className="font-medium text-slate-700">提前提醒时间</p>
            </div>
            <div className="grid grid-cols-5 gap-2">
              {reminderOptions.map((option) => (
                <button
                  key={option.value}
                  onClick={() => handleReminderMinutesChange(option.value)}
                  className={cn(
                    'py-2.5 px-2 rounded-xl text-sm font-medium transition-all',
                    settings.reminderMinutes === option.value
                      ? 'bg-sky-500 text-white shadow-md shadow-sky-500/30'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  )}
                >
                  {option.label}
                </button>
              ))}
            </div>
            <p className="text-xs text-slate-400 mt-2">
              将在洒水车预测经过前 {settings.reminderMinutes} 分钟提醒您
            </p>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CloudRain className="w-5 h-5 text-sky-500" />
            天气预警
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="flex items-center justify-between">
            <div className="flex-1">
              <p className="font-medium text-slate-800">天气预警通知</p>
              <p className="text-sm text-slate-500 mt-0.5">
                根据天气情况调整洒水车出没概率预测
              </p>
            </div>
            <button
              onClick={handleWeatherNotificationToggle}
              className={toggleSwitchClass(settings.weatherNotificationEnabled)}
              aria-pressed={settings.weatherNotificationEnabled}
            >
              <span
                aria-hidden="true"
                className={toggleDotClass(settings.weatherNotificationEnabled)}
              />
            </button>
          </div>

          <div className={cn(!settings.weatherNotificationEnabled && 'opacity-50 pointer-events-none')}>
            <div className="bg-sky-50 border border-sky-200 rounded-xl p-4">
              <div className="flex items-start gap-3">
                <CloudRain className="w-5 h-5 text-sky-500 flex-shrink-0 mt-0.5" />
                <div className="text-sm">
                  <p className="font-medium text-sky-800 mb-1">天气修正规则</p>
                  <ul className="space-y-1 text-sky-700">
                    <li>☀️ 晴天：洒水车概率 +20%</li>
                    <li>⛅ 多云：洒水车概率 不变</li>
                    <li>🌧️ 雨天：洒水车概率 -60%</li>
                    <li>⛈️ 暴雨：洒水车概率 -90%</li>
                    <li>❄️ 下雪：洒水车概率 -80%</li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BellRing className="w-5 h-5 text-rose-500" />
            推送设置
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="flex items-center justify-between">
            <div className="flex-1">
              <div className="flex items-center gap-2">
                <p className="font-medium text-slate-800">开启推送</p>
                {wsStatus.connected ? (
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-emerald-100 text-emerald-700">
                    <Wifi className="w-3 h-3" />
                    已连接
                  </span>
                ) : wsStatus.connecting ? (
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-amber-100 text-amber-700">
                    <RefreshCw className="w-3 h-3 animate-spin" />
                    连接中
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-slate-100 text-slate-500">
                    <WifiOff className="w-3 h-3" />
                    未连接
                  </span>
                )}
              </div>
              <p className="text-sm text-slate-500 mt-0.5">
                实时接收洒水车出没提醒和通知
              </p>
            </div>
            <button
              onClick={handlePushToggle}
              className={toggleSwitchClass(pushSettings.enabled)}
              aria-pressed={pushSettings.enabled}
            >
              <span
                aria-hidden="true"
                className={toggleDotClass(pushSettings.enabled)}
              />
            </button>
          </div>

          <div className={cn(!pushSettings.enabled && 'opacity-50 pointer-events-none')}>
            <p className="text-sm font-medium text-slate-700 mb-3">通知类型</p>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-sky-100 flex items-center justify-center">
                    <MapPin className="w-4 h-4 text-sky-600" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-slate-800">路段提醒</p>
                    <p className="text-xs text-slate-500">收藏路段预测时间提醒</p>
                  </div>
                </div>
                <button
                  onClick={handleRoadReminderToggle}
                  className={toggleSwitchClass(pushSettings.roadReminderEnabled)}
                  aria-pressed={pushSettings.roadReminderEnabled}
                >
                  <span
                    aria-hidden="true"
                    className={toggleDotClass(pushSettings.roadReminderEnabled)}
                  />
                </button>
              </div>

              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-emerald-100 flex items-center justify-center">
                    <CloudRain className="w-4 h-4 text-emerald-600" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-slate-800">天气预警</p>
                    <p className="text-xs text-slate-500">天气变化影响洒水概率时提醒</p>
                  </div>
                </div>
                <button
                  onClick={handleWeatherAlertToggle}
                  className={toggleSwitchClass(pushSettings.weatherAlertEnabled)}
                  aria-pressed={pushSettings.weatherAlertEnabled}
                >
                  <span
                    aria-hidden="true"
                    className={toggleDotClass(pushSettings.weatherAlertEnabled)}
                  />
                </button>
              </div>

              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-indigo-100 flex items-center justify-center">
                    <BarChart3 className="w-4 h-4 text-indigo-600" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-slate-800">周报推送</p>
                    <p className="text-xs text-slate-500">每周报告生成后推送通知</p>
                  </div>
                </div>
                <button
                  onClick={handleWeeklyReportPushToggle}
                  className={toggleSwitchClass(pushSettings.weeklyReportEnabled)}
                  aria-pressed={pushSettings.weeklyReportEnabled}
                >
                  <span
                    aria-hidden="true"
                    className={toggleDotClass(pushSettings.weeklyReportEnabled)}
                  />
                </button>
              </div>
            </div>
          </div>

          <div className={cn(!pushSettings.enabled && 'opacity-50 pointer-events-none')}>
            <p className="text-sm font-medium text-slate-700 mb-3">提醒方式</p>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-amber-100 flex items-center justify-center">
                    <Volume2 className="w-4 h-4 text-amber-600" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-slate-800">声音提醒</p>
                    <p className="text-xs text-slate-500">收到通知时播放提示音</p>
                  </div>
                </div>
                <button
                  onClick={handleSoundToggle}
                  className={toggleSwitchClass(pushSettings.sound)}
                  aria-pressed={pushSettings.sound}
                >
                  <span
                    aria-hidden="true"
                    className={toggleDotClass(pushSettings.sound)}
                  />
                </button>
              </div>

              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-purple-100 flex items-center justify-center">
                    <Vibrate className="w-4 h-4 text-purple-600" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-slate-800">震动提醒</p>
                    <p className="text-xs text-slate-500">收到通知时设备震动</p>
                  </div>
                </div>
                <button
                  onClick={handleVibrateToggle}
                  className={toggleSwitchClass(pushSettings.vibrate)}
                  aria-pressed={pushSettings.vibrate}
                >
                  <span
                    aria-hidden="true"
                    className={toggleDotClass(pushSettings.vibrate)}
                  />
                </button>
              </div>
            </div>
          </div>

          <div className={cn(!pushSettings.enabled && 'opacity-50 pointer-events-none')}>
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <Moon className="w-5 h-5 text-indigo-500" />
                <p className="font-medium text-slate-700">免打扰模式</p>
              </div>
              <button
                onClick={toggleDoNotDisturb}
                className={toggleSwitchClass(pushSettings.doNotDisturb)}
                aria-pressed={pushSettings.doNotDisturb}
              >
                <span
                  aria-hidden="true"
                  className={toggleDotClass(pushSettings.doNotDisturb)}
                />
              </button>
            </div>
            <p className="text-xs text-slate-400">
              开启后所有推送通知将被静默，不响铃不震动
            </p>
          </div>

          <div className={cn(!pushSettings.enabled && 'opacity-50 pointer-events-none')}>
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <Clock className="w-5 h-5 text-teal-500" />
                <p className="font-medium text-slate-700">静音时段</p>
              </div>
              <button
                onClick={handleQuietHoursToggle}
                className={toggleSwitchClass(pushSettings.quietHours.enabled)}
                aria-pressed={pushSettings.quietHours.enabled}
              >
                <span
                  aria-hidden="true"
                  className={toggleDotClass(pushSettings.quietHours.enabled)}
                />
              </button>
            </div>

            <div className={cn(!pushSettings.quietHours.enabled && 'opacity-50 pointer-events-none')}>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-xs text-slate-500 mb-2">开始时间</p>
                  <div className="flex items-center gap-1">
                    <select
                      value={pushSettings.quietHours.startHour}
                      onChange={(e) => handleQuietHoursStartChange(Number(e.target.value), pushSettings.quietHours.startMinute)}
                      className="flex-1 px-3 py-2 rounded-xl bg-slate-100 text-sm font-medium text-slate-700 focus:outline-none focus:ring-2 focus:ring-teal-500"
                    >
                      {Array.from({ length: 24 }, (_, i) => (
                        <option key={i} value={i}>
                          {String(i).padStart(2, '0')}
                        </option>
                      ))}
                    </select>
                    <span className="text-slate-400 font-medium">:</span>
                    <select
                      value={pushSettings.quietHours.startMinute}
                      onChange={(e) => handleQuietHoursStartChange(pushSettings.quietHours.startHour, Number(e.target.value))}
                      className="flex-1 px-3 py-2 rounded-xl bg-slate-100 text-sm font-medium text-slate-700 focus:outline-none focus:ring-2 focus:ring-teal-500"
                    >
                      {[0, 15, 30, 45].map((m) => (
                        <option key={m} value={m}>
                          {String(m).padStart(2, '0')}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
                <div>
                  <p className="text-xs text-slate-500 mb-2">结束时间</p>
                  <div className="flex items-center gap-1">
                    <select
                      value={pushSettings.quietHours.endHour}
                      onChange={(e) => handleQuietHoursEndChange(Number(e.target.value), pushSettings.quietHours.endMinute)}
                      className="flex-1 px-3 py-2 rounded-xl bg-slate-100 text-sm font-medium text-slate-700 focus:outline-none focus:ring-2 focus:ring-teal-500"
                    >
                      {Array.from({ length: 24 }, (_, i) => (
                        <option key={i} value={i}>
                          {String(i).padStart(2, '0')}
                        </option>
                      ))}
                    </select>
                    <span className="text-slate-400 font-medium">:</span>
                    <select
                      value={pushSettings.quietHours.endMinute}
                      onChange={(e) => handleQuietHoursEndChange(pushSettings.quietHours.endHour, Number(e.target.value))}
                      className="flex-1 px-3 py-2 rounded-xl bg-slate-100 text-sm font-medium text-slate-700 focus:outline-none focus:ring-2 focus:ring-teal-500"
                    >
                      {[0, 15, 30, 45].map((m) => (
                        <option key={m} value={m}>
                          {String(m).padStart(2, '0')}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>
              <p className="text-xs text-slate-400 mt-3">
                在设定的时段内，推送通知将被静音
              </p>
            </div>
          </div>

          <div className="pt-4 border-t border-slate-100 space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium text-slate-800">通知管理</p>
                <p className="text-sm text-slate-500 mt-0.5">
                  共 {notifications.length} 条通知，{unreadCount} 条未读
                </p>
              </div>
            </div>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={handleTestNotification}
                className="flex-1"
                disabled={!pushSettings.enabled}
              >
                <Bell className="w-4 h-4" />
                测试推送
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={markAllAsRead}
                className="flex-1"
                disabled={unreadCount === 0}
              >
                全部已读
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={clearNotifications}
                className="flex-1 text-red-500 hover:bg-red-50"
                disabled={notifications.length === 0}
              >
                <Trash2 className="w-4 h-4" />
                清空
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="w-5 h-5 text-indigo-500" />
            周报设置
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="flex items-center justify-between">
            <div className="flex-1">
              <p className="font-medium text-slate-800">自动生成周报</p>
              <p className="text-sm text-slate-500 mt-0.5">
                每周按设定时间自动生成洒水车出没周报
              </p>
            </div>
            <button
              onClick={handleWeeklyAutoGenerateToggle}
              className={toggleSwitchClass(settings.weeklyReport.autoGenerate)}
              aria-pressed={settings.weeklyReport.autoGenerate}
            >
              <span
                aria-hidden="true"
                className={toggleDotClass(settings.weeklyReport.autoGenerate)}
              />
            </button>
          </div>

          <div className={cn(!settings.weeklyReport.autoGenerate && 'opacity-50 pointer-events-none')}>
            <div className="flex items-center gap-2 mb-3">
              <Calendar className="w-4 h-4 text-slate-500" />
              <p className="font-medium text-slate-700">推送时间</p>
            </div>

            <div className="space-y-3">
              <div>
                <p className="text-xs text-slate-500 mb-2">每周</p>
                <div className="grid grid-cols-7 gap-1.5">
                  {weekDayOptions.map((option) => (
                    <button
                      key={option.value}
                      onClick={() => handlePushDayChange(option.value)}
                      className={cn(
                        'py-2 rounded-lg text-xs font-medium transition-all',
                        settings.weeklyReport.pushDay === option.value
                          ? 'bg-indigo-500 text-white shadow-md shadow-indigo-500/30'
                          : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                      )}
                    >
                      {option.label}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <p className="text-xs text-slate-500 mb-2">时间点</p>
                <div className="grid grid-cols-6 gap-1.5 max-h-32 overflow-y-auto pr-1">
                  {pushHourOptions.map((option) => (
                    <button
                      key={option.value}
                      onClick={() => handlePushHourChange(option.value)}
                      className={cn(
                        'py-1.5 rounded-lg text-xs font-medium transition-all',
                        settings.weeklyReport.pushHour === option.value
                          ? 'bg-indigo-500 text-white shadow-md shadow-indigo-500/30'
                          : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                      )}
                    >
                      {option.label}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <p className="text-xs text-slate-400 mt-2">
              将在每周
              <span className="text-indigo-600 font-medium mx-1">
                {weekDayOptions.find((d) => d.value === settings.weeklyReport.pushDay)?.label}
              </span>
              <span className="text-indigo-600 font-medium mx-1">
                {pushHourOptions.find((h) => h.value === settings.weeklyReport.pushHour)?.label}
              </span>
              自动生成周报并推送
            </p>
          </div>

          <div className="pt-4 border-t border-slate-100">
            <div className="flex items-center justify-between mb-3">
              <div>
                <p className="font-medium text-slate-800">周报管理</p>
                <p className="text-sm text-slate-500 mt-0.5">
                  已生成 {weeklyReports.length} 份周报
                  {latestReport && (
                    <span className="block text-xs text-slate-400 mt-0.5">
                      最新：{latestReport.weekStart} ~ {latestReport.weekEnd}
                    </span>
                  )}
                </p>
              </div>
              <Button
                onClick={handleGenerateNow}
                disabled={isGeneratingReport || records.length === 0}
                size="sm"
              >
                <RefreshCw className={cn('w-4 h-4', isGeneratingReport && 'animate-spin')} />
                {isGeneratingReport
                  ? '生成中...'
                  : weeklyReports.length > 0
                  ? '立即更新'
                  : '立即生成'}
              </Button>
            </div>

            {weeklyReports.length > 0 && (
              <button
                onClick={() => navigate('/statistics')}
                className="w-full flex items-center justify-between p-3 rounded-xl bg-indigo-50 hover:bg-indigo-100 transition-colors"
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-indigo-100 flex items-center justify-center">
                    <FileText className="w-5 h-5 text-indigo-600" />
                  </div>
                  <div className="text-left">
                    <p className="font-medium text-indigo-800">查看周报详情</p>
                    <p className="text-xs text-indigo-500">前往统计页查看完整周报分析</p>
                  </div>
                </div>
                <ChevronRight className="w-5 h-5 text-indigo-400" />
              </button>
            )}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Star className="w-5 h-5 text-amber-500" />
            常用路段
          </CardTitle>
        </CardHeader>
        <CardContent>
          {settings.favoriteRoads.length > 0 ? (
            <div className="space-y-2">
              <p className="text-sm text-slate-500 mb-3">
                已收藏 {settings.favoriteRoads.length} 个路段，在首页优先展示
              </p>
              <div className="flex flex-wrap gap-2">
                {settings.favoriteRoads.map((road) => (
                  <div
                    key={road}
                    className="flex items-center gap-2 px-3 py-2 bg-amber-50 border border-amber-200 rounded-xl"
                  >
                    <Star className="w-4 h-4 text-amber-500 fill-amber-500" />
                    <span className="text-sm font-medium text-amber-700">{road}</span>
                  </div>
                ))}
              </div>
              <p className="text-xs text-slate-400 mt-3">
                在时刻表页面点击星标可以添加或取消收藏
              </p>
            </div>
          ) : (
            <div className="text-center py-4">
              <Star className="w-10 h-10 text-slate-300 mx-auto mb-2" />
              <p className="text-slate-500 text-sm">还没有收藏的路段</p>
              <p className="text-slate-400 text-xs mt-1">
                在时刻表页面点击星标收藏常用路段
              </p>
              <Button
                variant="outline"
                size="sm"
                className="mt-3"
                onClick={() => navigate('/schedule')}
              >
                去收藏路段
                <ChevronRight className="w-4 h-4" />
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Globe className="w-5 h-5 text-purple-500" />
            社区数据共享
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="flex items-center justify-between">
            <div className="flex-1">
              <div className="flex items-center gap-2">
                <p className="font-medium text-slate-800">开启社区共享</p>
                {contributionStats && (
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-purple-100 text-purple-700">
                    <Trophy className="w-3 h-3" />
                    Lv.{contributionStats.level}
                  </span>
                )}
              </div>
              <p className="text-sm text-slate-500 mt-0.5">
                将您的洒水车记录匿名分享，获取更精准的预测
              </p>
            </div>
            <button
              onClick={handleCommunityToggle}
              className={cn(
                'relative inline-flex h-7 w-12 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2',
                communitySettings.enabled ? 'bg-purple-500' : 'bg-slate-200'
              )}
              aria-pressed={communitySettings.enabled}
            >
              <span
                aria-hidden="true"
                className={cn(
                  'pointer-events-none inline-block h-6 w-6 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out',
                  communitySettings.enabled ? 'translate-x-5' : 'translate-x-0'
                )}
              />
            </button>
          </div>

          <div className={cn(!communitySettings.enabled && 'opacity-50 pointer-events-none')}>
            <p className="text-sm font-medium text-slate-700 mb-3">共享范围</p>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-sky-100 flex items-center justify-center">
                    <Database className="w-4 h-4 text-sky-600" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-slate-800">使用社区数据</p>
                    <p className="text-xs text-slate-500">在预测中合并社区用户贡献的数据</p>
                  </div>
                </div>
                <button
                  onClick={handleUseCommunityDataToggle}
                  className={toggleSwitchClass(communitySettings.useCommunityData)}
                  aria-pressed={communitySettings.useCommunityData}
                >
                  <span aria-hidden="true" className={toggleDotClass(communitySettings.useCommunityData)} />
                </button>
              </div>

              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-emerald-100 flex items-center justify-center">
                    <Share2 className="w-4 h-4 text-emerald-600" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-slate-800">自动分享新记录</p>
                    <p className="text-xs text-slate-500">新增记录时自动上传到社区</p>
                  </div>
                </div>
                <button
                  onClick={handleAutoShareToggle}
                  className={toggleSwitchClass(communitySettings.autoShare)}
                  aria-pressed={communitySettings.autoShare}
                >
                  <span aria-hidden="true" className={toggleDotClass(communitySettings.autoShare)} />
                </button>
              </div>

              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-amber-100 flex items-center justify-center">
                    <FileText className="w-4 h-4 text-amber-600" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-slate-800">分享备注内容</p>
                    <p className="text-xs text-slate-500">包含您对记录的文字描述</p>
                  </div>
                </div>
                <button
                  onClick={handleShareNotesToggle}
                  className={toggleSwitchClass(communitySettings.shareNotes)}
                  aria-pressed={communitySettings.shareNotes}
                >
                  <span aria-hidden="true" className={toggleDotClass(communitySettings.shareNotes)} />
                </button>
              </div>

              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-rose-100 flex items-center justify-center">
                    <Camera className="w-4 h-4 text-rose-600" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-slate-800">分享照片</p>
                    <p className="text-xs text-slate-500">包含您拍摄的洒水车照片</p>
                  </div>
                </div>
                <button
                  onClick={handleSharePhotosToggle}
                  className={toggleSwitchClass(communitySettings.sharePhotos)}
                  aria-pressed={communitySettings.sharePhotos}
                >
                  <span aria-hidden="true" className={toggleDotClass(communitySettings.sharePhotos)} />
                </button>
              </div>
            </div>
          </div>

          <div className={cn(!communitySettings.enabled && 'opacity-50 pointer-events-none')}>
            <div className="flex items-center gap-2 mb-3">
              <ShieldCheck className="w-4 h-4 text-slate-500" />
              <p className="font-medium text-slate-700">匿名程度</p>
            </div>
            <div className="grid grid-cols-3 gap-2">
              <button
                onClick={() => handleAnonymityLevelChange('full')}
                className={cn(
                  'p-3 rounded-xl border-2 transition-all text-center',
                  communitySettings.anonymityLevel === 'full'
                    ? 'border-purple-500 bg-purple-50'
                    : 'border-slate-200 bg-white hover:bg-slate-50'
                )}
              >
                <div className={cn(
                  'w-8 h-8 mx-auto rounded-lg flex items-center justify-center mb-2',
                  communitySettings.anonymityLevel === 'full' ? 'bg-purple-500' : 'bg-slate-100'
                )}>
                  <UserX className={cn(
                    'w-4 h-4',
                    communitySettings.anonymityLevel === 'full' ? 'text-white' : 'text-slate-500'
                  )} />
                </div>
                <p className={cn(
                  'text-sm font-medium',
                  communitySettings.anonymityLevel === 'full' ? 'text-purple-700' : 'text-slate-700'
                )}>完全匿名</p>
                <p className="text-xs text-slate-400 mt-0.5">无用户标识</p>
              </button>

              <button
                onClick={() => handleAnonymityLevelChange('partial')}
                className={cn(
                  'p-3 rounded-xl border-2 transition-all text-center',
                  communitySettings.anonymityLevel === 'partial'
                    ? 'border-purple-500 bg-purple-50'
                    : 'border-slate-200 bg-white hover:bg-slate-50'
                )}
              >
                <div className={cn(
                  'w-8 h-8 mx-auto rounded-lg flex items-center justify-center mb-2',
                  communitySettings.anonymityLevel === 'partial' ? 'bg-purple-500' : 'bg-slate-100'
                )}>
                  <EyeOff className={cn(
                    'w-4 h-4',
                    communitySettings.anonymityLevel === 'partial' ? 'text-white' : 'text-slate-500'
                  )} />
                </div>
                <p className={cn(
                  'text-sm font-medium',
                  communitySettings.anonymityLevel === 'partial' ? 'text-purple-700' : 'text-slate-700'
                )}>部分匿名</p>
                <p className="text-xs text-slate-400 mt-0.5">随机ID</p>
              </button>

              <button
                onClick={() => handleAnonymityLevelChange('none')}
                className={cn(
                  'p-3 rounded-xl border-2 transition-all text-center',
                  communitySettings.anonymityLevel === 'none'
                    ? 'border-purple-500 bg-purple-50'
                    : 'border-slate-200 bg-white hover:bg-slate-50'
                )}
              >
                <div className={cn(
                  'w-8 h-8 mx-auto rounded-lg flex items-center justify-center mb-2',
                  communitySettings.anonymityLevel === 'none' ? 'bg-purple-500' : 'bg-slate-100'
                )}>
                  <Users className={cn(
                    'w-4 h-4',
                    communitySettings.anonymityLevel === 'none' ? 'text-white' : 'text-slate-500'
                  )} />
                </div>
                <p className={cn(
                  'text-sm font-medium',
                  communitySettings.anonymityLevel === 'none' ? 'text-purple-700' : 'text-slate-700'
                )}>实名贡献</p>
                <p className="text-xs text-slate-400 mt-0.5">显示昵称</p>
              </button>
            </div>
            <p className="text-xs text-slate-400 mt-2 flex items-center gap-1">
              <Info className="w-3 h-3" />
              您的个人信息和精确位置永远不会被共享
            </p>
          </div>

          {contributionStats && (
            <div className={cn(
              'pt-4 border-t border-slate-100',
              !communitySettings.enabled && 'opacity-50 pointer-events-none'
            )}>
              <div className="flex items-center justify-between mb-3">
                <div>
                  <p className="font-medium text-slate-800">我的贡献</p>
                  <p className="text-sm text-slate-500 mt-0.5">
                    已贡献 <span className="text-purple-600 font-medium">{contributionStats.totalContributed}</span> 条记录，
                    覆盖 <span className="text-purple-600 font-medium">{contributionStats.roadsContributed}</span> 条路段
                  </p>
                </div>
                <button
                  onClick={() => navigate('/community')}
                  className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-purple-50 text-purple-600 text-sm font-medium hover:bg-purple-100 transition-colors"
                >
                  <Globe className="w-4 h-4" />
                  查看社区
                </button>
              </div>

              {showShareAllConfirm ? (
                <div className="p-4 rounded-xl bg-purple-50 border border-purple-200">
                  <div className="flex items-start gap-3 mb-3">
                    <AlertTriangle className="w-5 h-5 text-purple-500 flex-shrink-0 mt-0.5" />
                    <div>
                      <p className="font-medium text-purple-800">确认分享所有记录？</p>
                      <p className="text-sm text-purple-600 mt-1">
                        将把您所有未分享的本地记录提交到社区数据库
                      </p>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={handleShareAll}
                      className="flex-1 bg-purple-500 text-white hover:bg-purple-600 border-purple-500"
                      disabled={isCommunitySyncing}
                    >
                      {isCommunitySyncing ? (
                        <>
                          <RefreshCw className="w-4 h-4 animate-spin" />
                          分享中...
                        </>
                      ) : (
                        <>
                          <Share2 className="w-4 h-4" />
                          确认分享
                        </>
                      )}
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setShowShareAllConfirm(false)}
                      className="flex-1"
                    >
                      取消
                    </Button>
                  </div>
                </div>
              ) : (
                <Button
                  variant="outline"
                  onClick={() => setShowShareAllConfirm(true)}
                  className="w-full"
                  disabled={isCommunitySyncing}
                >
                  {isCommunitySyncing ? (
                    <>
                      <RefreshCw className="w-4 h-4 animate-spin" />
                      正在同步...
                    </>
                  ) : (
                    <>
                      <Share2 className="w-4 h-4" />
                      一键分享所有记录
                    </>
                  )}
                </Button>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Settings className="w-5 h-5 text-slate-500" />
            数据管理
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <button
            onClick={handleExport}
            className="w-full flex items-center justify-between p-4 rounded-xl bg-slate-50 hover:bg-slate-100 transition-colors"
          >
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-emerald-100 flex items-center justify-center">
                <Download className="w-5 h-5 text-emerald-600" />
              </div>
              <div className="text-left">
                <p className="font-medium text-slate-800">导出数据</p>
                <p className="text-xs text-slate-500">导出所有记录和设置为 JSON 文件</p>
              </div>
            </div>
            <ChevronRight className="w-5 h-5 text-slate-400" />
          </button>

          <button
            onClick={loadMockData}
            className="w-full flex items-center justify-between p-4 rounded-xl bg-slate-50 hover:bg-slate-100 transition-colors"
          >
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-sky-100 flex items-center justify-center">
                <RefreshCw className="w-5 h-5 text-sky-600" />
              </div>
              <div className="text-left">
                <p className="font-medium text-slate-800">重置为示例数据</p>
                <p className="text-xs text-slate-500">
                  加载 {records.length} 条示例记录用于演示
                </p>
              </div>
            </div>
            <ChevronRight className="w-5 h-5 text-slate-400" />
          </button>

          {showResetConfirm ? (
            <div className="p-4 rounded-xl bg-red-50 border border-red-200">
              <div className="flex items-start gap-3 mb-3">
                <AlertTriangle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="font-medium text-red-800">确认清除所有数据？</p>
                  <p className="text-sm text-red-600 mt-1">
                    此操作不可恢复，所有记录和设置都将被清除
                  </p>
                </div>
              </div>
              <div className="flex gap-2">
                <Button
                  variant="danger"
                  size="sm"
                  onClick={handleReset}
                  className="flex-1"
                >
                  确认清除
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowResetConfirm(false)}
                  className="flex-1"
                >
                  取消
                </Button>
              </div>
            </div>
          ) : (
            <button
              onClick={() => setShowResetConfirm(true)}
              className="w-full flex items-center justify-between p-4 rounded-xl bg-slate-50 hover:bg-red-50 hover:border-red-200 transition-colors border border-transparent"
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-red-100 flex items-center justify-center">
                  <Trash2 className="w-5 h-5 text-red-600" />
                </div>
                <div className="text-left">
                  <p className="font-medium text-red-600">清除所有数据</p>
                  <p className="text-xs text-slate-500">删除所有记录和设置</p>
                </div>
              </div>
              <ChevronRight className="w-5 h-5 text-slate-400" />
            </button>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <HardDrive className="w-5 h-5 text-sky-500" />
            存储管理
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-5">
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-10 h-10 rounded-xl bg-sky-100 flex items-center justify-center">
                  <Image className="w-5 h-5 text-sky-600" />
                </div>
                <div>
                  <p className="font-medium text-slate-800">照片存储</p>
                  <p className="text-xs text-slate-500 mt-0.5">
                    已保存 {storageInfo.photoCount} 张照片
                  </p>
                </div>
              </div>
              <div className="text-right">
                <p className="font-medium text-slate-800">
                  {formatSize(storageInfo.usedSize)}
                </p>
                <p className="text-xs text-slate-500 mt-0.5">
                  / {formatSize(storageInfo.quotaLimit)}
                </p>
              </div>
            </div>

            <div className="w-full bg-slate-100 rounded-full h-3 overflow-hidden">
              <div
                className={cn(
                  'h-full rounded-full transition-all duration-500',
                  storageInfo.quotaExceeded
                    ? 'bg-red-500'
                    : storageInfo.quotaWarning
                    ? 'bg-amber-500'
                    : 'bg-sky-500'
                )}
                style={{ width: `${Math.min(100, usagePercent)}%` }}
              />
            </div>

            <div className="flex items-center gap-2 text-xs">
              <span
                className={cn(
                  'inline-flex items-center px-2 py-0.5 rounded-full font-medium',
                  storageInfo.quotaExceeded
                    ? 'bg-red-100 text-red-700'
                    : storageInfo.quotaWarning
                    ? 'bg-amber-100 text-amber-700'
                    : 'bg-emerald-100 text-emerald-700'
                )}
              >
                {storageInfo.quotaExceeded
                  ? '已超出限额'
                  : storageInfo.quotaWarning
                  ? '即将超出限额'
                  : '存储空间充足'}
              </span>
              <span className="text-slate-400">
                使用率 {usagePercent.toFixed(1)}%
              </span>
            </div>
          </div>

          <div className="pt-3 border-t border-slate-100">
            <button
              onClick={() => setShowQuotaSettings(!showQuotaSettings)}
              className="w-full flex items-center justify-between p-3 rounded-xl bg-slate-50 hover:bg-slate-100 transition-colors"
            >
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-indigo-100 flex items-center justify-center">
                  <Settings className="w-4.5 h-4.5 text-indigo-600" />
                </div>
                <div className="text-left">
                  <p className="font-medium text-slate-800 text-sm">存储限额设置</p>
                  <p className="text-xs text-slate-500 mt-0.5">
                    当前限额: {currentQuotaMB} MB
                  </p>
                </div>
              </div>
              <ChevronRight
                className={cn(
                  'w-5 h-5 text-slate-400 transition-transform',
                  showQuotaSettings && 'rotate-90'
                )}
              />
            </button>

            {showQuotaSettings && (
              <div className="mt-3 p-4 bg-slate-50 rounded-xl space-y-3">
                <p className="text-xs font-medium text-slate-600">选择存储限额</p>
                <div className="grid grid-cols-5 gap-2">
                  {quotaOptions.map((option) => (
                    <button
                      key={option}
                      onClick={() => handleQuotaChange(option)}
                      className={cn(
                        'py-2 rounded-lg text-xs font-medium transition-all',
                        currentQuotaMB === option
                          ? 'bg-sky-500 text-white shadow-md shadow-sky-500/30'
                          : 'bg-white text-slate-600 hover:bg-slate-200 border border-slate-200'
                      )}
                    >
                      {option >= 1000 ? `${option / 1000} GB` : `${option} MB`}
                    </button>
                  ))}
                </div>
                <p className="text-xs text-slate-400">
                  照片以压缩格式存储，每张约 100-300 KB
                </p>
              </div>
            )}
          </div>

          {showClearPhotosConfirm ? (
            <div className="p-4 rounded-xl bg-red-50 border border-red-200">
              <div className="flex items-start gap-3 mb-3">
                <AlertTriangle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="font-medium text-red-800">确认清除所有照片？</p>
                  <p className="text-sm text-red-600 mt-1">
                    此操作不可恢复，{storageInfo.photoCount} 张照片将被永久删除
                  </p>
                </div>
              </div>
              <div className="flex gap-2">
                <Button
                  variant="danger"
                  size="sm"
                  onClick={handleClearPhotos}
                  className="flex-1"
                  disabled={photos.length === 0}
                >
                  确认清除
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowClearPhotosConfirm(false)}
                  className="flex-1"
                >
                  取消
                </Button>
              </div>
            </div>
          ) : (
            <button
              onClick={() => setShowClearPhotosConfirm(true)}
              disabled={photos.length === 0}
              className={cn(
                'w-full flex items-center justify-between p-3 rounded-xl transition-colors border border-transparent',
                photos.length === 0
                  ? 'bg-slate-50 opacity-50 cursor-not-allowed'
                  : 'bg-slate-50 hover:bg-red-50 hover:border-red-200'
              )}
            >
              <div className="flex items-center gap-3">
                <div
                  className={cn(
                    'w-9 h-9 rounded-xl flex items-center justify-center',
                    photos.length === 0 ? 'bg-slate-200' : 'bg-red-100'
                  )}
                >
                  <Camera
                    className={cn(
                      'w-4.5 h-4.5',
                      photos.length === 0 ? 'text-slate-400' : 'text-red-600'
                    )}
                  />
                </div>
                <div className="text-left">
                  <p
                    className={cn(
                      'font-medium text-sm',
                      photos.length === 0 ? 'text-slate-400' : 'text-red-600'
                    )}
                  >
                    清除所有照片
                  </p>
                  <p className="text-xs text-slate-500 mt-0.5">
                    释放 {formatSize(storageInfo.usedSize)} 存储空间
                  </p>
                </div>
              </div>
              <ChevronRight className="w-5 h-5 text-slate-400" />
            </button>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Info className="w-5 h-5 text-slate-500" />
            关于
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          <div className="flex justify-between text-sm">
            <span className="text-slate-500">应用名称</span>
            <span className="font-medium text-slate-700">洒水车时刻表</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-slate-500">版本</span>
            <span className="font-medium text-slate-700">1.0.0</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-slate-500">数据存储</span>
            <span className="font-medium text-slate-700">本地存储</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-slate-500">总记录数</span>
            <span className="font-medium text-slate-700">{records.length} 条</span>
          </div>
        </CardContent>
      </Card>

      <div className="text-center text-xs text-slate-400 py-4">
        <p>💧 记录每一次相遇，避开每一次溅水</p>
      </div>
    </div>
  );
}
