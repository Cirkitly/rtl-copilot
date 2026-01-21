'use client';

import React, { useState } from 'react';
import { FiPlay, FiTerminal, FiZap, FiX, FiLoader, FiCheck, FiAlertCircle } from 'react-icons/fi';
import { useEditorStore } from '@/lib/store/editor';
import { parseVCD, VCDData } from '@/lib/waveform/vcdParser';

interface ToolbarProps {
    onSimulationComplete?: (vcdData: VCDData) => void;
}

const Toolbar: React.FC<ToolbarProps> = ({ onSimulationComplete }) => {
    const { files, activeFileId } = useEditorStore();
    const activeFile = files.find(f => f.id === activeFileId);

    const [isRunning, setIsRunning] = useState(false);
    const [output, setOutput] = useState<string | null>(null);
    const [error, setError] = useState<string | null>(null);

    const handleRunSimulation = async () => {
        if (!activeFile) {
            setError('No file selected');
            return;
        }

        setIsRunning(true);
        setError(null);
        setOutput(null);

        try {
            const response = await fetch('/api/simulation/run', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    moduleCode: activeFile.content,
                })
            });

            const result = await response.json();

            if (!result.success) {
                setError(result.errors?.join('\n') || 'Simulation failed');
            } else {
                setOutput(result.output || 'Compilation successful');
                const mockVCD = generateMockVCD();
                const vcdData = parseVCD(mockVCD);
                onSimulationComplete?.(vcdData);
            }
        } catch (err: any) {
            setError(err.message || 'Network error');
        } finally {
            setIsRunning(false);
        }
    };

    return (
        <div className="flex items-center gap-3 px-4 py-2.5 glass border-b border-[var(--border-subtle)]">
            {/* Primary Action - Run */}
            <button
                className={`
                    flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200
                    ${isRunning
                        ? 'bg-[var(--surface-elevated)] text-[var(--text-muted)] cursor-not-allowed'
                        : 'btn-primary'
                    }
                `}
                onClick={handleRunSimulation}
                disabled={isRunning || !activeFile}
            >
                {isRunning ? (
                    <>
                        <FiLoader className="animate-spin-slow" size={14} />
                        <span>Running...</span>
                    </>
                ) : (
                    <>
                        <FiPlay size={14} />
                        <span>Run</span>
                    </>
                )}
            </button>

            {/* Secondary Action - Lint */}
            <button
                className="btn-secondary flex items-center gap-2 px-3 py-2 text-sm"
                title="Lint with Verilator"
            >
                <FiZap size={14} />
                <span>Lint</span>
            </button>

            {/* Spacer */}
            <div className="flex-1" />

            {/* Status Indicators */}
            {error && (
                <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-[var(--error)]/10 border border-[var(--error)]/20 animate-fade-in">
                    <FiAlertCircle className="text-[var(--error)]" size={14} />
                    <span className="text-xs text-[var(--error)] max-w-[200px] truncate">
                        {error}
                    </span>
                    <button
                        onClick={() => setError(null)}
                        className="text-[var(--error)] hover:text-[var(--error)]/80 transition-colors"
                    >
                        <FiX size={12} />
                    </button>
                </div>
            )}

            {output && !error && (
                <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-[var(--success)]/10 border border-[var(--success)]/20 animate-fade-in">
                    <FiCheck className="text-[var(--success)]" size={14} />
                    <span className="text-xs text-[var(--success)] max-w-[200px] truncate">
                        {output}
                    </span>
                </div>
            )}

            {/* File indicator */}
            {activeFile && (
                <div className="flex items-center gap-1.5 text-xs text-[var(--text-muted)]">
                    <FiTerminal size={12} />
                    <span>{activeFile.name}</span>
                </div>
            )}
        </div>
    );
};

// Mock VCD for demonstration
function generateMockVCD(): string {
    return `$date
    Mon Jan 20 10:00:00 2026
$end
$version RTL Copilot 1.0 $end
$timescale 1ns $end
$scope module tb $end
$var wire 1 ! clk $end
$var wire 1 " rst_n $end
$var wire 8 # count [7:0] $end
$upscope $end
$enddefinitions $end
#0
0!
0"
b00000000 #
#5
1!
#10
0!
1"
#15
1!
b00000001 #
#20
0!
#25
1!
b00000010 #
#30
0!
#35
1!
b00000011 #
#40
0!
#45
1!
b00000100 #
#50
0!
`;
}

export default Toolbar;
