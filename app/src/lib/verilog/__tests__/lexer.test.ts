/**
 * Verilog Lexer Tests - TDD Approach
 */
import { describe, it, expect } from 'vitest'
import { tokenize, TokenTypes } from '../lexer'

describe('VerilogLexer', () => {
    describe('Keywords', () => {
        it('should tokenize module keyword', () => {
            const result = tokenize('module')
            expect(result.errors).toHaveLength(0)
            expect(result.tokens).toHaveLength(1)
            expect(result.tokens[0].tokenType).toBe(TokenTypes.Module)
        })

        it('should tokenize endmodule keyword', () => {
            const result = tokenize('endmodule')
            expect(result.errors).toHaveLength(0)
            expect(result.tokens[0].tokenType).toBe(TokenTypes.Endmodule)
        })

        it('should tokenize input keyword', () => {
            const result = tokenize('input')
            expect(result.tokens[0].tokenType).toBe(TokenTypes.Input)
        })

        it('should tokenize output keyword', () => {
            const result = tokenize('output')
            expect(result.tokens[0].tokenType).toBe(TokenTypes.Output)
        })

        it('should tokenize wire keyword', () => {
            const result = tokenize('wire')
            expect(result.tokens[0].tokenType).toBe(TokenTypes.Wire)
        })

        it('should tokenize reg keyword', () => {
            const result = tokenize('reg')
            expect(result.tokens[0].tokenType).toBe(TokenTypes.Reg)
        })

        it('should tokenize always keyword', () => {
            const result = tokenize('always')
            expect(result.tokens[0].tokenType).toBe(TokenTypes.Always)
        })

        it('should tokenize assign keyword', () => {
            const result = tokenize('assign')
            expect(result.tokens[0].tokenType).toBe(TokenTypes.Assign)
        })

        it('should tokenize begin/end keywords', () => {
            const result = tokenize('begin end')
            expect(result.tokens[0].tokenType).toBe(TokenTypes.Begin)
            expect(result.tokens[1].tokenType).toBe(TokenTypes.End)
        })

        it('should tokenize if/else keywords', () => {
            const result = tokenize('if else')
            expect(result.tokens[0].tokenType).toBe(TokenTypes.If)
            expect(result.tokens[1].tokenType).toBe(TokenTypes.Else)
        })

        it('should tokenize case/endcase keywords', () => {
            const result = tokenize('case casex casez endcase')
            expect(result.tokens[0].tokenType).toBe(TokenTypes.Case)
            expect(result.tokens[1].tokenType).toBe(TokenTypes.Casex)
            expect(result.tokens[2].tokenType).toBe(TokenTypes.Casez)
            expect(result.tokens[3].tokenType).toBe(TokenTypes.Endcase)
        })

        it('should tokenize posedge/negedge keywords', () => {
            const result = tokenize('posedge negedge')
            expect(result.tokens[0].tokenType).toBe(TokenTypes.Posedge)
            expect(result.tokens[1].tokenType).toBe(TokenTypes.Negedge)
        })
    })

    describe('Identifiers', () => {
        it('should tokenize simple identifiers', () => {
            const result = tokenize('clk')
            expect(result.tokens[0].tokenType).toBe(TokenTypes.Identifier)
            expect(result.tokens[0].image).toBe('clk')
        })

        it('should tokenize identifiers starting with underscore', () => {
            const result = tokenize('_reset')
            expect(result.tokens[0].tokenType).toBe(TokenTypes.Identifier)
            expect(result.tokens[0].image).toBe('_reset')
        })

        it('should tokenize identifiers with digits', () => {
            const result = tokenize('data_in0')
            expect(result.tokens[0].tokenType).toBe(TokenTypes.Identifier)
            expect(result.tokens[0].image).toBe('data_in0')
        })

        it('should distinguish identifiers from keywords', () => {
            const result = tokenize('module_name')
            expect(result.tokens[0].tokenType).toBe(TokenTypes.Identifier)
            expect(result.tokens[0].image).toBe('module_name')
        })
    })

    describe('Numbers', () => {
        it('should tokenize decimal numbers', () => {
            const result = tokenize('42')
            expect(result.tokens[0].tokenType).toBe(TokenTypes.Number)
            expect(result.tokens[0].image).toBe('42')
        })

        it('should tokenize binary numbers (e.g., 4\'b1010)', () => {
            const result = tokenize("4'b1010")
            expect(result.tokens[0].tokenType).toBe(TokenTypes.SizedNumber)
            expect(result.tokens[0].image).toBe("4'b1010")
        })

        it('should tokenize hex numbers (e.g., 8\'hFF)', () => {
            const result = tokenize("8'hFF")
            expect(result.tokens[0].tokenType).toBe(TokenTypes.SizedNumber)
            expect(result.tokens[0].image).toBe("8'hFF")
        })

        it('should tokenize sized numbers (e.g., 32\'d100)', () => {
            const result = tokenize("32'd100")
            expect(result.tokens[0].tokenType).toBe(TokenTypes.SizedNumber)
            expect(result.tokens[0].image).toBe("32'd100")
        })

        it('should handle underscore in numbers', () => {
            const result = tokenize('1_000_000')
            expect(result.tokens[0].tokenType).toBe(TokenTypes.Number)
            expect(result.tokens[0].image).toBe('1_000_000')
        })
    })

    describe('Operators', () => {
        it('should tokenize assignment operators (=, <=)', () => {
            const result = tokenize('= <=')
            expect(result.tokens[0].tokenType).toBe(TokenTypes.Assign_Op)
            expect(result.tokens[1].tokenType).toBe(TokenTypes.NonBlockingAssign)
        })

        it('should tokenize arithmetic operators (+, -, *, /, %)', () => {
            const result = tokenize('+ - * / %')
            expect(result.tokens[0].tokenType).toBe(TokenTypes.Plus)
            expect(result.tokens[1].tokenType).toBe(TokenTypes.Minus)
            expect(result.tokens[2].tokenType).toBe(TokenTypes.Star)
            expect(result.tokens[3].tokenType).toBe(TokenTypes.Slash)
            expect(result.tokens[4].tokenType).toBe(TokenTypes.Percent)
        })

        it('should tokenize bitwise operators (&, |, ^, ~)', () => {
            const result = tokenize('& | ^ ~')
            expect(result.tokens[0].tokenType).toBe(TokenTypes.Ampersand)
            expect(result.tokens[1].tokenType).toBe(TokenTypes.Pipe)
            expect(result.tokens[2].tokenType).toBe(TokenTypes.Caret)
            expect(result.tokens[3].tokenType).toBe(TokenTypes.Tilde)
        })

        it('should tokenize logical operators (&&, ||, !)', () => {
            const result = tokenize('&& || !')
            expect(result.tokens[0].tokenType).toBe(TokenTypes.LogicalAnd)
            expect(result.tokens[1].tokenType).toBe(TokenTypes.LogicalOr)
            expect(result.tokens[2].tokenType).toBe(TokenTypes.Bang)
        })

        it('should tokenize comparison operators (==, !=, <, >, <=, >=)', () => {
            const result = tokenize('== != < >')
            expect(result.tokens[0].tokenType).toBe(TokenTypes.Equal)
            expect(result.tokens[1].tokenType).toBe(TokenTypes.NotEqual)
            expect(result.tokens[2].tokenType).toBe(TokenTypes.LessThan)
            expect(result.tokens[3].tokenType).toBe(TokenTypes.GreaterThan)
        })

        it('should tokenize shift operators (<<, >>)', () => {
            const result = tokenize('<< >>')
            expect(result.tokens[0].tokenType).toBe(TokenTypes.ShiftLeft)
            expect(result.tokens[1].tokenType).toBe(TokenTypes.ShiftRight)
        })

        it('should tokenize ternary operator (?:)', () => {
            const result = tokenize('? :')
            expect(result.tokens[0].tokenType).toBe(TokenTypes.Question)
            expect(result.tokens[1].tokenType).toBe(TokenTypes.Colon)
        })
    })

    describe('Delimiters', () => {
        it('should tokenize parentheses', () => {
            const result = tokenize('()')
            expect(result.tokens[0].tokenType).toBe(TokenTypes.LParen)
            expect(result.tokens[1].tokenType).toBe(TokenTypes.RParen)
        })

        it('should tokenize brackets []', () => {
            const result = tokenize('[]')
            expect(result.tokens[0].tokenType).toBe(TokenTypes.LBracket)
            expect(result.tokens[1].tokenType).toBe(TokenTypes.RBracket)
        })

        it('should tokenize braces {}', () => {
            const result = tokenize('{}')
            expect(result.tokens[0].tokenType).toBe(TokenTypes.LBrace)
            expect(result.tokens[1].tokenType).toBe(TokenTypes.RBrace)
        })

        it('should tokenize semicolon', () => {
            const result = tokenize(';')
            expect(result.tokens[0].tokenType).toBe(TokenTypes.Semicolon)
        })

        it('should tokenize comma', () => {
            const result = tokenize(',')
            expect(result.tokens[0].tokenType).toBe(TokenTypes.Comma)
        })

        it('should tokenize colon', () => {
            const result = tokenize(':')
            expect(result.tokens[0].tokenType).toBe(TokenTypes.Colon)
        })

        it('should tokenize at symbol @', () => {
            const result = tokenize('@')
            expect(result.tokens[0].tokenType).toBe(TokenTypes.At)
        })
    })

    describe('Comments', () => {
        it('should tokenize single-line comments //', () => {
            const result = tokenize('// this is a comment')
            expect(result.comments).toHaveLength(1)
            expect(result.comments[0].image).toContain('// this is a comment')
        })

        it('should tokenize multi-line comments /* */', () => {
            const result = tokenize('/* multi\nline\ncomment */')
            expect(result.comments).toHaveLength(1)
            expect(result.comments[0].image).toContain('multi')
        })

        it('should preserve comment content', () => {
            const result = tokenize('// TODO: fix this')
            expect(result.comments[0].image).toBe('// TODO: fix this')
        })
    })

    describe('Whitespace', () => {
        it('should handle spaces', () => {
            const result = tokenize('a   b')
            expect(result.tokens).toHaveLength(2)
        })

        it('should handle tabs', () => {
            const result = tokenize('a\t\tb')
            expect(result.tokens).toHaveLength(2)
        })

        it('should handle newlines', () => {
            const result = tokenize('a\n\nb')
            expect(result.tokens).toHaveLength(2)
        })

        it('should track line numbers', () => {
            const result = tokenize('a\nb\nc')
            expect(result.tokens[0].startLine).toBe(1)
            expect(result.tokens[1].startLine).toBe(2)
            expect(result.tokens[2].startLine).toBe(3)
        })

        it('should track column numbers', () => {
            const result = tokenize('abc def')
            expect(result.tokens[0].startColumn).toBe(1)
            expect(result.tokens[1].startColumn).toBe(5)
        })
    })

    describe('Edge Cases', () => {
        it('should handle empty input', () => {
            const result = tokenize('')
            expect(result.tokens).toHaveLength(0)
            expect(result.errors).toHaveLength(0)
        })

        it('should report errors for invalid tokens', () => {
            const result = tokenize('`invalid')
            expect(result.errors.length).toBeGreaterThan(0)
        })
    })
})

describe('Integration: Complete Verilog Snippets', () => {
    it('should tokenize simple module declaration', () => {
        const code = `module counter(input clk, output reg [7:0] count);`
        const result = tokenize(code)
        expect(result.errors).toHaveLength(0)
        expect(result.tokens.some(t => t.tokenType === TokenTypes.Module)).toBe(true)
        expect(result.tokens.some(t => t.tokenType === TokenTypes.Input)).toBe(true)
        expect(result.tokens.some(t => t.tokenType === TokenTypes.Output)).toBe(true)
    })

    it('should tokenize always block', () => {
        const code = `always @(posedge clk) begin
      count <= count + 1;
    end`
        const result = tokenize(code)
        expect(result.errors).toHaveLength(0)
        expect(result.tokens.some(t => t.tokenType === TokenTypes.Always)).toBe(true)
        expect(result.tokens.some(t => t.tokenType === TokenTypes.Posedge)).toBe(true)
        expect(result.tokens.some(t => t.tokenType === TokenTypes.Begin)).toBe(true)
        expect(result.tokens.some(t => t.tokenType === TokenTypes.End)).toBe(true)
    })

    it('should tokenize assign statement', () => {
        const code = `assign out = a & b;`
        const result = tokenize(code)
        expect(result.errors).toHaveLength(0)
        expect(result.tokens[0].tokenType).toBe(TokenTypes.Assign)
    })

    it('should tokenize port declarations', () => {
        const code = `input wire [31:0] data_in, output reg [31:0] data_out`
        const result = tokenize(code)
        expect(result.errors).toHaveLength(0)
        // [31:0] is parsed as bracket, number, colon, number, bracket - not sized numbers
        expect(result.tokens.filter(t => t.tokenType === TokenTypes.LBracket).length).toBe(2)
        expect(result.tokens.filter(t => t.tokenType === TokenTypes.Colon).length).toBe(2)
    })

    it('should tokenize case statement', () => {
        const code = `case(state)
      2'b00: next_state = IDLE;
      2'b01: next_state = RUN;
      default: next_state = IDLE;
    endcase`
        const result = tokenize(code)
        expect(result.errors).toHaveLength(0)
        expect(result.tokens.some(t => t.tokenType === TokenTypes.Case)).toBe(true)
        expect(result.tokens.some(t => t.tokenType === TokenTypes.Default)).toBe(true)
        expect(result.tokens.some(t => t.tokenType === TokenTypes.Endcase)).toBe(true)
    })
})
