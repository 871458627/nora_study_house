import { useCallback, useEffect, useRef, useState } from 'react';

// 浏览器语音识别（跟读评测用）：封装 webkitSpeechRecognition 的生命周期。
// 识别由浏览器/系统服务完成（Chrome/Edge 需联网），本应用不持有、不上传录音；
// 语音能力不可用或页面不在安全上下文时返回 canListen=false，由界面降级。
//
// 「读完没反应/不出分」的三处根因都在这里解决：
// 1. 短句常只产出 interim 结果就 onend——只认 final 会误报「没听清」；
//    结算一律用 final + 当前 interim。
// 2. continuous 模式读完不会自动结束，孩子会一直等——最后一次结果后
//    静默 3.2s 自动结算，整体 20s 封顶。
// 3. 局域网 http 下麦克风被浏览器静默禁用（非安全上下文）——把
//    isSecureContext 暴露给界面，直接给出原因而不是无反应。

const SILENCE_SETTLE_MS = 3200;
const MAX_LISTEN_MS = 20000;

interface RecognitionResultEvent {
  results: ArrayLike<ArrayLike<{ transcript: string }> & { isFinal: boolean }>;
  resultIndex: number;
}

interface RecognitionErrorEvent {
  error: string;
}

interface RecognitionInstance {
  lang: string;
  continuous: boolean;
  interimResults: boolean;
  maxAlternatives: number;
  start(): void;
  stop(): void;
  abort(): void;
  onresult: ((event: RecognitionResultEvent) => void) | null;
  onerror: ((event: RecognitionErrorEvent) => void) | null;
  onend: (() => void) | null;
}

type RecognitionCtor = new () => RecognitionInstance;

function recognitionCtor(): RecognitionCtor | null {
  if (typeof window === 'undefined') return null;
  const scope = window as unknown as {
    SpeechRecognition?: RecognitionCtor;
    webkitSpeechRecognition?: RecognitionCtor;
  };
  return scope.SpeechRecognition ?? scope.webkitSpeechRecognition ?? null;
}

export type ListenState = 'idle' | 'listening';

export function useSpeechRecognition(lang = 'zh-CN') {
  const supported = typeof window !== 'undefined' && recognitionCtor() !== null;
  const secure = typeof window === 'undefined' ? true : window.isSecureContext !== false;
  const [state, setState] = useState<ListenState>('idle');
  const [transcript, setTranscript] = useState('');
  const recRef = useRef<RecognitionInstance | null>(null);
  const sessionRef = useRef(0);
  const doneRef = useRef<((text: string) => void) | null>(null);
  const failRef = useRef<((code: string) => void) | null>(null);
  const finalRef = useRef('');
  const interimRef = useRef('');
  const silenceTimerRef = useRef(0);
  const capTimerRef = useRef(0);

  const clearTimers = useCallback(() => {
    if (silenceTimerRef.current) {
      window.clearTimeout(silenceTimerRef.current);
      silenceTimerRef.current = 0;
    }
    if (capTimerRef.current) {
      window.clearTimeout(capTimerRef.current);
      capTimerRef.current = 0;
    }
  }, []);

  const stop = useCallback(() => {
    sessionRef.current += 1;
    clearTimers();
    doneRef.current = null;
    failRef.current = null;
    try {
      recRef.current?.abort();
    } catch {
      // 已停止的识别器再 abort 会抛错：忽略。
    }
    recRef.current = null;
    setState('idle');
  }, [clearTimers]);

  // 结算：无论自然结束、静默超时、时长封顶还是手动「读完了」，都从这里
  // 出结果——final 优先，只有中间结果时也用它，保证读完一定有评分或提示。
  const settle = useCallback(() => {
    clearTimers();
    const done = doneRef.current;
    const fail = failRef.current;
    doneRef.current = null;
    failRef.current = null;
    sessionRef.current += 1;
    try {
      recRef.current?.stop();
    } catch {
      // 同上。
    }
    recRef.current = null;
    setState('idle');
    const text = (finalRef.current + interimRef.current).trim();
    if (text) done?.(text);
    else fail?.('no-speech');
  }, [clearTimers]);

  useEffect(
    () => () => {
      sessionRef.current += 1;
      if (silenceTimerRef.current) window.clearTimeout(silenceTimerRef.current);
      if (capTimerRef.current) window.clearTimeout(capTimerRef.current);
      try {
        recRef.current?.abort();
      } catch {
        // 同上。
      }
    },
    [],
  );

  const start = useCallback(
    (onDone: (text: string) => void, onFail?: (code: string) => void) => {
      const Ctor = recognitionCtor();
      if (!Ctor) {
        onFail?.('unsupported');
        return;
      }
      if (typeof window !== 'undefined' && window.isSecureContext === false) {
        onFail?.('insecure');
        return;
      }
      sessionRef.current += 1;
      const session = sessionRef.current;
      finalRef.current = '';
      interimRef.current = '';
      setTranscript('');
      setState('listening');

      const rec = new Ctor();
      recRef.current = rec;
      rec.lang = lang;
      rec.continuous = true;
      rec.interimResults = true;
      rec.maxAlternatives = 1;

      rec.onresult = (event) => {
        if (session !== sessionRef.current) return;
        let interim = '';
        for (let i = event.resultIndex; i < event.results.length; i++) {
          const result = event.results[i];
          const text = result[0]?.transcript ?? '';
          if (result.isFinal) finalRef.current += text;
          else interim += text;
        }
        interimRef.current = interim;
        setTranscript(finalRef.current + interim);
        // 孩子停下就自动结算：最后一次结果后静默 3.2s 出评分。
        if (silenceTimerRef.current) window.clearTimeout(silenceTimerRef.current);
        silenceTimerRef.current = window.setTimeout(() => settle(), SILENCE_SETTLE_MS);
      };
      rec.onerror = (event) => {
        if (session !== sessionRef.current) return;
        if (event.error === 'aborted') return;
        sessionRef.current += 1;
        clearTimers();
        setState('idle');
        recRef.current = null;
        onFail?.(event.error);
      };
      rec.onend = () => {
        if (session !== sessionRef.current) return;
        settle();
      };
      doneRef.current = onDone;
      failRef.current = onFail ?? null;
      try {
        rec.start();
      } catch {
        sessionRef.current += 1;
        clearTimers();
        setState('idle');
        recRef.current = null;
        onFail?.('start-failed');
        return;
      }
      // 整体时长封顶：即使浏览器一直不出结果也不会挂着没反应。
      capTimerRef.current = window.setTimeout(() => settle(), MAX_LISTEN_MS);
    },
    [lang, clearTimers, settle],
  );

  /** 手动结束（点「读完了」）：立即以已收集的转写结算。 */
  const finish = useCallback(() => {
    if (!recRef.current && !silenceTimerRef.current && !capTimerRef.current) return;
    settle();
  }, [settle]);

  return { supported, canListen: supported, secure, state, transcript, start, stop, finish };
}
