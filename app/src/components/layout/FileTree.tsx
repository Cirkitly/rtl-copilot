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
            if (node.type === 'folder') return isOpen ? FiFolder : FiFolder;
            if (node.fileType === 'fsm') return FiGrid;
            if (node.fileType === 'testbench') return FiCpu;
            return FiFile;
        };

        const Icon = getIcon();

        return (
            <div>
                <div
                    className={`flex items-center py-1 cursor-pointer hover:bg-gray-700 ${isActive ? 'bg-gray-600 text-blue-400' : ''}`}
                    style={{ paddingLeft: `${level * 16}px` }}
                    onClick={handleClick}
                >
                    <div className="w-5 flex justify-center">
                        {node.type === 'folder' && (
                            isOpen ? <FiChevronDown className="text-gray-500" /> : <FiChevronRight className="text-gray-500" />
                        )}
                    </div>
                    <Icon className={`mr-2 ${node.fileType === 'fsm' ? 'text-purple-400' : node.fileType === 'verilog' ? 'text-blue-400' : 'text-orange-400'}`} />
                    <span className="text-sm">{node.name}</span>
                </div>
                {node.type === 'folder' && isOpen && (
                    <div>
                        {node.children?.map(child => (
                            <FileItem key={child.id} node={child} level={level + 1} />
                        ))}
                    </div>
                )}
            </div>
        );
    };

    return (
        <div className="w-60 h-full bg-gray-800 border-r border-gray-700 pt-2 text-gray-300">
            <p className="px-4 mb-2 text-xs font-bold text-gray-500 uppercase">Explorer</p>
            {initialTree.map(node => (
                <FileItem key={node.id} node={node} level={1} />
            ))}
        </div>
    );
};

export default FileTree;
