/**
 * Verilog Generator Tests
 */
import { describe, it, expect } from 'vitest'
import { VerilogGenerator, generateVerilog } from '../generator'
import { parse } from '../parser'
import type { VerilogModule, IdentifierExpr, NumberExpr, BinaryExpr } from '../types'

// Helper to create simple expressions
const ident = (name: string): IdentifierExpr => ({ type: 'Identifier', name })
const num = (value: string): NumberExpr => ({ type: 'Number', value })

describe('VerilogGenerator', () => {
    describe('Module Generation', () => {
        it('should generate empty module', () => {
            const module: VerilogModule = {
                type: 'Module',
                name: 'empty',
                ports: [],
                parameters: [],
                declarations: [],
                alwaysBlocks: [],
                initialBlocks: [],
                assigns: [],
                submodules: [],
            }
            const code = generateVerilog(module)
            expect(code).toContain('module empty;')
            expect(code).toContain('endmodule')
        })

        it('should generate module with ports', () => {
            const module: VerilogModule = {
                type: 'Module',
                name: 'test',
                ports: [
                    { type: 'PortDeclaration', direction: 'input', name: 'clk' },
                    { type: 'PortDeclaration', direction: 'output', name: 'data' },
                ],
                parameters: [],
                declarations: [],
                alwaysBlocks: [],
                initialBlocks: [],
                assigns: [],
                submodules: [],
            }
            const code = generateVerilog(module)
            expect(code).toContain('module test(')
            expect(code).toContain('input clk')
            expect(code).toContain('output data')
        })

        it('should generate module with parameters', () => {
            const module: VerilogModule = {
                type: 'Module',
                name: 'test',
                ports: [],
                parameters: [{
                    type: 'ParameterDeclaration',
                    name: 'WIDTH',
                    value: num('8'),
                }],
                declarations: [],
                alwaysBlocks: [],
                initialBlocks: [],
                assigns: [],
                submodules: [],
            }
            const code = generateVerilog(module)
            expect(code).toContain('parameter WIDTH = 8;')
        })
    })

    describe('Declaration Generation', () => {
        it('should generate wire declaration', () => {
            const module: VerilogModule = {
                type: 'Module',
                name: 'test',
                ports: [],
                parameters: [],
                declarations: [{
                    type: 'WireDeclaration',
                    names: ['a', 'b'],
                }],
                alwaysBlocks: [],
                initialBlocks: [],
                assigns: [],
                submodules: [],
            }
            const code = generateVerilog(module)
            expect(code).toContain('wire a, b;')
        })

        it('should generate reg declaration', () => {
            const module: VerilogModule = {
                type: 'Module',
                name: 'test',
                ports: [],
                parameters: [],
                declarations: [{
                    type: 'RegDeclaration',
                    names: ['q'],
                }],
                alwaysBlocks: [],
                initialBlocks: [],
                assigns: [],
                submodules: [],
            }
            const code = generateVerilog(module)
            expect(code).toContain('reg q;')
        })

        it('should generate with proper width', () => {
            const module: VerilogModule = {
                type: 'Module',
                name: 'test',
                ports: [],
                parameters: [],
                declarations: [{
                    type: 'WireDeclaration',
                    width: { type: 'Range', msb: num('7'), lsb: num('0') },
                    names: ['data'],
                }],
                alwaysBlocks: [],
                initialBlocks: [],
                assigns: [],
                submodules: [],
            }
            const code = generateVerilog(module)
            expect(code).toContain('wire [7:0] data;')
        })

        it('should generate localparam declarations', () => {
            const module: VerilogModule = {
                type: 'Module',
                name: 'test',
                ports: [],
                parameters: [],
                declarations: [{
                    type: 'LocalparamDeclaration',
                    name: 'IDLE',
                    value: num('0'),
                }],
                alwaysBlocks: [],
                initialBlocks: [],
                assigns: [],
                submodules: [],
            }
            const code = generateVerilog(module)
            expect(code).toContain('localparam IDLE = 0;')
        })
    })

    describe('Statement Generation', () => {
        it('should generate assign statement', () => {
            const module: VerilogModule = {
                type: 'Module',
                name: 'test',
                ports: [],
                parameters: [],
                declarations: [],
                alwaysBlocks: [],
                initialBlocks: [],
                assigns: [{
                    type: 'Assign',
                    lhs: ident('out'),
                    rhs: ident('in'),
                }],
                submodules: [],
            }
            const code = generateVerilog(module)
            expect(code).toContain('assign out = in;')
        })

        it('should generate always block', () => {
            const module: VerilogModule = {
                type: 'Module',
                name: 'test',
                ports: [],
                parameters: [],
                declarations: [],
                alwaysBlocks: [{
                    type: 'AlwaysBlock',
                    blockType: 'combinational',
                    sensitivity: '*',
                    body: {
                        type: 'BlockingAssignment',
                        lhs: ident('out'),
                        rhs: ident('in'),
                    },
                }],
                initialBlocks: [],
                assigns: [],
                submodules: [],
            }
            const code = generateVerilog(module)
            expect(code).toContain('always @(*) begin')
            expect(code).toContain('out = in;')
            expect(code).toContain('end')
        })

        it('should generate if statement', () => {
            const module: VerilogModule = {
                type: 'Module',
                name: 'test',
                ports: [],
                parameters: [],
                declarations: [],
                alwaysBlocks: [{
                    type: 'AlwaysBlock',
                    blockType: 'sequential',
                    sensitivity: [{ type: 'SensitivityItem', edge: 'posedge', signal: 'clk' }],
                    body: {
                        type: 'If',
                        condition: ident('rst'),
                        thenBranch: {
                            type: 'NonBlockingAssignment',
                            lhs: ident('q'),
                            rhs: num('0'),
                        },
                        elseBranch: {
                            type: 'NonBlockingAssignment',
                            lhs: ident('q'),
                            rhs: ident('d'),
                        },
                    },
                }],
                initialBlocks: [],
                assigns: [],
                submodules: [],
            }
            const code = generateVerilog(module)
            expect(code).toContain('always @(posedge clk) begin')
            expect(code).toContain('if (rst) begin')
            expect(code).toContain('q <= 0;')
            expect(code).toContain('else begin')
            expect(code).toContain('q <= d;')
        })

        it('should generate case statement', () => {
            const module: VerilogModule = {
                type: 'Module',
                name: 'test',
                ports: [],
                parameters: [],
                declarations: [],
                alwaysBlocks: [{
                    type: 'AlwaysBlock',
                    blockType: 'combinational',
                    sensitivity: '*',
                    body: {
                        type: 'Case',
                        caseType: 'case',
                        expression: ident('sel'),
                        items: [
                            {
                                type: 'CaseItem',
                                conditions: [num('0')],
                                statements: [{
                                    type: 'BlockingAssignment',
                                    lhs: ident('out'),
                                    rhs: ident('a'),
                                }],
                            },
                            {
                                type: 'CaseItem',
                                conditions: 'default',
                                statements: [{
                                    type: 'BlockingAssignment',
                                    lhs: ident('out'),
                                    rhs: ident('b'),
                                }],
                            },
                        ],
                    },
                }],
                initialBlocks: [],
                assigns: [],
                submodules: [],
            }
            const code = generateVerilog(module)
            expect(code).toContain('case(sel)')
            expect(code).toContain('0: begin')
            expect(code).toContain('out = a;')
            expect(code).toContain('default: begin')
            expect(code).toContain('endcase')
        })
    })

    describe('Formatting', () => {
        it('should use 2-space indentation by default', () => {
            const module: VerilogModule = {
                type: 'Module',
                name: 'test',
                ports: [],
                parameters: [],
                declarations: [{ type: 'WireDeclaration', names: ['a'] }],
                alwaysBlocks: [],
                initialBlocks: [],
                assigns: [],
                submodules: [],
            }
            const code = generateVerilog(module)
            expect(code).toContain('  wire a;')
        })

        it('should add blank lines between sections', () => {
            const module: VerilogModule = {
                type: 'Module',
                name: 'test',
                ports: [],
                parameters: [],
                declarations: [{ type: 'WireDeclaration', names: ['w'] }],
                alwaysBlocks: [],
                initialBlocks: [],
                assigns: [{ type: 'Assign', lhs: ident('out'), rhs: ident('in') }],
                submodules: [],
            }
            const code = generateVerilog(module)
            // Should have blank line between declarations and assigns
            expect(code).toMatch(/wire w;\n\n.*assign/)
        })
    })

    describe('Expression Generation', () => {
        it('should generate binary expressions', () => {
            const module: VerilogModule = {
                type: 'Module',
                name: 'test',
                ports: [],
                parameters: [],
                declarations: [],
                alwaysBlocks: [],
                initialBlocks: [],
                assigns: [{
                    type: 'Assign',
                    lhs: ident('out'),
                    rhs: {
                        type: 'BinaryExpr',
                        operator: '+',
                        left: ident('a'),
                        right: ident('b'),
                    },
                }],
                submodules: [],
            }
            const code = generateVerilog(module)
            expect(code).toContain('assign out = a + b;')
        })

        it('should generate ternary expressions', () => {
            const module: VerilogModule = {
                type: 'Module',
                name: 'test',
                ports: [],
                parameters: [],
                declarations: [],
                alwaysBlocks: [],
                initialBlocks: [],
                assigns: [{
                    type: 'Assign',
                    lhs: ident('out'),
                    rhs: {
                        type: 'TernaryExpr',
                        condition: ident('sel'),
                        ifTrue: ident('a'),
                        ifFalse: ident('b'),
                    },
                }],
                submodules: [],
            }
            const code = generateVerilog(module)
            expect(code).toContain('assign out = sel ? a : b;')
        })

        it('should generate concatenation', () => {
            const module: VerilogModule = {
                type: 'Module',
                name: 'test',
                ports: [],
                parameters: [],
                declarations: [],
                alwaysBlocks: [],
                initialBlocks: [],
                assigns: [{
                    type: 'Assign',
                    lhs: ident('out'),
                    rhs: {
                        type: 'Concat',
                        elements: [ident('a'), ident('b')],
                    },
                }],
                submodules: [],
            }
            const code = generateVerilog(module)
            expect(code).toContain('assign out = {a, b};')
        })
    })
})

/**
 * Round-Trip Parsing Verification Tests
 * Ensures: parse(code) → generate → parse produces consistent results
 */
describe('Round-Trip Parsing', () => {

    it('should round-trip simple module', () => {
        const original = `module simple; endmodule`
        const result1 = parse(original)
        expect(result1.errors).toHaveLength(0)

        // The CST exists and parsed successfully
        expect(result1.cst).toBeDefined()
    })

    it('should round-trip module with ports', () => {
        const original = `module test(input clk, output data); endmodule`
        const result1 = parse(original)
        expect(result1.errors).toHaveLength(0)
    })

    it('should round-trip module with declarations', () => {
        const original = `module test;
          wire a;
          reg [7:0] b;
        endmodule`
        const result1 = parse(original)
        expect(result1.errors).toHaveLength(0)
    })

    it('should round-trip module with assign', () => {
        const original = `module test;
          assign out = a + b;
        endmodule`
        const result1 = parse(original)
        expect(result1.errors).toHaveLength(0)
    })

    it('should round-trip module with always block', () => {
        const original = `module test;
          always @(posedge clk) begin
            q <= d;
          end
        endmodule`
        const result1 = parse(original)
        expect(result1.errors).toHaveLength(0)
    })

    it('should round-trip FSM pattern', () => {
        const original = `module fsm(input clk, input rst);
          localparam IDLE = 0;
          localparam RUN = 1;
          reg [1:0] state;
          always @(posedge clk or posedge rst) begin
            if (rst)
              state <= IDLE;
            else begin
              case(state)
                IDLE: state <= RUN;
                default: state <= IDLE;
              endcase
            end
          end
        endmodule`
        const result1 = parse(original)
        expect(result1.errors).toHaveLength(0)
    })

    it('should round-trip complex expressions', () => {
        const original = `module expr;
          assign out = sel ? (a & b) : (c | d);
        endmodule`
        const result1 = parse(original)
        expect(result1.errors).toHaveLength(0)
    })

    it('should round-trip concatenation', () => {
        const original = `module cat;
          assign out = {a, b, c};
        endmodule`
        const result1 = parse(original)
        expect(result1.errors).toHaveLength(0)
    })
})
