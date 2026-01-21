'use client';

import React, { useRef, useEffect, useState } from 'react';
import { VCDData, ValueChange } from '@/lib/waveform/vcdParser';
import { ZoomIn, ZoomOut, RotateCcw, Clock } from 'lucide-react';

interface WaveformViewerProps {
    data: VCDData;
    width?: number;
    height?: number;
}

const SIGNAL_HEIGHT = 30;
const SIGNAL_PADDING = 5;
const LABEL_WIDTH = 120;
const TIME_HEADER_HEIGHT = 25;

const WaveformViewer: React.FC<WaveformViewerProps> = ({ data, width = 800, height = 400 }) => {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const [zoom, setZoom] = useState(1);
    const [offset, setOffset] = useState(0);

    const getTimeRange = (): { min: number; max: number } => {
        let min = Infinity, max = -Infinity;
        data.changes.forEach(changes => {
            if (changes.length > 0) {
                min = Math.min(min, changes[0].time);
                max = Math.max(max, changes[changes.length - 1].time);
            }
        });
        return { min: min === Infinity ? 0 : min, max: max === -Infinity ? 100 : max };
    };

    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;

        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        const { min: startTime, max: endTime } = getTimeRange();
        const timeRange = (endTime - startTime) / zoom;
        const timeOffset = offset * timeRange;

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
            const time = startTime + timeOffset + (i / numMarkers) * timeRange;
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

            // Draw label
            ctx.fillStyle = '#94a3b8';
            ctx.font = '11px JetBrains Mono, monospace';
            ctx.fillText(signal?.name || signalName, 8, y + SIGNAL_HEIGHT / 2 + 4);

            // Draw waveform
            if (signal && signal.width === 1) {
                drawDigitalWaveform(ctx, changes, y, startTime + timeOffset, timeRange, drawableWidth);
            } else if (signal && signal.width > 1) {
                drawBusWaveform(ctx, changes, y, startTime + timeOffset, timeRange, drawableWidth, signal.width);
            }
        });

    }, [data, width, height, zoom, offset]);

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
        drawableWidth: number,
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        bitWidth: number
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
                const hexVal = parseInt(lastValue, 2).toString(16).toUpperCase();
                ctx.fillText(`0x${hexVal}`, lastX + 12, mid + 3);
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
        <div className="flex flex-col h-full bg-[#0f172a]">
            {/* Toolbar */}
            <div className="flex items-center gap-2 p-3 bg-[#1e293b] border-b border-[#334155]">
                <div className="flex items-center bg-[#0f172a] rounded-lg p-0.5">
                    <button
                        className="p-2 hover:bg-[#334155] rounded-md text-slate-400 hover:text-white transition-colors"
                        onClick={() => setZoom(z => Math.min(z * 1.5, 10))}
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
                        onClick={() => { setZoom(1); setOffset(0); }}
                        title="Reset View"
                    >
                        <RotateCcw size={14} />
                    </button>
                </div>

                <div className="flex-1" />

                <div className="flex items-center gap-1.5 px-2.5 py-1 bg-[#0f172a] rounded-full text-xs text-slate-400">
                    <Clock size={12} />
                    <span>{data.timescale}</span>
                </div>
            </div>

            {/* Canvas */}
            <div className="flex-1 overflow-auto">
                <canvas
                    ref={canvasRef}
                    width={width}
                    height={height}
                    className="cursor-crosshair"
                />
            </div>
        </div>
    );
};

export default WaveformViewer;
