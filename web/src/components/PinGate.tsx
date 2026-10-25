import { useState, type ReactNode } from 'react';
import { useApp } from '../app/AppProvider';
import { Icon } from './Icon';
import { PinInput } from './ui';
import {
  isPinUnlocked,
  pinUnlockRemainingSeconds,
  pinUnlockStore,
  rememberPinUnlock,
} from '../core/pinSession';

export function CreatePinForm({
  onCreate,
  submitLabel = '设置 PIN',
  note,
}: {
  onCreate: (pin: string) => Promise<void>;
  submitLabel?: string;
  note?: string;
}) {
  const [pin, setPin] = useState('');
  const [confirm, setConfirm] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  const submit = async () => {
    if (pin.length !== 4) {
      setError('请输入 4 位数字 PIN。');
      return;
    }
    if (pin !== confirm) {
      setError('两次输入的 PIN 不一致。');
      return;
    }
    setError('');
    setBusy(true);
    try {
      await onCreate(pin);
    } catch {
      setError('设置失败，请再试一次。');
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="pin-form">
      <PinInput label="设置 4 位家长 PIN" value={pin} onChange={setPin} disabled={busy} autoFocus />
      <PinInput
        label="再输入一次"
        value={confirm}
        onChange={setConfirm}
        disabled={busy}
        error={error}
        onSubmit={() => void submit()}
      />
      <button className="btn btn-primary full" type="button" onClick={() => void submit()} disabled={busy}>
        {busy ? '正在保存…' : submitLabel}
      </button>
      <p className="pin-note">
        {note ?? 'PIN 只保存在这台设备上，用来保护家长设置与周报，不是账号密码，也不会同步到云端。'}
      </p>
    </div>
  );
}

export function PinGate({ children }: { children: ReactNode }) {
  const { device, configurePin, resetPin, verifyDevicePin, pinLockMinutes, exportData } = useApp();
  const [store] = useState(pinUnlockStore);
  const [unlocked, setUnlocked] = useState(() => isPinUnlocked(store));
  const [pin, setPin] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const [forgot, setForgot] = useState(false);
  const [resetWord, setResetWord] = useState('');
  const [resetDone, setResetDone] = useState(false);
  const lockedMinutes = pinLockMinutes();
  const remainingMinutes = Math.ceil(pinUnlockRemainingSeconds(store) / 60);

  const unlock = () => {
    rememberPinUnlock(store);
    setUnlocked(true);
  };

  // Re-read the session on every render: another component (the PIN reset
  // screen) can unlock this tab while the gate is already mounted.
  const open = unlocked || isPinUnlocked(store);

  if (open) {
    return (
      <div className="pin-unlocked">
        <div className="pin-session-note">
          <Icon name="lock" size={13} />
          家长区域已在这台设备上解锁约 {Math.max(1, remainingMinutes)} 分钟，关闭浏览器标签后需要重新输入。
        </div>
        {children}
      </div>
    );
  }

  if (!device.pinHash) {
    return (
      <div className="pin-gate card">
        <span className="pin-gate-icon">
          <Icon name="lock" size={24} />
        </span>
        <h2>{resetDone ? '设置一个新的家长 PIN' : '先设置本机家长 PIN'}</h2>
        <p>
          {resetDone
            ? '旧 PIN 已经清除，学习记录和云端数据都还在。请设置新的 4 位 PIN。'
            : '这台设备还没有家长 PIN。设置后就能进入课程表、时长与周报。'}
        </p>
        <CreatePinForm
          onCreate={async value => {
            await configurePin(value);
            unlock();
          }}
          submitLabel={resetDone ? '设置新 PIN 并进入' : '设置并进入'}
        />
      </div>
    );
  }

  const submit = async () => {
    if (pin.length !== 4) {
      setError('请输入 4 位数字 PIN。');
      return;
    }
    setBusy(true);
    setError('');
    const result = await verifyDevicePin(pin);
    setBusy(false);
    if (result === 'ok') {
      unlock();
    } else if (result === 'locked') {
      setError('连续输错 5 次，已暂时锁定，请稍后再试。');
      setPin('');
    } else {
      setError('PIN 不正确，再想一想。');
      setPin('');
    }
  };

  return (
    <div className="pin-gate card">
      <span className="pin-gate-icon">
        <Icon name="lock" size={24} />
      </span>
      <h2>家长区域</h2>
      <p>输入本机设置的 4 位 PIN，查看学习报告与调整计划。</p>
      {forgot ? (
        <div className="pin-forgot">
          <div className="pin-forgot-copy">
            <b>忘记 PIN 了？</b>
            <p>
              PIN 只保存在这台设备上，不是账号密码。清除它不会删除本机或云端的
              学习记录，但清除后需要马上设置新的 PIN。
            </p>
          </div>
          <button type="button" className="btn btn-soft full" onClick={exportData}>
            <Icon name="download" size={15} />
            先导出一份备份
          </button>
          <label className="pin-reset-confirm">
            <span>请家长输入「重置」两个字，确认清除本机 PIN</span>
            <input
              value={resetWord}
              onChange={event => setResetWord(event.target.value)}
              placeholder="重置"
              autoComplete="off"
            />
          </label>
          <div className="pin-forgot-actions">
            <button
              type="button"
              className="btn btn-ghost"
              onClick={() => {
                setForgot(false);
                setResetWord('');
              }}
            >
              返回输入 PIN
            </button>
            <button
              type="button"
              className="btn btn-soft pin-reset"
              disabled={resetWord.trim() !== '重置'}
              onClick={() => {
                setResetDone(true);
                resetPin();
              }}
            >
              清除本机 PIN
            </button>
          </div>
        </div>
      ) : (
        <>
          <div className="pin-form">
            <PinInput
              label="家长 PIN"
              value={pin}
              onChange={value => {
                setPin(value);
                setError('');
              }}
              disabled={busy || lockedMinutes > 0}
              autoFocus
              error={error}
              onSubmit={() => void submit()}
            />
            <button
              className="btn btn-primary full"
              type="button"
              onClick={() => void submit()}
              disabled={busy || lockedMinutes > 0}
            >
              {busy ? '正在验证…' : lockedMinutes > 0 ? `锁定中 · 约 ${lockedMinutes} 分钟` : '进入家长区域'}
            </button>
          </div>
          <button type="button" className="text-link pin-forgot-link" onClick={() => setForgot(true)}>
            忘记 PIN？
          </button>
        </>
      )}
      <p className="pin-note">PIN 连续输错 5 次会锁定 5 分钟。它只保护这台设备上的家长入口。</p>
    </div>
  );
}
