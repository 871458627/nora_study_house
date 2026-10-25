export type BootstrapAction = 'adopt-remote' | 'conflict' | 'keep-local';

export interface BootstrapInput {
  hasRemote: boolean;
  localOnboarded: boolean;
  localDirty: boolean;
  localRevision: number;
  remoteRevision: number;
}

/**
 * Decides what the first load should do with a remote snapshot.
 *
 * Local unsynced work is never discarded silently. Equal revisions are *not*
 * a conflict: the remote revision only moves when a push succeeds, so equal
 * means nobody else changed anything and this device is strictly ahead. Its
 * pending work is kept and pushed. If another device did write in between,
 * the CAS push answers 409 and the real conflict dialog appears there.
 */
export function decideBootstrap(input: BootstrapInput): BootstrapAction {
  if (!input.hasRemote) return 'keep-local';
  if (!input.localOnboarded) return 'adopt-remote';
  if (input.localDirty) {
    return input.remoteRevision > input.localRevision ? 'conflict' : 'keep-local';
  }
  return input.remoteRevision >= input.localRevision ? 'adopt-remote' : 'keep-local';
}
