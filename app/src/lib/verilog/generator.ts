/**
 * Verilog Generator
 * Converts AST back to formatted Verilog code
 */
import type {
    VerilogModule, PortDeclaration, Declaration,
    AlwaysBlock, AssignStatement, Expression,
    WireDeclaration, RegDeclaration, ParameterDeclaration,
    LocalparamDeclaration, Range, Statement,
    BlockingAssignment, NonBlockingAssignment,
    IfStatement, CaseStatement, BeginEnd,
    SensitivityItem, InitialBlock, CaseItem,
    BinaryExpr, UnaryExpr, TernaryExpr,
    IdentifierExpr, NumberExpr, ConcatExpr,
    BitSelectExpr, RangeSelectExpr,
} from './types'

// ============================================================================
// Generator Options
// ============================================================================
export interface GeneratorOptions {
    indentSize: number
    indentChar: ' ' | '\t'
    lineWidth: number
    alignPorts: boolean
    alignDeclarations: boolean
    preserveComments: boolean
}

const defaultOptions: GeneratorOptions = {
    indentSize: 2,
    indentChar: ' ',
    lineWidth: 100,
    alignPorts: true,
    alignDeclarations: true,
    preserveComments: true,
}

// ============================================================================
// Generator Class
// ============================================================================
export class VerilogGenerator {
    private options: GeneratorOptions
    private currentIndent: number = 0

    constructor(options: Partial<GeneratorOptions> = {}) {
        this.options = { ...defaultOptions, ...options }
    }

    // Generate code from module AST
    generate(module: VerilogModule): string {
        const lines: string[] = []

        // Module header
        lines.push(this.generateModuleHeader(module))

        // Port declarations (if not in header)
        // Already included in header for ANSI-style

        // Parameters
        for (const param of module.parameters) {
            lines.push(this.indent(1) + this.generateParameter(param))
        }

        // Declarations
        for (const decl of module.declarations) {
            lines.push(this.indent(1) + this.generateDeclaration(decl))
        }

        // Blank line separator
        if (module.parameters.length > 0 || module.declarations.length > 0) {
            lines.push('')
        }

        // Assign statements
        for (const assign of module.assigns) {
            lines.push(this.indent(1) + this.generateAssign(assign))
        }

        if (module.assigns.length > 0) {
            lines.push('')
        }

        // Always blocks
        for (const always of module.alwaysBlocks) {
            lines.push(...this.generateAlways(always).map(l => this.indent(1) + l))
            lines.push('')
        }

        // Initial blocks
        for (const initial of module.initialBlocks) {
            lines.push(...this.generateInitial(initial).map(l => this.indent(1) + l))
            lines.push('')
        }

        // End module
        lines.push('endmodule')

        return lines.join('\n')
    }

    // Generate module header with ports
    private generateModuleHeader(module: VerilogModule): string {
        if (module.ports.length === 0) {
            return `module ${module.name};`
        }

        const portLines = module.ports.map((p, i) => {
            const isLast = i === module.ports.length - 1
            return this.indent(1) + this.generatePort(p) + (isLast ? '' : ',')
        })

        return [
            `module ${module.name}(`,
            ...portLines,
            ');'
        ].join('\n')
    }

    // Generate port declaration
    private generatePort(port: PortDeclaration): string {
        const parts: string[] = []
        parts.push(port.direction)
        if (port.portType) {
            parts.push(port.portType)
        }
        if (port.width) {
            parts.push(this.generateRange(port.width))
        }
        parts.push(port.name)
        return parts.join(' ')
    }

    // Generate range [msb:lsb]
    private generateRange(range: Range): string {
        return `[${generateExpression(range.msb)}:${generateExpression(range.lsb)}]`
    }

    // Generate parameter
    private generateParameter(param: ParameterDeclaration): string {
        const width = param.width ? this.generateRange(param.width) + ' ' : ''
        return `parameter ${width}${param.name} = ${generateExpression(param.value)};`
    }

    // Generate declaration (wire, reg, localparam)
    private generateDeclaration(decl: Declaration): string {
        switch (decl.type) {
            case 'WireDeclaration':
                return this.generateWire(decl)
            case 'RegDeclaration':
                return this.generateReg(decl)
            case 'LocalparamDeclaration':
                return this.generateLocalparam(decl)
            case 'ParameterDeclaration':
                return this.generateParameter(decl)
            default:
                return `// Unknown declaration type`
        }
    }

    private generateWire(decl: WireDeclaration): string {
        const width = decl.width ? this.generateRange(decl.width) + ' ' : ''
        return `wire ${width}${decl.names.join(', ')};`
    }

    private generateReg(decl: RegDeclaration): string {
        const width = decl.width ? this.generateRange(decl.width) + ' ' : ''
        const array = decl.array ? ' ' + this.generateRange(decl.array) : ''
        return `reg ${width}${decl.names.join(', ')}${array};`
    }

    private generateLocalparam(decl: LocalparamDeclaration): string {
        const width = decl.width ? this.generateRange(decl.width) + ' ' : ''
        return `localparam ${width}${decl.name} = ${generateExpression(decl.value)};`
    }

    // Generate assign statement
    private generateAssign(assign: AssignStatement): string {
        return `assign ${generateExpression(assign.lhs)} = ${generateExpression(assign.rhs)};`
    }

    // Generate always block
    private generateAlways(always: AlwaysBlock): string[] {
        const lines: string[] = []
        const sensitivity = this.generateSensitivity(always.sensitivity)

        lines.push(`always @(${sensitivity}) begin`)
        lines.push(...this.generateStatements(always.body).map(l => this.indent(1) + l))
        lines.push('end')

        return lines
    }

    // Generate initial block
    private generateInitial(initial: InitialBlock): string[] {
        const lines: string[] = []
        lines.push('initial begin')
        lines.push(...this.generateStatements(initial.body).map(l => this.indent(1) + l))
        lines.push('end')
        return lines
    }

    // Generate sensitivity list
    private generateSensitivity(sensitivity: SensitivityItem[] | '*'): string {
        if (sensitivity === '*') {
            return '*'
        }
        return sensitivity.map(s => {
            if (s.edge) {
                return `${s.edge} ${s.signal}`
            }
            return s.signal
        }).join(' or ')
    }

    // Generate statements
    private generateStatements(body: Statement | Statement[]): string[] {
        const statements = Array.isArray(body) ? body : [body]
        const lines: string[] = []

        for (const stmt of statements) {
            lines.push(...this.generateStatement(stmt))
        }

        return lines
    }

    // Generate single statement
    private generateStatement(stmt: Statement): string[] {
        switch (stmt.type) {
            case 'BlockingAssignment':
                return [`${generateExpression(stmt.lhs)} = ${generateExpression(stmt.rhs)};`]
            case 'NonBlockingAssignment':
                return [`${generateExpression(stmt.lhs)} <= ${generateExpression(stmt.rhs)};`]
            case 'If':
                return this.generateIf(stmt)
            case 'Case':
                return this.generateCase(stmt)
            case 'BeginEnd':
                return this.generateBeginEnd(stmt)
            default:
                return [`// Unknown statement type`]
        }
    }

    // Generate if statement
    private generateIf(stmt: IfStatement): string[] {
        const lines: string[] = []
        const condition = generateExpression(stmt.condition)

        lines.push(`if (${condition}) begin`)
        lines.push(...this.generateStatements(stmt.thenBranch).map(l => this.indent(1) + l))
        lines.push('end')

        if (stmt.elseBranch) {
            // Check if else branch is another if (else-if chain)
            const elseStmts = Array.isArray(stmt.elseBranch) ? stmt.elseBranch : [stmt.elseBranch]
            if (elseStmts.length === 1 && elseStmts[0].type === 'If') {
                lines[lines.length - 1] = 'end else ' + this.generateIf(elseStmts[0] as IfStatement)[0]
                lines.push(...this.generateIf(elseStmts[0] as IfStatement).slice(1))
            } else {
                lines.push('else begin')
                lines.push(...this.generateStatements(stmt.elseBranch).map(l => this.indent(1) + l))
                lines.push('end')
            }
        }

        return lines
    }

    // Generate case statement
    private generateCase(stmt: CaseStatement): string[] {
        const lines: string[] = []
        lines.push(`${stmt.caseType}(${generateExpression(stmt.expression)})`)

        for (const item of stmt.items) {
            lines.push(...this.generateCaseItem(item).map(l => this.indent(1) + l))
        }

        lines.push('endcase')
        return lines
    }

    // Generate case item
    private generateCaseItem(item: CaseItem): string[] {
        const lines: string[] = []
        const label = item.conditions === 'default'
            ? 'default'
            : item.conditions.map(c => generateExpression(c)).join(', ')

        lines.push(`${label}: begin`)
        for (const stmt of item.statements) {
            lines.push(...this.generateStatement(stmt).map(l => this.indent(1) + l))
        }
        lines.push('end')

        return lines
    }

    // Generate begin-end block
    private generateBeginEnd(stmt: BeginEnd): string[] {
        const lines: string[] = []
        const label = stmt.label ? `: ${stmt.label}` : ''
        lines.push(`begin${label}`)

        for (const s of stmt.statements) {
            lines.push(...this.generateStatement(s).map(l => this.indent(1) + l))
        }

        lines.push('end')
        return lines
    }

    // Indentation helper
    private indent(level: number): string {
        const base = this.options.indentChar.repeat(this.options.indentSize)
        return base.repeat(level)
    }
}

// Standalone expression generator
export function generateExpression(expr: Expression): string {
    switch (expr.type) {
        case 'Identifier':
            return expr.name
        case 'Number':
            return expr.value
        case 'BinaryExpr':
            return `${generateExpression(expr.left)} ${expr.operator} ${generateExpression(expr.right)}`
        case 'UnaryExpr':
            return `${expr.operator}${generateExpression(expr.operand)}`
        case 'TernaryExpr':
            return `${generateExpression(expr.condition)} ? ${generateExpression(expr.ifTrue)} : ${generateExpression(expr.ifFalse)}`
        case 'Concat':
            return `{${expr.elements.map(e => generateExpression(e)).join(', ')}}`
        case 'BitSelect':
            return `${generateExpression(expr.signal)}[${generateExpression(expr.index)}]`
        case 'RangeSelect':
            return `${generateExpression(expr.signal)}[${generateExpression(expr.msb)}:${generateExpression(expr.lsb)}]`
        default:
            return '/* unknown */'
    }
}

// ============================================================================
// Convenience function
// ============================================================================
export function generateVerilog(module: VerilogModule, options?: Partial<GeneratorOptions>): string {
    const generator = new VerilogGenerator(options)
    return generator.generate(module)
}
