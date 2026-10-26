import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { useApp } from '../app/AppProvider';
import { Icon } from '../components/Icon';
import { SubjectChip } from '../components/ui';
import { useSpeech } from '../app/useSpeech';
import { lessonById, unitById, lessonLabel } from '../data/content';
import { LESSON_STATUS_LABEL, MASTERY_LABEL } from '../data/labels';
import type { KnowledgePoint, Question } from '../data/types';
import { lessonProgress } from '../core/model';
import { formatMonthDay, todayKey } from '../core/date';
import { EmptyState } from '../components/ui';

function PointList({ points }: { points: KnowledgePoint[] }) {
  return (
    <ol className="point-list">
      {points.map((point, index) => (
        <li key={point.id}>
          <span>{index + 1}</span>
          <p>{point.text}</p>
        </li>
      ))}
    </ol>
  );
}

function questionKind(question: Question): string {
  if (question.type === 'numeric') return '填空 / 口算';
  if (question.type === 'match') return '连线配对';
  if (question.type === 'order') return '排序';
  if (question.type === 'truefalse') return '判断';
  return '选择';
}

export function LessonPage() {
  const { lessonId } = useParams();
  const { state } = useApp();
  const lesson = lessonId ? lessonById(lessonId) : undefined;
  const { speak, supported, hasVoice } = useSpeech();
  const [speechFailed, setSpeechFailed] = useState(false);

  useEffect(() => {
    setSpeechFailed(false);
  }, [lessonId]);

  const speakWord = (text: string) => {
    setSpeechFailed(false);
    speak(text, 'en-US', 0.85, () => setSpeechFailed(true));
  };

  if (!lesson) {
    return (
      <div className="page">
        <EmptyState title="没有找到这一课" icon="book">
          它可能已经被调整过。回到课本页重新选一课吧。
        </EmptyState>
        <Link to="/textbook" className="btn btn-soft">
          回到课本
        </Link>
      </div>
    );
  }

  const subject = lesson.subject;
  const meta = lesson.unitId ? unitById(lesson.unitId) : undefined;
  const progress = lessonProgress(state, lesson.id);
  const today = todayKey();
  const todayTask = state.dailyPlans[today]?.tasks.find(task => task.lessonId === lesson.id);
  const doneTask = todayTask ? state.dailyLogs[today]?.done.includes(todayTask.id) : false;
  const planTask = todayTask && !doneTask ? todayTask : undefined;
  const englishSpeech = lesson.words && supported && hasVoice('en-US');

  return (
    <div className="page lesson-page">
      <div className="lesson-back">
        <Link to="/textbook" className="text-link">
          <Icon name="back" size={14} /> 回到课本
        </Link>
      </div>

      <header className="lesson-head">
        <div className="lesson-head-main">
          <div className="hero-subject">
            <SubjectChip subject={subject} />
            <span>{meta?.title ?? '课本'}</span>
          </div>
          <h1>{lesson.title}</h1>
          <div className="lesson-subline">
            <span>{lessonLabel(lesson)}</span>
            <span className={`status-pill ${progress.status}`}>{LESSON_STATUS_LABEL[progress.status]}</span>
            {progress.dueAt && progress.status !== 'mastered' && (
              <span className="due-note">下次复习 {formatMonthDay(progress.dueAt)}</span>
            )}
          </div>
          <p className="page-lede">
            {lesson.subject === 'chinese'
              ? '先读一读知识卡，再试着回答。语文的字词听写可以单独练。'
              : lesson.subject === 'math'
                ? '知识点和课后练习放在一起，先想清楚再动笔。'
                : '先听单词和短句，再用手上的词练一练。'}
          </p>
        </div>
        <div className="mastery-card card">
          <span>掌握度</span>
          <div className="mastery-dots" aria-label={`掌握度 ${progress.mastery} 级，共 3 级`}>
            {[0, 1, 2].map(level => (
              <i key={level} className={progress.mastery > level ? 'on' : ''} />
            ))}
          </div>
          <b>{MASTERY_LABEL[progress.mastery]}</b>
          <small>答错会记进错题本，薄弱点会在周日回来复习。</small>
        </div>
      </header>

      {planTask && (
        <Link to={`/task/${planTask.id}`} className="today-task-callout">
          <span className="rail-icon">
            <Icon name="sparkle" size={18} />
          </span>
          <div>
            <b>今天的计划里有这一课</b>
            <p>{planTask.title} · {planTask.subtitle}</p>
          </div>
          <span className="text-link">
            开始 <Icon name="chevron" size={13} />
          </span>
        </Link>
      )}

      <div className="lesson-grid">
        <section className="knowledge-card card">
          <div className="section-title">
            <h2>预习卡</h2>
            <span className="chip-label">先有个印象</span>
          </div>
          <PointList points={lesson.preview.points} />
        </section>

        <section className="knowledge-card card">
          <div className="section-title">
            <h2>复习卡</h2>
            <span className="chip-label">学过要记牢</span>
          </div>
          <PointList points={lesson.review.points} />
          {lesson.review.mistakes.length > 0 && (
            <div className="mistake-tip">
              <b>容易错的地方</b>
              <ul>
                {lesson.review.mistakes.map(item => (
                  <li key={item}>{item}</li>
                ))}
              </ul>
            </div>
          )}
          {lesson.review.tip && (
            <div className="tip-line">
              <Icon name="leaf" size={14} />
              <span>{lesson.review.tip}</span>
            </div>
          )}
        </section>
      </div>

      <section className="practice-launch card">
        <div>
          <span className="eyebrow">本课练习</span>
          <h2>
            {lesson.questions.length + (lesson.afterClass?.length ?? 0)} 道题，按自己的节奏来。
          </h2>
          <p>
            {lesson.subject === 'math'
              ? '随堂题 + 课后口算。提交后立即判分，错题能在这里重新看。'
              : '提交后立即判分，答对答错都有解释。自由练习不计入今日计划。'}
          </p>
          <div className="question-kind-row">
            {lesson.questions.map(question => (
              <span key={question.id} className="kind-chip">
                {questionKind(question)}
              </span>
            ))}
            {lesson.afterClass?.map(question => (
              <span key={question.id} className="kind-chip">
                {questionKind(question)}
              </span>
            ))}
          </div>
        </div>
        <div className="practice-launch-actions">
          <Link to={`/lesson/${lesson.id}/practice`} className="btn btn-primary">
            <Icon name="pen" size={16} />
            {lesson.subject === 'math' ? '做随堂与课后练习' : '开始自由练习'}
          </Link>
          {lesson.subject === 'chinese' && lesson.dictation?.length ? (
            <Link to={`/lesson/${lesson.id}/dictation`} className="btn btn-soft">
              <Icon name="speaker" size={16} />
              本课听写 · {lesson.dictation.length} 词
            </Link>
          ) : null}
          {lesson.subject === 'english' && lesson.words?.length ? (
            <Link to={`/lesson/${lesson.id}/words`} className="btn btn-soft">
              <Icon name="speaker" size={16} />
              单词与短句 · {lesson.words.length} 个词
            </Link>
          ) : null}
        </div>
      </section>

      {lesson.dictation?.length ? (
        <section className="word-section">
          <div className="section-title">
            <h2>本课听写词</h2>
            <span className="chip-label">点“本课听写”开始朗读</span>
          </div>
          <div className="dictation-word-list">
            {lesson.dictation.map(word => (
              <div key={word.id} className="dictation-word">
                <b>{word.word}</b>
                <span>{word.pinyin}</span>
              </div>
            ))}
          </div>
        </section>
      ) : null}

      {lesson.words?.length ? (
        <section className="word-section">
          <div className="section-title">
            <h2>单词与短句</h2>
            <span className="chip-label">
              {englishSpeech ? '听一听，再读一遍' : '看中文意思，也能记'}
            </span>
          </div>
          {!englishSpeech && (
            <div className="tip-line voice-fallback">
              <Icon name="wifi-off" size={14} />
              <span>这台设备没有英语语音，朗读按钮先收起；可以看中文意思和例句来记，不影响做题。</span>
            </div>
          )}
          {englishSpeech && speechFailed && (
            <div className="tip-line voice-fallback">
              <Icon name="wifi-off" size={14} />
              <span>点了朗读但这台设备没有发出声音；可以换一个浏览器再试，或先看例句和中文意思来记。</span>
            </div>
          )}
          <div className="english-word-list">
            {lesson.words.map(word => (
              <div key={word.id} className="english-word">
                <div className="english-word-main">
                  <b>{word.en}</b>
                  <span>{word.zh}</span>
                </div>
                <p>
                  {word.sentence}
                  <small>{word.sentenceZh}</small>
                </p>
                {englishSpeech && (
                  <div className="english-word-actions">
                    <button
                      type="button"
                      className="icon-btn"
                      aria-label={`朗读 ${word.en}`}
                      onClick={() => speakWord(word.en)}
                    >
                      <Icon name="speaker" size={17} />
                    </button>
                    <button
                      type="button"
                      className="text-link sentence-speak"
                      onClick={() => speakWord(word.sentence)}
                    >
                      听短句
                    </button>
                  </div>
                )}
              </div>
            ))}
          </div>
        </section>
      ) : null}

      {lesson.afterClass?.length ? (
        <section className="afterclass-section card">
          <div className="section-title">
            <h2>课后练习</h2>
            <span className="chip-label">{lesson.afterClass.length} 道</span>
          </div>
          <ol className="afterclass-list">
            {lesson.afterClass.map(question => (
              <li key={question.id}>
                <span>{question.stem}</span>
              </li>
            ))}
          </ol>
          <Link to={`/lesson/${lesson.id}/practice`} className="text-link">
            去练习 <Icon name="chevron" size={13} />
          </Link>
        </section>
      ) : null}

      <p className="content-note">
        知识点与题目为依据二年级上册教材整理的辅助内容，具体表述请以孩子的课本为准。
      </p>
    </div>
  );
}
