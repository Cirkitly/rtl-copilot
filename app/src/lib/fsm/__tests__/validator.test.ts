/**
 * Tests for FSM Validator
 */

import { describe, it, expect } from 'vitest';
import {
    validateFSM,
    checkMissingInitial,
    checkDuplicateNames,
    checkUnreachableStates,
    checkDeadTransitions,
    checkMissingOutgoing,
    checkUndefinedSignals,
    extractSignalNames,
    getValidationSummary,
    filterBySeverity,
    filterByType,
} from '../validator';
import { createState, createTransition, createEmptyFSM } from '../types';
import type { FSM } from '../types';

describe('FSM Validator', () => {

    // Helper to create a valid FSM for testing
    function createValidFSM(): FSM {
        const fsm = createEmptyFSM('test_fsm');
        fsm.states = [
            createState('s0', 'IDLE', { x: 0, y: 0 }, true),
            createState('s1', 'ACTIVE', { x: 100, y: 0 }),
            createState('s2', 'DONE', { x: 200, y: 0 }),
        ];
        fsm.transitions = [
            createTransition('t0', 's0', 's1', 'start'),
            createTransition('t1', 's1', 's2', 'complete'),
            createTransition('t2', 's2', 's0', 'reset'),
        ];
        fsm.inputs = [
            { name: 'start', width: 1, direction: 'input' },
            { name: 'complete', width: 1, direction: 'input' },
            { name: 'reset', width: 1, direction: 'input' },
        ];
        return fsm;
    }

    describe('validateFSM', () => {
        it('should return empty array for valid FSM', () => {
            const fsm = createValidFSM();
            const errors = validateFSM(fsm);

            // Should only have info (terminal state warnings)
            const criticalErrors = errors.filter(e => e.severity === 'error');
            expect(criticalErrors).toHaveLength(0);
        });

        it('should collect all types of errors', () => {
            const fsm = createEmptyFSM('broken');
            fsm.states = [
                createState('s0', 'A'),  // No initial
                createState('s1', 'A'),  // Duplicate name
            ];
            fsm.transitions = [
                createTransition('t0', 's0', 's99', 'go'),  // Dead transition
            ];

            const errors = validateFSM(fsm);

            expect(errors.some(e => e.type === 'missing-initial')).toBe(true);
            expect(errors.some(e => e.type === 'duplicate-name')).toBe(true);
            expect(errors.some(e => e.type === 'dead-transition')).toBe(true);
        });
    });

    describe('checkMissingInitial', () => {
        it('should report missing initial state', () => {
            const fsm = createEmptyFSM('no_initial');
            fsm.states = [
                createState('s0', 'A'),
                createState('s1', 'B'),
            ];

            const errors = checkMissingInitial(fsm);

            expect(errors).toHaveLength(1);
            expect(errors[0].type).toBe('missing-initial');
            expect(errors[0].severity).toBe('error');
        });

        it('should report multiple initial states', () => {
            const fsm = createEmptyFSM('multi_initial');
            fsm.states = [
                createState('s0', 'A', { x: 0, y: 0 }, true),
                createState('s1', 'B', { x: 0, y: 0 }, true),
            ];

            const errors = checkMissingInitial(fsm);

            expect(errors).toHaveLength(1);
            expect(errors[0].severity).toBe('warning');
            expect(errors[0].message).toContain('2 initial states');
        });

        it('should pass for single initial state', () => {
            const fsm = createValidFSM();
            const errors = checkMissingInitial(fsm);
            expect(errors).toHaveLength(0);
        });
    });

    describe('checkDuplicateNames', () => {
        it('should detect duplicate state names', () => {
            const fsm = createEmptyFSM('dupes');
            fsm.states = [
                createState('s0', 'IDLE', { x: 0, y: 0 }, true),
                createState('s1', 'IDLE'),  // Duplicate
                createState('s2', 'ACTIVE'),
            ];

            const errors = checkDuplicateNames(fsm);

            expect(errors).toHaveLength(1);
            expect(errors[0].type).toBe('duplicate-name');
            expect(errors[0].message).toContain('IDLE');
        });

        it('should pass for unique names', () => {
            const fsm = createValidFSM();
            const errors = checkDuplicateNames(fsm);
            expect(errors).toHaveLength(0);
        });
    });

    describe('checkUnreachableStates', () => {
        it('should detect unreachable states', () => {
            const fsm = createEmptyFSM('unreachable');
            fsm.states = [
                createState('s0', 'IDLE', { x: 0, y: 0 }, true),
                createState('s1', 'ORPHAN'),  // No incoming transitions
            ];
            fsm.transitions = [];  // No transitions at all

            const errors = checkUnreachableStates(fsm);

            expect(errors).toHaveLength(1);
            expect(errors[0].type).toBe('unreachable-state');
            expect(errors[0].stateId).toBe('s1');
        });

        it('should follow transition chains', () => {
            const fsm = createEmptyFSM('chain');
            fsm.states = [
                createState('s0', 'A', { x: 0, y: 0 }, true),
                createState('s1', 'B'),
                createState('s2', 'C'),
                createState('s3', 'ORPHAN'),  // No path from A
            ];
            fsm.transitions = [
                createTransition('t0', 's0', 's1'),
                createTransition('t1', 's1', 's2'),
            ];

            const errors = checkUnreachableStates(fsm);

            expect(errors).toHaveLength(1);
            expect(errors[0].stateId).toBe('s3');
        });

        it('should pass for fully connected FSM', () => {
            const fsm = createValidFSM();
            const errors = checkUnreachableStates(fsm);
            expect(errors).toHaveLength(0);
        });
    });

    describe('checkDeadTransitions', () => {
        it('should detect transitions to non-existent states', () => {
            const fsm = createEmptyFSM('dead');
            fsm.states = [
                createState('s0', 'IDLE', { x: 0, y: 0 }, true),
            ];
            fsm.transitions = [
                createTransition('t0', 's0', 's_missing'),  // s_missing doesn't exist
            ];

            const errors = checkDeadTransitions(fsm);

            expect(errors).toHaveLength(1);
            expect(errors[0].type).toBe('dead-transition');
            expect(errors[0].message).toContain('s_missing');
        });

        it('should detect transitions from non-existent states', () => {
            const fsm = createEmptyFSM('dead_from');
            fsm.states = [
                createState('s0', 'IDLE', { x: 0, y: 0 }, true),
            ];
            fsm.transitions = [
                createTransition('t0', 's_missing', 's0'),  // s_missing doesn't exist
            ];

            const errors = checkDeadTransitions(fsm);

            expect(errors).toHaveLength(1);
            expect(errors[0].message).toContain('originates from');
        });

        it('should pass for valid transitions', () => {
            const fsm = createValidFSM();
            const errors = checkDeadTransitions(fsm);
            expect(errors).toHaveLength(0);
        });
    });

    describe('checkMissingOutgoing', () => {
        it('should detect terminal states', () => {
            const fsm = createEmptyFSM('terminal');
            fsm.states = [
                createState('s0', 'START', { x: 0, y: 0 }, true),
                createState('s1', 'END'),  // No outgoing transitions
            ];
            fsm.transitions = [
                createTransition('t0', 's0', 's1'),
            ];

            const errors = checkMissingOutgoing(fsm);

            expect(errors).toHaveLength(1);
            expect(errors[0].type).toBe('missing-outgoing');
            expect(errors[0].severity).toBe('info');
            expect(errors[0].stateId).toBe('s1');
        });

        it('should report as info severity', () => {
            const fsm = createEmptyFSM('terminal');
            fsm.states = [createState('s0', 'ONLY', { x: 0, y: 0 }, true)];

            const errors = checkMissingOutgoing(fsm);

            expect(errors[0].severity).toBe('info');
        });
    });

    describe('checkUndefinedSignals', () => {
        it('should detect undefined input signals in conditions', () => {
            const fsm = createEmptyFSM('undefined_input');
            fsm.states = [
                createState('s0', 'IDLE', { x: 0, y: 0 }, true),
                createState('s1', 'NEXT'),
            ];
            fsm.transitions = [
                createTransition('t0', 's0', 's1', 'unknown_signal'),  // Not declared
            ];
            fsm.inputs = [];  // No inputs declared

            const errors = checkUndefinedSignals(fsm);

            expect(errors).toHaveLength(1);
            expect(errors[0].type).toBe('undefined-signal');
            expect(errors[0].message).toContain('unknown_signal');
        });

        it('should detect undefined output signals in Mealy actions', () => {
            const fsm = createEmptyFSM('undefined_output');
            fsm.states = [
                createState('s0', 'IDLE', { x: 0, y: 0 }, true),
                createState('s1', 'NEXT'),
            ];
            fsm.transitions = [
                {
                    id: 't0',
                    from: 's0',
                    to: 's1',
                    condition: "1'b1",
                    actions: [{ signal: 'missing_out', value: "1'b1" }],
                },
            ];
            fsm.outputs = [];  // No outputs declared

            const errors = checkUndefinedSignals(fsm);

            expect(errors).toHaveLength(1);
            expect(errors[0].message).toContain('missing_out');
        });

        it('should detect undefined output signals in Moore outputs', () => {
            const fsm = createEmptyFSM('undefined_moore');
            fsm.states = [
                {
                    id: 's0',
                    name: 'IDLE',
                    position: { x: 0, y: 0 },
                    isInitial: true,
                    outputs: [{ signal: 'missing_out', value: "1'b1" }],
                },
            ];
            fsm.outputs = [];

            const errors = checkUndefinedSignals(fsm);

            expect(errors).toHaveLength(1);
            expect(errors[0].message).toContain('missing_out');
        });

        it('should pass for properly declared signals', () => {
            const fsm = createValidFSM();
            const errors = checkUndefinedSignals(fsm);
            expect(errors).toHaveLength(0);
        });
    });

    describe('extractSignalNames', () => {
        it('should extract simple identifiers', () => {
            expect(extractSignalNames('start')).toEqual(['start']);
        });

        it('should extract multiple identifiers', () => {
            const signals = extractSignalNames('start && ready');
            expect(signals).toContain('start');
            expect(signals).toContain('ready');
        });

        it('should ignore Verilog literals', () => {
            const signals = extractSignalNames("a == 1'b1");
            expect(signals).toEqual(['a']);
        });

        it('should handle complex expressions', () => {
            const signals = extractSignalNames("(a & b) | (!c && d)");
            expect(signals).toContain('a');
            expect(signals).toContain('b');
            expect(signals).toContain('c');
            expect(signals).toContain('d');
        });

        it('should remove duplicates', () => {
            const signals = extractSignalNames('a && a');
            expect(signals).toEqual(['a']);
        });

        it('should handle empty expression', () => {
            expect(extractSignalNames('')).toEqual([]);
        });
    });

    describe('getValidationSummary', () => {
        it('should count errors correctly', () => {
            const errors = [
                { type: 'missing-initial' as const, severity: 'error' as const, message: '' },
                { type: 'dead-transition' as const, severity: 'error' as const, message: '' },
                { type: 'unreachable-state' as const, severity: 'warning' as const, message: '' },
                { type: 'missing-outgoing' as const, severity: 'info' as const, message: '' },
            ];

            const summary = getValidationSummary(errors);

            expect(summary.errorCount).toBe(2);
            expect(summary.warningCount).toBe(1);
            expect(summary.infoCount).toBe(1);
            expect(summary.isValid).toBe(false);
        });

        it('should mark as valid when no errors', () => {
            const errors = [
                { type: 'unreachable-state' as const, severity: 'warning' as const, message: '' },
            ];

            const summary = getValidationSummary(errors);

            expect(summary.isValid).toBe(true);
        });
    });

    describe('filterBySeverity', () => {
        it('should filter by severity', () => {
            const errors = [
                { type: 'missing-initial' as const, severity: 'error' as const, message: 'e1' },
                { type: 'unreachable-state' as const, severity: 'warning' as const, message: 'w1' },
                { type: 'missing-outgoing' as const, severity: 'info' as const, message: 'i1' },
            ];

            expect(filterBySeverity(errors, 'error')).toHaveLength(1);
            expect(filterBySeverity(errors, 'warning')).toHaveLength(1);
            expect(filterBySeverity(errors, 'info')).toHaveLength(1);
        });
    });

    describe('filterByType', () => {
        it('should filter by type', () => {
            const errors = [
                { type: 'missing-initial' as const, severity: 'error' as const, message: '' },
                { type: 'missing-initial' as const, severity: 'error' as const, message: '' },
                { type: 'dead-transition' as const, severity: 'error' as const, message: '' },
            ];

            expect(filterByType(errors, 'missing-initial')).toHaveLength(2);
            expect(filterByType(errors, 'dead-transition')).toHaveLength(1);
        });
    });
});
