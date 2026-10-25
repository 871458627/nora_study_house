import { normalizeState, type SyncState } from './model';
import { CACHE_KEY, PIN_KEY, type PinFailures } from './pin';

export interface DeviceState {
  version: 2;
  pinHash: string;
  pinSalt: string;
  failures: PinFailures;
  revision: number;
  dirty: boolean;
  lastSyncedAt?: string;
  /** 浏览模式（docs/06 §3.10）：家长未登录时只许查看，学习动作由 LearnGate 锁死。 */
  visitor: boolean;
}

export function emptyDevice(): DeviceState {
  return {
    version: 2,
    pinHash: '',
    pinSalt: '',
    failures: { count: 0 },
    revision: 0,
    dirty: false,
    visitor: false,
  };
}

function storage(): Storage | null {
  try {
    return typeof localStorage === 'undefined' ? null : localStorage;
  } catch {
    return null;
  }
}

export function loadDevice(): DeviceState | null {
  const store = storage();
  if (!store) return null;
  try {
    const raw = store.getItem(PIN_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as Partial<DeviceState>;
    if (parsed.version !== 2 || typeof parsed.pinHash !== 'string') return null;
    return {
      ...emptyDevice(),
      ...parsed,
      version: 2,
      failures: {
        count: Number(parsed.failures?.count) || 0,
        lockedUntil:
          typeof parsed.failures?.lockedUntil === 'string' ? parsed.failures.lockedUntil : undefined,
      },
      revision: Math.max(0, Number(parsed.revision) || 0),
      dirty: parsed.dirty === true,
      visitor: parsed.visitor === true,
    };
  } catch {
    return null;
  }
}

export function saveDevice(device: DeviceState): void {
  try {
    storage()?.setItem(PIN_KEY, JSON.stringify(device));
  } catch {
    // Device-local storage may be unavailable in private browsing; the app
    // still works for the current session and reports sync state honestly.
  }
}

/** Clears the local PIN only; revision, dirty flag and learning data stay. */
export function withoutDevicePin(device: DeviceState): DeviceState {
  return {
    ...device,
    pinHash: '',
    pinSalt: '',
    failures: { count: 0 },
    visitor: false,
  };
}

export const SECURITY_EVENT_KEY = 'xiaotao-security-events-v1';

export interface SecurityEvent {
  type: 'pin-reset';
  at: string;
}

export function recordSecurityEvent(type: SecurityEvent['type'], now = new Date()): SecurityEvent[] {
  const event: SecurityEvent = { type, at: now.toISOString() };
  try {
    const store = storage();
    if (!store) return [event];
    const raw = store.getItem(SECURITY_EVENT_KEY);
    const parsed = raw ? (JSON.parse(raw) as unknown) : [];
    const events = Array.isArray(parsed)
      ? parsed.filter(
          (item): item is SecurityEvent =>
            typeof item === 'object' &&
            item !== null &&
            typeof (item as SecurityEvent).type === 'string' &&
            typeof (item as SecurityEvent).at === 'string',
        )
      : [];
    const next = [...events, event].slice(-20);
    store.setItem(SECURITY_EVENT_KEY, JSON.stringify(next));
    return next;
  } catch {
    return [event];
  }
}

export function loadCachedState(): SyncState | null {
  const store = storage();
  if (!store) return null;
  try {
    const raw = store.getItem(CACHE_KEY);
    if (!raw) return null;
    return normalizeState(JSON.parse(raw));
  } catch {
    return null;
  }
}

export function saveCachedState(state: SyncState): void {
  try {
    storage()?.setItem(CACHE_KEY, JSON.stringify(state));
  } catch {
    // Ignore quota or privacy-mode failures.
  }
}

export function clearLocalData(): void {
  try {
    storage()?.removeItem(CACHE_KEY);
    storage()?.removeItem(PIN_KEY);
  } catch {
    // No-op.
  }
}

export function exportBackup(state: SyncState): string {
  return JSON.stringify(
    {
      app: 'xiaotao-study-house',
      version: 2,
      exportedAt: new Date().toISOString(),
      state,
    },
    null,
    2,
  );
}

export interface BackupInspection {
  state: SyncState;
  exportedAt?: string;
}

export interface BackupSummary {
  done: number;
  stars: number;
  food: number;
  streak: number;
  petStage: 0 | 1 | 2;
  petFedDays: number;
  lessonCount: number;
}

export function inspectBackup(text: string): BackupInspection | null {
  try {
    const parsed = JSON.parse(text) as unknown;
    if (typeof parsed !== 'object' || parsed === null) return null;
    const record = parsed as Record<string, unknown>;
    const state = normalizeState(record.state ?? parsed);
    if (!state) return null;
    return {
      state,
      exportedAt: typeof record.exportedAt === 'string' ? record.exportedAt : undefined,
    };
  } catch {
    return null;
  }
}

export function summarizeBackup(state: SyncState): BackupSummary {
  return {
    done: Object.values(state.dailyLogs).reduce((total, log) => total + log.done.length, 0),
    stars: state.rewards.stars,
    food: state.rewards.food,
    streak: state.rewards.streak,
    petStage: state.pet.stage,
    petFedDays: state.pet.fedDays,
    lessonCount: Object.keys(state.lessons).length,
  };
}

export function parseBackup(text: string): SyncState | null {
  return inspectBackup(text)?.state ?? null;
}

export function downloadBackup(state: SyncState): void {
  const blob = new Blob([exportBackup(state)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `xiaotao-backup-${new Date().toISOString().slice(0, 10)}.json`;
  document.body.append(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
}
