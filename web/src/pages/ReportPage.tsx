import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useApp } from '../app/AppProvider';
import { Icon } from '../components/Icon';
import { ProgressBar, SubjectChip } from '../components/ui';
import { PinGate } from '../components/PinGate';
import { LESSONS, SUBJECTS, lessonsForSubject } from '../data/content';
import type { DailyLog, FreePracticeLog } from '../core/model';
import type { SubjectId } from '../data/types';
import {
  formatMonthDay,
  formatShort,
  rangeEndingAt,
  todayKey,
} from '../core/date';

function CompletionChart({ days, logs }: { days: string[]; logs: Record<string, DailyLog> }) {
  const width = 740;
  const height = 196;
  const left = 34;
  const right = 14;
  const baseY = 156;
  const plotW = width - left - right;
  const maxHeight = 112;
  const step = plotW / days.length;
  const barWidth = Math.max(4, Math.min(28, step * (days.length > 10 ? 0.55 : 0.48)));
  const labelEvery = days.length > 10 ? 5 : 1;

  return (
    <svg
      className="report-chart"
      viewBox={`0 0 ${width} ${height}`}
      role="img"
      aria-label="每日计划完成率柱状图"
    >
      {[0, 0.5, 1].map(ratio => {
        const y = baseY - maxHeight * ratio;
        return (
          <g key={ratio}>
            <line
              x1={left}
              x2={width - right}
              y1={y}
              y2={y}
              stroke={ratio === 1 ? '#D9D9DE' : '#EFEFF2'}
              strokeDasharray={ratio === 1 ? '4 5' : undefined}
            />
            <text x={4} y={y + 3} fontSize="9" fill="#86868B">
              {Math.round(ratio * 100)}%
            </text>
          </g>
        );
      })}
      {days.map((day, index) => {
        const log = logs[day];
        const rate = log && log.planned > 0 ? Math.min(1, log.done.length / log.planned) : 0;
        const barHeight = rate * maxHeight;
        const x = left + step * index + (step - barWidth) / 2;
        const y = baseY - barHeight;
        return (
          <g key={day}>
            <rect
              x={x}
              y={baseY - 2}
              width={barWidth}
              height={2}
              rx={1}
              fill="#EDEDF0"
            />
            {barHeight > 0 && (
              <rect
                x={x}
                y={y}
                width={barWidth}
                height={barHeight}
                rx={Math.min(4, barWidth / 2)}
                fill="#C1355E"
                fillOpacity={rate >= 1 ? 1 : 0.5}
              >
                <title>
                  {formatMonthDay(day)}：完成 {log?.done.length ?? 0} / {log?.planned ?? 0}
                </title>
              </rect>
            )}
            {(index % labelEvery === 0 || index === days.length - 1) && (
              <text
                x={x + barWidth / 2}
                y={height - 16}
                fontSize={days.length > 10 ? 8 : 9}
                fill="#86868B"
                textAnchor="middle"
              >
                {formatShort(day)}
              </text>
            )}
          </g>
        );
      })}
      <line x1={left} x2={width - right} y1={baseY} y2={baseY} stroke="#D9D9DE" />
    </svg>
  );
}

function DictationChart({
  days,
  logs,
  freeLogs,
}: {
  days: string[];
  logs: Record<string, DailyLog>;
  freeLogs: Record<string, FreePracticeLog>;
}) {
  const width = 740;
  const height = 184;
  const left = 34;
  const right = 14;
  const baseY = 144;
  const plotW = width - left - right;
  const maxHeight = 106;
  const points = days
    .map((day, index) => {
      const log = logs[day];
      const free = freeLogs[day];
      const total = (log?.dictationTotal ?? 0) + (free?.dictationTotal ?? 0);
      const correct = (log?.dictationCorrect ?? 0) + (free?.dictationCorrect ?? 0);
      if (total <= 0) return null;
      const rate = Math.min(1, correct / total);
      return {
        day,
        rate,
        total,
        correct,
        x: left + (days.length > 1 ? (index / (days.length - 1)) * plotW : plotW / 2),
        y: baseY - rate * maxHeight,
      };
    })
    .filter((point): point is NonNullable<typeof point> => Boolean(point));

  if (points.length === 0) {
    return (
      <div className="empty-state compact">
        <span className="empty-icon">
          <Icon name="speaker" size={20} />
        </span>
        <b>这段时间还没有听写记录</b>
        <p>完成一次语文听写后，正确率趋势会出现在这里。</p>
      </div>
    );
  }

  const path = points.map((point, index) => `${index === 0 ? 'M' : 'L'} ${point.x} ${point.y}`).join(' ');

  return (
    <svg
      className="report-chart"
      viewBox={`0 0 ${width} ${height}`}
      role="img"
      aria-label="听写正确率趋势折线图"
    >
      {[0, 0.5, 1].map(ratio => {
        const y = baseY - maxHeight * ratio;
        return (
          <g key={ratio}>
            <line x1={left} x2={width - right} y1={y} y2={y} stroke="#EFEFF2" />
            <text x={4} y={y + 3} fontSize="9" fill="#86868B">
              {Math.round(ratio * 100)}%
            </text>
          </g>
        );
      })}
      {points.length > 1 && (
        <path d={path} fill="none" stroke="#2E7D62" strokeWidth="2.4" strokeLinecap="round" />
      )}
      {points.map(point => (
        <g key={point.day}>
          <circle cx={point.x} cy={point.y} r="3.4" fill="#2E7D62" stroke="#FFFFFF" strokeWidth="1.5">
            <title>
              {formatMonthDay(point.day)}：{Math.round(point.rate * 100)}%（{point.correct}/{point.total}）
            </title>
          </circle>
        </g>
      ))}
      <line x1={left} x2={width - right} y1={baseY} y2={baseY} stroke="#D9D9DE" />
      <text x={left} y={height - 12} fontSize="9" fill="#86868B">
        {formatShort(points[0].day)}
      </text>
      {points.length > 1 && (
        <text x={width - right} y={height - 12} fontSize="9" fill="#86868B" textAnchor="end">
          {formatShort(points[points.length - 1].day)}
        </text>
      )}
    </svg>
  );
}

interface PointInfo {
  text: string;
  lessonId: string;
  subject: SubjectId;
}

const POINT_INFO = new Map<string, PointInfo>();
for (const lesson of LESSONS) {
  for (const point of [...lesson.preview.points, ...lesson.review.points]) {
    POINT_INFO.set(point.id, {
      text: point.text,
      lessonId: lesson.id,
      subject: lesson.subject,
    });
  }
}

export function ReportPage() {
  const { state } = useApp();
  const [range, setRange] = useState<7 | 30>(7);
  const today = todayKey();
  const days = rangeEndingAt(today, range);
  const logs = state.dailyLogs;
  const activeDays = days.filter(day => (logs[day]?.planned ?? 0) > 0);
  const averageRate = activeDays.length
    ? activeDays.reduce((sum, day) => {
        const log = logs[day];
        return sum + (log.planned ? Math.min(1, log.done.length / log.planned) : 0);
      }, 0) / activeDays.length
    : 0;
  const rangeMinutes = days.reduce((sum, day) => sum + (logs[day]?.minutes ?? 0), 0);
  const rangeDone = days.reduce((sum, day) => sum + (logs[day]?.done.length ?? 0), 0);
  const freeLogs = state.freeLogs;
  const freeTotals = days.reduce(
    (sum, day) => {
      const free = freeLogs[day];
      return {
        sessions: sum.sessions + (free?.sessions ?? 0),
        questions: sum.questions + (free?.questions ?? 0),
        correct: sum.correct + (free?.correct ?? 0),
        dictationTotal: sum.dictationTotal + (free?.dictationTotal ?? 0),
        dictationCorrect: sum.dictationCorrect + (free?.dictationCorrect ?? 0),
      };
    },
    { sessions: 0, questions: 0, correct: 0, dictationTotal: 0, dictationCorrect: 0 },
  );
  const freeRate = freeTotals.questions
    ? Math.round((freeTotals.correct / freeTotals.questions) * 100)
    : null;
  const dictationTotal = days.reduce(
    (sum, day) => sum + (logs[day]?.dictationTotal ?? 0) + (freeLogs[day]?.dictationTotal ?? 0),
    0,
  );
  const dictationCorrect = days.reduce(
    (sum, day) => sum + (logs[day]?.dictationCorrect ?? 0) + (freeLogs[day]?.dictationCorrect ?? 0),
    0,
  );
  const dictationRate = dictationTotal ? Math.round((dictationCorrect / dictationTotal) * 100) : null;

  const subjectRows = SUBJECTS.map(meta => {
    const lessons = lessonsForSubject(meta.id);
    const mastered = lessons.filter(lesson => state.lessons[lesson.id]?.status === 'mastered').length;
    return { meta, total: lessons.length, mastered };
  });

  const weakPoints = Object.entries(state.weakness)
    .map(([id, entry]) => ({
      id,
      ...entry,
      score: entry.wrong * 2 - entry.right,
      info: POINT_INFO.get(id),
    }))
    .filter(entry => entry.wrong > 0 && entry.score > 0 && entry.info)
    .sort((a, b) => b.score - a.score)
    .slice(0, 5);

  return (
    <div className="page report-page">
      <header className="page-head">
        <div>
          <p className="eyebrow">家长周报 · 需要 PIN</p>
          <h1>看见一点点进步。</h1>
          <p className="page-lede">
            用完成率、掌握度、听写趋势和薄弱点，看看孩子最近学得怎么样。数据只在本家庭的设备之间同步。
          </p>
        </div>
      </header>

      <PinGate>
        <div className="report-inner">
          <div className="report-toolbar">
            <div className="segmented" role="tablist" aria-label="选择统计范围">
              {[7, 30].map(option => (
                <button
                  key={option}
                  type="button"
                  role="tab"
                  aria-selected={range === option}
                  className={range === option ? 'seg active' : 'seg'}
                  onClick={() => setRange(option as 7 | 30)}
                >
                  近 {option} 天
                </button>
              ))}
            </div>
            <span className="report-range-note">
              {formatMonthDay(days[0])} — {formatMonthDay(today)}
            </span>
          </div>

          <section className="report-summary card">
            <div>
              <small>计划完成率</small>
              <b>{Math.round(averageRate * 100)}<span>%</span></b>
              <p>{activeDays.length} 天有计划 · 完成 {rangeDone} 项</p>
            </div>
            <div>
              <small>学习分钟</small>
              <b>{rangeMinutes}<span> 分</span></b>
              <p>计划内预估；自由练习另计 {freeTotals.questions} 道题</p>
            </div>
            <div>
              <small>听写正确率</small>
              <b>{dictationRate === null ? '—' : dictationRate}<span>{dictationRate === null ? '' : '%'}</span></b>
              <p>{dictationTotal ? `${dictationCorrect} / ${dictationTotal} 个词，含自由听写` : '这段时间没有听写'}</p>
            </div>
            <div>
              <small>连续打卡</small>
              <b>{state.rewards.streak}<span> 天</span></b>
              <p>累计星星 {state.rewards.stars} 颗</p>
            </div>
          </section>

          <div className="report-grid">
            <section className="report-card card wide">
              <div className="section-title">
                <h2>每日计划完成率</h2>
                <span className="section-aside">深色柱为全部完成</span>
              </div>
              <CompletionChart days={days} logs={logs} />
            </section>

            <section className="report-card card">
              <div className="section-title">
                <h2>各科掌握度</h2>
                <span className="section-aside">已掌握 / 总课数</span>
              </div>
              <div className="mastery-list report-mastery">
                {subjectRows.map(row => (
                  <div key={row.meta.id} className={`mastery-line ${row.meta.id}`}>
                    <div className="mastery-line-head">
                      <SubjectChip subject={row.meta.id} size="small" />
                      <b>{row.meta.name}</b>
                      <span>{row.mastered} / {row.total} 课</span>
                    </div>
                    <ProgressBar
                      value={row.total ? (row.mastered / row.total) * 100 : 0}
                    />
                  </div>
                ))}
              </div>
            </section>

            <section className="report-card card">
              <div className="section-title">
                <h2>听写正确率趋势</h2>
                <span className="section-aside">计划与自由听写合计</span>
              </div>
              <DictationChart days={days} logs={logs} freeLogs={freeLogs} />
            </section>

            <section className="report-card card wide">
              <div className="section-title">
                <h2>自由练习</h2>
                <span className="section-aside">记录练习量，不计星星</span>
              </div>
              {freeTotals.sessions === 0 ? (
                <div className="empty-state compact">
                  <span className="empty-icon">
                    <Icon name="leaf" size={20} />
                  </span>
                  <b>这段时间还没有自由练习</b>
                  <p>课本页的自由练习、错题重做和到期错词听写，都会汇总在这里。</p>
                </div>
              ) : (
                <>
                  <div className="report-free-stats">
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
                      <small>自由听写写对</small>
                    </div>
                  </div>
                  <p className="report-free-note">
                    自由练习不增加星星，也不改变掌握度；但错题、错词和薄弱点会照常计入。
                  </p>
                </>
              )}
            </section>

            <section className="report-card card wide">
              <div className="section-title">
                <h2>薄弱点 Top 5</h2>
                <span className="section-aside">来自错题与知识点统计</span>
              </div>
              {weakPoints.length === 0 ? (
                <div className="empty-state compact">
                  <span className="empty-icon">
                    <Icon name="leaf" size={20} />
                  </span>
                  <b>暂时没有明显的薄弱点</b>
                  <p>继续完成练习，答错的知识点会在这里排出来。</p>
                </div>
              ) : (
                <div className="weak-list">
                  {weakPoints.map((entry, index) => {
                    const info = entry.info as PointInfo;
                    return (
                      <div key={entry.id} className="weak-row">
                        <span className="weak-rank">{index + 1}</span>
                        <div className="weak-copy">
                          <b>{info.text}</b>
                          <small>
                            答错 {entry.wrong} 次 · 答对 {entry.right} 次
                          </small>
                        </div>
                        <Link
                          to={`/textbook/${info.subject}/${info.lessonId}`}
                          className="text-link"
                        >
                          去看这一课
                          <Icon name="chevron" size={12} />
                        </Link>
                      </div>
                    );
                  })}
                </div>
              )}
            </section>
          </div>

          <p className="report-note">
            报告根据孩子在本站的练习记录生成，不包含任何真实姓名、学校、位置或设备信息。
            如需备份，可在家长设置中导出 JSON。
          </p>
        </div>
      </PinGate>
    </div>
  );
}
