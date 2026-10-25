import { useEffect, useRef, useState } from 'react';
import { useApp } from './AppProvider';
import { Mascot } from '../components/Mascot';
import { Icon } from '../components/Icon';
import type { SyncState } from '../core/model';

function summary(state: SyncState): string {
  const done = Object.values(state.dailyLogs).reduce((total, log) => total + log.done.length, 0);
  return `${done} 项完成 · ${state.rewards.stars} 颗星 · ${state.rewards.food} 份桃粮`;
}

function doneCount(state: SyncState): number {
  return Object.values(state.dailyLogs).reduce((total, log) => total + log.done.length, 0);
}

function when(value?: string): string {
  if (!value) return '时间未知';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '时间未知';
  return date.toLocaleString('zh-CN', {
    month: 'numeric',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

const FOCUSABLE =
  'button:not([disabled]), [href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])';

export function ConflictDialog() {
  const { conflict, conflictOpen, deferConflict, resolveConflict } = useApp();
  const [busy, setBusy] = useState(false);
  const [confirmingCloud, setConfirmingCloud] = useState(false);
  const panelRef = useRef<HTMLDivElement | null>(null);
  const primaryRef = useRef<HTMLButtonElement | null>(null);
  const cloudCancelRef = useRef<HTMLButtonElement | null>(null);

  useEffect(() => {
    if (!conflict) setConfirmingCloud(false);
  }, [conflict]);

  useEffect(() => {
    if (!conflictOpen) return;
    const previous = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    const target = confirmingCloud ? cloudCancelRef.current : primaryRef.current;
    const focusTimer = window.setTimeout(() => target?.focus(), 0);

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        event.preventDefault();
        deferConflict();
        return;
      }
      if (event.key !== 'Tab' || !panelRef.current) return;
      const nodes = Array.from(panelRef.current.querySelectorAll<HTMLElement>(FOCUSABLE));
      if (nodes.length === 0) return;
      const first = nodes[0];
      const last = nodes[nodes.length - 1];
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    };

    document.addEventListener('keydown', onKeyDown);
    return () => {
      document.body.style.overflow = previous;
      window.clearTimeout(focusTimer);
      document.removeEventListener('keydown', onKeyDown);
    };
  }, [conflictOpen, confirmingCloud, deferConflict]);

  if (!conflict || !conflictOpen) return null;

  const choose = async (choice: 'cloud' | 'local') => {
    setBusy(true);
    try {
      await resolveConflict(choice);
    } finally {
      setBusy(false);
      setConfirmingCloud(false);
    }
  };

  const localDone = doneCount(conflict.local);

  return (
    <div
      className="modal-backdrop"
      role="presentation"
      onClick={event => {
        if (event.target === event.currentTarget && !busy) deferConflict();
      }}
    >
      <div
        className="modal conflict-modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby="conflict-title"
        aria-describedby="conflict-lede"
        ref={panelRef}
      >
        <button
          type="button"
          className="modal-close"
          aria-label="稍后处理，先留在本机"
          disabled={busy}
          onClick={deferConflict}
        >
          <Icon name="close" size={17} />
        </button>
        <div className="modal-mascot">
          <Mascot mood="normal" size={72} />
        </div>
        <span className="eyebrow">两台设备都改了</span>
        <h2 id="conflict-title">
          {localDone > 0 ? `这台平板还有 ${localDone} 项没传上去` : '这台平板有一份新记录'}
        </h2>
        <p className="modal-lede" id="conflict-lede">
          另一台设备也更新了。小桃不会自己把两份混在一起，请选一份留下。
        </p>

        <div className="compare-grid">
          <div className="compare-card current">
            <span>这台平板</span>
            <b>{summary(conflict.local)}</b>
            <small>{when(conflict.local.updatedAt)} · 还没传上去</small>
          </div>
          <div className="compare-card">
            <span>另一台设备</span>
            <b>{summary(conflict.remote.data ?? conflict.local)}</b>
            <small>{when(conflict.remote.updatedAt)} · 已在云端</small>
          </div>
        </div>

        {confirmingCloud ? (
          <div className="modal-actions">
            <div className="modal-warning" role="alert">
              换用另一台设备的记录后，这台平板上还没传上去的 {localDone} 项会消失。
            </div>
            <button
              className="btn btn-primary full"
              type="button"
              disabled={busy}
              onClick={() => void choose('cloud')}
            >
              确定换用另一份
            </button>
            <button
              className="btn btn-ghost full"
              type="button"
              disabled={busy}
              ref={cloudCancelRef}
              onClick={() => setConfirmingCloud(false)}
            >
              再想想，保留这台
            </button>
          </div>
        ) : (
          <div className="modal-actions">
            <button
              className="btn btn-primary full"
              type="button"
              disabled={busy}
              ref={primaryRef}
              onClick={() => void choose('local')}
            >
              <Icon name="check" size={16} />
              保留这台平板的记录
            </button>
            <button
              className="btn btn-soft full"
              type="button"
              disabled={busy}
              onClick={() => setConfirmingCloud(true)}
            >
              <Icon name="download" size={16} />
              改用另一台设备的记录
            </button>
            <button
              className="btn btn-ghost full"
              type="button"
              disabled={busy}
              onClick={deferConflict}
            >
              稍后处理，先留在本机
            </button>
          </div>
        )}

        <p className="pin-note">
          选好后，另一份记录会被替换。稍后处理不会丢记录，本机改动会继续保留，同步暂停。
        </p>
      </div>
    </div>
  );
}

export function PendingConflictBanner() {
  const { conflict, conflictOpen, openConflict } = useApp();
  if (!conflict || conflictOpen) return null;
  const localDone = doneCount(conflict.local);
  return (
    <div className="pending-conflict" role="status">
      <span className="pending-conflict-icon">
        <Icon name="alert" size={15} />
      </span>
      <span>
        有一份记录等你选择，本机{localDone > 0 ? ` ${localDone} 项` : '改动'}已安全保留。
      </span>
      <button type="button" className="text-link" onClick={openConflict}>
        去处理
      </button>
    </div>
  );
}
