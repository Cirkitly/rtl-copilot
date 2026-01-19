/**
 * Tests for FSM → Verilog Generator
 */

import { describe, it, expect } from 'vitest';
import { generateFSMVerilog, generateTransitionCase, formatSignalAssignment } from '../generator';
import { createState, createTransition, createEmptyFSM } from '../types';
import type { FSM } from '../types';
import { parse } from '../../verilog/parser';
import { cstToAst } from '../../verilog/visitor';

describe('FSM Verilog Generator', () => {

    // Helper to create a simple 3-state FSM
    function createSimpleFSM(): FSM {
        return {
            name: 'traffic_light',
            states: [
                createState('s0', 'IDLE', { x: 0, y: 0 }, true),
                createState('s1', 'GREEN', { x: 100, y: 0 }),
                createState('s2', 'YELLOW', { x: 200, y: 0 }),
            ],
            transitions: [
                createTransition('t0', 's0', 's1', 'start'),
                createTransition('t1', 's1', 's2', 'timer_done'),
                createTransition('t2', 's2', 's0', 'timer_done'),
            ],
            clock: 'clk',
            reset: 'rst',
            resetPolarity: 'high',
            encoding: 'binary',
            fsmType: 'moore',
            inputs: [
                { name: 'start', width: 1, direction: 'input' },
                { name: 'timer_done', width: 1, direction: 'input' },
            ],
            outputs: [
                { name: 'red', width: 1, direction: 'output' },
                { name: 'green', width: 1, direction: 'output' },
                { name: 'yellow', width: 1, direction: 'output' },
            ],
        };
    }

    describe('generateFSMVerilog', () => {
        it('should generate valid Verilog module', () => {
            const fsm = createSimpleFSM();
            const verilog = generateFSMVerilog(fsm);

            expect(verilog).toContain('module traffic_light');
            expect(verilog).toContain('endmodule');
        });

        it('should include clock and reset in port list', () => {
            const fsm = createSimpleFSM();
            const verilog = generateFSMVerilog(fsm);

            expect(verilog).toContain('input wire clk');
            expect(verilog).toContain('input wire rst');
        });

        it('should include all inputs and outputs', () => {
            const fsm = createSimpleFSM();
            const verilog = generateFSMVerilog(fsm);

            expect(verilog).toContain('input wire start');
            expect(verilog).toContain('input wire timer_done');
            expect(verilog).toContain('output reg red');
            expect(verilog).toContain('output reg green');
            expect(verilog).toContain('output reg yellow');
        });

        it('should generate state encoding parameters', () => {
            const fsm = createSimpleFSM();
            const verilog = generateFSMVerilog(fsm);

            expect(verilog).toContain('localparam [1:0] IDLE');
            expect(verilog).toContain('localparam [1:0] GREEN');
            expect(verilog).toContain('localparam [1:0] YELLOW');
        });

        it('should generate state register declaration', () => {
            const fsm = createSimpleFSM();
            const verilog = generateFSMVerilog(fsm);

            expect(verilog).toContain('reg [1:0] current_state, next_state');
        });

        it('should generate sequential state register logic', () => {
            const fsm = createSimpleFSM();
            const verilog = generateFSMVerilog(fsm);

            expect(verilog).toContain('always @(posedge clk or posedge rst)');
            expect(verilog).toContain('current_state <= IDLE');
            expect(verilog).toContain('current_state <= next_state');
        });

        it('should generate next state combinational logic', () => {
            const fsm = createSimpleFSM();
            const verilog = generateFSMVerilog(fsm);

            expect(verilog).toContain('always @(*)');
            expect(verilog).toContain('case (current_state)');
            expect(verilog).toContain('IDLE: begin');
            expect(verilog).toContain('GREEN: begin');
            expect(verilog).toContain('YELLOW: begin');
            expect(verilog).toContain('endcase');
        });

        it('should generate transition conditions', () => {
            const fsm = createSimpleFSM();
            const verilog = generateFSMVerilog(fsm);

            expect(verilog).toContain('if (start)');
            expect(verilog).toContain('next_state = GREEN');
            expect(verilog).toContain('if (timer_done)');
            expect(verilog).toContain('next_state = YELLOW');
        });

        it('should include default case', () => {
            const fsm = createSimpleFSM();
            const verilog = generateFSMVerilog(fsm);

            expect(verilog).toContain('default: next_state = IDLE');
        });

        it('should throw error if no initial state', () => {
            const fsm = createSimpleFSM();
            fsm.states.forEach(s => s.isInitial = false);

            expect(() => generateFSMVerilog(fsm)).toThrow('FSM must have an initial state');
        });

        it('should generate output logic', () => {
            const fsm = createSimpleFSM();
            const verilog = generateFSMVerilog(fsm);

            expect(verilog).toContain('// Output logic');
            expect(verilog).toContain("red = 1'b0");
            expect(verilog).toContain("green = 1'b0");
            expect(verilog).toContain("yellow = 1'b0");
        });

        it('should generate parseable Verilog', () => {
            const fsm = createSimpleFSM();
            const verilog = generateFSMVerilog(fsm);

            const result = parse(verilog);
            expect(result.errors).toHaveLength(0);

            // Check AST using Visitor
            const ast = cstToAst(result.cst);
            expect(ast).toBeDefined();
            expect(ast.name).toBe('traffic_light');
        });
    });

    describe('Encoding Options', () => {
        it('should generate one-hot encoding', () => {
            const fsm = createSimpleFSM();
            fsm.encoding = 'onehot';
            const verilog = generateFSMVerilog(fsm);

            expect(verilog).toContain('localparam [2:0] IDLE');
            expect(verilog).toContain("3'b100");
            expect(verilog).toContain("3'b010");
            expect(verilog).toContain("3'b001");
        });

        it('should generate gray encoding', () => {
            const fsm = createSimpleFSM();
            fsm.encoding = 'gray';
            const verilog = generateFSMVerilog(fsm);

            expect(verilog).toContain('localparam [1:0] IDLE');
            expect(verilog).toContain("2'b00");  // IDLE = 0
            expect(verilog).toContain("2'b01");  // GREEN = 1
            expect(verilog).toContain("2'b11");  // YELLOW = gray(2) = 3
        });
    });

    describe('Reset Options', () => {
        it('should generate active-low reset', () => {
            const fsm = createSimpleFSM();
            fsm.resetPolarity = 'low';
            const verilog = generateFSMVerilog(fsm);

            expect(verilog).toContain('negedge rst');
            expect(verilog).toContain('if (!rst)');
        });

        it('should generate synchronous reset', () => {
            const fsm = createSimpleFSM();
            const verilog = generateFSMVerilog(fsm, { syncReset: true });

            expect(verilog).toContain('always @(posedge clk)');
            expect(verilog).not.toContain('posedge rst');
        });
    });

    describe('Generator Options', () => {
        it('should omit comments when disabled', () => {
            const fsm = createSimpleFSM();
            const verilog = generateFSMVerilog(fsm, { includeComments: false });

            expect(verilog).not.toContain('// FSM:');
            expect(verilog).not.toContain('// State encoding');
        });

        it('should use custom state register names', () => {
            const fsm = createSimpleFSM();
            const verilog = generateFSMVerilog(fsm, {
                stateRegName: 'state_r',
                nextStateName: 'state_next',
            });

            expect(verilog).toContain('reg [1:0] state_r, state_next');
            expect(verilog).toContain('case (state_r)');
            expect(verilog).toContain('state_next = GREEN');
        });

        it('should use custom indentation', () => {
            const fsm = createSimpleFSM();
            const verilog = generateFSMVerilog(fsm, { indent: '    ' });

            // Should have 4-space indentation
            expect(verilog).toContain('    input wire clk');
        });
    });

    describe('Moore Outputs', () => {
        it('should generate state-based outputs', () => {
            const fsm = createSimpleFSM();

            // Add Moore outputs to states
            fsm.states[0].outputs = [{ signal: 'red', value: "1'b1" }];  // IDLE: red on
            fsm.states[1].outputs = [{ signal: 'green', value: "1'b1" }];  // GREEN: green on
            fsm.states[2].outputs = [{ signal: 'yellow', value: "1'b1" }];  // YELLOW: yellow on

            const verilog = generateFSMVerilog(fsm);

            expect(verilog).toContain("IDLE: begin");
            expect(verilog).toContain("red = 1'b1");
            expect(verilog).toContain("GREEN: begin");
            expect(verilog).toContain("green = 1'b1");
        });
    });

    describe('Mealy Outputs', () => {
        it('should generate transition-based outputs', () => {
            const fsm = createSimpleFSM();

            // Add Mealy output to transition
            fsm.transitions[0].actions = [{ signal: 'ack', value: "1'b1" }];
            fsm.outputs.push({ name: 'ack', width: 1, direction: 'output' });

            const verilog = generateFSMVerilog(fsm);

            expect(verilog).toContain("if (start) begin");
            expect(verilog).toContain("ack = 1'b1");
        });
    });

    describe('Wide Signals', () => {
        it('should handle multi-bit signals', () => {
            const fsm = createEmptyFSM('counter_fsm');
            fsm.states = [
                createState('s0', 'IDLE', { x: 0, y: 0 }, true),
                createState('s1', 'COUNT', { x: 100, y: 0 }),
            ];
            fsm.transitions = [
                createTransition('t0', 's0', 's1', 'enable'),
                createTransition('t1', 's1', 's0', 'done'),
            ];
            fsm.inputs = [
                { name: 'enable', width: 1, direction: 'input' },
                { name: 'done', width: 1, direction: 'input' },
            ];
            fsm.outputs = [
                { name: 'count', width: 8, direction: 'output', defaultValue: "8'b0" },
            ];

            const verilog = generateFSMVerilog(fsm);

            expect(verilog).toContain('output reg [7:0] count');
            expect(verilog).toContain("count = 8'b0");
        });
    });

    describe('Edge Cases', () => {
        it('should handle state with no outgoing transitions', () => {
            const fsm = createEmptyFSM('deadend');
            fsm.states = [
                createState('s0', 'START', { x: 0, y: 0 }, true),
                createState('s1', 'END', { x: 100, y: 0 }),
            ];
            fsm.transitions = [
                createTransition('t0', 's0', 's1', 'go'),
            ];
            fsm.inputs = [{ name: 'go', width: 1, direction: 'input' }];

            const verilog = generateFSMVerilog(fsm);

            expect(verilog).toContain('END: begin');
            // Should have comment about no transitions
            expect(verilog).toMatch(/END: begin[\s\S]*?end/);
        });

        it('should handle unconditional transition', () => {
            const fsm = createEmptyFSM('auto');
            fsm.states = [
                createState('s0', 'A', { x: 0, y: 0 }, true),
                createState('s1', 'B', { x: 100, y: 0 }),
            ];
            fsm.transitions = [
                createTransition('t0', 's0', 's1', "1'b1"),  // Unconditional
            ];

            const verilog = generateFSMVerilog(fsm);

            expect(verilog).toContain('next_state = B');
            expect(verilog).not.toContain("if (1'b1)");
        });

        it('should handle multiple transitions from same state', () => {
            const fsm = createEmptyFSM('multi');
            fsm.states = [
                createState('s0', 'IDLE', { x: 0, y: 0 }, true),
                createState('s1', 'A', { x: 100, y: 0 }),
                createState('s2', 'B', { x: 200, y: 0 }),
            ];
            fsm.transitions = [
                createTransition('t0', 's0', 's1', 'cond_a'),
                createTransition('t1', 's0', 's2', 'cond_b'),
            ];
            fsm.inputs = [
                { name: 'cond_a', width: 1, direction: 'input' },
                { name: 'cond_b', width: 1, direction: 'input' },
            ];

            const verilog = generateFSMVerilog(fsm);

            expect(verilog).toContain('if (cond_a)');
            expect(verilog).toContain('else if (cond_b)');
        });
    });

    describe('Self-loop Transitions', () => {
        it('should handle self-loop transitions', () => {
            const fsm = createEmptyFSM('selfloop');
            fsm.states = [
                createState('s0', 'WAIT', { x: 0, y: 0 }, true),
            ];
            fsm.transitions = [
                createTransition('t0', 's0', 's0', 'stay'),
            ];
            fsm.inputs = [{ name: 'stay', width: 1, direction: 'input' }];

            const verilog = generateFSMVerilog(fsm);

            expect(verilog).toContain('if (stay)');
            expect(verilog).toContain('next_state = WAIT');
        });
    });

    describe('generateTransitionCase', () => {
        it('should generate case block for a single state', () => {
            const fsm = createSimpleFSM();
            const idleState = fsm.states[0];

            const lines = generateTransitionCase(fsm, idleState);

            expect(lines).toContain('IDLE: begin');
            expect(lines).toContain('end');
            expect(lines.some(l => l.includes('if (start)'))).toBe(true);
        });
    });

    describe('formatSignalAssignment', () => {
        it('should format signal assignment', () => {
            const result = formatSignalAssignment({ signal: 'led', value: "1'b1" });
            expect(result).toBe("led = 1'b1;");
        });

        it('should handle multi-bit values', () => {
            const result = formatSignalAssignment({ signal: 'data', value: "8'hFF" });
            expect(result).toBe("data = 8'hFF;");
        });
    });
});
