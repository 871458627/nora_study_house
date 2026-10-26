import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useReducer,
  useRef,
  useState,
  type ReactNode,
} from 'react';
import { todayKey } from '../core/date';
import {
  createInitialState,
  normalizeState,
  type Grade,
  type Semester,
  type SyncState,
} from '../core/model';
import {
  createPinHash,
  failedAttempt,
  isPinLocked,
  lockRemainingMinutes,
  verifyPin,
  type PinFailures,
} from '../core/pin';
import { prepareState, appReducer, type AppAction } from '../core/state';
import {
  currentGradeKeyOf,
  gradeKeyOf,
  hasPack,
  setPack,
  type GradeKey,
} from '../data/content';
import { switchGradeRequest } from './auth';
import { saveGradeArchive, sliceIsNonEmpty, takeGradeArchive } from '../core/gradeArchive';
import {
  downloadBackup,
  emptyDevice,
  loadCachedState,
  loadDevice,
  parseBackup,
  saveCachedState,
  saveDevice,
  recordSecurityEvent,
  withoutDevicePin,
  type DeviceState,
  clearLocalData,
} from '../core/storage';
import {
  ConflictError,
  SyncError,
  configureSync,
  fetchRemote,
  pushRemote,
  type RemoteState,
} from '../core/sync';
import { decideBootstrap } from '../core/syncBoot';
import { clearPinUnlock, pinUnlockStore, rememberPinUnlock } from '../core/pinSession';
import {
  clearSession,
  currentAccount,
  getAccessToken,
  login as loginRequest,
  logout as logoutRequest,
  refreshSession,
  register as registerRequest,
  AuthError,
  type AuthAccount,
} from './auth';
import { clearOutbox,
  flushSecurityEvents, reportSecurityEvent } from './securityEvents';

// v2: inject the in-memory access token accessor once at startup (docs/02 §5.1-3).
configureSync({ getAccessToken });

export type SyncStatus = 'idle' | 'syncing' | 'synced' | 'offline' | 'conflict' | 'logged_out';
export type PinResult = 'ok' | 'wrong' | 'locked' | 'unset';
/** 首次绑定拉取的结果：adopted=已接上云端进度，empty=云端还没有数据（docs/06 §3.10）。 */
export type BindOutcome = 'adopted' | 'empty';

export interface ConflictInfo {
  remote: RemoteState;
  local: SyncState;
}

export interface Notice {
  id: number;
  text: string;
}

interface OnboardInput {
  nickname: string;
  dailyMinutes: number;
  pin: string;
}

interface AuthFormsInput {
  username: string;
  password: string;
}

interface AppContextValue {
  state: SyncState;
  device: DeviceState;
  ready: boolean;
  syncStatus: SyncStatus;
  syncError: string | null;
  conflict: ConflictInfo | null;
  conflictOpen: boolean;
  deferConflict: () => void;
  openConflict: () => void;
  notice: Notice | null;
  notify: (text: string) => void;
  dispatchLocal: (action: AppAction) => void;
  onboard: (input: OnboardInput) => Promise<void>;
  configurePin: (pin: string) => Promise<void>;
  unlockParentSession: () => void;
  resetPin: () => void;
  verifyDevicePin: (pin: string) => Promise<PinResult>;
  pinLockMinutes: () => number;
  resolveConflict: (choice: 'cloud' | 'local') => Promise<void>;
  syncNow: () => Promise<void>;
  exportData: () => void;
  importData: (text: string) => boolean;
  parentAccount: AuthAccount | null;
  parentLogin: (input: AuthFormsInput) => Promise<void>;
  parentRegister: (input: AuthFormsInput) => Promise<void>;
  parentLogout: (mode?: 'keep' | 'wipe') => Promise<void>;
  bindLogin: (input: AuthFormsInput) => Promise<BindOutcome>;
  bindRegister: (input: AuthFormsInput) => Promise<BindOutcome>;
  bindPull: () => Promise<BindOutcome>;
  /** 产品规则（docs/06 §3.10）：家长未登录 = 只可浏览，学习动作锁死。 */
  canLearn: boolean;
  enterVisitor: () => void;
  exitVisitor: () => void;
  /** 年级切换（docs/12 v1.1）：服务端封存/恢复，返回后换内容包并重生成计划。 */
  switchGrade: (grade: Grade, semester: Semester) => Promise<void>;
  gradeSwitching: boolean;
}

const AppContext = createContext<AppContextValue | null>(null);

export function useApp(): AppContextValue {
  const context = useContext(AppContext);
  if (!context) throw new Error('useApp must be used inside AppProvider');
  return context;
}

export function AppProvider({ children }: { children: ReactNode }) {
  const [initialCache] = useState(() => loadCachedState());
  const [state, dispatch] = useReducer(appReducer, initialCache ?? createInitialState());
  const [device, setDevice] = useState<DeviceState>(() => loadDevice() ?? emptyDevice());
  const [ready, setReady] = useState(() => Boolean(initialCache?.onboarded));
  const [syncStatus, setSyncStatus] = useState<SyncStatus>('idle');
  const [syncError, setSyncError] = useState<string | null>(null);
  const [conflict, setConflict] = useState<ConflictInfo | null>(null);
  const [conflictOpen, setConflictOpen] = useState(false);
  const [notice, setNotice] = useState<Notice | null>(null);
  const [parentAccount, setParentAccount] = useState<AuthAccount | null>(() => currentAccount());
  const parentAccountRef = useRef<AuthAccount | null>(parentAccount);
  useEffect(() => {
    parentAccountRef.current = parentAccount;
  }, [parentAccount]);

  const stateRef = useRef(state);
  const deviceRef = useRef(device);
  const conflictRef = useRef(conflict);
  const pushTimerRef = useRef<number | null>(null);
  const pushInFlightRef = useRef(false);
  const pushAgainRef = useRef(false);
  const bootedRef = useRef(false);
  const loggedOutRef = useRef(false);
  const pushNowRef = useRef<() => Promise<void>>(async () => {});
  const noticeTimerRef = useRef<number | null>(null);

  useEffect(() => {
    stateRef.current = state;
    saveCachedState(state);
  }, [state]);

  useEffect(() => {
    deviceRef.current = device;
  }, [device]);

  useEffect(() => {
    conflictRef.current = conflict;
  }, [conflict]);

  const updateDevice = useCallback((patch: Partial<DeviceState>) => {
    const next = { ...deviceRef.current, ...patch };
    deviceRef.current = next;
    saveDevice(next);
    setDevice(next);
  }, []);

  const markDirty = useCallback(() => {
    if (!deviceRef.current.dirty) updateDevice({ dirty: true });
  }, [updateDevice]);

  const notify = useCallback((text: string) => {
    const id = Date.now();
    setNotice({ id, text });
    if (noticeTimerRef.current) window.clearTimeout(noticeTimerRef.current);
    noticeTimerRef.current = window.setTimeout(() => {
      setNotice(current => (current?.id === id ? null : current));
    }, 2800);
  }, []);

  const adoptRemote = useCallback(
    (remote: RemoteState) => {
      if (!remote.data) return;
      stateRef.current = remote.data;
      dispatch({ type: 'replace', state: remote.data });
      saveCachedState(remote.data);
      updateDevice({
        revision: remote.revision,
        dirty: false,
        lastSyncedAt: remote.updatedAt ?? new Date().toISOString(),
        visitor: false,
      });
      setSyncStatus('synced');
      setSyncError(null);
    },
    [updateDevice],
  );

  const prepareCurrent = useCallback(() => {
    const current = stateRef.current;
    if (!current.onboarded) return;
    const next = prepareState(current, todayKey());
    if (next === current) return;
    stateRef.current = next;
    dispatch({ type: 'replace', state: next });
    saveCachedState(next);
    markDirty();
  }, [markDirty]);

  const schedulePush = useCallback(() => {
    if (pushTimerRef.current) window.clearTimeout(pushTimerRef.current);
    pushTimerRef.current = window.setTimeout(() => {
      pushTimerRef.current = null;
      void pushNowRef.current();
    }, 800);
  }, []);

  /**
   * Silent renewal via the refresh cookie (docs/02 §5.2-1). 'anonymous'
   * means the server rejected the cookie (401) — a real logged-out state;
   * network errors stay 'network-error' so offline devices are not asked
   * to log in.
   */
  const attemptRefresh = useCallback(async (): Promise<'ok' | 'anonymous' | 'network-error'> => {
    try {
      await refreshSession();
      setParentAccount(currentAccount());
      void flushSecurityEvents();
      return 'ok';
    } catch (error) {
      if (error instanceof AuthError && error.status === 401) {
        clearSession();
        setParentAccount(null);
        return 'anonymous';
      }
      return 'network-error';
    }
  }, []);

  /**
   * Shared 401-family handling (docs/02 §5.2-2): auth gone maps to the new
   * 'logged_out' status instead of 'offline', and never enters the offline
   * markDirty retry storm. Returns true when treated as offline.
   */
  const noteSyncFailure = useCallback((error: unknown): boolean => {
    const code = error instanceof SyncError ? error.code : 'sync_failed';
    const authGone =
      code === 'login_required' ||
      code === 'invalid_token' ||
      code === 'refresh_reused' ||
      code === 'token_expired';
    if (authGone) {
      loggedOutRef.current = true;
      setParentAccount(null);
      setSyncError(code === 'token_expired' ? 'login_required' : code);
      setSyncStatus('logged_out');
      return false;
    }
    setSyncError(code);
    setSyncStatus('offline');
    return true;
  }, []);

  /**
   * Runs a sync operation; a 401 token_expired triggers one silent refresh
   * and exactly one retry (docs/02 §5.2-2). Auth-gone failures propagate so
   * noteSyncFailure can classify them; no retry loops.
   */
  const runWithAuthRetry = useCallback(
    async <T,>(operation: () => Promise<T>): Promise<T> => {
      try {
        return await operation();
      } catch (error) {
        if (!(error instanceof SyncError) || error.code !== 'token_expired') throw error;
        const outcome = await attemptRefresh();
        if (outcome === 'anonymous') throw new SyncError('login_required', 401);
        if (outcome === 'network-error') throw new SyncError('offline', 0);
        return await operation();
      }
    },
    [attemptRefresh],
  );

  const pushNow = useCallback(async () => {
    if (!stateRef.current.onboarded || conflictRef.current) return;
    if (loggedOutRef.current) {
      setSyncStatus('logged_out');
      return;
    }
    if (pushInFlightRef.current) {
      pushAgainRef.current = true;
      return;
    }
    pushInFlightRef.current = true;
    setSyncStatus('syncing');
    const snapshot = stateRef.current;
    try {
      const remote = await runWithAuthRetry(() =>
        pushRemote(snapshot, deviceRef.current.revision),
      );
      const changedDuring = stateRef.current.updatedAt !== snapshot.updatedAt;
      updateDevice({
        revision: remote.revision,
        dirty: changedDuring,
        lastSyncedAt: remote.updatedAt ?? new Date().toISOString(),
      });
      setSyncError(null);
      setSyncStatus(changedDuring ? 'idle' : 'synced');
      if (changedDuring) schedulePush();
    } catch (error) {
      if (error instanceof ConflictError) {
        const info: ConflictInfo = { remote: error.remote, local: stateRef.current };
        conflictRef.current = info;
        setConflict(info);
        setConflictOpen(true);
        setSyncStatus('conflict');
      } else if (noteSyncFailure(error)) {
        markDirty();
      }
    } finally {
      pushInFlightRef.current = false;
      if (pushAgainRef.current) {
        pushAgainRef.current = false;
        if (!conflictRef.current) schedulePush();
      }
    }
  }, [markDirty, noteSyncFailure, runWithAuthRetry, schedulePush, updateDevice]);

  pushNowRef.current = pushNow;

  const pullOnce = useCallback(async () => {
    if (!stateRef.current.onboarded || conflictRef.current || pushInFlightRef.current) return;
    if (loggedOutRef.current) return;
    if (deviceRef.current.dirty) return;
    try {
      setSyncStatus('syncing');
      const remote = await runWithAuthRetry(() => fetchRemote());
      setSyncError(null);
      if (remote.data && remote.revision > deviceRef.current.revision) {
        adoptRemote(remote);
        return;
      }
      if (!remote.data && deviceRef.current.revision === 0) {
        await pushNowRef.current();
        return;
      }
      setSyncStatus('synced');
    } catch (error) {
      noteSyncFailure(error);
    }
  }, [adoptRemote, noteSyncFailure, runWithAuthRetry]);

  // 内容包与 state.grade/semester 保持一致（必须在 bootstrap 之前声明，保证首帧 prepareState 用对包）。
  const gradeKey: GradeKey = currentGradeKeyOf(state.grade ?? 2, state.semesterOverride);
  useEffect(() => {
    setPack(gradeKey);
  }, [gradeKey]);

  useEffect(() => {
    if (bootedRef.current) return;
    bootedRef.current = true;

    const bootstrap = async () => {
      // v2 (docs/02 §5.2-1): silent refresh first. A rejected cookie means
      // "not logged in": local cache still renders, ready is still set and
      // no push is scheduled — offline-first is untouched.
      const outcome = await attemptRefresh();
      if (outcome === 'anonymous') {
        loggedOutRef.current = true;
        setSyncStatus('logged_out');
        setSyncError(null);
      }

      let remote: RemoteState | null = null;
      if (outcome !== 'anonymous') {
        try {
          remote = await fetchRemote();
          setSyncError(null);
        } catch (error) {
          noteSyncFailure(error);
        }
      }

      const decision = decideBootstrap({
        hasRemote: Boolean(remote?.data),
        localOnboarded: stateRef.current.onboarded,
        localDirty: deviceRef.current.dirty,
        localRevision: deviceRef.current.revision,
        remoteRevision: remote?.revision ?? 0,
      });

      if (decision === 'conflict' && remote?.data) {
        const info: ConflictInfo = { remote, local: stateRef.current };
        conflictRef.current = info;
        setConflict(info);
        setConflictOpen(true);
        setSyncStatus('conflict');
        setReady(true);
        return;
      }

      if (decision === 'adopt-remote' && remote?.data) {
        adoptRemote(remote);
      }

      prepareCurrent();
      setReady(true);
      if (stateRef.current.onboarded && !loggedOutRef.current) {
        if (decision === 'keep-local' || deviceRef.current.dirty) {
          setSyncStatus('syncing');
          schedulePush();
        }
      }
    };

    void bootstrap();
  }, [adoptRemote, attemptRefresh, noteSyncFailure, prepareCurrent, schedulePush]);

  useEffect(() => {
    const onVisible = () => {
      if (document.visibilityState === 'visible') void pullOnce();
    };
    const onOnline = () => {
      void flushSecurityEvents();
      if (!stateRef.current.onboarded) return;
      if (deviceRef.current.dirty) {
        void pushNowRef.current();
      } else {
        void pullOnce();
      }
    };
    document.addEventListener('visibilitychange', onVisible);
    window.addEventListener('online', onOnline);
    const ticker = window.setInterval(() => {
      if (!stateRef.current.onboarded) return;
      const current = stateRef.current;
      const next = prepareState(current, todayKey());
      if (next !== current) {
        stateRef.current = next;
        dispatch({ type: 'replace', state: next });
        saveCachedState(next);
        markDirty();
        schedulePush();
      }
    }, 60_000);
    return () => {
      document.removeEventListener('visibilitychange', onVisible);
      window.removeEventListener('online', onOnline);
      window.clearInterval(ticker);
      if (pushTimerRef.current) window.clearTimeout(pushTimerRef.current);
      if (noticeTimerRef.current) window.clearTimeout(noticeTimerRef.current);
    };
  }, [markDirty, pullOnce, schedulePush]);

  const dispatchLocal = useCallback(
    (action: AppAction) => {
      dispatch(action);
      stateRef.current = appReducer(stateRef.current, action);
      markDirty();
      schedulePush();
    },
    [markDirty, schedulePush],
  );

  const configurePin = useCallback(
    async (pin: string) => {
      const { pinHash, pinSalt } = await createPinHash(pin);
      updateDevice({ pinHash, pinSalt, failures: { count: 0 } });
    },
    [updateDevice],
  );

  /**
   * Opens the parent area on this device for the rest of the browser session.
   * Only called where the parent has just typed the PIN themselves (creating
   * it in PinGate, or resetting it), never during a child's first onboarding.
   */
  const unlockParentSession = useCallback(() => {
    rememberPinUnlock(pinUnlockStore());
  }, []);

  /**
   * Forgets the local PIN only. Learning data, revision and dirty state are
   * untouched; a new PIN must be set before the parent area opens again.
   */
  const resetPin = useCallback(() => {
    clearPinUnlock(pinUnlockStore());
    updateDevice(withoutDevicePin(deviceRef.current));
    recordSecurityEvent('pin-reset');
    // v2 (docs/02 §5.2-5): best-effort cloud audit copy; queued while
    // offline and flushed once the network is back. Never blocks local use.
    reportSecurityEvent('pin-reset');
  }, [updateDevice]);

  const onboard = useCallback(async ({ nickname, dailyMinutes, pin }: OnboardInput) => {
    await configurePin(pin);
    updateDevice({ visitor: false });
    dispatchLocal({ type: 'onboard', nickname, dailyMinutes, date: todayKey() });
  }, [configurePin, dispatchLocal, updateDevice]);

  const verifyDevicePin = useCallback(
    async (pin: string): Promise<PinResult> => {
      const current = deviceRef.current;
      if (!current.pinHash) return 'unset';
      if (isPinLocked(current.failures)) return 'locked';
      const ok = await verifyPin(pin, current.pinHash, current.pinSalt);
      if (ok) {
        updateDevice({ failures: { count: 0 } });
        return 'ok';
      }
      const failures: PinFailures = failedAttempt(current.failures);
      updateDevice({ failures });
      return isPinLocked(failures) ? 'locked' : 'wrong';
    },
    [updateDevice],
  );

  const pinLockMinutes = useCallback(() => lockRemainingMinutes(deviceRef.current.failures), []);

  /** Hide the dialog without resolving: local work stays dirty and no push runs. */
  const deferConflict = useCallback(() => {
    if (conflictRef.current) setConflictOpen(false);
  }, []);

  const openConflict = useCallback(() => {
    if (conflictRef.current) setConflictOpen(true);
  }, []);

  const resolveConflict = useCallback(
    async (choice: 'cloud' | 'local') => {
      const pending = conflictRef.current;
      if (!pending) return;
      conflictRef.current = null;
      setConflict(null);
      setConflictOpen(false);
      setSyncError(null);
      if (choice === 'cloud' && pending.remote.data) {
        adoptRemote(pending.remote);
        return;
      }
      updateDevice({ revision: pending.remote.revision, dirty: true });
      setSyncStatus('syncing');
      await pushNow();
    },
    [adoptRemote, pushNow, updateDevice],
  );

  const syncNow = useCallback(async () => {
    if (!stateRef.current.onboarded) return;
    if (deviceRef.current.dirty || deviceRef.current.revision === 0) {
      await pushNow();
    } else {
      await pullOnce();
    }
  }, [pullOnce, pushNow]);

  /** Clears the logged-out gate and resumes the suspended sync (docs/02 §5.2-2). */
  const resumeSyncAfterLogin = useCallback(() => {
    loggedOutRef.current = false;
    void flushSecurityEvents();
    if (!stateRef.current.onboarded) return;
    if (deviceRef.current.dirty || deviceRef.current.revision === 0) {
      void pushNowRef.current();
    } else {
      void pullOnce();
    }
  }, [pullOnce]);

  /**
   * 首次绑定的拉取（docs/06 §3.10）：登录成功且本机尚未初始化时立即取云端，
   * 走一次 bootstrap 式 adopt——有数据直接接上（跳过昵称引导，只补本机 PIN），
   * 没数据回到称呼步。失败原样抛出，由绑定卡片行内提示并保留「先离线使用」兜底。
   * 注意它不等同于 resumeSyncAfterLogin：此刻本地未 onboarded，不能推送。
   */
  const bindPull = useCallback(async (): Promise<BindOutcome> => {
    const remote = await runWithAuthRetry(() => fetchRemote());
    if (remote.data) {
      adoptRemote(remote);
      return 'adopted';
    }
    return 'empty';
  }, [adoptRemote, runWithAuthRetry]);

  const bindLogin = useCallback(
    async ({ username, password }: AuthFormsInput): Promise<BindOutcome> => {
      await loginRequest(username, password);
      setParentAccount(currentAccount());
      loggedOutRef.current = false;
      void flushSecurityEvents();
      return await bindPull();
    },
    [bindPull],
  );

  /** 注册必然创建新家庭，云端必为空——直接回称呼步，不发起拉取。 */
  const bindRegister = useCallback(
    async ({ username, password }: AuthFormsInput): Promise<BindOutcome> => {
      await registerRequest(username, password);
      setParentAccount(currentAccount());
      loggedOutRef.current = false;
      void flushSecurityEvents();
      return 'empty';
    },
    [],
  );

  /**
   * 浏览模式（docs/06 §3.10）：家长未登录时只许查看系统功能，学习动作由
   * LearnGate 锁死。标记在设备态持久化；绑定接上云端或完成引导时自动清除，
   * 「去登录」入口走 exitVisitor 回到引导第一屏。
   */
  const enterVisitor = useCallback(() => {
    updateDevice({ visitor: true });
  }, [updateDevice]);

  const exitVisitor = useCallback(() => {
    updateDevice({ visitor: false });
  }, [updateDevice]);

  const [gradeSwitching, setGradeSwitching] = useState(false);
  // 双击防护必须用 ref：state 在同一渲染周期内不变，快速二连点会双双穿透。
  const gradeSwitchingRef = useRef(false);

  /**
   * 切换年级：服务端封存旧年级切片并恢复/新建目标年级 → 客户端换内容包 →
   * 采纳服务端 state（revision 由服务端推进）→ 重生成当日计划。
   * 语义（docs/12 §2.2）：切回曾用过的年级自动恢复存档，数据不丢。
   */
  const switchGrade = useCallback(
    async (grade: Grade, semester: Semester) => {
      if (gradeSwitchingRef.current) return;
      const fromKey = currentGradeKeyOf(stateRef.current.grade ?? 2, stateRef.current.semesterOverride);
      const toKey = gradeKeyOf(grade, semester);
      if (toKey === fromKey) return;
      if (!hasPack(toKey)) return;
      gradeSwitchingRef.current = true;
      setGradeSwitching(true);
      try {
        // 未登录家长账号：纯本机切换（docs/12 v1.2）——切片封存到本机、
        // 目标年级有本机存档则恢复。账号登录只影响云同步，不阻断切换。
        if (!parentAccountRef.current) {
          const current = stateRef.current;
          const slice = {
            lessons: current.lessons,
            pointers: current.pointers,
            mistakes: current.mistakes,
            weakness: current.weakness,
            dictationQueue: current.dictationQueue,
          };
          if (sliceIsNonEmpty(slice)) saveGradeArchive(fromKey, slice);
          const restoredSlice = takeGradeArchive(toKey);
          const next: SyncState = {
            ...current,
            grade,
            semesterOverride: semester,
            lessons: (restoredSlice?.lessons as SyncState['lessons']) ?? {},
            pointers: (restoredSlice?.pointers as SyncState['pointers']) ?? { chinese: 0, math: 0, english: 0 },
            mistakes: (restoredSlice?.mistakes as SyncState['mistakes']) ?? [],
            weakness: (restoredSlice?.weakness as SyncState['weakness']) ?? {},
            dictationQueue: (restoredSlice?.dictationQueue as SyncState['dictationQueue']) ?? {},
            updatedAt: new Date().toISOString(),
          };
          setPack(toKey);
          stateRef.current = next;
          dispatch({ type: 'replace', state: next });
          saveCachedState(next);
          notify(restoredSlice ? '已切回，进度接续如初。' : '新教材准备好了！');
          return;
        }
        const result = await switchGradeRequest(grade, semester, fromKey);
        const next = normalizeState(result.state);
        if (!next) throw new Error('invalid state from grade switch');
        setPack(toKey);
        stateRef.current = next;
        dispatch({ type: 'replace', state: next });
        saveCachedState(next);
        updateDevice({ revision: result.revision, dirty: false, lastSyncedAt: result.updatedAt });
        setSyncStatus('synced');
        setSyncError(null);
        notify(result.restored ? '已切回，进度接续如初。' : '新教材准备好了！');
      } finally {
        gradeSwitchingRef.current = false;
        setGradeSwitching(false);
      }
    },
    [notify, updateDevice],
  );

  const parentLogin = useCallback(
    async ({ username, password }: AuthFormsInput) => {
      await loginRequest(username, password);
      setParentAccount(currentAccount());
      resumeSyncAfterLogin();
    },
    [resumeSyncAfterLogin],
  );

  const parentRegister = useCallback(
    async ({ username, password }: AuthFormsInput) => {
      await registerRequest(username, password);
      setParentAccount(currentAccount());
      resumeSyncAfterLogin();
    },
    [resumeSyncAfterLogin],
  );

  /**
   * 退出登录的两种模式（2026-10-25 换账号需求）：
   * - keep（默认，docs/02 §5.2-2）：学习数据与 dirty 标记留在本机，挂起的
   *   推送等家长重新登录后继续——仅适合同一家庭在同一设备重新登录；
   * - wipe（换账号）：学习数据缓存、设备态（PIN + 同步簿记）、安全事件
   *   队列全部清除，回到引导页由新的家长账号干净绑定。不做 wipe 的话，
   *   下一账号登录时 bootstrap 会把本机（上一家庭的）数据推入其云端，
   *   造成跨家庭数据串号。
   */
  const parentLogout = useCallback(async (mode: 'keep' | 'wipe' = 'keep') => {
    await logoutRequest();
    setParentAccount(null);
    loggedOutRef.current = true;
    setSyncError(null);
    if (mode === 'wipe') {
      clearOutbox();
      clearLocalData();
      const freshDevice = emptyDevice();
      deviceRef.current = freshDevice;
      setDevice(freshDevice);
      const freshState = createInitialState();
      stateRef.current = freshState;
      dispatch({ type: 'replace', state: freshState });
      setSyncStatus('idle');
      return;
    }
    setSyncStatus('logged_out');
  }, []);

  const exportData = useCallback(() => {
    downloadBackup(stateRef.current);
  }, []);

  const importData = useCallback(
    (text: string) => {
      const parsed = parseBackup(text);
      if (!parsed) return false;
      const next = prepareState(parsed, todayKey());
      stateRef.current = next;
      dispatch({ type: 'replace', state: next });
      saveCachedState(next);
      markDirty();
      schedulePush();
      return true;
    },
    [markDirty, schedulePush],
  );

  const value = useMemo<AppContextValue>(
    () => ({
      state,
      device,
      ready,
      syncStatus,
      syncError,
      conflict,
      conflictOpen,
      deferConflict,
      openConflict,
      notice,
      notify,
      dispatchLocal,
      onboard,
      configurePin,
      unlockParentSession,
      resetPin,
      verifyDevicePin,
      pinLockMinutes,
      resolveConflict,
      syncNow,
      exportData,
      importData,
      parentAccount,
      parentLogin,
      parentRegister,
      parentLogout,
      bindLogin,
      bindRegister,
      bindPull,
      // 学习解锁必须同时满足「已登录」和「本机已初始化」：拉取失败的设备虽已
      // 拿到 token，但还不知道云端家庭状态，放行学习会绕过绑定制造冲突。
      // 学习照常（docs/12 v1.2 口径）：账号登录只影响云同步与多设备，不阻断学习。
      canLearn: state.onboarded,
      enterVisitor,
      exitVisitor,
      switchGrade,
      gradeSwitching,
    }),
    [
      state,
      device,
      ready,
      syncStatus,
      syncError,
      conflict,
      conflictOpen,
      deferConflict,
      openConflict,
      notice,
      notify,
      dispatchLocal,
      onboard,
      configurePin,
      unlockParentSession,
      resetPin,
      verifyDevicePin,
      pinLockMinutes,
      resolveConflict,
      syncNow,
      exportData,
      importData,
      parentAccount,
      parentLogin,
      parentRegister,
      parentLogout,
      bindLogin,
      bindRegister,
      bindPull,
      enterVisitor,
      exitVisitor,
      switchGrade,
      gradeSwitching,
    ],
  );

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}
