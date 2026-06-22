import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  MapPin,
  ArrowLeft,
  Plus,
  Edit2,
  Trash2,
  X,
  Check,
  Tag,
  Navigation,
  MessageSquare,
  BookOpen,
} from 'lucide-react';
import {
  useRouteLibrary,
  useAddRouteItem,
  useUpdateRouteItem,
  useDeleteRouteItem,
} from '../store/useAppStore';
import { Button } from '../components/Button';
import { Card, CardContent, CardHeader, CardTitle } from '../components/Card';
import { cn } from '../lib/utils';
import { RouteLibraryItem } from '../types';

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

interface RouteFormProps {
  initialData?: RouteLibraryItem;
  onSubmit: (data: Omit<RouteLibraryItem, 'id' | 'createdAt' | 'updatedAt'>) => void;
  onCancel: () => void;
}

function RouteForm({ initialData, onSubmit, onCancel }: RouteFormProps) {
  const [roadName, setRoadName] = useState(initialData?.roadName || '');
  const [direction, setDirection] = useState(initialData?.direction || '');
  const [tagsInput, setTagsInput] = useState(initialData?.tags?.join(', ') || '');
  const [note, setNote] = useState(initialData?.note || '');

  const handleSubmit = () => {
    if (!roadName.trim()) return;

    const tags = tagsInput
      .split(',')
      .map((t) => t.trim())
      .filter((t) => t.length > 0);

    onSubmit({
      roadName: roadName.trim(),
      direction: (direction as 'east' | 'west' | 'south' | 'north') || undefined,
      tags,
      note: note.trim() || undefined,
    });
  };

  const isValid = roadName.trim().length > 0;

  return (
    <div className="space-y-5">
      <div className="space-y-3">
        <label className="flex items-center gap-2 text-sm font-medium text-slate-700">
          <MapPin className="w-4 h-4 text-sky-500" />
          路段名称
        </label>
        <input
          type="text"
          value={roadName}
          onChange={(e) => setRoadName(e.target.value)}
          placeholder="请输入路段名称，如：中山路"
          className="w-full px-4 py-3 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:border-sky-500 focus:ring-2 focus:ring-sky-500/20 outline-none transition-all text-slate-800 placeholder-slate-400"
          autoFocus
        />
      </div>

      <div className="space-y-3">
        <label className="flex items-center gap-2 text-sm font-medium text-slate-700">
          <Navigation className="w-4 h-4 text-sky-500" />
          通行方向（可选）
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
          <Tag className="w-4 h-4 text-sky-500" />
          自定义标签（可选）
        </label>
        <input
          type="text"
          value={tagsInput}
          onChange={(e) => setTagsInput(e.target.value)}
          placeholder="多个标签用逗号分隔，如：上班,常走,洒水多"
          className="w-full px-4 py-3 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:border-sky-500 focus:ring-2 focus:ring-sky-500/20 outline-none transition-all text-slate-800 placeholder-slate-400"
        />
        {tagsInput.trim() && (
          <div className="flex flex-wrap gap-1.5">
            {tagsInput
              .split(',')
              .map((t) => t.trim())
              .filter((t) => t.length > 0)
              .map((tag, i) => (
                <span
                  key={i}
                  className="inline-flex items-center gap-1 px-2.5 py-1 bg-sky-50 text-sky-600 text-xs font-medium rounded-lg"
                >
                  <Tag className="w-3 h-3" />
                  {tag}
                </span>
              ))}
          </div>
        )}
      </div>

      <div className="space-y-3">
        <label className="flex items-center gap-2 text-sm font-medium text-slate-700">
          <MessageSquare className="w-4 h-4 text-sky-500" />
          备注（可选）
        </label>
        <textarea
          value={note}
          onChange={(e) => setNote(e.target.value)}
          placeholder="添加备注信息，如洒水车通常几点经过等"
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
          {initialData ? '保存修改' : '添加路线'}
        </Button>
      </div>
    </div>
  );
}

export default function RouteLibrary() {
  const navigate = useNavigate();
  const routeLibrary = useRouteLibrary();
  const addRouteItem = useAddRouteItem();
  const updateRouteItem = useUpdateRouteItem();
  const deleteRouteItem = useDeleteRouteItem();

  const [showAddForm, setShowAddForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);

  const editingItem = routeLibrary.find((item) => item.id === editingId);

  const handleAdd = (data: Omit<RouteLibraryItem, 'id' | 'createdAt' | 'updatedAt'>) => {
    addRouteItem(data);
    setShowAddForm(false);
  };

  const handleUpdate = (data: Omit<RouteLibraryItem, 'id' | 'createdAt' | 'updatedAt'>) => {
    if (editingId) {
      updateRouteItem(editingId, data);
      setEditingId(null);
    }
  };

  const handleDelete = (id: string) => {
    deleteRouteItem(id);
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
          <h1 className="text-xl font-bold text-slate-800">路线库管理</h1>
          <p className="text-sm text-slate-500">
            共 {routeLibrary.length} 条常用路线
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
            <CardTitle className="text-base">添加新路线</CardTitle>
          </CardHeader>
          <CardContent>
            <RouteForm
              onSubmit={handleAdd}
              onCancel={() => setShowAddForm(false)}
            />
          </CardContent>
        </Card>
      )}

      {editingItem && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">编辑路线</CardTitle>
          </CardHeader>
          <CardContent>
            <RouteForm
              initialData={editingItem}
              onSubmit={handleUpdate}
              onCancel={() => setEditingId(null)}
            />
          </CardContent>
        </Card>
      )}

      {!showAddForm && !editingId && (
        <>
          {routeLibrary.length === 0 ? (
            <Card>
              <CardContent>
                <div className="text-center py-8">
                  <div className="w-16 h-16 rounded-full bg-slate-100 flex items-center justify-center mx-auto mb-4">
                    <BookOpen className="w-8 h-8 text-slate-300" />
                  </div>
                  <p className="text-slate-500 font-medium">还没有添加路线</p>
                  <p className="text-sm text-slate-400 mt-1 mb-4">
                    添加常用路段，记录时可以快速选择
                  </p>
                  <Button
                    onClick={() => setShowAddForm(true)}
                    size="sm"
                  >
                    <Plus className="w-4 h-4" />
                    添加第一条路线
                  </Button>
                </div>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-3">
              {routeLibrary.map((item) => (
                <Card key={item.id}>
                  <CardContent className="py-4">
                    <div className="flex items-start gap-3">
                      <div className="w-10 h-10 rounded-xl bg-sky-100 flex items-center justify-center flex-shrink-0">
                        <MapPin className="w-5 h-5 text-sky-600" />
                      </div>

                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <h3 className="font-semibold text-slate-800 truncate">
                            {item.roadName}
                          </h3>
                          {item.direction && (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-slate-100 text-slate-600 text-xs font-medium rounded-lg">
                              <DirectionIcon direction={item.direction} />
                              {getDirectionLabel(item.direction)}
                            </span>
                          )}
                        </div>

                        {item.tags && item.tags.length > 0 && (
                          <div className="flex flex-wrap gap-1.5 mt-2">
                            {item.tags.map((tag, i) => (
                              <span
                                key={i}
                                className="inline-flex items-center gap-1 px-2 py-0.5 bg-amber-50 text-amber-600 text-xs font-medium rounded-md"
                              >
                                <Tag className="w-3 h-3" />
                                {tag}
                              </span>
                            ))}
                          </div>
                        )}

                        {item.note && (
                          <p className="text-sm text-slate-500 mt-2 line-clamp-2">
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

      {routeLibrary.length > 0 && !showAddForm && !editingId && (
        <div className="text-center">
          <p className="text-xs text-slate-400">
            💡 提示：在记录洒水车时，可以从路线库快速选择路段
          </p>
        </div>
      )}
    </div>
  );
}
