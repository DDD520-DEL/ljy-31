import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  FileText,
  ArrowLeft,
  Plus,
  Edit2,
  Trash2,
  X,
  Check,
  Navigation,
  MessageSquare,
  Droplets,
  MapPin,
  BookTemplate,
} from 'lucide-react';
import {
  useRecordTemplates,
  useAddRecordTemplate,
  useUpdateRecordTemplate,
  useDeleteRecordTemplate,
} from '../store/useAppStore';
import { Button } from '../components/Button';
import { Card, CardContent, CardHeader, CardTitle } from '../components/Card';
import { cn } from '../lib/utils';
import { RecordTemplate } from '../types';

const directions = [
  { value: 'east', label: '向东' },
  { value: 'west', label: '向西' },
  { value: 'south', label: '向南' },
  { value: 'north', label: '向北' },
];

const DirectionIcon = ({ direction }: { direction?: string }) => {
  const rotation: Record<string, number> = {
    east: 90,
    south: 180,
    west: 270,
    north: 0,
  };
  return (
    <Navigation
      className="w-4 h-4"
      style={{ transform: `rotate(${direction ? rotation[direction] || 0 : 0}deg)` }}
    />
  );
};

const getDirectionLabel = (direction?: string) => {
  return directions.find((d) => d.value === direction)?.label || '';
};

interface TemplateFormProps {
  initialData?: RecordTemplate;
  onSubmit: (data: Omit<RecordTemplate, 'id' | 'createdAt' | 'updatedAt'>) => void;
  onCancel: () => void;
}

function TemplateForm({ initialData, onSubmit, onCancel }: TemplateFormProps) {
  const [name, setName] = useState(initialData?.name || '');
  const [road, setRoad] = useState(initialData?.road || '');
  const [direction, setDirection] = useState(initialData?.direction || '');
  const [isSplashed, setIsSplashed] = useState<boolean | null>(initialData?.isSplashed ?? null);
  const [note, setNote] = useState(initialData?.note || '');

  const handleSubmit = () => {
    if (!name.trim() || !road.trim() || isSplashed === null) return;

    onSubmit({
      name: name.trim(),
      road: road.trim(),
      direction: (direction as 'east' | 'west' | 'south' | 'north') || undefined,
      isSplashed,
      note: note.trim() || undefined,
    });
  };

  const isValid = name.trim().length > 0 && road.trim().length > 0 && isSplashed !== null;

  return (
    <div className="space-y-5">
      <div className="space-y-3">
        <label className="flex items-center gap-2 text-sm font-medium text-slate-700">
          <FileText className="w-4 h-4 text-sky-500" />
          模板名称
        </label>
        <input
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="如：上班通勤、下班回家"
          className="w-full px-4 py-3 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:border-sky-500 focus:ring-2 focus:ring-sky-500/20 outline-none transition-all text-slate-800 placeholder-slate-400"
          autoFocus
        />
      </div>

      <div className="space-y-3">
        <label className="flex items-center gap-2 text-sm font-medium text-slate-700">
          <MapPin className="w-4 h-4 text-sky-500" />
          路段
        </label>
        <input
          type="text"
          value={road}
          onChange={(e) => setRoad(e.target.value)}
          placeholder="请输入路段名称，如：中山路"
          className="w-full px-4 py-3 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:border-sky-500 focus:ring-2 focus:ring-sky-500/20 outline-none transition-all text-slate-800 placeholder-slate-400"
        />
      </div>

      <div className="space-y-3">
        <label className="flex items-center gap-2 text-sm font-medium text-slate-700">
          <Navigation className="w-4 h-4 text-sky-500" />
          行驶方向（可选）
        </label>
        <div className="grid grid-cols-4 gap-2">
          {directions.map((dir) => (
            <button
              key={dir.value}
              onClick={() => setDirection(direction === dir.value ? '' : dir.value)}
              className={cn(
                'py-2.5 px-3 rounded-xl text-sm font-medium transition-all flex items-center justify-center gap-1.5',
                direction === dir.value
                  ? 'bg-sky-500 text-white'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              )}
            >
              <DirectionIcon direction={dir.value} />
              {dir.label}
            </button>
          ))}
        </div>
      </div>

      <div className="space-y-3">
        <label className="flex items-center gap-2 text-sm font-medium text-slate-700">
          <Droplets className="w-4 h-4 text-sky-500" />
          是否被溅到
        </label>
        <div className="grid grid-cols-2 gap-3">
          <button
            onClick={() => setIsSplashed(true)}
            className={cn(
              'flex flex-col items-center justify-center gap-2 p-4 rounded-xl border-2 transition-all',
              isSplashed === true
                ? 'border-orange-500 bg-orange-50 text-orange-700'
                : 'border-slate-200 bg-white text-slate-500 hover:border-orange-200'
            )}
          >
            <div
              className={cn(
                'w-10 h-10 rounded-full flex items-center justify-center',
                isSplashed === true ? 'bg-orange-500 text-white' : 'bg-slate-100'
              )}
            >
              <Droplets className="w-5 h-5" />
            </div>
            <span className="font-medium text-sm">被溅到了</span>
          </button>
          <button
            onClick={() => setIsSplashed(false)}
            className={cn(
              'flex flex-col items-center justify-center gap-2 p-4 rounded-xl border-2 transition-all',
              isSplashed === false
                ? 'border-emerald-500 bg-emerald-50 text-emerald-700'
                : 'border-slate-200 bg-white text-slate-500 hover:border-emerald-200'
            )}
          >
            <div
              className={cn(
                'w-10 h-10 rounded-full flex items-center justify-center',
                isSplashed === false ? 'bg-emerald-500 text-white' : 'bg-slate-100'
              )}
            >
              <X className="w-5 h-5" />
            </div>
            <span className="font-medium text-sm">没被溅到</span>
          </button>
        </div>
      </div>

      <div className="space-y-3">
        <label className="flex items-center gap-2 text-sm font-medium text-slate-700">
          <MessageSquare className="w-4 h-4 text-sky-500" />
          备注（可选）
        </label>
        <textarea
          value={note}
          onChange={(e) => setNote(e.target.value)}
          placeholder="添加备注信息"
          rows={2}
          className="w-full px-4 py-3 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:border-sky-500 focus:ring-2 focus:ring-sky-500/20 outline-none transition-all text-slate-800 placeholder-slate-400 resize-none"
        />
      </div>

      <div className="flex gap-3 pt-2">
        <Button
          variant="outline"
          onClick={onCancel}
          className="flex-1"
        >
          <X className="w-4 h-4" />
          取消
        </Button>
        <Button
          onClick={handleSubmit}
          disabled={!isValid}
          className="flex-1"
        >
          <Check className="w-4 h-4" />
          {initialData ? '保存修改' : '添加模板'}
        </Button>
      </div>
    </div>
  );
}

export default function RecordTemplates() {
  const navigate = useNavigate();
  const recordTemplates = useRecordTemplates();
  const addRecordTemplate = useAddRecordTemplate();
  const updateRecordTemplate = useUpdateRecordTemplate();
  const deleteRecordTemplate = useDeleteRecordTemplate();

  const [showAddForm, setShowAddForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);

  const editingItem = recordTemplates.find((item) => item.id === editingId);

  const handleAdd = (data: Omit<RecordTemplate, 'id' | 'createdAt' | 'updatedAt'>) => {
    addRecordTemplate(data);
    setShowAddForm(false);
  };

  const handleUpdate = (data: Omit<RecordTemplate, 'id' | 'createdAt' | 'updatedAt'>) => {
    if (editingId) {
      updateRecordTemplate(editingId, data);
      setEditingId(null);
    }
  };

  const handleDelete = (id: string) => {
    deleteRecordTemplate(id);
    setDeleteConfirmId(null);
  };

  return (
    <div className="p-4 space-y-6">
      <div className="flex items-center gap-3 pt-2">
        <button
          onClick={() => navigate(-1)}
          className="w-10 h-10 rounded-xl bg-white shadow-sm border border-slate-100 flex items-center justify-center text-slate-600 hover:bg-slate-50 transition-colors"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>
        <div className="flex-1">
          <h1 className="text-xl font-bold text-slate-800">记录模板管理</h1>
          <p className="text-sm text-slate-500">
            共 {recordTemplates.length} 个模板
          </p>
        </div>
        {!showAddForm && !editingId && (
          <Button
            onClick={() => setShowAddForm(true)}
            size="sm"
          >
            <Plus className="w-4 h-4" />
            添加
          </Button>
        )}
      </div>

      {showAddForm && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">添加新模板</CardTitle>
          </CardHeader>
          <CardContent>
            <TemplateForm
              onSubmit={handleAdd}
              onCancel={() => setShowAddForm(false)}
            />
          </CardContent>
        </Card>
      )}

      {editingItem && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">编辑模板</CardTitle>
          </CardHeader>
          <CardContent>
            <TemplateForm
              initialData={editingItem}
              onSubmit={handleUpdate}
              onCancel={() => setEditingId(null)}
            />
          </CardContent>
        </Card>
      )}

      {!showAddForm && !editingId && (
        <>
          {recordTemplates.length === 0 ? (
            <Card>
              <CardContent>
                <div className="text-center py-8">
                  <div className="w-16 h-16 rounded-full bg-slate-100 flex items-center justify-center mx-auto mb-4">
                    <BookTemplate className="w-8 h-8 text-slate-300" />
                  </div>
                  <p className="text-slate-500 font-medium">还没有添加模板</p>
                  <p className="text-sm text-slate-400 mt-1 mb-4">
                    添加常用记录模板，记录时可以快速填充
                  </p>
                  <Button
                    onClick={() => setShowAddForm(true)}
                    size="sm"
                  >
                    <Plus className="w-4 h-4" />
                    添加第一个模板
                  </Button>
                </div>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-3">
              {recordTemplates.map((item) => (
                <Card key={item.id}>
                  <CardContent className="py-4">
                    <div className="flex items-start gap-3">
                      <div className="w-10 h-10 rounded-xl bg-sky-100 flex items-center justify-center flex-shrink-0">
                        <FileText className="w-5 h-5 text-sky-600" />
                      </div>

                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <h3 className="font-semibold text-slate-800 truncate">
                            {item.name}
                          </h3>
                          <span
                            className={cn(
                              'inline-flex items-center gap-1 px-2 py-0.5 text-xs font-medium rounded-lg',
                              item.isSplashed
                                ? 'bg-orange-100 text-orange-600'
                                : 'bg-emerald-100 text-emerald-600'
                            )}
                          >
                            {item.isSplashed ? '被溅到' : '未溅到'}
                          </span>
                        </div>

                        <div className="flex items-center gap-2 mt-1.5">
                          <span className="text-sm text-slate-600 flex items-center gap-1">
                            <MapPin className="w-3.5 h-3.5 text-slate-400" />
                            {item.road}
                          </span>
                          {item.direction && (
                            <span className="inline-flex items-center gap-1 px-1.5 py-0.5 bg-slate-100 text-slate-600 text-xs rounded">
                              <DirectionIcon direction={item.direction} />
                              {getDirectionLabel(item.direction)}
                            </span>
                          )}
                        </div>

                        {item.note && (
                          <p className="text-sm text-slate-500 mt-2 line-clamp-1">
                            {item.note}
                          </p>
                        )}
                      </div>

                      <div className="flex items-center gap-1 flex-shrink-0">
                        {deleteConfirmId === item.id ? (
                          <div className="flex items-center gap-1">
                            <button
                              onClick={() => handleDelete(item.id)}
                              className="w-8 h-8 rounded-lg bg-red-500 text-white flex items-center justify-center hover:bg-red-600 transition-colors"
                              title="确认删除"
                            >
                              <Check className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => setDeleteConfirmId(null)}
                              className="w-8 h-8 rounded-lg bg-slate-100 text-slate-500 flex items-center justify-center hover:bg-slate-200 transition-colors"
                              title="取消"
                            >
                              <X className="w-4 h-4" />
                            </button>
                          </div>
                        ) : (
                          <div className="flex items-center gap-1">
                            <button
                              onClick={() => setEditingId(item.id)}
                              className="w-8 h-8 rounded-lg text-slate-500 flex items-center justify-center hover:bg-slate-100 transition-colors"
                              title="编辑"
                            >
                              <Edit2 className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => setDeleteConfirmId(item.id)}
                              className="w-8 h-8 rounded-lg text-slate-500 flex items-center justify-center hover:bg-red-50 hover:text-red-500 transition-colors"
                              title="删除"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </>
      )}

      {recordTemplates.length > 0 && !showAddForm && !editingId && (
        <div className="text-center">
          <p className="text-xs text-slate-400">
            💡 提示：在记录洒水车时，可以从模板快速填充所有字段
          </p>
        </div>
      )}
    </div>
  );
}
