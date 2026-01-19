/**
 * FSM Validator
 * 
 * Validates FSM structure and detects common issues:
 * - Unreachable states (no incoming transitions except initial)
 * - Dead transitions (pointing to non-existent states)
 * - Missing initial state
 * - Duplicate state names
 * - States with no outgoing transitions (terminal states)
 * - Invalid transition conditions
 * - Undefined signals
 */

import type { FSM, FSMState, FSMTransition, FSMValidationError } from './types';

/**
 * Validate an FSM and return all errors/warnings
 */
export function validateFSM(fsm: FSM): FSMValidationError[] {
    const errors: FSMValidationError[] = [];

    errors.push(...checkMissingInitial(fsm));
    errors.push(...checkDuplicateNames(fsm));
    errors.push(...checkUnreachableStates(fsm));
    errors.push(...checkDeadTransitions(fsm));
    errors.push(...checkMissingOutgoing(fsm));
    errors.push(...checkUndefinedSignals(fsm));

    return errors;
}

/**
 * Check if FSM has an initial state
 */
export function checkMissingInitial(fsm: FSM): FSMValidationError[] {
    const initialStates = fsm.states.filter(s => s.isInitial);

    if (initialStates.length === 0) {
        return [{
            type: 'missing-initial',
            severity: 'error',
            message: 'FSM has no initial state. Mark one state as initial.',
        }];
    }

    if (initialStates.length > 1) {
        return [{
            type: 'missing-initial',
            severity: 'warning',
            message: `FSM has ${initialStates.length} initial states. Only one should be marked as initial.`,
        }];
    }

    return [];
}

/**
 * Check for duplicate state names
 */
export function checkDuplicateNames(fsm: FSM): FSMValidationError[] {
    const errors: FSMValidationError[] = [];
    const nameCount = new Map<string, string[]>();

    for (const state of fsm.states) {
        const existing = nameCount.get(state.name) || [];
        existing.push(state.id);
        nameCount.set(state.name, existing);
    }

    for (const [name, ids] of nameCount) {
        if (ids.length > 1) {
            errors.push({
                type: 'duplicate-name',
                severity: 'error',
                message: `Duplicate state name "${name}" used by ${ids.length} states.`,
                stateId: ids[0],
            });
        }
    }

    return errors;
}

/**
 * Find states that cannot be reached from the initial state
 */
export function checkUnreachableStates(fsm: FSM): FSMValidationError[] {
    const errors: FSMValidationError[] = [];

    if (fsm.states.length === 0) return errors;

    // Find initial state
    const initialState = fsm.states.find(s => s.isInitial);
    if (!initialState) return errors;  // Already reported by checkMissingInitial

    // BFS to find reachable states
    const reachable = new Set<string>();
    const queue: string[] = [initialState.id];

    while (queue.length > 0) {
        const currentId = queue.shift()!;
        if (reachable.has(currentId)) continue;
        reachable.add(currentId);

        // Find all states reachable from current
        for (const trans of fsm.transitions) {
            if (trans.from === currentId && !reachable.has(trans.to)) {
                queue.push(trans.to);
            }
        }
    }

    // Find unreachable states
    for (const state of fsm.states) {
        if (!reachable.has(state.id)) {
            errors.push({
                type: 'unreachable-state',
                severity: 'warning',
                message: `State "${state.name}" is unreachable from the initial state.`,
                stateId: state.id,
            });
        }
    }

    return errors;
}

/**
 * Find transitions that point to non-existent states
 */
export function checkDeadTransitions(fsm: FSM): FSMValidationError[] {
    const errors: FSMValidationError[] = [];
    const stateIds = new Set(fsm.states.map(s => s.id));

    for (const trans of fsm.transitions) {
        if (!stateIds.has(trans.from)) {
            errors.push({
                type: 'dead-transition',
                severity: 'error',
                message: `Transition "${trans.id}" originates from non-existent state "${trans.from}".`,
                transitionId: trans.id,
            });
        }

        if (!stateIds.has(trans.to)) {
            errors.push({
                type: 'dead-transition',
                severity: 'error',
                message: `Transition "${trans.id}" points to non-existent state "${trans.to}".`,
                transitionId: trans.id,
            });
        }
    }

    return errors;
}

/**
 * Find states with no outgoing transitions (terminal states)
 * These are warnings, as terminal states may be intentional
 */
export function checkMissingOutgoing(fsm: FSM): FSMValidationError[] {
    const errors: FSMValidationError[] = [];

    for (const state of fsm.states) {
        const outgoing = fsm.transitions.filter(t => t.from === state.id);

        if (outgoing.length === 0) {
            errors.push({
                type: 'missing-outgoing',
                severity: 'info',
                message: `State "${state.name}" has no outgoing transitions (terminal state).`,
                stateId: state.id,
            });
        }
    }

    return errors;
}

/**
 * Check for signals used in conditions/outputs that aren't declared
 */
export function checkUndefinedSignals(fsm: FSM): FSMValidationError[] {
    const errors: FSMValidationError[] = [];

    // Collect all declared signal names
    const declaredInputs = new Set(fsm.inputs.map(s => s.name));
    const declaredOutputs = new Set(fsm.outputs.map(s => s.name));

    // Check transition conditions for undefined inputs
    for (const trans of fsm.transitions) {
        const usedSignals = extractSignalNames(trans.condition);

        for (const signal of usedSignals) {
            if (!declaredInputs.has(signal) && signal !== '1' && signal !== '0') {
                errors.push({
                    type: 'undefined-signal',
                    severity: 'warning',
                    message: `Transition "${trans.id}" uses undeclared input signal "${signal}".`,
                    transitionId: trans.id,
                });
            }
        }

        // Check Mealy outputs
        for (const action of trans.actions) {
            if (!declaredOutputs.has(action.signal)) {
                errors.push({
                    type: 'undefined-signal',
                    severity: 'warning',
                    message: `Transition "${trans.id}" assigns undeclared output signal "${action.signal}".`,
                    transitionId: trans.id,
                });
            }
        }
    }

    // Check Moore outputs
    for (const state of fsm.states) {
        for (const output of state.outputs) {
            if (!declaredOutputs.has(output.signal)) {
                errors.push({
                    type: 'undefined-signal',
                    severity: 'warning',
                    message: `State "${state.name}" assigns undeclared output signal "${output.signal}".`,
                    stateId: state.id,
                });
            }
        }
    }

    return errors;
}

/**
 * Simple signal name extractor from Verilog expressions
 * Extracts identifiers that could be signal names
 */
export function extractSignalNames(expression: string): string[] {
    if (!expression) return [];

    // Remove Verilog literals like 1'b0, 8'hFF, etc.
    const withoutLiterals = expression.replace(/\d+'[bodh][0-9a-fA-F_]+/g, '');

    // Remove operators and punctuation
    const withoutOps = withoutLiterals.replace(/[&|!~^+\-*/%<>=(){}[\],;:?]/g, ' ');

    // Split and filter to get identifiers
    const tokens = withoutOps.split(/\s+/).filter(t => t.length > 0);

    // Filter out pure numbers
    const identifiers = tokens.filter(t => !/^\d+$/.test(t));

    // Remove duplicates
    return [...new Set(identifiers)];
}

/**
 * Get error summary for FSM
 */
export function getValidationSummary(errors: FSMValidationError[]): {
    errorCount: number;
    warningCount: number;
    infoCount: number;
    isValid: boolean;
} {
    const errorCount = errors.filter(e => e.severity === 'error').length;
    const warningCount = errors.filter(e => e.severity === 'warning').length;
    const infoCount = errors.filter(e => e.severity === 'info').length;

    return {
        errorCount,
        warningCount,
        infoCount,
        isValid: errorCount === 0,
    };
}

/**
 * Filter errors by severity
 */
export function filterBySeverity(
    errors: FSMValidationError[],
    severity: 'error' | 'warning' | 'info'
): FSMValidationError[] {
    return errors.filter(e => e.severity === severity);
}

/**
 * Filter errors by type
 */
export function filterByType(
    errors: FSMValidationError[],
    type: FSMValidationError['type']
): FSMValidationError[] {
    return errors.filter(e => e.type === type);
}
