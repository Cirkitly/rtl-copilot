/**
 * Verilog Lexer
 * Built with Chevrotain for tokenizing Verilog source code
 */
import { createToken, Lexer, IToken } from 'chevrotain'

// ============================================================================
// Whitespace & Comments (skipped but tracked)
// ============================================================================
export const WhiteSpace = createToken({
    name: 'WhiteSpace',
    pattern: /\s+/,
    group: Lexer.SKIPPED,
})

export const SingleLineComment = createToken({
    name: 'SingleLineComment',
    pattern: /\/\/[^\n\r]*/,
    group: 'comments',
})

export const MultiLineComment = createToken({
    name: 'MultiLineComment',
    pattern: /\/\*[\s\S]*?\*\//,
    group: 'comments',
})

// ============================================================================
// Identifier - Define first, keywords will use it for categories
// ============================================================================
export const Identifier = createToken({
    name: 'Identifier',
    pattern: /[a-zA-Z_][a-zA-Z0-9_$]*/,
})

// ============================================================================
// Keywords - Using categories to handle keyword vs identifier conflict
// Order: longer keywords BEFORE shorter ones with same prefix
// ============================================================================
export const Endmodule = createToken({ name: 'Endmodule', pattern: /endmodule/, longer_alt: Identifier })
export const Module = createToken({ name: 'Module', pattern: /module/, longer_alt: Identifier })
export const Input = createToken({ name: 'Input', pattern: /input/, longer_alt: Identifier })
export const Output = createToken({ name: 'Output', pattern: /output/, longer_alt: Identifier })
export const Inout = createToken({ name: 'Inout', pattern: /inout/, longer_alt: Identifier })
export const Wire = createToken({ name: 'Wire', pattern: /wire/, longer_alt: Identifier })
export const Reg = createToken({ name: 'Reg', pattern: /reg/, longer_alt: Identifier })
export const Integer = createToken({ name: 'Integer', pattern: /integer/, longer_alt: Identifier })
export const Parameter = createToken({ name: 'Parameter', pattern: /parameter/, longer_alt: Identifier })
export const Localparam = createToken({ name: 'Localparam', pattern: /localparam/, longer_alt: Identifier })
export const Always = createToken({ name: 'Always', pattern: /always/, longer_alt: Identifier })
export const Initial = createToken({ name: 'Initial', pattern: /initial/, longer_alt: Identifier })
export const Assign = createToken({ name: 'Assign', pattern: /assign/, longer_alt: Identifier })
export const Begin = createToken({ name: 'Begin', pattern: /begin/, longer_alt: Identifier })
// end* keywords - order by length (longest first)
export const Endcase = createToken({ name: 'Endcase', pattern: /endcase/, longer_alt: Identifier })
export const End = createToken({ name: 'End', pattern: /end/, longer_alt: Identifier })
export const If = createToken({ name: 'If', pattern: /if/, longer_alt: Identifier })
export const Else = createToken({ name: 'Else', pattern: /else/, longer_alt: Identifier })
// case* keywords - order by length (longest first) 
export const Casex = createToken({ name: 'Casex', pattern: /casex/, longer_alt: Identifier })
export const Casez = createToken({ name: 'Casez', pattern: /casez/, longer_alt: Identifier })
export const Case = createToken({ name: 'Case', pattern: /case/, longer_alt: Identifier })
export const Default = createToken({ name: 'Default', pattern: /default/, longer_alt: Identifier })
export const Posedge = createToken({ name: 'Posedge', pattern: /posedge/, longer_alt: Identifier })
export const Negedge = createToken({ name: 'Negedge', pattern: /negedge/, longer_alt: Identifier })
export const Or = createToken({ name: 'Or', pattern: /or/, longer_alt: Identifier })
export const And = createToken({ name: 'And', pattern: /and/, longer_alt: Identifier })

// ============================================================================
// Literals
// ============================================================================
// Sized numbers like 8'hFF, 4'b1010, 32'd100
export const SizedNumber = createToken({
    name: 'SizedNumber',
    pattern: /[0-9]+\'[bBoOdDhH][0-9a-fA-FxXzZ_]+/,
})

// Unsized numbers
export const Number = createToken({
    name: 'Number',
    pattern: /[0-9][0-9_]*/,
})

// String literals
export const StringLiteral = createToken({
    name: 'StringLiteral',
    pattern: /"[^"]*"/,
})

// ============================================================================
// Operators
// ============================================================================
// Multi-character operators first (longest match)
export const CaseEqual = createToken({ name: 'CaseEqual', pattern: /===/ })
export const CaseNotEqual = createToken({ name: 'CaseNotEqual', pattern: /!==/ })
export const ArithShiftRight = createToken({ name: 'ArithShiftRight', pattern: />>>/ })
export const NonBlockingAssign = createToken({ name: 'NonBlockingAssign', pattern: /<=/ })
export const LogicalAnd = createToken({ name: 'LogicalAnd', pattern: /&&/ })
export const LogicalOr = createToken({ name: 'LogicalOr', pattern: /\|\|/ })
export const Equal = createToken({ name: 'Equal', pattern: /==/ })
export const NotEqual = createToken({ name: 'NotEqual', pattern: /!=/ })
export const GreaterEqual = createToken({ name: 'GreaterEqual', pattern: />=/ })
export const ShiftLeft = createToken({ name: 'ShiftLeft', pattern: /<</ })
export const ShiftRight = createToken({ name: 'ShiftRight', pattern: />>/ })
export const Power = createToken({ name: 'Power', pattern: /\*\*/ })

// Single-character operators
export const Assign_Op = createToken({ name: 'Assign_Op', pattern: /=/ })
export const Plus = createToken({ name: 'Plus', pattern: /\+/ })
export const Minus = createToken({ name: 'Minus', pattern: /-/ })
export const Star = createToken({ name: 'Star', pattern: /\*/ })
export const Slash = createToken({ name: 'Slash', pattern: /\// })
export const Percent = createToken({ name: 'Percent', pattern: /%/ })
export const Ampersand = createToken({ name: 'Ampersand', pattern: /&/ })
export const Pipe = createToken({ name: 'Pipe', pattern: /\|/ })
export const Caret = createToken({ name: 'Caret', pattern: /\^/ })
export const Tilde = createToken({ name: 'Tilde', pattern: /~/ })
export const Bang = createToken({ name: 'Bang', pattern: /!/ })
export const Question = createToken({ name: 'Question', pattern: /\?/ })
export const LessThan = createToken({ name: 'LessThan', pattern: /</ })
export const GreaterThan = createToken({ name: 'GreaterThan', pattern: />/ })

// ============================================================================
// Delimiters
// ============================================================================
export const LParen = createToken({ name: 'LParen', pattern: /\(/ })
export const RParen = createToken({ name: 'RParen', pattern: /\)/ })
export const LBracket = createToken({ name: 'LBracket', pattern: /\[/ })
export const RBracket = createToken({ name: 'RBracket', pattern: /\]/ })
export const LBrace = createToken({ name: 'LBrace', pattern: /\{/ })
export const RBrace = createToken({ name: 'RBrace', pattern: /\}/ })
export const Semicolon = createToken({ name: 'Semicolon', pattern: /;/ })
export const Colon = createToken({ name: 'Colon', pattern: /:/ })
export const Comma = createToken({ name: 'Comma', pattern: /,/ })
export const Dot = createToken({ name: 'Dot', pattern: /\./ })
export const At = createToken({ name: 'At', pattern: /@/ })
export const Hash = createToken({ name: 'Hash', pattern: /#/ })

// ============================================================================
// Token Groups - Order matters! More specific patterns first
// Keywords must come before Identifier
// ============================================================================
export const allTokens = [
    // Whitespace and comments
    WhiteSpace,
    SingleLineComment,
    MultiLineComment,

    // Keywords (longer first within prefix groups, before Identifier)
    Endmodule,  // before 'end'
    Endcase,    // before 'end'
    Module,
    Input,
    Output,
    Inout,
    Wire,
    Reg,
    Integer,
    Parameter,
    Localparam,
    Always,
    Initial,
    Assign,
    Begin,
    End,        // after 'endmodule', 'endcase'
    If,
    Else,
    Casex,      // before 'case'
    Casez,      // before 'case'
    Case,       // after 'casex', 'casez'
    Default,
    Posedge,
    Negedge,
    Or,
    And,

    // Literals (before Identifier for numbers)
    SizedNumber,
    Number,
    StringLiteral,

    // Identifier (after keywords)
    Identifier,

    // Multi-char operators (before single-char)
    CaseEqual,
    CaseNotEqual,
    ArithShiftRight,
    NonBlockingAssign,
    LogicalAnd,
    LogicalOr,
    Equal,
    NotEqual,
    GreaterEqual,
    ShiftLeft,
    ShiftRight,
    Power,

    // Single-char operators
    Assign_Op,
    Plus,
    Minus,
    Star,
    Slash,
    Percent,
    Ampersand,
    Pipe,
    Caret,
    Tilde,
    Bang,
    Question,
    LessThan,
    GreaterThan,

    // Delimiters
    LParen,
    RParen,
    LBracket,
    RBracket,
    LBrace,
    RBrace,
    Semicolon,
    Colon,
    Comma,
    Dot,
    At,
    Hash,
]

// Create the lexer instance
export const VerilogLexer = new Lexer(allTokens)

// ============================================================================
// Tokenize Function
// ============================================================================
export interface TokenizeResult {
    tokens: IToken[]
    comments: IToken[]
    errors: {
        message: string
        line: number
        column: number
        length: number
    }[]
}

export function tokenize(input: string): TokenizeResult {
    const lexResult = VerilogLexer.tokenize(input)

    return {
        tokens: lexResult.tokens,
        comments: lexResult.groups.comments || [],
        errors: lexResult.errors.map(error => ({
            message: error.message,
            line: error.line || 0,
            column: error.column || 0,
            length: error.length || 1,
        })),
    }
}

// Export token type names for testing
export const TokenTypes = {
    // Keywords
    Module, Endmodule, Input, Output, Inout, Wire, Reg, Integer,
    Parameter, Localparam, Always, Initial, Assign, Begin, End,
    If, Else, Case, Casex, Casez, Endcase, Default, Posedge, Negedge, Or, And,

    // Literals
    SizedNumber, Number, StringLiteral,

    // Identifier
    Identifier,

    // Operators
    NonBlockingAssign, LogicalAnd, LogicalOr, Equal, NotEqual,
    CaseEqual, CaseNotEqual, GreaterEqual, ShiftLeft, ShiftRight,
    ArithShiftRight, Power, Assign_Op, Plus, Minus, Star, Slash,
    Percent, Ampersand, Pipe, Caret, Tilde, Bang, Question, LessThan, GreaterThan,

    // Delimiters
    LParen, RParen, LBracket, RBracket, LBrace, RBrace,
    Semicolon, Colon, Comma, Dot, At, Hash,

    // Comments
    SingleLineComment, MultiLineComment,
}
