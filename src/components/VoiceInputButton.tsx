import { useState, useRef, useEffect } from 'react';
import { Mic, MicOff, AlertCircle } from 'lucide-react';
import { SpeechRecognitionService } from '../services/speechRecognition';
import { parseSpeechText, ParsedSpeechResult } from '../utils/speechParser';
import { cn } from '../lib/utils';

interface VoiceInputButtonProps {
  onResult?: (result: ParsedSpeechResult) => void;
  onError?: (error: string) => void;
  className?: string;
  size?: 'sm' | 'md' | 'lg';
  variant?: 'primary' | 'secondary';
}

export default function VoiceInputButton({
  onResult,
  onError,
  className,
  size = 'md',
  variant = 'primary',
}: VoiceInputButtonProps) {
  const [isListening, setIsListening] = useState(false);
  const [interimText, setInterimText] = useState('');
  const [supported, setSupported] = useState(true);
  const [showTip, setShowTip] = useState(false);
  const recognitionRef = useRef<SpeechRecognitionService | null>(null);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    const service = new SpeechRecognitionService({ lang: 'zh-CN', continuous: false, interimResults: true });
    recognitionRef.current = service;
    setSupported(service.isSupported());

    return () => {
      if (timerRef.current) {
        clearTimeout(timerRef.current);
      }
      service.abort();
    };
  }, []);

  const startListening = async () => {
    if (!recognitionRef.current || !supported) return;

    setIsListening(true);
    setInterimText('');
    setShowTip(true);

    try {
      const transcript = await recognitionRef.current.start();
      if (transcript.trim()) {
        const result = parseSpeechText(transcript);
        onResult?.(result);
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : '语音识别失败';
      onError?.(errorMessage);
    } finally {
      setIsListening(false);
      if (timerRef.current) {
        clearTimeout(timerRef.current);
      }
      timerRef.current = setTimeout(() => {
        setShowTip(false);
        setInterimText('');
      }, 2000);
    }
  };

  const stopListening = () => {
    if (recognitionRef.current) {
      recognitionRef.current.stop();
    }
  };

  const handleClick = () => {
    if (isListening) {
      stopListening();
    } else {
      startListening();
    }
  };

  const sizeClasses = {
    sm: 'w-10 h-10',
    md: 'w-12 h-12',
    lg: 'w-16 h-16',
  };

  const iconSizes = {
    sm: 'w-5 h-5',
    md: 'w-6 h-6',
    lg: 'w-8 h-8',
  };

  const variantClasses = {
    primary: isListening
      ? 'bg-red-500 text-white shadow-lg shadow-red-500/30'
      : 'bg-gradient-to-br from-sky-500 to-blue-600 text-white shadow-lg shadow-sky-500/30',
    secondary: isListening
      ? 'bg-red-100 text-red-600 border-2 border-red-500'
      : 'bg-white text-sky-600 border-2 border-sky-200 hover:border-sky-400',
  };

  if (!supported) {
    return (
      <div className="relative">
        <button
          onClick={() => onError?.('当前浏览器不支持语音识别功能，请使用 Chrome 或 Edge 浏览器')}
          className={cn(
            'rounded-2xl flex items-center justify-center transition-all opacity-50 cursor-not-allowed',
            sizeClasses[size],
            variantClasses[variant],
            className
          )}
          disabled
        >
          <MicOff className={iconSizes[size]} />
        </button>
        <div className="absolute -bottom-8 left-1/2 -translate-x-1/2 whitespace-nowrap text-xs text-slate-400">
          不支持语音
        </div>
      </div>
    );
  }

  return (
    <div className="relative">
      <button
        onClick={handleClick}
        className={cn(
          'rounded-2xl flex items-center justify-center transition-all hover:scale-105 active:scale-95',
          sizeClasses[size],
          variantClasses[variant],
          isListening && 'animate-pulse',
          className
        )}
      >
        {isListening ? (
          <Mic className={cn(iconSizes[size], 'animate-bounce')} />
        ) : (
          <Mic className={iconSizes[size]} />
        )}
      </button>

      {showTip && (
        <div className="absolute top-full mt-2 left-1/2 -translate-x-1/2 z-50">
          <div className="bg-slate-800 text-white px-4 py-2 rounded-xl shadow-lg text-sm whitespace-nowrap">
            {isListening ? (
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 bg-red-500 rounded-full animate-pulse" />
                <span>正在聆听...</span>
              </div>
            ) : interimText ? (
              <div className="flex items-center gap-2">
                <AlertCircle className="w-4 h-4 text-amber-400" />
                <span>识别完成</span>
              </div>
            ) : (
              <span>点击开始语音输入</span>
            )}
            {interimText && (
              <div className="mt-1 text-xs text-slate-300 max-w-[200px] truncate">
                {interimText}
              </div>
            )}
          </div>
          <div className="absolute -top-1 left-1/2 -translate-x-1/2 w-2 h-2 bg-slate-800 rotate-45" />
        </div>
      )}
    </div>
  );
}
