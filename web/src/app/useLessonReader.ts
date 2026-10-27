import { useCallback, useEffect, useRef, useState } from 'react';
import { splitReadingUnits } from '../core/reading';
import { useSpeech } from './useSpeech';
import type { ReadSegment } from '../core/lessonReader';

export type ReaderState = 'idle' | 'playing';

/**
 * 课文朗读（docs/12 之外的独立小功能，2026-10-26 需求）：
 * 按 ReadSegment 顺序逐段朗读，可停止；段间用 onEnd 链式衔接。
 * 脚本为空或设备不支持/无对应语音时返回 canRead=false，由页面降级。
 */
export function useLessonReader(script: ReadSegment[], onFail?: () => void) {
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

  // 副作用只认「内容」不认「数组身份」：调用方若在渲染期重建 script 数组
  // （未 memo），旧写法会在每次渲染——包括朗读自身 setState 引起的渲染——
  // 重新触发本副作用，synth.cancel() 把刚启动的朗读立刻掐死（点击无声的根因）。
  const scriptKey = script.map(segment => `${segment.lang}:${segment.text}`).join('\u0001');

  useEffect(() => {
    // 脚本内容变化（换课）即停止并复位。
    sessionRef.current += 1;
    stopSpeech();
    setState('idle');
    setIndex(0);
  }, [scriptKey, stopSpeech]);

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
      const rate = lang === 'en-US' ? 0.85 : 0.88;
      // 感情化朗读（docs/06 克制原则）：把段拆成句，逐句朗读并在句间留
      // 自然停顿；问句句尾语调微微上扬，其余句用温和基准音高。
      const units = splitReadingUnits(segment.text);
      const playUnit = (unitIndex: number) => {
        if (session !== sessionRef.current) return;
        if (unitIndex >= units.length) {
          window.setTimeout(() => playFrom(startIndex + 1, session), 260);
          return;
        }
        const unit = units[unitIndex]!;
        const pitch = unit.endsWith('？') ? 1.12 : 1.04;
        const ok = speak(
          unit,
          lang,
          rate,
          () => {
            // 失败（无语音/启动超时）：停下并复位，页面提示设备不支持。
            if (session !== sessionRef.current) return;
            sessionRef.current += 1;
            setState('idle');
            setIndex(0);
            onFail?.();
          },
          () => {
            window.setTimeout(() => playUnit(unitIndex + 1), unitIndex + 1 < units.length ? 200 : 40);
          },
          pitch,
          () => {
            // 被新一轮朗读或停止打断（比如孩子点了单词喇叭）：复位朗读条，
            // 不再停留在「正在朗读…」的假播放态。
            if (session !== sessionRef.current) return;
            setState('idle');
            setIndex(0);
          },
        );
        if (!ok) {
          sessionRef.current += 1;
          setState('idle');
          setIndex(0);
          onFail?.();
        }
      };
      playUnit(0);
    },
    [speak, onFail],
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
