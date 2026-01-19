/**
 * Verilog Lexer Tests - TDD Approach
 * Write tests first, then implement the lexer
 */
import { describe, it } from 'vitest'
// import { VerilogLexer, tokenize } from '../lexer'

describe('VerilogLexer', () => {
    describe('Keywords', () => {
        it.todo('should tokenize module keyword')
        it.todo('should tokenize endmodule keyword')
        it.todo('should tokenize input keyword')
        it.todo('should tokenize output keyword')
        it.todo('should tokenize wire keyword')
        it.todo('should tokenize reg keyword')
        it.todo('should tokenize always keyword')
        it.todo('should tokenize assign keyword')
        it.todo('should tokenize begin/end keywords')
        it.todo('should tokenize if/else keywords')
        it.todo('should tokenize case/endcase keywords')
        it.todo('should tokenize posedge/negedge keywords')
    })

    describe('Identifiers', () => {
        it.todo('should tokenize simple identifiers')
        it.todo('should tokenize identifiers starting with underscore')
        it.todo('should tokenize identifiers with digits')
        it.todo('should distinguish identifiers from keywords')
    })

    describe('Numbers', () => {
        it.todo('should tokenize decimal numbers')
        it.todo('should tokenize binary numbers (e.g., 4\'b1010)')
        it.todo('should tokenize hex numbers (e.g., 8\'hFF)')
        it.todo('should tokenize sized numbers (e.g., 32\'d100)')
        it.todo('should handle underscore in numbers')
    })

    describe('Operators', () => {
        it.todo('should tokenize assignment operators (=, <=)')
        it.todo('should tokenize arithmetic operators (+, -, *, /, %)')
        it.todo('should tokenize bitwise operators (&, |, ^, ~)')
        it.todo('should tokenize logical operators (&&, ||, !)')
        it.todo('should tokenize comparison operators (==, !=, <, >, <=, >=)')
        it.todo('should tokenize shift operators (<<, >>)')
        it.todo('should tokenize ternary operator (?:)')
    })

    describe('Delimiters', () => {
        it.todo('should tokenize parentheses')
        it.todo('should tokenize brackets []')
        it.todo('should tokenize braces {}')
        it.todo('should tokenize semicolon')
        it.todo('should tokenize comma')
        it.todo('should tokenize colon')
        it.todo('should tokenize at symbol @')
    })

    describe('Comments', () => {
        it.todo('should tokenize single-line comments //')
        it.todo('should tokenize multi-line comments /* */')
        it.todo('should preserve comment content')
    })

    describe('Whitespace', () => {
        it.todo('should handle spaces')
        it.todo('should handle tabs')
        it.todo('should handle newlines')
        it.todo('should track line numbers')
        it.todo('should track column numbers')
    })

    describe('Edge Cases', () => {
        it.todo('should handle empty input')
        it.todo('should report errors for invalid tokens')
        it.todo('should handle unterminated strings')
        it.todo('should handle nested comments correctly')
    })
})

describe('Integration: Complete Verilog Snippets', () => {
    it.todo('should tokenize simple module declaration')
    it.todo('should tokenize always block')
    it.todo('should tokenize assign statement')
    it.todo('should tokenize port declarations')
    it.todo('should tokenize case statement')
})
