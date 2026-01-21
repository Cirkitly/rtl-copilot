import React, { memo } from 'react';
import { Handle, Position, NodeProps } from 'reactflow';
import { Play } from 'lucide-react';

interface StateNodeData {
    label: string;
    isInitial?: boolean;
    onLabelChange?: (id: string, newLabel: string) => void;
    outputs?: Array<{ signal: string; value: string }>;
}

export const StateNode = memo(({ data, id, selected }: NodeProps<StateNodeData>) => {
    return (
        <div
            className={`
                relative min-w-[130px] rounded-xl border-2 bg-white px-4 py-3 
                shadow-md transition-all duration-200 group
                ${selected
                    ? 'border-indigo-500 shadow-lg shadow-indigo-500/20 ring-4 ring-indigo-100'
                    : 'border-slate-200 hover:border-slate-300 hover:shadow-lg'
                }
                ${data.isInitial ? 'border-l-4 border-l-indigo-600' : ''}
            `}
        >
            {/* Initial state animated indicator */}
            {data.isInitial && (
                <div className="absolute -left-1 top-1/2 -translate-y-1/2 w-2 h-2 rounded-full bg-indigo-600 animate-pulse" />
            )}

            {/* Input Handle (Top) */}
            <Handle
                type="target"
                position={Position.Top}
                className="!h-3 !w-3 !bg-indigo-400 !border-2 !border-white opacity-0 group-hover:opacity-100 transition-opacity duration-150"
            />

            <div className="flex flex-col gap-2">
                {/* Header / Name */}
                <div className="flex items-center justify-center gap-2">
                    {data.isInitial && (
                        <div className="text-indigo-600" title="Initial State">
                            <Play size={12} fill="currentColor" />
                        </div>
                    )}
                    <div className="font-mono font-bold text-slate-800 text-sm tracking-tight">
                        {data.label}
                    </div>
                </div>

                {/* Outputs (Moore) */}
                {data.outputs && data.outputs.length > 0 && (
                    <div className="border-t border-slate-100 pt-2 mt-1 space-y-1">
                        {data.outputs.map((output, idx) => (
                            <div key={idx} className="flex justify-between text-[10px] font-mono text-slate-500">
                                <span>{output.signal}</span>
                                <span className="text-indigo-600 font-medium">{output.value}</span>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {/* Output Handle (Bottom) */}
            <Handle
                type="source"
                position={Position.Bottom}
                className="!h-3 !w-3 !bg-indigo-400 !border-2 !border-white opacity-0 group-hover:opacity-100 transition-opacity duration-150"
            />

            {/* Handles for left/right connections */}
            <Handle
                type="target"
                position={Position.Left}
                id="left"
                className="!h-2 !w-2 !left-[-5px] !bg-transparent"
                style={{ border: 'none' }}
            />
            <Handle
                type="source"
                position={Position.Right}
                id="right"
                className="!h-2 !w-2 !right-[-5px] !bg-transparent"
                style={{ border: 'none' }}
            />
        </div>
    );
});

StateNode.displayName = 'StateNode';
