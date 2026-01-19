/**
 * Verilog Validator Tests - TDD Approach
 * Write tests first, then implement the validator
 */
import { describe, it, expect } from 'vitest'
// import { VerilogValidator, validate, LintRule } from '../validator'

describe('VerilogValidator', () => {
    describe('Undriven Signal Detection', () => {
        it.todo('should detect signal declared but never assigned')
        it.todo('should not false-positive on input ports')
        it.todo('should detect partially driven bus')
        it.todo('should report error with line number')
    })

    describe('Unread Signal Detection', () => {
        it.todo('should detect signal assigned but never read')
        it.todo('should not false-positive on output ports')
        it.todo('should report warning')
    })

    describe('Combinational Loop Detection', () => {
        it.todo('should detect simple combinational loop')
        it.todo('should detect loop through multiple signals')
        it.todo('should not false-positive on sequential logic')
        it.todo('should report error with involved signals')
    })

    describe('Assignment Type Checks', () => {
        it.todo('should warn on blocking assignment in sequential block')
        it.todo('should warn on non-blocking in combinational block')
        it.todo('should allow blocking in initial blocks')
    })

    describe('Clock Domain Crossing', () => {
        it.todo('should detect signal crossing clock domains')
        it.todo('should allow properly synchronized signals')
        it.todo('should report warning with clock names')
    })

    describe('Reset Verification', () => {
        it.todo('should detect missing reset for sequential logic')
        it.todo('should detect uninitialized state in reset')
        it.todo('should allow async or sync reset')
    })

    describe('Naming Convention', () => {
        it.todo('should enforce snake_case for signals')
        it.todo('should enforce UPPER_CASE for parameters')
        it.todo('should allow configurable conventions')
        it.todo('should report info-level messages')
    })

    describe('Severity Levels', () => {
        it.todo('should categorize issues as error/warning/info')
        it.todo('should allow filtering by severity')
        it.todo('should return sorted issues')
    })
})

describe('Integration with iverilog', () => {
    it.todo('should call iverilog for syntax check')
    it.todo('should parse iverilog output')
    it.todo('should combine with lint results')
    it.todo('should handle iverilog not installed')
})
