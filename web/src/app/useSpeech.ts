import { useCallback, useEffect, useState } from 'react';

export function useSpeech() {
  const supported = typeof window !== 'undefined' && 'speechSynthesis' in window;
  const [voices, setVoices] = useState<SpeechSynthesisVoice[]>([]);

  useEffect(() => {
    if (!supported) return;
    const load = () => setVoices(window.speechSynthesis.getVoices());
    load();
    window.speechSynthesis.addEventListener('voiceschanged', load);
    return () => {
      window.speechSynthesis.removeEventListener('voiceschanged', load);
      window.speechSynthesis.cancel();
    };
  }, [supported]);

  const speak = useCallback(
    (text: string, lang = 'zh-CN', rate = 0.9): boolean => {
      if (!supported) return false;
      try {
        window.speechSynthesis.cancel();
        const utterance = new SpeechSynthesisUtterance(text);
        utterance.lang = lang;
        utterance.rate = rate;
        utterance.pitch = 1.04;
        const prefix = lang.slice(0, 2).toLowerCase();
        const voice =
          voices.find(item => item.lang.toLowerCase().replace('_', '-') === lang.toLowerCase()) ??
          voices.find(item => item.lang.toLowerCase().startsWith(prefix));
        if (voice) utterance.voice = voice;
        window.speechSynthesis.speak(utterance);
        return true;
      } catch {
        return false;
      }
    },
    [supported, voices],
  );

  const stop = useCallback(() => {
    if (supported) window.speechSynthesis.cancel();
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
