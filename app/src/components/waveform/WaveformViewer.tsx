'use client';

import React, { useRef, useEffect, useState } from 'react';
import { VCDData, ValueChange, getValueAtTime } from '@/lib/waveform/vcdParser';

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

    // Get time range from data
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

    // Draw waveforms
    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;

        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        const { min: startTime, max: endTime } = getTimeRange();
        const timeRange = (endTime - startTime) / zoom;
        const timeOffset = offset * timeRange;

        // Clear canvas
        ctx.fillStyle = '#1e1e1e';
        ctx.fillRect(0, 0, width, height);

        const signalNames = Array.from(data.signals.keys());
        const drawableWidth = width - LABEL_WIDTH;

        // Draw time header
        ctx.fillStyle = '#333';
        ctx.fillRect(0, 0, width, TIME_HEADER_HEIGHT);
        ctx.fillStyle = '#888';
        ctx.font = '10px monospace';

        // Time markers
        const numMarkers = 10;
        for (let i = 0; i <= numMarkers; i++) {
            const time = startTime + timeOffset + (i / numMarkers) * timeRange;
            const x = LABEL_WIDTH + (i / numMarkers) * drawableWidth;
            ctx.fillText(`${Math.round(time)}`, x - 10, 15);
            ctx.strokeStyle = '#444';
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

            // Draw label
            ctx.fillStyle = '#888';
            ctx.font = '12px monospace';
            ctx.fillText(signal?.name || signalName, 5, y + SIGNAL_HEIGHT / 2 + 4);

            // Draw waveform
            if (signal && signal.width === 1) {
                drawDigitalWaveform(ctx, changes, y, startTime + timeOffset, timeRange, drawableWidth);
            } else if (signal && signal.width > 1) {
                drawBusWaveform(ctx, changes, y, startTime + timeOffset, timeRange, drawableWidth, signal.width);
            }
        });

    }, [data, width, height, zoom, offset]);

    // Draw single-bit digital waveform
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

        ctx.strokeStyle = '#00ff00';
        ctx.lineWidth = 1.5;
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

            // Horizontal line to transition point
            ctx.moveTo(lastX, lastY);
            ctx.lineTo(x, lastY);
            // Vertical transition
            ctx.lineTo(x, newY);

            lastX = x;
            lastY = newY;
        }

        // Extend to end
        ctx.lineTo(LABEL_WIDTH + drawableWidth, lastY);
        ctx.stroke();
    };

    // Draw multi-bit bus waveform
    const drawBusWaveform = (
        ctx: CanvasRenderingContext2D,
        changes: ValueChange[],
        y: number,
        startTime: number,
        timeRange: number,
        drawableWidth: number,
        bitWidth: number
    ) => {
        const mid = y + SIGNAL_HEIGHT / 2;
        const top = y + SIGNAL_PADDING;
        const bottom = y + SIGNAL_HEIGHT - SIGNAL_PADDING;

        ctx.strokeStyle = '#ffff00';
        ctx.lineWidth = 1.5;
        ctx.font = '10px monospace';
        ctx.fillStyle = '#ffff00';

        let lastX = LABEL_WIDTH;
        let lastValue = '';

        for (const change of changes) {
            if (change.time < startTime) {
                lastValue = change.value;
                continue;
            }
            if (change.time > startTime + timeRange) break;

            const x = LABEL_WIDTH + ((change.time - startTime) / timeRange) * drawableWidth;

            // Draw diamond shape for bus
            ctx.beginPath();
            ctx.moveTo(lastX, mid);
            ctx.lineTo(lastX + 5, top);
            ctx.lineTo(x - 5, top);
            ctx.lineTo(x, mid);
            ctx.lineTo(x - 5, bottom);
            ctx.lineTo(lastX + 5, bottom);
            ctx.closePath();
            ctx.stroke();

            // Draw hex value
            if (x - lastX > 30 && lastValue) {
                const hexVal = parseInt(lastValue, 2).toString(16).toUpperCase();
                ctx.fillText(`0x${hexVal}`, lastX + 10, mid + 4);
            }

            lastX = x;
            lastValue = change.value;
        }

        // Draw final segment
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
        <div className="flex flex-col bg-gray-900 rounded-lg overflow-hidden">
            {/* Toolbar */}
            <div className="flex items-center gap-2 p-2 bg-gray-800 border-b border-gray-700">
                <button
                    className="px-2 py-1 bg-gray-700 hover:bg-gray-600 rounded text-sm"
                    onClick={() => setZoom(z => Math.min(z * 1.5, 10))}
                >
                    Zoom In
                </button>
                <button
                    className="px-2 py-1 bg-gray-700 hover:bg-gray-600 rounded text-sm"
                    onClick={() => setZoom(z => Math.max(z / 1.5, 0.1))}
                >
                    Zoom Out
                </button>
                <button
                    className="px-2 py-1 bg-gray-700 hover:bg-gray-600 rounded text-sm"
                    onClick={() => { setZoom(1); setOffset(0); }}
                >
                    Reset
                </button>
                <span className="text-xs text-gray-500 ml-4">
                    Timescale: {data.timescale}
                </span>
            </div>

            {/* Canvas */}
            <canvas
                ref={canvasRef}
                width={width}
                height={height}
                className="cursor-crosshair"
            />
        </div>
    );
};

export default WaveformViewer;
