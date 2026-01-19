/**
 * Verilog Validator
 * Implements lint rules for common Verilog coding issues
 */
import type {
    VerilogModule, AlwaysBlock, Statement,
    Expression, IdentifierExpr,
} from './types'

// ============================================================================
// Lint Rule Definitions
// ============================================================================
export type Severity = 'error' | 'warning' | 'info'

export interface LintViolation {
    rule: string
    message: string
    severity: Severity
    line?: number
    column?: number
    suggestion?: string
}

export interface ValidationResult {
    isValid: boolean
    violations: LintViolation[]
    warnings: LintViolation[]
    errors: LintViolation[]
}

// ============================================================================
// Lint Rules
// ============================================================================
export interface LintRule {
    name: string
    description: string
    severity: Severity
    check: (module: VerilogModule) => LintViolation[]
}

// Rule: Undriven Signal
// Detects signals that are declared but never assigned a value
const undrivenSignalRule: LintRule = {
    name: 'undriven-signal',
    description: 'Signal declared but never assigned',
    severity: 'error',
    check: (module: VerilogModule): LintViolation[] => {
        const violations: LintViolation[] = []

        // Collect all declared signals (wires and regs)
        const declaredSignals = new Set<string>()
        const drivenSignals = new Set<string>()

        // Add output ports as "driven" since they're outputs
        for (const port of module.ports) {
            if (port.direction === 'input') {
                drivenSignals.add(port.name) // Inputs are externally driven
            }
            declaredSignals.add(port.name)
        }

        // Add wire/reg declarations
        for (const decl of module.declarations) {
            if (decl.type === 'WireDeclaration') {
                decl.names.forEach(name => declaredSignals.add(name))
            } else if (decl.type === 'RegDeclaration') {
                decl.names.forEach(name => declaredSignals.add(name))
            }
        }

        // Find driven signals from assigns
        for (const assign of module.assigns) {
            collectDrivenSignals(assign.lhs, drivenSignals)
        }

        // Find driven signals from always blocks
        for (const always of module.alwaysBlocks) {
            collectDrivenSignalsFromStatements(always.body, drivenSignals)
        }

        // Check for undriven signals
        for (const signal of declaredSignals) {
            if (!drivenSignals.has(signal)) {
                violations.push({
                    rule: 'undriven-signal',
                    message: `Signal '${signal}' is declared but never assigned`,
                    severity: 'error',
                    suggestion: `Add an assignment to '${signal}' or remove the declaration`,
                })
            }
        }

        return violations
    },
}

// Rule: Blocking in Sequential
// Detects blocking assignments (=) in sequential always blocks
const blockingInSequentialRule: LintRule = {
    name: 'blocking-in-sequential',
    description: 'Blocking assignment in sequential always block',
    severity: 'warning',
    check: (module: VerilogModule): LintViolation[] => {
        const violations: LintViolation[] = []

        for (const always of module.alwaysBlocks) {
            if (always.blockType === 'sequential' || hasClockEdge(always)) {
                const blockingAssigns = findBlockingAssignments(always.body)
                for (const assign of blockingAssigns) {
                    violations.push({
                        rule: 'blocking-in-sequential',
                        message: `Blocking assignment (=) used in sequential always block`,
                        severity: 'warning',
                        suggestion: `Use non-blocking assignment (<=) in sequential logic`,
                    })
                }
            }
        }

        return violations
    },
}

// Rule: Non-Blocking in Combinational
// Detects non-blocking assignments (<=) in combinational always blocks
const nonBlockingInCombinationalRule: LintRule = {
    name: 'nonblocking-in-combinational',
    description: 'Non-blocking assignment in combinational always block',
    severity: 'warning',
    check: (module: VerilogModule): LintViolation[] => {
        const violations: LintViolation[] = []

        for (const always of module.alwaysBlocks) {
            if (always.blockType === 'combinational' || isCombinational(always)) {
                const nbAssigns = findNonBlockingAssignments(always.body)
                for (const assign of nbAssigns) {
                    violations.push({
                        rule: 'nonblocking-in-combinational',
                        message: `Non-blocking assignment (<=) used in combinational always block`,
                        severity: 'warning',
                        suggestion: `Use blocking assignment (=) in combinational logic`,
                    })
                }
            }
        }

        return violations
    },
}

// Rule: Missing Default Case
// Detects case statements without a default clause
const missingDefaultCaseRule: LintRule = {
    name: 'missing-default-case',
    description: 'Case statement missing default clause',
    severity: 'warning',
    check: (module: VerilogModule): LintViolation[] => {
        const violations: LintViolation[] = []

        for (const always of module.alwaysBlocks) {
            const caseStmts = findCaseStatements(always.body)
            for (const caseStmt of caseStmts) {
                const hasDefault = caseStmt.items.some(item => item.conditions === 'default')
                if (!hasDefault) {
                    violations.push({
                        rule: 'missing-default-case',
                        message: `Case statement is missing default clause`,
                        severity: 'warning',
                        suggestion: `Add a default case to prevent latches and undefined behavior`,
                    })
                }
            }
        }

        return violations
    },
}

// Rule: Incomplete Sensitivity List
// Detects always blocks with incomplete sensitivity lists (potential latch behavior)
const incompleteSensitivityRule: LintRule = {
    name: 'incomplete-sensitivity',
    description: 'Always block may have incomplete sensitivity list',
    severity: 'info',
    check: (module: VerilogModule): LintViolation[] => {
        const violations: LintViolation[] = []

        for (const always of module.alwaysBlocks) {
            // Skip if using @(*) - that's complete by definition
            if (always.sensitivity === '*') {
                continue
            }

            // Skip sequential blocks (posedge/negedge is intentional)
            if (hasClockEdge(always)) {
                continue
            }

            // For level-sensitive blocks, suggest @(*)
            violations.push({
                rule: 'incomplete-sensitivity',
                message: `Consider using @(*) for complete sensitivity list`,
                severity: 'info',
                suggestion: `Replace explicit sensitivity list with @(*) to avoid simulation mismatches`,
            })
        }

        return violations
    },
}

// Rule: Multi-driven Signal
// Detects signals driven by multiple sources
const multiDrivenSignalRule: LintRule = {
    name: 'multi-driven-signal',
    description: 'Signal driven by multiple sources',
    severity: 'error',
    check: (module: VerilogModule): LintViolation[] => {
        const violations: LintViolation[] = []
        const signalDrivers = new Map<string, number>()

        // Count drivers from assigns
        for (const assign of module.assigns) {
            countDrivers(assign.lhs, signalDrivers)
        }

        // Count drivers from always blocks (each always block = 1 driver)
        for (const always of module.alwaysBlocks) {
            const drivenInBlock = new Set<string>()
            collectDrivenSignalsFromStatements(always.body, drivenInBlock)
            for (const signal of drivenInBlock) {
                signalDrivers.set(signal, (signalDrivers.get(signal) || 0) + 1)
            }
        }

        // Check for multi-driven signals
        for (const [signal, count] of signalDrivers.entries()) {
            if (count > 1) {
                violations.push({
                    rule: 'multi-driven-signal',
                    message: `Signal '${signal}' is driven by ${count} sources`,
                    severity: 'error',
                    suggestion: `Ensure each signal is driven by only one continuous assignment or one always block`,
                })
            }
        }

        return violations
    },
}

// ============================================================================
// Helper Functions
// ============================================================================
function collectDrivenSignals(expr: Expression, signals: Set<string>): void {
    if (expr.type === 'Identifier') {
        signals.add(expr.name)
    } else if (expr.type === 'BitSelect' || expr.type === 'RangeSelect') {
        if (expr.signal.type === 'Identifier') {
            signals.add(expr.signal.name)
        }
    } else if (expr.type === 'Concat') {
        for (const elem of expr.elements) {
            collectDrivenSignals(elem, signals)
        }
    }
}

function collectDrivenSignalsFromStatements(body: Statement | Statement[], signals: Set<string>): void {
    const statements = Array.isArray(body) ? body : [body]

    for (const stmt of statements) {
        switch (stmt.type) {
            case 'BlockingAssignment':
            case 'NonBlockingAssignment':
                collectDrivenSignals(stmt.lhs, signals)
                break
            case 'If':
                collectDrivenSignalsFromStatements(stmt.thenBranch, signals)
                if (stmt.elseBranch) {
                    collectDrivenSignalsFromStatements(stmt.elseBranch, signals)
                }
                break
            case 'Case':
                for (const item of stmt.items) {
                    for (const s of item.statements) {
                        collectDrivenSignalsFromStatements(s, signals)
                    }
                }
                break
            case 'BeginEnd':
                collectDrivenSignalsFromStatements(stmt.statements, signals)
                break
        }
    }
}

function countDrivers(expr: Expression, counts: Map<string, number>): void {
    if (expr.type === 'Identifier') {
        counts.set(expr.name, (counts.get(expr.name) || 0) + 1)
    } else if (expr.type === 'BitSelect' || expr.type === 'RangeSelect') {
        if (expr.signal.type === 'Identifier') {
            const name = expr.signal.name
            counts.set(name, (counts.get(name) || 0) + 1)
        }
    } else if (expr.type === 'Concat') {
        for (const elem of expr.elements) {
            countDrivers(elem, counts)
        }
    }
}

function hasClockEdge(always: AlwaysBlock): boolean {
    if (always.sensitivity === '*') return false
    return always.sensitivity.some(s => s.edge === 'posedge' || s.edge === 'negedge')
}

function isCombinational(always: AlwaysBlock): boolean {
    if (always.sensitivity === '*') return true
    return !hasClockEdge(always)
}

function findBlockingAssignments(body: Statement | Statement[]): Statement[] {
    const results: Statement[] = []
    const statements = Array.isArray(body) ? body : [body]

    for (const stmt of statements) {
        if (stmt.type === 'BlockingAssignment') {
            results.push(stmt)
        } else if (stmt.type === 'If') {
            results.push(...findBlockingAssignments(stmt.thenBranch))
            if (stmt.elseBranch) {
                results.push(...findBlockingAssignments(stmt.elseBranch))
            }
        } else if (stmt.type === 'Case') {
            for (const item of stmt.items) {
                for (const s of item.statements) {
                    results.push(...findBlockingAssignments(s))
                }
            }
        } else if (stmt.type === 'BeginEnd') {
            results.push(...findBlockingAssignments(stmt.statements))
        }
    }

    return results
}

function findNonBlockingAssignments(body: Statement | Statement[]): Statement[] {
    const results: Statement[] = []
    const statements = Array.isArray(body) ? body : [body]

    for (const stmt of statements) {
        if (stmt.type === 'NonBlockingAssignment') {
            results.push(stmt)
        } else if (stmt.type === 'If') {
            results.push(...findNonBlockingAssignments(stmt.thenBranch))
            if (stmt.elseBranch) {
                results.push(...findNonBlockingAssignments(stmt.elseBranch))
            }
        } else if (stmt.type === 'Case') {
            for (const item of stmt.items) {
                for (const s of item.statements) {
                    results.push(...findNonBlockingAssignments(s))
                }
            }
        } else if (stmt.type === 'BeginEnd') {
            results.push(...findNonBlockingAssignments(stmt.statements))
        }
    }

    return results
}

function findCaseStatements(body: Statement | Statement[]): Array<{ items: Array<{ conditions: Expression[] | 'default' }> }> {
    const results: Array<any> = []
    const statements = Array.isArray(body) ? body : [body]

    for (const stmt of statements) {
        if (stmt.type === 'Case') {
            results.push(stmt)
        } else if (stmt.type === 'If') {
            results.push(...findCaseStatements(stmt.thenBranch))
            if (stmt.elseBranch) {
                results.push(...findCaseStatements(stmt.elseBranch))
            }
        } else if (stmt.type === 'BeginEnd') {
            results.push(...findCaseStatements(stmt.statements))
        }
    }

    return results
}

// ============================================================================
// Validator Class
// ============================================================================
export class VerilogValidator {
    private rules: LintRule[]

    constructor(rules?: LintRule[]) {
        this.rules = rules || [
            undrivenSignalRule,
            blockingInSequentialRule,
            nonBlockingInCombinationalRule,
            missingDefaultCaseRule,
            incompleteSensitivityRule,
            multiDrivenSignalRule,
        ]
    }

    validate(module: VerilogModule): ValidationResult {
        const violations: LintViolation[] = []

        for (const rule of this.rules) {
            violations.push(...rule.check(module))
        }

        const errors = violations.filter(v => v.severity === 'error')
        const warnings = violations.filter(v => v.severity === 'warning')

        return {
            isValid: errors.length === 0,
            violations,
            warnings,
            errors,
        }
    }

    // Check a single rule
    checkRule(module: VerilogModule, ruleName: string): LintViolation[] {
        const rule = this.rules.find(r => r.name === ruleName)
        if (!rule) {
            throw new Error(`Unknown rule: ${ruleName}`)
        }
        return rule.check(module)
    }

    // Get available rules
    getRules(): { name: string; description: string; severity: Severity }[] {
        return this.rules.map(r => ({
            name: r.name,
            description: r.description,
            severity: r.severity,
        }))
    }
}

// ============================================================================
// Convenience Functions
// ============================================================================
export function validateModule(module: VerilogModule): ValidationResult {
    const validator = new VerilogValidator()
    return validator.validate(module)
}

// Export individual rules for testing
export const LintRules = {
    undrivenSignal: undrivenSignalRule,
    blockingInSequential: blockingInSequentialRule,
    nonBlockingInCombinational: nonBlockingInCombinationalRule,
    missingDefaultCase: missingDefaultCaseRule,
    incompleteSensitivity: incompleteSensitivityRule,
    multiDrivenSignal: multiDrivenSignalRule,
}
