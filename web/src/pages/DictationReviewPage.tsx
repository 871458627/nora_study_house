import { Link, useNavigate } from 'react-router-dom';
import { useApp } from '../app/AppProvider';
import { EmptyState } from '../components/ui';
import { DictationSession } from '../features/dictation/DictationSession';
import type { TaskOutcome } from '../core/model';
import { dictationWordById } from '../data/content';
import { todayKey } from '../core/date';

const REVIEW_LIMIT = 16;

/** A single dictation session made of every word whose review date has arrived. */
export function DictationReviewPage() {
  const navigate = useNavigate();
  const { state, dispatchLocal, notify } = useApp();
  const today = todayKey();
  const dueEntries = Object.values(state.dictationQueue)
    .filter(entry => entry.dueAt <= today)
    .sort((a, b) => a.dueAt.localeCompare(b.dueAt))
    .slice(0, REVIEW_LIMIT);
  const words = dueEntries
    .map(entry => dictationWordById(entry.wordId))
    .filter((word): word is NonNullable<typeof word> => Boolean(word));

  if (!words.length) {
    return (
      <div className="page session-missing">
        <EmptyState title="今天没有到期的错词" icon="leaf">
          听写里写错的词会按时间回到这里。先去完成今天的计划吧。
        </EmptyState>
        <Link to="/records" className="btn btn-soft">
          回到记录
        </Link>
      </div>
    );
  }

  const finish = (outcome: TaskOutcome) => {
    dispatchLocal({
      type: 'review-dictation',
      date: today,
      words: outcome.dictation ?? [],
    });
    notify('这次复习听写已经记下。写对的词会晚一点再来，写错的明天再见。');
    navigate('/records');
  };

  return (
    <DictationSession
      words={words}
      title="到期错词听写"
      meta={`语文 · 自由复习 · ${words.length} 个词${dueEntries.length === REVIEW_LIMIT ? `（先复习最近 ${REVIEW_LIMIT} 个）` : ''}`}
      backTo="/records"
      backLabel="回到记录"
      mode="free"
      preferredMode={state.settings.dictationMode}
      autoSpeak={state.settings.ttsEnabled}
      onFinish={finish}
    />
  );
}
