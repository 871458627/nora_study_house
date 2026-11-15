// 宠物状态纯函数（缺陷清单 M12 补测：core/pet.ts 此前零测试）
// 钉死：饱食度每日衰减 -15 且不归零/同日不重复扣、阶段阈值 14/42 天、
// 喂食 food +10 / meal +30 与每日 fedDays 一计、satiety 上限 100、mood 判定。
import { describe, expect, it } from 'vitest';
import { applyFeed, decayPet, nextStage, petMood, stageFromFedDays, stageInfo } from '../src/core/pet';
import { createInitialState } from '../src/core/model';

const BASE = createInitialState();

function petWith(overrides: Partial<typeof BASE.pet>): typeof BASE.pet {
  return { ...BASE.pet, ...overrides };
}

function stateWith(pet: typeof BASE.pet, overrides: Partial<typeof BASE> = {}): typeof BASE {
  return { ...BASE, pet, ...overrides };
}

describe('宠物饱食度衰减（decayPet）', () => {
  it('跨一天扣 15 点', () => {
    const pet = petWith({ satiety: 70, lastDecayDate: '2026-10-26' });
    const next = decayPet(pet, '2026-10-27');
    expect(next.satiety).toBe(55);
    expect(next.lastDecayDate).toBe('2026-10-27');
  });

  it('跨多天按天数扣，且不低于 0', () => {
    const pet = petWith({ satiety: 70, lastDecayDate: '2026-10-20' });
    expect(decayPet(pet, '2026-10-27').satiety).toBe(0);
    expect(decayPet(petWith({ satiety: 10, lastDecayDate: '2026-10-01' }), '2026-10-27').satiety).toBe(0);
  });

  it('同日多次调用不重复扣', () => {
    const pet = petWith({ satiety: 70, lastDecayDate: '2026-10-27' });
    expect(decayPet(decayPet(pet, '2026-10-27'), '2026-10-27').satiety).toBe(70);
  });
});

describe('喂食与成长（applyFeed / stageFromFedDays）', () => {
  it('food +10、meal +30，satiety 上限 100', () => {
    const pet = petWith({ satiety: 55, lastFedDate: undefined, fedDays: 0 });
    const fed = applyFeed(pet, '2026-10-27', 'food');
    expect(fed.satiety).toBe(65);
    const stuffed = applyFeed(petWith({ satiety: 90, lastFedDate: undefined, fedDays: 0 }), '2026-10-27', 'meal');
    expect(stuffed.satiety).toBe(100);
  });

  it('fedDays 每日一计：同日重复喂不涨天数', () => {
    const pet = petWith({ satiety: 55, fedDays: 13, lastFedDate: '2026-10-27' });
    const fed = applyFeed(pet, '2026-10-27', 'food');
    expect(fed.fedDays).toBe(13);
    expect(fed.satiety).toBe(65);
  });

  it('阶段阈值：14 天进少年桃、42 天进大桃', () => {
    expect(stageFromFedDays(13)).toBe(0);
    expect(stageFromFedDays(14)).toBe(1);
    expect(stageFromFedDays(41)).toBe(1);
    expect(stageFromFedDays(42)).toBe(2);
    expect(nextStage(2)).toBeNull();
    expect(stageInfo(1).name).toBe('少年桃');
    // 喂食跨过 14 天阈值即进化
    const pet = petWith({ satiety: 55, fedDays: 13, lastFedDate: '2026-10-26' });
    expect(applyFeed(pet, '2026-10-27', 'food').stage).toBe(1);
  });
});

describe('petMood 心情判定', () => {
  it('饱食度 <30 → hungry', () => {
    const state = stateWith(petWith({ satiety: 20, lastFedDate: undefined, lastDecayDate: '2026-10-27' }));
    expect(petMood(state, '2026-10-27', 10)).toBe('hungry');
  });

  it('今天喂过 → happy（即使有未完成任务）', () => {
    const state = stateWith(
      petWith({ satiety: 70, lastFedDate: '2026-10-27', lastDecayDate: '2026-10-27' }),
      { dailyPlans: { '2026-10-27': { tasks: [{ id: 't1' } as never], generatedAt: '2026-10-27' } }, dailyLogs: {} },
    );
    expect(petMood(state, '2026-10-27', 20)).toBe('happy');
  });

  it('过截止时间还有任务没做 → sad（9 点前不算）', () => {
    const state = stateWith(
      petWith({ satiety: 70, lastFedDate: undefined, lastDecayDate: '2026-10-27' }),
      {
        settings: { ...BASE.settings, deadlineHour: 21 },
        dailyPlans: { '2026-10-27': { tasks: [{ id: 't1' } as never], generatedAt: '2026-10-27' } },
        dailyLogs: {},
      },
    );
    expect(petMood(state, '2026-10-27', 9)).toBe('normal');
    expect(petMood(state, '2026-10-27', 22)).toBe('sad');
  });
});
