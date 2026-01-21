'use client';

import React, { useState, useEffect } from 'react';
import { FiFile, FiFolder, FiCpu, FiGrid, FiChevronRight, FiChevronDown, FiPlus, FiTrash2 } from 'react-icons/fi';
import { useEditorStore } from '../../lib/store/editor';
import { useProjectStore } from '../../lib/store/project';

const FileTree: React.FC = () => {
    const { openFile, activeFileId } = useEditorStore();
    const {
        currentProject,
        modules,
        isLoading,
        createModule,
        deleteModule,
        fetchModules
    } = useProjectStore();

    const [showCreate, setShowCreate] = useState(false);
    const [newFileName, setNewFileName] = useState('');
    const [expandedFolders, setExpandedFolders] = useState<Set<string>>(new Set(['src', 'test']));

    // Re-fetch modules when project changes
    useEffect(() => {
        if (currentProject) {
            fetchModules(currentProject.id);
        }
    }, [currentProject, fetchModules]);

    const toggleFolder = (folderId: string) => {
        const newExpanded = new Set(expandedFolders);
        if (newExpanded.has(folderId)) {
            newExpanded.delete(folderId);
        } else {
            newExpanded.add(folderId);
        }
        setExpandedFolders(newExpanded);
    };

    const handleCreateModule = async () => {
        if (!newFileName.trim() || !currentProject) return;

        const name = newFileName.trim();
        const type = name.endsWith('.fsm') ? 'fsm' : 'verilog';

        const module = await createModule(currentProject.id, name, type);
        if (module) {
            // Open the new file
            openFile({
                id: module.id,
                name: module.name,
                type: type,
                content: module.verilogCode || '',
            });
            setNewFileName('');
            setShowCreate(false);
        }
    };

    const handleDeleteModule = async (e: React.MouseEvent, moduleId: string, moduleName: string) => {
        e.stopPropagation();
        if (confirm(`Delete "${moduleName}"?`)) {
            await deleteModule(moduleId);
        }
    };

    const handleOpenFile = (module: typeof modules[0]) => {
        const type = (module.metadata as { type?: string })?.type === 'fsm' ? 'fsm' : 'verilog';
        openFile({
            id: module.id,
            name: module.name,
            type: type,
            content: module.verilogCode || '',
        });
    };

    const getFileIcon = (name: string, metadata?: unknown) => {
        const type = (metadata as { type?: string })?.type;
        if (type === 'fsm' || name.endsWith('.fsm')) return { Icon: FiGrid, color: 'text-purple-400' };
        if (name.includes('_tb') || name.includes('_test')) return { Icon: FiCpu, color: 'text-emerald-400' };
        return { Icon: FiFile, color: 'text-blue-400' };
    };

    // Group modules into folders
    const srcModules = modules.filter(m => !m.name.includes('_tb') && !m.name.includes('_test'));
    const testModules = modules.filter(m => m.name.includes('_tb') || m.name.includes('_test'));

    const renderFolder = (name: string, items: typeof modules, folderId: string) => {
        const isExpanded = expandedFolders.has(folderId);

        return (
            <div key={folderId}>
                <div
                    onClick={() => toggleFolder(folderId)}
                    className="flex items-center py-1.5 cursor-pointer rounded-md mx-1 px-2 hover:bg-[var(--surface-elevated)] text-[var(--text-secondary)] transition-colors"
                >
                    <span className="w-4 flex justify-center mr-1 text-[var(--text-muted)]">
                        {isExpanded ? <FiChevronDown size={12} /> : <FiChevronRight size={12} />}
                    </span>
                    <FiFolder className="mr-2 text-amber-400" size={14} />
                    <span className="text-xs font-medium">{name}</span>
                    <span className="ml-auto text-[10px] text-[var(--text-muted)]">{items.length}</span>
                </div>

                {isExpanded && (
                    <div className="animate-slide-in-up">
                        {items.map((module) => {
                            const { Icon, color } = getFileIcon(module.name, module.metadata);
                            const isActive = module.id === activeFileId;

                            return (
                                <div
                                    key={module.id}
                                    onClick={() => handleOpenFile(module)}
                                    className={`
                                        flex items-center py-1.5 cursor-pointer rounded-md mx-1 px-2 ml-6
                                        transition-all duration-150 ease-out group
                                        ${isActive
                                            ? 'bg-[var(--accent-primary)]/15 text-[var(--accent-primary)] border-l-2 border-[var(--accent-primary)]'
                                            : 'hover:bg-[var(--surface-elevated)] text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
                                        }
                                    `}
                                >
                                    <Icon className={`mr-2 flex-shrink-0 ${color}`} size={14} />
                                    <span className="text-xs font-medium truncate flex-1">{module.name}</span>
                                    <button
                                        onClick={(e) => handleDeleteModule(e, module.id, module.name)}
                                        className="p-1 opacity-0 group-hover:opacity-100 hover:bg-[var(--error)]/20 hover:text-[var(--error)] rounded transition-all"
                                        title="Delete"
                                    >
                                        <FiTrash2 size={10} />
                                    </button>
                                </div>
                            );
                        })}
                    </div>
                )}
            </div>
        );
    };

    return (
        <div className="w-56 h-full glass border-r border-[var(--border-subtle)] flex flex-col">
            {/* Header */}
            <div className="px-4 py-3 border-b border-[var(--border-subtle)] flex items-center justify-between">
                <p className="text-[10px] font-semibold text-[var(--text-muted)] uppercase tracking-wider">
                    Explorer
                </p>
                {currentProject && (
                    <button
                        onClick={() => setShowCreate(!showCreate)}
                        className="p-1 hover:bg-[var(--surface-elevated)] rounded text-[var(--accent-primary)]"
                        title="New File"
                    >
                        <FiPlus size={12} />
                    </button>
                )}
            </div>

            {/* Create File Form */}
            {showCreate && currentProject && (
                <div className="px-3 py-2 border-b border-[var(--border-subtle)]">
                    <input
                        type="text"
                        value={newFileName}
                        onChange={(e) => setNewFileName(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && handleCreateModule()}
                        placeholder="filename.v or name.fsm"
                        className="w-full px-2 py-1.5 text-xs bg-[var(--surface)] border border-[var(--border-default)] rounded focus:outline-none focus:border-[var(--accent-primary)] text-[var(--text-primary)]"
                        autoFocus
                    />
                    <div className="flex gap-2 mt-2">
                        <button
                            onClick={handleCreateModule}
                            className="flex-1 px-2 py-1 text-[10px] btn-primary"
                            disabled={!newFileName.trim()}
                        >
                            Create
                        </button>
                        <button
                            onClick={() => setShowCreate(false)}
                            className="px-2 py-1 text-[10px] btn-ghost"
                        >
                            Cancel
                        </button>
                    </div>
                </div>
            )}

            {/* File Tree */}
            <div className="flex-1 overflow-y-auto py-2">
                {!currentProject ? (
                    <div className="px-4 py-8 text-center">
                        <FiFolder className="mx-auto mb-2 text-[var(--text-muted)]" size={24} />
                        <p className="text-xs text-[var(--text-muted)]">
                            Select a project to view files
                        </p>
                    </div>
                ) : isLoading ? (
                    <div className="px-4 py-8 text-center text-xs text-[var(--text-muted)]">
                        Loading...
                    </div>
                ) : modules.length === 0 ? (
                    <div className="px-4 py-8 text-center">
                        <FiFile className="mx-auto mb-2 text-[var(--text-muted)]" size={24} />
                        <p className="text-xs text-[var(--text-muted)]">
                            No files yet
                        </p>
                        <button
                            onClick={() => setShowCreate(true)}
                            className="mt-2 text-xs text-[var(--accent-primary)] hover:underline"
                        >
                            Create your first file
                        </button>
                    </div>
                ) : (
                    <>
                        {srcModules.length > 0 && renderFolder('src', srcModules, 'src')}
                        {testModules.length > 0 && renderFolder('test', testModules, 'test')}
                    </>
                )}
            </div>

            {/* Footer */}
            <div className="px-4 py-2 border-t border-[var(--border-subtle)]">
                <p className="text-[10px] text-[var(--text-muted)]">
                    {modules.length} file{modules.length !== 1 ? 's' : ''}
                </p>
            </div>
        </div>
    );
};

export default FileTree;
