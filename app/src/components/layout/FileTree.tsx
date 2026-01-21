'use client';

import React, { useState } from 'react';
import { FiFile, FiFolder, FiCpu, FiGrid, FiChevronRight, FiChevronDown } from 'react-icons/fi';
import { useEditorStore } from '../../lib/store/editor';

interface FileNode {
    id: string;
    name: string;
    type: 'folder' | 'file';
    fileType?: 'verilog' | 'fsm' | 'testbench';
    children?: FileNode[];
}

// Mock data (replace with actual DB calls later)
const initialTree: FileNode[] = [
    {
        id: 'src',
        name: 'src',
        type: 'folder',
        children: [
            { id: '1', name: 'counter.v', type: 'file', fileType: 'verilog' },
            { id: '2', name: 'alu.v', type: 'file', fileType: 'verilog' },
            { id: '3', name: 'traffic_light.fsm', type: 'file', fileType: 'fsm' },
        ]
    },
    {
        id: 'test',
        name: 'test',
        type: 'folder',
        children: [
            { id: '4', name: 'counter_tb.v', type: 'file', fileType: 'testbench' },
            { id: '5', name: 'alu_tb.v', type: 'file', fileType: 'testbench' },
        ]
    }
];

const FileTree: React.FC = () => {
    const { openFile, activeFileId } = useEditorStore();

    const FileItem = ({ node, level }: { node: FileNode; level: number }) => {
        const [isOpen, setIsOpen] = useState(true);
        const isActive = node.id === activeFileId;

        const handleClick = () => {
            if (node.type === 'folder') {
                setIsOpen(!isOpen);
            } else {
                const content = `// Content of ${node.name}\nmodule ${node.name.replace(/\.[^/.]+$/, '')} (\n    input clk,\n    input rst_n\n);\n\nendmodule`;
                openFile({
                    id: node.id,
                    name: node.name,
                    type: node.fileType === 'fsm' ? 'fsm' : 'verilog',
                    content: content
                });
            }
        };

        const getIcon = () => {
            if (node.type === 'folder') return FiFolder;
            if (node.fileType === 'fsm') return FiGrid;
            if (node.fileType === 'testbench') return FiCpu;
            return FiFile;
        };

        const getIconColor = () => {
            if (node.type === 'folder') return 'text-amber-400';
            if (node.fileType === 'fsm') return 'text-purple-400';
            if (node.fileType === 'verilog') return 'text-blue-400';
            if (node.fileType === 'testbench') return 'text-emerald-400';
            return 'text-[var(--text-muted)]';
        };

        const Icon = getIcon();

        return (
            <div className="animate-fade-in" style={{ animationDelay: `${level * 30}ms` }}>
                <div
                    className={`
                        flex items-center py-1.5 cursor-pointer rounded-md mx-1 px-2
                        transition-all duration-150 ease-out group
                        ${isActive
                            ? 'bg-[var(--accent-primary)]/15 text-[var(--accent-primary)] border-l-2 border-[var(--accent-primary)]'
                            : 'hover:bg-[var(--surface-elevated)] text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
                        }
                    `}
                    style={{ paddingLeft: `${level * 12 + 8}px` }}
                    onClick={handleClick}
                >
                    <div className="w-4 flex justify-center mr-1">
                        {node.type === 'folder' && (
                            <span className="text-[var(--text-muted)] transition-transform duration-150">
                                {isOpen ? <FiChevronDown size={12} /> : <FiChevronRight size={12} />}
                            </span>
                        )}
                    </div>
                    <Icon className={`mr-2 flex-shrink-0 ${getIconColor()}`} size={14} />
                    <span className="text-xs font-medium truncate">{node.name}</span>
                </div>
                {node.type === 'folder' && isOpen && (
                    <div className="animate-slide-in-up">
                        {node.children?.map(child => (
                            <FileItem key={child.id} node={child} level={level + 1} />
                        ))}
                    </div>
                )}
            </div>
        );
    };

    return (
        <div className="w-56 h-full glass border-r border-[var(--border-subtle)] flex flex-col">
            {/* Header */}
            <div className="px-4 py-3 border-b border-[var(--border-subtle)]">
                <p className="text-[10px] font-semibold text-[var(--text-muted)] uppercase tracking-wider">
                    Explorer
                </p>
            </div>

            {/* File Tree */}
            <div className="flex-1 overflow-y-auto py-2">
                {initialTree.map(node => (
                    <FileItem key={node.id} node={node} level={0} />
                ))}
            </div>

            {/* Footer */}
            <div className="px-4 py-2 border-t border-[var(--border-subtle)]">
                <p className="text-[10px] text-[var(--text-muted)]">
                    {initialTree.reduce((acc, n) => acc + (n.children?.length || 0), 0)} files
                </p>
            </div>
        </div>
    );
};

export default FileTree;
