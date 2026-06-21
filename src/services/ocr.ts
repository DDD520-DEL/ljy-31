import { OCRResult } from '../types';

export interface OCRRecognizeOptions {
  timeout?: number;
}

const extractDateFromText = (text: string): { date?: string; time?: string } => {
  const datePatterns = [
    /(\d{4})[-\/年\.](\d{1,2})[-\/月\.](\d{1,2})[日号]?/,
    /(\d{1,2})[-\/月\.](\d{1,2})[-\/日\.](\d{4})/,
  ];

  const timePatterns = [
    /(\d{1,2}):(\d{2})(?::(\d{2}))?/,
    /(\d{1,2})[时点](\d{2})[分]?/,
    /上午\s*(\d{1,2})[:：]?(\d{2})/,
    /下午\s*(\d{1,2})[:：]?(\d{2})/,
  ];

  let date: string | undefined;
  for (const pattern of datePatterns) {
    const match = text.match(pattern);
    if (match) {
      let year = match[1];
      let month = match[2];
      let day = match[3];
      if (year.length === 2) {
        year = `20${year}`;
      }
      if (month.length === 1) month = `0${month}`;
      if (day.length === 1) day = `0${day}`;
      date = `${year}-${month}-${day}`;
      break;
    }
  }

  let time: string | undefined;
  for (const pattern of timePatterns) {
    const match = text.match(pattern);
    if (match) {
      let hour = match[1];
      const minute = match[2] || '00';
      if (text.includes('下午') && parseInt(hour) < 12) {
        hour = String(parseInt(hour) + 12);
      }
      if (hour.length === 1) hour = `0${hour}`;
      time = `${hour}:${minute.padStart(2, '0')}`;
      break;
    }
  }

  return { date, time };
};

const extractLocationFromText = (text: string): string | undefined => {
  const roadPatterns = [
    /([\u4e00-\u9fa5A-Za-z0-9]{2,}(?:路|街|道|大道|巷|弄|高速|公路|桥))/,
    /([\u4e00-\u9fa5A-Za-z0-9]{2,}与[\u4e00-\u9fa5A-Za-z0-9]{2,}(?:路|街|道)交叉口)/,
    /在([\u4e00-\u9fa5A-Za-z0-9]{2,}(?:路|街|道))/,
  ];

  for (const pattern of roadPatterns) {
    const match = text.match(pattern);
    if (match) {
      return match[1];
    }
  }

  return undefined;
};

export const recognizePhotoOCR = async (
  dataUrl: string,
  options: OCRRecognizeOptions = {}
): Promise<OCRResult> => {
  const { timeout = 5000 } = options;
  const startTime = Date.now();

  await new Promise((resolve) => setTimeout(resolve, 800 + Math.random() * 700));

  const fakeTextPool = [
    '',
    '2024-01-15 08:30 中山路',
    '拍摄时间:2024/01/15 下午2:15 人民大道',
    '01-15 8:30 建设街',
    '2024年1月15日 14时30分 解放路与人民路交叉口',
  ];
  const rawText = fakeTextPool[Math.floor(Math.random() * fakeTextPool.length)];

  const { date, time } = extractDateFromText(rawText);
  const detectedLocation = extractLocationFromText(rawText);

  const confidence = rawText.length > 0 ? 0.6 + Math.random() * 0.35 : 0.1 + Math.random() * 0.2;

  const elapsed = Date.now() - startTime;
  if (elapsed > timeout) {
    return {
      timestamp: Date.now(),
      rawText: '',
      confidence: 0,
      error: 'OCR 识别超时',
    };
  }

  return {
    timestamp: Date.now(),
    rawText,
    detectedDate: date,
    detectedTime: time,
    detectedLocation,
    confidence,
  };
};
