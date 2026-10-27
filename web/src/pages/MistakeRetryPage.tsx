import { useMemo } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { useApp } from '../app/AppProvider';
import { EmptyState } from '../components/ui';
import { SUBJECT_BY_ID, LESSONS } from '../data/content';
import { PracticeSession } from '../features/practice/PracticeSession';
import { todayKey } from '../core/date';

/** Redo one mistake directly, so the mistake book is not a dead end. */
export function MistakeRetryPage() {
  const { questionId } = useParams();
  const navigate = useNavigate();
  const { dispatchLocal, notify, state } = useApp();
  const found = useMemo(() => {
    // 1) 课本错题：按课内容查找
    for (const lesson of LESSONS) {
      const question = [...lesson.questions, ...(lesson.afterClass ?? [])].find(
        item => item.id === questionId,
      );
      if (question) return { lesson, question };
    }
    // 2) 快照错题（口算等即时生成题）：错题本自带完整题目
    const mistake = state.mistakes.find(
      item => item.questionId === questionId && item.snapshot,
    );
    if (mistake?.snapshot) return { lesson: null, question: mistake.snapshot };
    return null;
  }, [questionId, state.mistakes]);

  if (!found) {
    return (
      <div className="page session-missing">
        <EmptyState title="没有找到这道错题" icon="leaf">
          它可能来自旧版本的课本。回到记录页，看看其它的错题吧。
        </EmptyState>
        <Link to="/records" className="btn btn-soft">
          回到记录
        </Link>
      </div>
    );
  }

  const { lesson, question } = found;
  const subjectName = lesson ? SUBJECT_BY_ID[lesson.subject].name : '口算';
  const title = lesson ? `重做错题 · ${lesson.title}` : '重做错题 · 口算';

  return (
    <PracticeSession
      title={title}
      meta={`${subjectName} · 1 道题 · 自由练习不计星星`}
      questions={[question]}
      backTo="/records"
      backLabel="回到记录"
      mode="free"
      onFinish={outcome => {
        if (lesson) {
          dispatchLocal({
            type: 'free-practice',
            date: todayKey(),
            lesson,
            outcome,
          });
        } else {
          // 快照错题（口算等）重做：只走错题订正与练习计数，不挂到任何课
          dispatchLocal({ type: 'redo-mistake', date: todayKey(), outcome });
        }
        notify(
          outcome.correct === outcome.total
            ? '这道错题重做对了，已经算订正。'
            : '这次还没做对，题目会留在错题本里，过一会儿再来。',
        );
        navigate('/records');
      }}
    />
  );
}
