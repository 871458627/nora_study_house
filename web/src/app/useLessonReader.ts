import { useCallback, useEffect, useRef, useState } from 'react';
import { useSpeech } from './useSpeech';
import type { ReadSegment } from '../core/lessonReader';

export type ReaderState = 'idle' | 'playing';

/**
 * 课文朗读（docs/12 之外的独立小功能，2026-10-26 需求）：
 * 按 ReadSegment 顺序逐段朗读，可停止；段间用 onEnd 链式衔接。
 * 脚本为空或设备不支持/无对应语音时返回 canRead=false，由页面降级。
 */
export function useLessonReader(script: ReadSegment[]) {
  const { speak, stop: stopSpeech, supported, hasVoice } = useSpeech();
  const [state, setState] = useState<ReaderState>('idle');
  const [index, setIndex] = useState(0);
  // 播放会话令牌：stop/脚本变化后，迟到的 onEnd 不再续播下一段。
  const sessionRef = useRef(0);
  const scriptRef = useRef(script);
  scriptRef.current = script;

  const stop = useCallback(() => {
    sessionRef.current += 1;
    stopSpeech();
    setState('idle');
    setIndex(0);
  }, [stopSpeech]);

  useEffect(() => {
    // 脚本变化（换课）即停止并复位。
    sessionRef.current += 1;
    stopSpeech();
    setState('idle');
    setIndex(0);
  }, [script, stopSpeech]);

  const playFrom = useCallback(
    (startIndex: number, session: number) => {
      const segments = scriptRef.current;
      if (session !== sessionRef.current) return;
      if (startIndex >= segments.length) {
        setState('idle');
        setIndex(0);
        return;
      }
      setIndex(startIndex);
      const segment = segments[startIndex]!;
      const lang = segment.lang;
      const rate = lang === 'en-US' ? 0.85 : 0.9;
      const ok = speak(segment.text, lang, rate, () => {
        // 失败（无语音/启动超时）：停下并复位，页面提示设备不支持。
        if (session !== sessionRef.current) return;
        sessionRef.current += 1;
        setState('idle');
        setIndex(0);
      }, () => {
        playFrom(startIndex + 1, session);
      });
      if (!ok) {
        sessionRef.current += 1;
        setState('idle');
        setIndex(0);
      }
    },
    [speak],
  );

  const toggle = useCallback(() => {
    if (state === 'playing') {
      stop();
      return;
    }
    if (!scriptRef.current.length) return;
    const session = sessionRef.current + 1;
    sessionRef.current = session;
    setState('playing');
    playFrom(0, session);
  }, [state, stop, playFrom]);

  const canRead = supported && script.length > 0 && (hasVoice('zh-CN') || hasVoice('en-US'));

  return { state, index, current: script[index], toggle, stop, canRead, total: script.length };
}
