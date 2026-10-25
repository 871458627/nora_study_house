import { useEffect, useState } from 'react';
import { useApp } from '../app/AppProvider';
import { Icon } from './Icon';
import { SUBJECT_BY_ID, lessonsForSubject } from '../data/content';
import type { SubjectId } from '../data/types';

export function CurrentLessonPicker({
  subject,
  compact = false,
}: {
  subject: SubjectId;
  compact?: boolean;
}) {
  const { state, dispatchLocal, notify } = useApp();
  const lessons = lessonsForSubject(subject);
  const meta = SUBJECT_BY_ID[subject];
  const stored = Math.min(lessons.length - 1, Math.max(0, state.pointers[subject] ?? 0));
  const [index, setIndex] = useState(stored);

  useEffect(() => {
    setIndex(stored);
  }, [stored, subject]);

  const selected = lessons[index];
  const changed = index !== stored;

  const save = () => {
    if (!selected || !changed) return;
    dispatchLocal({ type: 'set-pointer', subject, index });
    notify(`${meta.name}当前课已设为第 ${selected.order} 课，明天从新位置生成计划。`);
  };

  return (
    <div className={`current-lesson-picker ${compact ? 'compact' : ''}`}>
      <div className="current-lesson-copy">
        <span>{compact ? `${meta.name} · 课本位置` : `${meta.name}现在学到`}</span>
        <b>
          第 {selected?.order} 课 · {selected?.title}
        </b>
        <small>已完成的记录不会清除；今天的计划不变，明天从新位置继续。</small>
      </div>
      <div className="current-lesson-controls">
        <label className="select-field">
          <span className="sr-only">选择{meta.name}当前课</span>
          <select
            value={index}
            onChange={event => setIndex(Number(event.target.value))}
          >
            {lessons.map((lesson, lessonIndex) => (
              <option key={lesson.id} value={lessonIndex}>
                第 {lesson.order} 课 · {lesson.title}
              </option>
            ))}
          </select>
        </label>
        <button
          type="button"
          className="btn btn-soft"
          disabled={!changed}
          onClick={save}
        >
          <Icon name="check" size={15} />
          设为当前课
        </button>
      </div>
    </div>
  );
}
