'use client';

import React, { useState } from 'react';
import { Panel, Group, Separator } from 'react-resizable-panels';

import { FSMEditor } from '@/components/fsm';
import VerilogEditor from '@/components/editor/VerilogEditor';
import FileTree from '@/components/layout/FileTree';
import EditorTabs from '@/components/layout/EditorTabs';
import Toolbar from '@/components/layout/Toolbar';
import WaveformViewer from '@/components/waveform/WaveformViewer';
import { useEditorStore } from '@/lib/store/editor';
import { VCDData } from '@/lib/waveform/vcdParser';

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
        <div className="flex h-screen w-screen overflow-hidden bg-gray-900">
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
                                    <div className="h-full bg-gray-800">
                                        {activeFile ? (
                                            <VerilogEditor
                                                value={activeFile.content}
                                                onChange={(newContent) => {
                                                    useEditorStore.getState().updateFileContent(activeFile.id, newContent || '');
                                                }}
                                                height="100%"
                                            />
                                        ) : (
                                            <div className="flex h-full items-center justify-center text-gray-500">
                                                Open a file from the explorer
                                            </div>
                                        )}
                                    </div>
                                </Panel>

                                {/* Resize Handle */}
                                <Separator
                                    id="h-resize"
                                    className="w-1 bg-gray-600 hover:bg-blue-500 cursor-col-resize transition-colors"
                                />

                                {/* FSM Editor Panel */}
                                <Panel id="fsm-panel" defaultSize={50} minSize={20}>
                                    <div className="h-full overflow-hidden bg-slate-50">
                                        <FSMEditor />
                                    </div>
                                </Panel>
                            </Group>
                        </Panel>

                        {/* Waveform Panel (collapsible) */}
                        {showWaveform && vcdData && (
                            <>
                                <Separator
                                    id="v-resize"
                                    className="h-1 bg-gray-600 hover:bg-blue-500 cursor-row-resize transition-colors"
                                />
                                <Panel id="waveform-panel" defaultSize={40} minSize={15}>
                                    <div className="h-full bg-gray-900 relative">
                                        {/* Close button */}
                                        <button
                                            className="absolute top-2 right-2 z-10 p-1 bg-gray-700 hover:bg-red-500 rounded text-white text-xs"
                                            onClick={() => setShowWaveform(false)}
                                        >
                                            ✕
                                        </button>
                                        <WaveformViewer data={vcdData} width={1000} height={300} />
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
