import type { CSSProperties, ReactNode } from 'react';
import { SUBJECT_BY_ID } from '../data/content';
import type { SubjectId } from '../data/types';
import { useApp } from '../app/AppProvider';
import { Icon } from './Icon';

export function ProgressBar({
  value,
  className = '',
  style,
}: {
  value: number;
  className?: string;
  style?: CSSProperties;
}) {
  const clamped = Math.max(0, Math.min(100, Math.round(value)));
  return (
    <div
      className={`progress ${className}`}
      role="progressbar"
      aria-valuemin={0}
      aria-valuemax={100}
      aria-valuenow={clamped}
      style={style}
    >
      <i style={{ width: `${clamped}%` }} />
    </div>
  );
}

export function SyncBadge({ compact = false }: { compact?: boolean }) {
  const { syncStatus, syncError } = useApp();
  const label =
    syncStatus === 'synced'
      ? '已同步'
      : syncStatus === 'syncing'
        ? '同步中'
        : syncStatus === 'conflict'
          ? '待处理'
          : syncStatus === 'logged_out'
            ? '未登录'
            : syncStatus === 'offline'
              ? syncError === 'login_required'
                ? '需登录'
                : '离线'
              : '待同步';
  return (
    <span className={`sync-badge ${syncStatus}`} title={`云端同步：${label}`}>
      <i aria-hidden="true" />
      {compact ? null : <span>{label}</span>}
    </span>
  );
}

export function SubjectChip({
  subject,
  active = false,
  size = 'normal',
}: {
  subject: SubjectId;
  active?: boolean;
  size?: 'small' | 'normal';
}) {
  const meta = SUBJECT_BY_ID[subject];
  return (
    <span
      className={`subject-chip ${size} ${active ? 'active' : ''}`}
      style={{ '--subject-color': meta.color, '--subject-soft': meta.soft } as CSSProperties}
    >
      {meta.short}
    </span>
  );
}

export function SubjectName({ subject }: { subject: SubjectId }) {
  return <span style={{ color: SUBJECT_BY_ID[subject].color }}>{SUBJECT_BY_ID[subject].name}</span>;
}

export function SectionTitle({
  title,
  aside,
  id,
}: {
  title: string;
  aside?: ReactNode;
  id?: string;
}) {
  return (
    <div className="section-title" id={id}>
      <h2>{title}</h2>
      {aside ? <div className="section-aside">{aside}</div> : null}
    </div>
  );
}

export function PinInput({
  value,
  onChange,
  onSubmit,
  disabled,
  autoFocus,
  label,
  error,
}: {
  value: string;
  onChange: (value: string) => void;
  onSubmit?: () => void;
  disabled?: boolean;
  autoFocus?: boolean;
  label: string;
  error?: string;
}) {
  return (
    <label className={`pin-input ${error ? 'has-error' : ''}`}>
      <span>{label}</span>
      <input
        className="pin-real"
        type="password"
        inputMode="numeric"
        autoComplete="off"
        pattern="[0-9]*"
        maxLength={4}
        value={value}
        disabled={disabled}
        autoFocus={autoFocus}
        aria-label={label}
        aria-invalid={Boolean(error)}
        onChange={event => onChange(event.target.value.replace(/\D/g, '').slice(0, 4))}
        onKeyDown={event => {
          if (event.key === 'Enter' && onSubmit) onSubmit();
        }}
      />
      {error ? <small className="field-error">{error}</small> : null}
    </label>
  );
}

export function EmptyState({
  title,
  children,
  icon = 'leaf',
}: {
  title: string;
  children?: ReactNode;
  icon?: 'leaf' | 'book' | 'star' | 'sparkle';
}) {
  return (
    <div className="empty-state">
      <span className="empty-icon">
        <Icon name={icon} size={22} />
      </span>
      <b>{title}</b>
      {children ? <p>{children}</p> : null}
    </div>
  );
}

export function Toast() {
  const { notice } = useApp();
  if (!notice) return null;
  return (
    <div className="toast" role="status" key={notice.id}>
      <Icon name="sparkle" size={16} />
      <span>{notice.text}</span>
    </div>
  );
}
