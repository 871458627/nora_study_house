import { useEffect, useRef } from 'react';
import { Icon } from './Icon';

interface LeaveConfirmDialogProps {
  title: string;
  description: string;
  stayLabel: string;
  onStay: () => void;
  onLeave: () => void;
}

/**
 * Child-friendly replacement for window.confirm: two clearly labelled
 * choices, the safe one focused first, no scary system wording.
 */
export function LeaveConfirmDialog({
  title,
  description,
  stayLabel,
  onStay,
  onLeave,
}: LeaveConfirmDialogProps) {
  const stayRef = useRef<HTMLButtonElement | null>(null);

  useEffect(() => {
    const timer = window.setTimeout(() => stayRef.current?.focus(), 0);
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        event.preventDefault();
        onStay();
      }
    };
    document.addEventListener('keydown', onKeyDown);
    return () => {
      window.clearTimeout(timer);
      document.removeEventListener('keydown', onKeyDown);
    };
  }, [onStay]);

  return (
    <div className="modal-backdrop" role="presentation">
      <div
        className="modal leave-modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby="leave-title"
        aria-describedby="leave-desc"
      >
        <div className="modal-mascot">
          <span className="leave-mark">
            <Icon name="leaf" size={22} />
          </span>
        </div>
        <h2 id="leave-title">{title}</h2>
        <p className="modal-lede" id="leave-desc">
          {description}
        </p>
        <div className="modal-actions">
          <button
            className="btn btn-primary full"
            type="button"
            ref={stayRef}
            onClick={onStay}
          >
            {stayLabel}
          </button>
          <button className="btn btn-ghost full" type="button" onClick={onLeave}>
            离开这次练习
          </button>
        </div>
      </div>
    </div>
  );
}
