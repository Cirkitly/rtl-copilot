/**
 * FSM Zustand Store
 * 
 * State management for the FSM editor with:
 * - States and transitions management
 * - Undo/redo support
 * - Real-time validation
 * - ReactFlow node/edge conversion
 */

import { create } from 'zustand';
import { devtools, subscribeWithSelector } from 'zustand/middleware';
import type {
    FSM,
    FSMState,
    FSMTransition,
    StateEncoding,
    FSMSignal,
    Position,
    FSMValidationError,
} from './types';
import { createEmptyFSM, createState, createTransition } from './types';
import { validateFSM } from './validator';

// ============================================================================
// Store Types
// ============================================================================

interface FSMHistoryEntry {
    states: FSMState[];
    transitions: FSMTransition[];
}

interface FSMStore {
    // FSM data
    fsm: FSM;

    // Selection state
    selectedStateId: string | null;
    selectedTransitionId: string | null;

    // Validation
    validationErrors: FSMValidationError[];

    // History for undo/redo
    history: FSMHistoryEntry[];
    historyIndex: number;

    // Actions - FSM metadata
    setFSMName: (name: string) => void;
    setClock: (clock: string) => void;
    setReset: (reset: string, polarity: 'high' | 'low') => void;
    setEncoding: (encoding: StateEncoding) => void;

    // Actions - States
    addState: (name: string, position: Position, isInitial?: boolean) => string;
    updateState: (id: string, updates: Partial<FSMState>) => void;
    removeState: (id: string) => void;
    setInitialState: (id: string) => void;

    // Actions - Transitions
    addTransition: (from: string, to: string, condition?: string) => string;
    updateTransition: (id: string, updates: Partial<FSMTransition>) => void;
    removeTransition: (id: string) => void;

    // Actions - Signals
    addInput: (signal: FSMSignal) => void;
    addOutput: (signal: FSMSignal) => void;
    removeInput: (name: string) => void;
    removeOutput: (name: string) => void;

    // Actions - Selection
    selectState: (id: string | null) => void;
    selectTransition: (id: string | null) => void;
    clearSelection: () => void;

    // Actions - History
    undo: () => void;
    redo: () => void;
    canUndo: () => boolean;
    canRedo: () => boolean;

    // Actions - Bulk operations
    loadFSM: (fsm: FSM) => void;
    clearFSM: () => void;

    // Computed/derived
    validate: () => void;
    getStateById: (id: string) => FSMState | undefined;
    getTransitionById: (id: string) => FSMTransition | undefined;
    getTransitionsFrom: (stateId: string) => FSMTransition[];
    getTransitionsTo: (stateId: string) => FSMTransition[];
}

// ============================================================================
// Store Implementation
// ============================================================================

let stateIdCounter = 0;
let transitionIdCounter = 0;

function generateStateId(): string {
    return `state_${++stateIdCounter}`;
}

function generateTransitionId(): string {
    return `trans_${++transitionIdCounter}`;
}

export const useFSMStore = create<FSMStore>()(
    devtools(
        subscribeWithSelector((set, get) => ({
            // Initial state
            fsm: createEmptyFSM('fsm'),
            selectedStateId: null,
            selectedTransitionId: null,
            validationErrors: [],
            history: [],
            historyIndex: -1,

            // ========== FSM Metadata ==========

            setFSMName: (name) => set(
                (state) => ({ fsm: { ...state.fsm, name } }),
                false,
                'setFSMName'
            ),

            setClock: (clock) => set(
                (state) => ({ fsm: { ...state.fsm, clock } }),
                false,
                'setClock'
            ),

            setReset: (reset, polarity) => set(
                (state) => ({ fsm: { ...state.fsm, reset, resetPolarity: polarity } }),
                false,
                'setReset'
            ),

            setEncoding: (encoding) => set(
                (state) => ({ fsm: { ...state.fsm, encoding } }),
                false,
                'setEncoding'
            ),

            // ========== State Actions ==========

            addState: (name, position, isInitial = false) => {
                const id = generateStateId();
                const newState = createState(id, name, position, isInitial);

                set((state) => {
                    const newFsm = {
                        ...state.fsm,
                        states: [...state.fsm.states, newState],
                    };

                    // Push to history
                    const newHistory = state.history.slice(0, state.historyIndex + 1);
                    newHistory.push({
                        states: state.fsm.states,
                        transitions: state.fsm.transitions
                    });

                    return {
                        fsm: newFsm,
                        history: newHistory,
                        historyIndex: newHistory.length - 1,
                    };
                }, false, 'addState');

                get().validate();
                return id;
            },

            updateState: (id, updates) => set((state) => {
                const newStates = state.fsm.states.map(s =>
                    s.id === id ? { ...s, ...updates } : s
                );

                return { fsm: { ...state.fsm, states: newStates } };
            }, false, 'updateState'),

            removeState: (id) => {
                set((state) => {
                    const newStates = state.fsm.states.filter(s => s.id !== id);
                    const newTransitions = state.fsm.transitions.filter(
                        t => t.from !== id && t.to !== id
                    );

                    const newHistory = state.history.slice(0, state.historyIndex + 1);
                    newHistory.push({
                        states: state.fsm.states,
                        transitions: state.fsm.transitions
                    });

                    return {
                        fsm: { ...state.fsm, states: newStates, transitions: newTransitions },
                        selectedStateId: state.selectedStateId === id ? null : state.selectedStateId,
                        history: newHistory,
                        historyIndex: newHistory.length - 1,
                    };
                }, false, 'removeState');

                get().validate();
            },

            setInitialState: (id) => set((state) => {
                const newStates = state.fsm.states.map(s => ({
                    ...s,
                    isInitial: s.id === id,
                }));

                return { fsm: { ...state.fsm, states: newStates } };
            }, false, 'setInitialState'),

            // ========== Transition Actions ==========

            addTransition: (from, to, condition = "1'b1") => {
                const id = generateTransitionId();
                const newTransition = createTransition(id, from, to, condition);

                set((state) => {
                    const newHistory = state.history.slice(0, state.historyIndex + 1);
                    newHistory.push({
                        states: state.fsm.states,
                        transitions: state.fsm.transitions
                    });

                    return {
                        fsm: {
                            ...state.fsm,
                            transitions: [...state.fsm.transitions, newTransition],
                        },
                        history: newHistory,
                        historyIndex: newHistory.length - 1,
                    };
                }, false, 'addTransition');

                get().validate();
                return id;
            },

            updateTransition: (id, updates) => set((state) => {
                const newTransitions = state.fsm.transitions.map(t =>
                    t.id === id ? { ...t, ...updates } : t
                );

                return { fsm: { ...state.fsm, transitions: newTransitions } };
            }, false, 'updateTransition'),

            removeTransition: (id) => {
                set((state) => {
                    const newTransitions = state.fsm.transitions.filter(t => t.id !== id);

                    const newHistory = state.history.slice(0, state.historyIndex + 1);
                    newHistory.push({
                        states: state.fsm.states,
                        transitions: state.fsm.transitions
                    });

                    return {
                        fsm: { ...state.fsm, transitions: newTransitions },
                        selectedTransitionId: state.selectedTransitionId === id ? null : state.selectedTransitionId,
                        history: newHistory,
                        historyIndex: newHistory.length - 1,
                    };
                }, false, 'removeTransition');

                get().validate();
            },

            // ========== Signal Actions ==========

            addInput: (signal) => set((state) => ({
                fsm: { ...state.fsm, inputs: [...state.fsm.inputs, signal] },
            }), false, 'addInput'),

            addOutput: (signal) => set((state) => ({
                fsm: { ...state.fsm, outputs: [...state.fsm.outputs, signal] },
            }), false, 'addOutput'),

            removeInput: (name) => set((state) => ({
                fsm: {
                    ...state.fsm,
                    inputs: state.fsm.inputs.filter(i => i.name !== name)
                },
            }), false, 'removeInput'),

            removeOutput: (name) => set((state) => ({
                fsm: {
                    ...state.fsm,
                    outputs: state.fsm.outputs.filter(o => o.name !== name)
                },
            }), false, 'removeOutput'),

            // ========== Selection ==========

            selectState: (id) => set({
                selectedStateId: id,
                selectedTransitionId: null
            }, false, 'selectState'),

            selectTransition: (id) => set({
                selectedStateId: null,
                selectedTransitionId: id
            }, false, 'selectTransition'),

            clearSelection: () => set({
                selectedStateId: null,
                selectedTransitionId: null
            }, false, 'clearSelection'),

            // ========== History ==========

            undo: () => {
                const { history, historyIndex } = get();
                if (historyIndex < 0) return;

                const entry = history[historyIndex];
                set((state) => ({
                    fsm: {
                        ...state.fsm,
                        states: entry.states,
                        transitions: entry.transitions,
                    },
                    historyIndex: historyIndex - 1,
                }), false, 'undo');

                get().validate();
            },

            redo: () => {
                const { history, historyIndex } = get();
                if (historyIndex >= history.length - 1) return;

                const entry = history[historyIndex + 1];
                set((state) => ({
                    fsm: {
                        ...state.fsm,
                        states: entry.states,
                        transitions: entry.transitions,
                    },
                    historyIndex: historyIndex + 1,
                }), false, 'redo');

                get().validate();
            },

            canUndo: () => get().historyIndex >= 0,
            canRedo: () => get().historyIndex < get().history.length - 1,

            // ========== Bulk Operations ==========

            loadFSM: (fsm) => {
                // Reset counters based on loaded FSM
                const maxStateId = fsm.states.reduce((max, s) => {
                    const num = parseInt(s.id.replace(/\D/g, ''), 10);
                    return isNaN(num) ? max : Math.max(max, num);
                }, 0);
                const maxTransId = fsm.transitions.reduce((max, t) => {
                    const num = parseInt(t.id.replace(/\D/g, ''), 10);
                    return isNaN(num) ? max : Math.max(max, num);
                }, 0);

                stateIdCounter = maxStateId;
                transitionIdCounter = maxTransId;

                set({
                    fsm,
                    selectedStateId: null,
                    selectedTransitionId: null,
                    history: [],
                    historyIndex: -1,
                }, false, 'loadFSM');

                get().validate();
            },

            clearFSM: () => {
                stateIdCounter = 0;
                transitionIdCounter = 0;

                set({
                    fsm: createEmptyFSM('fsm'),
                    selectedStateId: null,
                    selectedTransitionId: null,
                    validationErrors: [],
                    history: [],
                    historyIndex: -1,
                }, false, 'clearFSM');
            },

            // ========== Computed ==========

            validate: () => {
                const errors = validateFSM(get().fsm);
                set({ validationErrors: errors }, false, 'validate');
            },

            getStateById: (id) => get().fsm.states.find(s => s.id === id),

            getTransitionById: (id) => get().fsm.transitions.find(t => t.id === id),

            getTransitionsFrom: (stateId) =>
                get().fsm.transitions.filter(t => t.from === stateId),

            getTransitionsTo: (stateId) =>
                get().fsm.transitions.filter(t => t.to === stateId),
        })),
        { name: 'FSMStore' }
    )
);

// ============================================================================
// Selectors
// ============================================================================

export const selectFSM = (state: FSMStore) => state.fsm;
export const selectStates = (state: FSMStore) => state.fsm.states;
export const selectTransitions = (state: FSMStore) => state.fsm.transitions;
export const selectSelectedStateId = (state: FSMStore) => state.selectedStateId;
export const selectSelectedTransitionId = (state: FSMStore) => state.selectedTransitionId;
export const selectValidationErrors = (state: FSMStore) => state.validationErrors;

export const selectSelectedState = (state: FSMStore) =>
    state.selectedStateId
        ? state.fsm.states.find(s => s.id === state.selectedStateId)
        : null;

export const selectSelectedTransition = (state: FSMStore) =>
    state.selectedTransitionId
        ? state.fsm.transitions.find(t => t.id === state.selectedTransitionId)
        : null;

export const selectHasErrors = (state: FSMStore) =>
    state.validationErrors.some(e => e.severity === 'error');
