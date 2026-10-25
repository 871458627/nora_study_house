import { describe, expect, it } from 'vitest';
import { createInitialState, normalizeState } from '../src/core/model';
import { appReducer, initialState, prepareState } from '../src/core/state';
import { PET_BY_ID, PET_SKINS, petSkinFor } from '../src/data/pets';

// 这份测试钉死宠物商城（2026-10-25 用户需求 / FR-P1-01 宠物部分）：
// 1) 星级不足或重复购买 → 原样返回（星星只增不扣的口径不被破坏）；
// 2) 购买成功 → 扣星星、写入 owned、自动装备为陪伴伙伴；
// 3) shop-equip 只能在已拥有集合内切换；
// 4) normalize 兜底：skin/owned 的非法值回落初始伙伴，云同步双向安全。

const paid = PET_SKINS.find(skin => skin.price > 0)!;

function withStars(stars: number) {
  const base = initialState();
  return { ...base, rewards: { ...base.rewards, stars } };
}

describe('宠物商城 · 购买与装备', () => {
  it('星星不足时购买返回原 state，星星与拥有集合不变', () => {
    const state = withStars(paid.price - 1);
    const next = appReducer(state, { type: 'shop-buy', petId: paid.id });
    expect(next).toBe(state);
    expect(next.rewards.stars).toBe(paid.price - 1);
    expect(next.shop.owned).toHaveLength(0);
  });

  it('购买成功：扣星星、加入 owned、自动装备', () => {
    const state = withStars(paid.price);
    const next = appReducer(state, { type: 'shop-buy', petId: paid.id });
    expect(next).not.toBe(state);
    expect(next.rewards.stars).toBe(0);
    expect(next.shop.owned).toEqual([paid.id]);
    expect(next.pet.skin).toBe(paid.id);
  });

  it('重复购买返回原 state（星星不再扣）', () => {
    const state = withStars(paid.price * 2);
    const once = appReducer(state, { type: 'shop-buy', petId: paid.id });
    const twice = appReducer(once, { type: 'shop-buy', petId: paid.id });
    expect(twice).toBe(once);
    expect(twice.rewards.stars).toBe(paid.price);
  });

  it('未知商品 id 购买返回原 state', () => {
    const state = withStars(999);
    expect(appReducer(state, { type: 'shop-buy', petId: 'ghost' })).toBe(state);
  });

  it('shop-equip 只能在已拥有集合内切换，未拥有返回原 state', () => {
    const state = withStars(paid.price);
    const next = appReducer(state, { type: 'shop-equip', petId: paid.id });
    expect(next).toBe(state);
    const owned = appReducer(state, { type: 'shop-buy', petId: paid.id });
    const back = appReducer(owned, { type: 'shop-equip', petId: 'xiaotao' });
    expect(back.pet.skin).toBe('xiaotao');
    const again = appReducer(back, { type: 'shop-equip', petId: 'xiaotao' });
    expect(again).toBe(back);
  });

  it('0 价初始伙伴不出现在商店购买流（目录约定：price 0 = 初始陪伴）', () => {
    expect(PET_BY_ID.xiaotao.price).toBe(0);
    expect(PET_SKINS.every(skin => skin.price >= 0)).toBe(true);
  });
});

describe('宠物商城 · 状态归一化兜底', () => {
  it('skin 非法值回落 xiaotao，合法值保留；owned 过滤未知 id 并去重', () => {
    const keep = normalizeState({
      schemaVersion: 1,
      shop: { owned: ['lanmei', 'lanmei', 'ghost', 42] },
      pet: { skin: 'ningmeng' },
    } as never)!;
    expect(keep.pet.skin).toBe('ningmeng');
    expect(keep.shop.owned).toEqual(['lanmei']);
    const fallback = normalizeState({
      schemaVersion: 1,
      shop: { owned: 'nope' },
      pet: { skin: 'ghost' },
    } as never)!;
    expect(fallback.pet.skin).toBe('xiaotao');
    expect(fallback.shop.owned).toEqual([]);
  });

  it('初始状态含默认 skin 与空 owned；prepareState 后保留', () => {
    const base = createInitialState();
    expect(base.pet.skin).toBe('xiaotao');
    expect(base.shop.owned).toEqual([]);
    const prepped = prepareState(base, '2026-10-25');
    expect(prepped.shop.owned).toEqual([]);
    expect(petSkinFor(prepped.pet.skin).id).toBe('xiaotao');
  });
});
