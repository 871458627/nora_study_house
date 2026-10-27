import { useCallback, useEffect, useRef, useState } from 'react';
import { forSpeech } from '../core/reading';

// 部分浏览器首次调用 getVoices() 返回空列表，稍后才补齐，且不一定触发 voiceschanged。
const VOICE_RETRY_DELAYS_MS = [200, 800, 2000];
// 排队后迟迟没有 start（比如在线语音在无网环境发不出声音）就按失败上报，避免“点了没反应”。
const SPEAK_START_TIMEOUT_MS = 2500;
// Chromium 上 cancel() 紧跟 speak() 可能吞掉新的朗读，需要错开一个时钟周期。
const SPEAK_DELAY_AFTER_CANCEL_MS = 60;

export type VoiceCandidate = { lang: string; localService?: boolean };

/** 一次朗读的全局记账：被谁打断、是否已收尾。 */
interface ActiveSpeechCall {
  cancelled: boolean;
}

// 同一页面的多个 useSpeech 实例（课文页本体的单词点读 + useLessonReader 朗读条）
// 共用同一个 window.speechSynthesis，打断记账必须全局共享：
// 否则 A 实例 cancel 掉 B 实例正在读的 utterance 后，B 的看门狗会误报
// 「设备不能朗读」、朗读条也会卡在「正在朗读…」的假播放态。
let sharedActiveCall: ActiveSpeechCall | null = null;

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

/**
 * 语音是否可用：语音列表还在加载窗口内时保持乐观（返回 true，避免按钮闪没）；
 * 窗口过后仍是空列表，就如实报告「没有语音」，让页面走收起降级，
 * 而不是留下一排点了永远没声音的喇叭。
 */
export function voiceAvailable(list: VoiceCandidate[], lang: string, settled: boolean): boolean {
  if (!list.length) return !settled;
  const prefix = lang.slice(0, 2).toLowerCase();
  return list.some(item => (item.lang || '').toLowerCase().startsWith(prefix));
}

export function useSpeech() {
  const supported = typeof window !== 'undefined' && 'speechSynthesis' in window;
  const [voices, setVoices] = useState<SpeechSynthesisVoice[]>([]);
  const [voicesSettled, setVoicesSettled] = useState(false);
  const pendingSpeakTimerRef = useRef(0);

  useEffect(() => {
    if (!supported) return;
    const synth = window.speechSynthesis;
    const load = () => {
      const list = synth.getVoices();
      setVoices(list);
      if (list.length) setVoicesSettled(true);
    };
    load();
    const timers = VOICE_RETRY_DELAYS_MS.map(delay => window.setTimeout(load, delay));
    // 加载窗口走完仍拿不到任何语音 → 视为这台设备没有语音，hasVoice 如实返回 false。
    const settledTimer = window.setTimeout(
      () => setVoicesSettled(true),
      VOICE_RETRY_DELAYS_MS[VOICE_RETRY_DELAYS_MS.length - 1] + 400,
    );
    synth.addEventListener('voiceschanged', load);
    return () => {
      timers.forEach(timer => window.clearTimeout(timer));
      window.clearTimeout(settledTimer);
      if (pendingSpeakTimerRef.current) {
        window.clearTimeout(pendingSpeakTimerRef.current);
        pendingSpeakTimerRef.current = 0;
      }
      if (sharedActiveCall) sharedActiveCall.cancelled = true;
      synth.removeEventListener('voiceschanged', load);
      synth.cancel();
    };
  }, [supported]);

  const speak = useCallback(
    (
      text: string,
      lang = 'zh-CN',
      rate = 0.9,
      onFail?: () => void,
      onEnd?: () => void,
      pitch = 1.04,
      onCancelled?: () => void,
    ): boolean => {
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
          // 被打断的是上一轮朗读（可能是其他 useSpeech 实例的）：全局记账后，
          // 它的 error / end / 看门狗都不再触发失败提示或续播。
          if (sharedActiveCall) sharedActiveCall.cancelled = true;
          synth.cancel();
        }
        // 多音字注音替换（词级同音异形）：让引擎读出课文语境的正确读音。
        const spoken = lang.startsWith('zh') ? forSpeech(text) : text;
        const utterance = new SpeechSynthesisUtterance(spoken);
        utterance.lang = lang;
        utterance.rate = rate;
        utterance.pitch = pitch;
        const voice = pickVoice(voices, lang);
        if (voice) {
          try {
            utterance.voice = voice;
          } catch {
            // 过期或非法的语音对象：保留默认语音继续读，不让整次朗读静默失败。
          }
        }
        const call: ActiveSpeechCall = { cancelled: false };
        sharedActiveCall = call;
        let started = false;
        let finished = false;
        const watchdog = window.setTimeout(() => {
          if (!started && !finished && !call.cancelled) {
            call.cancelled = true;
            onFail?.();
          }
        }, SPEAK_START_TIMEOUT_MS);
        utterance.addEventListener('start', () => {
          started = true;
          window.clearTimeout(watchdog);
        });
        utterance.addEventListener('error', () => {
          window.clearTimeout(watchdog);
          if (call.cancelled) {
            // 被新一轮朗读或 stop 打断是预期行为，不算失败；只通知调用方清理 UI 态。
            onCancelled?.();
            return;
          }
          if (started || finished) return;
          call.cancelled = true;
          onFail?.();
        });
        utterance.addEventListener('end', () => {
          window.clearTimeout(watchdog);
          finished = true;
          if (call.cancelled) {
            onCancelled?.();
            return;
          }
          onEnd?.();
        });
        if (wasBusy) {
          pendingSpeakTimerRef.current = window.setTimeout(() => {
            pendingSpeakTimerRef.current = 0;
            if (call.cancelled) return;
            synth.speak(utterance);
            // 个别 Chromium 状态下 cancel 后引擎停在 paused，入队的话永远不会 start。
            if (synth.paused) synth.resume();
          }, SPEAK_DELAY_AFTER_CANCEL_MS);
        } else {
          synth.speak(utterance);
          if (synth.paused) synth.resume();
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
    if (sharedActiveCall) sharedActiveCall.cancelled = true;
    window.speechSynthesis.cancel();
  }, [supported]);

  const hasVoice = useCallback(
    (lang: string) => {
      if (!supported) return false;
      return voiceAvailable(voices, lang, voicesSettled);
    },
    [supported, voices, voicesSettled],
  );

  return { supported, speak, stop, hasVoice, voices };
}
