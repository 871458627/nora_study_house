import { Link } from 'react-router-dom';
import { useApp } from '../app/AppProvider';
import { Icon } from '../components/Icon';
import { ProgressBar, SubjectChip } from '../components/ui';
import { BADGES } from '../data/defaults';
import {
  SUBJECTS,
  dictationWordById,
  lessonById,
  lessonsForSubject,
} from '../data/content';
import { addDays, formatMonthDay, startOfWeek, todayKey, weekdayShort } from '../core/date';
import type { DictationEntry } from '../core/model';
import type { DictationWord } from '../data/types';

const WEEKDAY_SHORT = ['一', '二', '三', '四', '五', '六', '日'];

export function RecordsPage() {
  const { state } = useApp();
  const today = todayKey();
  const weekStart = startOfWeek(today);
  const heatStart = addDays(weekStart, -77);
  const heatDays = Array.from({ length: 84 }, (_, index) => addDays(heatStart, index));
  const totalMinutes = Object.values(state.dailyLogs).reduce((sum, log) => sum + log.minutes, 0);
  const totalDone = Object.values(state.dailyLogs).reduce((sum, log) => sum + log.done.length, 0);
  const unresolved = state.mistakes.filter(mistake => !mistake.resolvedAt);
  const resolvedCount = state.mistakes.length - unresolved.length;
  const earnedBadges = new Set(state.rewards.badges);
  const dictationQueue = Object.values(state.dictationQueue)
    .map(entry => ({ entry, word: dictationWordById(entry.wordId) }))
    .filter((item): item is { entry: DictationEntry; word: DictationWord } => Boolean(item.word))
    .sort((a, b) => a.entry.dueAt.localeCompare(b.entry.dueAt));
  const dictationDueCount = dictationQueue.filter(item => item.entry.dueAt <= today).length;
  const freeTotals = Object.values(state.freeLogs).reduce(
    (sum, log) => ({
      sessions: sum.sessions + log.sessions,
      questions: sum.questions + log.questions,
      correct: sum.correct + log.correct,
      dictationTotal: sum.dictationTotal + log.dictationTotal,
      dictationCorrect: sum.dictationCorrect + log.dictationCorrect,
    }),
    { sessions: 0, questions: 0, correct: 0, dictationTotal: 0, dictationCorrect: 0 },
  );
  const freeRate = freeTotals.questions
    ? Math.round((freeTotals.correct / freeTotals.questions) * 100)
    : null;

  const subjectRows = SUBJECTS.map(meta => {
    const lessons = lessonsForSubject(meta.id);
    const mastered = lessons.filter(lesson => state.lessons[lesson.id]?.status === 'mastered').length;
    const learned = lessons.filter(lesson => {
      const status = state.lessons[lesson.id]?.status;
      return status === 'reviewed' || status === 'mastered';
    }).length;
    return { meta, lessons, mastered, learned };
  });

  const mistakes = unresolved
    .map(mistake => {
      const lesson = lessonById(mistake.lessonId);
      const question = lesson
        ? [...lesson.questions, ...(lesson.afterClass ?? [])].find(item => item.id === mistake.questionId)
        : undefined;
      return lesson && question ? { mistake, lesson, question } : null;
    })
    .filter((item): item is NonNullable<typeof item> => Boolean(item))
    .slice(0, 16);

  return (
    <div className="page records-page">
      <header className="page-head">
        <div>
          <p className="eyebrow">记录 · 坚持第 {state.rewards.streak} 天</p>
          <h1>把每天的小进步，攒成一条路。</h1>
          <p className="page-lede">
            这里记录完成情况、掌握度、徽章和错题。数据会跟着家人的设备一起同步。
          </p>
        </div>
        <div className="head-side">
          <Link to="/report" className="btn btn-soft">
            <Icon name="lock" size={15} />
            家长周报
          </Link>
        </div>
      </header>

      <div className="records-layout">
        <div className="records-main">
          <section className="streak-card card">
            <div className="streak-copy">
              <span className="eyebrow">连续打卡</span>
              <div className="streak-number">
                {state.rewards.streak}
                <small>天</small>
              </div>
              <p>
                最长连续 {state.rewards.bestStreak} 天。每天把计划做完，就会记上一天。
              </p>
            </div>
            <div className="heat-wrap">
              <div className="heat-head">
                <b>过去 12 周</b>
                <span>颜色越深，完成得越多</span>
              </div>
              <div className="heat-legend" aria-hidden="true">
                {WEEKDAY_SHORT.map(day => (
                  <span key={day}>{day}</span>
                ))}
              </div>
              <div className="heat-grid" role="img" aria-label="过去 12 周的打卡热力图">
                {heatDays.map(day => {
                  const log = state.dailyLogs[day];
                  const rate = log && log.planned > 0 ? log.done.length / log.planned : 0;
                  const level = log?.allDone ? 3 : log && log.done.length > 0 ? (rate >= 0.5 ? 2 : 1) : 0;
                  const future = day > today;
                  return (
                    <i
                      key={day}
                      className={`heat-cell l${level} ${future ? 'future' : ''}`}
                      title={`${formatMonthDay(day)} ${weekdayShort(day)}${log ? ` · 完成 ${log.done.length}/${log.planned}` : ' · 没有记录'}`}
                    />
                  );
                })}
              </div>
            </div>
          </section>

          <section className="card records-card">
            <div className="section-title">
              <h2>各科掌握度</h2>
              <span className="section-aside">
                计划内 {totalDone} 项 · {totalMinutes} 分钟
              </span>
            </div>
            <div className="mastery-list">
              {subjectRows.map(row => (
                <div key={row.meta.id} className={`mastery-line ${row.meta.id}`}>
                  <div className="mastery-line-head">
                    <SubjectChip subject={row.meta.id} size="small" />
                    <b>{row.meta.name}</b>
                    <span>
                      已掌握 {row.mastered} / {row.lessons.length} 课
                    </span>
                  </div>
                  <ProgressBar
                    value={row.lessons.length ? (row.mastered / row.lessons.length) * 100 : 0}
                  />
                  <small>学过 {row.learned} 课 · 掌握度达到 3 级即算已掌握</small>
                </div>
              ))}
            </div>
          </section>

          <section className="card records-card">
            <div className="section-title">
              <h2>自由练习</h2>
              <span className="section-aside">记录练习量，不计星星</span>
            </div>
            {freeTotals.sessions === 0 ? (
              <div className="empty-state compact">
                <span className="empty-icon">
                  <Icon name="leaf" size={20} />
                </span>
                <b>还没有自由练习的记录</b>
                <p>在课本页点“自由练习”或“自由听写”，练习量和正确率会留在这里。</p>
              </div>
            ) : (
              <>
                <div className="free-summary">
                  <div>
                    <b>{freeTotals.sessions}</b>
                    <small>次练习</small>
                  </div>
                  <div>
                    <b>{freeTotals.questions}</b>
                    <small>道题</small>
                  </div>
                  <div>
                    <b>{freeRate === null ? '—' : `${freeRate}%`}</b>
                    <small>答对率</small>
                  </div>
                  <div>
                    <b>
                      {freeTotals.dictationTotal
                        ? `${freeTotals.dictationCorrect} / ${freeTotals.dictationTotal}`
                        : '—'}
                    </b>
                    <small>听写写对</small>
                  </div>
                </div>
                <p className="rail-empty">
                  自由练习只记录练习量、错题和听写复习，不增加星星，也不改变掌握度。
                </p>
              </>
            )}
          </section>

          <section className="card records-card">
            <div className="section-title">
              <h2>徽章</h2>
              <span className="section-aside">
                {earnedBadges.size} / {BADGES.length} 枚
              </span>
            </div>
            <div className="records-badges">
              {BADGES.map(badge => {
                const earned = earnedBadges.has(badge.id);
                return (
                  <div key={badge.id} className={`records-badge ${earned ? 'earned' : ''}`}>
                    <span>
                      <Icon name={earned ? 'medal' : 'lock'} size={18} />
                    </span>
                    <b>{badge.name}</b>
                    <small>{badge.hint}</small>
                  </div>
                );
              })}
            </div>
          </section>

          <section className="card records-card">
            <div className="section-title">
              <h2>错题本</h2>
              <span className="section-aside">
                {unresolved.length} 道待复习{resolvedCount > 0 ? ` · ${resolvedCount} 道已订正` : ''}
              </span>
            </div>
            {mistakes.length === 0 ? (
              <div className="empty-state compact">
                <span className="empty-icon">
                  <Icon name="leaf" size={20} />
                </span>
                <b>还没有待复习的错题</b>
                <p>做错的题会自动收进来，订正后会标上“已订正”。</p>
              </div>
            ) : (
              <div className="mistake-list">
                {mistakes.map(({ mistake, lesson, question }) => (
                  <div key={mistake.questionId} className="mistake-row">
                    <SubjectChip subject={lesson.subject} size="small" />
                    <span className="mistake-copy">
                      <b>{question.stem}</b>
                      <small>
                        {lesson.title} · {formatMonthDay(mistake.wrongAt)}做错
                      </small>
                    </span>
                    <div className="mistake-actions">
                      <Link
                        to={`/mistake/${mistake.questionId}`}
                        className="btn btn-soft mistake-retry"
                      >
                        重做
                      </Link>
                      <Link
                        to={`/textbook/${lesson.subject}/${lesson.id}`}
                        className="mistake-lesson"
                        aria-label={`去看${lesson.title}`}
                      >
                        <Icon name="chevron" size={14} />
                      </Link>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </section>
        </div>

        <aside className="records-rail">
          <section className="card report-cta">
            <span className="rail-icon">
              <Icon name="chart" size={19} />
            </span>
            <div>
              <b>家长周报</b>
              <p>完成率、掌握度、听写趋势和薄弱点，都在这里。需要家长 PIN。</p>
              <Link to="/report" className="text-link">
                打开周报 <Icon name="chevron" size={13} />
              </Link>
            </div>
          </section>

          <section className="card records-rail-card">
            <div className="section-title">
              <h2>待复习字词</h2>
              <span className="section-aside">
                {dictationQueue.length} 个 · {dictationDueCount} 个到期
              </span>
            </div>
            {dictationQueue.length === 0 ? (
              <p className="rail-empty">暂时没有排队中的错词。完成听写后，写错的词会出现在这里。</p>
            ) : (
              <>
                <div className="due-word-list">
                  {dictationQueue.slice(0, 8).map(({ entry, word }) => (
                    <span key={word.id} className="due-word">
                      <b>{word.word}</b>
                      <small>{word.pinyin}</small>
                      <small className={entry.dueAt <= today ? 'due-now' : undefined}>
                        {entry.dueAt <= today ? '今天复习' : `${formatMonthDay(entry.dueAt)}复习`}
                      </small>
                    </span>
                  ))}
                </div>
                {dictationDueCount > 0 ? (
                  <Link to="/dictation/review" className="btn btn-soft due-action">
                    <Icon name="speaker" size={14} />
                    复习到期的 {dictationDueCount} 个词
                  </Link>
                ) : (
                  <p className="rail-empty due-note">
                    还没到复习日。到期后，这里会出现“去听写”的按钮。
                  </p>
                )}
              </>
            )}
          </section>

          <section className="card records-rail-card">
            <div className="section-title">
              <h2>累计</h2>
              <span className="section-aside">截至今天</span>
            </div>
            <div className="records-mini-stats">
              <div>
                <b>{state.rewards.stars}</b>
                <small>星星</small>
              </div>
              <div>
                <b>{state.rewards.food}</b>
                <small>桃粮</small>
              </div>
              <div>
                <b>{state.pet.fedDays}</b>
                <small>喂养天数</small>
              </div>
            </div>
            <p className="rail-empty">
              星星和桃粮只增不减。一次没完成，只会影响当天的小桃状态。
            </p>
          </section>
        </aside>
      </div>
    </div>
  );
}
