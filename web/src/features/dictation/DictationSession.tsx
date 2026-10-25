import { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Mascot } from '../../components/Mascot';
import { Icon } from '../../components/Icon';
import { LeaveConfirmDialog } from '../../components/LeaveConfirmDialog';
import type { DictationWord } from '../../data/types';
import type { TaskOutcome } from '../../core/model';
import { shuffleWithSeed } from '../../core/grading';
import { useSpeech } from '../../app/useSpeech';

type DictationMode = 'choice' | 'type';

interface DictationSessionProps {
  words: DictationWord[];
  title: string;
  meta: string;
  backTo: string;
  backLabel: string;
  mode: 'task' | 'free';
  preferredMode: DictationMode;
  autoSpeak: boolean;
  onFinish: (outcome: TaskOutcome) => void;
}

export function DictationSession({
  words,
  title,
  meta,
  backTo,
  backLabel,
  mode,
  preferredMode,
  autoSpeak,
  onFinish,
}: DictationSessionProps) {
  const { speak, stop, supported, hasVoice } = useSpeech();
  const [index, setIndex] = useState(0);
  const [dictationMode, setDictationMode] = useState<DictationMode>(preferredMode);
  const [selected, setSelected] = useState<string | null>(null);
  const [draft, setDraft] = useState('');
  const [record, setRecord] = useState<{ wordId: string; correct: boolean; mode: DictationMode }[]>(
    [],
  );
  const [finished, setFinished] = useState(false);
  const [leaveOpen, setLeaveOpen] = useState(false);
  const navigate = useNavigate();

  const requestLeave = () => {
    if (finished || record.length > 0) {
      setLeaveOpen(true);
      return;
    }
    navigate(backTo);
  };

  const leaveDialog = leaveOpen ? (
    <LeaveConfirmDialog
      title={finished ? '这次听写还没保存' : '要离开吗？'}
      description={
        finished
          ? '现在离开不会记录正确率，写错的词也不会进入复习队列。'
          : `这次已经听写了 ${record.length} 个词，离开后不会保存。`
      }
      stayLabel={finished ? '继续看结果' : '继续听写'}
      onStay={() => setLeaveOpen(false)}
      onLeave={() => {
        setLeaveOpen(false);
        navigate(backTo);
      }}
    />
  ) : null;

  const word = words[index];
  const canSpeak = supported && hasVoice('zh-CN');
  const revealed = selected !== null;
  const correct = revealed && selected === word?.word;

  const options = useMemo(() => {
    if (!word) return [];
    const distractors = shuffleWithSeed(
      [...new Set(words.filter(item => item.id !== word.id).map(item => item.word))],
      `${word.id}:distractors`,
    ).slice(0, 3);
    return shuffleWithSeed([word.word, ...distractors], `${word.id}:options`);
  }, [word, words]);

  useEffect(() => {
    if (!autoSpeak || !canSpeak || finished || revealed || !word) return;
    const timer = window.setTimeout(() => {
      speak(word.word, 'zh-CN', 0.82);
    }, 220);
    return () => window.clearTimeout(timer);
  }, [autoSpeak, canSpeak, finished, revealed, speak, word]);

  useEffect(() => () => stop(), [stop]);

  if (!words.length || !word) {
    return (
      <div className="session-shell">
        <div className="session-body">
          <div className="empty-state">
            <b>这一课暂时没有听写词</b>
            <p>换一课，或者先读一读知识卡。</p>
            <Link to={backTo} className="btn btn-soft">
              {backLabel}
            </Link>
          </div>
        </div>
      </div>
    );
  }

  if (finished) {
    const correctCount = record.filter(item => item.correct).length;
    const perfect = correctCount === words.length;
    const wrongWords = words.filter(
      item => record.find(entry => entry.wordId === item.id && !entry.correct),
    );
    const allChoice = record.length > 0 && record.every(item => item.mode === 'choice');
    const allType = record.length > 0 && record.every(item => item.mode === 'type');
    const answeredVerb = allChoice ? '选对' : allType ? '写对' : '答对';
    const wrongVerb = allChoice ? '选错' : '写错';

    return (
      <>
      <div className="session-shell">
        <header className="session-nav">
          <button type="button" className="session-back" aria-label={backLabel} onClick={requestLeave}>
            <Icon name="back" size={17} />
          </button>
          <div className="session-nav-copy">
            <b>{title}</b>
            <span>听写结果</span>
          </div>
          <span className="session-nav-spacer" />
        </header>
        <div className="session-body">
          <section className="summary card">
            <div className="summary-art">
              <Mascot mood={correctCount >= Math.ceil(words.length * 0.6) ? 'celebrate' : 'normal'} size={116} />
            </div>
            <span className="eyebrow">本次听写</span>
            <h1>
              {correctCount}
              <small> / {words.length} 个词{answeredVerb}</small>
            </h1>
            <p className="summary-lede">
              {perfect
                ? '一个都没错，这些字词已经记得很牢了。'
                : `${wrongVerb}的词已经排进复习队列，过几天会再回来。`}
            </p>

            <div className="summary-rewards">
              {mode === 'task' ? (
                <>
                  <strong>完成今日听写</strong>
                  <span>+1 颗星 · +1 份桃粮{perfect ? ' · 全对再 +1 份' : ''}</span>
                </>
              ) : (
                <>
                  <strong>自由听写</strong>
                  <span>错词会进入听写复习队列，不计星星。</span>
                </>
              )}
            </div>

            {wrongWords.length > 0 && (
              <div className="summary-wrong">
                <b>再写一遍这些词</b>
                <ul>
                  {wrongWords.map(item => (
                    <li key={item.id}>
                      <span>{item.word}</span>
                      <small>{item.pinyin}</small>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            <button type="button" className="btn btn-primary full" onClick={() => onFinish({
              correct: correctCount,
              total: words.length,
              weakness: [],
              wrongQuestionIds: [],
              correctQuestionIds: [],
              dictation: record.map(item => ({ wordId: item.wordId, correct: item.correct })),
            })}>
              {mode === 'task' ? '收下今天的奖励' : '保存这次听写'}
              <Icon name="check" size={16} />
            </button>
            <p className="pin-note">
              {mode === 'task' ? '确认后会记录听写正确率和错词复习时间。' : '确认后回到这一课，可以再听一遍或继续练习。'}
            </p>
          </section>
        </div>
      </div>
      {leaveDialog}
      </>
    );
  }

  const answer = (value: string) => {
    if (revealed) return;
    setSelected(value);
    setRecord(items => [
      ...items,
      { wordId: word.id, correct: value === word.word, mode: dictationMode },
    ]);
  };

  const next = () => {
    if (index >= words.length - 1) {
      setFinished(true);
      return;
    }
    setIndex(value => value + 1);
    setSelected(null);
    setDraft('');
  };

  const switchMode = (nextMode: DictationMode) => {
    if (revealed) return;
    setDictationMode(nextMode);
    setDraft('');
  };

  return (
    <>
    <div className="session-shell">
      <header className="session-nav">
        <button type="button" className="session-back" aria-label={backLabel} onClick={requestLeave}>
          <Icon name="back" size={17} />
        </button>
        <div className="session-nav-copy">
          <b>{title}</b>
          <span>{meta}</span>
        </div>
        <span className="session-nav-meta">
          已听写 {record.length} / {words.length} 个
        </span>
      </header>
      <div className="session-progress" aria-hidden="true">
        <i style={{ width: `${((index + (revealed ? 1 : 0)) / words.length) * 100}%` }} />
      </div>

      <div className="session-body dictation-body">
        <div className="segmented dictation-switch" role="tablist" aria-label="听写方式">
          <button
            type="button"
            role="tab"
            aria-selected={dictationMode === 'choice'}
            className={dictationMode === 'choice' ? 'seg active' : 'seg'}
            disabled={revealed}
            onClick={() => switchMode('choice')}
          >
            听音选字
          </button>
          <button
            type="button"
            role="tab"
            aria-selected={dictationMode === 'type'}
            className={dictationMode === 'type' ? 'seg active' : 'seg'}
            disabled={revealed}
            onClick={() => switchMode('type')}
          >
            听音写字
          </button>
        </div>

        <section className="dictation-card card">
          {canSpeak ? (
            <div className="listen-area">
              <div className="speaker-wrap">
                <button
                  type="button"
                  className="speaker-button"
                  aria-label="再听一遍"
                  onClick={() => speak(word.word, 'zh-CN', 0.82)}
                >
                  <Icon name="speaker" size={32} />
                </button>
              </div>
              <b>{dictationMode === 'choice' ? '听一听，选出正确的词' : '听一听，写出这个词'}</b>
              <small>
                {autoSpeak ? '会自动朗读一遍，没听清就点喇叭。' : '自动朗读已关闭，点喇叭听一听。'}
              </small>
              <button
                type="button"
                className="slow-link"
                onClick={() => speak(word.word, 'zh-CN', 0.6)}
              >
                慢速再听一遍
              </button>
            </div>
          ) : (
            <div className="listen-area fallback">
              <span className="fallback-icon">
                <Icon name="wifi-off" size={24} />
              </span>
              <b>这台设备暂时不能朗读</b>
              <small>没关系，看拼音来完成听写。</small>
            </div>
          )}

          {(!canSpeak || dictationMode === 'type' || revealed) && (
            <div className="pinyin-prompt">
              <span>拼音</span>
              <b>{word.pinyin}</b>
            </div>
          )}

          {dictationMode === 'choice' ? (
            <div className="dictation-options" role="group" aria-label="选择听到的词">
              {options.map(option => {
                const chosen = selected === option;
                const isAnswer = option === word.word;
                const stateClass = revealed
                  ? isAnswer
                    ? 'correct'
                    : chosen
                      ? 'wrong'
                      : ''
                  : '';
                return (
                  <button
                    key={option}
                    type="button"
                    className={`dictation-option ${stateClass}`}
                    disabled={revealed}
                    onClick={() => answer(option)}
                  >
                    {option}
                    {revealed && isAnswer && (
                      <span className="option-mark">
                        <Icon name="check" size={12} />
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          ) : (
            <div className="dictation-type">
              <label>
                <span>写出听到的词语</span>
                <input
                  value={draft}
                  maxLength={8}
                  disabled={revealed}
                  autoComplete="off"
                  placeholder="在这里写"
                  onChange={event => setDraft(event.target.value)}
                  onKeyDown={event => {
                    if (event.key === 'Enter' && draft.trim() && !revealed) answer(draft.trim());
                  }}
                />
              </label>
              {!revealed && (
                <button
                  type="button"
                  className="btn btn-primary full"
                  disabled={!draft.trim()}
                  onClick={() => answer(draft.trim())}
                >
                  确认这个词语
                </button>
              )}
            </div>
          )}

          {revealed && (
            <div className={`feedback-card ${correct ? 'correct' : 'wrong'}`}>
              <span className="feedback-icon">
                <Icon name={correct ? 'check' : 'leaf'} size={15} />
              </span>
              <div>
                <b>
                  {correct
                    ? dictationMode === 'choice'
                      ? '选对了'
                      : '写对了'
                    : dictationMode === 'choice'
                      ? '这次选错了'
                      : '这次写错了'}
                </b>
                <p>
                  正确的词语是 <strong>{word.word}</strong>（{word.pinyin}）
                </p>
              </div>
            </div>
          )}
        </section>

        <div className="quiz-actions">
          {revealed ? (
            <button type="button" className="btn btn-primary full" onClick={next}>
              {index >= words.length - 1 ? '看看这次的结果' : '下一个词'}
              <Icon name="arrow" size={16} />
            </button>
          ) : (
            <p className="quiz-footnote centered">
              <Icon name="leaf" size={13} />
              写错不会扣星星，错词会再回来复习。
            </p>
          )}
        </div>
      </div>
    </div>
    {leaveDialog}
    </>
  );
}
