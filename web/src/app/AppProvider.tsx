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
} from '../core/storage';
import {
  ConflictError,
  SyncError,
  fetchRemote,
  pushRemote,
  type RemoteState,
} from '../core/sync';
import { decideBootstrap } from '../core/syncBoot';
import { clearPinUnlock, pinUnlockStore, rememberPinUnlock } from '../core/pinSession';

export type SyncStatus = 'idle' | 'syncing' | 'synced' | 'offline' | 'conflict';
export type PinResult = 'ok' | 'wrong' | 'locked' | 'unset';

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

  const stateRef = useRef(state);
  const deviceRef = useRef(device);
  const conflictRef = useRef(conflict);
  const pushTimerRef = useRef<number | null>(null);
  const pushInFlightRef = useRef(false);
  const pushAgainRef = useRef(false);
  const bootedRef = useRef(false);
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

  const pushNow = useCallback(async () => {
    if (!stateRef.current.onboarded || conflictRef.current) return;
    if (pushInFlightRef.current) {
      pushAgainRef.current = true;
      return;
    }
    pushInFlightRef.current = true;
    setSyncStatus('syncing');
    const snapshot = stateRef.current;
    try {
      const remote = await pushRemote(snapshot, deviceRef.current.revision);
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
      } else {
        const code = error instanceof SyncError ? error.code : 'sync_failed';
        setSyncError(code);
        setSyncStatus('offline');
        markDirty();
      }
    } finally {
      pushInFlightRef.current = false;
      if (pushAgainRef.current) {
        pushAgainRef.current = false;
        if (!conflictRef.current) schedulePush();
      }
    }
  }, [markDirty, schedulePush, updateDevice]);

  pushNowRef.current = pushNow;

  const pullOnce = useCallback(async () => {
    if (!stateRef.current.onboarded || conflictRef.current || pushInFlightRef.current) return;
    if (deviceRef.current.dirty) return;
    try {
      setSyncStatus('syncing');
      const remote = await fetchRemote();
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
      setSyncError(error instanceof SyncError ? error.code : 'sync_failed');
      setSyncStatus('offline');
    }
  }, [adoptRemote]);

  useEffect(() => {
    if (bootedRef.current) return;
    bootedRef.current = true;

    const bootstrap = async () => {
      let remote: RemoteState | null = null;
      try {
        remote = await fetchRemote();
        setSyncError(null);
      } catch (error) {
        setSyncError(error instanceof SyncError ? error.code : 'sync_failed');
        setSyncStatus('offline');
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
      if (stateRef.current.onboarded) {
        if (decision === 'keep-local' || deviceRef.current.dirty) {
          setSyncStatus('syncing');
          schedulePush();
        }
      }
    };

    void bootstrap();
  }, [adoptRemote, prepareCurrent, schedulePush]);

  useEffect(() => {
    const onVisible = () => {
      if (document.visibilityState === 'visible') void pullOnce();
    };
    const onOnline = () => {
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
  }, [updateDevice]);

  const onboard = useCallback(async ({ nickname, dailyMinutes, pin }: OnboardInput) => {
    await configurePin(pin);
    dispatchLocal({ type: 'onboard', nickname, dailyMinutes, date: todayKey() });
  }, [configurePin, dispatchLocal]);

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
    ],
  );

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}
