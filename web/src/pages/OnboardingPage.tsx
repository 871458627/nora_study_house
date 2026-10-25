import { useState } from 'react';
import { useApp } from '../app/AppProvider';
import { Mascot } from '../components/Mascot';
import { CreatePinForm } from '../components/PinGate';
import { Icon } from '../components/Icon';
import { MINUTE_OPTIONS } from '../data/defaults';

const MINUTE_COPY: Record<number, string> = {
  15: '轻量开始，先养成习惯',
  25: '留一点余量，稳稳完成',
  35: '推荐节奏，复习和预习都照顾到',
  50: '时间充裕，巩固练习也做得完',
};

export function OnboardingPage() {
  const { state, configurePin, unlockParentSession, onboard } = useApp();
  const [step, setStep] = useState(0);
  const [nickname, setNickname] = useState(state.profile.nickname === '小朋友' ? '' : state.profile.nickname);
  const [minutes, setMinutes] = useState(state.settings.dailyMinutes || 35);

  if (state.onboarded) {
    return (
      <div className="onboarding">
        <div className="onboarding-art">
          <Mascot mood="happy" size={150} />
          <span className="eyebrow">已连接家庭进度</span>
          <h1>这台设备，先上一把小锁。</h1>
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

  return (
    <div className="onboarding">
      <div className="onboarding-art">
        <Mascot mood={step === 2 ? 'celebrate' : 'happy'} size={150} />
        <span className="eyebrow">小桃学习屋 · 二年级上册</span>
        <h1>{step === 0 ? '学习，刚刚好。' : step === 1 ? '每天留一小段时间。' : '最后一步，交给家长。'}</h1>
        <p>
          {step === 0
            ? '跟着课本复习、预习，完成任务攒桃粮，喂大这只粉色小桃。先告诉小桃怎么称呼你。'
            : step === 1
              ? '计划会自动控制在设定的时长内。周末没有课时，就做错题回顾和口算，不让学习断线。'
              : '家长 PIN 用来保护课程表、每日时长与学习周报。它只保存在这台设备上，不参与云端账号。'}
        </p>
        <ul className="onboarding-ticks">
          <li>
            <Icon name="check" size={14} /> 语文统编版 · 数学人教版 · 英语北京版（预备级）
          </li>
          <li>
            <Icon name="check" size={14} /> 每日计划按课表与掌握度自动生成
          </li>
          <li>
            <Icon name="check" size={14} /> 进度自动同步，手机和平板可以接着用
          </li>
          <li>
            <Icon name="check" size={14} /> 学期中途使用？进入后可在设置里选每科当前课
          </li>
        </ul>
        <div className="onboarding-steps" aria-label={`第 ${step + 1} 步，共 3 步`}>
          {[0, 1, 2].map(index => (
            <i key={index} className={index <= step ? 'on' : ''} />
          ))}
        </div>
      </div>

      <div className="onboarding-card card">
        {step === 0 && (
          <div className="onboarding-form">
            <span className="step-label">第 1 步 · 认识一下</span>
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

        {step === 1 && (
          <div className="onboarding-form">
            <span className="step-label">第 2 步 · 每日节奏</span>
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

        {step === 2 && (
          <div className="onboarding-form">
            <span className="step-label">第 3 步 · 家长守护</span>
            <h2>设置 4 位家长 PIN</h2>
            <CreatePinForm
              onCreate={async pin => {
                await onboard({
                  nickname: nickname.trim() || '小朋友',
                  dailyMinutes: minutes,
                  pin,
                });
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
