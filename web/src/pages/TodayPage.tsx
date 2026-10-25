import { useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useApp } from '../app/AppProvider';
import { Icon, type IconName } from '../components/Icon';
import { Mascot } from '../components/Mascot';
import { ProgressBar, ProgressRing, SubjectChip } from '../components/ui';
import { TASK_KIND_LABEL } from '../data/labels';
import type { PlanTask, TaskKind } from '../data/types';
import { formatMonthDayWeek, greeting, todayKey } from '../core/date';
import { petMood, moodLine, nextStage, stageInfo } from '../core/pet';
import { lessonPointerFor } from '../core/plan';

const KIND_ICON: Record<TaskKind, IconName> = {
  review: 'book',
  preview: 'leaf',
  practice: 'pen',
  dictation: 'speaker',
  oral: 'plus',
  words: 'book',
  weak: 'sparkle',
};

function TaskRow({ task, done }: { task: PlanTask; done: boolean }) {
  const content = (
    <>
      <span className={`task-icon t-${task.subject}`}>
        <Icon name={KIND_ICON[task.kind]} size={18} />
      </span>
      <span className="task-copy">
        <b>{task.title}</b>
        <small>
          <SubjectChip subject={task.subject} size="small" /> {TASK_KIND_LABEL[task.kind]} · {task.subtitle}
        </small>
      </span>
      <span className="task-minutes">
        <Icon name="clock" size={11} /> {task.minutes} 分钟
      </span>
      <span className={`task-action ${done ? 'done' : ''}`}>
        {done ? <Icon name="check" size={16} /> : <Icon name="chevron" size={16} />}
      </span>
    </>
  );

  if (done) {
    return <div className="task-row done">{content}</div>;
  }
  return (
    <Link to={`/task/${task.id}`} className="task-row">
      {content}
    </Link>
  );
}

export function TodayPage() {
  const { state, dispatchLocal } = useApp();
  const date = todayKey();
  const plan = state.dailyPlans[date];
  const tasks = plan?.tasks ?? [];
  const log = state.dailyLogs[date];
  const doneIds = new Set(log?.done ?? []);
  const done = tasks.filter(task => doneIds.has(task.id));
  const remainingTasks = tasks.filter(task => !doneIds.has(task.id));
  const percent = tasks.length ? (done.length / tasks.length) * 100 : 0;
  const remainingMinutes = remainingTasks.reduce((sum, task) => sum + task.minutes, 0);
  const hour = new Date().getHours();
  const mood = petMood(state, date, hour);
  const stage = stageInfo(state.pet.stage);
  const next = nextStage(state.pet.stage);
  const deadlinePassed = hour >= state.settings.deadlineHour;
  const allDone = tasks.length > 0 && done.length >= tasks.length;
  const foodEarnedToday = log?.food ?? 0;
  const englishLesson = lessonPointerFor(state, 'english');

  useEffect(() => {
    if (!plan && state.onboarded) {
      dispatchLocal({ type: 'ensure-plan', date });
    }
  }, [plan, state.onboarded, dispatchLocal, date]);

  return (
    <div className="page today-page">
      <header className="page-head today-head">
        <h1>今天</h1>
        <span className="today-avatar" aria-hidden="true">
          <Mascot mood={mood} equipped={state.pet.equipped} size={44} />
        </span>
      </header>
      <div className="today-chips">
        <span className="chip">
          <Icon name="calendar" size={13} /> 今天 · {formatMonthDayWeek(date)}
        </span>
      </div>

      <section className="today-hero card">
        <ProgressRing value={done.length} total={tasks.length} />
        <div className="today-hero-copy">
          <h2>
            {greeting()}，{state.profile.nickname}。
          </h2>
          <p className="hero-lede">
            {allDone
              ? '今天的计划已经做完了。剩下的时间，去和小桃玩一会儿吧。'
              : tasks.length
                ? `今天有 ${remainingTasks.length} 件小事，做完就能攒桃粮。不用赶，按自己的节奏来。`
                : '今天还没有安排，先去看看课本，或到设置里调整课表。'}
          </p>
          <div className="hero-meta">
            <span>{Math.round(percent)}% 完成</span>
            <span>{remainingMinutes ? `还剩约 ${remainingMinutes} 分钟` : '今天的份额已完成'}</span>
            <span>今天 +{foodEarnedToday} 桃粮</span>
            <span>截止 {state.settings.deadlineHour}:00</span>
          </div>
        </div>
      </section>

      <div className="stat-strip">
        <div className="stat stat-flame">
          <span className="stat-icon">
            <Icon name="flame" size={20} />
          </span>
          <span className="stat-body">
            <b>{state.rewards.streak}</b>
            <small>连续打卡</small>
          </span>
        </div>
        <div className="stat stat-star">
          <span className="stat-icon">
            <Icon name="star" size={20} />
          </span>
          <span className="stat-body">
            <b>{state.rewards.stars}</b>
            <small>累计星星</small>
          </span>
        </div>
        <div className="stat stat-food">
          <span className="stat-icon">
            <Icon name="food" size={20} />
          </span>
          <span className="stat-body">
            <b>{state.rewards.food}</b>
            <small>桃粮</small>
          </span>
        </div>
        <div className="stat stat-heart">
          <span className="stat-icon">
            <Icon name="heart" size={20} />
          </span>
          <span className="stat-body">
            <b>{state.pet.fedDays}</b>
            <small>喂养天数</small>
          </span>
        </div>
      </div>

      <div className="today-layout">
        <section className="today-tasks">
          <div className="section-title">
            <h2>今日计划</h2>
            <div className="section-aside">
              <span>截止 {state.settings.deadlineHour}:00</span>
            </div>
          </div>

          {tasks.length === 0 ? (
            <div className="card empty-plan">
              <Mascot mood="normal" size={80} />
              <div>
                <b>今天暂时没有生成任务</b>
                <p>如果刚打开应用，稍等片刻；也可以到课本页自己选一课来练。</p>
              </div>
              <Link to="/textbook" className="btn btn-soft">
                去课本看看
              </Link>
            </div>
          ) : (
            <div className="task-list">
              {tasks.map(task => (
                <TaskRow key={task.id} task={task} done={doneIds.has(task.id)} />
              ))}
            </div>
          )}

          {allDone && (
            <div className="done-banner card">
              <span className="done-gift">
                <Icon name="food" size={22} />
              </span>
              <div>
                <b>今天的计划全部完成</b>
                <p>一份大餐已经放进小桃的饭碗，连续打卡也记上了。去喂它吧。</p>
              </div>
              <Link to="/pet" className="btn btn-primary">
                去喂小桃
              </Link>
            </div>
          )}

          {!allDone && deadlinePassed && tasks.length > 0 && (
            <div className="gentle-note">
              <Icon name="leaf" size={15} />
              <span>今天的时间有点晚啦。没做完也不会扣星星或饰品，明天我们再早一点。</span>
            </div>
          )}

          <div className="plan-note">
            <Icon name="sparkle" size={15} />
            <span>
              每个任务完成可得 1 颗星、1 份桃粮；全部答对再多 1 份桃粮。奖励只和努力有关。
            </span>
          </div>
        </section>

        <aside className="today-rail">
          <section className="card pet-mini">
            <div className="pet-mini-head">
              <div>
                <span className="eyebrow">小桃今天</span>
                <h2>{stage.name}</h2>
              </div>
              <Mascot mood={mood} equipped={state.pet.equipped} size={64} />
            </div>
            <p className="pet-line">{moodLine(mood, state.profile.nickname)}</p>
            <div className="satiety-row">
              <span>
                <Icon name="food" size={14} /> 饱食度
              </span>
              <b>{state.pet.satiety} / 100</b>
            </div>
            <ProgressBar value={state.pet.satiety} className="satiety-bar" />
            <div className="pet-mini-foot">
              <span>{next ? `距离${next.name}还差 ${Math.max(0, next.minDays - state.pet.fedDays)} 天` : '已经长成大桃啦'}</span>
              <Link to="/pet" className="text-link">
                去陪小桃 <Icon name="chevron" size={13} />
              </Link>
            </div>
          </section>

          <section className="card rail-card">
            <span className="rail-icon">
              <Icon name="chart" size={18} />
            </span>
            <div>
              <b>看见一点点进步</b>
              <p>掌握度、听写正确率和薄弱点，都在家长周报里。</p>
              <Link to="/report" className="text-link">
                打开家长周报 <Icon name="chevron" size={13} />
              </Link>
            </div>
          </section>

          {englishLesson?.words?.length ? (
            <section className="card rail-card">
              <span className="rail-icon">
                <Icon name="book" size={18} />
              </span>
              <div>
                <b>今日英语小练习</b>
                <p>
                  第 {englishLesson.order} 课 · {englishLesson.words.length} 个单词。
                  就算今天课表没有英语，也能读几个词、排一句短句。
                </p>
                <Link to={`/lesson/${englishLesson.id}/words`} className="text-link">
                  去练一练 <Icon name="chevron" size={13} />
                </Link>
              </div>
            </section>
          ) : null}

          <section className="card rail-card quiet">
            <span className="rail-icon">
              <Icon name="clock" size={18} />
            </span>
            <div>
              <b>今天的小约定</b>
              <p>
                计划约 {tasks.reduce((sum, task) => sum + task.minutes, 0)} 分钟，截止 {state.settings.deadlineHour}:00。
                没完成只会让小桃饿肚子，不会没收已经得到的奖励。
              </p>
            </div>
          </section>

          {state.dailyLogs[date]?.allDone && (
            <div className="rail-streak">
              <Icon name="flame" size={16} />
              <span>连续 {state.rewards.streak} 天，今天也守住了。</span>
            </div>
          )}
        </aside>
      </div>
    </div>
  );
}
