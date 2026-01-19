import { VerilogParser } from './parser';
import * as T from './types';
import { IToken, CstNode } from 'chevrotain';

const BaseVisitor = VerilogParser.getBaseCstVisitorConstructor();

export class VerilogASTVisitor extends BaseVisitor {
    constructor() {
        super();
        this.validateVisitor();
    }

    // =========================================================================
    // Module
    // =========================================================================

    module(ctx: any): T.VerilogModule {
        const name = ctx.moduleName[0].image;

        // Process ports
        let ports: T.PortDeclaration[] = [];
        if (ctx.portList) {
            ports = this.visit(ctx.portList);
        }

        // Process module items
        const parameters: T.ParameterDeclaration[] = [];
        const declarations: T.Declaration[] = [];
        const alwaysBlocks: T.AlwaysBlock[] = [];
        const initialBlocks: T.InitialBlock[] = [];
        const assigns: T.AssignStatement[] = [];
        const submodules: T.SubmoduleInstance[] = [];

        if (ctx.moduleItem) {
            ctx.moduleItem.forEach((item: CstNode) => {
                const result = this.visit(item);
                if (!result) return;

                switch (result.type) {
                    case 'ParameterDeclaration':
                        parameters.push(result);
                        break;
                    case 'LocalparamDeclaration':
                    case 'WireDeclaration':
                    case 'RegDeclaration':
                        declarations.push(result);
                        break;
                    case 'AlwaysBlock':
                        alwaysBlocks.push(result);
                        break;
                    case 'InitialBlock':
                        initialBlocks.push(result);
                        break;
                    case 'Assign':
                        assigns.push(result);
                        break;
                    // Submodules not strictly typed in VerilogModule interface yet but handled by extractor?
                    // The current types.ts allows Declarations to include params/localparams/wires/regs.
                    // types.ts `Declaration` union includes ParameterDecl and LocalparamDecl.
                    // But VerilogModule has separate `parameters` array. 
                    // I will put them in `declarations` as well if they fit the type, or just follow types.ts structure.
                }

                // Add to general declarations list if it fits the type
                if (['WireDeclaration', 'RegDeclaration', 'ParameterDeclaration', 'LocalparamDeclaration'].includes(result.type)) {
                    // Already handled in switch but confirm logic
                }
            });
        }

        return {
            type: 'Module',
            name,
            ports,
            parameters, // VerilogModule has specific parameters field
            declarations, // This holds wires, regs, localparams
            alwaysBlocks,
            initialBlocks,
            assigns,
            submodules,
            location: this.getLocation(ctx.moduleName[0]),
        };
    }

    portList(ctx: any): T.PortDeclaration[] {
        if (!ctx.portDeclaration) return [];
        return ctx.portDeclaration.map((d: CstNode) => this.visit(d));
    }

    portDeclaration(ctx: any): T.PortDeclaration {
        const direction = ctx.direction[0].image; // input, output, inout
        const name = ctx.portName[0].image;

        let portType: 'wire' | 'reg' | undefined;
        if (ctx.portType) {
            portType = ctx.portType[0].image;
        }

        let width: T.Range | undefined;
        if (ctx.width) {
            width = this.visit(ctx.width);
        }

        return {
            type: 'PortDeclaration',
            direction,
            portType,
            width,
            name,
            location: this.getLocation(ctx.direction[0]),
        };
    }

    range(ctx: any): T.Range {
        return {
            type: 'Range',
            msb: this.visit(ctx.msb),
            lsb: this.visit(ctx.lsb),
        };
    }

    moduleItem(ctx: any): T.ASTNode {
        // Dispatch to the single child
        const childKey = Object.keys(ctx).find(k => k !== 'undefined');
        if (childKey && ctx[childKey]) {
            return this.visit(ctx[childKey]);
        }
        throw new Error('Unknown module item');
    }

    // =========================================================================
    // Declarations
    // =========================================================================

    wireDeclaration(ctx: any): T.WireDeclaration {
        const names = ctx.wireName.map((t: IToken) => t.image);
        let width: T.Range | undefined;
        if (ctx.width) {
            width = this.visit(ctx.width);
        }
        return {
            type: 'WireDeclaration',
            names,
            width,
        };
    }

    regDeclaration(ctx: any): T.RegDeclaration {
        const names = ctx.regName.map((t: IToken) => t.image);
        let width: T.Range | undefined;
        if (ctx.width) {
            width = this.visit(ctx.width);
        }
        return {
            type: 'RegDeclaration',
            names,
            width,
        };
    }

    parameterDeclaration(ctx: any): T.ParameterDeclaration {
        const name = ctx.paramName[0].image;
        const value = this.visit(ctx.value);
        let width: T.Range | undefined;
        if (ctx.width) {
            width = this.visit(ctx.width);
        }
        return {
            type: 'ParameterDeclaration',
            name,
            value,
            width,
        };
    }

    localparamDeclaration(ctx: any): T.LocalparamDeclaration {
        const name = ctx.paramName[0].image;
        const value = this.visit(ctx.value);
        let width: T.Range | undefined;
        if (ctx.width) {
            width = this.visit(ctx.width);
        }
        return {
            type: 'LocalparamDeclaration',
            name,
            value,
            width,
        };
    }

    // =========================================================================
    // Logic Blocks
    // =========================================================================

    assignStatement(ctx: any): T.AssignStatement {
        return {
            type: 'Assign',
            lhs: this.visit(ctx.lhs),
            rhs: this.visit(ctx.rhs),
        };
    }

    alwaysBlock(ctx: any): T.AlwaysBlock {
        const body = this.visit(ctx.statement);
        const sensitivity = this.visit(ctx.sensitivityList);

        // Simple heuristic for sequential vs combinational
        // If sensitivity list has 'posedge' or 'negedge', it's sequential
        let blockType: 'combinational' | 'sequential' = 'combinational';
        if (Array.isArray(sensitivity) && sensitivity.some(s => s.edge)) {
            blockType = 'sequential';
        }

        return {
            type: 'AlwaysBlock',
            blockType,
            sensitivity,
            body,
        };
    }

    initialBlock(ctx: any): T.InitialBlock {
        return {
            type: 'InitialBlock',
            body: this.visit(ctx.statement),
        };
    }

    sensitivityList(ctx: any): T.SensitivityItem[] | '*' {
        if (ctx.combinational) {
            return '*';
        }
        if (ctx.sensitivityItem) {
            return ctx.sensitivityItem.map((i: CstNode) => this.visit(i));
        }
        return '*';
    }

    sensitivityItem(ctx: any): T.SensitivityItem {
        const signal = ctx.signal[0].image;
        let edge: 'posedge' | 'negedge' | undefined;
        if (ctx.edge) {
            edge = ctx.edge[0].image;
        }
        return {
            type: 'SensitivityItem',
            signal,
            edge,
        };
    }

    // =========================================================================
    // Statements
    // =========================================================================

    statement(ctx: any): T.Statement {
        if (ctx.beginEnd) return this.visit(ctx.beginEnd);
        if (ctx.ifStatement) return this.visit(ctx.ifStatement);
        if (ctx.caseStatement) return this.visit(ctx.caseStatement);
        if (ctx.assignment) return this.visit(ctx.assignment);
        throw new Error('Unknown statement type');
    }

    beginEnd(ctx: any): T.BeginEnd {
        // Handle optional label if implemented in parser (parser.ts doesn't seem to have label rule in beginEnd)
        // parser.ts: private beginEnd = this.RULE('beginEnd', ... this.MANY(statement) ...)
        const statements = ctx.statement ? ctx.statement.map((s: CstNode) => this.visit(s)) : [];
        return {
            type: 'BeginEnd',
            statements,
        };
    }

    ifStatement(ctx: any): T.IfStatement {
        const condition = this.visit(ctx.condition);
        const thenBranch = this.visit(ctx.thenBranch);
        let elseBranch: T.Statement | undefined;
        if (ctx.elseBranch) {
            elseBranch = this.visit(ctx.elseBranch);
        }
        return {
            type: 'If',
            condition,
            thenBranch,
            elseBranch,
        };
    }

    caseStatement(ctx: any): T.CaseStatement {
        const caseType = ctx.caseType[0].image; // case, casex, casez
        const expression = this.visit(ctx.selector);
        const items = ctx.caseItem ? ctx.caseItem.map((item: CstNode) => this.visit(item)) : [];

        return {
            type: 'Case',
            caseType,
            expression,
            items,
        };
    }

    caseItem(ctx: any): T.CaseItem {
        let conditions: T.Expression[] | 'default' = 'default';
        if (!ctx.isDefault) { // If NOT default, we have caseValues
            conditions = ctx.caseValue.map((v: CstNode) => this.visit(v));
        }

        // Parser defines caseAction as a single statement (which can be a beginEnd block)
        const stmt = this.visit(ctx.caseAction);
        const statements = stmt.type === 'BeginEnd' ? stmt.statements : [stmt];

        return {
            type: 'CaseItem',
            conditions,
            statements,
        };
    }

    assignment(ctx: any): T.BlockingAssignment | T.NonBlockingAssignment {
        const lhs = this.visit(ctx.lhs);
        const rhs = this.visit(ctx.rhs);

        if (ctx.blocking) {
            return {
                type: 'BlockingAssignment',
                lhs,
                rhs,
            };
        } else {
            return {
                type: 'NonBlockingAssignment',
                lhs,
                rhs,
            };
        }
    }

    // =========================================================================
    // Expressions
    // =========================================================================

    expression(ctx: any): T.Expression {
        // Expression rule in parser delegates to ternaryExpression
        return this.visit(ctx.ternaryExpression);
    }

    ternaryExpression(ctx: any): T.Expression {
        const expr = this.visit(ctx.logicalOrExpression[0]); // Base

        if (ctx.ifTrue && ctx.ifFalse) {
            // It's a ternary
            // Note: parser handles RIGHT associativity for ternary usually, or left? 
            // Parser: this.SUBRULE(this.logicalOrExpression) then OPTION(Question ...)
            // Simple ternary: a ? b : c
            return {
                type: 'TernaryExpr',
                condition: expr,
                ifTrue: this.visit(ctx.ifTrue),
                ifFalse: this.visit(ctx.ifFalse),
            };
        }
        return expr;
    }

    // Generic binary handler
    // Note: Chevrotain structure for binary ops is typically:
    // { lhs: [node], rhs: [node, node...], operator: [token, token...] }
    // OR nested loops in parser. TS Parser uses: SUBRULE(nextLevel), MANY(Operator, SUBRULE(nextLevel))

    private binaryOp(ctx: any, nextRule: string, opsKey?: string): T.Expression {
        let left = this.visit(ctx[nextRule][0]);

        if (ctx[nextRule].length > 1) {
            // We have operations
            // If opsKey is not provided, we need to inspect the ctx to find which token was matched
            // But usually we can iterate. 
            // Logic: left op[0] right[1], result op[1] right[2] ... (Left associative)

            for (let i = 1; i < ctx[nextRule].length; i++) {
                const right = this.visit(ctx[nextRule][i]);
                // Find operator. It's strictly position i-1 in the tokens array if we collect them all?
                // Not quite. Chevrotain provides keyed tokens.
                // But if we have multiple possible operators (like + and -), they might be in different keys.
                // We need a helper to find the operator token at this 'step'.
                // For now, simplify: assume standard left associativity and just grab the operator from available tokens based on position?
                // Actually, ctx keys contain arrays of tokens.
                // e.g. ctx.Plus might contain [Token1, Token2].
                // We need to sort tokens by position to know order? 
                // Or simpler: recursive descent structure implies (A (op B)*).

                // Let's implement a 'getOperator' helper later. 
                // For now let's just use '?' placeholder if complex, but FSM extractor needs to respect hierarchy.

                // Hack for now: just grab first available operator token? No that's wrong order.
                // Correct way: sort all operator tokens by startOffset.
                const allOps: IToken[] = [];
                // Collect all possible operators for this level
                // e.g. for multiplicative: Star, Slash, Percent
                ['Plus', 'Minus', 'Star', 'Slash', 'Percent', 'LogicalAnd', 'LogicalOr', 'Pipe', 'Caret', 'Ampersand', 'Equal', 'NotEqual', 'LessThan', 'GreaterThan', 'GreaterEqual', 'ShiftLeft', 'ShiftRight'].forEach(op => {
                    if (ctx[op]) allOps.push(...ctx[op]);
                });
                allOps.sort((a, b) => a.startOffset - b.startOffset);

                const operator = allOps[i - 1]?.image || '?';

                left = {
                    type: 'BinaryExpr',
                    operator,
                    left,
                    right,
                };
            }
        }
        return left;
    }

    logicalOrExpression(ctx: any) { return this.binaryOp(ctx, 'logicalAndExpression'); }
    logicalAndExpression(ctx: any) { return this.binaryOp(ctx, 'bitwiseOrExpression'); }
    bitwiseOrExpression(ctx: any) { return this.binaryOp(ctx, 'bitwiseXorExpression'); }
    bitwiseXorExpression(ctx: any) { return this.binaryOp(ctx, 'bitwiseAndExpression'); }
    bitwiseAndExpression(ctx: any) { return this.binaryOp(ctx, 'equalityExpression'); }
    equalityExpression(ctx: any) { return this.binaryOp(ctx, 'relationalExpression'); }
    relationalExpression(ctx: any) { return this.binaryOp(ctx, 'shiftExpression'); }
    shiftExpression(ctx: any) { return this.binaryOp(ctx, 'additiveExpression'); }
    additiveExpression(ctx: any) { return this.binaryOp(ctx, 'multiplicativeExpression'); }
    multiplicativeExpression(ctx: any) { return this.binaryOp(ctx, 'unaryExpression'); }

    unaryExpression(ctx: any): T.Expression {
        if (ctx.unaryOp) {
            const operator = ctx.unaryOp[0].image;
            const operand = this.visit(ctx.unaryExpression); // Recursive
            return {
                type: 'UnaryExpr',
                operator,
                operand,
            };
        }
        return this.visit(ctx.primaryExpression);
    }

    primaryExpression(ctx: any): T.Expression {
        if (ctx.number) {
            // Check if it is a SizedNumber or simple Number
            // parser has SizedNumber and Number tokens.
            const token = ctx.number[0];
            // Identify format
            if (token.tokenType.name === 'SizedNumber') {
                // parse 1'b1
                const parts = token.image.split("'");
                const width = parseInt(parts[0], 10);
                const baseChar = parts[1][0].toLowerCase();
                const value = parts[1].substring(1);
                const baseMap: any = { b: 'binary', o: 'octal', d: 'decimal', h: 'hex' };
                return {
                    type: 'Number',
                    value,
                    width,
                    base: baseMap[baseChar] || 'decimal',
                };
            } else {
                return {
                    type: 'Number',
                    value: token.image,
                };
            }
        }
        if (ctx.identifierOrCall) {
            return this.visit(ctx.identifierOrCall);
        }
        if (ctx.parenExpression) {
            return this.visit(ctx.parenExpression);
        }
        if (ctx.concatenation) {
            return this.visit(ctx.concatenation);
        }
        throw new Error('Unknown primary expression');
    }

    identifierOrCall(ctx: any): T.IdentifierExpr | T.BitSelectExpr | T.RangeSelectExpr {
        const name = ctx.name[0].image;
        const base: T.IdentifierExpr = { type: 'Identifier', name };

        if (ctx.index) {
            const index = this.visit(ctx.index);

            if (ctx.rangeEnd) {
                const rangeEnd = this.visit(ctx.rangeEnd);
                return {
                    type: 'RangeSelect',
                    signal: base,
                    msb: index, // Parser rule uses 'index' label for first expr
                    lsb: rangeEnd,
                };
            }

            return {
                type: 'BitSelect',
                signal: base,
                index,
            };
        }

        return base;
    }

    parenExpression(ctx: any): T.Expression {
        return this.visit(ctx.expression);
    }

    concatenation(ctx: any): T.ConcatExpr {
        // Parser: AT_LEAST_ONE_SEP(expression)
        // Unfortunately Chevrotain doesn't output a nice array if using built-in repetition without labels sometimes?
        // Wait, the parser rule is:
        /*
        this.AT_LEAST_ONE_SEP({
                SEP: Comma,
                DEF: () => {
                    this.SUBRULE(this.expression)
                },
            })
        */
        // This results in `ctx.expression` being an array of CstNodes.
        const elements = ctx.expression.map((e: CstNode) => this.visit(e));
        return {
            type: 'Concat',
            elements,
        };
    }

    // Helper
    private getLocation(token: IToken): T.SourceLocation {
        return {
            startLine: token.startLine || 0,
            startColumn: token.startColumn || 0,
            endLine: token.endLine || 0,
            endColumn: token.endColumn || 0,
        };
    }
}

// Export a convenience function
export function cstToAst(cst: any): T.VerilogModule {
    const visitor = new VerilogASTVisitor();
    return visitor.visit(cst);
}
