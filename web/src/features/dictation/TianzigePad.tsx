import { useCallback, useEffect, useRef, useState } from 'react';
import type { Point, Stroke } from '../../app/handwritingEngine';

// 田字格手写板：Pointer 事件采集笔画（手指/触控笔/鼠标），
// 停顿 4 秒出浅灰楷体描红提示，落笔即隐（docs/01 P2-4 交互方案）。

const HINT_DELAY_MS = 4000;

interface TianzigePadProps {
  strokes: Stroke[];
  onStrokesChange: (next: Stroke[]) => void;
  /** 描红提示字；空串表示无提示 */
  hintChar: string;
  disabled?: boolean;
}

export function TianzigePad({ strokes, onStrokesChange, hintChar, disabled = false }: TianzigePadProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const wrapRef = useRef<HTMLDivElement | null>(null);
  const drawingRef = useRef<Stroke>([]);
  const [drawing, setDrawing] = useState(false);
  const [showHint, setShowHint] = useState(false);

  const paint = useCallback(
    (liveStroke: Stroke | null) => {
      const canvas = canvasRef.current;
      if (!canvas) return;
      const ctx = canvas.getContext('2d');
      if (!ctx) return;
      const size = canvas.width;
      ctx.clearRect(0, 0, size, size);

      // 描红提示字
      if (hintChar && showHint && !drawing && strokes.length === 0) {
        ctx.fillStyle = '#ece5df';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.font = `${Math.round(size * 0.8)}px "Kaiti SC", KaiTi, STKaiti, "STSong", "Songti SC", serif`;
        ctx.fillText(hintChar, size / 2, size / 2 + size * 0.02);
      }

      // 田字格：外框 + 虚线十字
      const inset = Math.max(2, size * 0.012);
      ctx.strokeStyle = '#c9a58e';
      ctx.lineWidth = Math.max(2, size * 0.011);
      ctx.beginPath();
      ctx.roundRect(inset, inset, size - inset * 2, size - inset * 2, size * 0.03);
      ctx.stroke();
      ctx.strokeStyle = '#d9bfae';
      ctx.lineWidth = Math.max(1, size * 0.007);
      ctx.setLineDash([size * 0.035, size * 0.035]);
      ctx.beginPath();
      ctx.moveTo(size / 2, inset);
      ctx.lineTo(size / 2, size - inset);
      ctx.moveTo(inset, size / 2);
      ctx.lineTo(size - inset, size / 2);
      ctx.stroke();
      ctx.setLineDash([]);

      // 笔迹
      const inkWidth = Math.max(4, size * 0.032);
      ctx.strokeStyle = '#2b2b33';
      ctx.fillStyle = '#2b2b33';
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';
      ctx.lineWidth = inkWidth;
      const all = liveStroke ? [...strokes, liveStroke] : strokes;
      for (const stroke of all) {
        if (stroke.length === 1) {
          ctx.beginPath();
          ctx.arc(stroke[0].x * size, stroke[0].y * size, inkWidth / 2, 0, Math.PI * 2);
          ctx.fill();
          continue;
        }
        ctx.beginPath();
        ctx.moveTo(stroke[0].x * size, stroke[0].y * size);
        for (let i = 1; i < stroke.length; i++) {
          ctx.lineTo(stroke[i].x * size, stroke[i].y * size);
        }
        ctx.stroke();
      }
    },
    [hintChar, showHint, drawing, strokes],
  );

  // 画布分辨率跟随容器尺寸（含 dpr）
  useEffect(() => {
    const wrap = wrapRef.current;
    const canvas = canvasRef.current;
    if (!wrap || !canvas) return;
    const resize = () => {
      const rect = wrap.getBoundingClientRect();
      const dpr = Math.min(2.5, window.devicePixelRatio || 1);
      const px = Math.max(1, Math.round(rect.width * dpr));
      if (canvas.width !== px) canvas.width = px;
      if (canvas.height !== px) canvas.height = px;
      paint(null);
    };
    resize();
    const observer = new ResizeObserver(resize);
    observer.observe(wrap);
    return () => observer.disconnect();
  }, [paint]);

  useEffect(() => {
    paint(null);
  }, [paint]);

  // 停顿出描红提示：每次笔迹变化或开始作答后重新计时
  useEffect(() => {
    if (disabled) {
      setShowHint(false);
      return;
    }
    setShowHint(false);
    const timer = window.setTimeout(() => setShowHint(true), HINT_DELAY_MS);
    return () => window.clearTimeout(timer);
  }, [strokes, disabled, hintChar]);

  const toPoint = (event: React.PointerEvent<HTMLCanvasElement>): Point => {
    const canvas = canvasRef.current;
    if (!canvas) return { x: 0, y: 0 };
    const rect = canvas.getBoundingClientRect();
    return {
      x: Math.min(1, Math.max(0, (event.clientX - rect.left) / rect.width)),
      y: Math.min(1, Math.max(0, (event.clientY - rect.top) / rect.height)),
    };
  };

  const onPointerDown = (event: React.PointerEvent<HTMLCanvasElement>) => {
    if (disabled) return;
    event.currentTarget.setPointerCapture(event.pointerId);
    setShowHint(false);
    setDrawing(true);
    drawingRef.current = [toPoint(event)];
    paint(drawingRef.current);
  };

  const onPointerMove = (event: React.PointerEvent<HTMLCanvasElement>) => {
    if (!drawing || disabled) return;
    const point = toPoint(event);
    const stroke = drawingRef.current;
    const last = stroke[stroke.length - 1];
    if (last && Math.abs(last.x - point.x) < 0.004 && Math.abs(last.y - point.y) < 0.004) return;
    stroke.push(point);
    paint(stroke);
  };

  const endStroke = () => {
    if (!drawing) return;
    setDrawing(false);
    const stroke = drawingRef.current;
    drawingRef.current = [];
    if (stroke.length) onStrokesChange([...strokes, stroke]);
    else paint(null);
  };

  return (
    <div className="tzg-pad" ref={wrapRef}>
      <canvas
        ref={canvasRef}
        className="tzg-canvas"
        aria-label="田字格书写区，用手指或触控笔写字"
        {...(disabled ? { 'aria-disabled': true } : {})}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={endStroke}
        onPointerCancel={endStroke}
        onPointerLeave={endStroke}
      />
      {showHint && hintChar && strokes.length === 0 && !disabled && (
        <span className="tzg-hint-note" aria-hidden="true">
          先照着浅色的字描一描，再自己写
        </span>
      )}
    </div>
  );
}
