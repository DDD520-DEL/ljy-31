import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, Trash2, Download, Calendar, MapPin, Filter, AlertTriangle } from 'lucide-react';
import { useRecords, useDeleteRecord, useExportData } from '../store/useAppStore';
import { Card, CardContent, CardHeader, CardTitle } from '../components/Card';
import { Button } from '../components/Button';
import RecordCard from '../components/RecordCard';
import { groupRecordsByDate } from '../utils/analysis';
import { formatDate, getDayName } from '../utils/format';
import { cn } from '../lib/utils';

type FilterType = 'all' | 'splashed' | 'notSplashed';

export default function History() {
  const navigate = useNavigate();
  const records = useRecords();
  const deleteRecord = useDeleteRecord();
  const exportData = useExportData();

  const [searchQuery, setSearchQuery] = useState('');
  const [filterType, setFilterType] = useState<FilterType>('all');
  const [showFilterMenu, setShowFilterMenu] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);

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

    return result.sort((a, b) => b.timestamp - a.timestamp);
  }, [records, searchQuery, filterType]);

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

  const handleExport = () => {
    const data = exportData();
    const blob = new Blob([data], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `sprinkler-records-${formatDate(Date.now())}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const filterOptions: Array<{ value: FilterType; label: string }> = [
    { value: 'all', label: '全部记录' },
    { value: 'splashed', label: '仅被溅到' },
    { value: 'notSplashed', label: '仅未溅到' },
  ];

  const stats = useMemo(() => {
    const total = records.length;
    const splashed = records.filter((r) => r.isSplashed).length;
    const thisMonth = records.filter(
      (r) => new Date(r.timestamp).getMonth() === new Date().getMonth()
    ).length;
    return { total, splashed, thisMonth };
  }, [records]);

  return (
    <div className="p-4 space-y-6">
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
          onClick={handleExport}
          className="flex items-center gap-2 px-4 py-3 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 transition-colors text-slate-600"
          title="导出数据"
        >
          <Download className="w-5 h-5" />
        </button>
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
                          <p className="text-sm font-medium text-red-700 mb-3">确认删除这条记录？</p>
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
              {searchQuery || filterType !== 'all' ? '未找到匹配记录' : '暂无记录'}
            </h3>
            <p className="text-slate-500 text-sm">
              {searchQuery || filterType !== 'all'
                ? '请尝试其他搜索条件或筛选方式'
                : '点击下方按钮开始记录洒水车出没'}
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
