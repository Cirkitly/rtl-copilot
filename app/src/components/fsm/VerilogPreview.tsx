
import React, { useMemo, useState } from 'react';
import { useFSMStore } from '../../lib/fsm';
import { generateFSMVerilog } from '../../lib/fsm/generator';
import { Copy, Check, ChevronDown, ChevronUp } from 'lucide-react';

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
            <div className="bg-slate-950 border-t border-slate-700 px-4 py-2 flex justify-between items-center cursor-pointer hover:bg-slate-900" onClick={() => setCollapsed(false)}>
                <span className="text-xs font-semibold text-slate-400">Generated Verilog</span>
                <ChevronUp size={16} className="text-slate-400" />
            </div>
        );
    }

    return (
        <div className="flex flex-col h-full bg-slate-900 text-slate-100 font-mono text-sm border-t border-slate-700">
            <div className="flex justify-between items-center px-4 py-2 border-b border-slate-800 bg-slate-950">
                <div className="flex items-center gap-2 cursor-pointer" onClick={() => setCollapsed(true)}>
                    <ChevronDown size={14} className="text-slate-400" />
                    <span className="text-xs font-semibold text-slate-400">Generated Verilog</span>
                </div>
                <button
                    onClick={handleCopy}
                    className="flex items-center gap-1.5 px-2 py-1 rounded hover:bg-slate-800 text-xs text-slate-300 transition-colors"
                >
                    {copied ? <Check size={14} className="text-green-400" /> : <Copy size={14} />}
                    {copied ? 'Copied' : 'Copy'}
                </button>
            </div>
            <div className="flex-1 overflow-auto p-4">
                <pre>
                    <code>{verilogCode}</code>
                </pre>
            </div>
        </div>
    );
};
