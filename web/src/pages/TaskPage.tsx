import { Link, useNavigate, useParams } from 'react-router-dom';
import { useApp } from '../app/AppProvider';
import { EmptyState } from '../components/ui';
import { Icon } from '../components/Icon';
import { SUBJECT_BY_ID, lessonById } from '../data/content';
import { TASK_KIND_LABEL } from '../data/labels';
import type { PlanTask } from '../data/types';
import type { TaskOutcome } from '../core/model';
import { todayKey } from '../core/date';
import { questionsForTask, taskById, wordIdsForTask } from '../core/plan';
import { PracticeSession } from '../features/practice/PracticeSession';
import { DictationSession } from '../features/dictation/DictationSession';
import { WordsSession } from '../features/words/WordsSession';

export function TaskPage({ mode }: { mode: 'task' | 'practice' | 'dictation' | 'words' }) {
  const { taskId, lessonId } = useParams();
  const navigate = useNavigate();
  const { state, dispatchLocal, notify } = useApp();
  const date = todayKey();
  const task: PlanTask | undefined =
    mode === 'task' && taskId ? taskById(state, date, taskId) : undefined;
  const lesson = lessonById(mode === 'task' ? task?.lessonId ?? '' : lessonId ?? '');
  const log = state.dailyLogs[date];
  const done = Boolean(task && log?.done.includes(task.id));

  if (mode === 'task' && !task) {
    return (
      <div className="page session-missing">
        <EmptyState title="没有找到这项任务" icon="leaf">
          它可能属于另一天的计划。回到今天，看看现在的安排吧。
        </EmptyState>
        <Link to="/" className="btn btn-soft">
          回到今天
        </Link>
      </div>
    );
  }

  if (mode !== 'task' && !lesson) {
    return (
      <div className="page session-missing">
        <EmptyState title="没有找到这一课" icon="book">
          回到课本页，重新选一课吧。
        </EmptyState>
        <Link to="/textbook" className="btn btn-soft">
          回到课本
        </Link>
      </div>
    );
  }

  const backTo =
    mode === 'task' ? '/' : lesson ? `/textbook/${lesson.subject}/${lesson.id}` : '/textbook';
  const backLabel = mode === 'task' ? '回到今天' : '回到这一课';

  if (done && task) {
    const retryTo =
      task.kind === 'dictation' && lesson
        ? `/lesson/${lesson.id}/dictation`
        : task.kind !== 'oral' && task.kind !== 'weak' && lesson
          ? `/lesson/${lesson.id}/practice`
          : null;
    return (
      <div className="page session-missing">
        <div className="card done-card">
          <span className="done-gift">
            <Icon name="check" size={22} />
          </span>
          <p className="eyebrow">今天已经完成</p>
          <h1>{task.title}</h1>
          <p>这一项已经计入今天的计划和奖励。剩下的小事做完，小桃就能吃大餐了。</p>
          <div className="done-card-actions">
            <Link to="/" className="btn btn-primary">
              回到今天
              <Icon name="arrow" size={16} />
            </Link>
            {retryTo && (
              <Link to={retryTo} className="btn btn-soft">
                再自由练一次
              </Link>
            )}
          </div>
        </div>
      </div>
    );
  }

  const finishTask = (outcome: TaskOutcome) => {
    if (!task) return;
    const plan = state.dailyPlans[date];
    const total = plan?.tasks.length ?? 0;
    const doneCount = log?.done.length ?? 0;
    const willAllDone = !log?.allDone && total > 0 && doneCount + 1 >= total;
    const perfect = outcome.total > 0 && outcome.correct === outcome.total;
    dispatchLocal({ type: 'complete-task', date, taskId: task.id, outcome });
    notify(
      willAllDone
        ? '今天的计划全部完成，大餐已经放进小桃的饭碗。'
        : `完成一项计划，+1 颗星 +1 份桃粮${perfect ? '，全对再 +1 份' : ''}。`,
    );
    navigate('/');
  };

  const finishFree = (outcome: TaskOutcome) => {
    if (!lesson) return;
    dispatchLocal({ type: 'free-practice', date, lesson, outcome });
    notify(
      mode === 'dictation'
        ? '这次听写已记录，错词会按时间回来复习。'
        : mode === 'words'
          ? '这次单词和短句练习已记录，错题会留在记录页。'
          : '这次练习已记录，错题和薄弱点都记下了。',
    );
    navigate(`/textbook/${lesson.subject}/${lesson.id}`);
  };

  if (mode === 'words' && lesson) {
    return (
      <WordsSession
        lesson={lesson}
        words={lesson.words ?? []}
        title={`第 ${lesson.order} 课 · 单词与短句`}
        meta={`英语 · 自由练习 · ${lesson.words?.length ?? 0} 个词`}
        backTo={backTo}
        backLabel={backLabel}
        mode="free"
        onFinish={finishFree}
      />
    );
  }

  if (mode === 'dictation' && lesson) {
    return (
      <DictationSession
        words={lesson.dictation ?? []}
        title={`第 ${lesson.order} 课 · 生字听写`}
        meta={`${SUBJECT_BY_ID[lesson.subject].name} · 自由听写`}
        backTo={backTo}
        backLabel={backLabel}
        mode="free"
        preferredMode={state.settings.dictationMode}
        autoSpeak={state.settings.ttsEnabled}
        onFinish={finishFree}
      />
    );
  }

  if (task?.kind === 'dictation') {
    return (
      <DictationSession
        words={wordIdsForTask(task)}
        title={task.title}
        meta={`${SUBJECT_BY_ID[task.subject].name} · ${TASK_KIND_LABEL[task.kind]} · 约 ${task.minutes} 分钟`}
        backTo={backTo}
        backLabel={backLabel}
        mode="task"
        preferredMode={state.settings.dictationMode}
        autoSpeak={state.settings.ttsEnabled}
        onFinish={finishTask}
      />
    );
  }

  if (task?.kind === 'words' && lesson) {
    return (
      <WordsSession
        lesson={lesson}
        words={lesson.words ?? []}
        title={task.title}
        meta={`${SUBJECT_BY_ID[task.subject].name} · 单词卡 · 约 ${task.minutes} 分钟`}
        backTo={backTo}
        backLabel={backLabel}
        mode="task"
        onFinish={finishTask}
      />
    );
  }

  if (task) {
    const questions = questionsForTask(task);
    return (
      <PracticeSession
        title={task.title}
        meta={`${SUBJECT_BY_ID[task.subject].name} · ${TASK_KIND_LABEL[task.kind]} · 约 ${task.minutes} 分钟`}
        questions={questions}
        backTo={backTo}
        backLabel={backLabel}
        mode="task"
        onFinish={finishTask}
      />
    );
  }

  if (!lesson) return null;
  const freeQuestions = [...lesson.questions, ...(lesson.afterClass ?? [])];

  return (
    <PracticeSession
      title={`第 ${lesson.order} 课 · ${lesson.title}`}
      meta={`${SUBJECT_BY_ID[lesson.subject].name} · 自由练习 · ${freeQuestions.length} 道题`}
      questions={freeQuestions}
      backTo={backTo}
      backLabel={backLabel}
      mode="free"
      onFinish={finishFree}
    />
  );
}
