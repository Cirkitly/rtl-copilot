/**
 * FSM → Verilog Generator
 * 
 * Generates synthesizable Verilog code from FSM representation.
 * Supports binary, one-hot, and gray state encodings with
 * configurable reset polarity and output styles.
 */

import type {
    FSM,
    FSMState,
    FSMTransition,
    FSMGeneratorOptions,
    SignalAssignment,
} from './types';
import { encodeStates, getEncodingWidth, findInitialState } from './encoding';

const DEFAULT_OPTIONS: Required<FSMGeneratorOptions> = {
    includeComments: true,
    indent: '  ',
    syncReset: false,
    stateRegName: 'current_state',
    nextStateName: 'next_state',
};

/**
 * Generate complete Verilog module from FSM
 */
export function generateFSMVerilog(fsm: FSM, options?: FSMGeneratorOptions): string {
    const opts = { ...DEFAULT_OPTIONS, ...options };
    const lines: string[] = [];
    const i = opts.indent;

    // Encode states
    const encodedStates = encodeStates(fsm.states, fsm.encoding);
    const stateWidth = getEncodingWidth(fsm.states.length, fsm.encoding);
    const initialState = findInitialState(fsm.states);

    if (!initialState) {
        throw new Error('FSM must have an initial state');
    }

    const initialEncoded = encodedStates.find(e => e.id === initialState.id);
    if (!initialEncoded) {
        throw new Error('Failed to encode initial state');
    }

    // Module header
    if (opts.includeComments) {
        lines.push(`// FSM: ${fsm.name}`);
        lines.push(`// Encoding: ${fsm.encoding}`);
        lines.push(`// States: ${fsm.states.length}`);
        lines.push('');
    }

    lines.push(`module ${fsm.name} (`);

    // Port list
    const ports: string[] = [];
    ports.push(`${i}input wire ${fsm.clock},`);
    ports.push(`${i}input wire ${fsm.reset},`);

    // Input signals
    for (const input of fsm.inputs) {
        const widthSpec = input.width > 1 ? `[${input.width - 1}:0] ` : '';
        ports.push(`${i}input wire ${widthSpec}${input.name},`);
    }

    // Output signals
    for (let idx = 0; idx < fsm.outputs.length; idx++) {
        const output = fsm.outputs[idx];
        const widthSpec = output.width > 1 ? `[${output.width - 1}:0] ` : '';
        const comma = idx < fsm.outputs.length - 1 ? ',' : '';
        ports.push(`${i}output reg ${widthSpec}${output.name}${comma}`);
    }

    lines.push(...ports);
    lines.push(');');
    lines.push('');

    // State encoding parameters
    if (opts.includeComments) {
        lines.push(`${i}// State encoding`);
    }

    for (const encoded of encodedStates) {
        lines.push(`${i}localparam [${stateWidth - 1}:0] ${encoded.name} = ${stateWidth}'b${encoded.value};`);
    }
    lines.push('');

    // State registers
    if (opts.includeComments) {
        lines.push(`${i}// State registers`);
    }
    lines.push(`${i}reg [${stateWidth - 1}:0] ${opts.stateRegName}, ${opts.nextStateName};`);
    lines.push('');

    // State register (sequential logic)
    if (opts.includeComments) {
        lines.push(`${i}// State register with ${opts.syncReset ? 'synchronous' : 'asynchronous'} reset`);
    }

    const resetCondition = fsm.resetPolarity === 'high' ? fsm.reset : `!${fsm.reset}`;
    const resetEdge = fsm.resetPolarity === 'high' ? 'posedge' : 'negedge';

    if (opts.syncReset) {
        lines.push(`${i}always @(posedge ${fsm.clock}) begin`);
        lines.push(`${i}${i}if (${resetCondition})`);
    } else {
        lines.push(`${i}always @(posedge ${fsm.clock} or ${resetEdge} ${fsm.reset}) begin`);
        lines.push(`${i}${i}if (${resetCondition})`);
    }

    lines.push(`${i}${i}${i}${opts.stateRegName} <= ${initialEncoded.name};`);
    lines.push(`${i}${i}else`);
    lines.push(`${i}${i}${i}${opts.stateRegName} <= ${opts.nextStateName};`);
    lines.push(`${i}end`);
    lines.push('');

    // Next state logic (combinational)
    if (opts.includeComments) {
        lines.push(`${i}// Next state logic`);
    }
    lines.push(`${i}always @(*) begin`);
    lines.push(`${i}${i}${opts.nextStateName} = ${opts.stateRegName}; // Default: stay in current state`);
    lines.push(`${i}${i}case (${opts.stateRegName})`);

    for (const state of fsm.states) {
        const stateEncoded = encodedStates.find(e => e.id === state.id);
        if (!stateEncoded) continue;

        const outgoingTransitions = fsm.transitions.filter(t => t.from === state.id);

        lines.push(`${i}${i}${i}${stateEncoded.name}: begin`);

        if (outgoingTransitions.length === 0) {
            if (opts.includeComments) {
                lines.push(`${i}${i}${i}${i}// No transitions - stay in state`);
            }
        } else {
            // Generate if-else chain for transitions
            for (let tIdx = 0; tIdx < outgoingTransitions.length; tIdx++) {
                const trans = outgoingTransitions[tIdx];
                const targetEncoded = encodedStates.find(e => e.id === trans.to);

                if (!targetEncoded) continue;

                const keyword = tIdx === 0 ? 'if' : 'else if';
                const condition = trans.condition === "1'b1" || trans.condition === '1'
                    ? null
                    : trans.condition;

                if (condition === null && tIdx === 0 && outgoingTransitions.length === 1) {
                    // Unconditional single transition
                    lines.push(`${i}${i}${i}${i}${opts.nextStateName} = ${targetEncoded.name};`);
                } else if (condition === null) {
                    // Default transition (else case)
                    if (tIdx > 0) {
                        lines.push(`${i}${i}${i}${i}else`);
                        lines.push(`${i}${i}${i}${i}${i}${opts.nextStateName} = ${targetEncoded.name};`);
                    } else {
                        lines.push(`${i}${i}${i}${i}${opts.nextStateName} = ${targetEncoded.name};`);
                    }
                } else {
                    lines.push(`${i}${i}${i}${i}${keyword} (${condition})`);
                    lines.push(`${i}${i}${i}${i}${i}${opts.nextStateName} = ${targetEncoded.name};`);
                }
            }
        }

        lines.push(`${i}${i}${i}end`);
    }

    lines.push(`${i}${i}${i}default: ${opts.nextStateName} = ${initialEncoded.name};`);
    lines.push(`${i}${i}endcase`);
    lines.push(`${i}end`);
    lines.push('');

    // Output logic (Moore outputs based on state)
    if (fsm.outputs.length > 0) {
        if (opts.includeComments) {
            lines.push(`${i}// Output logic`);
        }
        lines.push(`${i}always @(*) begin`);

        // Default output values
        if (opts.includeComments) {
            lines.push(`${i}${i}// Default values`);
        }
        for (const output of fsm.outputs) {
            const defaultVal = output.defaultValue || (output.width > 1 ? `${output.width}'b0` : "1'b0");
            lines.push(`${i}${i}${output.name} = ${defaultVal};`);
        }
        lines.push('');

        lines.push(`${i}${i}case (${opts.stateRegName})`);

        for (const state of fsm.states) {
            const stateEncoded = encodedStates.find(e => e.id === state.id);
            if (!stateEncoded) continue;

            // Collect outputs: Moore (from state) and Mealy (from transitions)
            const mooreOutputs = state.outputs;
            const outgoingTransitions = fsm.transitions.filter(t => t.from === state.id);

            if (mooreOutputs.length === 0 && !outgoingTransitions.some(t => t.actions.length > 0)) {
                continue; // Skip states with no output assignments
            }

            lines.push(`${i}${i}${i}${stateEncoded.name}: begin`);

            // Moore outputs (always active in this state)
            for (const output of mooreOutputs) {
                lines.push(`${i}${i}${i}${i}${output.signal} = ${output.value};`);
            }

            // Mealy outputs (conditional on transitions)
            for (const trans of outgoingTransitions) {
                if (trans.actions.length > 0) {
                    const condition = trans.condition === "1'b1" || trans.condition === '1'
                        ? null
                        : trans.condition;

                    if (condition) {
                        lines.push(`${i}${i}${i}${i}if (${condition}) begin`);
                        for (const action of trans.actions) {
                            lines.push(`${i}${i}${i}${i}${i}${action.signal} = ${action.value};`);
                        }
                        lines.push(`${i}${i}${i}${i}end`);
                    } else {
                        for (const action of trans.actions) {
                            lines.push(`${i}${i}${i}${i}${action.signal} = ${action.value};`);
                        }
                    }
                }
            }

            lines.push(`${i}${i}${i}end`);
        }

        lines.push(`${i}${i}${i}default: begin`);
        lines.push(`${i}${i}${i}${i}// Use default values`);
        lines.push(`${i}${i}${i}end`);
        lines.push(`${i}${i}endcase`);
        lines.push(`${i}end`);
        lines.push('');
    }

    lines.push('endmodule');

    return lines.join('\n');
}

/**
 * Generate just the state transition case block
 */
export function generateTransitionCase(
    fsm: FSM,
    state: FSMState,
    options?: FSMGeneratorOptions
): string[] {
    const opts = { ...DEFAULT_OPTIONS, ...options };
    const i = opts.indent;
    const lines: string[] = [];

    const encodedStates = encodeStates(fsm.states, fsm.encoding);
    const stateEncoded = encodedStates.find(e => e.id === state.id);

    if (!stateEncoded) return lines;

    const outgoingTransitions = fsm.transitions.filter(t => t.from === state.id);

    lines.push(`${stateEncoded.name}: begin`);

    for (let tIdx = 0; tIdx < outgoingTransitions.length; tIdx++) {
        const trans = outgoingTransitions[tIdx];
        const targetEncoded = encodedStates.find(e => e.id === trans.to);

        if (!targetEncoded) continue;

        const keyword = tIdx === 0 ? 'if' : 'else if';
        const condition = trans.condition === "1'b1" ? null : trans.condition;

        if (condition) {
            lines.push(`${i}${keyword} (${condition})`);
            lines.push(`${i}${i}${opts.nextStateName} = ${targetEncoded.name};`);
        } else {
            lines.push(`${i}${opts.nextStateName} = ${targetEncoded.name};`);
        }
    }

    lines.push('end');

    return lines;
}

/**
 * Build signal assignment string
 */
export function formatSignalAssignment(assignment: SignalAssignment): string {
    return `${assignment.signal} = ${assignment.value};`;
}
