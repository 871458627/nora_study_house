import { describe, expect, it } from 'vitest';
import { gridFromMask, rankCandidates, similarity, type MaskWithBox } from '../src/core/handwriting';
import { normalizeState } from '../src/core/model';

// 这份测试钉死「闭集识别」的数学底线（docs/01 P2-4）：
// 1) 归一化对笔迹的位移/缩放不敏感——孩子写得偏一点、小一点不影响；
// 2) 相似度能区分形状差异明显的字（横 vs 竖 vs 十）；
// 3) 排序取 Top-N 且零相似候选被过滤。
// 模板位图化（楷体渲染）在浏览器层，此处用合成位图代替。

const N = 32;

function blank(): { mask: Uint8Array; box: MaskWithBox['box'] } {
  return { mask: new Uint8Array(N * N), box: { x0: N, y0: N, x1: -1, y1: -1 } };
}

function fill(
  base: ReturnType<typeof blank>,
  x0: number,
  y0: number,
  x1: number,
  y1: number,
): MaskWithBox {
  for (let y = y0; y <= y1; y++) {
    for (let x = x0; x <= x1; x++) {
      base.mask[y * N + x] = 1;
    }
  }
  return {
    width: N,
    height: N,
    mask: base.mask,
    box: {
      x0: Math.min(base.box.x0, x0),
      y0: Math.min(base.box.y0, y0),
      x1: Math.max(base.box.x1, x1),
      y1: Math.max(base.box.y1, y1),
    },
  };
}

/** 竖棒「丨」 */
const vertical = () => fill(blank(), 15, 6, 17, 26);
/** 横棒「一」 */
const horizontal = () => fill(blank(), 6, 15, 26, 17);
/** 十字 */
const cross = () => {
  const base = blank();
  const v = fill(base, 15, 6, 17, 26);
  return fill({ mask: v.mask, box: v.box }, 6, 15, 26, 17);
};

describe('田字格手写 · 闭集识别纯函数', () => {
  it('归一化对位移与等比缩放不敏感（同一形状写偏、写小仍高度相似）', () => {
    const a = gridFromMask(vertical()); // 3×21，约 1:7
    const shifted = fill(blank(), 12, 9, 13, 23); // 2×15，约 1:7.5，等比缩小且位移
    const b = gridFromMask(shifted);
    expect(similarity(a, b), '位移等比缩放后的同形笔迹应 ≥0.9 相似').toBeGreaterThanOrEqual(0.9);
  });

  it('横竖形状差异显著（相似度低于同形自比的 0.6 倍）', () => {
    const v = gridFromMask(vertical());
    const h = gridFromMask(horizontal());
    const self = similarity(v, v);
    expect(self, '自比恒等于 1').toBeCloseTo(1, 5);
    expect(similarity(v, h), '横 vs 竖应明显不相似').toBeLessThan(self * 0.6);
  });

  it('闭集排序返回最像的候选且过滤零相似项', () => {
    const ink = gridFromMask(vertical());
    const templates = [
      { char: '横', grid: gridFromMask(horizontal()) },
      { char: '竖', grid: gridFromMask(vertical()) },
      { char: '十', grid: gridFromMask(cross()) },
    ];
    const ranked = rankCandidates(ink, templates);
    expect(ranked[0], '竖棒笔迹的第一候选应是「竖」').toBe('竖');
    expect(ranked, '全部候选都应有非零相似').toHaveLength(3);
  });

  it('空白笔迹不产生候选（排序前被相似度阈值过滤）', () => {
    const empty = gridFromMask({ width: N, height: N, mask: new Uint8Array(N * N), box: { x0: 0, y0: 0, x1: 0, y1: 0 } });
    const templates = [{ char: '竖', grid: gridFromMask(vertical()) }];
    expect(rankCandidates(empty, templates), '空网格应无候选').toHaveLength(0);
  });
});

describe('听写方式设置 · handwrite 枚举贯通', () => {
  it('normalizeState 保留 handwrite，隐藏的 type 与未知值回落 choice', () => {
    const keep = normalizeState({
      schemaVersion: 1,
      profile: { nickname: '小桃' },
      settings: { dictationMode: 'handwrite' },
    } as never)!;
    expect(keep.settings.dictationMode).toBe('handwrite');
    for (const stale of ['type', 'weird']) {
      const fallback = normalizeState({
        schemaVersion: 1,
        profile: { nickname: '小桃' },
        settings: { dictationMode: stale },
      } as never)!;
      expect(fallback.settings.dictationMode, `存量 ${stale} 应回落 choice`).toBe('choice');
    }
  });
});
