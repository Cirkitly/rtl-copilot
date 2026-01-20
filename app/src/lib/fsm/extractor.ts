/**
 * Verilog → FSM Extractor
 * 
 * Extracts FSM structure from parsed Verilog AST by:
 * 1. Finding localparam state definitions
 * 2. Identifying state register (sequential always block)
 * 3. Extracting transitions from next-state logic
 * 4. Detecting output assignments
 * 5. Auto-layout states for visualization
 */

import type {
    VerilogModule,
    Statement,
    AlwaysBlock,
    CaseStatement,
    Expression,
    LocalparamDeclaration,
    RegDeclaration,
    IdentifierExpr,
    BlockingAssignment,
    NonBlockingAssignment,
    IfStatement,
    NumberExpr
} from '../verilog/types';
import type { FSM, FSMState, FSMTransition, FSMExtractionResult, FSMSignal } from './types';
import { createEmptyFSM, createState, createTransition } from './types';

/**
 * Try to extract FSM from a Verilog module
 */
export function extractFSM(module: VerilogModule): FSMExtractionResult {
    const errors: string[] = [];
    let confidence = 0;

    try {
        // Step 1: Find state parameter definitions
        const stateParams = findStateParams(module);
        if (stateParams.length === 0) {
            errors.push('No state parameters found (localparam with binary values)');
            return { fsm: null, success: false, errors, confidence: 0 };
        }
        confidence += 0.2;

        // Step 2: Find state register
        const stateReg = findStateRegister(module, stateParams);
        if (!stateReg) {
            errors.push('Could not identify state register');
            return { fsm: null, success: false, errors, confidence };
        }
        confidence += 0.2;

        // Step 3: Find next-state logic
        const nextStateLogic = findNextStateLogic(module, stateReg.currentState);
        if (!nextStateLogic) {
            errors.push('Could not find next-state combinational logic');
            return { fsm: null, success: false, errors, confidence };
        }
        confidence += 0.2;

        // Step 4: Extract transitions
        const transitions = extractTransitions(nextStateLogic, stateParams, stateReg.nextState);
        confidence += 0.2;

        // Step 5: Detect initial state from reset logic
        const initialStateName = findInitialStateFromAST(module, stateReg.currentState, stateParams);

        // Step 6: Build FSM structure
        const fsm = buildFSM(module, stateParams, transitions, initialStateName, stateReg);
        confidence += 0.2;

        // Step 7: Apply auto-layout
        applyAutoLayout(fsm);

        return { fsm, success: true, errors, confidence: Math.min(confidence, 1) };
    } catch (e) {
        errors.push(`Extraction error: ${e instanceof Error ? e.message : 'Unknown error'}`);
        return { fsm: null, success: false, errors, confidence: 0 };
    }
}

interface StateParam {
    name: string;
    value: string; // Binary string "00"
    width: number;
}

interface StateRegInfo {
    currentState: string;
    nextState: string;
}

/**
 * Find localparam declarations that look like state definitions
 * e.g., localparam [1:0] IDLE = 2'b00;
 */
export function findStateParams(module: VerilogModule): StateParam[] {
    const params: StateParam[] = [];

    // Check declarations array
    for (const decl of module.declarations) {
        if (decl.type === 'LocalparamDeclaration') {
            const lp = decl as LocalparamDeclaration;
            // Check value
            const val = evaluateExpression(lp.value);
            if (val && val.base === 'binary') {
                params.push({
                    name: lp.name,
                    value: val.value,
                    width: val.width || 1,
                });
            }
        }
    }

    return params;
}

/**
 * Find state register by looking for sequential always blocks
 * that assign to a reg that matches state param width
 */
export function findStateRegister(module: VerilogModule, stateParams: StateParam[]): StateRegInfo | null {
    if (stateParams.length === 0) return null;

    const expectedWidth = stateParams[0].width;

    // Find reg declarations with matching width
    const stateRegs: string[] = [];
    for (const decl of module.declarations) {
        if (decl.type === 'RegDeclaration') {
            const reg = decl as RegDeclaration;
            // Calculate width from range
            const width = calculateWidth(reg.width);
            if (width === expectedWidth) {
                stateRegs.push(...reg.names);
            }
        }
    }

    // Look for sequential always block that assigns to state reg
    for (const block of module.alwaysBlocks) {
        if (block.blockType === 'sequential') {
            const assigned = findAssignedSignals(block.body);

            // Look for current_state <= something pattern
            for (const reg of stateRegs) {
                if (assigned.has(reg)) {
                    // Found state register, now find next_state
                    const nextState = findNextStateSignal(stateRegs, reg);
                    if (nextState) {
                        return { currentState: reg, nextState };
                    }
                }
            }
        }
    }

    // Fallback: guess common names
    if (stateRegs.includes('current_state') && stateRegs.includes('next_state')) {
        return { currentState: 'current_state', nextState: 'next_state' };
    }
    if (stateRegs.includes('state') && stateRegs.includes('next_state')) {
        return { currentState: 'state', nextState: 'next_state' };
    }

    return null;
}

/**
 * Find the next-state combinational logic block
 */
export function findNextStateLogic(module: VerilogModule, currentState: string): CaseStatement | null {
    for (const block of module.alwaysBlocks) {
        if (block.blockType === 'combinational') {
            const caseStmt = findCaseOnSignal(block.body, currentState);
            if (caseStmt) {
                return caseStmt;
            }
        }
    }
    return null;
}

/**
 * Extract transitions from case statement
 */
export function extractTransitions(
    caseStmt: CaseStatement,
    stateParams: StateParam[],
    nextStateSignal: string
): Array<{ from: string; to: string; condition: string }> {
    const transitions: Array<{ from: string; to: string; condition: string }> = [];
    const stateNames = new Set(stateParams.map(p => p.name));

    for (const caseItem of caseStmt.items) {
        if (caseItem.conditions === 'default') continue;

        // The case value is the "from" state
        // Assuming simple Identifiers for now
        const firstCond = caseItem.conditions[0];
        if (firstCond.type !== 'Identifier') continue;

        const fromState = (firstCond as IdentifierExpr).name;
        if (!stateNames.has(fromState)) continue;

        // Find assignments to next_state in the case body
        const bodyTransitions = extractBodyTransitions(caseItem.statements, nextStateSignal, stateNames);

        for (const { to, condition } of bodyTransitions) {
            transitions.push({ from: fromState, to, condition });
        }
    }

    return transitions;
}

/**
 * Extract transitions from a case body
 */
function extractBodyTransitions(
    statements: Statement[],
    nextStateSignal: string,
    stateNames: Set<string>
): Array<{ to: string; condition: string }> {
    const transitions: Array<{ to: string; condition: string }> = [];

    for (const stmt of statements) {
        if (stmt.type === 'BlockingAssignment' || stmt.type === 'NonBlockingAssignment') {
            // Direct assignment: next_state = STATE_X
            const assignment = stmt as BlockingAssignment; // or NonBlocking
            const target = getIdentifierName(assignment.lhs);

            if (target === nextStateSignal) {
                const value = getIdentifierName(assignment.rhs);
                if (value && stateNames.has(value)) {
                    transitions.push({ to: value, condition: "1'b1" });
                }
            }
        } else if (stmt.type === 'If') {
            // Conditional: if (cond) next_state = STATE_X
            const ifStmt = stmt as IfStatement;
            const condStr = expressionToString(ifStmt.condition);

            // Then branch
            const thenStmts = Array.isArray(ifStmt.thenBranch) ? ifStmt.thenBranch : [ifStmt.thenBranch];
            const ifTransitions = extractBodyTransitions(thenStmts, nextStateSignal, stateNames);

            for (const t of ifTransitions) {
                transitions.push({ to: t.to, condition: condStr });
            }

            // Else branch
            if (ifStmt.elseBranch) {
                const elseStmts = Array.isArray(ifStmt.elseBranch) ? ifStmt.elseBranch : [ifStmt.elseBranch];
                const elseTransitions = extractBodyTransitions(elseStmts, nextStateSignal, stateNames);
                for (const t of elseTransitions) {
                    // Logic would be !condStr, but for now we simplify
                    transitions.push({ to: t.to, condition: `!(${condStr})` });
                }
            }
        } else if (stmt.type === 'BeginEnd') {
            transitions.push(...extractBodyTransitions(stmt.statements, nextStateSignal, stateNames));
        }
    }

    return transitions;
}

/**
 * Find initial state from reset logic (AST analysis)
 */
export function findInitialStateFromAST(
    module: VerilogModule,
    currentState: string,
    stateParams: StateParam[]
): string | null {
    const stateNames = new Set(stateParams.map(p => p.name));

    // Look in sequential always blocks for reset assignments
    for (const block of module.alwaysBlocks) {
        if (block.blockType === 'sequential') {
            const resetAssignment = findResetAssignment(block.body, currentState, stateNames);
            if (resetAssignment) {
                return resetAssignment;
            }
        }
    }

    return null;
}

/**
 * Build the final FSM structure
 */
function buildFSM(
    module: VerilogModule,
    stateParams: StateParam[],
    transitions: Array<{ from: string; to: string; condition: string }>,
    initialStateName: string | null,
    stateReg: StateRegInfo
): FSM {
    const fsm = createEmptyFSM(module.name);

    // Create states from params
    fsm.states = stateParams.map((param, index) =>
        createState(
            `state_${index}`,
            param.name,
            { x: 0, y: 0 },
            param.name === initialStateName
        )
    );

    // If no initial state found, mark first as initial
    if (!fsm.states.some(s => s.isInitial) && fsm.states.length > 0) {
        fsm.states[0].isInitial = true;
    }

    // Create state name to ID map
    const stateNameToId = new Map<string, string>();
    for (const state of fsm.states) {
        stateNameToId.set(state.name, state.id);
    }

    // Create transitions
    fsm.transitions = transitions.map((t, index) =>
        createTransition(
            `trans_${index}`,
            stateNameToId.get(t.from) || t.from,
            stateNameToId.get(t.to) || t.to,
            t.condition
        )
    );

    // Extract inputs/outputs from ports
    for (const port of module.ports) {
        const width = port.width ? calculateWidth(port.width) : 1;
        const signal: FSMSignal = {
            name: port.name,
            width,
            direction: port.direction === 'output' ? 'output' : 'input',
        };

        if (port.direction === 'output') {
            fsm.outputs.push(signal);
        } else if (port.direction === 'input') {
            // Skip clock and reset
            if (!isClockOrReset(port.name)) {
                fsm.inputs.push(signal);
            } else if (isClockSignal(port.name)) {
                fsm.clock = port.name;
            } else if (isResetSignal(port.name)) {
                fsm.reset = port.name;
            }
        }
    }

    // Detect encoding from state values
    fsm.encoding = detectEncoding(stateParams);

    return fsm;
}

/**
 * Apply auto-layout to position states
 */
export function applyAutoLayout(fsm: FSM): void {
    const n = fsm.states.length;
    if (n === 0) return;

    const radius = Math.max(150, n * 40);
    const centerX = 300;
    const centerY = 300;

    // Arrange states in a circle
    fsm.states.forEach((state, index) => {
        const angle = (2 * Math.PI * index) / n - Math.PI / 2;
        state.position.x = centerX + radius * Math.cos(angle);
        state.position.y = centerY + radius * Math.sin(angle);
    });
}

// ==================== Helper Functions ====================

function calculateWidth(range?: any): number {
    if (!range || !range.msb || !range.lsb) return 1;
    // Assuming simple number width for now, AST visitor returns Expressions
    const msb = evaluateExpression(range.msb);
    const lsb = evaluateExpression(range.lsb);
    if (msb && lsb) {
        return Math.abs(parseInt(msb.value) - parseInt(lsb.value)) + 1;
    }
    return 1; // Fallback
}

function evaluateExpression(expr: Expression): { value: string, width?: number, base?: string } | null {
    if (expr.type === 'Number') {
        const num = expr as NumberExpr;
        return { value: num.value, width: num.width, base: num.base };
    }
    // Handle others if needed
    return null;
}

function getIdentifierName(expr: Expression): string | null {
    if (expr.type === 'Identifier') {
        return (expr as IdentifierExpr).name;
    }
    return null;
}

function expressionToString(expr: Expression): string {
    if (expr.type === 'Identifier') {
        return (expr as IdentifierExpr).name;
    }
    if (expr.type === 'Number') {
        const n = expr as NumberExpr;
        if (n.base === 'binary') return `${n.width}'b${n.value}`;
        return n.value;
    }
    // Very basic
    return 'expr';
}

function findAssignedSignals(stmt: Statement | Statement[]): Set<string> {
    const assigned = new Set<string>();
    const statements = Array.isArray(stmt) ? stmt : [stmt];

    for (const s of statements) {
        if (s.type === 'BlockingAssignment' || s.type === 'NonBlockingAssignment') {
            const name = getIdentifierName((s as BlockingAssignment).lhs);
            if (name) assigned.add(name);
        } else if (s.type === 'If') {
            const ifStmt = s as IfStatement;
            if (ifStmt.thenBranch) {
                const nested = findAssignedSignals(ifStmt.thenBranch);
                nested.forEach(n => assigned.add(n));
            }
            if (ifStmt.elseBranch) {
                const nested = findAssignedSignals(ifStmt.elseBranch);
                nested.forEach(n => assigned.add(n));
            }
        } else if (s.type === 'BeginEnd') {
            const nested = findAssignedSignals(s.statements);
            nested.forEach(n => assigned.add(n));
        }
    }

    return assigned;
}

function findNextStateSignal(regs: string[], currentState: string): string | null {
    if (currentState === 'current_state' && regs.includes('next_state')) return 'next_state';
    if (currentState === 'state' && regs.includes('next_state')) return 'next_state';
    if (currentState.endsWith('_reg') && regs.includes(currentState.replace('_reg', '_next'))) {
        return currentState.replace('_reg', '_next');
    }
    return regs.find(r => r !== currentState) || null;
}

function findCaseOnSignal(stmt: Statement | Statement[], signal: string): CaseStatement | null {
    const statements = Array.isArray(stmt) ? stmt : [stmt];

    for (const s of statements) {
        if (s.type === 'Case') {
            const cs = s as CaseStatement;
            const exprName = getIdentifierName(cs.expression);
            if (exprName === signal) return cs;
        } else if (s.type === 'BeginEnd') {
            const res = findCaseOnSignal(s.statements, signal);
            if (res) return res;
        }
    }
    return null;
}

function findResetAssignment(stmt: Statement | Statement[], stateSignal: string, stateNames: Set<string>): string | null {
    const statements = Array.isArray(stmt) ? stmt : [stmt];

    for (const s of statements) {
        if (s.type === 'If') {
            const ifStmt = s as IfStatement;
            const cond = expressionToString(ifStmt.condition);
            if (isResetCondition(cond)) {
                const assignments = findAssignmentsTo(ifStmt.thenBranch, stateSignal);
                for (const val of assignments) {
                    if (stateNames.has(val)) return val;
                }
            }
        } else if (s.type === 'BeginEnd') {
            const res = findResetAssignment(s.statements, stateSignal, stateNames);
            if (res) return res;
        }
    }
    return null;
}

function findAssignmentsTo(stmt: Statement | Statement[], target: string): string[] {
    const values: string[] = [];
    const statements = Array.isArray(stmt) ? stmt : [stmt];

    for (const s of statements) {
        if (s.type === 'NonBlockingAssignment' || s.type === 'BlockingAssignment') {
            const assign = s as BlockingAssignment;
            if (getIdentifierName(assign.lhs) === target) {
                const val = getIdentifierName(assign.rhs);
                if (val) values.push(val);
            }
        } else if (s.type === 'BeginEnd') {
            values.push(...findAssignmentsTo(s.statements, target));
        }
    }
    return values;
}

function isResetCondition(condition: string): boolean {
    if (!condition) return false;
    const lower = condition.toLowerCase();
    return lower.includes('rst') || lower.includes('reset');
}

function isClockOrReset(name: string): boolean {
    return isClockSignal(name) || isResetSignal(name);
}

function isClockSignal(name: string): boolean {
    const lower = name.toLowerCase();
    return lower === 'clk' || lower === 'clock' || lower.endsWith('_clk');
}

function isResetSignal(name: string): boolean {
    const lower = name.toLowerCase();
    return lower === 'rst' || lower === 'reset' || lower === 'rst_n' || lower === 'reset_n';
}

function detectEncoding(params: StateParam[]): 'binary' | 'onehot' | 'gray' {
    if (params.length <= 1) return 'binary';
    // Check for one-hot (each value has exactly one bit set)
    const isOneHot = params.every(p => {
        const ones = p.value.split('').filter(c => c === '1').length;
        return ones === 1;
    });
    if (isOneHot) return 'onehot';
    return 'binary';
}
