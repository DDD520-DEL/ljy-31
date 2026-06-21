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
} from 'lucide-react';
import {
  useSettings,
  useAppStore,
  useLoadMockData,
  useExportData,
  useRecords,
} from '../store/useAppStore';
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

export default function SettingsPage() {
  const navigate = useNavigate();
  const settings = useSettings();
  const updateSettings = useAppStore((state) => state.updateSettings);
  const loadMockData = useLoadMockData();
  const exportData = useExportData();
  const records = useRecords();
  const [showResetConfirm, setShowResetConfirm] = useState(false);

  const handleReminderToggle = () => {
    updateSettings({ reminderEnabled: !settings.reminderEnabled });
  };

  const handleReminderMinutesChange = (minutes: number) => {
    updateSettings({ reminderMinutes: minutes });
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
