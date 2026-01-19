/**
 * Verilog Parser
 * Built with Chevrotain for parsing Verilog source code into an AST
 */
import { CstParser, IToken } from 'chevrotain'
import {
    allTokens,
    Module, Endmodule, Input, Output, Inout, Wire, Reg, Integer,
    Parameter, Localparam, Always, Initial, Assign, Begin, End,
    If, Else, Case, Casex, Casez, Endcase, Default, Posedge, Negedge, Or,
    SizedNumber, Number, Identifier, StringLiteral,
    NonBlockingAssign, LogicalAnd, LogicalOr, Equal, NotEqual,
    GreaterEqual, ShiftLeft, ShiftRight, Power,
    Assign_Op, Plus, Minus, Star, Slash, Percent,
    Ampersand, Pipe, Caret, Tilde, Bang, Question,
    LessThan, GreaterThan,
    LParen, RParen, LBracket, RBracket, LBrace, RBrace,
    Semicolon, Colon, Comma, At, Hash,
    tokenize,
} from './lexer'
import type {
    VerilogModule, PortDeclaration, Declaration,
    AlwaysBlock, AssignStatement, Expression,
    IdentifierExpr, NumberExpr, BinaryExpr,
    WireDeclaration, RegDeclaration, ParameterDeclaration,
    LocalparamDeclaration, Range, Statement,
    BlockingAssignment, NonBlockingAssignment,
    IfStatement, CaseStatement, CaseItem, BeginEnd,
    SensitivityItem,
} from './types'

// ============================================================================
// CST Parser
// ============================================================================
class VerilogCstParser extends CstParser {
    constructor() {
        super(allTokens)
        this.performSelfAnalysis()
    }

    // Module declaration
    public module = this.RULE('module', () => {
        this.CONSUME(Module)
        this.CONSUME(Identifier, { LABEL: 'moduleName' })
        this.OPTION(() => {
            this.SUBRULE(this.portList)
        })
        this.CONSUME(Semicolon)
        this.MANY(() => {
            this.SUBRULE(this.moduleItem)
        })
        this.CONSUME(Endmodule)
    })

    // Port list: (port1, port2, ...)
    private portList = this.RULE('portList', () => {
        this.CONSUME(LParen)
        this.MANY_SEP({
            SEP: Comma,
            DEF: () => {
                this.SUBRULE(this.portDeclaration)
            },
        })
        this.CONSUME(RParen)
    })

    // Port declaration: input/output/inout [wire/reg] [width] identifier
    private portDeclaration = this.RULE('portDeclaration', () => {
        this.OR([
            { ALT: () => this.CONSUME(Input, { LABEL: 'direction' }) },
            { ALT: () => this.CONSUME(Output, { LABEL: 'direction' }) },
            { ALT: () => this.CONSUME(Inout, { LABEL: 'direction' }) },
        ])
        this.OPTION(() => {
            this.OR2([
                { ALT: () => this.CONSUME(Wire, { LABEL: 'portType' }) },
                { ALT: () => this.CONSUME(Reg, { LABEL: 'portType' }) },
            ])
        })
        this.OPTION2(() => {
            this.SUBRULE(this.range, { LABEL: 'width' })
        })
        this.CONSUME(Identifier, { LABEL: 'portName' })
    })

    // Range: [msb:lsb]
    private range = this.RULE('range', () => {
        this.CONSUME(LBracket)
        this.SUBRULE(this.expression, { LABEL: 'msb' })
        this.CONSUME(Colon)
        this.SUBRULE2(this.expression, { LABEL: 'lsb' })
        this.CONSUME(RBracket)
    })

    // Module items: declarations, assigns, always blocks
    private moduleItem = this.RULE('moduleItem', () => {
        this.OR([
            { ALT: () => this.SUBRULE(this.wireDeclaration) },
            { ALT: () => this.SUBRULE(this.regDeclaration) },
            { ALT: () => this.SUBRULE(this.parameterDeclaration) },
            { ALT: () => this.SUBRULE(this.localparamDeclaration) },
            { ALT: () => this.SUBRULE(this.assignStatement) },
            { ALT: () => this.SUBRULE(this.alwaysBlock) },
            { ALT: () => this.SUBRULE(this.initialBlock) },
        ])
    })

    // Wire declaration: wire [width] name1, name2, ...;
    private wireDeclaration = this.RULE('wireDeclaration', () => {
        this.CONSUME(Wire)
        this.OPTION(() => {
            this.SUBRULE(this.range, { LABEL: 'width' })
        })
        this.AT_LEAST_ONE_SEP({
            SEP: Comma,
            DEF: () => {
                this.CONSUME(Identifier, { LABEL: 'wireName' })
            },
        })
        this.CONSUME(Semicolon)
    })

    // Reg declaration: reg [width] name1, name2, ...;
    private regDeclaration = this.RULE('regDeclaration', () => {
        this.CONSUME(Reg)
        this.OPTION(() => {
            this.SUBRULE(this.range, { LABEL: 'width' })
        })
        this.AT_LEAST_ONE_SEP({
            SEP: Comma,
            DEF: () => {
                this.CONSUME(Identifier, { LABEL: 'regName' })
            },
        })
        this.CONSUME(Semicolon)
    })

    // Parameter declaration: parameter name = value;
    private parameterDeclaration = this.RULE('parameterDeclaration', () => {
        this.CONSUME(Parameter)
        this.OPTION(() => {
            this.SUBRULE(this.range, { LABEL: 'width' })
        })
        this.CONSUME(Identifier, { LABEL: 'paramName' })
        this.CONSUME(Assign_Op)
        this.SUBRULE(this.expression, { LABEL: 'value' })
        this.CONSUME(Semicolon)
    })

    // Localparam declaration: localparam name = value;
    private localparamDeclaration = this.RULE('localparamDeclaration', () => {
        this.CONSUME(Localparam)
        this.OPTION(() => {
            this.SUBRULE(this.range, { LABEL: 'width' })
        })
        this.CONSUME(Identifier, { LABEL: 'paramName' })
        this.CONSUME(Assign_Op)
        this.SUBRULE(this.expression, { LABEL: 'value' })
        this.CONSUME(Semicolon)
    })

    // Assign statement: assign lhs = rhs;
    private assignStatement = this.RULE('assignStatement', () => {
        this.CONSUME(Assign)
        this.SUBRULE(this.expression, { LABEL: 'lhs' })
        this.CONSUME(Assign_Op)
        this.SUBRULE2(this.expression, { LABEL: 'rhs' })
        this.CONSUME(Semicolon)
    })

    // Always block: always @(...) statement
    private alwaysBlock = this.RULE('alwaysBlock', () => {
        this.CONSUME(Always)
        this.CONSUME(At)
        this.SUBRULE(this.sensitivityList)
        this.SUBRULE(this.statement)
    })

    // Initial block: initial statement
    private initialBlock = this.RULE('initialBlock', () => {
        this.CONSUME(Initial)
        this.SUBRULE(this.statement)
    })

    // Sensitivity list: @(*) or @(posedge clk or negedge rst)
    private sensitivityList = this.RULE('sensitivityList', () => {
        this.CONSUME(LParen)
        this.OR([
            {
                ALT: () => this.CONSUME(Star, { LABEL: 'combinational' })
            },
            {
                ALT: () => {
                    this.AT_LEAST_ONE_SEP({
                        SEP: Or,
                        DEF: () => {
                            this.SUBRULE(this.sensitivityItem)
                        },
                    })
                },
            },
        ])
        this.CONSUME(RParen)
    })

    // Sensitivity item: [posedge|negedge] signal
    private sensitivityItem = this.RULE('sensitivityItem', () => {
        this.OPTION(() => {
            this.OR([
                { ALT: () => this.CONSUME(Posedge, { LABEL: 'edge' }) },
                { ALT: () => this.CONSUME(Negedge, { LABEL: 'edge' }) },
            ])
        })
        this.CONSUME(Identifier, { LABEL: 'signal' })
    })

    // Statement: assignment, if, case, begin-end
    private statement = this.RULE('statement', () => {
        this.OR([
            { ALT: () => this.SUBRULE(this.beginEnd) },
            { ALT: () => this.SUBRULE(this.ifStatement) },
            { ALT: () => this.SUBRULE(this.caseStatement) },
            { ALT: () => this.SUBRULE(this.assignment) },
        ])
    })

    // Begin-end block
    private beginEnd = this.RULE('beginEnd', () => {
        this.CONSUME(Begin)
        this.MANY(() => {
            this.SUBRULE(this.statement)
        })
        this.CONSUME(End)
    })

    // If statement
    private ifStatement = this.RULE('ifStatement', () => {
        this.CONSUME(If)
        this.CONSUME(LParen)
        this.SUBRULE(this.expression, { LABEL: 'condition' })
        this.CONSUME(RParen)
        this.SUBRULE(this.statement, { LABEL: 'thenBranch' })
        this.OPTION(() => {
            this.CONSUME(Else)
            this.SUBRULE2(this.statement, { LABEL: 'elseBranch' })
        })
    })

    // Case statement
    private caseStatement = this.RULE('caseStatement', () => {
        this.OR([
            { ALT: () => this.CONSUME(Case, { LABEL: 'caseType' }) },
            { ALT: () => this.CONSUME(Casex, { LABEL: 'caseType' }) },
            { ALT: () => this.CONSUME(Casez, { LABEL: 'caseType' }) },
        ])
        this.CONSUME(LParen)
        this.SUBRULE(this.expression, { LABEL: 'selector' })
        this.CONSUME(RParen)
        this.MANY(() => {
            this.SUBRULE(this.caseItem)
        })
        this.CONSUME(Endcase)
    })

    // Case item: value: statement or default: statement
    private caseItem = this.RULE('caseItem', () => {
        this.OR([
            {
                ALT: () => {
                    this.CONSUME(Default, { LABEL: 'isDefault' })
                },
            },
            {
                ALT: () => {
                    this.AT_LEAST_ONE_SEP({
                        SEP: Comma,
                        DEF: () => {
                            this.SUBRULE(this.expression, { LABEL: 'caseValue' })
                        },
                    })
                },
            },
        ])
        this.CONSUME(Colon)
        this.SUBRULE2(this.statement, { LABEL: 'caseAction' })
    })

    // Assignment: lhs = rhs; or lhs <= rhs;
    private assignment = this.RULE('assignment', () => {
        this.SUBRULE(this.expression, { LABEL: 'lhs' })
        this.OR([
            { ALT: () => this.CONSUME(Assign_Op, { LABEL: 'blocking' }) },
            { ALT: () => this.CONSUME(NonBlockingAssign, { LABEL: 'nonBlocking' }) },
        ])
        this.SUBRULE2(this.expression, { LABEL: 'rhs' })
        this.CONSUME(Semicolon)
    })

    // Expression (simplified - handles basic operators)
    private expression = this.RULE('expression', () => {
        this.SUBRULE(this.ternaryExpression)
    })

    // Ternary: cond ? true : false
    private ternaryExpression = this.RULE('ternaryExpression', () => {
        this.SUBRULE(this.logicalOrExpression)
        this.OPTION(() => {
            this.CONSUME(Question)
            this.SUBRULE2(this.expression, { LABEL: 'ifTrue' })
            this.CONSUME(Colon)
            this.SUBRULE3(this.expression, { LABEL: 'ifFalse' })
        })
    })

    // Logical OR: ||
    private logicalOrExpression = this.RULE('logicalOrExpression', () => {
        this.SUBRULE(this.logicalAndExpression)
        this.MANY(() => {
            this.CONSUME(LogicalOr)
            this.SUBRULE2(this.logicalAndExpression)
        })
    })

    // Logical AND: &&
    private logicalAndExpression = this.RULE('logicalAndExpression', () => {
        this.SUBRULE(this.bitwiseOrExpression)
        this.MANY(() => {
            this.CONSUME(LogicalAnd)
            this.SUBRULE2(this.bitwiseOrExpression)
        })
    })

    // Bitwise OR: |
    private bitwiseOrExpression = this.RULE('bitwiseOrExpression', () => {
        this.SUBRULE(this.bitwiseXorExpression)
        this.MANY(() => {
            this.CONSUME(Pipe)
            this.SUBRULE2(this.bitwiseXorExpression)
        })
    })

    // Bitwise XOR: ^
    private bitwiseXorExpression = this.RULE('bitwiseXorExpression', () => {
        this.SUBRULE(this.bitwiseAndExpression)
        this.MANY(() => {
            this.CONSUME(Caret)
            this.SUBRULE2(this.bitwiseAndExpression)
        })
    })

    // Bitwise AND: &
    private bitwiseAndExpression = this.RULE('bitwiseAndExpression', () => {
        this.SUBRULE(this.equalityExpression)
        this.MANY(() => {
            this.CONSUME(Ampersand)
            this.SUBRULE2(this.equalityExpression)
        })
    })

    // Equality: == !=
    private equalityExpression = this.RULE('equalityExpression', () => {
        this.SUBRULE(this.relationalExpression)
        this.MANY(() => {
            this.OR([
                { ALT: () => this.CONSUME(Equal) },
                { ALT: () => this.CONSUME(NotEqual) },
            ])
            this.SUBRULE2(this.relationalExpression)
        })
    })

    // Relational: < > <= >=
    private relationalExpression = this.RULE('relationalExpression', () => {
        this.SUBRULE(this.shiftExpression)
        this.MANY(() => {
            this.OR([
                { ALT: () => this.CONSUME(LessThan) },
                { ALT: () => this.CONSUME(GreaterThan) },
                { ALT: () => this.CONSUME(GreaterEqual) },
            ])
            this.SUBRULE2(this.shiftExpression)
        })
    })

    // Shift: << >>
    private shiftExpression = this.RULE('shiftExpression', () => {
        this.SUBRULE(this.additiveExpression)
        this.MANY(() => {
            this.OR([
                { ALT: () => this.CONSUME(ShiftLeft) },
                { ALT: () => this.CONSUME(ShiftRight) },
            ])
            this.SUBRULE2(this.additiveExpression)
        })
    })

    // Additive: + -
    private additiveExpression = this.RULE('additiveExpression', () => {
        this.SUBRULE(this.multiplicativeExpression)
        this.MANY(() => {
            this.OR([
                { ALT: () => this.CONSUME(Plus) },
                { ALT: () => this.CONSUME(Minus) },
            ])
            this.SUBRULE2(this.multiplicativeExpression)
        })
    })

    // Multiplicative: * / %
    private multiplicativeExpression = this.RULE('multiplicativeExpression', () => {
        this.SUBRULE(this.unaryExpression)
        this.MANY(() => {
            this.OR([
                { ALT: () => this.CONSUME(Star) },
                { ALT: () => this.CONSUME(Slash) },
                { ALT: () => this.CONSUME(Percent) },
            ])
            this.SUBRULE2(this.unaryExpression)
        })
    })

    // Unary: ! ~ - +
    private unaryExpression = this.RULE('unaryExpression', () => {
        this.OR([
            {
                ALT: () => {
                    this.OR2([
                        { ALT: () => this.CONSUME(Bang, { LABEL: 'unaryOp' }) },
                        { ALT: () => this.CONSUME(Tilde, { LABEL: 'unaryOp' }) },
                        { ALT: () => this.CONSUME(Minus, { LABEL: 'unaryOp' }) },
                        { ALT: () => this.CONSUME(Plus, { LABEL: 'unaryOp' }) },
                    ])
                    this.SUBRULE(this.unaryExpression)
                },
            },
            { ALT: () => this.SUBRULE2(this.primaryExpression) },
        ])
    })

    // Primary: identifier, number, parenthesized, concatenation
    private primaryExpression = this.RULE('primaryExpression', () => {
        this.OR([
            { ALT: () => this.CONSUME(SizedNumber, { LABEL: 'number' }) },
            { ALT: () => this.CONSUME(Number, { LABEL: 'number' }) },
            { ALT: () => this.SUBRULE(this.identifierOrCall) },
            { ALT: () => this.SUBRULE(this.parenExpression) },
            { ALT: () => this.SUBRULE(this.concatenation) },
        ])
    })

    // Identifier with optional bit/range select
    private identifierOrCall = this.RULE('identifierOrCall', () => {
        this.CONSUME(Identifier, { LABEL: 'name' })
        this.OPTION(() => {
            this.CONSUME(LBracket)
            this.SUBRULE(this.expression, { LABEL: 'index' })
            this.OPTION2(() => {
                this.CONSUME(Colon)
                this.SUBRULE2(this.expression, { LABEL: 'rangeEnd' })
            })
            this.CONSUME(RBracket)
        })
    })

    // Parenthesized expression
    private parenExpression = this.RULE('parenExpression', () => {
        this.CONSUME(LParen)
        this.SUBRULE(this.expression)
        this.CONSUME(RParen)
    })

    // Concatenation: {a, b, c}
    private concatenation = this.RULE('concatenation', () => {
        this.CONSUME(LBrace)
        this.AT_LEAST_ONE_SEP({
            SEP: Comma,
            DEF: () => {
                this.SUBRULE(this.expression)
            },
        })
        this.CONSUME(RBrace)
    })
}

// Create parser instance
const parser = new VerilogCstParser()

// ============================================================================
// Parse Function
// ============================================================================
export interface ParseResult {
    cst: any
    errors: {
        message: string
        line: number
        column: number
    }[]
}

export function parse(input: string): ParseResult {
    const lexResult = tokenize(input)

    if (lexResult.errors.length > 0) {
        return {
            cst: null,
            errors: lexResult.errors.map(e => ({
                message: e.message,
                line: e.line,
                column: e.column,
            })),
        }
    }

    parser.input = lexResult.tokens
    const cst = parser.module()

    return {
        cst,
        errors: parser.errors.map(e => ({
            message: e.message,
            line: e.token.startLine || 0,
            column: e.token.startColumn || 0,
        })),
    }
}

// Export parser for advanced use
export { parser as VerilogParser }
