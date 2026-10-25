/**
 * Best-effort cloud audit for security events (docs/02 §3.4). The local
 * recordSecurityEvent() (localStorage) stays the source of truth; the cloud
 * copy only happens when authenticated, is queued while offline and flushed
 * later. Every failure is silent — audit upload must never break local use.
 */
import { getAccessToken } from './auth';

const OUTBOX_KEY = 'xiaotao-security-events-outbox-v1';
const OUTBOX_LIMIT = 20;

export type CloudSecurityEventType = 'pin-reset';

interface OutboxItem {
  type: CloudSecurityEventType;
  detail?: string;
}

function readOutbox(): OutboxItem[] {
  try {
    const raw = localStorage.getItem(OUTBOX_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as unknown;
    if (!Array.isArray(parsed)) return [];
    return parsed.filter(
      (item): item is OutboxItem =>
        typeof item === 'object' &&
        item !== null &&
        typeof (item as OutboxItem).type === 'string',
    );
  } catch {
    return [];
  }
}

function writeOutbox(items: OutboxItem[]): void {
  try {
    localStorage.setItem(OUTBOX_KEY, JSON.stringify(items));
  } catch {
    // Storage unavailable in private browsing; the local event log still has it.
  }
}

/** Sends queued events in order; stops and keeps the queue on first failure. */
export async function flushSecurityEvents(): Promise<void> {
  const token = getAccessToken();
  if (!token) return;
  const remaining = readOutbox();
  let sentAny = false;
  while (remaining.length > 0) {
    const item = remaining[0];
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 8000);
    let delivered = false;
    try {
      const response = await fetch('/api/v1/security-events', {
        method: 'POST',
        credentials: 'same-origin',
        signal: controller.signal,
        headers: {
          'content-type': 'application/json',
          accept: 'application/json',
          authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(item),
      });
      delivered = response.ok;
    } catch {
      delivered = false;
    } finally {
      clearTimeout(timer);
    }
    if (!delivered) break;
    remaining.shift();
    sentAny = true;
  }
  if (sentAny) writeOutbox(remaining);
}

export function reportSecurityEvent(type: CloudSecurityEventType, detail?: string): void {
  const item: OutboxItem = detail === undefined ? { type } : { type, detail };
  writeOutbox([...readOutbox(), item].slice(-OUTBOX_LIMIT));
  void flushSecurityEvents();
}
