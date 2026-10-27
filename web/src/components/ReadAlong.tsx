import { useState } from 'react';
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
  const [showTarget, setShowTarget] = useState(false);

  const busy = listener.state === 'listening';

  const start = () => {
    setScore(null);
    setErrorCode(null);
    stopSpeech();
    listener.start(text => setScore(scoreReading(sentence, text)), code => setErrorCode(code));
  };

  const stars = score?.stars ?? 0;

  return (
    <div className="read-along">
      <div className="read-along-target">
        <button
          type="button"
          className="read-along-listen"
          aria-label="听这一句"
          onClick={() => (busy ? null : speak(sentence, 'zh-CN', 0.82))}
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
                  : '没听清你的声音，大声一点、靠近一点再试一次。'}
        </p>
      )}

      <button type="button" className="text-link read-along-toggle" onClick={() => setShowTarget(v => !v)}>
        {showTarget ? '收起说明' : '怎么玩？'}
      </button>
      {showTarget && (
        <p className="read-along-help">
          点「跟我读」后大声读出这句话，系统会听你读得准不准，给一颗到三颗星。
          语音由浏览器系统识别，小桃学习屋不会保存录音。
        </p>
      )}
    </div>
  );
}
