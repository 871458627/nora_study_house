import { useMemo, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { Icon } from '../../components/Icon';
import { useSpeech } from '../../app/useSpeech';
import type { EnglishWord, Lesson, Question } from '../../data/types';
import type { TaskOutcome } from '../../core/model';
import { shuffleWithSeed } from '../../core/grading';
import { PracticeSession } from '../practice/PracticeSession';

interface WordsSessionProps {
  lesson: Lesson;
  words: EnglishWord[];
  title: string;
  meta: string;
  backTo: string;
  backLabel: string;
  mode: 'task' | 'free';
  onFinish: (outcome: TaskOutcome) => void;
}

function uniqueLetters(word: string): string[] | null {
  const letters = [...word];
  const seen = new Set(letters.map(letter => letter.toLowerCase()));
  return seen.size === letters.length ? letters : null;
}

/**
 * One daily English round: see a word and choose its meaning, spell two
 * short words, then put two complete sentences back in order.
 */
export function buildWordPractice(words: EnglishWord[]): Question[] {
  const questions: Question[] = [];

  for (const word of words) {
    const distractors = shuffleWithSeed(
      [...new Set(words.filter(item => item.id !== word.id).map(item => item.zh))].filter(
        zh => zh !== word.zh,
      ),
      `${word.id}:meaning`,
    ).slice(0, 3);
    const options = shuffleWithSeed([word.zh, ...distractors], `${word.id}:word-options`);
    questions.push({
      id: `words-${word.id}`,
      type: 'choice',
      knowledgePointIds: [],
      stem: `“${word.en}” 是什么意思？`,
      options,
      answerIndex: options.indexOf(word.zh),
      explanation: `${word.en} — ${word.zh}。${word.sentence} ${word.sentenceZh}`,
    });
  }

  const spellingWords = words
    .filter(word => /^[A-Za-z]{3,8}$/.test(word.en) && uniqueLetters(word.en))
    .slice(0, 2);
  for (const word of spellingWords) {
    const letters = [...word.en];
    questions.push({
      id: `spelling-${word.id}`,
      type: 'order',
      knowledgePointIds: [],
      stem: `按顺序拼出“${word.zh}”：${word.en.length} 个字母`,
      items: letters,
      explanation: `${word.en} — ${word.zh}`,
    });
  }

  const sentenceWords = words
    .filter(word => {
      const tokens = word.sentence.replace(/[.!?]+$/, '').trim().split(/\s+/);
      return tokens.length >= 3 && new Set(tokens).size === tokens.length;
    })
    .slice(0, 2);
  for (const word of sentenceWords) {
    const tokens = word.sentence.replace(/[.!?]+$/, '').trim().split(/\s+/);
    questions.push({
      id: `sentence-${word.id}`,
      type: 'order',
      knowledgePointIds: [],
      stem: `把句子排好：${word.sentenceZh}`,
      items: tokens,
      explanation: `${word.sentence}（${word.sentenceZh}）`,
    });
  }

  return questions;
}

export function WordsSession({
  lesson,
  words,
  title,
  meta,
  backTo,
  backLabel,
  mode,
  onFinish,
}: WordsSessionProps) {
  const { speak, supported, hasVoice } = useSpeech();
  const [started, setStarted] = useState(false);
  const [speakingKey, setSpeakingKey] = useState<string | null>(null);
  const [failedKey, setFailedKey] = useState<string | null>(null);
  // 每次点击自增：同一按钮连点时，上一轮的打断/收尾回调不得清掉新一轮的「朗读中」态。
  const speakSeqRef = useRef(0);
  const questions = useMemo(() => buildWordPractice(words), [words]);
  const canSpeak = supported && hasVoice('en-US');

  const speakWord = (key: string, text: string) => {
    setFailedKey(null);
    const seq = ++speakSeqRef.current;
    setSpeakingKey(key);
    const isCurrent = () => speakSeqRef.current === seq;
    speak(
      text,
      'en-US',
      0.82,
      () => {
        // 启动失败：按钮复位，行内提示（docs/06 §3.12 失败可见）。
        if (isCurrent()) setSpeakingKey(null);
        setFailedKey(key);
      },
      () => {
        if (isCurrent()) setSpeakingKey(null);
      },
      1.04,
      () => {
        // 被下一次朗读打断：只清自己那轮的「朗读中」态，不算失败。
        if (isCurrent()) setSpeakingKey(null);
      },
    );
  };

  if (!words.length) {
    return (
      <div className="session-shell">
        <div className="session-body">
          <div className="empty-state">
            <b>这一课暂时没有单词</b>
            <p>换一课看看，或者先读一读知识卡。</p>
            <Link to={backTo} className="btn btn-soft">
              {backLabel}
            </Link>
          </div>
        </div>
      </div>
    );
  }

  if (started) {
    return (
      <PracticeSession
        title={title}
        meta={meta}
        questions={questions}
        backTo={backTo}
        backLabel={backLabel}
        mode={mode}
        onFinish={onFinish}
      />
    );
  }

  return (
    <div className="session-shell">
      <header className="session-nav">
        <Link to={backTo} className="session-back" aria-label={backLabel}>
          <Icon name="back" size={17} />
        </Link>
        <div className="session-nav-copy">
          <b>{title}</b>
          <span>{meta}</span>
        </div>
        <span className="session-nav-spacer" />
      </header>

      <div className="session-body words-body">
        <div className="words-head">
          <span className="eyebrow">单词卡</span>
          <h1>先听一遍，再认一认。</h1>
          <p>
            {canSpeak
              ? '点单词或短句旁边的喇叭，听一听发音，再跟着读一遍。'
              : '这台设备暂时没有英语语音，可以看中文意思和例句来记。'}
          </p>
        </div>

        <div className="word-deck">
          {words.map(word => (
            <article key={word.id} className="word-card card">
              <div className="word-card-main">
                <div>
                  <b>{word.en}</b>
                  <span>{word.zh}</span>
                </div>
                {canSpeak && (
                  <button
                    type="button"
                    className={'icon-btn' + (speakingKey === `${word.id}:word` ? ' speaking' : '')}
                    aria-label={speakingKey === `${word.id}:word` ? `正在朗读 ${word.en}` : `朗读 ${word.en}`}
                    onClick={() => speakWord(`${word.id}:word`, word.en)}
                  >
                    <Icon name="speaker" size={18} />
                  </button>
                )}
              </div>
              <p>
                {word.sentence}
                <small>{word.sentenceZh}</small>
              </p>
              {canSpeak && (
                <button
                  type="button"
                  className={
                    'text-link word-sentence-speak' + (speakingKey === `${word.id}:sentence` ? ' speaking' : '')
                  }
                  onClick={() => speakWord(`${word.id}:sentence`, word.sentence)}
                >
                  <Icon name="speaker" size={13} />
                  {speakingKey === `${word.id}:sentence` ? '朗读中…' : '听句子'}
                </button>
              )}
              {canSpeak && failedKey !== null && (
                <p className="speak-fail-hint" role="status">
                  这次没能读出来，再点一下试试。
                </p>
              )}
            </article>
          ))}
        </div>

        <button type="button" className="btn btn-primary full" onClick={() => setStarted(true)}>
          开始单词与短句练习 · {questions.length} 题
          <Icon name="arrow" size={16} />
        </button>
        <p className="quiz-footnote centered">
          <Icon name="leaf" size={13} />
          看词选义、拼写和句子排序都会判分，练习记录会留在记录页。
        </p>
        <p className="content-note">
          {lesson.title} · 单词与短句为依据教材整理的辅助内容，请以孩子的课本为准。
        </p>
      </div>
    </div>
  );
}
