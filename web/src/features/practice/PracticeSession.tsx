import { useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Mascot } from '../../components/Mascot';
import { Icon } from '../../components/Icon';
import { LeaveConfirmDialog } from '../../components/LeaveConfirmDialog';
import type { Question } from '../../data/types';
import type { TaskOutcome } from '../../core/model';
import {
  answerText,
  gradeSession,
  isResponseCorrect,
  matchRightOrder,
  shuffleWithSeed,
  type ResponseValue,
} from '../../core/grading';

type SessionMode = 'task' | 'free';

interface PracticeSessionProps {
  title: string;
  meta: string;
  questions: Question[];
  backTo: string;
  backLabel: string;
  mode: SessionMode;
  onFinish: (outcome: TaskOutcome) => void;
}

function typeLabel(question: Question): string {
  if (question.type === 'numeric') return '填空';
  if (question.type === 'match') return '连线';
  if (question.type === 'order') return '排序';
  if (question.type === 'truefalse') return '判断';
  return '选择';
}

function outcomeFor(questions: Question[], responses: ResponseValue[]): TaskOutcome {
  const result = gradeSession(questions, responses);
  return {
    correct: result.correct,
    total: result.total,
    weakness: result.weakness,
    wrongQuestionIds: result.wrongQuestionIds,
    correctQuestionIds: result.answers
      .filter(answer => answer.correct)
      .map(answer => answer.questionId),
  };
}

export function PracticeSession({
  title,
  meta,
  questions,
  backTo,
  backLabel,
  mode,
  onFinish,
}: PracticeSessionProps) {
  const [responses, setResponses] = useState<ResponseValue[]>(() => questions.map(() => null));
  const [confirmed, setConfirmed] = useState<boolean[]>(() => questions.map(() => false));
  const [index, setIndex] = useState(0);
  const [choiceDraft, setChoiceDraft] = useState<number | null>(null);
  const [numericDraft, setNumericDraft] = useState('');
  const [orderDraft, setOrderDraft] = useState<number[]>([]);
  const [matches, setMatches] = useState<(number | null)[]>(() =>
    questions[0]?.type === 'match'
      ? Array(questions[0].pairs?.length ?? 0).fill(null)
      : [],
  );
  const [activeLeft, setActiveLeft] = useState<number | null>(
    questions[0]?.type === 'match' ? 0 : null,
  );
  const [finished, setFinished] = useState(false);
  const [leaveOpen, setLeaveOpen] = useState(false);
  const navigate = useNavigate();

  const current = questions[index];
  const confirmedCount = confirmed.filter(Boolean).length;

  const requestLeave = () => {
    if (finished || confirmedCount > 0) {
      setLeaveOpen(true);
      return;
    }
    navigate(backTo);
  };

  const leaveDialog = leaveOpen ? (
    <LeaveConfirmDialog
      title={finished ? '这次结果还没保存' : '要离开吗？'}
      description={
        finished
          ? '现在离开不会计入记录，错题也不会进入错题本。'
          : `这次已经答了 ${confirmedCount} 题，离开后不会保存。`
      }
      stayLabel={finished ? '继续看结果' : '继续做'}
      onStay={() => setLeaveOpen(false)}
      onLeave={() => {
        setLeaveOpen(false);
        navigate(backTo);
      }}
    />
  ) : null;
  const result = useMemo(() => gradeSession(questions, responses), [questions, responses]);
  const rightOrder = useMemo(
    () => (current?.type === 'match' ? matchRightOrder(current) : []),
    [current],
  );
  const orderDisplay = useMemo(
    () =>
      current?.type === 'order'
        ? shuffleWithSeed(
            (current.items ?? []).map((_, itemIndex) => itemIndex),
            `${current.id}:display`,
          )
        : [],
    [current],
  );

  if (!questions.length || !current) {
    return (
      <div className="session-shell">
        <div className="session-body">
          <div className="empty-state">
            <b>这一项暂时没有题目</b>
            <p>先回到课本看看知识卡吧。</p>
            <Link to={backTo} className="btn btn-soft">
              {backLabel}
            </Link>
          </div>
        </div>
      </div>
    );
  }

  if (finished) {
    const rate = result.total ? result.correct / result.total : 0;
    const perfect = result.total > 0 && result.correct === result.total;
    const wrongAnswers = result.answers
      .map((answer, answerIndex) => ({ answer, question: questions[answerIndex] }))
      .filter(item => !item.answer.correct);

    return (
      <>
      <div className="session-shell">
        <header className="session-nav">
          <button type="button" className="session-back" aria-label={backLabel} onClick={requestLeave}>
            <Icon name="back" size={17} />
          </button>
          <div className="session-nav-copy">
            <b>{title}</b>
            <span>练习结果</span>
          </div>
          <span className="session-nav-spacer" />
        </header>
        <div className="session-body">
          <section className="summary card">
            <div className="summary-art">
              <Mascot mood={rate >= 2 / 3 ? 'celebrate' : 'normal'} size={116} />
            </div>
            <span className="eyebrow">本次练习</span>
            <h1>
              {result.correct}
              <small> / {result.total} 题答对</small>
            </h1>
            <p className="summary-lede">
              {rate === 1
                ? '全部答对，今天学得很扎实。'
                : rate >= 2 / 3
                  ? '大部分都答对了。看看错题，再记一遍就更稳了。'
                  : '这次先找出没弄懂的地方，改对就是进步。'}
            </p>

            <div className="summary-rewards">
              {mode === 'task' ? (
                <>
                  <strong>完成今日计划</strong>
                  <span>+1 颗星 · +1 份桃粮{perfect ? ' · 全对再 +1 份' : ''}</span>
                </>
              ) : (
                <>
                  <strong>自由练习</strong>
                  <span>不计星星与桃粮，错题会进入错题本。</span>
                </>
              )}
            </div>

            {wrongAnswers.length > 0 && (
              <div className="summary-wrong">
                <b>需要再看一眼的题</b>
                <ul>
                  {wrongAnswers.map(({ answer, question }) => (
                    <li key={answer.questionId}>
                      <span>{question.stem}</span>
                      <small>正确答案：{answerText(question)}</small>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            <button
              type="button"
              className="btn btn-primary full"
              onClick={() => onFinish(outcomeFor(questions, responses))}
            >
              {mode === 'task' ? '收下今天的奖励' : '记录这次练习'}
              <Icon name="check" size={16} />
            </button>
            <p className="pin-note">
              {mode === 'task' ? '确认后会计入今日进度，点亮相应的掌握度与错题记录。' : '确认后回到这一课，可以继续做别的练习。'}
            </p>
          </section>
        </div>
      </div>
      {leaveDialog}
      </>
    );
  }

  const isConfirmed = confirmed[index];
  const isCorrect = isResponseCorrect(current, responses[index]);
  const progress = (confirmedCount / questions.length) * 100;

  const commit = (value: ResponseValue) => {
    setResponses(currentResponses =>
      currentResponses.map((response, responseIndex) =>
        responseIndex === index ? value : response,
      ),
    );
    setConfirmed(currentConfirmed =>
      currentConfirmed.map((done, confirmedIndex) =>
        confirmedIndex === index ? true : done,
      ),
    );
  };

  const canConfirm = (() => {
    if (isConfirmed) return false;
    if (current.type === 'choice' || current.type === 'truefalse') return choiceDraft !== null;
    if (current.type === 'numeric') return numericDraft.length > 0;
    if (current.type === 'order') return orderDraft.length === (current.items?.length ?? 0);
    return matches.length > 0 && matches.every(value => value !== null);
  })();

  const confirmAnswer = () => {
    if (!canConfirm) return;
    if (current.type === 'choice' || current.type === 'truefalse') {
      commit(choiceDraft);
    } else if (current.type === 'numeric') {
      commit(Number(numericDraft));
    } else if (current.type === 'order') {
      commit([...orderDraft]);
    } else {
      commit(matches as number[]);
    }
  };

  const nextQuestion = () => {
    if (index >= questions.length - 1) {
      setFinished(true);
      return;
    }
    setIndex(value => value + 1);
    setChoiceDraft(null);
    setNumericDraft('');
    setOrderDraft([]);
    const next = questions[index + 1];
    setMatches(next?.type === 'match' ? Array(next.pairs?.length ?? 0).fill(null) : []);
    setActiveLeft(next?.type === 'match' ? 0 : null);
  };

  const addOrderItem = (itemIndex: number) => {
    if (isConfirmed) return;
    setOrderDraft(currentDraft =>
      currentDraft.includes(itemIndex) ? currentDraft : [...currentDraft, itemIndex],
    );
  };

  const removeOrderItem = (position: number) => {
    if (isConfirmed) return;
    setOrderDraft(currentDraft => currentDraft.filter((_, itemIndex) => itemIndex !== position));
  };

  const assignRight = (rightIndex: number) => {
    if (isConfirmed || activeLeft === null) return;
    const next = Array.from({ length: current.pairs?.length ?? 0 }, (_, leftIndex) => {
      if (leftIndex === activeLeft) return rightIndex;
      if (matches[leftIndex] === rightIndex) return null;
      return matches[leftIndex] ?? null;
    });
    setMatches(next);
    const nextLeft = next.findIndex(value => value === null);
    setActiveLeft(nextLeft >= 0 ? nextLeft : null);
  };

  const pairCount = current.pairs?.length ?? 0;
  const activeLeftText = activeLeft !== null ? current.pairs?.[activeLeft]?.left : '';
  const questionNumber = index + 1;

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
          第 {questionNumber} / {questions.length} 题
        </span>
      </header>
      <div className="session-progress" aria-hidden="true">
        <i style={{ width: `${progress}%` }} />
      </div>

      <div className="session-body">
        <div className="quiz-head">
          <span className="kind-chip">{typeLabel(current)}</span>
          <span className="quiz-count">
            已完成 {confirmedCount} / {questions.length}
          </span>
        </div>

        <section className="quiz-card card">
          <h1 className="quiz-stem">{current.stem}</h1>

          {(current.type === 'choice' || current.type === 'truefalse') && (
            <div className="option-list" role="group" aria-label="选择答案">
              {(current.options ?? []).map((option, optionIndex) => {
                const chosen = choiceDraft === optionIndex;
                const isAnswer = current.answerIndex === optionIndex;
                const stateClass = isConfirmed
                  ? isAnswer
                    ? 'correct'
                    : chosen
                      ? 'wrong'
                      : ''
                  : chosen
                    ? 'selected'
                    : '';
                return (
                  <button
                    key={option}
                    type="button"
                    className={`option-btn ${stateClass}`}
                    aria-pressed={chosen}
                    disabled={isConfirmed}
                    onClick={() => setChoiceDraft(optionIndex)}
                  >
                    <span className="option-letter">
                      {current.type === 'truefalse'
                        ? optionIndex === 0
                          ? '✓'
                          : '×'
                        : String.fromCharCode(65 + optionIndex)}
                    </span>
                    <span>{option}</span>
                    {isConfirmed && isAnswer && (
                      <span className="option-mark">
                        <Icon name="check" size={13} />
                      </span>
                    )}
                    {isConfirmed && chosen && !isAnswer && (
                      <span className="option-mark wrong">
                        <Icon name="close" size={13} />
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          )}

          {current.type === 'numeric' && (
            <div className="numeric-answer">
              <label className="numeric-display">
                <span>我的答案</span>
                <input
                  value={numericDraft}
                  inputMode="numeric"
                  pattern="[0-9]*"
                  disabled={isConfirmed}
                  aria-label="输入答案"
                  placeholder="?"
                  onChange={event =>
                    setNumericDraft(event.target.value.replace(/\D/g, '').slice(0, 4))
                  }
                  onKeyDown={event => {
                    if (event.key === 'Enter' && canConfirm) confirmAnswer();
                  }}
                />
              </label>
              <div className="keypad" aria-label="数字键盘">
                {['1', '2', '3', '4', '5', '6', '7', '8', '9'].map(key => (
                  <button
                    key={key}
                    type="button"
                    className="key-btn"
                    disabled={isConfirmed}
                    onClick={() => setNumericDraft(value => (value + key).slice(0, 4))}
                  >
                    {key}
                  </button>
                ))}
                <button
                  type="button"
                  className="key-btn quiet"
                  disabled={isConfirmed}
                  onClick={() => setNumericDraft('')}
                >
                  清空
                </button>
                <button
                  type="button"
                  className="key-btn"
                  disabled={isConfirmed}
                  onClick={() => setNumericDraft(value => value + '0')}
                >
                  0
                </button>
                <button
                  type="button"
                  className="key-btn quiet"
                  disabled={isConfirmed}
                  onClick={() => setNumericDraft(value => value.slice(0, -1))}
                  aria-label="退格"
                >
                  <Icon name="back" size={18} />
                </button>
              </div>
            </div>
          )}

          {current.type === 'order' && (
            <div className="order-answer">
              <div className="order-slots" aria-label="已排好的顺序">
                {orderDraft.length === 0 ? (
                  <span className="order-hint">按正确顺序，依次点选下面的内容。</span>
                ) : (
                  orderDraft.map((itemIndex, position) => (
                    <button
                      key={`${itemIndex}-${position}`}
                      type="button"
                      className="order-slot"
                      disabled={isConfirmed}
                      onClick={() => removeOrderItem(position)}
                    >
                      <span>{position + 1}</span>
                      {current.items?.[itemIndex]}
                    </button>
                  ))
                )}
              </div>
              <div className="order-pool">
                {orderDisplay.map(itemIndex => {
                  const used = orderDraft.includes(itemIndex);
                  return (
                    <button
                      key={itemIndex}
                      type="button"
                      className={`pool-item ${used ? 'used' : ''}`}
                      disabled={used || isConfirmed}
                      onClick={() => addOrderItem(itemIndex)}
                    >
                      {current.items?.[itemIndex]}
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {current.type === 'match' && (
            <div className="match-answer">
              <p className="match-hint">
                {activeLeftText
                  ? `先选右边与「${activeLeftText}」相配的内容。`
                  : '左边都配好了，可以确认答案。'}
              </p>
              <div className="match-board">
                <div className="match-col">
                  {(current.pairs ?? []).map((pair, leftIndex) => {
                    const paired = matches[leftIndex] !== null && matches[leftIndex] !== undefined;
                    return (
                      <button
                        key={pair.left}
                        type="button"
                        className={`match-item ${activeLeft === leftIndex ? 'active' : ''} ${paired ? 'paired' : ''}`}
                        disabled={isConfirmed}
                        onClick={() => setActiveLeft(leftIndex)}
                      >
                        <span>{pair.left}</span>
                        {paired && (
                          <small>
                            → {current.pairs?.[matches[leftIndex] as number]?.right}
                          </small>
                        )}
                      </button>
                    );
                  })}
                </div>
                <div className="match-col right">
                  {rightOrder.map(rightIndex => {
                    const used = matches.includes(rightIndex);
                    return (
                      <button
                        key={rightIndex}
                        type="button"
                        className={`match-item ${used ? 'used' : ''}`}
                        disabled={isConfirmed || used}
                        onClick={() => assignRight(rightIndex)}
                      >
                        {current.pairs?.[rightIndex]?.right}
                      </button>
                    );
                  })}
                </div>
              </div>
              <div className="match-legend">
                <span>已配对 {matches.filter(value => value !== null).length} / {pairCount}</span>
                {!isConfirmed && pairCount > 0 && (
                  <button
                    type="button"
                    className="text-link"
                    onClick={() => {
                      setMatches(Array(pairCount).fill(null));
                      setActiveLeft(0);
                    }}
                  >
                    重新配对
                  </button>
                )}
              </div>
            </div>
          )}

          {isConfirmed && (
            <div className={`feedback-card ${isCorrect ? 'correct' : 'wrong'}`}>
              <span className="feedback-icon">
                <Icon name={isCorrect ? 'check' : 'leaf'} size={15} />
              </span>
              <div>
                <b>{isCorrect ? '答对了' : '这次没答对'}</b>
                {!isCorrect && <p className="feedback-answer">正确答案：{answerText(current)}</p>}
                {current.explanation && <p>{current.explanation}</p>}
              </div>
            </div>
          )}
        </section>

        <div className="quiz-actions">
          {!isConfirmed ? (
            <button
              type="button"
              className="btn btn-primary full"
              disabled={!canConfirm}
              onClick={confirmAnswer}
            >
              确认答案
            </button>
          ) : (
            <button type="button" className="btn btn-primary full" onClick={nextQuestion}>
              {index >= questions.length - 1 ? '看看这次的结果' : '下一题'}
              <Icon name="arrow" size={16} />
            </button>
          )}
        </div>
        <p className="quiz-footnote">
          <Icon name="leaf" size={13} />
          答错不会扣星星。把错题看明白，就是今天最大的收获。
        </p>
      </div>
    </div>
    {leaveDialog}
    </>
  );
}
