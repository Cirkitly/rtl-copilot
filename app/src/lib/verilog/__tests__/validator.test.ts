/**
 * Verilog Validator Tests
 */
import { describe, it, expect } from 'vitest'
import { VerilogValidator, validateModule, LintRules } from '../validator'
import type { VerilogModule, IdentifierExpr, NumberExpr } from '../types'

// Helper to create expressions
const ident = (name: string): IdentifierExpr => ({ type: 'Identifier', name })
const num = (value: string): NumberExpr => ({ type: 'Number', value })

// Empty module helper
const emptyMod = (overrides: Partial<VerilogModule> = {}): VerilogModule => ({
    type: 'Module',
    name: 'test',
    ports: [],
    parameters: [],
    declarations: [],
    alwaysBlocks: [],
    initialBlocks: [],
    assigns: [],
    submodules: [],
    ...overrides,
})

describe('VerilogValidator', () => {
    describe('Lint Rules', () => {
        it('should detect undriven signals', () => {
            const mod = emptyMod({
                declarations: [
                    { type: 'WireDeclaration', names: ['undriven_wire'] },
                ],
            })
            const result = validateModule(mod)
            expect(result.errors.some(e => e.rule === 'undriven-signal')).toBe(true)
        })

        it('should not flag driven signals', () => {
            const mod = emptyMod({
                declarations: [
                    { type: 'WireDeclaration', names: ['driven_wire'] },
                ],
                assigns: [
                    { type: 'Assign', lhs: ident('driven_wire'), rhs: num('0') },
                ],
            })
            const result = LintRules.undrivenSignal.check(mod)
            expect(result.some(e => e.message.includes('driven_wire'))).toBe(false)
        })

        it('should not flag input ports as undriven', () => {
            const mod = emptyMod({
                ports: [
                    { type: 'PortDeclaration', direction: 'input', name: 'clk' },
                ],
            })
            const result = LintRules.undrivenSignal.check(mod)
            expect(result.some(e => e.message.includes('clk'))).toBe(false)
        })

        it('should detect blocking assignment in sequential block', () => {
            const mod = emptyMod({
                alwaysBlocks: [{
                    type: 'AlwaysBlock',
                    blockType: 'sequential',
                    sensitivity: [{ type: 'SensitivityItem', edge: 'posedge', signal: 'clk' }],
                    body: {
                        type: 'BlockingAssignment',
                        lhs: ident('q'),
                        rhs: ident('d'),
                    },
                }],
            })
            const result = LintRules.blockingInSequential.check(mod)
            expect(result.length).toBeGreaterThan(0)
            expect(result[0].rule).toBe('blocking-in-sequential')
        })

        it('should detect non-blocking in combinational block', () => {
            const mod = emptyMod({
                alwaysBlocks: [{
                    type: 'AlwaysBlock',
                    blockType: 'combinational',
                    sensitivity: '*',
                    body: {
                        type: 'NonBlockingAssignment',
                        lhs: ident('out'),
                        rhs: ident('in'),
                    },
                }],
            })
            const result = LintRules.nonBlockingInCombinational.check(mod)
            expect(result.length).toBeGreaterThan(0)
            expect(result[0].rule).toBe('nonblocking-in-combinational')
        })

        it('should detect missing default case', () => {
            const mod = emptyMod({
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
                                statements: [{ type: 'BlockingAssignment', lhs: ident('out'), rhs: ident('a') }],
                            },
                        ],
                    },
                }],
            })
            const result = LintRules.missingDefaultCase.check(mod)
            expect(result.length).toBeGreaterThan(0)
            expect(result[0].rule).toBe('missing-default-case')
        })

        it('should not flag case with default clause', () => {
            const mod = emptyMod({
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
                                statements: [{ type: 'BlockingAssignment', lhs: ident('out'), rhs: ident('a') }],
                            },
                            {
                                type: 'CaseItem',
                                conditions: 'default',
                                statements: [{ type: 'BlockingAssignment', lhs: ident('out'), rhs: ident('b') }],
                            },
                        ],
                    },
                }],
            })
            const result = LintRules.missingDefaultCase.check(mod)
            expect(result.length).toBe(0)
        })

        it('should detect multi-driven signals', () => {
            const mod = emptyMod({
                assigns: [
                    { type: 'Assign', lhs: ident('out'), rhs: ident('a') },
                    { type: 'Assign', lhs: ident('out'), rhs: ident('b') },
                ],
            })
            const result = LintRules.multiDrivenSignal.check(mod)
            expect(result.some(e => e.message.includes('out'))).toBe(true)
        })

        it('should suggest @(*) for explicit sensitivity lists', () => {
            const mod = emptyMod({
                alwaysBlocks: [{
                    type: 'AlwaysBlock',
                    blockType: 'combinational',
                    sensitivity: [{ type: 'SensitivityItem', signal: 'a' }],
                    body: {
                        type: 'BlockingAssignment',
                        lhs: ident('out'),
                        rhs: ident('a'),
                    },
                }],
            })
            const result = LintRules.incompleteSensitivity.check(mod)
            expect(result.length).toBeGreaterThan(0)
        })

        it('should not flag @(*) sensitivity lists', () => {
            const mod = emptyMod({
                alwaysBlocks: [{
                    type: 'AlwaysBlock',
                    blockType: 'combinational',
                    sensitivity: '*',
                    body: {
                        type: 'BlockingAssignment',
                        lhs: ident('out'),
                        rhs: ident('a'),
                    },
                }],
            })
            const result = LintRules.incompleteSensitivity.check(mod)
            expect(result.length).toBe(0)
        })
    })

    describe('ValidationResult', () => {
        it('should return isValid=true for clean module', () => {
            const mod = emptyMod({
                ports: [
                    { type: 'PortDeclaration', direction: 'input', name: 'a' },
                    { type: 'PortDeclaration', direction: 'output', name: 'b' },
                ],
                assigns: [
                    { type: 'Assign', lhs: ident('b'), rhs: ident('a') },
                ],
            })
            const result = validateModule(mod)
            expect(result.isValid).toBe(true)
        })

        it('should return isValid=false for errors', () => {
            const mod = emptyMod({
                declarations: [
                    { type: 'WireDeclaration', names: ['undriven'] },
                ],
            })
            const result = validateModule(mod)
            expect(result.isValid).toBe(false)
            expect(result.errors.length).toBeGreaterThan(0)
        })

        it('should separate errors and warnings', () => {
            const mod = emptyMod({
                declarations: [
                    { type: 'WireDeclaration', names: ['undriven'] },
                ],
                alwaysBlocks: [{
                    type: 'AlwaysBlock',
                    blockType: 'sequential',
                    sensitivity: [{ type: 'SensitivityItem', edge: 'posedge', signal: 'clk' }],
                    body: {
                        type: 'BlockingAssignment',
                        lhs: ident('q'),
                        rhs: ident('d'),
                    },
                }],
            })
            const result = validateModule(mod)
            expect(result.errors.length).toBeGreaterThan(0)
            expect(result.warnings.length).toBeGreaterThan(0)
        })
    })

    describe('Validator API', () => {
        it('should list available rules', () => {
            const validator = new VerilogValidator()
            const rules = validator.getRules()
            expect(rules.length).toBeGreaterThan(0)
            expect(rules.some(r => r.name === 'undriven-signal')).toBe(true)
        })

        it('should check single rule', () => {
            const validator = new VerilogValidator()
            const mod = emptyMod({
                declarations: [{ type: 'WireDeclaration', names: ['test'] }],
            })
            const violations = validator.checkRule(mod, 'undriven-signal')
            expect(violations.length).toBeGreaterThan(0)
        })

        it('should throw for unknown rule', () => {
            const validator = new VerilogValidator()
            expect(() => validator.checkRule(emptyMod(), 'nonexistent-rule')).toThrow()
        })
    })
})

describe('Integration: Real-World Patterns', () => {
    it('should validate well-formed D flip-flop', () => {
        const mod = emptyMod({
            ports: [
                { type: 'PortDeclaration', direction: 'input', name: 'clk' },
                { type: 'PortDeclaration', direction: 'input', name: 'd' },
                { type: 'PortDeclaration', direction: 'output', portType: 'reg', name: 'q' },
            ],
            alwaysBlocks: [{
                type: 'AlwaysBlock',
                blockType: 'sequential',
                sensitivity: [{ type: 'SensitivityItem', edge: 'posedge', signal: 'clk' }],
                body: {
                    type: 'NonBlockingAssignment',
                    lhs: ident('q'),
                    rhs: ident('d'),
                },
            }],
        })
        const result = validateModule(mod)
        expect(result.errors.length).toBe(0)
    })

    it('should validate well-formed combinational mux', () => {
        const mod = emptyMod({
            ports: [
                { type: 'PortDeclaration', direction: 'input', name: 'sel' },
                { type: 'PortDeclaration', direction: 'input', name: 'a' },
                { type: 'PortDeclaration', direction: 'input', name: 'b' },
                { type: 'PortDeclaration', direction: 'output', name: 'out' },
            ],
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
        })
        const result = validateModule(mod)
        expect(result.isValid).toBe(true)
    })
})
