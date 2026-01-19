/**
 * Property-Based Tests for Verilog Parser
 * Uses fast-check for generative testing
 */
import { describe, it, expect } from 'vitest'
import * as fc from 'fast-check'
import { tokenize } from '../lexer'
import { parse } from '../parser'

// ============================================================================
// Arbitrary Generators for Verilog
// ============================================================================

// Reserved keywords to filter out
const KEYWORDS = ['module', 'endmodule', 'input', 'output', 'wire', 'reg', 'assign',
    'always', 'begin', 'end', 'if', 'else', 'case', 'endcase', 'default',
    'parameter', 'localparam', 'posedge', 'negedge', 'or', 'and', 'not',
    'initial', 'inout', 'integer', 'casex', 'casez']

// Simple letters for identifiers
const letters = 'abcdefghijklmnopqrstuvwxyz'.split('')
const alphanums = 'abcdefghijklmnopqrstuvwxyz0123456789'.split('')

// Generate valid Verilog identifiers
const identifier = fc.tuple(
    fc.constantFrom(...letters),
    fc.array(fc.constantFrom(...alphanums), { minLength: 0, maxLength: 5 })
).map(([first, rest]) => first + rest.join(''))
    .filter(s => !KEYWORDS.includes(s.toLowerCase()))

// Generate valid decimal numbers
const decimalNumber = fc.integer({ min: 0, max: 999 }).map(n => n.toString())

// Generate small sized binary numbers using integer
const sizedBinaryNumber = fc.tuple(
    fc.integer({ min: 1, max: 8 }),
    fc.integer({ min: 0, max: 255 })
).map(([size, val]) => {
    const bits = val.toString(2).padStart(size, '0').slice(-size)
    return `${size}'b${bits}`
})

// Generate binary operators
const binaryOp = fc.constantFrom('+', '-', '&', '|', '^')

// ============================================================================
// Property-Based Tests
// ============================================================================

describe('Property-Based Tests: Lexer', () => {
    it('should tokenize any valid identifier', () => {
        fc.assert(
            fc.property(identifier, (id) => {
                const result = tokenize(id)
                return result.errors.length === 0 && result.tokens.length > 0
            }),
            { numRuns: 50 }
        )
    })

    it('should tokenize any decimal number', () => {
        fc.assert(
            fc.property(decimalNumber, (num) => {
                const result = tokenize(num)
                return result.errors.length === 0 && result.tokens.length === 1
            }),
            { numRuns: 50 }
        )
    })

    it('should tokenize any sized binary number', () => {
        fc.assert(
            fc.property(sizedBinaryNumber, (num) => {
                const result = tokenize(num)
                return result.errors.length === 0 && result.tokens.length === 1
            }),
            { numRuns: 50 }
        )
    })

    it('should tokenize whitespace-separated identifiers', () => {
        fc.assert(
            fc.property(
                fc.array(identifier, { minLength: 1, maxLength: 5 }),
                (ids) => {
                    const code = ids.join(' ')
                    const result = tokenize(code)
                    return result.errors.length === 0 &&
                        result.tokens.length === ids.length
                }
            ),
            { numRuns: 30 }
        )
    })
})

describe('Property-Based Tests: Parser', () => {
    it('should parse empty module with any valid name', () => {
        fc.assert(
            fc.property(identifier, (name) => {
                const code = `module ${name}; endmodule`
                const result = parse(code)
                return result.errors.length === 0 && result.cst !== null
            }),
            { numRuns: 50 }
        )
    })

    it('should parse module with input ports', () => {
        fc.assert(
            fc.property(
                identifier,
                fc.array(identifier, { minLength: 1, maxLength: 4 }),
                (moduleName, portNames) => {
                    const uniquePorts = [...new Set(portNames)]
                    if (uniquePorts.length === 0) return true
                    const ports = uniquePorts.map(p => `input ${p}`).join(', ')
                    const code = `module ${moduleName}(${ports}); endmodule`
                    const result = parse(code)
                    return result.errors.length === 0
                }
            ),
            { numRuns: 30 }
        )
    })

    it('should parse module with wire declarations', () => {
        fc.assert(
            fc.property(
                identifier,
                fc.array(identifier, { minLength: 1, maxLength: 3 }),
                (moduleName, wireNames) => {
                    const uniqueWires = [...new Set(wireNames)]
                    if (uniqueWires.length === 0) return true
                    const wires = uniqueWires.map(w => `wire ${w};`).join('\n  ')
                    const code = `module ${moduleName};\n  ${wires}\nendmodule`
                    const result = parse(code)
                    return result.errors.length === 0
                }
            ),
            { numRuns: 30 }
        )
    })

    it('should parse simple assign statements', () => {
        fc.assert(
            fc.property(
                identifier,
                identifier,
                identifier,
                (modName, lhs, rhs) => {
                    if (lhs === rhs) return true
                    const code = `module ${modName}; assign ${lhs} = ${rhs}; endmodule`
                    const result = parse(code)
                    return result.errors.length === 0
                }
            ),
            { numRuns: 30 }
        )
    })

    it('should parse assign with binary expressions', () => {
        fc.assert(
            fc.property(
                identifier,
                identifier,
                identifier,
                identifier,
                binaryOp,
                (modName, lhs, a, b, op) => {
                    const code = `module ${modName}; assign ${lhs} = ${a} ${op} ${b}; endmodule`
                    const result = parse(code)
                    return result.errors.length === 0
                }
            ),
            { numRuns: 30 }
        )
    })

    it('should parse combinational always blocks', () => {
        fc.assert(
            fc.property(
                identifier,
                identifier,
                identifier,
                (modName, lhs, rhs) => {
                    if (lhs === rhs) return true
                    const code = `module ${modName}; always @(*) ${lhs} = ${rhs}; endmodule`
                    const result = parse(code)
                    return result.errors.length === 0
                }
            ),
            { numRuns: 30 }
        )
    })

    it('should parse sequential always blocks', () => {
        fc.assert(
            fc.property(
                identifier,
                identifier,
                identifier,
                identifier,
                (modName, clk, lhs, rhs) => {
                    if (lhs === rhs || clk === lhs) return true
                    const code = `module ${modName}; always @(posedge ${clk}) ${lhs} <= ${rhs}; endmodule`
                    const result = parse(code)
                    return result.errors.length === 0
                }
            ),
            { numRuns: 30 }
        )
    })
})

describe('Property-Based Tests: Invariants', () => {
    it('lexer and parser should agree on valid modules', () => {
        fc.assert(
            fc.property(identifier, (name) => {
                const code = `module ${name}; endmodule`
                const lexResult = tokenize(code)
                const parseResult = parse(code)
                return lexResult.errors.length === 0 && parseResult.errors.length === 0
            }),
            { numRuns: 50 }
        )
    })

    it('tokenization should always produce tokens for identifiers and numbers', () => {
        fc.assert(
            fc.property(
                fc.array(
                    fc.oneof(identifier, decimalNumber),
                    { minLength: 1, maxLength: 5 }
                ),
                (tokens) => {
                    const code = tokens.join(' ')
                    const result = tokenize(code)
                    return result.tokens.length > 0 && result.errors.length === 0
                }
            ),
            { numRuns: 30 }
        )
    })
})
