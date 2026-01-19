import React, { useCallback, useEffect, useMemo, useState } from 'react';
import ReactFlow, {
    Background,
    Controls,
    MiniMap,
    Node,
    Edge,
    Connection,
    addEdge,
    useNodesState,
    useEdgesState,
    OnNodesChange,
    OnEdgesChange,
    NodeChange,
    EdgeChange,
    applyNodeChanges,
    applyEdgeChanges,
    ReactFlowProvider,
    Panel,
    MarkerType,
} from 'reactflow';
import 'reactflow/dist/style.css';
import { useFSMStore, selectStates, selectTransitions } from '../../lib/fsm';
import { FSM_TEMPLATES } from '../../lib/fsm/templates';
import { StateNode } from './StateNode';
import { TransitionEdge } from './TransitionEdge';
import { Plus, Layout, Save, Trash2, Undo, Redo, Play } from 'lucide-react';

const nodeTypes = {
    fsmState: StateNode,
};

const edgeTypes = {
    fsmTransition: TransitionEdge,
};

function FSMEditorContent() {
    const store = useFSMStore();

    // ReactFlow local state
    const [nodes, setNodes] = useNodesState([]);
    const [edges, setEdges] = useEdgesState([]);

    // Sync from Store -> ReactFlow
    useEffect(() => {
        const fsmNodes: Node[] = store.fsm.states.map(state => ({
            id: state.id,
            type: 'fsmState',
            position: state.position,
            data: {
                label: state.name,
                isInitial: state.isInitial,
                outputs: state.outputs,
            },
            selected: store.selectedStateId === state.id,
        }));

        const fsmEdges: Edge[] = store.fsm.transitions.map(trans => ({
            id: trans.id,
            source: trans.from,
            target: trans.to,
            type: 'fsmTransition',
            data: {
                condition: trans.condition,
                actions: trans.actions,
            },
            markerEnd: {
                type: MarkerType.ArrowClosed,
            },
            selected: store.selectedTransitionId === trans.id,
        }));

        setNodes(fsmNodes);
        setEdges(fsmEdges);
    }, [
        store.fsm.states,
        store.fsm.transitions,
        store.selectedStateId,
        store.selectedTransitionId,
        setNodes,
        setEdges
    ]);

    // Handlers
    const onNodesChange: OnNodesChange = useCallback(
        (changes) => {
            // Handle selection changes
            const selectionChange = changes.find(c => c.type === 'select');
            if (selectionChange) {
                if (selectionChange.selected) {
                    store.selectState(selectionChange.id);
                } else if (store.selectedStateId === selectionChange.id) {
                    store.selectState(null);
                }
            }

            // Handle position changes (only update store on drag stop usually, but here we can try direct)
            // For performance, we might want to debounce or only sync on drag stop
            // but simpler for now to let ReactFlow handle visual and we verify separate sync?
            // Actually, we should let ReactFlow handle the visual state and sync back

            setNodes((nds) => applyNodeChanges(changes, nds));
        },
        [store, setNodes]
    );

    const onEdgesChange: OnEdgesChange = useCallback(
        (changes) => {
            const selectionChange = changes.find(c => c.type === 'select');
            if (selectionChange) {
                if (selectionChange.selected) {
                    store.selectTransition(selectionChange.id);
                } else if (store.selectedTransitionId === selectionChange.id) {
                    store.selectTransition(null);
                }
            }
            setEdges((eds) => applyEdgeChanges(changes, eds));
        },
        [store, setEdges]
    );

    const onConnect = useCallback(
        (params: Connection) => {
            if (params.source && params.target) {
                store.addTransition(params.source, params.target);
            }
        },
        [store]
    );

    const onNodeDragStop = useCallback(
        (_: any, node: Node) => {
            store.updateState(node.id, { position: node.position });
        },
        [store]
    );

    const handleAddState = () => {
        store.addState(
            `S${store.fsm.states.length}`,
            { x: 100 + Math.random() * 50, y: 100 + Math.random() * 50 }
        );
    };

    const handleDelete = () => {
        if (store.selectedStateId) {
            store.removeState(store.selectedStateId);
        }
        if (store.selectedTransitionId) {
            store.removeTransition(store.selectedTransitionId);
        }
    };

    const [showTemplates, setShowTemplates] = useState(false);

    const handleLoadTemplate = (template: typeof FSM_TEMPLATES[0]) => {
        // eslint-disable-next-line no-restricted-globals
        if (confirm('Loading a template will replace current FSM. Continue?')) {
            store.loadFSM(template.create());
            setShowTemplates(false);
        }
    };

    return (
        <div className="h-full w-full bg-slate-50 relative">
            <ReactFlow
                nodes={nodes}
                edges={edges}
                onNodesChange={onNodesChange}
                onEdgesChange={onEdgesChange}
                onConnect={onConnect}
                onNodeDragStop={onNodeDragStop}
                nodeTypes={nodeTypes}
                edgeTypes={edgeTypes}
                fitView
                attributionPosition="bottom-right"
            >
                <Background gap={12} size={1} />
                <Controls />
                <MiniMap zoomable pannable />

                <Panel position="top-left" className="bg-white p-2 rounded shadow-md border border-slate-200 flex flex-col gap-2">
                    <div className="font-bold text-sm text-slate-700 pb-1 border-b">
                        {store.fsm.name}
                    </div>

                    <div className="flex gap-2">
                        <button
                            onClick={handleAddState}
                            className="p-1.5 hover:bg-slate-100 rounded text-slate-600"
                            title="Add State"
                        >
                            <Plus size={18} />
                        </button>
                        <button
                            onClick={handleDelete}
                            disabled={!store.selectedStateId && !store.selectedTransitionId}
                            className="p-1.5 hover:bg-slate-100 rounded text-red-500 disabled:opacity-50"
                            title="Delete Selected"
                        >
                            <Trash2 size={18} />
                        </button>
                        <div className="w-px bg-slate-200 mx-1" />
                        <button
                            onClick={store.undo}
                            disabled={!store.canUndo()}
                            className="p-1.5 hover:bg-slate-100 rounded text-slate-600 disabled:opacity-50"
                            title="Undo"
                        >
                            <Undo size={18} />
                        </button>
                        <button
                            onClick={store.redo}
                            disabled={!store.canRedo()}
                            className="p-1.5 hover:bg-slate-100 rounded text-slate-600 disabled:opacity-50"
                            title="Redo"
                        >
                            <Redo size={18} />
                        </button>
                        <div className="w-px bg-slate-200 mx-1" />
                        <div className="relative">
                            <button
                                onClick={() => setShowTemplates(!showTemplates)}
                                className="p-1.5 hover:bg-slate-100 rounded text-slate-600"
                                title="Load Template"
                            >
                                <Layout size={18} />
                            </button>
                            {showTemplates && (
                                <div className="absolute top-full left-0 mt-1 w-64 bg-white border rounded shadow-lg z-50 py-1">
                                    <div className="px-3 py-1.5 text-xs font-semibold text-slate-500 uppercase tracking-wider border-b mb-1">
                                        Templates
                                    </div>
                                    {FSM_TEMPLATES.map(t => (
                                        <button
                                            key={t.id}
                                            onClick={() => handleLoadTemplate(t)}
                                            className="w-full text-left px-3 py-2 hover:bg-blue-50 text-slate-700 block transition-colors"
                                        >
                                            <div className="text-sm font-medium">{t.name}</div>
                                            <div className="text-xs text-slate-400 truncate">{t.description}</div>
                                        </button>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>
                </Panel>

                <Panel position="top-right" className="bg-white p-2 rounded shadow-md border text-xs">
                    <div className="flex flex-col gap-1">
                        <div className="font-semibold px-1">Validation</div>
                        {store.validationErrors.length === 0 ? (
                            <div className="text-green-600 px-1">✓ Valid FSM</div>
                        ) : (
                            <div className="flex flex-col gap-1 max-h-[150px] overflow-y-auto">
                                {store.validationErrors.map((err, idx) => (
                                    <div key={idx} className={`
                     px-2 py-1 rounded border
                     ${err.severity === 'error' ? 'bg-red-50 border-red-200 text-red-700' :
                                            err.severity === 'warning' ? 'bg-yellow-50 border-yellow-200 text-yellow-700' :
                                                'bg-blue-50 border-blue-200 text-blue-700'}
                   `}>
                                        {err.message}
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </Panel>
            </ReactFlow>
        </div>
    );
}

export const FSMEditor = () => {
    return (
        <ReactFlowProvider>
            <FSMEditorContent />
        </ReactFlowProvider>
    );
};
