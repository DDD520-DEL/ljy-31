import { useRef, useState } from 'react';
import { Camera, ImagePlus, X, Loader2, Trash2, AlertCircle, Sparkles } from 'lucide-react';
import { Photo, OCRResult } from '../types';
import { cn } from '../lib/utils';
import { createPhotoFromFile, formatFileSize } from '../utils/photo';
import { recognizePhotoOCR } from '../services/ocr';
import { checkCanAddPhoto, formatSize } from '../utils/storageManager';
import { usePhotos, useStorageInfo } from '../store/useAppStore';
import PhotoViewer from './PhotoViewer';

export interface TempPhoto extends Omit<Photo, 'id' | 'uploadedAt'> {
  tempId: string;
}

interface PhotoUploaderProps {
  photos: TempPhoto[];
  onChange: (photos: TempPhoto[]) => void;
  onOCRResult?: (index: number, result: OCRResult) => void;
  recordId: string;
  maxPhotos?: number;
  disabled?: boolean;
}

export default function PhotoUploader({
  photos,
  onChange,
  onOCRResult,
  recordId,
  maxPhotos = 5,
  disabled = false,
}: PhotoUploaderProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);
  const allPhotos = usePhotos();
  const storageInfo = useStorageInfo();
  const [isProcessing, setIsProcessing] = useState(false);
  const [processingIndex, setProcessingIndex] = useState<number | null>(null);
  const [viewerOpen, setViewerOpen] = useState(false);
  const [viewerIndex, setViewerIndex] = useState(0);
  const [error, setError] = useState<string | null>(null);

  const handleFiles = async (files: FileList | null) => {
    if (!files || files.length === 0) return;
    if (disabled) return;

    setError(null);
    const remainingSlots = maxPhotos - photos.length;
    if (remainingSlots <= 0) {
      setError(`最多只能上传 ${maxPhotos} 张照片`);
      return;
    }

    const filesToProcess = Array.from(files).slice(0, remainingSlots);

    setIsProcessing(true);
    const newPhotos: TempPhoto[] = [];

    try {
      for (const file of filesToProcess) {
        if (!file.type.startsWith('image/')) {
          continue;
        }

        const check = checkCanAddPhoto([...allPhotos, ...photos.map(p => ({ ...p, id: p.tempId, uploadedAt: Date.now() } as Photo))], file.size);
        if (!check.canAdd) {
          setError(check.reason || '存储空间不足');
          continue;
        }

        try {
          const photoData = await createPhotoFromFile(file, recordId);
          const tempId = `temp_${Date.now()}_${Math.random().toString(36).slice(2)}`;
          newPhotos.push({ ...photoData, tempId });
        } catch (err) {
          console.error('处理图片失败:', err);
        }
      }

      if (newPhotos.length > 0) {
        onChange([...photos, ...newPhotos]);

        newPhotos.forEach((photo, idx) => {
          const globalIndex = photos.length + idx;
          runOCR(photo, globalIndex);
        });
      }
    } finally {
      setIsProcessing(false);
    }
  };

  const runOCR = async (photo: TempPhoto, index: number) => {
    setProcessingIndex(index);
    try {
      const result = await recognizePhotoOCR(photo.dataUrl);
      onChange(
        photos.map((p, i) =>
          i === index
            ? { ...p, ocrStatus: result.confidence > 0.5 ? 'success' : 'failed', ocrResult: result }
            : p
        )
      );
      onOCRResult?.(index, result);
    } catch (err) {
      onChange(
        photos.map((p, i) =>
          i === index
            ? { ...p, ocrStatus: 'failed', ocrResult: { timestamp: Date.now(), rawText: '', confidence: 0, error: err instanceof Error ? err.message : 'OCR失败' } }
            : p
        )
      );
    } finally {
      setProcessingIndex(null);
    }
  };

  const removePhoto = (index: number) => {
    onChange(photos.filter((_, i) => i !== index));
  };

  const openViewer = (index: number) => {
    setViewerIndex(index);
    setViewerOpen(true);
  };

  const viewerPhotos: Photo[] = photos.map((p) => ({
    ...p,
    id: p.tempId,
    uploadedAt: Date.now(),
  }));

  return (
    <div className="space-y-3">
      {error && (
        <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-200 rounded-xl text-red-600 text-sm">
          <AlertCircle className="w-4 h-4 flex-shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {storageInfo.quotaWarning && !storageInfo.quotaExceeded && (
        <div className="flex items-center gap-2 p-3 bg-amber-50 border border-amber-200 rounded-xl text-amber-700 text-sm">
          <AlertCircle className="w-4 h-4 flex-shrink-0" />
          <span>
            存储空间即将用完，已使用 {formatSize(storageInfo.usedSize)} / {formatSize(storageInfo.quotaLimit)}
          </span>
        </div>
      )}

      <div className="flex items-center gap-2 mb-1">
        <span className="text-sm font-medium text-slate-700">现场照片</span>
        <span className="text-xs text-slate-400">
          ({photos.length}/{maxPhotos})
        </span>
      </div>

      <div className="grid grid-cols-3 sm:grid-cols-4 gap-3">
        {photos.map((photo, index) => (
          <div
            key={photo.tempId}
            className="relative aspect-square rounded-xl overflow-hidden border border-slate-200 group"
          >
            <img
              src={photo.thumbnail}
              alt={photo.fileName}
              className="w-full h-full object-cover cursor-pointer"
              onClick={() => openViewer(index)}
            />

            <div className="absolute top-1.5 right-1.5 flex items-center gap-1">
              {photo.ocrStatus === 'processing' || processingIndex === index ? (
                <div className="w-6 h-6 rounded-full bg-sky-500/90 flex items-center justify-center">
                  <Loader2 className="w-3.5 h-3.5 text-white animate-spin" />
                </div>
              ) : photo.ocrStatus === 'success' ? (
                <div
                  className="w-6 h-6 rounded-full bg-emerald-500/90 flex items-center justify-center"
                  title="OCR 识别成功"
                >
                  <Sparkles className="w-3.5 h-3.5 text-white" />
                </div>
              ) : null}
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  removePhoto(index);
                }}
                disabled={disabled || processingIndex === index}
                className={cn(
                  'w-6 h-6 rounded-full bg-black/60 flex items-center justify-center text-white opacity-0 group-hover:opacity-100 transition-opacity',
                  'hover:bg-red-500',
                  disabled && 'cursor-not-allowed'
                )}
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            </div>

            {photo.ocrStatus === 'failed' && photo.ocrResult?.error && (
              <div className="absolute bottom-0 left-0 right-0 bg-red-500/80 text-white text-xs px-2 py-1 text-center">
                识别失败
              </div>
            )}

            <div className="absolute bottom-1.5 left-1.5 text-xs text-white/90 bg-black/40 px-1.5 py-0.5 rounded">
              {formatFileSize(photo.fileSize)}
            </div>
          </div>
        ))}

        {photos.length < maxPhotos && !disabled && (
          <>
            <button
              onClick={() => cameraInputRef.current?.click()}
              disabled={isProcessing || storageInfo.quotaExceeded}
              className={cn(
                'aspect-square rounded-xl border-2 border-dashed border-slate-300 flex flex-col items-center justify-center gap-1.5 text-slate-500',
                'hover:border-sky-400 hover:text-sky-500 hover:bg-sky-50/50 transition-all',
                (isProcessing || storageInfo.quotaExceeded) && 'opacity-50 cursor-not-allowed'
              )}
              title="拍照"
            >
              <Camera className="w-6 h-6" />
              <span className="text-xs font-medium">拍照</span>
            </button>

            <button
              onClick={() => fileInputRef.current?.click()}
              disabled={isProcessing || storageInfo.quotaExceeded}
              className={cn(
                'aspect-square rounded-xl border-2 border-dashed border-slate-300 flex flex-col items-center justify-center gap-1.5 text-slate-500',
                'hover:border-sky-400 hover:text-sky-500 hover:bg-sky-50/50 transition-all',
                (isProcessing || storageInfo.quotaExceeded) && 'opacity-50 cursor-not-allowed'
              )}
              title="从相册选择"
            >
              <ImagePlus className="w-6 h-6" />
              <span className="text-xs font-medium">相册</span>
            </button>
          </>
        )}
      </div>

      <input
        ref={cameraInputRef}
        type="file"
        accept="image/*"
        capture="environment"
        multiple
        className="hidden"
        onChange={(e) => handleFiles(e.target.files)}
      />
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        multiple
        className="hidden"
        onChange={(e) => handleFiles(e.target.files)}
      />

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
