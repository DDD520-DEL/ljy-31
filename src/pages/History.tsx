import { useState, useMemo, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Search,
  Download,
  Calendar,
  MapPin,
  Filter,
  AlertTriangle,
  Upload,
  X,
  CheckCircle,
  XCircle,
  ChevronDown,
  FileSpreadsheet,
  Info,
} from 'lucide-react';
import {
  useRecords,
  useDeleteRecord,
  useExportData,
  useExportRecordsCSV,
  useImportRecordsFromCSV,
} from '../store/useAppStore';
import { Card, CardContent, CardHeader, CardTitle } from '../components/Card';
import { Button } from '../components/Button';
import RecordCard from '../components/RecordCard';
import { groupRecordsByDate } from '../utils/analysis';
import { formatDate, getDayName } from '../utils/format';
import { downloadCSV } from '../utils/csv';
import { cn } from '../lib/utils';
import { ExportScope, ImportReport as ImportReportType } from '../types';

type FilterType = 'all' | 'splashed' | 'notSplashed';
type ExportFormat = 'json' | 'csv';

export default function History() {
  const navigate = useNavigate();
  const records = useRecords();
  const deleteRecord = useDeleteRecord();
  const exportData = useExportData();
  const exportRecordsCSV = useExportRecordsCSV();
  const importRecordsFromCSV = useImportRecordsFromCSV();

  const [searchQuery, setSearchQuery] = useState('');
  const [filterType, setFilterType] = useState<FilterType>('all');
  const [showFilterMenu, setShowFilterMenu] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);
  const [dateStart, setDateStart] = useState('');
  const [dateEnd, setDateEnd] = useState('');
  const [showExportMenu, setShowExportMenu] = useState(false);
  const [showDateRangePicker, setShowDateRangePicker] = useState(false);
  const [pendingExportFormat, setPendingExportFormat] = useState<ExportFormat>('csv');
  const [importReport, setImportReport] = useState<ImportReportType | null>(null);
  const [showImportReport, setShowImportReport] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);

  const filteredRecords = useMemo(() => {
    let result = [...records];

    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      result = result.filter(
        (r) =>
          r.road.toLowerCase().includes(query) ||
          (r.note && r.note.toLowerCase().includes(query))
      );
    }

    if (filterType === 'splashed') {
      result = result.filter((r) => r.isSplashed);
    } else if (filterType === 'notSplashed') {
      result = result.filter((r) => !r.isSplashed);
    }

    if (dateStart) {
      result = result.filter((r) => r.date >= dateStart);
    }
    if (dateEnd) {
      result = result.filter((r) => r.date <= dateEnd);
    }

    return result.sort((a, b) => b.timestamp - a.timestamp);
  }, [records, searchQuery, filterType, dateStart, dateEnd]);

  const groupedRecords = useMemo(() => {
    return groupRecordsByDate(filteredRecords);
  }, [filteredRecords]);

  const sortedDates = Object.keys(groupedRecords).sort((a, b) => b.localeCompare(a));

  const handleEdit = (id: string) => {
    navigate(`/record/${id}`);
  };

  const handleDelete = (id: string) => {
    if (deleteConfirm === id) {
      deleteRecord(id);
      setDeleteConfirm(null);
    } else {
      setDeleteConfirm(id);
      setTimeout(() => setDeleteConfirm(null), 3000);
    }
  };

  const executeExport = (scope: ExportScope, format: ExportFormat) => {
    if (scope === 'dateRange') {
      setPendingExportFormat(format);
      setShowDateRangePicker(true);
      setShowExportMenu(false);
      return;
    }

    let filename = `sprinkler-records-${formatDate(Date.now())}`;
    let content = '';

    if (format === 'json') {
      content = exportData();
      filename += '.json';
    } else {
      if (scope === 'filtered') {
        content = exportRecordsCSV({
          scope: 'filtered',
          filteredIds: filteredRecords.map((r) => r.id),
        });
        filename += `-filtered(${filteredRecords.length}).csv`;
      } else {
        content = exportRecordsCSV({ scope: 'all' });
        filename += '-all.csv';
      }
    }

    if (format === 'json') {
      const blob = new Blob([content], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = filename;
      a.click();
      URL.revokeObjectURL(url);
    } else {
      downloadCSV(content, filename);
    }

    setShowExportMenu(false);
    setPendingExportFormat('csv');
  };

  const confirmDateRangeExport = () => {
    if (!dateStart || !dateEnd) {
      return;
    }

    const format = pendingExportFormat;
    const filename = `sprinkler-records-${formatDate(Date.now())}`;

    if (format === 'json') {
      const rangeRecords = records.filter(
        (r) => r.date >= dateStart && r.date <= dateEnd
      );
      const data = {
        version: '1.0',
        exportedAt: new Date().toISOString(),
        records: rangeRecords,
        dateRange: { start: dateStart, end: dateEnd },
      };
      const blob = new Blob([JSON.stringify(data, null, 2)], {
        type: 'application/json',
      });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${filename}-${dateStart}_to_${dateEnd}.json`;
      a.click();
      URL.revokeObjectURL(url);
    } else {
      const content = exportRecordsCSV({
        scope: 'dateRange',
        dateRange: { start: dateStart, end: dateEnd },
      });
      downloadCSV(content, `${filename}-${dateStart}_to_${dateEnd}.csv`);
    }

    setShowDateRangePicker(false);
    setDateStart('');
    setDateEnd('');
    setPendingExportFormat('csv');
  };

  const handleImportClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      const text = await file.text();
      const report = importRecordsFromCSV(text);
      setImportReport(report);
      setShowImportReport(true);
    } catch (err) {
      const errorReport: ImportReportType = {
        total: 0,
        success: 0,
        failed: 0,
        items: [],
        startedAt: Date.now(),
        finishedAt: Date.now(),
        error: '文件读取失败: ' + (err instanceof Error ? err.message : '未知错误'),
      };
      setImportReport(errorReport);
      setShowImportReport(true);
    }

    e.target.value = '';
  };

  const clearDateFilters = () => {
    setDateStart('');
    setDateEnd('');
  };

  const filterOptions: Array<{ value: FilterType; label: string }> = [
    { value: 'all', label: '全部记录' },
    { value: 'splashed', label: '仅被溅到' },
    { value: 'notSplashed', label: '仅未溅到' },
  ];

  const hasActiveFilters = searchQuery.trim() || filterType !== 'all' || dateStart || dateEnd;

  const stats = useMemo(() => {
    const total = records.length;
    const splashed = records.filter((r) => r.isSplashed).length;
    const thisMonth = records.filter(
      (r) => new Date(r.timestamp).getMonth() === new Date().getMonth()
    ).length;
    return { total, splashed, thisMonth };
  }, [records]);

  const failedItems = importReport?.items.filter((i) => !i.success) || [];
  const successItems = importReport?.items.filter((i) => i.success) || [];

  return (
    <div className="p-4 space-y-6">
      <input
        ref={fileInputRef}
        type="file"
        accept=".csv"
        className="hidden"
        onChange={handleFileChange}
      />

      <div className="pt-2">
        <h1 className="text-2xl font-bold text-slate-800 mb-1">历史记录</h1>
        <p className="text-slate-500 text-sm">查看和管理所有洒水车记录</p>
      </div>

      <div className="grid grid-cols-3 gap-3">
        <Card hover className="text-center">
          <CardContent className="py-4">
            <p className="text-2xl font-bold text-slate-800">{stats.total}</p>
            <p className="text-xs text-slate-500 mt-1">总记录</p>
          </CardContent>
        </Card>
        <Card hover className="text-center">
          <CardContent className="py-4">
            <p className="text-2xl font-bold text-orange-600">{stats.splashed}</p>
            <p className="text-xs text-slate-500 mt-1">被溅次数</p>
          </CardContent>
        </Card>
        <Card hover className="text-center">
          <CardContent className="py-4">
            <p className="text-2xl font-bold text-sky-600">{stats.thisMonth}</p>
            <p className="text-xs text-slate-500 mt-1">本月记录</p>
          </CardContent>
        </Card>
      </div>

      <div className="space-y-3">
        <div className="flex items-center gap-3">
          <div className="flex-1 relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="搜索路段或备注..."
              className="w-full pl-12 pr-4 py-3 rounded-xl border border-slate-200 bg-white focus:border-sky-500 focus:ring-2 focus:ring-sky-500/20 outline-none transition-all text-slate-800 placeholder-slate-400"
            />
          </div>
          <div className="relative">
            <button
              onClick={() => setShowFilterMenu(!showFilterMenu)}
              className={cn(
                'flex items-center gap-2 px-4 py-3 rounded-xl border transition-colors',
                filterType !== 'all'
                  ? 'border-sky-500 bg-sky-50 text-sky-700'
                  : 'border-slate-200 bg-white hover:bg-slate-50 text-slate-600'
              )}
            >
              <Filter className="w-5 h-5" />
            </button>
            {showFilterMenu && (
              <div className="absolute right-0 top-full mt-2 bg-white rounded-xl shadow-lg border border-slate-100 overflow-hidden z-10 min-w-[140px]">
                {filterOptions.map((option) => (
                  <button
                    key={option.value}
                    onClick={() => {
                      setFilterType(option.value);
                      setShowFilterMenu(false);
                    }}
                    className={cn(
                      'w-full px-4 py-3 text-left text-sm transition-colors border-b border-slate-50 last:border-b-0',
                      filterType === option.value
                        ? 'bg-sky-50 text-sky-700 font-medium'
                        : 'text-slate-600 hover:bg-slate-50'
                    )}
                  >
                    {option.label}
                  </button>
                ))}
              </div>
            )}
          </div>
          <button
            onClick={handleImportClick}
            className="flex items-center gap-2 px-4 py-3 rounded-xl border border-emerald-200 bg-emerald-50 hover:bg-emerald-100 transition-colors text-emerald-700"
            title="导入 CSV"
          >
            <Upload className="w-5 h-5" />
          </button>
          <div className="relative">
            <button
              onClick={() => setShowExportMenu(!showExportMenu)}
              className="flex items-center gap-2 px-4 py-3 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 transition-colors text-slate-600"
              title="导出数据"
            >
              <Download className="w-5 h-5" />
              <ChevronDown className="w-4 h-4 -ml-1 opacity-60" />
            </button>
            {showExportMenu && (
              <div className="absolute right-0 top-full mt-2 bg-white rounded-xl shadow-lg border border-slate-100 overflow-hidden z-20 min-w-[200px]">
                <div className="px-4 py-2 text-xs font-medium text-slate-400 border-b border-slate-50">
                  导出为 CSV
                </div>
                <button
                  onClick={() => executeExport('all', 'csv')}
                  className="w-full px-4 py-3 text-left text-sm transition-colors hover:bg-slate-50 text-slate-700"
                >
                  <div className="font-medium">全部记录</div>
                  <div className="text-xs text-slate-400 mt-0.5">
                    共 {records.length} 条
                  </div>
                </button>
                <button
                  onClick={() => executeExport('filtered', 'csv')}
                  disabled={!hasActiveFilters}
                  className={cn(
                    'w-full px-4 py-3 text-left text-sm transition-colors border-t border-slate-50',
                    hasActiveFilters
                      ? 'hover:bg-slate-50 text-slate-700'
                      : 'opacity-40 cursor-not-allowed text-slate-400'
                  )}
                >
                  <div className="font-medium">当前筛选结果</div>
                  <div className="text-xs text-slate-400 mt-0.5">
                    {hasActiveFilters
                      ? `共 ${filteredRecords.length} 条`
                      : '请先设置筛选条件'}
                  </div>
                </button>
                <button
                  onClick={() => executeExport('dateRange', 'csv')}
                  className="w-full px-4 py-3 text-left text-sm transition-colors border-t border-slate-50 hover:bg-slate-50 text-slate-700"
                >
                  <div className="font-medium">指定日期范围...</div>
                  <div className="text-xs text-slate-400 mt-0.5">
                    自定义开始和结束日期
                  </div>
                </button>
                <div className="px-4 py-2 text-xs font-medium text-slate-400 border-t border-slate-100 bg-slate-50/50">
                  导出为 JSON (全量备份)
                </div>
                <button
                  onClick={() => executeExport('all', 'json')}
                  className="w-full px-4 py-3 text-left text-sm transition-colors hover:bg-slate-50 text-slate-700"
                >
                  <div className="font-medium">完整数据备份</div>
                  <div className="text-xs text-slate-400 mt-0.5">
                    包含设置和预测数据
                  </div>
                </button>
              </div>
            )}
          </div>
        </div>

        <div className="flex items-center gap-3 flex-wrap">
          <div className="flex items-center gap-2 text-sm">
            <Calendar className="w-4 h-4 text-slate-400" />
            <span className="text-slate-500">日期范围:</span>
          </div>
          <div className="flex items-center gap-2">
            <input
              type="date"
              value={dateStart}
              onChange={(e) => setDateStart(e.target.value)}
              className="px-3 py-2 rounded-lg border border-slate-200 bg-white focus:border-sky-500 focus:ring-2 focus:ring-sky-500/20 outline-none text-sm text-slate-700"
            />
            <span className="text-slate-400">至</span>
            <input
              type="date"
              value={dateEnd}
              onChange={(e) => setDateEnd(e.target.value)}
              className="px-3 py-2 rounded-lg border border-slate-200 bg-white focus:border-sky-500 focus:ring-2 focus:ring-sky-500/20 outline-none text-sm text-slate-700"
            />
          </div>
          {(dateStart || dateEnd) && (
            <button
              onClick={clearDateFilters}
              className="text-xs text-slate-500 hover:text-slate-700 flex items-center gap-1"
            >
              <X className="w-3 h-3" />
              清除
            </button>
          )}
          {hasActiveFilters && (
            <div className="ml-auto flex items-center gap-2 text-xs text-slate-500">
              <Info className="w-3.5 h-3.5" />
              当前筛选: {filteredRecords.length} 条记录
            </div>
          )}
        </div>
      </div>

      {filteredRecords.length > 0 ? (
        <div className="space-y-6">
          {sortedDates.map((date) => (
            <div key={date}>
              <div className="flex items-center gap-2 mb-3 sticky top-0 bg-gradient-to-b from-sky-50 via-sky-50/80 to-transparent py-2 z-10">
                <Calendar className="w-4 h-4 text-slate-400" />
                <span className="font-semibold text-slate-700">{date}</span>
                <span className="text-sm text-slate-400">
                  ({getDayName(new Date(date).getDay())})
                </span>
                <span className="ml-auto text-sm text-slate-400">
                  {groupedRecords[date].length} 条记录
                </span>
              </div>
              <div className="space-y-3">
                {groupedRecords[date].map((record) => (
                  <div key={record.id} className="relative">
                    <RecordCard
                      record={record}
                      onEdit={handleEdit}
                      onDelete={handleDelete}
                    />
                    {deleteConfirm === record.id && (
                      <div className="absolute inset-0 bg-red-50/95 backdrop-blur-sm rounded-2xl flex items-center justify-center z-20 border-2 border-red-200">
                        <div className="text-center">
                          <AlertTriangle className="w-8 h-8 text-red-500 mx-auto mb-2" />
                          <p className="text-sm font-medium text-red-700 mb-3">
                            确认删除这条记录？
                          </p>
                          <div className="flex items-center justify-center gap-2">
                            <Button
                              size="sm"
                              variant="danger"
                              onClick={() => handleDelete(record.id)}
                            >
                              确认删除
                            </Button>
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => setDeleteConfirm(null)}
                            >
                              取消
                            </Button>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      ) : (
        <Card>
          <CardContent className="text-center py-12">
            <div className="w-20 h-20 mx-auto rounded-full bg-slate-100 flex items-center justify-center mb-4">
              <MapPin className="w-10 h-10 text-slate-400" />
            </div>
            <h3 className="text-lg font-semibold text-slate-800 mb-2">
              {hasActiveFilters ? '未找到匹配记录' : '暂无记录'}
            </h3>
            <p className="text-slate-500 text-sm">
              {hasActiveFilters
                ? '请尝试其他搜索条件或筛选方式'
                : '点击下方按钮开始记录洒水车出没'}
            </p>
          </CardContent>
        </Card>
      )}

      {showDateRangePicker && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <Card className="w-full max-w-md">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center gap-2">
                  <Calendar className="w-5 h-5 text-sky-500" />
                  选择日期范围
                </CardTitle>
                <button
                  onClick={() => {
                    setShowDateRangePicker(false);
                    setDateStart('');
                    setDateEnd('');
                  }}
                  className="text-slate-400 hover:text-slate-600"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <label className="block text-sm font-medium text-slate-700">
                  开始日期
                </label>
                <input
                  type="date"
                  value={dateStart}
                  onChange={(e) => setDateStart(e.target.value)}
                  className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:border-sky-500 focus:ring-2 focus:ring-sky-500/20 outline-none"
                />
              </div>
              <div className="space-y-2">
                <label className="block text-sm font-medium text-slate-700">
                  结束日期
                </label>
                <input
                  type="date"
                  value={dateEnd}
                  onChange={(e) => setDateEnd(e.target.value)}
                  className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:border-sky-500 focus:ring-2 focus:ring-sky-500/20 outline-none"
                />
              </div>
              {dateStart && dateEnd && (
                <div className="text-sm text-slate-500 bg-sky-50 rounded-lg p-3">
                  预计导出{' '}
                  <span className="font-semibold text-sky-700">
                    {
                      records.filter(
                        (r) => r.date >= dateStart && r.date <= dateEnd
                      ).length
                    }
                  </span>{' '}
                  条记录
                </div>
              )}
              <div className="flex items-center justify-end gap-2 pt-2">
                <Button
                  variant="ghost"
                  onClick={() => {
                    setShowDateRangePicker(false);
                    setDateStart('');
                    setDateEnd('');
                  }}
                >
                  取消
                </Button>
                <Button
                  onClick={confirmDateRangeExport}
                  disabled={!dateStart || !dateEnd}
                >
                  确认导出
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {showImportReport && importReport && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <Card className="w-full max-w-2xl max-h-[85vh] flex flex-col">
            <CardHeader className="flex-shrink-0">
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center gap-2">
                  <FileSpreadsheet className="w-5 h-5 text-emerald-500" />
                  导入结果报告
                </CardTitle>
                <button
                  onClick={() => {
                    setShowImportReport(false);
                    setImportReport(null);
                  }}
                  className="text-slate-400 hover:text-slate-600"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </CardHeader>
            <CardContent className="flex-1 overflow-y-auto space-y-4">
              {importReport.error ? (
                <div className="bg-red-50 border border-red-200 rounded-xl p-4 flex items-start gap-3">
                  <AlertTriangle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="font-medium text-red-700">导入失败</p>
                    <p className="text-sm text-red-600 mt-1">{importReport.error}</p>
                  </div>
                </div>
              ) : (
                <>
                  <div className="grid grid-cols-3 gap-3">
                    <div className="bg-slate-50 rounded-xl p-4 text-center">
                      <p className="text-2xl font-bold text-slate-700">
                        {importReport.total}
                      </p>
                      <p className="text-xs text-slate-500 mt-1">总行数</p>
                    </div>
                    <div className="bg-emerald-50 rounded-xl p-4 text-center">
                      <p className="text-2xl font-bold text-emerald-600">
                        {importReport.success}
                      </p>
                      <p className="text-xs text-emerald-600 mt-1">成功导入</p>
                    </div>
                    <div className="bg-red-50 rounded-xl p-4 text-center">
                      <p className="text-2xl font-bold text-red-600">
                        {importReport.failed}
                      </p>
                      <p className="text-xs text-red-600 mt-1">失败</p>
                    </div>
                  </div>

                  {failedItems.length > 0 && (
                    <div className="space-y-2">
                      <h4 className="font-medium text-slate-700 flex items-center gap-2">
                        <XCircle className="w-4 h-4 text-red-500" />
                        失败明细 ({failedItems.length})
                      </h4>
                      <div className="space-y-2 max-h-64 overflow-y-auto">
                        {failedItems.map((item, idx) => (
                          <div
                            key={idx}
                            className="bg-red-50/50 border border-red-100 rounded-lg p-3 text-sm"
                          >
                            <div className="flex items-center justify-between mb-1">
                              <span className="font-medium text-red-700">
                                第 {item.lineNumber} 行
                              </span>
                              <span className="text-xs text-slate-500">
                                {item.row.date} {item.row.time} | {item.row.road}
                              </span>
                            </div>
                            <ul className="text-red-600 space-y-0.5">
                              {item.errors?.map((err, ei) => (
                                <li key={ei} className="flex items-start gap-1.5">
                                  <span className="text-red-400">•</span>
                                  {err}
                                </li>
                              ))}
                            </ul>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {successItems.length > 0 && (
                    <div className="space-y-2">
                      <h4 className="font-medium text-slate-700 flex items-center gap-2">
                        <CheckCircle className="w-4 h-4 text-emerald-500" />
                        成功导入示例 (最多显示 5 条)
                      </h4>
                      <div className="space-y-2 max-h-48 overflow-y-auto">
                        {successItems.slice(0, 5).map((item, idx) => (
                          <div
                            key={idx}
                            className="bg-emerald-50/50 border border-emerald-100 rounded-lg p-3 text-sm flex items-center justify-between"
                          >
                            <div>
                              <span className="font-medium text-slate-700">
                                第 {item.lineNumber} 行
                              </span>
                              <span className="mx-2 text-slate-400">|</span>
                              <span className="text-slate-600">
                                {item.row.date} {item.row.time}
                              </span>
                            </div>
                            <div className="flex items-center gap-2">
                              <span className="text-slate-500">{item.row.road}</span>
                              <span
                                className={cn(
                                  'px-2 py-0.5 rounded text-xs font-medium',
                                  item.row.isSplashed === '1' ||
                                  item.row.isSplashed?.toLowerCase() === 'true'
                                    ? 'bg-orange-100 text-orange-700'
                                    : 'bg-slate-100 text-slate-600'
                                )}
                              >
                                {item.row.isSplashed === '1' ||
                                item.row.isSplashed?.toLowerCase() === 'true'
                                  ? '被溅到'
                                  : '未被溅'}
                              </span>
                            </div>
                          </div>
                        ))}
                        {successItems.length > 5 && (
                          <p className="text-xs text-slate-400 text-center py-2">
                            还有 {successItems.length - 5} 条成功记录已省略
                          </p>
                        )}
                      </div>
                    </div>
                  )}
                </>
              )}
            </CardContent>
            <div className="border-t border-slate-100 p-4 flex justify-end flex-shrink-0">
              <Button
                onClick={() => {
                  setShowImportReport(false);
                  setImportReport(null);
                }}
              >
                完成
              </Button>
            </div>
          </Card>
        </div>
      )}
    </div>
  );
}
