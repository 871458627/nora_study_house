import ReactDOM from 'react-dom/client';
import { HashRouter } from 'react-router-dom';
import { App } from './app/App';
import { AppProvider } from './app/AppProvider';
import './styles/global.css';

const root = document.getElementById('root');
if (!root) throw new Error('Missing root element');

ReactDOM.createRoot(root).render(
  <HashRouter>
    <AppProvider>
      <App />
    </AppProvider>
  </HashRouter>,
);

// 应用首帧接管后摘除休眠唤醒屏（index.html 内联；此处兜底双保险）
const wakeScreen = document.getElementById('wake-screen');
if (wakeScreen) {
  wakeScreen.classList.add('hide');
  window.setTimeout(() => wakeScreen.remove(), 400);
}
