import { useState, type CSSProperties } from 'react';
import { Link } from 'react-router-dom';
import { useApp } from '../app/AppProvider';
import { Icon } from '../components/Icon';
import { CurrentLessonPicker } from '../components/CurrentLessonPicker';
import { ProgressBar, SubjectChip } from '../components/ui';
import {
  SUBJECTS,
  SUBJECT_BY_ID,
  lessonsForSubject,
  lessonsInUnit,
  unitsFor,
} from '../data/content';
import { lessonPointerFor } from '../core/plan';
import { LESSON_STATUS_LABEL } from '../data/labels';
import type { SubjectId } from '../data/types';

export function TextbookPage() {
  const { state } = useApp();
  const [subject, setSubject] = useState<SubjectId>('chinese');
  const [openUnits, setOpenUnits] = useState<string[]>(() => [unitsFor('chinese')[0]?.id].filter(Boolean));
  const meta = SUBJECT_BY_ID[subject];
  const lessons = lessonsForSubject(subject);
  const units = unitsFor(subject);
  const pointer = lessonPointerFor(state, subject);
  const pointerIndex = lessons.findIndex(lesson => lesson.id === pointer?.id);
  const mastered = lessons.filter(lesson => state.lessons[lesson.id]?.status === 'mastered').length;
  const reviewed = lessons.filter(lesson => {
    const status = state.lessons[lesson.id]?.status;
    return status === 'reviewed' || status === 'mastered';
  }).length;

  const pickSubject = (next: SubjectId) => {
    setSubject(next);
    setOpenUnits([unitsFor(next)[0]?.id].filter(Boolean));
  };

  const toggleUnit = (unitId: string) => {
    setOpenUnits(current =>
      current.includes(unitId) ? current.filter(id => id !== unitId) : [...current, unitId],
    );
  };

  return (
    <div className="page textbook-page">
      <header className="page-head">
        <div>
          <p className="eyebrow">课本 · {SUBJECTS[0]?.edition.replace('统编版 · ', '').replace('人教版 · ', '')}</p>
          <h1>跟着课本，一课一课来。</h1>
          <p className="page-lede">
            先看知识卡，再做几道题。学过的课会按 1 / 3 / 7 天的节奏回来复习。
          </p>
        </div>
      </header>

      <div className="segmented subject-segmented" role="tablist" aria-label="选择科目">
        {SUBJECTS.map(item => (
          <button
            key={item.id}
            type="button"
            role="tab"
            aria-selected={subject === item.id}
            className={subject === item.id ? 'seg active' : 'seg'}
            onClick={() => pickSubject(item.id)}
          >
            {item.name}
          </button>
        ))}
      </div>

      <section className="textbook-hero card" style={{ '--subject-color': meta.color, '--subject-soft': meta.soft } as CSSProperties}>
        <div className="textbook-hero-copy">
          <div className="hero-subject">
            <SubjectChip subject={subject} />
            <span>{meta.edition}</span>
          </div>
          <h2>{pointer ? `当前 · 第 ${pointer.order} 课` : '这一科已经学完啦'}</h2>
          <p>{pointer ? pointer.title : '可以回头自由复习任何一课。'}</p>
          <div className="textbook-progress">
            <div>
              <span>已掌握</span>
              <b>
                {mastered} <small>/ {lessons.length} 课</small>
              </b>
            </div>
            <div>
              <span>学过</span>
              <b>
                {reviewed} <small>/ {lessons.length} 课</small>
              </b>
            </div>
            <div>
              <span>当前进度</span>
              <b>
                {pointerIndex + 1} <small>/ {lessons.length} 课</small>
              </b>
            </div>
          </div>
          <ProgressBar value={lessons.length ? (mastered / lessons.length) * 100 : 0} />
        </div>
        <div className="textbook-hero-actions">
          {pointer && (
            <Link to={`/textbook/${subject}/${pointer.id}`} className="btn btn-primary">
              看当前这一课
              <Icon name="arrow" size={16} />
            </Link>
          )}
          <p>知识点按课本顺序整理，具体字词以孩子的课本为准。</p>
        </div>
      </section>

      <section className="card textbook-pointer-card">
        <CurrentLessonPicker subject={subject} compact />
      </section>

      <div className="unit-list">
        {units.map(unit => {
          const unitLessons = lessonsInUnit(unit.id);
          const isOpen = openUnits.includes(unit.id);
          const unitMastered = unitLessons.filter(lesson => state.lessons[lesson.id]?.status === 'mastered').length;
          return (
            <section key={unit.id} className={`unit-card ${isOpen ? 'open' : ''}`}>
              <button className="unit-head" type="button" onClick={() => toggleUnit(unit.id)} aria-expanded={isOpen}>
                <span className="unit-badge">{unit.order}</span>
                <span className="unit-title">
                  <b>{unit.title}</b>
                  <small>
                    {unitLessons.length} 课 · 已掌握 {unitMastered}
                  </small>
                </span>
                <Icon name="chevron" size={16} className="unit-chevron" />
              </button>
              {isOpen && (
                <div className="lesson-list">
                  {unitLessons.map(lesson => {
                    const progress = state.lessons[lesson.id];
                    const status = progress?.status ?? 'new';
                    const isCurrent = lesson.id === pointer?.id;
                    return (
                      <Link key={lesson.id} to={`/textbook/${subject}/${lesson.id}`} className="lesson-row">
                        <span className="lesson-number">{lesson.order}</span>
                        <span className="lesson-copy">
                          <b>{lesson.title}</b>
                          <small>
                            {lesson.questions.length} 道随堂题
                            {lesson.dictation ? ` · ${lesson.dictation.length} 个听写词` : ''}
                            {lesson.words ? ` · ${lesson.words.length} 个单词` : ''}
                          </small>
                        </span>
                        {isCurrent && <span className="status-pill current">当前</span>}
                        {!isCurrent && status !== 'new' && (
                          <span className={`status-pill ${status}`}>{LESSON_STATUS_LABEL[status]}</span>
                        )}
                        <Icon name="chevron" size={14} className="lesson-chevron" />
                      </Link>
                    );
                  })}
                </div>
              )}
            </section>
          );
        })}
      </div>
    </div>
  );
}
