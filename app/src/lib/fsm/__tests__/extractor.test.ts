/**
 * Tests for Verilog → FSM Extractor
 * 
 * Note: The extractor currently works with mocked VerilogModule structures
 * since full CST-to-AST conversion is not yet implemented.
 */

import { describe, it, expect } from 'vitest';
import {
    findStateParams,
    applyAutoLayout,
} from '../extractor';
import { createEmptyFSM, createState } from '../types';
import type { VerilogModule, Declaration, DeclarationVariable } from '../../verilog/types';

describe('FSM Extractor', () => {

    // Helper to create a mock module with declarations
    function createMockModule(declarations: Declaration[]): VerilogModule {
        return {
            name: 'test',
            ports: [],
            declarations,
            statements: [],
        };
    }

    describe('findStateParams', () => {
        it('should find localparam state definitions', () => {
            const decl: Declaration = {
                declarationType: 'localparam',
                range: { msb: 1, lsb: 0 },
                variables: [
                    { name: 'IDLE', initialValue: "2'b00" },
                    { name: 'ACTIVE', initialValue: "2'b01" },
                    { name: 'DONE', initialValue: "2'b10" },
                ],
            };

            const mod = createMockModule([decl]);
            const params = findStateParams(mod);

            expect(params).toHaveLength(3);
            expect(params[0]).toEqual({ name: 'IDLE', value: '00', width: 2 });
            expect(params[1]).toEqual({ name: 'ACTIVE', value: '01', width: 2 });
            expect(params[2]).toEqual({ name: 'DONE', value: '10', width: 2 });
        });

        it('should handle one-hot encoding', () => {
            const decl: Declaration = {
                declarationType: 'localparam',
                range: { msb: 2, lsb: 0 },
                variables: [
                    { name: 'S0', initialValue: "3'b001" },
                    { name: 'S1', initialValue: "3'b010" },
                    { name: 'S2', initialValue: "3'b100" },
                ],
            };

            const mod = createMockModule([decl]);
            const params = findStateParams(mod);

            expect(params).toHaveLength(3);
            expect(params[0].value).toBe('001');
            expect(params[0].width).toBe(3);
        });

        it('should return empty array if no state params', () => {
            const decl: Declaration = {
                declarationType: 'wire',
                range: undefined,
                variables: [{ name: 'a' }],
            };

            const mod = createMockModule([decl]);
            const params = findStateParams(mod);

            expect(params).toHaveLength(0);
        });

        it('should ignore non-binary localparams', () => {
            const decl: Declaration = {
                declarationType: 'localparam',
                range: undefined,
                variables: [
                    { name: 'WIDTH', initialValue: '8' },  // Not binary
                    { name: 'STATE', initialValue: "2'b01" },  // Binary
                ],
            };

            const mod = createMockModule([decl]);
            const params = findStateParams(mod);

            expect(params).toHaveLength(1);
            expect(params[0].name).toBe('STATE');
        });
    });

    describe('applyAutoLayout', () => {
        it('should position states in a circle', () => {
            const fsm = createEmptyFSM('test');
            fsm.states = [
                createState('s0', 'A'),
                createState('s1', 'B'),
                createState('s2', 'C'),
                createState('s3', 'D'),
            ];

            applyAutoLayout(fsm);

            // Check that all states have different positions
            const positions = fsm.states.map(s => `${Math.round(s.position.x)},${Math.round(s.position.y)}`);
            expect(new Set(positions).size).toBe(4);

            // Check positions are reasonable (not all at origin)
            expect(fsm.states.some(s => s.position.x !== 0 || s.position.y !== 0)).toBe(true);
        });

        it('should handle single state', () => {
            const fsm = createEmptyFSM('test');
            fsm.states = [createState('s0', 'ONLY')];

            applyAutoLayout(fsm);

            expect(fsm.states[0].position).toBeDefined();
        });

        it('should handle empty FSM', () => {
            const fsm = createEmptyFSM('test');

            // Should not throw
            expect(() => applyAutoLayout(fsm)).not.toThrow();
        });

        it('should arrange states roughly in a circle', () => {
            const fsm = createEmptyFSM('test');
            fsm.states = [
                createState('s0', 'A'),
                createState('s1', 'B'),
                createState('s2', 'C'),
            ];

            applyAutoLayout(fsm);

            // All should be roughly the same distance from center
            const centerX = 300;
            const centerY = 300;

            const distances = fsm.states.map(s => {
                const dx = s.position.x - centerX;
                const dy = s.position.y - centerY;
                return Math.sqrt(dx * dx + dy * dy);
            });

            // Check all distances are similar (within 1% tolerance)
            const avgDist = distances.reduce((a, b) => a + b, 0) / distances.length;
            expect(distances.every(d => Math.abs(d - avgDist) < avgDist * 0.01)).toBe(true);
        });
    });

    describe('Encoding Detection', () => {
        // Test encoding detection logic through state params
        it('should recognize binary encoding pattern', () => {
            const decl: Declaration = {
                declarationType: 'localparam',
                range: { msb: 1, lsb: 0 },
                variables: [
                    { name: 'S0', initialValue: "2'b00" },
                    { name: 'S1', initialValue: "2'b01" },
                    { name: 'S2', initialValue: "2'b10" },
                    { name: 'S3', initialValue: "2'b11" },
                ],
            };

            const mod = createMockModule([decl]);
            const params = findStateParams(mod);

            expect(params).toHaveLength(4);
            // Verify sequential binary values
            expect(params.map(p => parseInt(p.value, 2))).toEqual([0, 1, 2, 3]);
        });

        it('should recognize one-hot encoding pattern', () => {
            const decl: Declaration = {
                declarationType: 'localparam',
                range: { msb: 3, lsb: 0 },
                variables: [
                    { name: 'S0', initialValue: "4'b0001" },
                    { name: 'S1', initialValue: "4'b0010" },
                    { name: 'S2', initialValue: "4'b0100" },
                    { name: 'S3', initialValue: "4'b1000" },
                ],
            };

            const mod = createMockModule([decl]);
            const params = findStateParams(mod);

            expect(params).toHaveLength(4);
            // Verify each has exactly one bit set
            params.forEach(p => {
                const ones = p.value.split('').filter(c => c === '1').length;
                expect(ones).toBe(1);
            });
        });
    });
});
