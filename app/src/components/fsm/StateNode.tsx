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
        relative min-w-[120px] rounded-lg border-2 bg-white px-4 py-3 shadow-sm transition-all
        ${selected
                    ? 'border-blue-500 ring-2 ring-blue-200'
                    : 'border-slate-300 hover:border-slate-400'
                }
        ${data.isInitial ? 'border-l-4 border-l-blue-600' : ''}
      `}
        >
            {/* Input Handle (Top) */}
            <Handle
                type="target"
                position={Position.Top}
                className="!h-3 !w-3 !bg-slate-400 opacity-0 group-hover:opacity-100 transition-opacity"
            />

            <div className="flex flex-col gap-2">
                {/* Header / Name */}
                <div className="flex items-center justify-between gap-2">
                    {data.isInitial && (
                        <div className="text-blue-600" title="Initial State">
                            <Play size={14} fill="currentColor" />
                        </div>
                    )}
                    <div className="font-mono font-bold text-slate-900 text-center w-full">
                        {data.label}
                    </div>
                </div>

                {/* Outputs (Moore) */}
                {data.outputs && data.outputs.length > 0 && (
                    <div className="border-t border-slate-100 pt-2 mt-1">
                        {data.outputs.map((output, idx) => (
                            <div key={idx} className="flex justify-between text-xs font-mono text-slate-600">
                                <span>{output.signal}</span>
                                <span className="text-blue-600">{output.value}</span>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {/* Output Handle (Bottom) */}
            <Handle
                type="source"
                position={Position.Bottom}
                className="!h-3 !w-3 !bg-slate-400 opacity-0 group-hover:opacity-100 transition-opacity"
            />

            {/* Handles for left/right connections if needed */}
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
