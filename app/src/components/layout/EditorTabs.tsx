'use client';

import React from 'react';
import { FiX } from 'react-icons/fi';
import { useEditorStore } from '../../lib/store/editor';

const EditorTabs: React.FC = () => {
    const { files, activeFileId, setActiveFile, closeFile } = useEditorStore();

    if (files.length === 0) {
        return null;
    }

    return (
        <div className="flex bg-[var(--surface)] overflow-x-auto border-b border-[var(--border-subtle)]">
            {files.map(file => {
                const isActive = file.id === activeFileId;
                return (
                    <div
                        key={file.id}
                        className={`
                            relative flex items-center px-4 py-2.5 cursor-pointer min-w-[120px] max-w-[180px] 
                            justify-between group transition-all duration-150
                            ${isActive
                                ? 'bg-[var(--surface-elevated)] text-[var(--text-primary)]'
                                : 'text-[var(--text-secondary)] hover:bg-[var(--surface-elevated)]/50 hover:text-[var(--text-primary)]'
                            }
                        `}
                        onClick={() => setActiveFile(file.id)}
                    >
                        {/* Active indicator */}
                        {isActive && (
                            <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-gradient-to-r from-[var(--accent-primary)] to-[var(--accent-secondary)]" />
                        )}

                        <div className="flex items-center overflow-hidden gap-2">
                            {/* File type indicator dot */}
                            <span className={`w-2 h-2 rounded-full flex-shrink-0 ${file.type === 'fsm' ? 'bg-purple-400' : 'bg-blue-400'
                                }`} />

                            <span className={`text-xs truncate ${isActive ? 'font-medium' : ''}`}>
                                {file.name}
                            </span>

                            {file.isDirty && (
                                <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse-glow flex-shrink-0" />
                            )}
                        </div>

                        <button
                            className={`
                                ml-2 p-1 rounded transition-all duration-150 flex-shrink-0
                                hover:bg-[var(--error)]/20 hover:text-[var(--error)]
                                ${isActive ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'}
                            `}
                            onClick={(e) => {
                                e.stopPropagation();
                                closeFile(file.id);
                            }}
                            aria-label="Close tab"
                        >
                            <FiX size={12} />
                        </button>
                    </div>
                );
            })}
        </div>
    );
};

export default EditorTabs;
