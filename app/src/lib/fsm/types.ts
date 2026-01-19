/**
 * FSM Type Definitions
 * 
 * Core data structures for representing Finite State Machines
 * that can be visualized and converted to/from Verilog code.
 */

/**
 * Signal assignment for outputs
 */
export interface SignalAssignment {
    /** Signal name */
    signal: string;
    /** Assignment value (Verilog expression) */
    value: string;
}

/**
 * Position in 2D space for visual layout
 */
export interface Position {
    x: number;
    y: number;
}

/**
 * FSM State representation
 */
export interface FSMState {
    /** Unique identifier */
    id: string;
    /** Human-readable state name (e.g., "IDLE", "ACTIVE") */
    name: string;
    /** Position for visual layout */
    position: Position;
    /** Whether this is the initial/reset state */
    isInitial: boolean;
    /** Moore outputs - assigned when in this state */
    outputs: SignalAssignment[];
}

/**
 * FSM Transition between states
 */
export interface FSMTransition {
    /** Unique identifier */
    id: string;
    /** Source state ID */
    from: string;
    /** Destination state ID */
    to: string;
    /** Condition expression (Verilog syntax, e.g., "start && ready") */
    condition: string;
    /** Mealy outputs - assigned during this transition */
    actions: SignalAssignment[];
    /** Priority for overlapping conditions (lower = higher priority) */
    priority?: number;
}

/**
 * State encoding strategies
 */
export type StateEncoding = 'binary' | 'onehot' | 'gray';

/**
 * FSM type based on output behavior
 */
export type FSMType = 'moore' | 'mealy' | 'mixed';

/**
 * Complete FSM representation
 */
export interface FSM {
    /** Module name for generated Verilog */
    name: string;
    /** All states in the FSM */
    states: FSMState[];
    /** All transitions between states */
    transitions: FSMTransition[];
    /** Clock signal name */
    clock: string;
    /** Reset signal name */
    reset: string;
    /** Active-high or active-low reset */
    resetPolarity: 'high' | 'low';
    /** State encoding strategy */
    encoding: StateEncoding;
    /** FSM type (Moore/Mealy/Mixed) */
    fsmType: FSMType;
    /** Input signals used in conditions */
    inputs: FSMSignal[];
    /** Output signals assigned in states/transitions */
    outputs: FSMSignal[];
}

/**
 * Signal definition for FSM I/O
 */
export interface FSMSignal {
    /** Signal name */
    name: string;
    /** Bit width (1 for single bit) */
    width: number;
    /** Signal direction */
    direction: 'input' | 'output';
    /** Default value (for outputs) */
    defaultValue?: string;
}

/**
 * Encoded state value
 */
export interface EncodedState {
    /** State ID */
    id: string;
    /** State name */
    name: string;
    /** Encoded binary value */
    value: string;
    /** Bit width */
    width: number;
}

/**
 * FSM validation error
 */
export interface FSMValidationError {
    /** Error type */
    type:
    | 'unreachable-state'
    | 'dead-transition'
    | 'missing-initial'
    | 'duplicate-name'
    | 'missing-outgoing'
    | 'invalid-condition'
    | 'undefined-signal';
    /** Severity level */
    severity: 'error' | 'warning' | 'info';
    /** Human-readable message */
    message: string;
    /** Related state ID (if applicable) */
    stateId?: string;
    /** Related transition ID (if applicable) */
    transitionId?: string;
}

/**
 * FSM Generator options
 */
export interface FSMGeneratorOptions {
    /** Include comments in generated code */
    includeComments?: boolean;
    /** Indentation string (default: 2 spaces) */
    indent?: string;
    /** Use synchronous or asynchronous reset */
    syncReset?: boolean;
    /** State register name */
    stateRegName?: string;
    /** Next state wire name */
    nextStateName?: string;
}

/**
 * Result of FSM extraction from Verilog
 */
export interface FSMExtractionResult {
    /** Extracted FSM (null if extraction failed) */
    fsm: FSM | null;
    /** Extraction success */
    success: boolean;
    /** Errors encountered during extraction */
    errors: string[];
    /** Confidence score (0-1) */
    confidence: number;
}

/**
 * Create an empty FSM with default values
 */
export function createEmptyFSM(name: string = 'fsm'): FSM {
    return {
        name,
        states: [],
        transitions: [],
        clock: 'clk',
        reset: 'rst',
        resetPolarity: 'high',
        encoding: 'binary',
        fsmType: 'moore',
        inputs: [],
        outputs: [],
    };
}

/**
 * Create a new state with default values
 */
export function createState(
    id: string,
    name: string,
    position: Position = { x: 0, y: 0 },
    isInitial: boolean = false
): FSMState {
    return {
        id,
        name,
        position,
        isInitial,
        outputs: [],
    };
}

/**
 * Create a new transition with default values
 */
export function createTransition(
    id: string,
    from: string,
    to: string,
    condition: string = '1\'b1'
): FSMTransition {
    return {
        id,
        from,
        to,
        condition,
        actions: [],
    };
}
