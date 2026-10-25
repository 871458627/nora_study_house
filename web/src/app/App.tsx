import { useEffect } from 'react';
import { NavLink, Route, Routes, useLocation } from 'react-router-dom';
import { useApp } from './AppProvider';
import { ConflictDialog, PendingConflictBanner } from './ConflictDialog';
import { LoginBanner } from './LoginBanner';
import { LearnGate } from './LearnGate';
import { Mascot } from '../components/Mascot';
import { Icon } from '../components/Icon';
import { SyncBadge, Toast } from '../components/ui';
import { OnboardingPage } from '../pages/OnboardingPage';
import { TodayPage } from '../pages/TodayPage';
import { TextbookPage } from '../pages/TextbookPage';
import { LessonPage } from '../pages/LessonPage';
import { TaskPage } from '../pages/TaskPage';
import { PetPage } from '../pages/PetPage';
import { ShopPage } from '../pages/ShopPage';
import { BadgesPage } from '../pages/BadgesPage';
import { RecordsPage } from '../pages/RecordsPage';
import { ReportPage } from '../pages/ReportPage';
import { SettingsPage } from '../pages/SettingsPage';
import { MistakeRetryPage } from '../pages/MistakeRetryPage';
import { DictationReviewPage } from '../pages/DictationReviewPage';
import { NotFoundPage } from '../pages/NotFoundPage';

const NAV = [
  { to: '/', label: '今天', icon: 'home' as const, end: true },
  { to: '/textbook', label: '课本', icon: 'book' as const },
  { to: '/pet', label: '小桃', icon: 'pet' as const },
  { to: '/records', label: '记录', icon: 'chart' as const },
  { to: '/settings', label: '设置', icon: 'gear' as const },
];

const DESKTOP_NAV = [
  ...NAV,
  { to: '/report', label: '家长周报', icon: 'lock' as const },
];

function Splash() {
  return (
    <div className="splash">
      <Mascot mood="happy" size={96} />
      <b>小桃学习屋</b>
      <span>正在把今天的计划拿过来…</span>
    </div>
  );
}

function SiteNav() {
  return (
    <header className="site-nav">
      <div className="nav-inner">
        <NavLink to="/" className="brand" aria-label="小桃学习屋首页">
          <Mascot mood="happy" size={25} />
          <span>小桃学习屋</span>
        </NavLink>
        <nav className="nav-links" aria-label="主导航">
          {DESKTOP_NAV.map(item => (
            <NavLink
              key={item.to}
              to={item.to}
              end={'end' in item ? item.end : undefined}
              className={({ isActive }) => (isActive ? 'active' : undefined)}
            >
              {item.label}
            </NavLink>
          ))}
        </nav>
        <div className="nav-actions">
          <SyncBadge />
        </div>
      </div>
    </header>
  );
}

function MobileNav() {
  return (
    <nav className="mobile-nav" aria-label="底部导航">
      {NAV.map(item => (
        <NavLink
          key={item.to}
          to={item.to}
          end={'end' in item ? item.end : undefined}
          className={({ isActive }) => (isActive ? 'mobile-tab active' : 'mobile-tab')}
        >
          <Icon name={item.icon} size={21} />
          <span>{item.label}</span>
        </NavLink>
      ))}
    </nav>
  );
}

export function App() {
  const { state, device, ready } = useApp();
  const location = useLocation();
  const focusRoute =
    /^\/task\//.test(location.pathname) ||
    /^\/mistake\//.test(location.pathname) ||
    /^\/dictation\/review/.test(location.pathname) ||
    /^\/lesson\/[^/]+\/(practice|dictation|words)/.test(location.pathname);

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'instant' as ScrollBehavior });
  }, [location.pathname]);

  if (!ready) {
    return (
      <div className="app-root">
        <Splash />
      </div>
    );
  }

  const needsOnboarding = !state.onboarded || !device.pinHash;

  // 浏览模式（docs/06 §3.10）：未登录选了「先逛逛」时放行进入应用，
  // 学习类路由由 LearnGate 逐条锁死。
  if (needsOnboarding && !device.visitor) {
    return (
      <div className="app-root onboarding-root">
        <OnboardingPage />
        <ConflictDialog />
        <Toast />
      </div>
    );
  }

  return (
    <div className={`app-root ${focusRoute ? 'focus-mode' : ''}`}>
      {!focusRoute ? <SiteNav /> : null}
      {!focusRoute ? <PendingConflictBanner /> : null}
      {!focusRoute ? <LoginBanner /> : null}
      <main className="page-wrap">
        <Routes>
          <Route path="/" element={<TodayPage />} />
          <Route path="/textbook" element={<TextbookPage />} />
          <Route path="/textbook/:subject/:lessonId" element={<LessonPage />} />
          <Route path="/task/:taskId" element={<LearnGate><TaskPage mode="task" /></LearnGate>} />
          <Route path="/lesson/:lessonId/practice" element={<LearnGate><TaskPage mode="practice" /></LearnGate>} />
          <Route path="/lesson/:lessonId/dictation" element={<LearnGate><TaskPage mode="dictation" /></LearnGate>} />
          <Route path="/lesson/:lessonId/words" element={<LearnGate><TaskPage mode="words" /></LearnGate>} />
          <Route path="/mistake/:questionId" element={<LearnGate><MistakeRetryPage /></LearnGate>} />
          <Route path="/dictation/review" element={<LearnGate><DictationReviewPage /></LearnGate>} />
          <Route path="/pet" element={<PetPage />} />
          <Route path="/shop" element={<ShopPage />} />
          <Route path="/badges" element={<BadgesPage />} />
          <Route path="/records" element={<RecordsPage />} />
          <Route path="/report" element={<ReportPage />} />
          <Route path="/settings" element={<SettingsPage />} />
          <Route path="/onboarding" element={<OnboardingPage />} />
          <Route path="*" element={<NotFoundPage />} />
        </Routes>
      </main>
      {!focusRoute ? <MobileNav /> : null}
      <ConflictDialog />
      <Toast />
    </div>
  );
}
