
import React from 'react';
import { useFSMStore, selectSelectedState, selectSelectedTransition } from '../../lib/fsm';
import { X } from 'lucide-react';

export const PropertiesPanel = () => {
    const store = useFSMStore();
    const selectedState = useFSMStore(selectSelectedState);
    const selectedTransition = useFSMStore(selectSelectedTransition);

    if (!selectedState && !selectedTransition) {
        return (
            <div className="w-64 bg-white border-l h-full flex flex-col">
                <div className="p-3 border-b font-semibold text-sm bg-slate-50">
                    FSM Properties
                </div>
                <div className="p-4 space-y-4">
                    <div>
                        <label className="block text-xs font-medium text-slate-500 mb-1">
                            FSM Name
                        </label>
                        <input
                            type="text"
                            value={store.fsm.name}
                            onChange={(e) => store.setFSMName(e.target.value)}
                            className="w-full px-2 py-1 text-sm border rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
                        />
                    </div>
                </div>
                <div className="p-4 text-xs text-slate-400 mt-auto">
                    Select a state or transition to edit its properties.
                </div>
            </div>
        );
    }

    if (selectedState) {
        return (
            <div className="w-64 bg-white border-l h-full flex flex-col">
                <div className="p-3 border-b font-semibold text-sm bg-slate-50 flex justify-between items-center">
                    <span>State Properties</span>
                    <button onClick={store.clearSelection} className="text-slate-400 hover:text-slate-600">
                        <X size={14} />
                    </button>
                </div>
                <div className="p-4 space-y-4 overflow-y-auto">
                    <div>
                        <label className="block text-xs font-medium text-slate-500 mb-1">
                            Name
                        </label>
                        <input
                            type="text"
                            value={selectedState.name}
                            onChange={(e) => store.updateState(selectedState.id, { name: e.target.value })}
                            className="w-full px-2 py-1 text-sm border rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
                        />
                    </div>

                    <div className="flex items-center gap-2">
                        <input
                            type="checkbox"
                            id="isInitial"
                            checked={selectedState.isInitial}
                            onChange={(e) => {
                                if (e.target.checked) {
                                    store.setInitialState(selectedState.id);
                                }
                            }}
                            className="rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                        />
                        <label htmlFor="isInitial" className="text-sm text-slate-700">
                            Initial State
                        </label>
                    </div>

                    <div className="pt-2 border-t">
                        <div className="text-xs font-bold text-slate-700 mb-2">Moore Outputs</div>
                        <div className="space-y-2">
                            {store.fsm.outputs.length === 0 ? (
                                <div className="text-xs text-slate-400 italic">No output signals defined</div>
                            ) : (
                                store.fsm.outputs.map(signal => {
                                    const currentAssignment = selectedState.outputs?.find(o => o.signal === signal.name);
                                    const value = currentAssignment?.value || (signal.width === 1 ? "1'b0" : "0");

                                    return (
                                        <div key={signal.name} className="flex flex-col gap-1">
                                            <label className="text-xs text-slate-600">{signal.name}</label>
                                            <input
                                                type="text"
                                                value={value}
                                                onChange={(e) => {
                                                    const newOutputs = selectedState.outputs?.filter(o => o.signal !== signal.name) || [];
                                                    newOutputs.push({ signal: signal.name, value: e.target.value });
                                                    store.updateState(selectedState.id, { outputs: newOutputs });
                                                }}
                                                className="w-full px-2 py-1 text-xs border rounded font-mono bg-slate-50"
                                            />
                                        </div>
                                    );
                                })
                            )}
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    if (selectedTransition) {
        return (
            <div className="w-64 bg-white border-l h-full flex flex-col">
                <div className="p-3 border-b font-semibold text-sm bg-slate-50 flex justify-between items-center">
                    <span>Transition Properties</span>
                    <button onClick={store.clearSelection} className="text-slate-400 hover:text-slate-600">
                        <X size={14} />
                    </button>
                </div>
                <div className="p-4 space-y-4 overflow-y-auto">
                    <div>
                        <label className="block text-xs font-medium text-slate-500 mb-1">
                            Condition
                        </label>
                        <input
                            type="text"
                            value={selectedTransition.condition || ''}
                            onChange={(e) => store.updateTransition(selectedTransition.id, { condition: e.target.value })}
                            placeholder="e.g. valid && ready"
                            className="w-full px-2 py-1 text-sm border rounded focus:outline-none focus:ring-1 focus:ring-blue-500 font-mono"
                        />
                    </div>
                </div>
            </div>
        );
    }

    return null;
};
