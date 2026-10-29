import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { AuthError, credentialProblem } from '../app/auth';
import { useApp } from '../app/AppProvider';
import { Mascot } from '../components/Mascot';
import { CreatePinForm } from '../components/PinGate';
import { Icon } from '../components/Icon';
import { MINUTE_OPTIONS } from '../data/defaults';
import type { SyncState } from '../core/model';

const MINUTE_COPY: Record<number, string> = {
  15: '轻量开始，先养成习惯',
  25: '留一点余量，稳稳完成',
  35: '推荐节奏，复习和预习都照顾到',
  50: '时间充裕，巩固练习也做得完',
};

const TOTAL_STEPS = 4;

const BIND_TICKS = [
  '进度自动同步，换设备可以接着用',
  'PIN 只保存在本机，不参与云端账号',
  '先随便逛逛可以，学习要等家长登录',
];

const PROFILE_TICKS = [
  '语文统编版 · 数学人教版 · 英语北京版（预备级）',
  '每日计划按课表与掌握度自动生成',
  '进度自动同步，手机和平板可以接着用',
  '学期中途使用？进入后可在设置里选每科当前课',
];

/** 接续确认（docs/06 §3.10）：接上云端后给孩子一个「被认出来」的瞬间。 */
function welcomeLine(state: SyncState): string {
  const done = Object.values(state.dailyLogs).reduce((total, log) => total + log.done.length, 0);
  const parts: string[] = [];
  if (done > 0) parts.push(`完成过 ${done} 项学习`);
  if (state.rewards.food > 0) parts.push(`攒下 ${state.rewards.food} 份桃粮`);
  if (state.rewards.streak > 0) parts.push(`连续学习 ${state.rewards.streak} 天`);
  if (parts.length === 0) return `欢迎回来，${state.profile.nickname}，小桃把你的进度接上了。`;
  return `欢迎回来，${state.profile.nickname}：${parts.join('，')}，都还在。`;
}

function bindAuthErrorText(error: unknown): string {
  if (error instanceof AuthError) {
    if (error.code === 'invalid_credentials') return '用户名或密码不正确';
    if (error.code === 'rate_limited')
      return '尝试过于频繁：注册每小时最多 3 次，登录每 15 分钟最多 5 次，请稍后再试。';
    if (error.code === 'invalid_body')
      return '用户名需 3-32 位（字母、数字、下划线、短横线），密码至少 8 位。';
    if (error.code === 'offline') return '网络没有连上，请联网后再试。';
  }
  return '请求没有完成，请稍后再试。';
}

export function OnboardingPage() {
  const {
    state,
    device,
    bindLogin,
    bindRegister,
    bindPull,
    configurePin,
    unlockParentSession,
    onboard,
    enterVisitor,
  } = useApp();
  const navigate = useNavigate();
  const [phase, setPhase] = useState<'bind' | 'profile'>('bind');
  const [step, setStep] = useState(0);
  const [nickname, setNickname] = useState(
    state.profile.nickname === '小朋友' ? '' : state.profile.nickname,
  );
  const [minutes, setMinutes] = useState(state.settings.dailyMinutes || 35);
  const [authMode, setAuthMode] = useState<'login' | 'register'>('login');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [bindError, setBindError] = useState('');
  const [pullFailed, setPullFailed] = useState(false);
  const [busy, setBusy] = useState(false);

  // 引导已完成（含 PIN）就不再渲染任何表单：从 LearnGate「去家长绑定」进入时
  // URL 停在 /onboarding，若不回首页，设置完 PIN 后这张表单会原样重现，
  // 看起来就像「点了没反应」。 pinHash 就绪时直接回首页。
  useEffect(() => {
    if (state.onboarded && device.pinHash) navigate('/');
  }, [state.onboarded, device.pinHash, navigate]);

  if (state.onboarded) {
    if (device.pinHash) {
      // 导航生效前的过渡帧：不再渲染表单，避免重复设置。
      return (
        <div className="onboarding">
          <div className="onboarding-card card">
            <h2>设置完成，正在进入小桃学习屋…</h2>
          </div>
        </div>
      );
    }
    return (
      <div className="onboarding">
        <div className="onboarding-art">
          <Mascot mood="happy" size={150} />
          <span className="eyebrow">已连接家庭进度</span>
          <h1>这台设备，先上一把小锁。</h1>
          <p>{welcomeLine(state)}</p>
          <p>
            学习记录和小桃的成长都还在，只是这台设备还没有家长 PIN。
            课程表、时长和周报需要先上一把 4 位小锁，PIN 只保存在这台设备上。
          </p>
          <ul className="onboarding-ticks">
            <li>
              <Icon name="check" size={14} /> 学习进度与宠物状态已经就位
            </li>
            <li>
              <Icon name="check" size={14} /> PIN 只保存在本机，不会上传
            </li>
            <li>
              <Icon name="check" size={14} /> 换设备时，只需再设一次本机 PIN
            </li>
          </ul>
        </div>
        <div className="onboarding-card card">
          <h2>设置本机家长 PIN</h2>
          <CreatePinForm
            onCreate={async pin => {
              // The parent typed this PIN themselves; open the parent area for
              // this session instead of asking for it again right away.
              unlockParentSession();
              await configurePin(pin);
            }}
            submitLabel="设置并开始"
          />
        </div>
      </div>
    );
  }

  /** 浏览模式兜底（docs/06 §3.10）：不登录也能看，学习动作由 LearnGate 锁死。 */
  const startVisitor = () => {
    enterVisitor();
    navigate('/');
  };

  const submitBind = async () => {
    const name = username.trim();
    if (!name || !password) {
      setBindError('请输入用户名和密码。');
      return;
    }
    setBindError('');
    setBusy(true);
    try {
      if (authMode === 'login') {
        await bindLogin({ username: name, password });
      } else {
        // 注册前本地预校验：服务端对格式错误只回笼统的 invalid_body，
        // 具体原因（如密码不足 8 位）必须在这里给出。
        const problem = credentialProblem(name, password);
        if (problem) {
          setBindError(problem);
          return;
        }
        await bindRegister({ username: name, password });
      }
      setPassword('');
      setPullFailed(false);
      // adopted 时组件会在下一次渲染整体切到「设本机 PIN」分支，这句只对 empty 生效。
      setPhase('profile');
    } catch (error) {
      if (error instanceof AuthError) {
        setBindError(bindAuthErrorText(error));
      } else {
        // 登录已成功、拉云端失败：进入「重试 / 兜底」卡片，绝不停死在中间态。
        setBindError('');
        setPullFailed(true);
      }
    } finally {
      setBusy(false);
    }
  };

  const retryPull = async () => {
    setBusy(true);
    try {
      await bindPull();
      setPullFailed(false);
      setPhase('profile');
    } catch {
      setBindError('还是没有取回来，请稍后再试，或先随便逛逛。');
    } finally {
      setBusy(false);
    }
  };

  const stepNumber = phase === 'bind' ? 1 : step + 2;
  const artCopy =
    phase === 'bind'
      ? {
          h1: '家长先登录，进度接得上。',
          p: '登录后，这台设备会自动接上孩子已有的学习记录和小桃的成长。第一次使用小桃，注册家庭账号即可。',
        }
      : {
          h1:
            step === 0 ? '学习，刚刚好。' : step === 1 ? '每天留一小段时间。' : '最后一步，交给家长。',
          p:
            step === 0
              ? '跟着课本复习、预习，完成任务攒桃粮，喂大这只粉色小桃。先告诉小桃怎么称呼你。'
              : step === 1
                ? '计划会自动控制在设定的时长内。周末没有课时，就做错题回顾和口算，不让学习断线。'
                : '家长 PIN 用来保护课程表、每日时长与学习周报。它只保存在这台设备上，不参与云端账号。',
        };
  const ticks = phase === 'bind' ? BIND_TICKS : PROFILE_TICKS;

  return (
    <div className="onboarding">
      <div className="onboarding-art">
        <Mascot mood={phase === 'profile' && step === 2 ? 'celebrate' : 'happy'} size={150} />
        <span className="eyebrow">小桃学习屋 · 二年级上册</span>
        <h1>{artCopy.h1}</h1>
        <p>{artCopy.p}</p>
        <ul className="onboarding-ticks">
          {ticks.map(tick => (
            <li key={tick}>
              <Icon name="check" size={14} /> {tick}
            </li>
          ))}
        </ul>
        <div className="onboarding-steps" aria-label={`第 ${stepNumber} 步，共 ${TOTAL_STEPS} 步`}>
          {Array.from({ length: TOTAL_STEPS }, (_, index) => {
            const reachable = index < stepNumber - 1;
            return (
              <button
                key={index}
                type="button"
                className={index < stepNumber ? 'on' : ''}
                aria-label={`回到第 ${index + 1} 步`}
                disabled={!reachable || busy}
                onClick={() => {
                  if (index === 0) setPhase('bind');
                  else {
                    setPhase('profile');
                    setStep(index - 1);
                  }
                }}
              />
            );
          })}
        </div>
      </div>

      <div className="onboarding-card card">
        {phase === 'bind' && !pullFailed && (
          <div className="onboarding-form">
            <span className="step-label">第 1 步 · 家长绑定</span>
            <h2>{authMode === 'login' ? '登录家长账号' : '注册家庭账号'}</h2>
            <div className="segmented" role="tablist" aria-label="家长账号操作">
              <button
                type="button"
                role="tab"
                aria-selected={authMode === 'login'}
                className={authMode === 'login' ? 'seg active' : 'seg'}
                disabled={busy}
                onClick={() => {
                  setAuthMode('login');
                  setBindError('');
                }}
              >
                登录
              </button>
              <button
                type="button"
                role="tab"
                aria-selected={authMode === 'register'}
                className={authMode === 'register' ? 'seg active' : 'seg'}
                disabled={busy}
                onClick={() => {
                  setAuthMode('register');
                  setBindError('');
                }}
              >
                注册新账号
              </button>
            </div>
            <label className="text-field">
              <span>用户名</span>
              <input
                value={username}
                maxLength={32}
                autoComplete="username"
                disabled={busy}
                onChange={event => setUsername(event.target.value)}
              />
            </label>
            <label className="text-field">
              <span>密码</span>
              <input
                type="password"
                value={password}
                autoComplete={authMode === 'login' ? 'current-password' : 'new-password'}
                disabled={busy}
                onChange={event => setPassword(event.target.value)}
                onKeyDown={event => {
                  if (event.key === 'Enter') void submitBind();
                }}
              />
            </label>
            {bindError ? (
              <p className="field-error" role="alert">
                {bindError}
              </p>
            ) : null}
            <p className="field-hint">
              {authMode === 'login'
                ? '登录后自动接上这台设备的云端进度。'
                : '注册会创建一个新家庭，仅在第一次使用小桃时注册；换新设备请直接登录。'}
            </p>
            <button
              className="btn btn-primary full"
              type="button"
              disabled={busy}
              onClick={() => void submitBind()}
            >
              {busy ? '正在连接…' : authMode === 'login' ? '登录并接上进度' : '注册并开始'}
            </button>
            <button className="btn btn-ghost full" type="button" disabled={busy} onClick={startVisitor}>
              暂不登录，先逛逛
            </button>
          </div>
        )}

        {phase === 'bind' && pullFailed && (
          <div className="onboarding-form">
            <span className="step-label">第 1 步 · 家长绑定</span>
            <h2>登录成功，进度还没取回来</h2>
            {bindError ? (
              <p className="field-error" role="alert">
                {bindError}
              </p>
            ) : null}
            <p className="field-hint">
              网络暂时不稳定。可以再试一次，也可以先随便逛逛，家长稍后在设置里登录。
            </p>
            <button
              className="btn btn-primary full"
              type="button"
              disabled={busy}
              onClick={() => void retryPull()}
            >
              {busy ? '正在取回…' : '重试取回进度'}
            </button>
            <button className="btn btn-ghost full" type="button" disabled={busy} onClick={startVisitor}>
              暂不登录，先逛逛
            </button>
          </div>
        )}

        {phase === 'profile' && step === 0 && (
          <div className="onboarding-form">
            <span className="step-label">第 2 步 · 认识一下</span>
            <h2>小桃该怎么称呼你？</h2>
            <label className="text-field">
              <span>昵称</span>
              <input
                value={nickname}
                maxLength={12}
                placeholder="小朋友"
                autoFocus
                onChange={event => setNickname(event.target.value)}
              />
            </label>
            <p className="field-hint">只用昵称就好。不需要真实姓名、学校或班级。</p>
            <button className="btn btn-primary full" type="button" onClick={() => setStep(1)}>
              下一步
              <Icon name="arrow" size={16} />
            </button>
          </div>
        )}

        {phase === 'profile' && step === 1 && (
          <div className="onboarding-form">
            <span className="step-label">第 3 步 · 每日节奏</span>
            <h2>每天学多久舒服？</h2>
            <div className="minute-options">
              {MINUTE_OPTIONS.map(option => (
                <button
                  key={option}
                  type="button"
                  className={`minute-option ${minutes === option ? 'active' : ''}`}
                  onClick={() => setMinutes(option)}
                >
                  <b>{option}</b>
                  <span>分钟</span>
                  <small>{MINUTE_COPY[option]}</small>
                </button>
              ))}
            </div>
            <div className="mini-timetable">
              <div className="mini-timetable-head">
                <b>默认课程表</b>
                <span>稍后可在设置里逐格修改</span>
              </div>
              <div className="mini-week">
                {['一', '二', '三', '四', '五', '六', '日'].map((day, index) => (
                  <div key={day} className={index > 4 ? 'weekend' : ''}>
                    <span>{day}</span>
                    <small>{index > 4 ? '休息' : index === 1 || index === 3 ? '语 · 数' : '语 · 数 · 英'}</small>
                  </div>
                ))}
              </div>
            </div>
            <div className="onboarding-actions">
              <button className="btn btn-ghost" type="button" onClick={() => setStep(0)}>
                上一步
              </button>
              <button className="btn btn-primary" type="button" onClick={() => setStep(2)}>
                下一步
                <Icon name="arrow" size={16} />
              </button>
            </div>
          </div>
        )}

        {phase === 'profile' && step === 2 && (
          <div className="onboarding-form">
            <span className="step-label">第 4 步 · 家长守护</span>
            <h2>设置 4 位家长 PIN</h2>
            <CreatePinForm
              onCreate={async pin => {
                await onboard({
                  nickname: nickname.trim() || '小朋友',
                  dailyMinutes: minutes,
                  pin,
                });
                // 引导完成立即回首页：URL 可能停在 /onboarding，
                // 不跳转的话接管屏退出后还会落在同一张 PIN 表单上。
                navigate('/');
              }}
              submitLabel="完成，进入小桃学习屋"
            />
            <button className="btn btn-ghost full" type="button" onClick={() => setStep(1)}>
              返回上一步
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
