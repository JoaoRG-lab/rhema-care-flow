/**
 * SignatureCanvas
 * A touch + mouse-compatible canvas pad for capturing the clinician's signature.
 * Returns a PNG data URL via onCapture.
 */
import { useRef, useEffect, useState, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Trash2, Check } from 'lucide-react';
import { cn } from '@/lib/utils';

interface SignatureCanvasProps {
  onCapture: (dataUrl: string | null) => void;
  className?: string;
}

export function SignatureCanvas({ onCapture, className }: SignatureCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const drawing = useRef(false);
  const lastPos = useRef<{ x: number; y: number } | null>(null);
  const [isEmpty, setIsEmpty] = useState(true);

  // Setup canvas DPI
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const dpr = window.devicePixelRatio || 1;
    const rect = canvas.getBoundingClientRect();
    canvas.width = rect.width * dpr;
    canvas.height = rect.height * dpr;
    const ctx = canvas.getContext('2d')!;
    ctx.scale(dpr, dpr);
    ctx.strokeStyle = '#0f172a';
    ctx.lineWidth = 2;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
  }, []);

  const getPos = (e: React.MouseEvent | React.TouchEvent, canvas: HTMLCanvasElement) => {
    const rect = canvas.getBoundingClientRect();
    if ('touches' in e) {
      const t = e.touches[0];
      return { x: t.clientX - rect.left, y: t.clientY - rect.top };
    }
    return { x: (e as React.MouseEvent).clientX - rect.left, y: (e as React.MouseEvent).clientY - rect.top };
  };

  const startDraw = (e: React.MouseEvent | React.TouchEvent) => {
    drawing.current = true;
    const canvas = canvasRef.current!;
    lastPos.current = getPos(e, canvas);
    setIsEmpty(false);
  };

  const draw = useCallback((e: React.MouseEvent | React.TouchEvent) => {
    if (!drawing.current) return;
    e.preventDefault();
    const canvas = canvasRef.current!;
    const ctx = canvas.getContext('2d')!;
    const pos = getPos(e, canvas);
    ctx.beginPath();
    ctx.moveTo(lastPos.current!.x, lastPos.current!.y);
    ctx.lineTo(pos.x, pos.y);
    ctx.stroke();
    lastPos.current = pos;
  }, []);

  const stopDraw = useCallback(() => {
    drawing.current = false;
    lastPos.current = null;
  }, []);

  const clear = () => {
    const canvas = canvasRef.current!;
    const ctx = canvas.getContext('2d')!;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    setIsEmpty(true);
    onCapture(null);
  };

  const confirm = () => {
    if (isEmpty) return;
    const canvas = canvasRef.current!;
    onCapture(canvas.toDataURL('image/png'));
  };

  return (
    <div className={cn('flex flex-col gap-3', className)}>
      <div className="relative rounded-xl border-2 border-dashed border-border bg-white">
        <canvas
          ref={canvasRef}
          style={{ width: '100%', height: '140px', display: 'block', touchAction: 'none', cursor: 'crosshair', borderRadius: '0.75rem' }}
          onMouseDown={startDraw}
          onMouseMove={draw}
          onMouseUp={stopDraw}
          onMouseLeave={stopDraw}
          onTouchStart={startDraw}
          onTouchMove={draw}
          onTouchEnd={stopDraw}
        />
        {isEmpty && (
          <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
            <p className="text-sm text-muted-foreground select-none">Assine aqui</p>
          </div>
        )}
      </div>
      <div className="flex gap-2">
        <Button type="button" variant="outline" size="sm" onClick={clear} className="gap-1.5">
          <Trash2 className="h-3.5 w-3.5" /> Limpar
        </Button>
        <Button type="button" size="sm" onClick={confirm} disabled={isEmpty} className="gap-1.5 flex-1">
          <Check className="h-3.5 w-3.5" /> Confirmar Assinatura
        </Button>
      </div>
    </div>
  );
}
