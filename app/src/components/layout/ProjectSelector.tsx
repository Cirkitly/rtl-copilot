'use client';

import React, { useState, useEffect, useRef } from 'react';
import { FiChevronDown, FiPlus, FiFolder, FiTrash2 } from 'react-icons/fi';
import { useProjectStore } from '@/lib/store/project';
import type { Project } from '@/db/schema';

const ProjectSelector: React.FC = () => {
    const {
        projects,
        currentProject,
        isLoading,
        fetchProjects,
        setCurrentProject,
        createProject,
        deleteProject,
    } = useProjectStore();

    const [isOpen, setIsOpen] = useState(false);
    const [showCreate, setShowCreate] = useState(false);
    const [newProjectName, setNewProjectName] = useState('');
    const dropdownRef = useRef<HTMLDivElement>(null);

    // Fetch projects on mount
    useEffect(() => {
        fetchProjects();
    }, [fetchProjects]);

    // Close dropdown on outside click
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
                setIsOpen(false);
                setShowCreate(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const handleCreateProject = async () => {
        if (!newProjectName.trim()) return;
        const project = await createProject(newProjectName.trim());
        if (project) {
            setCurrentProject(project);
            setNewProjectName('');
            setShowCreate(false);
            setIsOpen(false);
        }
    };

    const handleDeleteProject = async (e: React.MouseEvent, project: Project) => {
        e.stopPropagation();
        if (confirm(`Delete project "${project.name}"? This will delete all modules.`)) {
            await deleteProject(project.id);
        }
    };

    return (
        <div className="relative" ref={dropdownRef}>
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="flex items-center gap-2 px-3 py-1.5 glass rounded-lg text-sm text-[var(--text-primary)] hover:bg-[var(--surface-elevated)] transition-colors"
            >
                <FiFolder size={14} className="text-amber-400" />
                <span className="max-w-[150px] truncate">
                    {currentProject?.name || 'Select Project'}
                </span>
                <FiChevronDown
                    size={12}
                    className={`text-[var(--text-muted)] transition-transform ${isOpen ? 'rotate-180' : ''}`}
                />
            </button>

            {isOpen && (
                <div className="absolute top-full left-0 mt-2 w-64 glass rounded-xl shadow-xl z-50 py-2 animate-fade-in border border-[var(--border-subtle)]">
                    {/* Header */}
                    <div className="px-3 py-1.5 text-[10px] font-semibold text-[var(--text-muted)] uppercase tracking-wider flex justify-between items-center">
                        <span>Projects</span>
                        <button
                            onClick={() => setShowCreate(!showCreate)}
                            className="p-1 hover:bg-[var(--surface-elevated)] rounded text-[var(--accent-primary)]"
                            title="Create Project"
                        >
                            <FiPlus size={12} />
                        </button>
                    </div>

                    {/* Create Project Form */}
                    {showCreate && (
                        <div className="px-3 py-2 border-b border-[var(--border-subtle)]">
                            <input
                                type="text"
                                value={newProjectName}
                                onChange={(e) => setNewProjectName(e.target.value)}
                                onKeyDown={(e) => e.key === 'Enter' && handleCreateProject()}
                                placeholder="Project name..."
                                className="w-full px-2 py-1.5 text-xs bg-[var(--surface)] border border-[var(--border-default)] rounded focus:outline-none focus:border-[var(--accent-primary)] text-[var(--text-primary)]"
                                autoFocus
                            />
                            <div className="flex gap-2 mt-2">
                                <button
                                    onClick={handleCreateProject}
                                    className="flex-1 px-2 py-1 text-xs btn-primary"
                                    disabled={!newProjectName.trim()}
                                >
                                    Create
                                </button>
                                <button
                                    onClick={() => setShowCreate(false)}
                                    className="px-2 py-1 text-xs btn-ghost"
                                >
                                    Cancel
                                </button>
                            </div>
                        </div>
                    )}

                    {/* Project List */}
                    {isLoading ? (
                        <div className="px-3 py-4 text-center text-xs text-[var(--text-muted)]">
                            Loading...
                        </div>
                    ) : projects.length === 0 ? (
                        <div className="px-3 py-4 text-center text-xs text-[var(--text-muted)]">
                            No projects yet
                        </div>
                    ) : (
                        <div className="max-h-48 overflow-y-auto">
                            {projects.map((project) => (
                                <div
                                    key={project.id}
                                    onClick={() => {
                                        setCurrentProject(project);
                                        setIsOpen(false);
                                    }}
                                    className={`
                                        flex items-center justify-between px-3 py-2 cursor-pointer group
                                        ${currentProject?.id === project.id
                                            ? 'bg-[var(--accent-primary)]/10 text-[var(--accent-primary)]'
                                            : 'text-[var(--text-secondary)] hover:bg-[var(--surface-elevated)] hover:text-[var(--text-primary)]'
                                        }
                                    `}
                                >
                                    <div className="flex items-center gap-2 overflow-hidden">
                                        <FiFolder size={14} className="flex-shrink-0" />
                                        <span className="text-sm truncate">{project.name}</span>
                                    </div>
                                    <button
                                        onClick={(e) => handleDeleteProject(e, project)}
                                        className="p-1 opacity-0 group-hover:opacity-100 hover:bg-[var(--error)]/20 hover:text-[var(--error)] rounded transition-all"
                                        title="Delete Project"
                                    >
                                        <FiTrash2 size={12} />
                                    </button>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            )}
        </div>
    );
};

export default ProjectSelector;
