'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { FiPlay, FiZap, FiSave, FiLoader, FiCheck, FiAlertCircle, FiX } from 'react-icons/fi';
import { useEditorStore } from '@/lib/store/editor';
import { useProjectStore } from '@/lib/store/project';
import { parseVCD, VCDData } from '@/lib/waveform/vcdParser';
import ProjectSelector from './ProjectSelector';

interface ToolbarProps {
    onSimulationComplete?: (vcdData: VCDData) => void;
}

const Toolbar: React.FC<ToolbarProps> = ({ onSimulationComplete }) => {
    const { files, activeFileId, markAsDirty } = useEditorStore();
    const { updateModule } = useProjectStore();
    const activeFile = files.find(f => f.id === activeFileId);

    const [isRunning, setIsRunning] = useState(false);
    const [isSaving, setIsSaving] = useState(false);
    const [output, setOutput] = useState<string | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [saveSuccess, setSaveSuccess] = useState(false);
    const [isGeneratingTB, setIsGeneratingTB] = useState(false);

    // Generate Testbench
    const handleGenerateTB = async () => {
        if (!activeFile) return;

        setIsGeneratingTB(true);
        setError(null);
        setOutput(null);

        try {
            const moduleNameMatch = activeFile.content.match(/module\s+(\w+)/);
            const moduleName = moduleNameMatch ? moduleNameMatch[1] : 'unknown';

            const response = await fetch('/api/llm/testbench', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    code: activeFile.content,
                    moduleName
                })
            });

            const result = await response.json();

            if (result.error) {
                setError(result.error);
            } else if (result.code) {
                // Create new file
                const tbFilename = `${activeFile.name.replace(/\.[^/.]+$/, "")}_tb.v`;
                const { openFile, setActiveFile } = useEditorStore.getState();

                // Add file to store
                openFile({
                    id: tbFilename, // Simple ID for now
                    name: tbFilename,
                    content: result.code,
                    type: 'verilog'
                });

                // Switch to it
                // setActiveFile(tbFilename); // openFile already sets specific file active? Check store.
                // Store says: openFile sets activeFileId to newFile.id. So we don't need setActiveFile explicit call if openFile does it.

                setOutput(`Generated ${tbFilename}`);
            }
        } catch (err: any) {
            setError(err.message || 'Failed to generate testbench');
        } finally {
            setIsGeneratingTB(false);
        }
    };

    // Save file function
    const handleSave = useCallback(async () => {
        if (!activeFile || !activeFile.isDirty) return;

        setIsSaving(true);
        setError(null);

        try {
            const result = await updateModule(activeFile.id, {
                verilogCode: activeFile.content,
            });

            if (result) {
                markAsDirty(activeFile.id, false);
                setSaveSuccess(true);
                setTimeout(() => setSaveSuccess(false), 2000);
            } else {
                setError('Failed to save');
            }
        } catch (err: unknown) {
            setError(err instanceof Error ? err.message : 'Save failed');
        } finally {
            setIsSaving(false);
        }
    }, [activeFile, updateModule, markAsDirty]);

    // Keyboard shortcut (Ctrl+S)
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if ((e.ctrlKey || e.metaKey) && e.key === 's') {
                e.preventDefault();
                handleSave();
            }
        };

        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [handleSave]);


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
        } catch (err: unknown) {
            setError(err instanceof Error ? err.message : 'Network error');
        } finally {
            setIsRunning(false);
        }
    };

    const [isVerifying, setIsVerifying] = useState(false);

    // Verify (Formal)
    const handleVerify = async () => {
        if (!activeFile) return;
        setIsVerifying(true);
        setError(null);
        setOutput(null);

        try {
            const response = await fetch('/api/verification/prove', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    code: activeFile.content
                })
            });
            const result = await response.json();
            if (result.success) {
                setOutput('Verification PASSED');
            } else {
                setError(result.errors.join('\n') || 'Verification FAILED');
            }
        } catch (err: any) {
            setError(err.message || 'Verification failed');
        } finally {
            setIsVerifying(false);
        }
    };

    return (
        <div className="flex items-center gap-3 px-4 py-2.5 glass border-b border-[var(--border-subtle)]">
            {/* Project Selector */}
            <ProjectSelector />

            {/* Divider */}
            <div className="w-px h-6 bg-[var(--border-subtle)]" />

            {/* Save Button */}
            <button
                className={`
                    flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-all duration-200
                    ${!activeFile?.isDirty
                        ? 'bg-[var(--surface-elevated)] text-[var(--text-muted)] cursor-not-allowed'
                        : isSaving
                            ? 'bg-[var(--surface-elevated)] text-[var(--text-muted)]'
                            : saveSuccess
                                ? 'bg-[var(--success)]/20 text-[var(--success)] border border-[var(--success)]/30'
                                : 'btn-secondary'
                    }
                `}
                onClick={handleSave}
                disabled={!activeFile?.isDirty || isSaving}
                title="Save (Ctrl+S)"
            >
                {isSaving ? (
                    <FiLoader className="animate-spin" size={14} />
                ) : saveSuccess ? (
                    <FiCheck size={14} />
                ) : (
                    <FiSave size={14} />
                )}
                <span>Save</span>
            </button>

            {/* Run Button */}
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
                        <FiLoader className="animate-spin" size={14} />
                        <span>Running...</span>
                    </>
                ) : (
                    <>
                        <FiPlay size={14} />
                        <span>Run</span>
                    </>
                )}
            </button>

            {/* Generate TB Button */}
            <button
                className={`
                    flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-all duration-200
                    ${isGeneratingTB
                        ? 'bg-[var(--surface-elevated)] text-[var(--text-muted)] cursor-not-allowed'
                        : 'btn-secondary'
                    }
                `}
                onClick={handleGenerateTB}
                disabled={isGeneratingTB || !activeFile}
                title="Generate Testbench using LLM"
            >
                {isGeneratingTB ? (
                    <FiLoader className="animate-spin" size={14} />
                ) : (
                    <FiCheck size={14} />
                )}
                <span>Gen TB</span>
            </button>

            {/* Verify Button (Formal) */}
            <button
                className={`
                    flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-all duration-200
                    ${isVerifying
                        ? 'bg-[var(--surface-elevated)] text-[var(--text-muted)] cursor-not-allowed'
                        : 'btn-secondary'
                    }
                `}
                onClick={handleVerify}
                disabled={isVerifying || !activeFile}
                title="Run Formal Verification (SBY)"
            >
                {isVerifying ? (
                    <FiLoader className="animate-spin" size={14} />
                ) : (
                    <FiCheck size={14} /> // Or another icon like 'FiShield' if imported
                )}
                <span>Verify</span>
            </button>

            {/* Lint Button */}
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
