import { useCallback, useEffect, useRef, useState } from 'react';

// 部分浏览器首次调用 getVoices() 返回空列表，稍后才补齐，且不一定触发 voiceschanged。
const VOICE_RETRY_DELAYS_MS = [200, 800, 2000];
// 排队后迟迟没有 start（比如在线语音在无网环境发不出声音）就按失败上报，避免“点了没反应”。
const SPEAK_START_TIMEOUT_MS = 2500;
// Chromium 上 cancel() 紧跟 speak() 可能吞掉新的朗读，需要错开一个时钟周期。
const SPEAK_DELAY_AFTER_CANCEL_MS = 60;

export type VoiceCandidate = { lang: string; localService?: boolean };

function isVoiceInstance(value: VoiceCandidate): boolean {
  if (typeof window === 'undefined') return true;
  const ctor = (window as unknown as { SpeechSynthesisVoice?: typeof SpeechSynthesisVoice })
    .SpeechSynthesisVoice;
  if (typeof ctor !== 'function') return true;
  return value instanceof ctor;
}

function normalized(value: string): string {
  return (value || '').toLowerCase().replace('_', '-');
}

/**
 * 挑选朗读语音：语言完全一致优先，其次按前缀回退；同档里本地语音优先——
 * 在线自然语音（如 Edge 的 Natural 系列）在无网环境会静默失败。
 */
export function pickVoice<T extends VoiceCandidate>(list: T[], lang: string): T | undefined {
  const target = normalized(lang);
  const prefix = target.slice(0, 2);
  const matches = list.filter(item => {
    if (!isVoiceInstance(item)) return false;
    const itemLang = normalized(item.lang);
    return itemLang === target || itemLang.startsWith(prefix);
  });
  if (!matches.length) return undefined;
  const exact = matches.filter(item => normalized(item.lang) === target);
  const pool = exact.length > 0 ? exact : matches;
  return pool.find(item => item.localService) ?? pool[0];
}

export function useSpeech() {
  const supported = typeof window !== 'undefined' && 'speechSynthesis' in window;
  const [voices, setVoices] = useState<SpeechSynthesisVoice[]>([]);
  const aliveRef = useRef(false);
  const pendingSpeakTimerRef = useRef(0);
  const activeCallRef = useRef<{ cancelled: boolean } | null>(null);

  useEffect(() => {
    if (!supported) return;
    const synth = window.speechSynthesis;
    aliveRef.current = true;
    const load = () => setVoices(synth.getVoices());
    load();
    const timers = VOICE_RETRY_DELAYS_MS.map(delay => window.setTimeout(load, delay));
    synth.addEventListener('voiceschanged', load);
    return () => {
      aliveRef.current = false;
      timers.forEach(timer => window.clearTimeout(timer));
      if (pendingSpeakTimerRef.current) {
        window.clearTimeout(pendingSpeakTimerRef.current);
        pendingSpeakTimerRef.current = 0;
      }
      if (activeCallRef.current) activeCallRef.current.cancelled = true;
      synth.removeEventListener('voiceschanged', load);
      synth.cancel();
    };
  }, [supported]);

  const speak = useCallback(
    (text: string, lang = 'zh-CN', rate = 0.9, onFail?: () => void, onEnd?: () => void): boolean => {
      if (!supported) {
        onFail?.();
        return false;
      }
      try {
        const synth = window.speechSynthesis;
        if (pendingSpeakTimerRef.current) {
          window.clearTimeout(pendingSpeakTimerRef.current);
          pendingSpeakTimerRef.current = 0;
        }
        const wasBusy = synth.speaking || synth.pending;
        if (wasBusy) {
          // 被打断的是上一轮朗读：标记后，它的 error/watchdog 不再触发失败提示。
          if (activeCallRef.current) activeCallRef.current.cancelled = true;
          synth.cancel();
        }
        const utterance = new SpeechSynthesisUtterance(text);
        utterance.lang = lang;
        utterance.rate = rate;
        utterance.pitch = 1.04;
        const voice = pickVoice(voices, lang);
        if (voice) {
          try {
            utterance.voice = voice;
          } catch {
            // 过期或非法的语音对象：保留默认语音继续读，不让整次朗读静默失败。
          }
        }
        const call = { cancelled: false };
        activeCallRef.current = call;
        let started = false;
        const watchdog = window.setTimeout(() => {
          if (!started && !call.cancelled) onFail?.();
        }, SPEAK_START_TIMEOUT_MS);
        utterance.addEventListener('start', () => {
          started = true;
          window.clearTimeout(watchdog);
        });
        utterance.addEventListener('error', () => {
          if (started || call.cancelled) return;
          window.clearTimeout(watchdog);
          onFail?.();
        });
        utterance.addEventListener('end', () => {
          if (call.cancelled) return;
          onEnd?.();
        });
        if (wasBusy) {
          pendingSpeakTimerRef.current = window.setTimeout(() => {
            pendingSpeakTimerRef.current = 0;
            if (call.cancelled) return;
            synth.speak(utterance);
          }, SPEAK_DELAY_AFTER_CANCEL_MS);
        } else {
          synth.speak(utterance);
        }
        return true;
      } catch {
        onFail?.();
        return false;
      }
    },
    [supported, voices],
  );

  const stop = useCallback(() => {
    if (!supported) return;
    if (pendingSpeakTimerRef.current) {
      window.clearTimeout(pendingSpeakTimerRef.current);
      pendingSpeakTimerRef.current = 0;
    }
    if (activeCallRef.current) activeCallRef.current.cancelled = true;
    window.speechSynthesis.cancel();
  }, [supported]);

  const hasVoice = useCallback(
    (lang: string) => {
      if (!supported) return false;
      if (!voices.length) return true;
      const prefix = lang.slice(0, 2).toLowerCase();
      return voices.some(item => item.lang.toLowerCase().startsWith(prefix));
    },
    [supported, voices],
  );

  return { supported, speak, stop, hasVoice, voices };
}
