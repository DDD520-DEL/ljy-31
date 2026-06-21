import { useState } from 'react';
import { SprinklerRecord, Photo } from '../types';
import { formatDateTime, getSplashStatusText, getDirectionText } from '../utils/format';
import { Droplets, MapPin, Clock, Pencil, Trash2, MessageSquare, Camera, X } from 'lucide-react';
import { useGetPhotosByRecordId, usePhotos } from '../store/useAppStore';
import PhotoViewer from './PhotoViewer';

interface RecordCardProps {
  record: SprinklerRecord;
  onEdit?: (id: string) => void;
  onDelete?: (id: string) => void;
  showActions?: boolean;
}

export default function RecordCard({ record, onEdit, onDelete, showActions = true }: RecordCardProps) {
  const getPhotosByRecordId = useGetPhotosByRecordId();
  const allPhotos = usePhotos();
  const photos = getPhotosByRecordId(record.id);

  const [viewerOpen, setViewerOpen] = useState(false);
  const [viewerIndex, setViewerIndex] = useState(0);

  const openViewer = (index: number) => {
    setViewerIndex(index);
    setViewerOpen(true);
  };

  return (
    <div className="bg-white rounded-2xl p-5 shadow-sm border border-slate-100 transition-all duration-200 hover:shadow-md">
      <div className="flex items-start justify-between">
        <div className="flex items-start gap-3 flex-1">
          <div
            className={`w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0 ${
              record.isSplashed ? 'bg-orange-100' : 'bg-sky-100'
            }`}
          >
            <Droplets
              className={`w-6 h-6 ${record.isSplashed ? 'text-orange-500' : 'text-sky-600'}`}
            />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <MapPin className="w-4 h-4 text-slate-400 flex-shrink-0" />
              <span className="font-semibold text-slate-800 truncate">{record.road}</span>
            </div>
            <div className="flex items-center gap-2 text-sm text-slate-500 mb-2">
              <Clock className="w-4 h-4 flex-shrink-0" />
              <span>{formatDateTime(record.timestamp)}</span>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <span
                className={`inline-flex items-center px-2.5 py-1 rounded-lg text-xs font-medium ${
                  record.isSplashed
                    ? 'bg-orange-100 text-orange-700'
                    : 'bg-emerald-100 text-emerald-700'
                }`}
              >
                {getSplashStatusText(record.isSplashed)}
              </span>
              {record.direction && (
                <span className="inline-flex items-center px-2.5 py-1 rounded-lg text-xs font-medium bg-slate-100 text-slate-600">
                  {getDirectionText(record.direction)}
                </span>
              )}
              {photos.length > 0 && (
                <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-medium bg-sky-100 text-sky-700">
                  <Camera className="w-3 h-3" />
                  {photos.length}
                </span>
              )}
            </div>

            {photos.length > 0 && (
              <div className="mt-3 flex gap-2 flex-wrap">
                {photos.slice(0, 4).map((photo, idx) => (
                  <button
                    key={photo.id}
                    onClick={() => openViewer(idx)}
                    className="relative w-16 h-16 rounded-lg overflow-hidden border border-slate-200 hover:border-sky-400 transition-colors flex-shrink-0 group"
                  >
                    <img
                      src={photo.thumbnail}
                      alt={photo.fileName}
                      className="w-full h-full object-cover"
                    />
                    {idx === 3 && photos.length > 4 && (
                      <div className="absolute inset-0 bg-black/60 flex items-center justify-center text-white text-xs font-medium">
                        +{photos.length - 4}
                      </div>
                    )}
                    <div className="absolute inset-0 bg-sky-500/0 group-hover:bg-sky-500/10 transition-colors" />
                  </button>
                ))}
              </div>
            )}

            {record.note && (
              <div className="mt-3 flex items-start gap-2 text-sm text-slate-500 bg-slate-50 rounded-lg p-3">
                <MessageSquare className="w-4 h-4 mt-0.5 flex-shrink-0" />
                <span className="break-words">{record.note}</span>
              </div>
            )}
          </div>
        </div>

        {showActions && (onEdit || onDelete) && (
          <div className="flex items-center gap-1 ml-3 flex-shrink-0">
            {onEdit && (
              <button
                onClick={() => onEdit(record.id)}
                className="p-2 rounded-xl text-slate-400 hover:text-sky-600 hover:bg-sky-50 transition-colors"
                title="编辑"
              >
                <Pencil className="w-4 h-4" />
              </button>
            )}
            {onDelete && (
              <button
                onClick={() => onDelete(record.id)}
                className="p-2 rounded-xl text-slate-400 hover:text-red-600 hover:bg-red-50 transition-colors"
                title="删除"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            )}
          </div>
        )}
      </div>

      {viewerOpen && (
        <PhotoViewer
          photos={photos}
          currentIndex={viewerIndex}
          onClose={() => setViewerOpen(false)}
          onPrev={() => setViewerIndex((i) => Math.max(0, i - 1))}
          onNext={() => setViewerIndex((i) => Math.min(photos.length - 1, i + 1))}
        />
      )}
    </div>
  );
}
