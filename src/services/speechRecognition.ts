export interface SpeechRecognitionResult {
  transcript: string;
  isFinal: boolean;
  confidence: number;
}

export interface SpeechRecognitionOptions {
  lang?: string;
  continuous?: boolean;
  interimResults?: boolean;
  maxAlternatives?: number;
}

type SpeechRecognitionEvent = {
  results: SpeechRecognitionResultList;
  resultIndex: number;
};

type SpeechRecognitionErrorEvent = {
  error: string;
  message?: string;
};

interface SpeechRecognitionInstance extends EventTarget {
  lang: string;
  continuous: boolean;
  interimResults: boolean;
  maxAlternatives: number;
  start(): void;
  stop(): void;
  abort(): void;
  onresult: ((event: SpeechRecognitionEvent) => void) | null;
  onerror: ((event: SpeechRecognitionErrorEvent) => void) | null;
  onend: (() => void) | null;
  onstart: (() => void) | null;
}

declare global {
  interface Window {
    SpeechRecognition?: new () => SpeechRecognitionInstance;
    webkitSpeechRecognition?: new () => SpeechRecognitionInstance;
  }
}

export class SpeechRecognitionService {
  private recognition: SpeechRecognitionInstance | null = null;
  private isListening = false;
  private finalTranscript = '';
  private interimTranscript = '';

  constructor(private options: SpeechRecognitionOptions = {}) {
    this.initRecognition();
  }

  private initRecognition() {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) {
      return;
    }

    this.recognition = new SpeechRecognition();
    this.recognition.lang = this.options.lang || 'zh-CN';
    this.recognition.continuous = this.options.continuous ?? false;
    this.recognition.interimResults = this.options.interimResults ?? true;
    this.recognition.maxAlternatives = this.options.maxAlternatives ?? 1;
  }

  isSupported(): boolean {
    return !!this.recognition;
  }

  start(): Promise<string> {
    return new Promise((resolve, reject) => {
      if (!this.recognition) {
        reject(new Error('语音识别不受支持'));
        return;
      }

      if (this.isListening) {
        reject(new Error('正在监听中'));
        return;
      }

      this.finalTranscript = '';
      this.interimTranscript = '';
      this.isListening = true;

      this.recognition.onresult = (event: SpeechRecognitionEvent) => {
        this.interimTranscript = '';
        for (let i = event.resultIndex; i < event.results.length; i++) {
          const transcript = event.results[i][0].transcript;
          if (event.results[i].isFinal) {
            this.finalTranscript += transcript;
          } else {
            this.interimTranscript += transcript;
          }
        }
      };

      this.recognition.onerror = (event: SpeechRecognitionErrorEvent) => {
        this.isListening = false;
        reject(new Error(event.error));
      };

      this.recognition.onend = () => {
        this.isListening = false;
        resolve(this.finalTranscript || this.interimTranscript);
      };

      try {
        this.recognition.start();
      } catch (e) {
        this.isListening = false;
        reject(e);
      }
    });
  }

  stop() {
    if (this.recognition && this.isListening) {
      this.recognition.stop();
    }
  }

  abort() {
    if (this.recognition && this.isListening) {
      this.recognition.abort();
      this.isListening = false;
    }
  }

  getIsListening(): boolean {
    return this.isListening;
  }

  getInterimTranscript(): string {
    return this.interimTranscript;
  }

  getFinalTranscript(): string {
    return this.finalTranscript;
  }
}

export const createSpeechRecognition = (options?: SpeechRecognitionOptions) => {
  return new SpeechRecognitionService(options);
};
