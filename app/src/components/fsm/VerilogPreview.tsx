
import React, { useMemo, useState } from 'react';
import { useFSMStore } from '../../lib/fsm';
import { generateFSMVerilog } from '../../lib/fsm/generator';
import { Copy, Check, ChevronDown, ChevronUp, Code } from 'lucide-react';

export const VerilogPreview = () => {
    const fsm = useFSMStore((s) => s.fsm);
    const [copied, setCopied] = useState(false);
    const [collapsed, setCollapsed] = useState(false);

    const verilogCode = useMemo(() => {
        try {
            return generateFSMVerilog(fsm);
        } catch (e) {
            return `// Error generating Verilog: ${e instanceof Error ? e.message : 'Unknown error'}`;
        }
    }, [fsm]);

    const handleCopy = () => {
        navigator.clipboard.writeText(verilogCode);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    if (collapsed) {
        return (
            <div
                className="bg-slate-900 border-t border-slate-700/50 px-4 py-2.5 flex justify-between items-center cursor-pointer hover:bg-slate-800/80 transition-colors duration-150"
                onClick={() => setCollapsed(false)}
            >
                <div className="flex items-center gap-2">
                    <Code size={14} className="text-slate-500" />
                    <span className="text-xs font-medium text-slate-400">Generated Verilog</span>
                </div>
                <ChevronUp size={14} className="text-slate-500" />
            </div>
        );
    }

    return (
        <div className="flex flex-col h-full bg-slate-900 text-slate-100 font-mono text-sm border-t border-slate-700/50">
            {/* Header */}
            <div className="flex justify-between items-center px-4 py-2.5 border-b border-slate-800/80 bg-gradient-to-r from-slate-900 to-slate-800">
                <div
                    className="flex items-center gap-2 cursor-pointer hover:text-slate-300 transition-colors"
                    onClick={() => setCollapsed(true)}
                >
                    <ChevronDown size={14} className="text-slate-500" />
                    <Code size={14} className="text-indigo-400" />
                    <span className="text-xs font-medium text-slate-400">Generated Verilog</span>
                </div>
                <button
                    onClick={handleCopy}
                    className={`
                        flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium
                        transition-all duration-200
                        ${copied
                            ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                            : 'bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700'
                        }
                    `}
                >
                    {copied ? (
                        <>
                            <Check size={12} className="animate-fade-in" />
                            <span>Copied!</span>
                        </>
                    ) : (
                        <>
                            <Copy size={12} />
                            <span>Copy</span>
                        </>
                    )}
                </button>
            </div>

            {/* Code Content */}
            <div className="flex-1 overflow-auto p-4">
                <pre className="text-[13px] leading-relaxed">
                    <code className="text-slate-300">{verilogCode}</code>
                </pre>
            </div>
        </div>
    );
};
