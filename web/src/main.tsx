import ReactDOM from 'react-dom/client';
import { HashRouter } from 'react-router-dom';
import { App } from './app/App';
import { AppProvider } from './app/AppProvider';
import { ErrorBoundary } from './app/ErrorBoundary';
import './styles/global.css';

// 深链迁移（缺陷清单 M2）：HashRouter 只读 hash——外部分享/收藏的 /task/xxx
// 路径会被静默丢弃回首页。入口处把非根 pathname 搬进 hash（两种部署均有
// SPA fallback，整页跳转一次后即被路由接管）。
const { pathname, search, hash } = window.location;
const cleanPath = pathname === '/index.html' ? '/' : pathname;
if (cleanPath !== '/' && (hash === '' || hash === '#' || hash === '#/')) {
  window.location.replace(`${window.location.origin}/#${cleanPath}${search}`);
}

const root = document.getElementById('root');
if (!root) throw new Error('Missing root element');

ReactDOM.createRoot(root).render(
  <HashRouter>
    {/* 顶层错误边界（缺陷清单 低9）：渲染异常不再整树白屏 */}
    <ErrorBoundary>
      <AppProvider>
        <App />
      </AppProvider>
    </ErrorBoundary>
  </HashRouter>,
);

// 应用首帧接管后摘除休眠唤醒屏（index.html 内联；此处兜底双保险）
const wakeScreen = document.getElementById('wake-screen');
if (wakeScreen) {
  wakeScreen.classList.add('hide');
  window.setTimeout(() => wakeScreen.remove(), 400);
}
