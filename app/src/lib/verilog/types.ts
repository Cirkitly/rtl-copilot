/**
 * Verilog AST Types
 * TypeScript interfaces for the Abstract Syntax Tree
 */

// ============================================================================
// Base Types
// ============================================================================
export interface SourceLocation {
    startLine: number
    startColumn: number
    endLine: number
    endColumn: number
}

export interface ASTNode {
    type: string
    location?: SourceLocation
}

// ============================================================================
// Expressions
// ============================================================================
export interface IdentifierExpr extends ASTNode {
    type: 'Identifier'
    name: string
}

export interface NumberExpr extends ASTNode {
    type: 'Number'
    value: string
    width?: number
    base?: 'binary' | 'octal' | 'decimal' | 'hex'
}

export interface BinaryExpr extends ASTNode {
    type: 'BinaryExpr'
    operator: string
    left: Expression
    right: Expression
}

export interface UnaryExpr extends ASTNode {
    type: 'UnaryExpr'
    operator: string
    operand: Expression
}

export interface TernaryExpr extends ASTNode {
    type: 'TernaryExpr'
    condition: Expression
    ifTrue: Expression
    ifFalse: Expression
}

export interface ConcatExpr extends ASTNode {
    type: 'Concat'
    elements: Expression[]
}

export interface ReplicationExpr extends ASTNode {
    type: 'Replication'
    count: Expression
    elements: Expression[]
}

export interface BitSelectExpr extends ASTNode {
    type: 'BitSelect'
    signal: Expression
    index: Expression
}

export interface RangeSelectExpr extends ASTNode {
    type: 'RangeSelect'
    signal: Expression
    msb: Expression
    lsb: Expression
}

export type Expression =
    | IdentifierExpr
    | NumberExpr
    | BinaryExpr
    | UnaryExpr
    | TernaryExpr
    | ConcatExpr
    | ReplicationExpr
    | BitSelectExpr
    | RangeSelectExpr

// ============================================================================
// Declarations
// ============================================================================
export interface PortDeclaration extends ASTNode {
    type: 'PortDeclaration'
    direction: 'input' | 'output' | 'inout'
    portType?: 'wire' | 'reg'
    width?: Range
    name: string
}

export interface WireDeclaration extends ASTNode {
    type: 'WireDeclaration'
    width?: Range
    names: string[]
}

export interface RegDeclaration extends ASTNode {
    type: 'RegDeclaration'
    width?: Range
    names: string[]
    array?: Range
}

export interface ParameterDeclaration extends ASTNode {
    type: 'ParameterDeclaration'
    name: string
    value: Expression
    width?: Range
}

export interface LocalparamDeclaration extends ASTNode {
    type: 'LocalparamDeclaration'
    name: string
    value: Expression
    width?: Range
}

export interface Range extends ASTNode {
    type: 'Range'
    msb: Expression
    lsb: Expression
}

export type Declaration =
    | WireDeclaration
    | RegDeclaration
    | ParameterDeclaration
    | LocalparamDeclaration

// ============================================================================
// Statements
// ============================================================================
export interface AssignStatement extends ASTNode {
    type: 'Assign'
    lhs: Expression
    rhs: Expression
}

export interface BlockingAssignment extends ASTNode {
    type: 'BlockingAssignment'
    lhs: Expression
    rhs: Expression
}

export interface NonBlockingAssignment extends ASTNode {
    type: 'NonBlockingAssignment'
    lhs: Expression
    rhs: Expression
}

export interface IfStatement extends ASTNode {
    type: 'If'
    condition: Expression
    thenBranch: Statement | Statement[]
    elseBranch?: Statement | Statement[]
}

export interface CaseItem extends ASTNode {
    type: 'CaseItem'
    conditions: Expression[] | 'default'
    statements: Statement[]
}

export interface CaseStatement extends ASTNode {
    type: 'Case'
    caseType: 'case' | 'casex' | 'casez'
    expression: Expression
    items: CaseItem[]
}

export interface BeginEnd extends ASTNode {
    type: 'BeginEnd'
    label?: string
    statements: Statement[]
}

export type Statement =
    | AssignStatement
    | BlockingAssignment
    | NonBlockingAssignment
    | IfStatement
    | CaseStatement
    | BeginEnd

// ============================================================================
// Always Blocks
// ============================================================================
export interface SensitivityItem extends ASTNode {
    type: 'SensitivityItem'
    edge?: 'posedge' | 'negedge'
    signal: string
}

export interface AlwaysBlock extends ASTNode {
    type: 'AlwaysBlock'
    blockType: 'combinational' | 'sequential'
    sensitivity: SensitivityItem[] | '*'
    body: Statement | Statement[]
}

export interface InitialBlock extends ASTNode {
    type: 'InitialBlock'
    body: Statement | Statement[]
}

// ============================================================================
// Module
// ============================================================================
export interface VerilogModule extends ASTNode {
    type: 'Module'
    name: string
    ports: PortDeclaration[]
    parameters: ParameterDeclaration[]
    declarations: Declaration[]
    alwaysBlocks: AlwaysBlock[]
    initialBlocks: InitialBlock[]
    assigns: AssignStatement[]
    submodules: SubmoduleInstance[]
}

export interface SubmoduleInstance extends ASTNode {
    type: 'SubmoduleInstance'
    moduleName: string
    instanceName: string
    parameters?: PortConnection[]
    ports: PortConnection[]
}

export interface PortConnection extends ASTNode {
    type: 'PortConnection'
    portName?: string  // Named connection
    expression: Expression
}

// ============================================================================
// FSM-Specific Types
// ============================================================================
export interface FSMState {
    name: string
    value: string
    encoding: 'binary' | 'onehot' | 'gray'
}

export interface FSMTransition {
    from: string
    to: string
    condition: Expression
}

export interface FSMInfo {
    stateReg: string
    nextStateReg?: string
    states: FSMState[]
    transitions: FSMTransition[]
    encoding: 'binary' | 'onehot' | 'gray'
    type: 'moore' | 'mealy' | 'mixed'
}
