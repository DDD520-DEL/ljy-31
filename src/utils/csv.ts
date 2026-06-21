import { SprinklerRecord, ImportReport, ImportReportItem } from '../types';
import { generateId, getDayOfWeek } from './format';

const REQUIRED_FIELDS = ['date', 'time', 'road', 'isSplashed'];

const CSV_HEADERS = [
  'id',
  'date',
  'time',
  'hour',
  'minute',
  'dayOfWeek',
  'timestamp',
  'road',
  'isSplashed',
  'direction',
  'note',
  'createdAt',
  'updatedAt',
];

const DATE_REGEX = /^\d{4}-\d{2}-\d{2}$/;
const TIME_REGEX = /^([01]?\d|2[0-3]):[0-5]\d$/;

const escapeCSV = (value: string | number | boolean | undefined | null): string => {
  if (value === undefined || value === null) return '';
  const str = String(value);
  if (str.includes(',') || str.includes('"') || str.includes('\n')) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  return str;
};

const unescapeCSV = (value: string): string => {
  if (value.startsWith('"') && value.endsWith('"')) {
    return value.slice(1, -1).replace(/""/g, '"');
  }
  return value.trim();
};

export const recordsToCSV = (records: SprinklerRecord[]): string => {
  const headerLine = CSV_HEADERS.join(',');
  const dataLines = records.map((record) =>
    CSV_HEADERS.map((field) => {
      const value = record[field as keyof SprinklerRecord];
      if (typeof value === 'boolean') return value ? '1' : '0';
      return escapeCSV(value);
    }).join(',')
  );
  return [headerLine, ...dataLines].join('\n');
};

const parseCSVLine = (line: string): string[] => {
  const result: string[] = [];
  let current = '';
  let inQuotes = false;

  for (let i = 0; i < line.length; i++) {
    const char = line[i];
    const nextChar = line[i + 1];

    if (inQuotes) {
      if (char === '"' && nextChar === '"') {
        current += '"';
        i++;
      } else if (char === '"') {
        inQuotes = false;
      } else {
        current += char;
      }
    } else {
      if (char === ',') {
        result.push(current);
        current = '';
      } else if (char === '"') {
        inQuotes = true;
      } else {
        current += char;
      }
    }
  }
  result.push(current);
  return result;
};

const parseCSV = (csvString: string): { headers: string[]; rows: Record<string, string>[] } => {
  const lines = csvString.split(/\r?\n/).filter((line) => line.trim() !== '');
  if (lines.length === 0) {
    return { headers: [], rows: [] };
  }

  const headers = parseCSVLine(lines[0]).map((h) => h.trim());
  const rows: Record<string, string>[] = [];

  for (let i = 1; i < lines.length; i++) {
    const values = parseCSVLine(lines[i]);
    const row: Record<string, string> = {};
    headers.forEach((header, idx) => {
      row[header] = unescapeCSV(values[idx] ?? '');
    });
    rows.push(row);
  }

  return { headers, rows };
};

const validateFieldPresence = (headers: string[]): string | null => {
  const missing = REQUIRED_FIELDS.filter((field) => !headers.includes(field));
  if (missing.length > 0) {
    return `缺少必需字段: ${missing.join(', ')}`;
  }
  return null;
};

const validateDate = (dateStr: string): boolean => {
  if (!DATE_REGEX.test(dateStr)) return false;
  const date = new Date(dateStr + 'T00:00:00');
  if (isNaN(date.getTime())) return false;
  const [y, m, d] = dateStr.split('-').map(Number);
  return date.getFullYear() === y && date.getMonth() + 1 === m && date.getDate() === d;
};

const validateTime = (timeStr: string): boolean => {
  if (!TIME_REGEX.test(timeStr)) return false;
  const [h, m] = timeStr.split(':').map(Number);
  return h >= 0 && h <= 23 && m >= 0 && m <= 59;
};

const parseBoolean = (value: string): boolean | null => {
  const v = value.trim().toLowerCase();
  if (['1', 'true', 'yes', '是', '被溅', '被溅到', 'y'].includes(v)) return true;
  if (['0', 'false', 'no', '否', '未溅', '未被溅', '未被溅到', 'n'].includes(v)) return false;
  return null;
};

const parseDirection = (value: string): 'east' | 'west' | 'south' | 'north' | undefined => {
  const v = value.trim().toLowerCase();
  if (['east', '东', '向东'].includes(v)) return 'east';
  if (['west', '西', '向西'].includes(v)) return 'west';
  if (['south', '南', '向南'].includes(v)) return 'south';
  if (['north', '北', '向北'].includes(v)) return 'north';
  return undefined;
};

const rowToRecord = (
  row: Record<string, string>,
  lineNumber: number
): { record?: Omit<SprinklerRecord, 'id' | 'createdAt' | 'updatedAt'>; errors: string[] } => {
  const errors: string[] = [];
  const prefix = `第${lineNumber}行: `;
  const date = row.date?.trim() || '';
  const time = row.time?.trim() || '';
  const road = row.road?.trim() || '';
  const isSplashedRaw = row.isSplashed?.trim() || '';

  if (!date) {
    errors.push(prefix + 'date 不能为空');
  } else if (!validateDate(date)) {
    errors.push(prefix + `日期格式错误: "${date}"，应为 YYYY-MM-DD`);
  }

  if (!time) {
    errors.push(prefix + 'time 不能为空');
  } else if (!validateTime(time)) {
    errors.push(prefix + `时间格式错误: "${time}"，应为 HH:MM`);
  }

  if (!road) {
    errors.push(prefix + 'road 不能为空');
  }

  const isSplashed = parseBoolean(isSplashedRaw);
  if (isSplashed === null) {
    errors.push(prefix + `isSplashed 值无效: "${isSplashedRaw}"，应为 true/false 或 1/0`);
  }

  if (errors.length > 0) {
    return { errors };
  }

  const [y, m, d] = date.split('-').map(Number);
  const [h, min] = time.split(':').map(Number);
  const timestamp = new Date(y, m - 1, d, h, min, 0, 0).getTime();
  const direction = row.direction ? parseDirection(row.direction) : undefined;
  const note = row.note?.trim() || undefined;

  return {
    record: {
      timestamp,
      date,
      time,
      hour: h,
      minute: min,
      dayOfWeek: getDayOfWeek(timestamp),
      road,
      isSplashed: isSplashed!,
      direction,
      note,
    },
    errors: [],
  };
};

export const parseCSVToRecords = (csvString: string): ImportReport => {
  const startedAt = Date.now();
  const { headers, rows } = parseCSV(csvString);

  const headerError = validateFieldPresence(headers);
  if (headerError) {
    return {
      total: 0,
      success: 0,
      failed: 0,
      items: [],
      startedAt,
      finishedAt: Date.now(),
      error: headerError,
    };
  }

  const items: ImportReportItem[] = [];
  let success = 0;
  let failed = 0;
  const createdRecords: SprinklerRecord[] = [];
  const now = Date.now();

  rows.forEach((row, index) => {
    const lineNumber = index + 2;
    const { record, errors } = rowToRecord(row, lineNumber);

    if (errors.length > 0 || !record) {
      failed++;
      items.push({
        lineNumber,
        row,
        success: false,
        errors: errors.length > 0 ? errors : ['解析失败'],
      });
    } else {
      const newRecord: SprinklerRecord = {
        ...record,
        id: generateId(),
        createdAt: now,
        updatedAt: now,
      };
      createdRecords.push(newRecord);
      success++;
      items.push({
        lineNumber,
        row,
        success: true,
        record: newRecord,
      });
    }
  });

  return {
    total: rows.length,
    success,
    failed,
    items,
    createdRecords,
    startedAt,
    finishedAt: Date.now(),
  };
};

export const downloadCSV = (content: string, filename: string) => {
  const BOM = '\uFEFF';
  const blob = new Blob([BOM + content], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
};

export const statisticsToCSV = (
  statistics: {
    totalRecords: number;
    totalSplashed: number;
    splashRate: number;
  },
  recordsByDay: Array<{ date: string; count: number; splashed: number }>,
  recordsByHour: Array<{ hour: number; count: number; splashed: number }>,
  topRoads: Array<{ road: string; count: number; splashRate: number }>
): string => {
  const parts: string[] = [];

  parts.push('# 总体统计');
  parts.push(['指标', '数值'].join(','));
  parts.push(['总记录数', statistics.totalRecords].join(','));
  parts.push(['被溅总次数', statistics.totalSplashed].join(','));
  parts.push(['整体溅水率', `${(statistics.splashRate * 100).toFixed(2)}%`].join(','));
  parts.push('');

  parts.push('# 按日统计');
  parts.push(['日期', '记录数', '被溅数'].join(','));
  recordsByDay.forEach((item) => {
    parts.push([item.date, item.count, item.splashed].join(','));
  });
  parts.push('');

  parts.push('# 按小时统计');
  parts.push(['小时', '记录数', '被溅数'].join(','));
  recordsByHour.forEach((item) => {
    parts.push([`${String(item.hour).padStart(2, '0')}:00`, item.count, item.splashed].join(','));
  });
  parts.push('');

  parts.push('# 高发路段');
  parts.push(['路段', '记录数', '溅水率'].join(','));
  topRoads.forEach((item) => {
    parts.push([escapeCSV(item.road), item.count, `${(item.splashRate * 100).toFixed(2)}%`].join(','));
  });

  return parts.join('\n');
};
