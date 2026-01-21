'use client';

import React, { useState, Suspense } from 'react';
import dynamic from 'next/dynamic';
import { Panel, Group, Separator } from 'react-resizable-panels';

import FileTree from '@/components/layout/FileTree';
import EditorTabs from '@/components/layout/EditorTabs';
import Toolbar from '@/components/layout/Toolbar';
import { useEditorStore } from '@/lib/store/editor';
import { VCDData } from '@/lib/waveform/vcdParser';

// Dynamic imports for heavy components (code splitting)
const FSMEditor = dynamic(() => import('@/components/fsm').then(mod => mod.FSMEditor), {
    loading: () => <EditorLoading label="Loading FSM Editor..." />,
    ssr: false,
});

const VerilogEditor = dynamic(() => import('@/components/editor/VerilogEditor'), {
    loading: () => <EditorLoading label="Loading Code Editor..." />,
    ssr: false,
});

const WaveformViewer = dynamic(() => import('@/components/waveform/WaveformViewer'), {
    loading: () => <EditorLoading label="Loading Waveform Viewer..." />,
    ssr: false,
});

// Loading placeholder component
function EditorLoading({ label }: { label: string }) {
    return (
        <div className="flex h-full items-center justify-center bg-[var(--surface)]">
            <div className="flex flex-col items-center gap-3 text-[var(--text-muted)]">
                <div className="w-8 h-8 border-2 border-[var(--accent-primary)]/30 border-t-[var(--accent-primary)] rounded-full animate-spin" />
                <span className="text-sm">{label}</span>
            </div>
        </div>
    );
}

export default function IDEPage() {
    const { files, activeFileId } = useEditorStore();
    const activeFile = files.find(f => f.id === activeFileId);

    const [vcdData, setVcdData] = useState<VCDData | null>(null);
    const [showWaveform, setShowWaveform] = useState(false);

    const handleSimulationComplete = (data: VCDData) => {
        setVcdData(data);
        setShowWaveform(true);
    };

    return (
        <div className="flex h-screen w-screen overflow-hidden bg-[var(--background)] gradient-mesh">
            {/* File Tree Sidebar */}
            <FileTree />

            {/* Main Editor Area */}
            <div className="flex flex-1 flex-col overflow-hidden">
                {/* Toolbar */}
                <Toolbar onSimulationComplete={handleSimulationComplete} />

                {/* Tabs */}
                <EditorTabs />

                {/* Vertical split: Editors + Waveform */}
                <div className="flex-1 overflow-hidden">
                    <Group orientation="vertical" id="main-layout" className="h-full">
                        {/* Top: Code + FSM Split */}
                        <Panel id="editors-panel" defaultSize={showWaveform ? 60 : 100} minSize={30}>
                            <Group orientation="horizontal" id="ide-layout" className="h-full">
                                {/* Code Editor Panel */}
                                <Panel id="code-panel" defaultSize={50} minSize={20}>
                                    <div className="h-full bg-[var(--surface)] border-r border-[var(--border-subtle)]">
                                        {activeFile ? (
                                            <Suspense fallback={<EditorLoading label="Loading..." />}>
                                                <VerilogEditor
                                                    value={activeFile.content}
                                                    onChange={(newContent) => {
                                                        useEditorStore.getState().updateFileContent(activeFile.id, newContent || '');
                                                    }}
                                                    height="100%"
                                                />
                                            </Suspense>
                                        ) : (
                                            <div className="flex h-full flex-col items-center justify-center text-[var(--text-muted)] gap-2">
                                                <svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="opacity-30">
                                                    <path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z" />
                                                    <polyline points="14,2 14,8 20,8" />
                                                </svg>
                                                <span className="text-sm">Open a file from the explorer</span>
                                            </div>
                                        )}
                                    </div>
                                </Panel>

                                {/* Resize Handle */}
                                <Separator
                                    id="h-resize"
                                    className="w-1 bg-[var(--border-subtle)] hover:bg-[var(--accent-primary)] cursor-col-resize transition-colors duration-150"
                                />

                                {/* FSM Editor Panel */}
                                <Panel id="fsm-panel" defaultSize={50} minSize={20}>
                                    <div className="h-full overflow-hidden bg-slate-50">
                                        <Suspense fallback={<EditorLoading label="Loading FSM..." />}>
                                            <FSMEditor />
                                        </Suspense>
                                    </div>
                                </Panel>
                            </Group>
                        </Panel>

                        {/* Waveform Panel (collapsible) */}
                        {showWaveform && vcdData && (
                            <>
                                <Separator
                                    id="v-resize"
                                    className="h-1 bg-[var(--border-subtle)] hover:bg-[var(--accent-primary)] cursor-row-resize transition-colors duration-150"
                                />
                                <Panel id="waveform-panel" defaultSize={40} minSize={15}>
                                    <div className="h-full bg-[var(--surface)] relative border-t border-[var(--border-subtle)]">
                                        {/* Close button */}
                                        <button
                                            className="absolute top-3 right-3 z-10 p-1.5 glass rounded-md text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--error)]/20 transition-colors"
                                            onClick={() => setShowWaveform(false)}
                                            title="Close waveform viewer"
                                        >
                                            <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                                <line x1="18" y1="6" x2="6" y2="18" />
                                                <line x1="6" y1="6" x2="18" y2="18" />
                                            </svg>
                                        </button>
                                        <Suspense fallback={<EditorLoading label="Loading..." />}>
                                            <WaveformViewer data={vcdData} width={1000} height={300} />
                                        </Suspense>
                                    </div>
                                </Panel>
                            </>
                        )}
                    </Group>
                </div>
            </div>
        </div>
    );
}
