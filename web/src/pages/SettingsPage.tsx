import { useEffect, useState } from 'react';
import { useApp } from '../app/AppProvider';
import { AuthError } from '../app/auth';
import { Icon } from '../components/Icon';
import { BackupImportDialog, type PendingImport } from '../components/BackupImportDialog';
import { CurrentLessonPicker } from '../components/CurrentLessonPicker';
import { SyncBadge } from '../components/ui';
import { PinGate, CreatePinForm } from '../components/PinGate';
import { inspectBackup } from '../core/storage';
import {
  DEFAULT_TIMETABLE,
  MINUTE_OPTIONS,
  PERIOD_NAMES,
  SLOT_LABEL,
  WEEKDAY_NAMES,
} from '../data/defaults';
import type { SlotSubject, Timetable } from '../data/types';

const SYNC_LABEL: Record<string, string> = {
  idle: '等待同步',
  syncing: '正在同步',
  synced: '已同步',
  offline: '离线，改动已留在本机',
  conflict: '有待处理的版本冲突',
  logged_out: '未登录，等待家长登录后同步',
};

const ERROR_LABEL: Record<string, string> = {
  login_required: '需要家长登录后才能同步，本地数据不受影响。',
  invalid_token: '登录状态已失效，请重新登录。',
  refresh_reused: '登录状态异常，请重新登录。',
  forbidden: '当前账号没有访问权限。',
  service_unavailable: '云端服务暂时不可用，请稍后再试。',
  offline: '网络没有连上，改动会留在本机，联网后自动重试。',
  sync_failed: '同步没有完成，请稍后再试。',
  invalid_response: '云端返回的数据格式不正确，已保留本机版本。',
  invalid_state: '云端数据无法识别，已保留本机版本。',
};

/** Parent-facing login/register error copy, exact texts from docs/02 §3.1. */
function authErrorText(error: unknown): string {
  if (error instanceof AuthError) {
    if (error.code === 'invalid_credentials') return '用户名或密码不正确';
    if (error.code === 'rate_limited') return '尝试过于频繁，请15分钟后再试';
    if (error.code === 'offline') return '网络没有连上，请联网后再试。';
  }
  return '请求没有完成，请稍后再试。';
}

function formatWhen(value?: string): string {
  if (!value) return '还没有同步过';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '时间未知';
  return date.toLocaleString('zh-CN', {
    month: 'numeric',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

const SLOT_OPTIONS: { value: string; label: string }[] = [
  { value: '', label: '空' },
  { value: 'chinese', label: SLOT_LABEL.chinese },
  { value: 'math', label: SLOT_LABEL.math },
  { value: 'english', label: SLOT_LABEL.english },
  { value: 'other', label: SLOT_LABEL.other },
];

export function SettingsPage() {
  const {
    state,
    device,
    dispatchLocal,
    notify,
    configurePin,
    syncNow,
    exportData,
    importData,
    syncStatus,
    syncError,
    parentAccount,
    parentLogin,
    parentRegister,
    parentLogout,
  } = useApp();
  const [nickname, setNickname] = useState(state.profile.nickname);
  const [pendingImport, setPendingImport] = useState<PendingImport | null>(null);
  const [importBusy, setImportBusy] = useState(false);
  const [authMode, setAuthMode] = useState<'login' | 'register'>('login');
  const [authUsername, setAuthUsername] = useState('');
  const [authPassword, setAuthPassword] = useState('');
  const [authError, setAuthError] = useState('');
  const [authBusy, setAuthBusy] = useState(false);

  useEffect(() => {
    setNickname(state.profile.nickname);
  }, [state.profile.nickname]);

  const setTimetableCell = (dayIndex: number, periodIndex: number, value: string) => {
    const timetable: Timetable = state.timetable.map((row, rowIndex) =>
      rowIndex === dayIndex
        ? row.map((slot, slotIndex) =>
            slotIndex === periodIndex
              ? value === ''
                ? null
                : (value as SlotSubject)
              : slot,
          )
        : [...row],
    );
    dispatchLocal({ type: 'update-timetable', timetable });
  };

  const resetTimetable = () => {
    const ok = window.confirm('恢复默认课程表？当前的逐格调整会被替换。');
    if (!ok) return;
    dispatchLocal({
      type: 'update-timetable',
      timetable: DEFAULT_TIMETABLE.map(row => [...row]),
    });
    notify('课程表已恢复为默认安排。');
  };

  const saveNickname = () => {
    dispatchLocal({ type: 'update-nickname', nickname });
    notify('昵称已保存。');
  };

  const submitAuth = async () => {
    const username = authUsername.trim();
    if (!username || !authPassword) {
      setAuthError('请输入用户名和密码。');
      return;
    }
    setAuthError('');
    setAuthBusy(true);
    try {
      if (authMode === 'login') {
        await parentLogin({ username, password: authPassword });
        notify('已登录家长账号。');
      } else {
        await parentRegister({ username, password: authPassword });
        notify('注册成功，已登录。');
      }
      setAuthPassword('');
    } catch (error) {
      setAuthError(authErrorText(error));
    } finally {
      setAuthBusy(false);
    }
  };

  const handleLogout = async () => {
    setAuthBusy(true);
    try {
      await parentLogout();
      setAuthPassword('');
      notify('已退出家长账号，本地记录保持不变。');
    } finally {
      setAuthBusy(false);
    }
  };

  const handleImport = async (file: File | undefined) => {
    if (!file) return;
    try {
      const text = await file.text();
      const inspection = inspectBackup(text);
      if (!inspection) {
        notify('这个文件不是可识别的小桃备份。');
        return;
      }
      setPendingImport({ text, fileName: file.name, size: file.size, inspection });
    } catch {
      notify('读取备份失败，请再试一次。');
    }
  };

  const confirmImport = () => {
    const pending = pendingImport;
    if (!pending) return;
    setImportBusy(true);
    try {
      exportData();
      if (importData(pending.text)) {
        setPendingImport(null);
        notify('备份已导入，已先下载当前记录快照。');
      } else {
        notify('导入没有完成，现有记录没有改动。');
      }
    } finally {
      setImportBusy(false);
    }
  };

  return (
    <div className="page settings-page">
      <header className="page-head">
        <div>
          <p className="eyebrow">家长设置 · PIN 保护</p>
          <h1>把节奏调成适合你们的样子。</h1>
          <p className="page-lede">
            课程表、每日时长、听写方式和数据备份都在这里。改动会自动保存，并同步到家人的设备。
          </p>
        </div>
        <div className="head-side">
          <SyncBadge />
        </div>
      </header>

      <PinGate>
        <div className="settings-grid">
          <div className="settings-main">
            <section className="settings-card card">
              <div className="section-title">
                <h2>孩子怎么称呼</h2>
                <span className="section-aside">只使用昵称</span>
              </div>
              <div className="inline-form">
                <label className="text-field">
                  <span>昵称</span>
                  <input
                    value={nickname}
                    maxLength={12}
                    onChange={event => setNickname(event.target.value)}
                  />
                </label>
                <button
                  type="button"
                  className="btn btn-soft"
                  disabled={!nickname.trim() || nickname.trim() === state.profile.nickname}
                  onClick={saveNickname}
                >
                  保存昵称
                </button>
              </div>
              <p className="field-hint">不需要真实姓名、学校或班级。昵称会同步到家人的设备。</p>
            </section>

            <section className="settings-card card">
              <div className="section-title">
                <h2>每日节奏</h2>
                <span className="section-aside">影响每天计划的总时长</span>
              </div>

              <div className="settings-row">
                <div className="settings-row-copy">
                  <b>每天学多久</b>
                  <small>计划会自动控制在设定的时长内，先保留复习，再安排预习和巩固。</small>
                </div>
                <div className="segmented minutes-seg" role="tablist" aria-label="每日学习时长">
                  {MINUTE_OPTIONS.map(option => (
                    <button
                      key={option}
                      type="button"
                      role="tab"
                      aria-selected={state.settings.dailyMinutes === option}
                      className={state.settings.dailyMinutes === option ? 'seg active' : 'seg'}
                      onClick={() =>
                        dispatchLocal({ type: 'update-settings', patch: { dailyMinutes: option } })
                      }
                    >
                      {option} 分
                    </button>
                  ))}
                </div>
              </div>

              <div className="settings-row">
                <div className="settings-row-copy">
                  <b>每天的截止时间</b>
                  <small>过了这个时间还没做完，小桃会有点委屈，但不会扣掉已经得到的星星。</small>
                </div>
                <label className="select-field">
                  <span className="sr-only">截止时间</span>
                  <select
                    value={state.settings.deadlineHour}
                    onChange={event =>
                      dispatchLocal({
                        type: 'update-settings',
                        patch: { deadlineHour: Number(event.target.value) },
                      })
                    }
                  >
                    {[18, 19, 20, 21, 22, 23].map(hour => (
                      <option key={hour} value={hour}>
                        {hour}:00
                      </option>
                    ))}
                  </select>
                </label>
              </div>

              <div className="settings-row">
                <div className="settings-row-copy">
                  <b>听写方式</b>
                  <small>听音选字适合独立完成；田字格手写最贴近纸面听写。</small>
                </div>
                <div className="segmented" role="tablist" aria-label="默认听写方式">
                  <button
                    type="button"
                    role="tab"
                    aria-selected={state.settings.dictationMode === 'choice'}
                    className={state.settings.dictationMode === 'choice' ? 'seg active' : 'seg'}
                    onClick={() =>
                      dispatchLocal({ type: 'update-settings', patch: { dictationMode: 'choice' } })
                    }
                  >
                    听音选字
                  </button>
                  <button
                    type="button"
                    role="tab"
                    aria-selected={state.settings.dictationMode === 'handwrite'}
                    className={state.settings.dictationMode === 'handwrite' ? 'seg active' : 'seg'}
                    onClick={() =>
                      dispatchLocal({ type: 'update-settings', patch: { dictationMode: 'handwrite' } })
                    }
                  >
                    田字格写
                  </button>
                </div>
              </div>

              <div className="toggle-row">
                <div className="settings-row-copy">
                  <b>听写自动朗读</b>
                  <small>关闭后听写不会自动发声，仍然可以点喇叭手动听。</small>
                </div>
                <label className="switch">
                  <input
                    type="checkbox"
                    checked={state.settings.ttsEnabled}
                    onChange={event =>
                      dispatchLocal({
                        type: 'update-settings',
                        patch: { ttsEnabled: event.target.checked },
                      })
                    }
                  />
                  <span aria-hidden="true" />
                  <span className="sr-only">听写自动朗读</span>
                </label>
              </div>

              <div className="toggle-row">
                <div className="settings-row-copy">
                  <b>每天加一道口算</b>
                  <small>默认关闭。开启后，每天会多一项 5 题的口算练习。</small>
                </div>
                <label className="switch">
                  <input
                    type="checkbox"
                    checked={state.settings.dailyDrill}
                    onChange={event =>
                      dispatchLocal({
                        type: 'update-settings',
                        patch: { dailyDrill: event.target.checked },
                      })
                    }
                  />
                  <span aria-hidden="true" />
                  <span className="sr-only">每天加一道口算</span>
                </label>
              </div>
            </section>

            <section className="settings-card card">
              <div className="section-title">
                <h2>现在学到第几课</h2>
                <span className="section-aside">学期中途使用也能对上课堂</span>
              </div>
              <p className="settings-note">
                按孩子课本的真实进度选一次。复习从当前课开始，预习看下一课；
                已完成的任务和奖励不会因为换课被清除。
              </p>
              <div className="current-lesson-list">
                <CurrentLessonPicker subject="chinese" />
                <CurrentLessonPicker subject="math" />
                <CurrentLessonPicker subject="english" />
              </div>
            </section>

            <section className="settings-card card">
              <div className="section-title">
                <h2>每周课程表</h2>
                <span className="section-aside">
                  <button type="button" className="text-link" onClick={resetTimetable}>
                    恢复默认
                  </button>
                </span>
              </div>
              <p className="settings-note">
                课表决定每天复习和预习哪些科目。修改会立即保存，明天开始按新课表生成计划；今天已经生成的计划保持不变。
              </p>
              <div className="timetable-scroll">
                <div className="timetable-grid">
                  <span className="timetable-corner">节次</span>
                  {WEEKDAY_NAMES.map(day => (
                    <span key={day} className="timetable-day">
                      {day}
                    </span>
                  ))}
                  {PERIOD_NAMES.map((period, periodIndex) => (
                    <div key={period} className="timetable-row-contents">
                      <span className="timetable-period">{period}</span>
                      {WEEKDAY_NAMES.map((day, dayIndex) => {
                        const slot = state.timetable[dayIndex]?.[periodIndex] ?? null;
                        return (
                          <label key={`${day}-${period}`} className="timetable-cell">
                            <span className="sr-only">{day} {period}</span>
                            <select
                              value={slot ?? ''}
                              onChange={event =>
                                setTimetableCell(dayIndex, periodIndex, event.target.value)
                              }
                            >
                              {SLOT_OPTIONS.map(option => (
                                <option key={option.value || 'empty'} value={option.value}>
                                  {option.label}
                                </option>
                              ))}
                            </select>
                          </label>
                        );
                      })}
                    </div>
                  ))}
                </div>
              </div>
              <p className="field-hint">“其他”表示这一节不安排语数英任务；留空表示没有课。</p>
            </section>

            <section className="settings-card card">
              <div className="section-title">
                <h2>云端同步</h2>
                <span className="section-aside"><SyncBadge /></span>
              </div>
              <div className="sync-grid">
                <div>
                  <span>当前状态</span>
                  <b>{SYNC_LABEL[syncStatus] ?? syncStatus}</b>
                </div>
                <div>
                  <span>上次同步</span>
                  <b>{formatWhen(device.lastSyncedAt)}</b>
                </div>
                <div>
                  <span>云端版本</span>
                  <b>第 {device.revision} 版</b>
                </div>
                <div>
                  <span>本机待同步</span>
                  <b>{device.dirty ? '有改动待上传' : '没有待上传改动'}</b>
                </div>
              </div>
              {syncError && (
                <div className="gentle-note warn">
                  <Icon name="alert" size={15} />
                  <span>{ERROR_LABEL[syncError] ?? `同步提示：${syncError}`}</span>
                </div>
              )}
              <p className="settings-note">
                两台设备同时修改时，不会自动合并。应用会停下来，请家长选择使用云端版本或用本机版本覆盖。
              </p>
              <div className="settings-actions">
                <button
                  type="button"
                  className="btn btn-soft"
                  disabled={syncStatus === 'syncing'}
                  onClick={() => void syncNow()}
                >
                  <Icon name="refresh" size={16} />
                  立即同步
                </button>
                <button type="button" className="btn btn-ghost" onClick={exportData}>
                  <Icon name="download" size={16} />
                  导出备份
                </button>
                <label className="btn btn-ghost file-button">
                  <Icon name="upload" size={16} />
                  导入备份
                  <input
                    type="file"
                    accept="application/json,.json"
                    onChange={event => {
                      const file = event.target.files?.[0];
                      void handleImport(file);
                      event.target.value = '';
                    }}
                  />
                </label>
              </div>
            </section>

            <section className="settings-card card">
              <div className="section-title">
                <h2>家长账号</h2>
                <span className="section-aside">{parentAccount ? '已登录' : '未登录'}</span>
              </div>
              {parentAccount ? (
                <>
                  <div className="sync-grid">
                    <div>
                      <span>当前账号</span>
                      <b>{parentAccount.username}</b>
                    </div>
                    <div>
                      <span>同步状态</span>
                      <b>{SYNC_LABEL[syncStatus] ?? syncStatus}</b>
                    </div>
                  </div>
                  <p className="settings-note">
                    登录后，这台设备的学习记录会与云端保持同步。退出登录不会删除本机数据，
                    待同步的改动会等家长重新登录后再上传。
                  </p>
                  <div className="settings-actions">
                    <button
                      type="button"
                      className="btn btn-ghost"
                      disabled={authBusy}
                      onClick={() => void handleLogout()}
                    >
                      退出登录
                    </button>
                  </div>
                </>
              ) : (
                <>
                  <p className="settings-note">
                    登录家长账号后，这台设备的学习记录会与云端同步；换新设备时登录同一个账号即可接上。
                    账号由家长注册和保管，孩子日常使用不需要登录。
                  </p>
                  <div className="pin-change">
                    <div className="segmented" role="tablist" aria-label="家长账号操作">
                      <button
                        type="button"
                        role="tab"
                        aria-selected={authMode === 'login'}
                        className={authMode === 'login' ? 'seg active' : 'seg'}
                        onClick={() => {
                          setAuthMode('login');
                          setAuthError('');
                        }}
                      >
                        登录
                      </button>
                      <button
                        type="button"
                        role="tab"
                        aria-selected={authMode === 'register'}
                        className={authMode === 'register' ? 'seg active' : 'seg'}
                        onClick={() => {
                          setAuthMode('register');
                          setAuthError('');
                        }}
                      >
                        注册新账号
                      </button>
                    </div>
                    <div className="settings-row">
                      <label className="text-field">
                        <span>用户名</span>
                        <input
                          value={authUsername}
                          maxLength={32}
                          autoComplete="username"
                          disabled={authBusy}
                          onChange={event => setAuthUsername(event.target.value)}
                        />
                      </label>
                      <label className="text-field">
                        <span>密码</span>
                        <input
                          type="password"
                          value={authPassword}
                          autoComplete={
                            authMode === 'login' ? 'current-password' : 'new-password'
                          }
                          disabled={authBusy}
                          onChange={event => setAuthPassword(event.target.value)}
                          onKeyDown={event => {
                            if (event.key === 'Enter') void submitAuth();
                          }}
                        />
                      </label>
                    </div>
                    <div className="settings-actions">
                      <button
                        type="button"
                        className="btn btn-soft"
                        disabled={authBusy}
                        onClick={() => void submitAuth()}
                      >
                        {authMode === 'login' ? '登录' : '注册并登录'}
                      </button>
                    </div>
                    {authError ? <p className="field-error">{authError}</p> : null}
                    <p className="field-hint">
                      {authMode === 'login'
                        ? '用户名 3-32 位，可用小写字母、数字、下划线和短横线。'
                        : '注册会创建一个家庭账号；用户名 3-32 位，密码至少 8 位。'}
                    </p>
                  </div>
                </>
              )}
            </section>

            <section className="settings-card card">
              <div className="section-title">
                <h2>本机家长 PIN</h2>
                <span className="section-aside">{device.pinHash ? '已设置' : '未设置'}</span>
              </div>
              <p className="settings-note">
                PIN 用来保护这台设备上的家长设置与周报。它只保存在本机，不会同步，也不是账号密码。
                换一台设备时，需要在那台设备上重新设置一次。
              </p>
              <div className="pin-change">
                <CreatePinForm
                  onCreate={async pin => {
                    await configurePin(pin);
                    notify('本机家长 PIN 已更新。');
                  }}
                  submitLabel="更新本机 PIN"
                />
              </div>
            </section>
          </div>

          <aside className="settings-rail">
            <section className="card settings-rail-card">
              <span className="rail-icon">
                <Icon name="lock" size={18} />
              </span>
              <div>
                <b>数据边界</b>
                <p>
                  云端保存在你们家庭自己的服务器上，家人共用家长注册的一个账号。云端只保存昵称和学习记录，
                  不采集真实姓名、学校、班级、位置或设备标识。
                </p>
                <p>
                  同步走家长账号登录校验，密码加密存储；服务器由自己家庭部署和保管，
                  不经过任何第三方平台。
                </p>
              </div>
            </section>

            <section className="card settings-rail-card">
              <span className="rail-icon">
                <Icon name="download" size={18} />
              </span>
              <div>
                <b>留一份自己的备份</b>
                <p>
                  建议每周导出一次 JSON。万一云端数据被误改，可以用备份恢复学习记录、奖励和宠物状态。
                </p>
              </div>
            </section>

            <section className="card settings-rail-card quiet">
              <span className="rail-icon">
                <Icon name="book" size={18} />
              </span>
              <div>
                <b>内容校对</b>
                <p>
                  知识点与题目依据二年级上册教材整理，属于辅助内容。若与孩子的课本有出入，
                  请以课本为准。内容数据可以单独修订，不需要改动功能。
                </p>
              </div>
            </section>
          </aside>
        </div>
      </PinGate>

      {pendingImport ? (
        <BackupImportDialog
          pending={pendingImport}
          busy={importBusy}
          onCancel={() => setPendingImport(null)}
          onConfirm={confirmImport}
        />
      ) : null}
    </div>
  );
}
