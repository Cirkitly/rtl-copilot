
import React from 'react';
import { useFSMStore, selectSelectedState, selectSelectedTransition } from '../../lib/fsm';
import { X } from 'lucide-react';

export const PropertiesPanel = () => {
    const store = useFSMStore();
    const selectedState = useFSMStore(selectSelectedState);
    const selectedTransition = useFSMStore(selectSelectedTransition);

    if (!selectedState && !selectedTransition) {
        return (
            <div className="w-64 bg-white border-l border-slate-200 h-full flex flex-col">
                <div className="p-4 border-b border-slate-100 bg-gradient-to-r from-slate-50 to-white">
                    <h3 className="font-semibold text-sm text-slate-700">FSM Properties</h3>
                </div>
                <div className="p-4 space-y-4">
                    <div>
                        <label className="block text-[10px] font-semibold text-slate-400 uppercase tracking-wider mb-1.5">
                            FSM Name
                        </label>
                        <input
                            type="text"
                            value={store.fsm.name}
                            onChange={(e) => store.setFSMName(e.target.value)}
                            className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-400 transition-all duration-150 bg-slate-50 hover:bg-white"
                        />
                    </div>
                </div>
                <div className="p-4 mt-auto">
                    <p className="text-xs text-slate-400 bg-slate-50 rounded-lg p-3 text-center">
                        Select a state or transition to edit its properties
                    </p>
                </div>
            </div>
        );
    }

    if (selectedState) {
        return (
            <div className="w-64 bg-white border-l border-slate-200 h-full flex flex-col">
                <div className="p-4 border-b border-slate-100 bg-gradient-to-r from-indigo-50 to-white flex justify-between items-center">
                    <h3 className="font-semibold text-sm text-slate-700">State Properties</h3>
                    <button
                        onClick={store.clearSelection}
                        className="p-1 rounded hover:bg-slate-100 text-slate-400 hover:text-slate-600 transition-colors"
                    >
                        <X size={14} />
                    </button>
                </div>
                <div className="p-4 space-y-4 overflow-y-auto flex-1">
                    <div>
                        <label className="block text-[10px] font-semibold text-slate-400 uppercase tracking-wider mb-1.5">
                            Name
                        </label>
                        <input
                            type="text"
                            value={selectedState.name}
                            onChange={(e) => store.updateState(selectedState.id, { name: e.target.value })}
                            className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-400 transition-all duration-150 font-mono bg-slate-50 hover:bg-white"
                        />
                    </div>

                    <div className="flex items-center gap-3">
                        <label className="relative inline-flex items-center cursor-pointer">
                            <input
                                type="checkbox"
                                id="isInitial"
                                checked={selectedState.isInitial}
                                onChange={(e) => {
                                    if (e.target.checked) {
                                        store.setInitialState(selectedState.id);
                                    }
                                }}
                                className="sr-only peer"
                            />
                            <div className="w-9 h-5 bg-slate-200 peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-indigo-500/20 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-indigo-500"></div>
                        </label>
                        <label htmlFor="isInitial" className="text-sm text-slate-600 cursor-pointer">
                            Initial State
                        </label>
                    </div>

                    <div className="pt-3 border-t border-slate-100">
                        <div className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider mb-3">
                            Moore Outputs
                        </div>
                        <div className="space-y-3">
                            {store.fsm.outputs.length === 0 ? (
                                <div className="text-xs text-slate-400 italic bg-slate-50 rounded-lg p-3 text-center">
                                    No output signals defined
                                </div>
                            ) : (
                                store.fsm.outputs.map(signal => {
                                    const currentAssignment = selectedState.outputs?.find(o => o.signal === signal.name);
                                    const value = currentAssignment?.value || (signal.width === 1 ? "1'b0" : "0");

                                    return (
                                        <div key={signal.name} className="space-y-1">
                                            <label className="text-xs text-slate-500 font-medium">{signal.name}</label>
                                            <input
                                                type="text"
                                                value={value}
                                                onChange={(e) => {
                                                    const newOutputs = selectedState.outputs?.filter(o => o.signal !== signal.name) || [];
                                                    newOutputs.push({ signal: signal.name, value: e.target.value });
                                                    store.updateState(selectedState.id, { outputs: newOutputs });
                                                }}
                                                className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg font-mono bg-slate-50 hover:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-400 transition-all duration-150"
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
            <div className="w-64 bg-white border-l border-slate-200 h-full flex flex-col">
                <div className="p-4 border-b border-slate-100 bg-gradient-to-r from-purple-50 to-white flex justify-between items-center">
                    <h3 className="font-semibold text-sm text-slate-700">Transition</h3>
                    <button
                        onClick={store.clearSelection}
                        className="p-1 rounded hover:bg-slate-100 text-slate-400 hover:text-slate-600 transition-colors"
                    >
                        <X size={14} />
                    </button>
                </div>
                <div className="p-4 space-y-4 overflow-y-auto flex-1">
                    <div>
                        <label className="block text-[10px] font-semibold text-slate-400 uppercase tracking-wider mb-1.5">
                            Condition
                        </label>
                        <input
                            type="text"
                            value={selectedTransition.condition || ''}
                            onChange={(e) => store.updateTransition(selectedTransition.id, { condition: e.target.value })}
                            placeholder="e.g. valid && ready"
                            className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-400 transition-all duration-150 font-mono bg-slate-50 hover:bg-white placeholder:text-slate-300"
                        />
                    </div>
                </div>
            </div>
        );
    }

    return null;
};
