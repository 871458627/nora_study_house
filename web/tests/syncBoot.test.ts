import { describe, expect, it } from 'vitest';
import { decideBootstrap, type BootstrapInput } from '../src/core/syncBoot';

function input(overrides: Partial<BootstrapInput> = {}): BootstrapInput {
  return {
    hasRemote: true,
    localOnboarded: true,
    localDirty: false,
    localRevision: 1,
    remoteRevision: 1,
    ...overrides,
  };
}

describe('decideBootstrap', () => {
  it('pushes dirty local work instead of a false conflict at the same revision', () => {
    expect(decideBootstrap(input({ localDirty: true }))).toBe('keep-local');
  });

  it('offers a choice when remote is newer and local is dirty', () => {
    expect(
      decideBootstrap(input({ localDirty: true, localRevision: 1, remoteRevision: 2 })),
    ).toBe('conflict');
  });

  it('keeps dirty local changes when remote is older', () => {
    expect(
      decideBootstrap(input({ localDirty: true, localRevision: 2, remoteRevision: 1 })),
    ).toBe('keep-local');
  });

  it('adopts remote for a fresh device', () => {
    expect(
      decideBootstrap(input({ localOnboarded: false, localRevision: 0, remoteRevision: 3 })),
    ).toBe('adopt-remote');
  });

  it('adopts newer remote when local is clean', () => {
    expect(decideBootstrap(input({ localRevision: 1, remoteRevision: 2 }))).toBe('adopt-remote');
  });

  it('adopts matching remote when local is clean', () => {
    expect(decideBootstrap(input({ localRevision: 2, remoteRevision: 2 }))).toBe('adopt-remote');
  });

  it('keeps clean local data when remote is older', () => {
    expect(decideBootstrap(input({ localRevision: 3, remoteRevision: 2 }))).toBe('keep-local');
  });

  it('keeps local when there is no remote state', () => {
    expect(decideBootstrap(input({ hasRemote: false, localDirty: true }))).toBe('keep-local');
  });
});
