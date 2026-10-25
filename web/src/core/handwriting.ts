// 田字格手写·闭集识别（纯函数层，docs/01 P2-4）
//
// 识别问题被刻意收窄为「闭集排序」：候选只有本课听写词的生字（≤ 十几个），
// 因此不需要通用手写识别模型。ink 与候选字模板都归一化为
// 「内容包围盒 → N×N 占用网格 → 一次 3×3 盒式模糊」，用 cosine 相似度排序，
// 取 Top-3 给孩子点选确认——识别不准从「阻断」降级为「多点一下」。
//
// 本模块不做任何 DOM/Canvas 操作：位图化（ink 笔画栅格化、模板字渲染）
// 在 src/app/handwritingEngine.ts（浏览器编排层）完成，此处只收 MaskWithBox。

export interface OccupancyGrid {
  n: number;
  /** 长度 n*n，0..1，已模糊归一 */
  cells: number[];
}

export interface InkBox {
  x0: number;
  y0: number;
  x1: number;
  y1: number;
}

export interface MaskWithBox {
  width: number;
  height: number;
  /** 长度 width*height，非 0 表示有墨迹 */
  mask: Uint8Array;
  /** 墨迹内容包围盒（含端点），由调用方算好传入 */
  box: InkBox;
}

/** 内容包围盒等比缩放到 (n-2) 见方、居中后的占用网格（含一次盒式模糊） */
export function gridFromMask(m: MaskWithBox, n = 16): OccupancyGrid {
  const cells = new Array<number>(n * n).fill(0);
  const bw = Math.max(1, m.box.x1 - m.box.x0 + 1);
  const bh = Math.max(1, m.box.y1 - m.box.y0 + 1);
  const span = n - 2;
  const scale = span / Math.max(bw, bh);
  const gw = Math.max(1, Math.round(bw * scale));
  const gh = Math.max(1, Math.round(bh * scale));
  const ox = 1 + ((span - gw) / 2 | 0);
  const oy = 1 + ((span - gh) / 2 | 0);

  for (let y = m.box.y0; y <= m.box.y1; y++) {
    const row = y * m.width;
    const cy = oy + Math.min(gh - 1, Math.round((y - m.box.y0) * scale));
    for (let x = m.box.x0; x <= m.box.x1; x++) {
      if (!m.mask[row + x]) continue;
      const cx = ox + Math.min(gw - 1, Math.round((x - m.box.x0) * scale));
      cells[cy * n + cx] = 1;
    }
  }

  // 3×3 盒式模糊：容忍孩子笔迹的歪扭与笔画粗细差异（二值占用后再模糊，
  // 厚笔画与细笔画落在同一格内不再拉开相似度）
  const blurred = new Array<number>(n * n).fill(0);
  for (let y = 0; y < n; y++) {
    for (let x = 0; x < n; x++) {
      let sum = 0;
      for (let dy = -1; dy <= 1; dy++) {
        const yy = y + dy;
        if (yy < 0 || yy >= n) continue;
        for (let dx = -1; dx <= 1; dx++) {
          const xx = x + dx;
          if (xx < 0 || xx >= n) continue;
          sum += cells[yy * n + xx];
        }
      }
      blurred[y * n + x] = sum;
    }
  }
  const max = Math.max(1, ...blurred);
  return { n, cells: blurred.map(v => v / max) };
}

/** cosine 相似度（对整体亮度不敏感，只看分布形状） */
export function similarity(a: OccupancyGrid, b: OccupancyGrid): number {
  if (a.n !== b.n) return 0;
  let dot = 0;
  let na = 0;
  let nb = 0;
  for (let i = 0; i < a.cells.length; i++) {
    dot += a.cells[i] * b.cells[i];
    na += a.cells[i] * a.cells[i];
    nb += b.cells[i] * b.cells[i];
  }
  if (na === 0 || nb === 0) return 0;
  return dot / Math.sqrt(na * nb);
}

export interface CharTemplate {
  char: string;
  grid: OccupancyGrid;
}

/** 闭集排序：返回按相似度降序的候选字（零相似的过滤掉） */
export function rankCandidates(ink: OccupancyGrid, templates: CharTemplate[]): string[] {
  return templates
    .map(t => ({ char: t.char, score: similarity(ink, t.grid) }))
    .filter(item => item.score > 0.2)
    .sort((a, b) => b.score - a.score)
    .map(item => item.char);
}
