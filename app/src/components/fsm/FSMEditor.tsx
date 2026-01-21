import React, { useCallback, useEffect, useState } from 'react';
import ReactFlow, {
    Background,
    Controls,
    MiniMap,
    Node,
    Edge,
    Connection,
    useNodesState,
    useEdgesState,
    OnNodesChange,
    OnEdgesChange,
    applyNodeChanges,
    applyEdgeChanges,
    ReactFlowProvider,
    Panel,
    MarkerType,
} from 'reactflow';
import 'reactflow/dist/style.css';
import { useFSMStore } from '../../lib/fsm';
import { FSM_TEMPLATES } from '../../lib/fsm/templates';
import { StateNode } from './StateNode';
import { TransitionEdge } from './TransitionEdge';
import { PropertiesPanel } from './PropertiesPanel';
import { VerilogPreview } from './VerilogPreview';
import { getLayoutedElements } from '../../lib/fsm/layout';
import { Plus, Layout, Trash2, Undo, Redo, Wand2, ChevronDown, CheckCircle, AlertCircle, AlertTriangle } from 'lucide-react';

const nodeTypes = {
    fsmState: StateNode,
};

const edgeTypes = {
    fsmTransition: TransitionEdge,
};

function FSMEditorContent() {
    const store = useFSMStore();

    const [nodes, setNodes] = useNodesState([]);
    const [edges, setEdges] = useEdgesState([]);

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

    const onNodesChange: OnNodesChange = useCallback(
        (changes) => {
            const selectionChange = changes.find(c => c.type === 'select');
            if (selectionChange) {
                if (selectionChange.selected) {
                    store.selectState(selectionChange.id);
                } else if (store.selectedStateId === selectionChange.id) {
                    store.selectState(null);
                }
            }
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
        if (confirm('Loading a template will replace current FSM. Continue?')) {
            store.loadFSM(template.create());
            setShowTemplates(false);
        }
    };

    const handleLayout = () => {
        const { nodes: layoutedNodes } = getLayoutedElements(nodes, edges);
        layoutedNodes.forEach(node => {
            store.updateState(node.id, { position: node.position });
        });
    };

    return (
        <div className="flex h-full w-full">
            <div className="flex-1 flex flex-col h-full relative">
                <div className="flex-1 bg-slate-50 relative min-h-0">
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
                        <Background gap={16} size={1} color="#e2e8f0" />
                        <Controls className="!bg-white !border-slate-200 !shadow-lg" />
                        <MiniMap
                            zoomable
                            pannable
                            className="!bg-white !border-slate-200"
                            nodeColor="#6366f1"
                        />

                        {/* Toolbar Panel */}
                        <Panel position="top-left" className="!m-3">
                            <div className="bg-white rounded-xl shadow-lg border border-slate-200 p-2.5 flex flex-col gap-2.5">
                                {/* FSM Name */}
                                <div className="px-2 pb-2 border-b border-slate-100">
                                    <span className="font-semibold text-sm text-slate-700">
                                        {store.fsm.name}
                                    </span>
                                </div>

                                {/* Action Buttons */}
                                <div className="flex gap-1">
                                    <button
                                        onClick={handleAddState}
                                        className="p-2 hover:bg-indigo-50 rounded-lg text-slate-600 hover:text-indigo-600 transition-colors"
                                        title="Add State"
                                    >
                                        <Plus size={16} />
                                    </button>
                                    <button
                                        onClick={handleDelete}
                                        disabled={!store.selectedStateId && !store.selectedTransitionId}
                                        className="p-2 hover:bg-red-50 rounded-lg text-slate-400 hover:text-red-500 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                                        title="Delete Selected"
                                    >
                                        <Trash2 size={16} />
                                    </button>

                                    <div className="w-px bg-slate-200 mx-1" />

                                    <button
                                        onClick={store.undo}
                                        disabled={!store.canUndo()}
                                        className="p-2 hover:bg-slate-100 rounded-lg text-slate-600 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                                        title="Undo"
                                    >
                                        <Undo size={16} />
                                    </button>
                                    <button
                                        onClick={store.redo}
                                        disabled={!store.canRedo()}
                                        className="p-2 hover:bg-slate-100 rounded-lg text-slate-600 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                                        title="Redo"
                                    >
                                        <Redo size={16} />
                                    </button>

                                    <div className="w-px bg-slate-200 mx-1" />

                                    <button
                                        onClick={handleLayout}
                                        className="p-2 hover:bg-purple-50 rounded-lg text-slate-600 hover:text-purple-600 transition-colors"
                                        title="Auto Layout"
                                    >
                                        <Wand2 size={16} />
                                    </button>

                                    {/* Templates Dropdown */}
                                    <div className="relative">
                                        <button
                                            onClick={() => setShowTemplates(!showTemplates)}
                                            className="p-2 hover:bg-slate-100 rounded-lg text-slate-600 transition-colors flex items-center gap-1"
                                            title="Load Template"
                                        >
                                            <Layout size={16} />
                                            <ChevronDown size={12} className={`transition-transform ${showTemplates ? 'rotate-180' : ''}`} />
                                        </button>
                                        {showTemplates && (
                                            <div className="absolute top-full left-0 mt-2 w-64 bg-white border border-slate-200 rounded-xl shadow-xl z-50 py-2 animate-fade-in">
                                                <div className="px-3 py-1.5 text-[10px] font-semibold text-slate-400 uppercase tracking-wider">
                                                    Templates
                                                </div>
                                                {FSM_TEMPLATES.map(t => (
                                                    <button
                                                        key={t.id}
                                                        onClick={() => handleLoadTemplate(t)}
                                                        className="w-full text-left px-3 py-2.5 hover:bg-indigo-50 text-slate-700 block transition-colors"
                                                    >
                                                        <div className="text-sm font-medium">{t.name}</div>
                                                        <div className="text-xs text-slate-400 truncate">{t.description}</div>
                                                    </button>
                                                ))}
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>
                        </Panel>

                        {/* Validation Panel */}
                        <Panel position="top-right" className="!m-3">
                            <div className="bg-white rounded-xl shadow-lg border border-slate-200 p-3 min-w-[160px]">
                                <div className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider mb-2">
                                    Validation
                                </div>
                                {store.validationErrors.length === 0 ? (
                                    <div className="flex items-center gap-2 text-emerald-600 text-xs font-medium">
                                        <CheckCircle size={14} />
                                        <span>Valid FSM</span>
                                    </div>
                                ) : (
                                    <div className="flex flex-col gap-1.5 max-h-[150px] overflow-y-auto">
                                        {store.validationErrors.map((err, idx) => (
                                            <div
                                                key={idx}
                                                className={`
                                                    flex items-start gap-2 px-2 py-1.5 rounded-lg text-xs
                                                    ${err.severity === 'error'
                                                        ? 'bg-red-50 text-red-700'
                                                        : err.severity === 'warning'
                                                            ? 'bg-amber-50 text-amber-700'
                                                            : 'bg-blue-50 text-blue-700'
                                                    }
                                                `}
                                            >
                                                {err.severity === 'error' ? (
                                                    <AlertCircle size={12} className="flex-shrink-0 mt-0.5" />
                                                ) : (
                                                    <AlertTriangle size={12} className="flex-shrink-0 mt-0.5" />
                                                )}
                                                <span>{err.message}</span>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        </Panel>
                    </ReactFlow>
                </div>
                <div className="h-[30vh] shrink-0 border-t border-slate-200">
                    <VerilogPreview />
                </div>
            </div>
            <PropertiesPanel />
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
