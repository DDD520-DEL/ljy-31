import { Photo, OCRResult } from '../types';
import { generateId } from './format';

const MAX_IMAGE_WIDTH = 1920;
const MAX_IMAGE_HEIGHT = 1080;
const THUMBNAIL_WIDTH = 200;
const THUMBNAIL_HEIGHT = 200;
const JPEG_QUALITY = 0.85;
const THUMBNAIL_QUALITY = 0.7;

export interface ProcessedImage {
  dataUrl: string;
  thumbnail: string;
  width: number;
  height: number;
  fileSize: number;
}

export const createImageElement = (src: string): Promise<HTMLImageElement> => {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = src;
  });
};

export const drawImageToCanvas = (
  img: HTMLImageElement,
  maxWidth: number,
  maxHeight: number
): { canvas: HTMLCanvasElement; width: number; height: number } => {
  let { width, height } = img;
  const ratio = Math.min(maxWidth / width, maxHeight / height, 1);

  width = Math.round(width * ratio);
  height = Math.round(height * ratio);

  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('无法创建 Canvas 上下文');
  ctx.drawImage(img, 0, 0, width, height);

  return { canvas, width, height };
};

export const fileToDataUrl = (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
};

export const processImageFile = async (file: File): Promise<ProcessedImage> => {
  const dataUrl = await fileToDataUrl(file);
  const img = await createImageElement(dataUrl);

  const { canvas, width, height } = drawImageToCanvas(
    img,
    MAX_IMAGE_WIDTH,
    MAX_IMAGE_HEIGHT
  );
  const compressedDataUrl = canvas.toDataURL('image/jpeg', JPEG_QUALITY);

  const { canvas: thumbnailCanvas } = drawImageToCanvas(
    img,
    THUMBNAIL_WIDTH,
    THUMBNAIL_HEIGHT
  );
  const thumbnail = thumbnailCanvas.toDataURL('image/jpeg', THUMBNAIL_QUALITY);

  const base64Length = compressedDataUrl.length - 'data:image/jpeg;base64,'.length;
  const fileSize = Math.round((base64Length * 3) / 4);

  return {
    dataUrl: compressedDataUrl,
    thumbnail,
    width,
    height,
    fileSize,
  };
};

export const formatFileSize = (bytes: number): string => {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
};

export const createPhotoFromFile = async (
  file: File,
  recordId: string
): Promise<Omit<Photo, 'id' | 'uploadedAt'>> => {
  const processed = await processImageFile(file);

  return {
    recordId,
    dataUrl: processed.dataUrl,
    thumbnail: processed.thumbnail,
    fileName: file.name || `photo_${Date.now()}.jpg`,
    fileSize: processed.fileSize,
    mimeType: 'image/jpeg',
    width: processed.width,
    height: processed.height,
    ocrStatus: 'pending',
  };
};
