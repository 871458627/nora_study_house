import { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Mascot } from '../../components/Mascot';
import { Icon } from '../../components/Icon';
import { LeaveConfirmDialog } from '../../components/LeaveConfirmDialog';
import type { DictationWord } from '../../data/types';
import type { TaskOutcome } from '../../core/model';
import { shuffleWithSeed } from '../../core/grading';
import { useSpeech } from '../../app/useSpeech';
import { recognizeChar, type Stroke } from '../../app/handwritingEngine';
import { TianzigePad } from './TianzigePad';

type DictationMode = 'choice' | 'type' | 'handwrite';

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
  // 田字格手写状态（docs/01 P2-4）
  const [strokes, setStrokes] = useState<Stroke[]>([]);
  const [writtenChars, setWrittenChars] = useState<string[]>([]);
  const [ranked, setRanked] = useState<string[] | null>(null);
  const [missCount, setMissCount] = useState(0);
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

  // 手写闭集：本次听写全部词语的生字（去重），候选与提示都只在其中取
  const closedSet = useMemo(
    () => Array.from(new Set(words.map(item => [...item.word]).flat())),
    [words],
  );
  const charPinyin = useMemo(() => {
    const map = new Map<string, string>();
    for (const item of words) {
      const syllables = item.pinyin.trim().split(/\s+/);
      if (syllables.length === [...item.word].length) {
        [...item.word].forEach((ch, i) => map.set(ch, syllables[i]));
      }
    }
    return map;
  }, [words]);
  const targetChars = word ? [...word.word] : [];
  const bankChars = useMemo(() => {
    if (!word) return [];
    const fillers = shuffleWithSeed(closedSet.filter(ch => !word.word.includes(ch)), `${word.id}:bank`)
      .slice(0, 2);
    return shuffleWithSeed([...word.word, ...fillers], `${word.id}:bank-order`);
  }, [word, closedSet]);

  // 落笔停顿 0.7s 自动出候选（写完不用点按钮）
  useEffect(() => {
    if (dictationMode !== 'handwrite' || revealed || !strokes.length) {
      setRanked(null);
      return;
    }
    const timer = window.setTimeout(() => {
      try {
        setRanked(recognizeChar(strokes, closedSet));
      } catch {
        setRanked([]);
      }
    }, 700);
    return () => window.clearTimeout(timer);
  }, [strokes, dictationMode, revealed, closedSet]);

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
    setStrokes([]);
    setWrittenChars([]);
    setRanked(null);
    setMissCount(0);
  };

  const switchMode = (nextMode: DictationMode) => {
    if (revealed) return;
    setDictationMode(nextMode);
    setDraft('');
    setStrokes([]);
    setWrittenChars([]);
    setRanked(null);
    setMissCount(0);
  };

  const confirmChar = (char: string) => {
    if (revealed || writtenChars.length >= targetChars.length) return;
    const nextChars = [...writtenChars, char];
    setWrittenChars(nextChars);
    setStrokes([]);
    setRanked(null);
    setMissCount(0);
    if (nextChars.length === targetChars.length) {
      answer(nextChars.join(''));
    }
  };

  const notLike = () => {
    setStrokes([]);
    setRanked(null);
    setMissCount(count => count + 1);
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
            aria-selected={dictationMode === 'handwrite'}
            className={dictationMode === 'handwrite' ? 'seg active' : 'seg'}
            disabled={revealed}
            onClick={() => switchMode('handwrite')}
          >
            田字格写
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

          {dictationMode === 'handwrite' && !revealed ? null : (
            (!canSpeak || dictationMode === 'type' || revealed) && (
              <div className="pinyin-prompt">
                <span>拼音</span>
                <b>{word.pinyin}</b>
              </div>
            )
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
          ) : dictationMode === 'handwrite' ? (
            <div className="dictation-handwrite">
              <div className="hw-slots" aria-label="词语书写进度">
                {targetChars.map((_, i) => (
                  <span
                    key={i}
                    className={`hw-slot ${i < writtenChars.length ? 'filled' : ''} ${
                      i === writtenChars.length && !revealed ? 'active' : ''
                    }`}
                  >
                    {writtenChars[i] ?? ''}
                  </span>
                ))}
              </div>

              {!revealed && (
                <>
                  <TianzigePad
                    strokes={strokes}
                    onStrokesChange={setStrokes}
                    hintChar={targetChars[writtenChars.length] ?? ''}
                  />
                  <div className="hw-tools">
                    <button
                      type="button"
                      className="hw-tool"
                      disabled={!strokes.length}
                      onClick={() => setStrokes(items => items.slice(0, -1))}
                    >
                      撤销一笔
                    </button>
                    <button
                      type="button"
                      className="hw-tool ghost"
                      disabled={!strokes.length}
                      onClick={() => setStrokes([])}
                    >
                      字迹清空
                    </button>
                  </div>

                  {ranked && ranked.length > 0 && (
                    <div className="hw-cand">
                      <div className="hw-cand-label">写得最像的字 · 点一个确认</div>
                      <div className="hw-cand-row">
                        {ranked.map((ch, i) => (
                          <button
                            key={ch}
                            type="button"
                            className={`hw-cand-item ${i === 0 ? 'top' : ''}`}
                            onClick={() => confirmChar(ch)}
                          >
                            <b>{ch}</b>
                            {charPinyin.get(ch) ? <span>{charPinyin.get(ch)}</span> : null}
                          </button>
                        ))}
                      </div>
                      <button type="button" className="hw-notlike" onClick={notLike}>
                        都不像，重新写
                      </button>
                    </div>
                  )}

                  {ranked && ranked.length === 0 && strokes.length > 0 && (
                    <div className="hw-cand-empty">
                      <span>没认出来，再写清楚一点试试</span>
                      <button type="button" className="hw-notlike" onClick={notLike}>
                        清空重写
                      </button>
                    </div>
                  )}

                  {missCount >= 2 && (
                    <div className="hw-bank">
                      <div className="hw-cand-label">还是写不出来？从这几个字里点一个</div>
                      <div className="hw-cand-row">
                        {bankChars.map(ch => (
                          <button
                            key={ch}
                            type="button"
                            className="hw-cand-item"
                            onClick={() => confirmChar(ch)}
                          >
                            <b>{ch}</b>
                            {charPinyin.get(ch) ? <span>{charPinyin.get(ch)}</span> : null}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
                </>
              )}

              {revealed && (
                <div className="hw-written">
                  <span>你写的是</span>
                  <b>{writtenChars.join('')}</b>
                </div>
              )}
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
