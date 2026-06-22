import { formatDate, formatTime } from './format';

export interface ParsedSpeechResult {
  date?: string;
  time?: string;
  road?: string;
  isSplashed?: boolean;
  note?: string;
  confidence: {
    date: number;
    time: number;
    road: number;
    isSplashed: number;
  };
  rawText: string;
}

const timePatterns = [
  { regex: /(上午|下午|早上|晚上|中午|凌晨|傍晚|半夜|深夜)?\s*(\d{1,2})\s*(点|时)\s*(\d{1,2})?\s*(分|分钟)?/, priority: 1 },
  { regex: /(\d{1,2}):(\d{2})/, priority: 2 },
  { regex: /(早上|早晨|清晨|上午|中午|下午|晚上|傍晚|黄昏|深夜|半夜|凌晨)/, priority: 3 },
];

const splashPatterns = [
  { regex: /(被溅到|溅到我|溅了我|洒到我|喷到我|弄湿了|溅了一身)/, value: true },
  { regex: /(没被溅到|没有溅到|没溅到|没洒到|没被弄湿|避开了|躲过了)/, value: false },
  { regex: /(洒水车|浇水车|喷水车|清洁车)/, value: null },
];

const roadKeywords = ['路', '街', '道', '大道', '大街', '巷', '弄', '环路', '高速', '公路', '大桥', '隧道'];

const chineseNumbers: Record<string, number> = {
  '零': 0, '一': 1, '二': 2, '两': 2, '三': 3, '四': 4,
  '五': 5, '六': 6, '七': 7, '八': 8, '九': 9, '十': 10,
  '十一': 11, '十二': 12, '十三': 13, '十四': 14, '十五': 15,
  '十六': 16, '十七': 17, '十八': 18, '十九': 19, '二十': 20,
  '廿一': 21, '廿二': 22, '廿三': 23, '廿四': 24,
};

function parseChineseNumber(text: string): number | null {
  if (chineseNumbers[text] !== undefined) {
    return chineseNumbers[text];
  }
  const num = parseInt(text, 10);
  if (!isNaN(num)) return num;
  return null;
}

function parseTime(text: string): { time: string; confidence: number } | null {
  let bestMatch: { hour: number; minute: number; confidence: number } | null = null;

  for (const pattern of timePatterns) {
    const match = text.match(pattern.regex);
    if (!match) continue;

    let hour = 0;
    let minute = 0;
    let confidence = 0.5;

    if (pattern.priority === 1) {
      const period = match[1] || '';
      const hourStr = match[2];
      const minuteStr = match[4];

      hour = parseChineseNumber(hourStr) ?? 0;
      minute = minuteStr ? (parseChineseNumber(minuteStr) ?? 0) : 0;

      if (period === '下午' || period === '晚上' || period === '傍晚') {
        if (hour < 12) hour += 12;
      } else if (period === '凌晨' || period === '深夜' || period === '半夜') {
        if (hour === 12) hour = 0;
      } else if (period === '中午') {
        if (hour === 12) hour = 12;
        else if (hour < 10) hour += 12;
      }

      confidence = minuteStr ? 0.9 : 0.7;
      if (!period) confidence -= 0.1;
    } else if (pattern.priority === 2) {
      hour = parseInt(match[1], 10);
      minute = parseInt(match[2], 10);
      confidence = 0.95;
    } else if (pattern.priority === 3) {
      const period = match[1];
      switch (period) {
        case '早上':
        case '早晨':
        case '清晨':
          hour = 8;
          minute = 0;
          break;
        case '上午':
          hour = 10;
          minute = 0;
          break;
        case '中午':
          hour = 12;
          minute = 0;
          break;
        case '下午':
          hour = 15;
          minute = 0;
          break;
        case '傍晚':
        case '黄昏':
          hour = 18;
          minute = 0;
          break;
        case '晚上':
          hour = 20;
          minute = 0;
          break;
        case '深夜':
        case '半夜':
          hour = 23;
          minute = 0;
          break;
        case '凌晨':
          hour = 3;
          minute = 0;
          break;
      }
      confidence = 0.4;
    }

    if (hour >= 0 && hour < 24 && minute >= 0 && minute < 60) {
      if (!bestMatch || confidence > bestMatch.confidence) {
        bestMatch = { hour, minute, confidence };
      }
    }
  }

  if (bestMatch) {
    return {
      time: `${String(bestMatch.hour).padStart(2, '0')}:${String(bestMatch.minute).padStart(2, '0')}`,
      confidence: bestMatch.confidence,
    };
  }

  return null;
}

function parseDate(text: string): { date: string; confidence: number } | null {
  const now = new Date();
  const today = formatDate(now.getTime());

  const relativePatterns = [
    { regex: /(今天|今日|今儿)/, offset: 0, confidence: 0.95 },
    { regex: /(昨天|昨日|昨儿)/, offset: -1, confidence: 0.9 },
    { regex: /(前天|前日)/, offset: -2, confidence: 0.85 },
    { regex: /(明天|明日|明儿)/, offset: 1, confidence: 0.8 },
    { regex: /(后天|后日)/, offset: 2, confidence: 0.7 },
    { regex: /大前天/, offset: -3, confidence: 0.7 },
    { regex: /大后天/, offset: 3, confidence: 0.65 },
  ];

  for (const pattern of relativePatterns) {
    if (pattern.regex.test(text)) {
      const date = new Date(now);
      date.setDate(date.getDate() + pattern.offset);
      return {
        date: formatDate(date.getTime()),
        confidence: pattern.confidence,
      };
    }
  }

  const datePatterns = [
    { regex: /(\d{4})[年/-](\d{1,2})[月/-](\d{1,2})[日号]?/, hasYear: true },
    { regex: /(\d{1,2})[月/-](\d{1,2})[日号]?/, hasYear: false },
  ];

  for (const pattern of datePatterns) {
    const match = text.match(pattern.regex);
    if (match) {
      const year = pattern.hasYear ? parseInt(match[1], 10) : now.getFullYear();
      const month = pattern.hasYear ? parseInt(match[2], 10) : parseInt(match[1], 10);
      const day = pattern.hasYear ? parseInt(match[3], 10) : parseInt(match[2], 10);

      if (month >= 1 && month <= 12 && day >= 1 && day <= 31) {
        return {
          date: `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`,
          confidence: pattern.hasYear ? 0.95 : 0.7,
        };
      }
    }
  }

  const weekdayPatterns = [
    { regex: /(周|星期|礼拜)(一|1|二|2|三|3|四|4|五|5|六|6|日|天|七|7)/, dayMap: { '一': 1, '1': 1, '二': 2, '2': 2, '三': 3, '3': 3, '四': 4, '4': 4, '五': 5, '5': 5, '六': 6, '6': 6, '日': 0, '天': 0, '七': 0, '7': 0 } },
  ];

  for (const pattern of weekdayPatterns) {
    const match = text.match(pattern.regex);
    if (match) {
      const targetDay = (pattern.dayMap as Record<string, number>)[match[2]];
      if (targetDay !== undefined) {
        const currentDay = now.getDay();
        let diff = targetDay - currentDay;
        if (diff <= 0) diff += 7;
        const date = new Date(now);
        date.setDate(date.getDate() + diff);
        return {
          date: formatDate(date.getTime()),
          confidence: 0.6,
        };
      }
    }
  }

  if (/早上|上午|中午|下午|晚上|傍晚|深夜|凌晨|点|时/.test(text)) {
    return { date: today, confidence: 0.5 };
  }

  return null;
}

function parseRoad(text: string): { road: string; confidence: number } | null {
  let bestMatch: { road: string; confidence: number; startIndex: number } | null = null;

  for (const keyword of roadKeywords) {
    const regex = new RegExp(`([\\u4e00-\\u9fa5A-Za-z0-9]{1,10}${keyword})`, 'g');
    let match;
    while ((match = regex.exec(text)) !== null) {
      const roadName = match[1];
      const roadNameLength = roadName.length;
      let confidence = 0.5;

      if (roadNameLength >= 2 && roadNameLength <= 6) {
        confidence += 0.2;
      }
      if (/^[\u4e00-\u9fa5]/.test(roadName)) {
        confidence += 0.1;
      }
      if (keyword === '路' || keyword === '街' || keyword === '道') {
        confidence += 0.1;
      }

      if (!bestMatch || confidence > bestMatch.confidence) {
        bestMatch = { road: roadName, confidence, startIndex: match.index };
      }
    }
  }

  const locationPrefixes = ['在', '于', '经过', '路过', '走到', '到了', '来到'];
  for (const prefix of locationPrefixes) {
    const regex = new RegExp(`${prefix}([\\u4e00-\\u9fa5A-Za-z0-9]{2,8})`, 'g');
    let match;
    while ((match = regex.exec(text)) !== null) {
      const candidate = match[1];
      const hasRoadKeyword = roadKeywords.some(kw => candidate.includes(kw));
      if (!hasRoadKeyword && candidate.length >= 2) {
        const confidence = 0.5;
        if (!bestMatch || confidence > bestMatch.confidence) {
          bestMatch = { road: candidate + '路', confidence, startIndex: match.index };
        }
      }
    }
  }

  if (bestMatch) {
    return { road: bestMatch.road, confidence: Math.min(bestMatch.confidence, 0.95) };
  }

  return null;
}

function parseIsSplashed(text: string): { isSplashed: boolean; confidence: number } | null {
  for (const pattern of splashPatterns) {
    if (pattern.regex.test(text)) {
      if (pattern.value === null) continue;
      return {
        isSplashed: pattern.value,
        confidence: 0.9,
      };
    }
  }

  return null;
}

export function parseSpeechText(text: string): ParsedSpeechResult {
  const cleanedText = text.trim().replace(/[，。！？、；：]/g, '');

  const dateResult = parseDate(cleanedText);
  const timeResult = parseTime(cleanedText);
  const roadResult = parseRoad(cleanedText);
  const splashResult = parseIsSplashed(cleanedText);

  return {
    date: dateResult?.date,
    time: timeResult?.time,
    road: roadResult?.road,
    isSplashed: splashResult?.isSplashed,
    note: text,
    confidence: {
      date: dateResult?.confidence ?? 0,
      time: timeResult?.confidence ?? 0,
      road: roadResult?.confidence ?? 0,
      isSplashed: splashResult?.confidence ?? 0,
    },
    rawText: text,
  };
}

export function getDefaultSpeechResult(): ParsedSpeechResult {
  const now = new Date();
  return {
    date: formatDate(now.getTime()),
    time: formatTime(now.getTime()),
    road: '',
    isSplashed: undefined,
    confidence: {
      date: 0.9,
      time: 0.9,
      road: 0,
      isSplashed: 0,
    },
    rawText: '',
  };
}
