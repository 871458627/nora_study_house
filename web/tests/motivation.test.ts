import { describe, expect, it } from 'vitest';
import { appReducer, initialState, prepareState } from '../src/core/state';
import { normalizeState } from '../src/core/model';
import type { SyncState } from '../src/core/model';

// 这份测试钉死激励体系（2026-10-25）：徽章图鉴 / 进化仪式 / 表扬信。
// 共同口径：奖励只跟努力有关；仪式与信件不改变任何学习数据。

function withStage(stage: 0 | 1 | 2, fedDays: number, stageSeen?: 0 | 1 | 2): SyncState {
  const base = initialState();
  return {
    ...base,
    pet: { ...base.pet, stage, fedDays, ...(stageSeen === undefined ? {} : { stageSeen }) },
  };
}

describe('激励体系 · 进化仪式（mark-stage-seen）', () => {
  it('首次标记：stageSeen 前进并写入成长相册', () => {
    const state = withStage(1, 14, 0);
    const next = appReducer(state, { type: 'mark-stage-seen', date: '2026-10-25' });
    expect(next.pet.stageSeen).toBe(1);
    expect(next.album).toHaveLength(1);
    expect(next.album[0]).toMatchObject({ date: '2026-10-25', day: 14, title: '长成少年桃啦' });
  });

  it('重复标记返回原 state（仪式只举行一次）', () => {
    const state = withStage(1, 14, 0);
    const once = appReducer(state, { type: 'mark-stage-seen', date: '2026-10-25' });
    expect(appReducer(once, { type: 'mark-stage-seen', date: '2026-10-25' })).toBe(once);
  });

  it('没有升级时（stage ≤ stageSeen）不产生纪念卡', () => {
    const state = withStage(1, 20, 1);
    expect(appReducer(state, { type: 'mark-stage-seen', date: '2026-10-25' })).toBe(state);
  });

  it('跨两级升级只记当前阶段，纪念卡上限 30 条', () => {
    let state = withStage(2, 42, 0);
    state = appReducer(state, { type: 'mark-stage-seen', date: '2026-10-25' });
    expect(state.album[0].title).toBe('长成大桃啦');
    for (let i = 0; i < 35; i++) {
      // 直接灌 35 条超出容量的历史（模拟长周期回放）
      state = { ...state, album: [...state.album, { date: '2026-01-01', day: i, title: '练习' }] };
    }
    const trimmed = appReducer(
      { ...state, pet: { ...state.pet, stage: 1, stageSeen: 0 } },
      { type: 'mark-stage-seen', date: '2026-10-26' },
    );
    expect(trimmed.album.length).toBeLessThanOrEqual(30);
  });

  it('onboard 播种「相遇」纪念卡（仅新家庭）', () => {
    const state = initialState();
    const next = appReducer(state, {
      type: 'onboard',
      nickname: '小桃',
      dailyMinutes: 25,
    });
    expect(next.album).toHaveLength(1);
    expect(next.album[0].title).toBe('和小桃相遇');
  });
});

describe('激励体系 · 表扬信（praise-add / read / remove）', () => {
  it('送出：去首尾空白、80 字截断、置顶插入、未读', () => {
    const state = initialState();
    const next = appReducer(state, { type: 'praise-add', text: '  今天口算全对，很用心！  ', date: '2026-10-25' });
    expect(next.praise).toHaveLength(1);
    expect(next.praise[0]).toMatchObject({
      text: '今天口算全对，很用心！',
      date: '2026-10-25',
      read: false,
    });
    expect(next.praise[0].id).toBeTruthy();
  });

  it('纯空白不送出；超长截到 80 字', () => {
    const state = initialState();
    expect(appReducer(state, { type: 'praise-add', text: '   ', date: '2026-10-25' })).toBe(state);
    const long = appReducer(state, { type: 'praise-add', text: '好'.repeat(120), date: '2026-10-25' });
    expect(long.praise[0].text).toHaveLength(80);
  });

  it('信箱上限 20 封（新的在前）', () => {
    let state = initialState();
    for (let i = 0; i < 25; i++) {
      state = appReducer(state, { type: 'praise-add', text: `信 ${i}`, date: '2026-10-25' });
    }
    expect(state.praise).toHaveLength(20);
    expect(state.praise[0].text).toBe('信 24');
  });

  it('拆信：全部置为已读；无未读时返回原 state', () => {
    let state = appReducer(initialState(), { type: 'praise-add', text: '真棒', date: '2026-10-25' });
    state = appReducer(state, { type: 'praise-read' });
    expect(state.praise.every(note => note.read)).toBe(true);
    expect(appReducer(state, { type: 'praise-read' })).toBe(state);
  });

  it('删除：按 id 移除；未知 id 返回原 state', () => {
    let state = appReducer(initialState(), { type: 'praise-add', text: '真棒', date: '2026-10-25' });
    const id = state.praise[0].id;
    const removed = appReducer(state, { type: 'praise-remove', id });
    expect(removed.praise).toHaveLength(0);
    expect(appReducer(state, { type: 'praise-remove', id: 'ghost' })).toBe(state);
  });
});

describe('激励体系 · 状态归一化兜底', () => {
  it('album/praise 非法条目被过滤，容量与字数上限生效', () => {
    const next = normalizeState({
      schemaVersion: 1,
      album: [
        { date: '2026-10-25', day: 14, title: '长成少年桃啦' },
        { date: 'nope', day: 1, title: '坏日期' },
        { date: '2026-10-26', day: -3, title: '' },
      ],
      praise: [
        { id: 'p1', text: '真棒', date: '2026-10-25', read: false },
        { id: '', text: '坏 id', date: '2026-10-25', read: true },
        { id: 'p2', text: 42, date: '2026-10-25', read: true },
      ],
    } as never)!;
    expect(next.album).toHaveLength(1);
    expect(next.album[0].day).toBe(14);
    expect(next.praise).toHaveLength(1);
    expect(next.praise[0].text).toBe('真棒');
  });

  it('缺省字段回落空集合；stageSeen 缺省 undefined（老用户首次回访补一次仪式）', () => {
    const next = normalizeState({ schemaVersion: 1 } as never)!;
    expect(next.album).toEqual([]);
    expect(next.praise).toEqual([]);
    expect(next.pet.stageSeen).toBeUndefined();
  });

  it('prepareState 保留激励字段', () => {
    let state = appReducer(initialState(), { type: 'praise-add', text: '真棒', date: '2026-10-25' });
    state = appReducer(state, { type: 'mark-stage-seen', date: '2026-10-25' });
    const prepped = prepareState(state, '2026-10-25');
    expect(prepped.praise).toHaveLength(1);
    expect(prepped.pet.stageSeen).toBeDefined();
  });
});
