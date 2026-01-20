'use client';

import React, { useState } from 'react';
import { FiPlay, FiTerminal, FiZap, FiX } from 'react-icons/fi';
import { useEditorStore } from '@/lib/store/editor';
import { parseVCD, VCDData } from '@/lib/waveform/vcdParser';
import WaveformViewer from '@/components/waveform/WaveformViewer';

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
                    // For now, no testbench - just compilation check
                })
            });

            const result = await response.json();

            if (!result.success) {
                setError(result.errors?.join('\n') || 'Simulation failed');
            } else {
                setOutput(result.output || 'Compilation successful');

                // Show waveform viewer with mock/real VCD data
                // For demo without real simulation, use mock data
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
        <div className="flex items-center gap-2 px-3 py-2 bg-gray-800 border-b border-gray-700">
            <button
                className={`flex items-center gap-2 px-3 py-1.5 rounded text-sm font-medium transition-colors ${isRunning
                    ? 'bg-gray-600 text-gray-400 cursor-not-allowed'
                    : 'bg-green-600 hover:bg-green-500 text-white'
                    }`}
                onClick={handleRunSimulation}
                disabled={isRunning || !activeFile}
            >
                {isRunning ? (
                    <>
                        <span className="animate-spin">⏳</span>
                        Running...
                    </>
                ) : (
                    <>
                        <FiPlay />
                        Run Simulation
                    </>
                )}
            </button>

            <button
                className="flex items-center gap-2 px-3 py-1.5 bg-gray-700 hover:bg-gray-600 rounded text-sm"
                title="Lint with Verilator"
            >
                <FiZap />
                Lint
            </button>

            <div className="flex-1" />

            {/* Status indicator */}
            {error && (
                <div className="flex items-center gap-2 text-red-400 text-sm">
                    <FiX />
                    {error.substring(0, 50)}
                </div>
            )}
            {output && !error && (
                <div className="flex items-center gap-2 text-green-400 text-sm">
                    <FiTerminal />
                    {output.substring(0, 50)}
                </div>
            )}
        </div>
    );
};

// Mock VCD for demonstration when Docker is not available
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
