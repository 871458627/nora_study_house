import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useApp } from './AppProvider';
import { Icon } from '../components/Icon';

/**
 * Logged-out notice (docs/02 §5.2-1, docs/06 §4.4): stays visible until the
 * parent dismisses it; local data keeps working and the link jumps to the
 * settings page where the login form lives.
 */
export function LoginBanner() {
  const { syncStatus } = useApp();
  const [dismissed, setDismissed] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    if (syncStatus !== 'logged_out') setDismissed(false);
  }, [syncStatus]);

  if (syncStatus !== 'logged_out' || dismissed) return null;
  return (
    <div className="pending-conflict login-banner" role="status">
      <span className="pending-conflict-icon">
        <Icon name="alert" size={15} />
      </span>
      <span>需要家长登录后才能同步，这台设备上的记录可以照常使用。</span>
      <button type="button" className="text-link" onClick={() => navigate('/settings')}>
        去登录
      </button>
      <button type="button" className="text-link" onClick={() => setDismissed(true)}>
        知道了
      </button>
    </div>
  );
}
