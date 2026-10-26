import type { ReactNode } from 'react';
import { useNavigate } from 'react-router-dom';
import { useApp } from './AppProvider';
import { Mascot } from '../components/Mascot';

/**
 * 学习门禁（docs/06 §3.10，2026-10-25 用户裁定）：家长未登录时设备处于
 * 浏览模式——页面可以看，学习动作一律挡下。挂在学习类路由外层，登录后
 * 原样放行；「去登录」按设备是否已初始化分流到引导第一屏或设置页。
 * 样式组件内 <style>：卡片自带内边距（docs/05 §1.12-13 圆角安全）。
 */
const LEARN_GATE_CSS = `
.learn-gate{padding-top:8vh;}
.learn-gate-card{padding:26px 22px;text-align:center;display:flex;flex-direction:column;align-items:center;gap:14px;max-width:460px;margin:0 auto;}
.learn-gate-card h1{font-size:19px;font-weight:500;margin:0;}
.learn-gate-card p{font-size:13px;color:var(--sub);line-height:1.7;margin:0;}
`;

export function LearnGate({ children }: { children: ReactNode }) {
  const { canLearn, state, exitVisitor } = useApp();
  const navigate = useNavigate();

  if (canLearn) return <>{children}</>;

  return (
    <div className="page learn-gate">
      <style>{LEARN_GATE_CSS}</style>
      <div className="card learn-gate-card">
        <Mascot mood="normal" size={88} />
        <h1>家长登录后，才能开始学习。</h1>
        <p>
          学习进度要记在云端的小账本上，请家长登录一下再开始。
          课本、小桃和记录现在都可以随便看。
        </p>
        <div className="onboarding-actions">
          <button
            className="btn btn-primary"
            type="button"
            onClick={() => {
              exitVisitor();
              navigate(state.onboarded ? '/settings' : '/onboarding');
            }}
          >
            {state.onboarded ? '去登录' : '去家长绑定'}
          </button>
          <button className="btn btn-ghost" type="button" onClick={() => navigate('/')}>
            继续随便看看
          </button>
        </div>
      </div>
    </div>
  );
}

