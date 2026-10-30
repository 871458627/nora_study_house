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

  const visible = syncStatus === 'logged_out' && !dismissed;

  useEffect(() => {
    if (syncStatus !== 'logged_out') setDismissed(false);
  }, [syncStatus]);

  // 横幅悬浮在页面底部之上：可见时给内容让出底部空间，
  // 防止盖住设置本机 PIN 这类页面底部的按钮（点击落到横幅上＝没反应）。
  useEffect(() => {
    document.body.classList.toggle('has-login-banner', visible);
    return () => document.body.classList.remove('has-login-banner');
  }, [visible]);

  if (!visible) return null;
  return (
    <div className="pending-conflict login-banner" role="status">
      <span className="pending-conflict-icon">
        <Icon name="alert" size={15} />
      </span>
      <span>家长未登录：可以先随便看看，学习要等家长登录后继续。</span>
      <button type="button" className="text-link banner-cta" onClick={() => navigate('/settings')}>
        去登录
      </button>
      <button type="button" className="text-link" onClick={() => setDismissed(true)}>
        知道了
      </button>
    </div>
  );
}
