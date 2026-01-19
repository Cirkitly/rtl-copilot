/**
 * Error Formatter and Iverilog Integration Tests
 */
import { describe, it, expect, vi } from 'vitest'
import {
    ErrorFormatter,
    formatErrors,
    createPointer,
    getSourceLine,
    ErrorCodes,
} from '../errors'
import { IverilogChecker, isIverilogAvailable } from '../iverilog'

describe('ErrorFormatter', () => {
    describe('format', () => {
        it('should format error with source location', () => {
            const source = `module test;
  assign out = ;
endmodule`
            const formatter = new ErrorFormatter(source, 'test.v')

            const error = formatter.format({
                message: 'Unexpected token',
                severity: 'error',
                line: 2,
                column: 16,
            })

            expect(error.code).toBeDefined()
            expect(error.severity).toBe('error')
            expect(error.message).toBe('Unexpected token')
            expect(error.location?.line).toBe(2)
            expect(error.location?.column).toBe(16)
            expect(error.source).toBe('  assign out = ;')
            expect(error.pointer).toBe('               ^')
        })

        it('should format error without source when line is missing', () => {
            const formatter = new ErrorFormatter()

            const error = formatter.format({
                message: 'General error',
                severity: 'warning',
            })

            expect(error.message).toBe('General error')
            expect(error.source).toBeUndefined()
        })

        it('should include context lines', () => {
            const source = `line1
line2
line3
line4
line5`
            const formatter = new ErrorFormatter(source)

            const error = formatter.format({
                message: 'Error on line 3',
                severity: 'error',
                line: 3,
                column: 1,
            })

            expect(error.context).toBeDefined()
            expect(error.context?.length).toBeGreaterThan(0)
        })

        it('should include suggestion', () => {
            const formatter = new ErrorFormatter('test code')

            const error = formatter.format({
                message: 'Blocking in sequential',
                severity: 'warning',
                suggestion: 'Use non-blocking (<=) instead',
            })

            expect(error.suggestion).toBe('Use non-blocking (<=) instead')
        })
    })

    describe('formatReport', () => {
        it('should separate errors and warnings', () => {
            const source = 'module test; endmodule'
            const formatter = new ErrorFormatter(source)

            const report = formatter.formatReport([
                { message: 'Error 1', severity: 'error', line: 1 },
                { message: 'Warning 1', severity: 'warning', line: 1 },
                { message: 'Error 2', severity: 'error', line: 1 },
            ])

            expect(report.totalErrors).toBe(2)
            expect(report.totalWarnings).toBe(1)
            expect(report.errors.length).toBe(2)
            expect(report.warnings.length).toBe(1)
        })

        it('should create summary', () => {
            const formatter = new ErrorFormatter()

            const report = formatter.formatReport([
                { message: 'Error', severity: 'error' },
            ])

            expect(report.summary).toContain('1 error')
        })

        it('should report success with no errors', () => {
            const formatter = new ErrorFormatter()

            const report = formatter.formatReport([])

            expect(report.summary).toContain('No errors')
        })
    })

    describe('formatAsString', () => {
        it('should format error as readable string', () => {
            const source = 'wire undriven;'
            const formatter = new ErrorFormatter(source, 'test.v')

            const error = formatter.format({
                message: 'Signal undriven is never assigned',
                severity: 'error',
                line: 1,
                column: 6,
            })

            const str = formatter.formatAsString(error)

            expect(str).toContain('test.v:1:6')
            expect(str).toContain('error')
            expect(str).toContain('Signal undriven')
        })
    })
})

describe('Error Utilities', () => {
    describe('createPointer', () => {
        it('should create pointer at column', () => {
            expect(createPointer(5)).toBe('    ^')
            expect(createPointer(1)).toBe('^')
            expect(createPointer(10, 3)).toBe('         ^^^')
        })
    })

    describe('getSourceLine', () => {
        it('should get line from source', () => {
            const source = `line1
line2
line3`
            expect(getSourceLine(source, 2)).toBe('line2')
            expect(getSourceLine(source, 1)).toBe('line1')
            expect(getSourceLine(source, 3)).toBe('line3')
        })

        it('should return undefined for invalid line', () => {
            expect(getSourceLine('test', 0)).toBeUndefined()
            expect(getSourceLine('test', 5)).toBeUndefined()
        })
    })

    describe('ErrorCodes', () => {
        it('should have defined error codes', () => {
            expect(ErrorCodes.SYNTAX_ERROR).toBe('E001')
            expect(ErrorCodes.UNDRIVEN_SIGNAL).toBe('E101')
            expect(ErrorCodes.BLOCKING_IN_SEQUENTIAL).toBe('W001')
        })
    })

    describe('formatErrors', () => {
        it('should create formatted report', () => {
            const report = formatErrors(
                'module test; endmodule',
                [{ message: 'Test error', severity: 'error', line: 1 }],
                'test.v'
            )

            expect(report.file).toBe('test.v')
            expect(report.totalErrors).toBe(1)
        })
    })
})

describe('IverilogChecker', () => {
    describe('isAvailable', () => {
        it('should check if iverilog is available', async () => {
            const checker = new IverilogChecker()
            const available = await checker.isAvailable()
            // Result depends on system - just check it returns boolean
            expect(typeof available).toBe('boolean')
        })
    })

    describe('validate', () => {
        it('should return unavailable result if iverilog not installed', async () => {
            const checker = new IverilogChecker()
            const available = await checker.isAvailable()

            if (!available) {
                const result = await checker.validate('module test; endmodule')
                expect(result.available).toBe(false)
                expect(result.output).toContain('not installed')
            }
        })

        // These tests only run if iverilog is available
        it('should validate correct Verilog syntax', async () => {
            const checker = new IverilogChecker()
            if (!(await checker.isAvailable())) {
                return // Skip if iverilog not installed
            }

            const result = await checker.validate(`
        module test(input clk, output reg q);
          always @(posedge clk)
            q <= 1'b0;
        endmodule
      `)

            expect(result.available).toBe(true)
            expect(result.errors.length).toBe(0)
        })

        it('should detect syntax errors', async () => {
            const checker = new IverilogChecker()
            if (!(await checker.isAvailable())) {
                return // Skip if iverilog not installed
            }

            const result = await checker.validate(`
        module test(input clk
          wire broken syntax here
        endmodule
      `)

            expect(result.success).toBe(false)
            expect(result.errors.length).toBeGreaterThan(0)
        })
    })

    describe('validateWithFormatting', () => {
        it('should return formatted errors', async () => {
            const checker = new IverilogChecker()
            if (!(await checker.isAvailable())) {
                return
            }

            const source = `module test; wire = endmodule`
            const { result, formatted } = await checker.validateWithFormatting(source)

            if (!result.success) {
                expect(formatted.length).toBeGreaterThan(0)
                expect(formatted[0].severity).toBeDefined()
            }
        })
    })
})

describe('isIverilogAvailable', () => {
    it('should be a function that returns boolean promise', async () => {
        const result = await isIverilogAvailable()
        expect(typeof result).toBe('boolean')
    })
})
