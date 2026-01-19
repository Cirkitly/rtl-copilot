import React, { memo } from 'react';
import { BaseEdge, EdgeLabelRenderer, EdgeProps, getBezierPath } from 'reactflow';

interface TransitionEdgeData {
    condition?: string;
    actions?: Array<{ signal: string; value: string }>;
}

export const TransitionEdge = memo(({
    id,
    sourceX,
    sourceY,
    targetX,
    targetY,
    sourcePosition,
    targetPosition,
    style = {},
    markerEnd,
    data,
    selected,
}: EdgeProps<TransitionEdgeData>) => {
    const [edgePath, labelX, labelY] = getBezierPath({
        sourceX,
        sourceY,
        sourcePosition,
        targetX,
        targetY,
        targetPosition,
    });

    return (
        <>
            <BaseEdge
                path={edgePath}
                markerEnd={markerEnd}
                style={{
                    ...style,
                    strokeWidth: selected ? 2 : 1.5,
                    stroke: selected ? '#3b82f6' : '#94a3b8', // blue-500 : slate-400
                }}
            />
            {/* Condition Label */}
            {(data?.condition || (data?.actions && data.actions.length > 0)) && (
                <EdgeLabelRenderer>
                    <div
                        style={{
                            position: 'absolute',
                            transform: `translate(-50%, -50%) translate(${labelX}px,${labelY}px)`,
                            pointerEvents: 'all',
                        }}
                        className="nodrag nopan"
                    >
                        <div className={`
              flex flex-col gap-0.5 px-2 py-1 rounded bg-white shadow-sm border text-xs font-mono
              ${selected ? 'border-blue-500 ring-1 ring-blue-200' : 'border-slate-200'}
            `}>
                            {/* Condition */}
                            {data?.condition && data.condition !== "1'b1" && (
                                <div className="font-semibold text-slate-800">
                                    {data.condition}
                                </div>
                            )}

                            {/* Mealy Actions */}
                            {data?.actions?.map((action, idx) => (
                                <div key={idx} className="text-slate-500 flex gap-1">
                                    <span>{action.signal}</span>
                                    <span>=</span>
                                    <span className="text-blue-600">{action.value}</span>
                                </div>
                            ))}
                        </div>
                    </div>
                </EdgeLabelRenderer>
            )}
        </>
    );
});

TransitionEdge.displayName = 'TransitionEdge';
