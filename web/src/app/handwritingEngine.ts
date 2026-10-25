// 田字格手写·识别引擎（浏览器编排层）
//
// 负责 Canvas 位图化：ink 笔画栅格化、候选字按楷体渲染成模板位图，
// 然后交给 src/core/handwriting 的纯函数做归一化与排序。
// 模板按字缓存；系统级 Handwriting Recognition API（Android Chrome 等）
// 预留了 detectSystemRecognizer 探测口，接入时只需替换 recognizeChar 的实现。

import { gridFromMask, rankCandidates, type OccupancyGrid, type MaskWithBox } from '../core/handwriting';

export interface Point {
  x: number;
  y: number;
}

/** 一笔 = 一串归一化坐标（0..1，田字格内） */
export type Stroke = Point[];

const RASTER = 112;
const INK_WIDTH = 7;

let canvasPool: { canvas: HTMLCanvasElement; ctx: CanvasRenderingContext2D } | null = null;

function borrowCanvas(): { canvas: HTMLCanvasElement; ctx: CanvasRenderingContext2D } {
  if (!canvasPool) {
    const canvas = document.createElement('canvas');
    canvas.width = RASTER;
    canvas.height = RASTER;
    const ctx = canvas.getContext('2d', { willReadFrequently: true });
    if (!ctx) throw new Error('canvas 2d context unavailable');
    canvasPool = { canvas, ctx };
  }
  canvasPool.ctx.clearRect(0, 0, RASTER, RASTER);
  return canvasPool;
}

function maskFromCanvas(ctx: CanvasRenderingContext2D): MaskWithBox | null {
  const data = ctx.getImageData(0, 0, RASTER, RASTER).data;
  const mask = new Uint8Array(RASTER * RASTER);
  const box = { x0: RASTER, y0: RASTER, x1: -1, y1: -1 };
  for (let y = 0; y < RASTER; y++) {
    for (let x = 0; x < RASTER; x++) {
      if (data[(y * RASTER + x) * 4 + 3] > 40) {
        mask[y * RASTER + x] = 1;
        if (x < box.x0) box.x0 = x;
        if (x > box.x1) box.x1 = x;
        if (y < box.y0) box.y0 = y;
        if (y > box.y1) box.y1 = y;
      }
    }
  }
  if (box.x1 < 0) return null;
  return { width: RASTER, height: RASTER, mask, box };
}

const templateCache = new Map<string, OccupancyGrid>();

/** 候选字模板：楷体渲染 → 位图 → 归一化网格（按字缓存） */
export function templateGridFor(char: string): OccupancyGrid | null {
  const cached = templateCache.get(char);
  if (cached) return cached;
  const { ctx } = borrowCanvas();
  ctx.fillStyle = '#000';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.font = `${Math.round(RASTER * 0.84)}px "Kaiti SC", KaiTi, STKaiti, "STSong", "Songti SC", serif`;
  ctx.fillText(char, RASTER / 2, RASTER / 2 + 2);
  const mask = maskFromCanvas(ctx);
  ctx.clearRect(0, 0, RASTER, RASTER);
  if (!mask) return null;
  const grid = gridFromMask(mask);
  templateCache.set(char, grid);
  return grid;
}

/** ink 笔画栅格化 → 归一化网格；空笔迹或笔迹过小返回 null */
export function inkGridFrom(strokes: Stroke[]): OccupancyGrid | null {
  const points = strokes.flat();
  if (!points.length) return null;
  const { ctx } = borrowCanvas();
  ctx.strokeStyle = '#000';
  ctx.fillStyle = '#000';
  ctx.lineWidth = INK_WIDTH;
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';
  for (const stroke of strokes) {
    if (stroke.length === 1) {
      ctx.beginPath();
      ctx.arc(stroke[0].x * RASTER, stroke[0].y * RASTER, INK_WIDTH / 2, 0, Math.PI * 2);
      ctx.fill();
      continue;
    }
    ctx.beginPath();
    ctx.moveTo(stroke[0].x * RASTER, stroke[0].y * RASTER);
    for (let i = 1; i < stroke.length; i++) {
      ctx.lineTo(stroke[i].x * RASTER, stroke[i].y * RASTER);
    }
    ctx.stroke();
  }
  const mask = maskFromCanvas(ctx);
  ctx.clearRect(0, 0, RASTER, RASTER);
  if (!mask) return null;
  // 笔迹太小（如一个点）没有区分度
  if (mask.box.x1 - mask.box.x0 < 6 && mask.box.y1 - mask.box.y0 < 6) return null;
  return gridFromMask(mask);
}

/** 闭集识别：返回 Top-N 候选字（相似度降序） */
export function recognizeChar(strokes: Stroke[], candidates: string[], topN = 3): string[] {
  const ink = inkGridFrom(strokes);
  if (!ink) return [];
  const templates = [];
  for (const char of candidates) {
    const grid = templateGridFor(char);
    if (grid) templates.push({ char, grid });
  }
  return rankCandidates(ink, templates).slice(0, topN);
}

/** 系统级手写识别探测口（Handwriting Recognition API，Android Chrome 等）。
 *  当前环境普遍不可用，返回 false 走内置识别器；真机平板联调时接入。 */
export async function detectSystemRecognizer(): Promise<boolean> {
  const nav = navigator as unknown as {
    createHandwritingRecognizer?: (config: { languages: string[] }) => Promise<unknown>;
  };
  try {
    if (!nav.createHandwritingRecognizer) return false;
    const recognizer = await nav.createHandwritingRecognizer({ languages: ['zh'] });
    return !!recognizer;
  } catch {
    return false;
  }
}
