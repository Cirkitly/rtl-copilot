
import { create } from 'zustand';
import { devtools, persist } from 'zustand/middleware';

export interface EditorFile {
    id: string; // Typically the absolute path or DB ID
    name: string;
    type: 'verilog' | 'fsm';
    content: string;
    isDirty: boolean;
}

interface EditorState {
    files: EditorFile[];
    activeFileId: string | null;

    // Actions
    openFile: (file: Omit<EditorFile, 'isDirty' | 'content'> & { content?: string }) => void;
    closeFile: (id: string) => void;
    setActiveFile: (id: string) => void;
    updateFileContent: (id: string, content: string) => void;
    markAsDirty: (id: string, isDirty: boolean) => void;
}

export const useEditorStore = create<EditorState>()(
    devtools(
        persist(
            (set, get) => ({
                files: [],
                activeFileId: null,

                openFile: (newFile) => set((state) => {
                    const existing = state.files.find(f => f.id === newFile.id);
                    if (existing) {
                        return { activeFileId: existing.id };
                    }
                    return {
                        files: [...state.files, { ...newFile, content: newFile.content || '', isDirty: false }],
                        activeFileId: newFile.id
                    };
                }),

                closeFile: (id) => set((state) => {
                    const newFiles = state.files.filter(f => f.id !== id);
                    let newActiveId = state.activeFileId;

                    if (state.activeFileId === id) {
                        newActiveId = newFiles.length > 0 ? newFiles[newFiles.length - 1].id : null;
                    }

                    return { files: newFiles, activeFileId: newActiveId };
                }),

                setActiveFile: (id) => set({ activeFileId: id }),

                updateFileContent: (id, content) => set((state) => ({
                    files: state.files.map(f => f.id === id ? { ...f, content, isDirty: true } : f)
                })),

                markAsDirty: (id, isDirty) => set((state) => ({
                    files: state.files.map(f => f.id === id ? { ...f, isDirty } : f)
                })),
            }),
            {
                name: 'rtl-copilot-editor-storage',
                skipHydration: true, // Don't auto-load for now to avoid conflicts
            }
        )
    )
);
