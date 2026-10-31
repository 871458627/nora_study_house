import { useEffect, useMemo, useState } from 'react';
import { useApp } from '../../app/AppProvider';
import { useLessonReader } from '../../app/useLessonReader';
import { Icon } from '../../components/Icon';
import type { LessonReading } from '../../data/types';
import { todayKey } from '../../core/date';

/**
 * 英语短文阅读（docs/06 §3.13）：每课一篇 ~60 词短文，逐句朗读 + 2 道理解题。
 * 完成记录进 freeLogs（自由练习口径：记录量、不给星星）。
 * 朗读复用 useLessonReader（内容签名副作用 + 逐段链式播放）。
 * 样式组件内 <style>：全局样式表由并行迭代占用，上线后迁移。
 */
const READING_CARD_CSS = `
.english-reading{display:flex;flex-direction:column;gap:14px;}
.reading-text{font-size:15px;line-height:1.9;background:var(--surface);border-radius:16px;padding:14px 16px;}
.reading-sentence{transition:color .3s;}
.reading-sentence.on{color:var(--accent);font-weight:500;}
.reading-questions{display:flex;flex-direction:column;gap:12px;}
.reading-question{display:flex;flex-direction:column;gap:8px;}
.reading-question>b{font-size:13.5px;font-weight:500;}
.reading-options{display:flex;flex-wrap:wrap;gap:8px;}
.reading-option{border:1.5px solid var(--line);border-radius:12px;background:var(--surface);color:inherit;font:inherit;font-size:13px;padding:8px 14px;cursor:pointer;}
.reading-option.right{background:#e5f4e8;border-color:#4f9e5f;color:#2e7d43;font-weight:500;}
.reading-option.wrong{background:#ffebee;border-color:var(--danger);color:var(--danger);}
.reading-option.dim{opacity:.45;}
.reading-option:disabled{cursor:default;}
.reading-done{font-size:13px;color:#2e7d43;background:#e5f4e8;border-radius:12px;padding:10px 14px;margin:0;}
.sports-note{font-size:11.5px;color:var(--sub);margin:0;}
`;

export function EnglishReadingCard({ reading }: { reading: LessonReading }) {
  const { dispatchLocal, notify } = useApp();
  const today = todayKey();
  const [answers, setAnswers] = useState<Record<number, number>>({});
  const [recorded, setRecorded] = useState(false);

  const sentences = useMemo(
    () =>
      reading.text
        .split(/(?<=[.!?])\s+/)
        .map(sentence => sentence.trim())
        .filter(Boolean)
        .map(text => ({ text, lang: 'en-US' as const })),
    [reading.text],
  );
  const reader = useLessonReader(sentences, () =>
    notify('这台设备暂时不能朗读，请和孩子一起读一遍。'),
  );

  const answeredCount = Object.keys(answers).length;
  const allAnswered = answeredCount === reading.questions.length;
  const correct = reading.questions.filter((question, index) => answers[index] === question.answer).length;

  // 全部作答后记录一次（自由练习台账：记录量、不给星星）
  useEffect(() => {
    if (!allAnswered || recorded) return;
    setRecorded(true);
    dispatchLocal({
      type: 'reading-practice',
      date: today,
      correct,
      total: reading.questions.length,
    });
  }, [allAnswered, recorded, dispatchLocal, today, correct, reading.questions.length]);

  return (
    <section className="card english-reading" aria-label="短文阅读">
      <style>{READING_CARD_CSS}</style>
      <div className="section-title">
        <h2>短文阅读 · {reading.title}</h2>
        <span className="chip-label">{sentences.length} 句 · 约 60 词</span>
      </div>

      <div className="lesson-reader card">
        <button
          type="button"
          className={'lesson-reader-btn' + (reader.state === 'playing' ? ' speaking' : '')}
          onClick={reader.toggle}
          disabled={!reader.canRead}
          aria-label={reader.state === 'playing' ? '停止朗读' : '朗读短文'}
        >
          <Icon name={reader.state === 'playing' ? 'close' : 'speaker'} size={20} />
        </button>
        <div className="lesson-reader-body">
          <b>{reader.state === 'playing' ? '正在朗读…' : '点喇叭，听一遍短文'}</b>
          {reader.state === 'playing' && reader.current ? (
            <p className="reader-current">{reader.current.text}</p>
          ) : (
            <p className="reader-hint">
              {reader.canRead ? '先听一遍，再自己读一读。' : '这台设备不能朗读，和家长一起读一读吧。'}
            </p>
          )}
        </div>
      </div>

      <div className="reading-text">
        {sentences.map((sentence, index) => (
          <span
            key={index}
            className={
              reader.state === 'playing' && reader.index === index
                ? 'reading-sentence on'
                : 'reading-sentence'
            }
          >
            {sentence.text}{' '}
          </span>
        ))}
      </div>

      <div className="reading-questions">
        {reading.questions.map((question, qIndex) => {
          const picked = answers[qIndex];
          const answered = picked !== undefined;
          return (
            <div key={qIndex} className="reading-question">
              <b>
                {qIndex + 1}. {question.q}
              </b>
              <div className="reading-options">
                {question.options.map((option, oIndex) => {
                  const isPicked = picked === oIndex;
                  const isAnswer = oIndex === question.answer;
                  const cls = !answered
                    ? 'reading-option'
                    : isAnswer
                      ? 'reading-option right'
                      : isPicked
                        ? 'reading-option wrong'
                        : 'reading-option dim';
                  return (
                    <button
                      key={oIndex}
                      type="button"
                      className={cls}
                      disabled={answered}
                      onClick={() => setAnswers(current => ({ ...current, [qIndex]: oIndex }))}
                    >
                      {option}
                    </button>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>

      {allAnswered ? (
        <p className="reading-done" role="status">
          ✓ 完成！答对 {correct} / {reading.questions.length} 题。已记入自由练习。
        </p>
      ) : (
        <p className="sports-note">读短文，点选项答题。答完自动记入自由练习（不给星星，只记进步）。</p>
      )}
    </section>
  );
}
