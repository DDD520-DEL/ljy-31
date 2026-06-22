import { useState, useEffect, useMemo } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Droplets, MapPin, Clock, MessageSquare, Check, X, ArrowLeft, Camera, Sparkles, BookOpen, Tag, Navigation, Mic } from 'lucide-react';
import { useAddRecord, useUpdateRecord, useRecords, useAddPhoto, useGetPhotosByRecordId, usePhotos, useAppStore, useDeletePhoto, useUpdatePhoto, useRouteLibrary } from '../store/useAppStore';
import { useRoadList } from '../hooks/usePredictions';
import { Button } from '../components/Button';
import { Card, CardContent } from '../components/Card';
import { formatDate, formatTime, parseTimeString, getDayOfWeek, generateId } from '../utils/format';
import { cn } from '../lib/utils';
import PhotoUploader, { TempPhoto } from '../components/PhotoUploader';
import PhotoViewer from '../components/PhotoViewer';
import VoiceInputButton from '../components/VoiceInputButton';
import { ParsedSpeechResult } from '../utils/speechParser';
import { Photo, OCRResult } from '../types';

const directions = [
  { value: 'east', label: '向东' },
  { value: 'west', label: '向西' },
  { value: 'south', label: '向南' },
  { value: 'north', label: '向北' },
];

const directionLabels: Record<string, string> = {
  east: '向东',
  west: '向西',
  south: '向南',
  north: '向北',
};

export default function Record() {
  const navigate = useNavigate();
  const { id } = useParams();
  const addRecord = useAddRecord();
  const updateRecord = useUpdateRecord();
  const records = useRecords();
  const roadList = useRoadList();
  const routeLibrary = useRouteLibrary();
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
  const [showRouteLibrary, setShowRouteLibrary] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [speechResult, setSpeechResult] = useState<ParsedSpeechResult | null>(null);
  const [showSpeechConfirm, setShowSpeechConfirm] = useState(false);

  const [tempPhotos, setTempPhotos] = useState<TempPhoto[]>(
    existingPhotos.map((p) => ({ ...p, tempId: p.id }))
  );
  const [viewerOpen, setViewerOpen] = useState(false);
  const [viewerIndex, setViewerIndex] = useState(0);
  const [ocrApplied, setOcrApplied] = useState<Set<string>>(new Set());

  const filteredRoads = roadList.filter(
    (r) => r.toLowerCase().includes(road.toLowerCase()) && r !== road
  );

  useEffect(() => {
    if (!isEditing) {
      const voiceData = sessionStorage.getItem('voiceRecordData');
      if (voiceData) {
        try {
          const parsed = JSON.parse(voiceData) as ParsedSpeechResult;
          setSpeechResult(parsed);
          setShowSpeechConfirm(true);
        } catch (e) {
          console.error('Failed to parse voice data', e);
        } finally {
          sessionStorage.removeItem('voiceRecordData');
        }
      }
    }
  }, [isEditing]);

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

  const handleSpeechResult = (result: ParsedSpeechResult) => {
    setSpeechResult(result);
    setShowSpeechConfirm(true);
  };

  const applySpeechResult = () => {
    if (!speechResult) return;

    if (speechResult.date) {
      setDate(speechResult.date);
    }
    if (speechResult.time) {
      setTime(speechResult.time);
    }
    if (speechResult.road) {
      setRoad(speechResult.road);
    }
    if (speechResult.isSplashed !== undefined) {
      setIsSplashed(speechResult.isSplashed);
    }
    if (speechResult.rawText && !note) {
      setNote(speechResult.rawText);
    }

    setShowSpeechConfirm(false);
    setSpeechResult(null);
  };

  const cancelSpeechResult = () => {
    setShowSpeechConfirm(false);
    setSpeechResult(null);
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
        <div className="ml-auto">
          <VoiceInputButton
            onResult={handleSpeechResult}
            size="md"
            variant="primary"
          />
        </div>
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
            <label className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-sm font-medium text-slate-700">
                <MapPin className="w-4 h-4 text-sky-500" />
                路段
              </div>
              {routeLibrary.length > 0 && (
                <button
                  type="button"
                  onClick={() => setShowRouteLibrary(!showRouteLibrary)}
                  className={cn(
                    'flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all',
                    showRouteLibrary
                      ? 'bg-sky-500 text-white'
                      : 'bg-sky-50 text-sky-600 hover:bg-sky-100'
                  )}
                >
                  <BookOpen className="w-3.5 h-3.5" />
                  路线库
                </button>
              )}
            </label>

            {showRouteLibrary && routeLibrary.length > 0 && (
              <div className="bg-slate-50 rounded-xl p-3 space-y-2 border border-slate-200">
                <p className="text-xs text-slate-500 mb-2">从路线库快速选择：</p>
                <div className="space-y-2 max-h-48 overflow-y-auto">
                  {routeLibrary.map((item) => (
                    <button
                      key={item.id}
                      onClick={() => {
                        setRoad(item.roadName);
                        if (item.direction) {
                          setDirection(item.direction);
                        }
                        if (item.note && !note) {
                          setNote(item.note);
                        }
                        setShowRouteLibrary(false);
                      }}
                      className="w-full p-3 rounded-lg bg-white border border-slate-200 hover:border-sky-300 hover:bg-sky-50 transition-all text-left group"
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-medium text-slate-800 group-hover:text-sky-700">
                          {item.roadName}
                        </span>
                        {item.direction && (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-slate-100 text-slate-600 text-xs font-medium rounded-md">
                            <Navigation className="w-3 h-3" />
                            {directionLabels[item.direction]}
                          </span>
                        )}
                      </div>
                      {item.tags && item.tags.length > 0 && (
                        <div className="flex flex-wrap gap-1 mt-2">
                          {item.tags.slice(0, 3).map((tag, i) => (
                            <span
                              key={i}
                              className="inline-flex items-center gap-1 px-1.5 py-0.5 bg-amber-50 text-amber-600 text-xs font-medium rounded"
                            >
                              <Tag className="w-2.5 h-2.5" />
                              {tag}
                            </span>
                          ))}
                        </div>
                      )}
                    </button>
                  ))}
                </div>
              </div>
            )}

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

      {showSpeechConfirm && speechResult && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl w-full max-w-md shadow-2xl overflow-hidden">
            <div className="p-6">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-12 h-12 rounded-xl bg-sky-100 flex items-center justify-center">
                  <Mic className="w-6 h-6 text-sky-600" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-slate-800">语音识别结果</h3>
                  <p className="text-sm text-slate-500">确认以下信息是否正确</p>
                </div>
              </div>

              <div className="bg-slate-50 rounded-xl p-4 mb-4">
                <p className="text-sm text-slate-600 italic">"{speechResult.rawText}"</p>
              </div>

              <div className="space-y-3">
                {speechResult.date && (
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-slate-500">日期</span>
                    <span className="text-sm font-medium text-slate-800">{speechResult.date}</span>
                  </div>
                )}
                {speechResult.time && (
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-slate-500">时间</span>
                    <span className="text-sm font-medium text-slate-800">{speechResult.time}</span>
                  </div>
                )}
                {speechResult.road && (
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-slate-500">路段</span>
                    <span className="text-sm font-medium text-slate-800">{speechResult.road}</span>
                  </div>
                )}
                {speechResult.isSplashed !== undefined && (
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-slate-500">是否被溅到</span>
                    <span className={cn(
                      'text-sm font-medium',
                      speechResult.isSplashed ? 'text-orange-600' : 'text-emerald-600'
                    )}>
                      {speechResult.isSplashed ? '被溅到了' : '没被溅到'}
                    </span>
                  </div>
                )}
              </div>
            </div>

            <div className="border-t border-slate-100 p-4 flex gap-3">
              <button
                onClick={cancelSpeechResult}
                className="flex-1 py-2.5 rounded-xl border border-slate-200 text-slate-600 font-medium hover:bg-slate-50 transition-colors"
              >
                取消
              </button>
              <button
                onClick={applySpeechResult}
                className="flex-1 py-2.5 rounded-xl bg-gradient-to-r from-sky-500 to-blue-600 text-white font-medium hover:opacity-90 transition-opacity"
              >
                确认填入
              </button>
            </div>
          </div>
        </div>
      )}

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
