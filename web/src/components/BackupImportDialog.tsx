import { useEffect, useRef, useState } from 'react';
import { Icon } from './Icon';
import { STAGES } from '../core/pet';
import { summarizeBackup, type BackupInspection } from '../core/storage';

export interface PendingImport {
  text: string;
  fileName: string;
  size: number;
  inspection: BackupInspection;
}

function formatWhen(value?: string): string {
  if (!value) return '未记录导出时间';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '导出时间无法识别';
  return date.toLocaleString('zh-CN', {
    year: 'numeric',
    month: 'numeric',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

function formatSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  return `${(bytes / 1024).toFixed(1)} KB`;
}

export function BackupImportDialog({
  pending,
  busy,
  onCancel,
  onConfirm,
}: {
  pending: PendingImport;
  busy: boolean;
  onCancel: () => void;
  onConfirm: () => void;
}) {
  const cancelRef = useRef<HTMLButtonElement | null>(null);
  const panelRef = useRef<HTMLDivElement | null>(null);
  const [confirming, setConfirming] = useState(false);
  const summary = summarizeBackup(pending.inspection.state);
  const stage = STAGES[summary.petStage];

  useEffect(() => {
    const previous = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    const timer = window.setTimeout(() => cancelRef.current?.focus(), 0);
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && !busy) {
        event.preventDefault();
        onCancel();
        return;
      }
      if (event.key !== 'Tab' || !panelRef.current) return;
      const nodes = Array.from(
        panelRef.current.querySelectorAll<HTMLElement>('button:not([disabled]), [href]'),
      );
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
      window.clearTimeout(timer);
      document.removeEventListener('keydown', onKeyDown);
    };
  }, [busy, onCancel]);

  return (
    <div
      className="modal-backdrop"
      role="presentation"
      onClick={event => {
        if (event.target === event.currentTarget && !busy) onCancel();
      }}
    >
      <div
        className="modal import-modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby="import-title"
        ref={panelRef}
      >
        <span className="eyebrow">导入备份</span>
        <h2 id="import-title">先看看这份备份里有什么</h2>
        <p className="modal-lede">
          {pending.fileName} · {formatSize(pending.size)} · {formatWhen(pending.inspection.exportedAt)}
        </p>

        <div className="import-summary">
          <div>
            <span>孩子昵称</span>
            <b>{pending.inspection.state.profile.nickname}</b>
          </div>
          <div>
            <span>完成过的任务</span>
            <b>{summary.done} 项</b>
          </div>
          <div>
            <span>星星 / 桃粮</span>
            <b>{summary.stars} 颗 / {summary.food} 份</b>
          </div>
          <div>
            <span>连续学习</span>
            <b>{summary.streak} 天</b>
          </div>
          <div>
            <span>学过的小课</span>
            <b>{summary.lessonCount} 课</b>
          </div>
          <div>
            <span>小桃的成长</span>
            <b>{stage.name} · 陪伴 {summary.petFedDays} 天</b>
          </div>
        </div>

        <div className="modal-warning" role="alert">
          导入会替换这台平板和云端的全部学习记录、奖励和宠物状态，并同步给其他设备。
          现在的记录会先自动下载一份备份，之后还能找回。
        </div>

        <div className="modal-actions import-actions">
          {confirming ? (
            <>
              <button
                className="btn btn-primary full"
                type="button"
                disabled={busy}
                onClick={onConfirm}
              >
                <Icon name="download" size={16} />
                下载当前备份，再导入
              </button>
              <button
                className="btn btn-ghost full"
                type="button"
                disabled={busy}
                onClick={() => setConfirming(false)}
              >
                再看看备份内容
              </button>
            </>
          ) : (
            <>
              <button
                className="btn btn-primary full"
                type="button"
                disabled={busy}
                ref={cancelRef}
                onClick={onCancel}
              >
                <Icon name="check" size={16} />
                保留现在的记录
              </button>
              <button
                className="btn btn-soft full"
                type="button"
                disabled={busy}
                onClick={() => setConfirming(true)}
              >
                我要导入这份备份
              </button>
            </>
          )}
        </div>
        <p className="pin-note">
          {pending.inspection.exportedAt
            ? '请确认导出时间是不是你想要的那一份。'
            : '这份文件没有导出时间，可能来自较早的版本。'}
        </p>
      </div>
    </div>
  );
}
