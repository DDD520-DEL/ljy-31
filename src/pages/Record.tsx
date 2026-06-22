import { useState, useEffect, useMemo } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Droplets, MapPin, Clock, MessageSquare, Check, X, ArrowLeft, Camera, Sparkles } from 'lucide-react';
import { useAddRecord, useUpdateRecord, useRecords, useAddPhoto, useGetPhotosByRecordId, usePhotos, useAppStore, useDeletePhoto, useUpdatePhoto } from '../store/useAppStore';
import { useRoadList } from '../hooks/usePredictions';
import { Button } from '../components/Button';
import { Card, CardContent } from '../components/Card';
import { formatDate, formatTime, parseTimeString, getDayOfWeek, generateId } from '../utils/format';
import { cn } from '../lib/utils';
import PhotoUploader, { TempPhoto } from '../components/PhotoUploader';
import PhotoViewer from '../components/PhotoViewer';
import { Photo, OCRResult } from '../types';

const directions = [
  { value: 'east', label: '向东' },
  { value: 'west', label: '向西' },
  { value: 'south', label: '向南' },
  { value: 'north', label: '向北' },
];

export default function Record() {
  const navigate = useNavigate();
  const { id } = useParams();
  const addRecord = useAddRecord();
  const updateRecord = useUpdateRecord();
  const records = useRecords();
  const roadList = useRoadList();
  const addPhoto = useAddPhoto();
  const deletePhoto = useDeletePhoto();
  const updatePhoto = useUpdatePhoto();
  const getPhotosByRecordId = useGetPhotosByRecordId();
  const allPhotos = usePhotos();

  const existingRecord = id ? records.find((r) => r.id === id) : null;
  const isEditing = !!existingRecord;

  const existingPhotos = useMemo(() => {
    if (!existingRecord) return [];
    return getPhotosByRecordId(existingRecord.id);
  }, [existingRecord, getPhotosByRecordId, allPhotos]);

  const now = new Date();
  const tempRecordId = useMemo(() => id || `temp_${generateId()}`, [id]);
  const [date, setDate] = useState(existingRecord?.date || formatDate(now.getTime()));
  const [time, setTime] = useState(existingRecord?.time || formatTime(now.getTime()));
  const [road, setRoad] = useState(existingRecord?.road || '');
  const [isSplashed, setIsSplashed] = useState<boolean | null>(existingRecord?.isSplashed ?? null);
  const [direction, setDirection] = useState(existingRecord?.direction || '');
  const [note, setNote] = useState(existingRecord?.note || '');
  const [showRoadSuggestions, setShowRoadSuggestions] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [tempPhotos, setTempPhotos] = useState<TempPhoto[]>(
    existingPhotos.map((p) => ({ ...p, tempId: p.id }))
  );
  const [viewerOpen, setViewerOpen] = useState(false);
  const [viewerIndex, setViewerIndex] = useState(0);
  const [ocrApplied, setOcrApplied] = useState<Set<string>>(new Set());

  const filteredRoads = roadList.filter(
    (r) => r.toLowerCase().includes(road.toLowerCase()) && r !== road
  );

  const handleOCRResult = (index: number, result: OCRResult) => {
    if (result.confidence < 0.5) return;

    const photo = tempPhotos[index];
    if (!photo || ocrApplied.has(photo.tempId)) return;

    let applied = false;

    if (result.detectedDate) {
      setDate(result.detectedDate);
      applied = true;
    }
    if (result.detectedTime) {
      setTime(result.detectedTime);
      applied = true;
    }
    if (result.detectedLocation && !road.trim()) {
      setRoad(result.detectedLocation);
      applied = true;
    }

    if (applied) {
      setOcrApplied((prev) => new Set(prev).add(photo.tempId));
    }
  };

  const viewerPhotos: Photo[] = tempPhotos.map((p) => ({
    ...p,
    id: p.tempId,
    uploadedAt: Date.now(),
  }));

  const handleSubmit = async () => {
    if (!road.trim() || isSplashed === null) {
      return;
    }

    setIsSubmitting(true);

    try {
      const { hour, minute } = parseTimeString(time);
      const dateTime = new Date(`${date}T${time}`);
      const timestamp = dateTime.getTime();

      let recordId: string;

      if (isEditing && id) {
        updateRecord(id, {
          timestamp,
          date,
          time,
          hour,
          minute,
          dayOfWeek: getDayOfWeek(timestamp),
          road: road.trim(),
          isSplashed,
          direction: (direction as 'east' | 'west' | 'south' | 'north') || undefined,
          note: note.trim() || undefined,
        });
        recordId = id;
      } else {
        const newRecord = {
          timestamp,
          date,
          time,
          hour,
          minute,
          dayOfWeek: getDayOfWeek(timestamp),
          road: road.trim(),
          isSplashed,
          direction: (direction as 'east' | 'west' | 'south' | 'north') || 'east',
          note: note.trim() || '',
          dataSource: 'local' as const,
        };
        addRecord(newRecord);
        const recordsNow = useAppStore.getState().records;
        recordId = recordsNow[0]?.id || id || '';
      }

      if (recordId) {
        const existingPhotoIds = new Set(
          existingPhotos.map((p) => p.id)
        );
        const keptPhotoIds = new Set(
          tempPhotos
            .filter((tp) => !tp.tempId.startsWith('temp_'))
            .map((tp) => tp.tempId)
        );

        const deletedPhotoIds = [...existingPhotoIds].filter(
          (pid) => !keptPhotoIds.has(pid)
        );
        deletedPhotoIds.forEach((pid) => deletePhoto(pid));

        tempPhotos.forEach((tp) => {
          const { tempId, ...photoData } = tp;
          if (tempId.startsWith('temp_')) {
            addPhoto({
              ...photoData,
              recordId,
            });
          } else {
            updatePhoto(tempId, {
              ...photoData,
              recordId,
            });
          }
        });
      }

      await new Promise((resolve) => setTimeout(resolve, 500));
      navigate('/');
    } finally {
      setIsSubmitting(false);
    }
  };

  const isFormValid = road.trim() && isSplashed !== null;

  return (
    <div className="p-4 space-y-6">
      <div className="flex items-center gap-3 pt-2">
        <button
          onClick={() => navigate(-1)}
          className="w-10 h-10 rounded-xl bg-white shadow-sm border border-slate-100 flex items-center justify-center text-slate-600 hover:bg-slate-50 transition-colors"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>
        <h1 className="text-xl font-bold text-slate-800">
          {isEditing ? '编辑记录' : '记录洒水车'}
        </h1>
      </div>

      <Card>
        <CardContent className="space-y-6">
          <div className="space-y-3">
            <label className="flex items-center gap-2 text-sm font-medium text-slate-700">
              <Clock className="w-4 h-4 text-sky-500" />
              时间
            </label>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <input
                  type="date"
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                  className="w-full px-4 py-3 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:border-sky-500 focus:ring-2 focus:ring-sky-500/20 outline-none transition-all text-slate-800"
                />
              </div>
              <div>
                <input
                  type="time"
                  value={time}
                  onChange={(e) => setTime(e.target.value)}
                  className="w-full px-4 py-3 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:border-sky-500 focus:ring-2 focus:ring-sky-500/20 outline-none transition-all text-slate-800"
                />
              </div>
            </div>
          </div>

          <div className="space-y-3">
            <label className="flex items-center gap-2 text-sm font-medium text-slate-700">
              <MapPin className="w-4 h-4 text-sky-500" />
              路段
            </label>
            <div className="relative">
              <input
                type="text"
                value={road}
                onChange={(e) => {
                  setRoad(e.target.value);
                  setShowRoadSuggestions(true);
                }}
                onFocus={() => setShowRoadSuggestions(true)}
                placeholder="请输入路段名称"
                className="w-full px-4 py-3 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:border-sky-500 focus:ring-2 focus:ring-sky-500/20 outline-none transition-all text-slate-800 placeholder-slate-400"
              />
              {showRoadSuggestions && filteredRoads.length > 0 && (
                <div className="absolute top-full left-0 right-0 mt-2 bg-white rounded-xl shadow-lg border border-slate-100 overflow-hidden z-10">
                  {filteredRoads.slice(0, 5).map((r) => (
                    <button
                      key={r}
                      onClick={() => {
                        setRoad(r);
                        setShowRoadSuggestions(false);
                      }}
                      className="w-full px-4 py-3 text-left text-slate-700 hover:bg-sky-50 transition-colors border-b border-slate-50 last:border-b-0"
                    >
                      {r}
                    </button>
                  ))}
                </div>
              )}
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
                    'w-12 h-12 rounded-full flex items-center justify-center',
                    isSplashed === true ? 'bg-orange-500 text-white' : 'bg-slate-100'
                  )}
                >
                  <Droplets className="w-6 h-6" />
                </div>
                <span className="font-medium">被溅到了</span>
                {isSplashed === true && <Check className="w-4 h-4" />}
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
                    'w-12 h-12 rounded-full flex items-center justify-center',
                    isSplashed === false ? 'bg-emerald-500 text-white' : 'bg-slate-100'
                  )}
                >
                  <X className="w-6 h-6" />
                </div>
                <span className="font-medium">没被溅到</span>
                {isSplashed === false && <Check className="w-4 h-4" />}
              </button>
            </div>
          </div>

          <div className="space-y-3">
            <label className="text-sm font-medium text-slate-700">行驶方向（可选）</label>
            <div className="grid grid-cols-4 gap-2">
              {directions.map((dir) => (
                <button
                  key={dir.value}
                  onClick={() => setDirection(direction === dir.value ? '' : dir.value)}
                  className={cn(
                    'py-2.5 px-3 rounded-xl text-sm font-medium transition-all',
                    direction === dir.value
                      ? 'bg-sky-500 text-white'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  )}
                >
                  {dir.label}
                </button>
              ))}
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
              placeholder="添加备注信息，如洒水车特别快、水量很大等"
              rows={3}
              className="w-full px-4 py-3 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:border-sky-500 focus:ring-2 focus:ring-sky-500/20 outline-none transition-all text-slate-800 placeholder-slate-400 resize-none"
            />
          </div>

          <div className="space-y-3 pt-2 border-t border-slate-100">
            <div className="flex items-center justify-between">
              <label className="flex items-center gap-2 text-sm font-medium text-slate-700">
                <Camera className="w-4 h-4 text-sky-500" />
                现场照片
              </label>
              <div className="flex items-center gap-1.5 text-xs text-emerald-600 bg-emerald-50 px-2 py-1 rounded-lg">
                <Sparkles className="w-3.5 h-3.5" />
                <span>支持 OCR 自动识别时间和地点</span>
              </div>
            </div>
            <PhotoUploader
              photos={tempPhotos}
              onChange={setTempPhotos}
              onOCRResult={handleOCRResult}
              recordId={tempRecordId}
              maxPhotos={5}
              disabled={isSubmitting}
            />
          </div>
        </CardContent>
      </Card>

      <div className="sticky bottom-0 pt-4">
        <Button
          onClick={handleSubmit}
          disabled={!isFormValid || isSubmitting}
          loading={isSubmitting}
          size="lg"
          fullWidth
        >
          {isEditing ? '保存修改' : '提交记录'}
        </Button>
      </div>

      {viewerOpen && (
        <PhotoViewer
          photos={viewerPhotos}
          currentIndex={viewerIndex}
          onClose={() => setViewerOpen(false)}
          onPrev={() => setViewerIndex((i) => Math.max(0, i - 1))}
          onNext={() => setViewerIndex((i) => Math.min(viewerPhotos.length - 1, i + 1))}
        />
      )}
    </div>
  );
}
