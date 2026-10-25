import { normalizeState, type SyncState } from './model';

export interface RemoteState {
  data: SyncState | null;
  revision: number;
  updatedAt?: string;
}

export class SyncError extends Error {
  code: string;
  status: number;

  constructor(code: string, status = 0) {
    super(code);
    this.name = 'SyncError';
    this.code = code;
    this.status = status;
  }
}

export class ConflictError extends SyncError {
  remote: RemoteState;

  constructor(remote: RemoteState) {
    super('revision_conflict', 409);
    this.name = 'ConflictError';
    this.remote = remote;
  }
}

interface ApiPayload {
  ok?: boolean;
  data?: unknown;
  revision?: unknown;
  updatedAt?: unknown;
  error?: { code?: string };
}

function payloadError(payload: ApiPayload | null, status: number): SyncError {
  const code =
    payload && typeof payload.error === 'object' && typeof payload.error?.code === 'string'
      ? payload.error.code
      : status === 401
        ? 'login_required'
        : status === 403
          ? 'forbidden'
          : status === 503
            ? 'service_unavailable'
            : 'sync_failed';
  return new SyncError(code, status);
}

async function readPayload(response: Response): Promise<ApiPayload | null> {
  try {
    return (await response.json()) as ApiPayload;
  } catch {
    return null;
  }
}

function payloadToRemote(payload: ApiPayload): RemoteState {
  const revision = Number(payload.revision);
  if (!Number.isSafeInteger(revision) || revision < 0) {
    throw new SyncError('invalid_response', 502);
  }
  const data = payload.data === null ? null : normalizeState(payload.data);
  if (payload.data !== null && !data) {
    throw new SyncError('invalid_state', 502);
  }
  return {
    data,
    revision,
    updatedAt: typeof payload.updatedAt === 'string' ? payload.updatedAt : undefined,
  };
}

async function request(input: RequestInfo, init: RequestInit): Promise<Response> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 8000);
  try {
    return await fetch(input, {
      credentials: 'same-origin',
      signal: controller.signal,
      ...init,
    });
  } catch {
    throw new SyncError('offline', 0);
  } finally {
    clearTimeout(timer);
  }
}

export async function fetchRemote(): Promise<RemoteState> {
  let response: Response;
  try {
    response = await request('/functions/v1/app?action=state', {
      method: 'GET',
      headers: { accept: 'application/json' },
    });
  } catch (error) {
    throw error instanceof SyncError ? error : new SyncError('offline', 0);
  }
  const payload = await readPayload(response);
  if (!response.ok || !payload?.ok) throw payloadError(payload, response.status);
  return payloadToRemote(payload);
}

export async function pushRemote(data: SyncState, baseRevision: number): Promise<RemoteState> {
  let response: Response;
  try {
    response = await request('/functions/v1/app?action=state', {
      method: 'POST',
      headers: { 'content-type': 'application/json', accept: 'application/json' },
      body: JSON.stringify({ data, baseRevision }),
    });
  } catch (error) {
    throw error instanceof SyncError ? error : new SyncError('offline', 0);
  }

  const payload = await readPayload(response);
  if (response.status === 409) {
    let remote: RemoteState;
    try {
      remote = payloadToRemote(payload ?? {});
    } catch {
      remote = { data: null, revision: baseRevision };
    }
    throw new ConflictError(remote);
  }
  if (!response.ok || !payload?.ok) throw payloadError(payload, response.status);
  return payloadToRemote(payload);
}
