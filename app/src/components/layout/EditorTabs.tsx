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
        <div className="flex bg-gray-900 overflow-x-auto border-b border-gray-700">
            {files.map(file => {
                const isActive = file.id === activeFileId;
                return (
                    <div
                        key={file.id}
                        className={`flex items-center px-3 py-2 border-r border-gray-700 cursor-pointer min-w-[120px] max-w-[200px] justify-between group ${isActive ? 'bg-gray-800 text-blue-400' : 'bg-gray-850 text-gray-400 hover:bg-gray-700'}`}
                        onClick={() => setActiveFile(file.id)}
                    >
                        <div className="flex items-center overflow-hidden">
                            <span className={`text-sm truncate ${isActive ? 'font-bold' : ''}`}>
                                {file.name}
                            </span>
                            {file.isDirty && (
                                <span className="ml-2 w-2 h-2 rounded-full bg-yellow-400" />
                            )}
                        </div>

                        <button
                            className={`ml-2 p-1 rounded hover:bg-red-500 hover:text-white ${isActive ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'}`}
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
