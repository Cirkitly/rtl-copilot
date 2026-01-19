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

import type { VerilogModule, Statement, AlwaysBlock, CaseStatement } from '../verilog/types';
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
        const initialStateName = findInitialState(module, stateReg.currentState, stateParams);

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
    value: string;
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

    for (const decl of module.declarations) {
        if (decl.declarationType === 'localparam') {
            // Check if it has a binary value
            for (const item of decl.variables) {
                if (item.initialValue) {
                    const match = item.initialValue.match(/(\d+)'b([01]+)/);
                    if (match) {
                        params.push({
                            name: item.name,
                            value: match[2],
                            width: parseInt(match[1], 10),
                        });
                    }
                }
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
        if (decl.declarationType === 'reg') {
            const declWidth = calculateWidth(decl.range);
            if (declWidth === expectedWidth) {
                stateRegs.push(...decl.variables.map(v => v.name));
            }
        }
    }

    // Look for sequential always block that assigns to state reg
    for (const stmt of module.statements) {
        if (stmt.statementType === 'always' && isSequentialBlock(stmt as AlwaysBlock)) {
            const always = stmt as AlwaysBlock;
            const assigned = findAssignedSignals(always.body);

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
    for (const stmt of module.statements) {
        if (stmt.statementType === 'always' && !isSequentialBlock(stmt as AlwaysBlock)) {
            const always = stmt as AlwaysBlock;
            const caseStmt = findCaseOnSignal(always.body, currentState);
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

    for (const caseItem of caseStmt.cases) {
        if (caseItem.isDefault) continue;

        // The case value is the "from" state
        const fromState = caseItem.values[0];
        if (!fromState || !stateNames.has(fromState)) continue;

        // Find assignments to next_state in the case body
        const bodyTransitions = extractBodyTransitions(caseItem.body, nextStateSignal, stateNames);

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
        if (stmt.statementType === 'blocking_assignment' || stmt.statementType === 'assignment') {
            // Direct assignment: next_state = STATE_X
            const assignment = stmt as any;
            if (assignment.target === nextStateSignal && stateNames.has(assignment.value)) {
                transitions.push({ to: assignment.value, condition: "1'b1" });
            }
        } else if (stmt.statementType === 'if') {
            // Conditional: if (cond) next_state = STATE_X
            const ifStmt = stmt as any;
            const ifTransitions = extractBodyTransitions([ifStmt.thenBlock], nextStateSignal, stateNames);
            for (const t of ifTransitions) {
                transitions.push({ to: t.to, condition: ifStmt.condition || "1'b1" });
            }

            if (ifStmt.elseBlock) {
                const elseTransitions = extractBodyTransitions([ifStmt.elseBlock], nextStateSignal, stateNames);
                for (const t of elseTransitions) {
                    // The else condition is the negation, but we simplify
                    transitions.push({ to: t.to, condition: t.condition });
                }
            }
        }
    }

    return transitions;
}

/**
 * Find initial state from reset logic
 */
export function findInitialState(
    module: VerilogModule,
    currentState: string,
    stateParams: StateParam[]
): string | null {
    const stateNames = new Set(stateParams.map(p => p.name));

    // Look in sequential always blocks for reset assignments
    for (const stmt of module.statements) {
        if (stmt.statementType === 'always' && isSequentialBlock(stmt as AlwaysBlock)) {
            const always = stmt as AlwaysBlock;
            const resetAssignment = findResetAssignment(always.body, currentState, stateNames);
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
        const signal: FSMSignal = {
            name: port.name,
            width: calculateWidth(port.range),
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

function calculateWidth(range?: { msb: number; lsb: number }): number {
    if (!range) return 1;
    return Math.abs(range.msb - range.lsb) + 1;
}

function isSequentialBlock(always: AlwaysBlock): boolean {
    // Check sensitivity list for posedge/negedge
    return always.sensitivity.some(s => s.edge === 'posedge' || s.edge === 'negedge');
}

function findAssignedSignals(statements: Statement[]): Set<string> {
    const assigned = new Set<string>();

    for (const stmt of statements) {
        if (stmt.statementType === 'nonblocking_assignment' ||
            stmt.statementType === 'blocking_assignment') {
            const assignment = stmt as any;
            if (assignment.target) {
                assigned.add(assignment.target);
            }
        } else if (stmt.statementType === 'if') {
            const ifStmt = stmt as any;
            if (ifStmt.thenBlock) {
                for (const s of findAssignedSignals(Array.isArray(ifStmt.thenBlock) ? ifStmt.thenBlock : [ifStmt.thenBlock])) {
                    assigned.add(s);
                }
            }
            if (ifStmt.elseBlock) {
                for (const s of findAssignedSignals(Array.isArray(ifStmt.elseBlock) ? ifStmt.elseBlock : [ifStmt.elseBlock])) {
                    assigned.add(s);
                }
            }
        }
    }

    return assigned;
}

function findNextStateSignal(regs: string[], currentState: string): string | null {
    // Common patterns
    if (currentState === 'current_state' && regs.includes('next_state')) {
        return 'next_state';
    }
    if (currentState === 'state' && regs.includes('next_state')) {
        return 'next_state';
    }
    if (currentState.endsWith('_reg') && regs.includes(currentState.replace('_reg', '_next'))) {
        return currentState.replace('_reg', '_next');
    }

    // Return any other reg that's not the current state
    return regs.find(r => r !== currentState) || null;
}

function findCaseOnSignal(statements: Statement[], signal: string): CaseStatement | null {
    for (const stmt of statements) {
        if (stmt.statementType === 'case') {
            const caseStmt = stmt as CaseStatement;
            if (caseStmt.expression === signal) {
                return caseStmt;
            }
        }
    }
    return null;
}

function findResetAssignment(
    statements: Statement[],
    stateSignal: string,
    stateNames: Set<string>
): string | null {
    for (const stmt of statements) {
        if (stmt.statementType === 'if') {
            const ifStmt = stmt as any;
            // Look for reset condition (rst, reset, !rst_n)
            if (isResetCondition(ifStmt.condition)) {
                const assignments = findAssignmentsTo(
                    Array.isArray(ifStmt.thenBlock) ? ifStmt.thenBlock : [ifStmt.thenBlock],
                    stateSignal
                );
                for (const value of assignments) {
                    if (stateNames.has(value)) {
                        return value;
                    }
                }
            }
        }
    }
    return null;
}

function findAssignmentsTo(statements: Statement[], target: string): string[] {
    const values: string[] = [];

    for (const stmt of statements) {
        if (stmt.statementType === 'nonblocking_assignment' ||
            stmt.statementType === 'blocking_assignment') {
            const assignment = stmt as any;
            if (assignment.target === target && assignment.value) {
                values.push(assignment.value);
            }
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

    // Check for gray (adjacent values differ by one bit)
    const isGray = params.every((p, i) => {
        if (i === 0) return true;
        const prev = parseInt(params[i - 1].value, 2);
        const curr = parseInt(p.value, 2);
        const diff = prev ^ curr;
        return (diff & (diff - 1)) === 0 && diff !== 0;
    });
    if (isGray) return 'gray';

    return 'binary';
}
