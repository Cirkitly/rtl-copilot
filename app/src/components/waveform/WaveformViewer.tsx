'use client';

import React, { useRef, useEffect, useState, useCallback } from 'react';
import { VCDData, ValueChange } from '@/lib/waveform/vcdParser';
import { ZoomIn, ZoomOut, RotateCcw, Clock, Move, Crosshair } from 'lucide-react';

interface WaveformViewerProps {
    data: VCDData;
    width?: number;
    height?: number;
    onCursorChange?: (time: number | null) => void;
}

const SIGNAL_HEIGHT = 30;
const SIGNAL_PADDING = 5;
const LABEL_WIDTH = 120;
const TIME_HEADER_HEIGHT = 25;

const WaveformViewer: React.FC<WaveformViewerProps> = ({ data, width = 800, height = 400, onCursorChange }) => {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const containerRef = useRef<HTMLDivElement>(null);
    const [zoom, setZoom] = useState(1);
    const [offset, setOffset] = useState(0);
    const [cursorTime, setCursorTime] = useState<number | null>(null);
    const [isPanning, setIsPanning] = useState(false);
    const [panStart, setPanStart] = useState({ x: 0, offset: 0 });
    const [signalValues, setSignalValues] = useState<Map<string, string>>(new Map());

    const getTimeRange = useCallback((): { min: number; max: number } => {
        let min = Infinity, max = -Infinity;
        data.changes.forEach(changes => {
            if (changes.length > 0) {
                min = Math.min(min, changes[0].time);
                max = Math.max(max, changes[changes.length - 1].time);
            }
        });
        return { min: min === Infinity ? 0 : min, max: max === -Infinity ? 100 : max };
    }, [data.changes]);

    // Get signal value at a specific time
    const getSignalValueAtTime = useCallback((signalName: string, time: number): string => {
        const changes = data.changes.get(signalName);
        if (!changes) return '-';

        let value = '-';
        for (const change of changes) {
            if (change.time > time) break;
            value = change.value;
        }

        const signal = data.signals.get(signalName);
        if (signal && signal.width > 1 && value !== '-') {
            const hexVal = parseInt(value, 2);
            return isNaN(hexVal) ? value : `0x${hexVal.toString(16).toUpperCase()}`;
        }
        return value;
    }, [data.changes, data.signals]);

    // Update signal values when cursor moves
    useEffect(() => {
        if (cursorTime === null) return;

        const values = new Map<string, string>();
        data.signals.forEach((_, signalName) => {
            values.set(signalName, getSignalValueAtTime(signalName, cursorTime));
        });
        setSignalValues(values);
    }, [cursorTime, data.signals, getSignalValueAtTime]);

    // Handle mouse events for cursor and panning
    const handleMouseMove = useCallback((e: React.MouseEvent<HTMLCanvasElement>) => {
        const canvas = canvasRef.current;
        if (!canvas) return;

        const rect = canvas.getBoundingClientRect();
        const x = e.clientX - rect.left;

        if (isPanning) {
            // ... (panning logic remains same)
            const dx = e.clientX - panStart.x;
            const { min: startTime, max: endTime } = getTimeRange();
            const timeRange = (endTime - startTime) / zoom;
            const drawableWidth = width - LABEL_WIDTH;
            const timeDelta = (dx / drawableWidth) * timeRange;
            setOffset(Math.max(0, Math.min(1, panStart.offset - timeDelta / (endTime - startTime))));
            return;
        }

        // Update cursor
        if (x > LABEL_WIDTH) {
            const { min: startTime, max: endTime } = getTimeRange();
            const timeRange = (endTime - startTime) / zoom;
            const timeOffset = offset * (endTime - startTime);
            const drawableWidth = width - LABEL_WIDTH;
            const time = startTime + timeOffset + ((x - LABEL_WIDTH) / drawableWidth) * timeRange;
            setCursorTime(time);
            onCursorChange?.(time);
        }
    }, [isPanning, panStart, getTimeRange, zoom, offset, width, onCursorChange]);

    const handleMouseDown = useCallback((e: React.MouseEvent<HTMLCanvasElement>) => {
        if (e.button === 0) { // Left click
            setIsPanning(true);
            setPanStart({ x: e.clientX, offset });
        }
    }, [offset]);

    const handleMouseUp = useCallback(() => {
        setIsPanning(false);
    }, []);

    const handleMouseLeave = useCallback(() => {
        setIsPanning(false);
        setCursorTime(null);
        onCursorChange?.(null);
    }, [onCursorChange]);

    // Handle wheel for zoom
    const handleWheel = useCallback((e: React.WheelEvent<HTMLCanvasElement>) => {
        e.preventDefault();
        if (e.deltaY < 0) {
            setZoom(z => Math.min(z * 1.2, 20));
        } else {
            setZoom(z => Math.max(z / 1.2, 0.1));
        }
    }, []);

    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;

        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        const { min: startTime, max: endTime } = getTimeRange();
        const totalRange = endTime - startTime;
        const viewRange = totalRange / zoom;
        const timeOffset = offset * totalRange;
        const viewStart = startTime + timeOffset;

        // Clear canvas with dark background
        ctx.fillStyle = '#0f172a';
        ctx.fillRect(0, 0, width, height);

        const signalNames = Array.from(data.signals.keys());
        const drawableWidth = width - LABEL_WIDTH;

        // Draw time header
        ctx.fillStyle = '#1e293b';
        ctx.fillRect(0, 0, width, TIME_HEADER_HEIGHT);
        ctx.fillStyle = '#64748b';
        ctx.font = '10px Inter, system-ui, sans-serif';

        // Time markers
        const numMarkers = 10;
        for (let i = 0; i <= numMarkers; i++) {
            const time = viewStart + (i / numMarkers) * viewRange;
            const x = LABEL_WIDTH + (i / numMarkers) * drawableWidth;
            ctx.fillText(`${Math.round(time)}`, x - 10, 15);
            ctx.strokeStyle = '#334155';
            ctx.lineWidth = 1;
            ctx.beginPath();
            ctx.moveTo(x, TIME_HEADER_HEIGHT);
            ctx.lineTo(x, height);
            ctx.stroke();
        }

        // Draw each signal
        signalNames.forEach((signalName, idx) => {
            const signal = data.signals.get(signalName);
            const changes = data.changes.get(signalName) || [];
            const y = TIME_HEADER_HEIGHT + idx * (SIGNAL_HEIGHT + SIGNAL_PADDING);

            // Draw label background
            ctx.fillStyle = '#1e293b';
            ctx.fillRect(0, y, LABEL_WIDTH, SIGNAL_HEIGHT);

            // Draw signal name
            ctx.fillStyle = '#94a3b8';
            ctx.font = '11px JetBrains Mono, monospace';
            ctx.fillText(signal?.name || signalName, 8, y + SIGNAL_HEIGHT / 2 + 4);

            // Draw value at cursor
            if (cursorTime !== null) {
                const value = signalValues.get(signalName);
                if (value) {
                    ctx.fillStyle = '#22c55e';
                    ctx.font = '9px JetBrains Mono, monospace';
                    ctx.fillText(value, LABEL_WIDTH - 45, y + SIGNAL_HEIGHT / 2 + 4);
                }
            }

            // Draw waveform
            if (signal && signal.width === 1) {
                drawDigitalWaveform(ctx, changes, y, viewStart, viewRange, drawableWidth);
            } else if (signal && signal.width > 1) {
                drawBusWaveform(ctx, changes, y, viewStart, viewRange, drawableWidth);
            }
        });

        // Draw cursor line
        if (cursorTime !== null && cursorTime >= viewStart && cursorTime <= viewStart + viewRange) {
            const cursorX = LABEL_WIDTH + ((cursorTime - viewStart) / viewRange) * drawableWidth;
            ctx.strokeStyle = '#f97316';
            ctx.lineWidth = 1;
            ctx.setLineDash([4, 4]);
            ctx.beginPath();
            ctx.moveTo(cursorX, TIME_HEADER_HEIGHT);
            ctx.lineTo(cursorX, height);
            ctx.stroke();
            ctx.setLineDash([]);

            // Draw cursor time label
            ctx.fillStyle = '#f97316';
            ctx.fillRect(cursorX - 20, 2, 40, 14);
            ctx.fillStyle = '#0f172a';
            ctx.font = '9px JetBrains Mono, monospace';
            ctx.fillText(`${Math.round(cursorTime)}`, cursorX - 15, 12);
        }

    }, [data, width, height, zoom, offset, cursorTime, signalValues, getTimeRange]);

    const drawDigitalWaveform = (
        ctx: CanvasRenderingContext2D,
        changes: ValueChange[],
        y: number,
        startTime: number,
        timeRange: number,
        drawableWidth: number
    ) => {
        const high = y + SIGNAL_PADDING;
        const low = y + SIGNAL_HEIGHT - SIGNAL_PADDING;

        ctx.strokeStyle = '#22c55e';
        ctx.lineWidth = 2;
        ctx.beginPath();

        let lastX = LABEL_WIDTH;
        let lastY = low;

        for (const change of changes) {
            if (change.time < startTime) {
                lastY = change.value === '1' ? high : low;
                continue;
            }
            if (change.time > startTime + timeRange) break;

            const x = LABEL_WIDTH + ((change.time - startTime) / timeRange) * drawableWidth;
            const newY = change.value === '1' ? high : (change.value === '0' ? low : (high + low) / 2);

            ctx.moveTo(lastX, lastY);
            ctx.lineTo(x, lastY);
            ctx.lineTo(x, newY);

            lastX = x;
            lastY = newY;
        }

        ctx.lineTo(LABEL_WIDTH + drawableWidth, lastY);
        ctx.stroke();
    };

    const drawBusWaveform = (
        ctx: CanvasRenderingContext2D,
        changes: ValueChange[],
        y: number,
        startTime: number,
        timeRange: number,
        drawableWidth: number
    ) => {
        const mid = y + SIGNAL_HEIGHT / 2;
        const top = y + SIGNAL_PADDING;
        const bottom = y + SIGNAL_HEIGHT - SIGNAL_PADDING;

        ctx.strokeStyle = '#eab308';
        ctx.lineWidth = 2;
        ctx.font = '9px JetBrains Mono, monospace';
        ctx.fillStyle = '#fbbf24';

        let lastX = LABEL_WIDTH;
        let lastValue = '';

        for (const change of changes) {
            if (change.time < startTime) {
                lastValue = change.value;
                continue;
            }
            if (change.time > startTime + timeRange) break;

            const x = LABEL_WIDTH + ((change.time - startTime) / timeRange) * drawableWidth;

            ctx.beginPath();
            ctx.moveTo(lastX, mid);
            ctx.lineTo(lastX + 5, top);
            ctx.lineTo(x - 5, top);
            ctx.lineTo(x, mid);
            ctx.lineTo(x - 5, bottom);
            ctx.lineTo(lastX + 5, bottom);
            ctx.closePath();
            ctx.stroke();

            if (x - lastX > 40 && lastValue) {
                const hexVal = parseInt(lastValue, 2);
                const displayVal = isNaN(hexVal) ? lastValue : `0x${hexVal.toString(16).toUpperCase()}`;
                ctx.fillText(displayVal, lastX + 12, mid + 3);
            }

            lastX = x;
            lastValue = change.value;
        }

        if (lastX < LABEL_WIDTH + drawableWidth) {
            ctx.beginPath();
            ctx.moveTo(lastX, mid);
            ctx.lineTo(lastX + 5, top);
            ctx.lineTo(LABEL_WIDTH + drawableWidth, top);
            ctx.moveTo(lastX, mid);
            ctx.lineTo(lastX + 5, bottom);
            ctx.lineTo(LABEL_WIDTH + drawableWidth, bottom);
            ctx.stroke();
        }
    };

    return (
        <div className="flex flex-col h-full bg-[#0f172a]" ref={containerRef}>
            {/* Toolbar */}
            <div className="flex items-center gap-2 p-3 bg-[#1e293b] border-b border-[#334155]">
                <div className="flex items-center bg-[#0f172a] rounded-lg p-0.5">
                    <button
                        className="p-2 hover:bg-[#334155] rounded-md text-slate-400 hover:text-white transition-colors"
                        onClick={() => setZoom(z => Math.min(z * 1.5, 20))}
                        title="Zoom In"
                    >
                        <ZoomIn size={14} />
                    </button>
                    <button
                        className="p-2 hover:bg-[#334155] rounded-md text-slate-400 hover:text-white transition-colors"
                        onClick={() => setZoom(z => Math.max(z / 1.5, 0.1))}
                        title="Zoom Out"
                    >
                        <ZoomOut size={14} />
                    </button>
                    <button
                        className="p-2 hover:bg-[#334155] rounded-md text-slate-400 hover:text-white transition-colors"
                        onClick={() => { setZoom(1); setOffset(0); setCursorTime(null); }}
                        title="Reset View"
                    >
                        <RotateCcw size={14} />
                    </button>
                </div>

                <div className="h-4 w-px bg-[#334155]" />

                <div className="flex items-center gap-1 text-xs text-slate-500">
                    <Move size={12} />
                    <span>Drag to pan</span>
                </div>

                <div className="flex items-center gap-1 text-xs text-slate-500">
                    <Crosshair size={12} />
                    <span>Hover for values</span>
                </div>

                <div className="flex-1" />

                {cursorTime !== null && (
                    <div className="flex items-center gap-1.5 px-2.5 py-1 bg-[#f97316]/20 rounded-full text-xs text-orange-400 font-mono">
                        <Crosshair size={12} />
                        <span>t = {Math.round(cursorTime)}</span>
                    </div>
                )}

                <div className="flex items-center gap-1.5 px-2.5 py-1 bg-[#0f172a] rounded-full text-xs text-slate-400">
                    <Clock size={12} />
                    <span>{data.timescale}</span>
                </div>

                <div className="px-2 py-1 bg-[#0f172a] rounded-full text-xs text-slate-400">
                    {Math.round(zoom * 100)}%
                </div>
            </div>

            {/* Canvas */}
            <div className="flex-1 overflow-auto">
                <canvas
                    ref={canvasRef}
                    width={width}
                    height={height}
                    className={isPanning ? 'cursor-grabbing' : 'cursor-crosshair'}
                    onMouseMove={handleMouseMove}
                    onMouseDown={handleMouseDown}
                    onMouseUp={handleMouseUp}
                    onMouseLeave={handleMouseLeave}
                    onWheel={handleWheel}
                />
            </div>
        </div>
    );
};

export default WaveformViewer;
