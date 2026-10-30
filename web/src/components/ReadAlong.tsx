import { useRef, useState } from 'react';
import { useSpeech } from '../app/useSpeech';
import { useSpeechRecognition } from '../app/useSpeechRecognition';
import { scoreReading, type ReadingScore } from '../core/pronunciation';
import { Icon } from './Icon';

// 跟我读（2026-10-27 需求）：孩子朗读一句知识卡，浏览器语音识别转写后
// 与目标句做字符级对齐评分。识别由浏览器系统服务完成（Chrome 需联网），
// 本应用不存储、不上传录音；能力不可用时整块降级为提示。

export function ReadAlong({ sentence }: { sentence: string }) {
  const { speak, stop: stopSpeech } = useSpeech();
  const listener = useSpeechRecognition('zh-CN');
  const [score, setScore] = useState<ReadingScore | null>(null);
  const [errorCode, setErrorCode] = useState<string | null>(null);
  // 麦克风自检（纯本地 Web Audio 音量表）：区分「设备没声」与「识别服务连不上」
  const [micTest, setMicTest] = useState<'idle' | 'testing' | 'ok' | 'silent' | 'fail'>('idle');
  const [micLevel, setMicLevel] = useState(0);
  // 监听挂起检测：迟迟没有任何转写时，如实提示可能是识别服务连不上
  const [stuckHint, setStuckHint] = useState(false);
  const stuckTimerRef = useRef(0);

  const busy = listener.state === 'listening';

  const start = () => {
    setScore(null);
    setErrorCode(null);
    setStuckHint(false);
    stopSpeech();
    window.clearTimeout(stuckTimerRef.current);
    stuckTimerRef.current = window.setTimeout(() => {
      // 8 秒仍无任何转写：大概率是浏览器识别服务（Chrome 依赖云服务）没连上
      setStuckHint(true);
    }, 8000);
    listener.start(text => {
      window.clearTimeout(stuckTimerRef.current);
      setStuckHint(false);
      setScore(scoreReading(sentence, text));
    }, code => {
      window.clearTimeout(stuckTimerRef.current);
      setStuckHint(false);
      setErrorCode(code);
    });
  };

  /** 麦克风自检：采集 2.4 秒实时音量，峰值即设备是否真有声音进来。 */
  const runMicTest = async () => {
    setMicTest('testing');
    setMicLevel(0);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const ctx = new (window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext)();
      const source = ctx.createMediaStreamSource(stream);
      const analyser = ctx.createAnalyser();
      analyser.fftSize = 512;
      source.connect(analyser);
      const buf = new Uint8Array(analyser.frequencyBinCount);
      let peak = 0;
      let rounds = 0;
      await new Promise<void>(resolve => {
        const tick = () => {
          analyser.getByteTimeDomainData(buf);
          let sum = 0;
          for (const v of buf) {
            const d = v - 128;
            sum += d * d;
          }
          const rms = Math.sqrt(sum / buf.length) / 128;
          peak = Math.max(peak, rms);
          setMicLevel(Math.min(1, rms * 4));
          rounds += 1;
          if (rounds >= 12) resolve();
          else window.setTimeout(tick, 200);
        };
        tick();
      });
      stream.getTracks().forEach(t => t.stop());
      ctx.close();
      setMicTest(peak > 0.02 ? 'ok' : 'silent');
      setMicLevel(0);
    } catch {
      setMicTest('fail');
      setMicLevel(0);
    }
  };

  const stars = score?.stars ?? 0;

  return (
    <div className="read-along">
      <div className="read-along-target">
        <button
          type="button"
          className="read-along-listen"
          aria-label="听这一句"
          onClick={() => {
            if (busy) return;
            listener.stop();
            speak(sentence, 'zh-CN', 0.82, () => setErrorCode('speak-failed'), () => setErrorCode(null));
          }}
        >
          <Icon name="speaker" size={15} /> 听
        </button>
        <span>{sentence}</span>
      </div>

      <div className="read-along-actions">
        {!listener.canListen ? (
          <span className="read-along-live">这台设备不支持语音识别，可以让家长陪你读一读、评一评。</span>
        ) : !listener.secure ? (
          <span className="read-along-live">
            麦克风需要安全连接：请用 https 打开小桃学习屋，或在这台电脑上用 localhost 访问后再试。
          </span>
        ) : busy ? (
          <>
            <button type="button" className="btn btn-primary read-along-mic" onClick={() => listener.finish()}>
              <Icon name="check" size={15} /> 读完了
            </button>
            <span className="read-along-live" aria-live="polite">
              {listener.transcript || '正在听，请大声读…读完会自动评分' }
            </span>
            {stuckHint && !listener.transcript && (
              <span className="read-along-stuck" role="alert">
                一直没听到声音：浏览器的识别服务可能没连上（Chrome 需联网）。
                换 Edge 浏览器通常可用；也可以点「读完了」结束。
              </span>
            )}
          </>
        ) : (
          <button type="button" className="btn btn-soft read-along-mic" onClick={start}>
            <Icon name="speaker" size={15} /> 跟我读
          </button>
        )}
      </div>

      {score && (
        <div className={`read-along-result ${stars >= 2 ? 'good' : 'try'}`} aria-live="polite">
          <span className="read-along-stars" aria-hidden="true">
            {'★'.repeat(stars)}
            <i>{'★'.repeat(3 - stars)}</i>
          </span>
          <b>{score.score} 分</b>
          {score.missing.length > 0 && (
            <small>没读清楚的字：{score.missing.slice(0, 6).join('、')}</small>
          )}
          {score.toneOff.length > 0 && (
            <small>声调再注意：{score.toneOff.slice(0, 6).join('、')}</small>
          )}
          {score.stars >= 2 && <small>读得很棒，再来一遍更熟练。</small>}
        </div>
      )}

      {micTest !== 'idle' && (
        <div
          className={`read-along-result mic-test ${micTest === 'ok' ? 'good' : micTest === 'testing' ? 'try' : 'try'}`}
          aria-live="polite"
        >
          {micTest === 'testing' ? (
            <>
              <b>麦克风测试中…</b>
              <span className="mic-meter" aria-hidden="true">
                <i style={{ width: `${Math.round(micLevel * 100)}%` }} />
              </span>
            </>
          ) : micTest === 'ok' ? (
            <b>✓ 麦克风正常，能听到声音</b>
          ) : micTest === 'silent' ? (
            <b>麦克风没有收到声音：检查系统麦克风设置与默认设备</b>
          ) : (
            <b>麦克风不可用：{''}请在浏览器权限里允许麦克风</b>
          )}
        </div>
      )}

      {errorCode && (
        <p className="read-along-error" role="alert">
          {errorCode === 'not-allowed' || errorCode === 'service-not-allowed'
            ? '需要麦克风权限：请在浏览器里允许使用麦克风。'
            : errorCode === 'insecure'
              ? '麦克风需要安全连接：请用 https 打开小桃学习屋，或在这台电脑上用 localhost 访问。'
              : errorCode === 'audio-capture'
                ? '没找到麦克风：检查麦克风连接后再试。'
                : errorCode === 'network'
                  ? '语音识别需要联网：检查网络后再试一次。'
                  : errorCode === 'speak-failed'
                    ? '示范朗读没发出来：再点一次试试；若一直无声，请检查系统的文字转语音（TTS）语音包。'
                    : errorCode === 'no-speech' || errorCode === 'aborted'
                      ? '没等到你的声音。若反复出现，多半是浏览器的语音识别服务没连上（Chrome 需联网到 Google 服务）——换 Edge 浏览器通常可用，或由家长带读。'
                      : '没听清你的声音，大声一点、靠近一点再试一次。'}
        </p>
      )}

      {errorCode === 'no-speech' && micTest === 'idle' && (
        <button type="button" className="text-link read-along-mictest" onClick={runMicTest}>
          麦克风好像没声？点这里测一测
        </button>
      )}
      {micTest !== 'idle' && micTest !== 'testing' && (
        <button type="button" className="text-link read-along-mictest" onClick={runMicTest}>
          再测一次麦克风
        </button>
      )}

    </div>
  );
}
