'use client';

import React from 'react';
import { Panel, Group, Separator } from 'react-resizable-panels';

import { FSMEditor } from '@/components/fsm';
import VerilogEditor from '@/components/editor/VerilogEditor';
import FileTree from '@/components/layout/FileTree';
import EditorTabs from '@/components/layout/EditorTabs';
import { useEditorStore } from '@/lib/store/editor';

export default function IDEPage() {
    const { files, activeFileId } = useEditorStore();
    const activeFile = files.find(f => f.id === activeFileId);

    return (
        <div className="flex h-screen w-screen overflow-hidden bg-gray-900">
            {/* File Tree Sidebar */}
            <FileTree />

            {/* Main Editor Area */}
            <div className="flex flex-1 flex-col overflow-hidden">
                {/* Tabs */}
                <EditorTabs />

                {/* Split Pane: Code Editor + FSM Editor */}
                <div className="flex-1 overflow-hidden">
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
                            id="resize-handle"
                            className="w-1 bg-gray-600 hover:bg-blue-500 cursor-col-resize transition-colors"
                        />

                        {/* FSM Editor Panel */}
                        <Panel id="fsm-panel" defaultSize={50} minSize={20}>
                            <div className="h-full overflow-hidden bg-slate-50">
                                <FSMEditor />
                            </div>
                        </Panel>
                    </Group>
                </div>
            </div>
        </div>
    );
}
