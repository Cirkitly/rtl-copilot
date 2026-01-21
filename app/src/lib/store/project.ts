'use client';

import { create } from 'zustand';
import { devtools, persist } from 'zustand/middleware';
import type { Project, Module } from '@/db/schema';

// LocalStorage keys for fallback mode
const STORAGE_KEYS = {
    projects: 'rtl-copilot-projects',
    modules: 'rtl-copilot-modules',
};

// Check if running in browser
const isBrowser = typeof window !== 'undefined';

// Generate UUID for local mode
const generateId = (): string => {
    if (isBrowser && crypto.randomUUID) {
        return crypto.randomUUID();
    }
    return `local-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
};

// LocalStorage helpers
const getFromStorage = <T>(key: string, fallback: T): T => {
    if (!isBrowser) return fallback;
    try {
        const data = localStorage.getItem(key);
        return data ? JSON.parse(data) : fallback;
    } catch {
        return fallback;
    }
};

const saveToStorage = <T>(key: string, data: T): void => {
    if (!isBrowser) return;
    try {
        localStorage.setItem(key, JSON.stringify(data));
    } catch {
        // Ignore storage errors
    }
};

// Type for API module (may have extra fields)
interface APIModule extends Module {
    promptHistory?: unknown[];
    validation?: unknown;
}

interface ProjectState {
    // State
    projects: Project[];
    currentProject: Project | null;
    modules: Module[];
    isLoading: boolean;
    error: string | null;
    isLocalMode: boolean;

    // Project Actions
    fetchProjects: () => Promise<void>;
    setCurrentProject: (project: Project | null) => void;
    createProject: (name: string, description?: string) => Promise<Project | null>;
    deleteProject: (id: string) => Promise<boolean>;

    // Module Actions
    fetchModules: (projectId: string) => Promise<void>;
    createModule: (projectId: string, name: string, type?: 'verilog' | 'fsm') => Promise<Module | null>;
    updateModule: (id: string, data: Partial<Pick<Module, 'name' | 'verilogCode' | 'fsmGraph' | 'metadata'>>) => Promise<Module | null>;
    deleteModule: (id: string) => Promise<boolean>;
    getModuleById: (id: string) => Module | undefined;
}

export const useProjectStore = create<ProjectState>()(
    devtools(
        persist(
            (set, get) => ({
                projects: [],
                currentProject: null,
                modules: [],
                isLoading: false,
                error: null,
                isLocalMode: false,

                // Fetch all projects (with localStorage fallback)
                fetchProjects: async () => {
                    set({ isLoading: true, error: null });
                    try {
                        const response = await fetch('/api/projects');
                        if (!response.ok) throw new Error('API unavailable');
                        const data = await response.json();
                        if (data.error) throw new Error(data.error);
                        set({ projects: data, isLoading: false, isLocalMode: false });
                        saveToStorage(STORAGE_KEYS.projects, data);
                    } catch {
                        console.warn('Database unavailable, using local storage mode');
                        const localProjects = getFromStorage<Project[]>(STORAGE_KEYS.projects, []);
                        set({ projects: localProjects, isLoading: false, isLocalMode: true, error: null });
                    }
                },

                // Set current project and fetch its modules
                setCurrentProject: (project) => {
                    set({ currentProject: project });
                    if (project) {
                        get().fetchModules(project.id);
                    } else {
                        set({ modules: [] });
                    }
                },

                // Create a new project
                createProject: async (name, description) => {
                    set({ isLoading: true, error: null });
                    const isLocal = get().isLocalMode;

                    if (isLocal) {
                        // Local mode - create in localStorage
                        const newProject: Project = {
                            id: generateId(),
                            name,
                            description: description || null,
                            userId: null,
                            createdAt: new Date(),
                            updatedAt: new Date(),
                        };
                        const projects = [...get().projects, newProject];
                        saveToStorage(STORAGE_KEYS.projects, projects);
                        set({ projects, isLoading: false });
                        return newProject;
                    }

                    try {
                        const response = await fetch('/api/projects', {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({ name, description }),
                        });
                        if (!response.ok) throw new Error('Failed to create project');
                        const newProject = await response.json();
                        set((state) => ({
                            projects: [...state.projects, newProject],
                            isLoading: false,
                        }));
                        return newProject;
                    } catch (error) {
                        set({ error: (error as Error).message, isLoading: false });
                        return null;
                    }
                },

                // Delete a project
                deleteProject: async (id) => {
                    const isLocal = get().isLocalMode;

                    if (isLocal) {
                        const projects = get().projects.filter((p) => p.id !== id);
                        const modules = get().modules.filter((m) => m.projectId !== id);
                        saveToStorage(STORAGE_KEYS.projects, projects);
                        saveToStorage(STORAGE_KEYS.modules, modules);
                        set((state) => ({
                            projects,
                            modules: state.currentProject?.id === id ? [] : modules,
                            currentProject: state.currentProject?.id === id ? null : state.currentProject,
                        }));
                        return true;
                    }

                    try {
                        const response = await fetch(`/api/projects/${id}`, { method: 'DELETE' });
                        if (!response.ok) throw new Error('Failed to delete project');
                        set((state) => ({
                            projects: state.projects.filter((p) => p.id !== id),
                            currentProject: state.currentProject?.id === id ? null : state.currentProject,
                            modules: state.currentProject?.id === id ? [] : state.modules,
                        }));
                        return true;
                    } catch (error) {
                        set({ error: (error as Error).message });
                        return false;
                    }
                },

                // Fetch modules for a project
                fetchModules: async (projectId) => {
                    set({ isLoading: true, error: null });
                    const isLocal = get().isLocalMode;

                    if (isLocal) {
                        const allModules = getFromStorage<Module[]>(STORAGE_KEYS.modules, []);
                        const projectModules = allModules.filter((m) => m.projectId === projectId);
                        set({ modules: projectModules, isLoading: false });
                        return;
                    }

                    try {
                        const response = await fetch(`/api/modules?projectId=${projectId}`);
                        if (!response.ok) throw new Error('Failed to fetch modules');
                        const data = await response.json();
                        set({ modules: data, isLoading: false });
                    } catch (error) {
                        set({ error: (error as Error).message, isLoading: false });
                    }
                },

                // Create a new module
                createModule: async (projectId, name, type = 'verilog') => {
                    set({ isLoading: true, error: null });
                    const isLocal = get().isLocalMode;

                    const defaultCode = type === 'verilog'
                        ? `// ${name}\nmodule ${name.replace(/\.[^/.]+$/, '')} (\n    input clk,\n    input rst_n\n);\n\nendmodule`
                        : '';

                    if (isLocal) {
                        const newModule: Module = {
                            id: generateId(),
                            projectId,
                            name,
                            verilogCode: defaultCode,
                            fsmGraph: null,
                            metadata: { type },
                            createdAt: new Date(),
                            updatedAt: new Date(),
                        };
                        const allModules = getFromStorage<Module[]>(STORAGE_KEYS.modules, []);
                        allModules.push(newModule);
                        saveToStorage(STORAGE_KEYS.modules, allModules);
                        set((state) => ({ modules: [...state.modules, newModule], isLoading: false }));
                        return newModule;
                    }

                    try {
                        const response = await fetch('/api/modules', {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({
                                projectId,
                                name,
                                verilogCode: defaultCode,
                                metadata: { type },
                            }),
                        });
                        if (!response.ok) throw new Error('Failed to create module');
                        const newModule = await response.json();
                        set((state) => ({
                            modules: [...state.modules, newModule],
                            isLoading: false,
                        }));
                        return newModule;
                    } catch (error) {
                        set({ error: (error as Error).message, isLoading: false });
                        return null;
                    }
                },

                // Update a module
                updateModule: async (id, data) => {
                    const isLocal = get().isLocalMode;

                    if (isLocal) {
                        const allModules = getFromStorage<Module[]>(STORAGE_KEYS.modules, []);
                        const idx = allModules.findIndex((m) => m.id === id);
                        if (idx !== -1) {
                            allModules[idx] = { ...allModules[idx], ...data, updatedAt: new Date() };
                            saveToStorage(STORAGE_KEYS.modules, allModules);
                            set((state) => ({
                                modules: state.modules.map((m) => (m.id === id ? { ...m, ...data } : m)),
                            }));
                            return allModules[idx];
                        }
                        return null;
                    }

                    try {
                        const response = await fetch(`/api/modules/${id}`, {
                            method: 'PUT',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify(data),
                        });
                        if (!response.ok) throw new Error('Failed to update module');
                        const updated: APIModule = await response.json();
                        set((state) => ({
                            modules: state.modules.map((m) => (m.id === id ? { ...m, ...updated } : m)),
                        }));
                        return updated;
                    } catch (error) {
                        set({ error: (error as Error).message });
                        return null;
                    }
                },

                // Delete a module
                deleteModule: async (id) => {
                    const isLocal = get().isLocalMode;

                    if (isLocal) {
                        const allModules = getFromStorage<Module[]>(STORAGE_KEYS.modules, []);
                        const filtered = allModules.filter((m) => m.id !== id);
                        saveToStorage(STORAGE_KEYS.modules, filtered);
                        set((state) => ({ modules: state.modules.filter((m) => m.id !== id) }));
                        return true;
                    }

                    try {
                        const response = await fetch(`/api/modules/${id}`, { method: 'DELETE' });
                        if (!response.ok) throw new Error('Failed to delete module');
                        set((state) => ({
                            modules: state.modules.filter((m) => m.id !== id),
                        }));
                        return true;
                    } catch (error) {
                        set({ error: (error as Error).message });
                        return false;
                    }
                },

                // Get module by ID
                getModuleById: (id) => {
                    return get().modules.find((m) => m.id === id);
                },
            }),
            {
                name: 'project-store',
                partialize: (state) => ({
                    currentProject: state.currentProject,
                    isLocalMode: state.isLocalMode,
                }),
            }
        ),
        { name: 'project-store' }
    )
);
