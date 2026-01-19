/**
 * State Encoding Utilities
 * 
 * Functions for encoding FSM states using different strategies:
 * - Binary: log2(N) bits for N states (most compact)
 * - One-hot: N bits for N states (fastest, one flip-flop per state)
 * - Gray: log2(N) bits with single-bit transitions (glitch-free)
 */

import type { FSMState, EncodedState, StateEncoding } from './types';

/**
 * Calculate the number of bits needed for binary encoding
 */
export function getBinaryWidth(stateCount: number): number {
    if (stateCount <= 0) return 0;
    if (stateCount === 1) return 1;
    return Math.ceil(Math.log2(stateCount));
}

/**
 * Calculate the number of bits needed for a given encoding
 */
export function getEncodingWidth(stateCount: number, encoding: StateEncoding): number {
    if (stateCount <= 0) return 0;

    switch (encoding) {
        case 'binary':
        case 'gray':
            return getBinaryWidth(stateCount);
        case 'onehot':
            return stateCount;
        default:
            return getBinaryWidth(stateCount);
    }
}

/**
 * Convert a number to binary string with specified width
 */
export function toBinaryString(value: number, width: number): string {
    return value.toString(2).padStart(width, '0');
}

/**
 * Convert binary to Gray code
 * Gray code ensures only one bit changes between consecutive values
 */
export function binaryToGray(binary: number): number {
    return binary ^ (binary >> 1);
}

/**
 * Convert Gray code back to binary
 */
export function grayToBinary(gray: number): number {
    let binary = gray;
    let mask = gray >> 1;
    while (mask !== 0) {
        binary ^= mask;
        mask >>= 1;
    }
    return binary;
}

/**
 * Encode states using binary encoding
 * States are numbered sequentially: 0, 1, 2, ...
 */
export function binaryEncode(states: FSMState[]): EncodedState[] {
    if (states.length === 0) return [];

    const width = getBinaryWidth(states.length);

    return states.map((state, index) => ({
        id: state.id,
        name: state.name,
        value: toBinaryString(index, width),
        width,
    }));
}

/**
 * Encode states using one-hot encoding
 * Each state has exactly one bit set: 001, 010, 100, ...
 */
export function oneHotEncode(states: FSMState[]): EncodedState[] {
    if (states.length === 0) return [];

    const width = states.length;

    return states.map((state, index) => {
        // Create one-hot value: bit at position (width - 1 - index) is set
        const value = '0'.repeat(index) + '1' + '0'.repeat(width - index - 1);
        return {
            id: state.id,
            name: state.name,
            value,
            width,
        };
    });
}

/**
 * Encode states using Gray code encoding
 * Consecutive states differ by only one bit
 */
export function grayEncode(states: FSMState[]): EncodedState[] {
    if (states.length === 0) return [];

    const width = getBinaryWidth(states.length);

    return states.map((state, index) => {
        const grayValue = binaryToGray(index);
        return {
            id: state.id,
            name: state.name,
            value: toBinaryString(grayValue, width),
            width,
        };
    });
}

/**
 * Encode states using the specified encoding strategy
 */
export function encodeStates(states: FSMState[], encoding: StateEncoding): EncodedState[] {
    switch (encoding) {
        case 'binary':
            return binaryEncode(states);
        case 'onehot':
            return oneHotEncode(states);
        case 'gray':
            return grayEncode(states);
        default:
            return binaryEncode(states);
    }
}

/**
 * Generate Verilog localparam declaration for encoded state
 */
export function generateStateParam(encoded: EncodedState): string {
    return `localparam [${encoded.width - 1}:0] ${encoded.name} = ${encoded.width}'b${encoded.value};`;
}

/**
 * Generate all state parameter declarations
 */
export function generateStateParams(states: FSMState[], encoding: StateEncoding): string[] {
    const encoded = encodeStates(states, encoding);
    return encoded.map(generateStateParam);
}

/**
 * Find the initial state from a list of states
 */
export function findInitialState(states: FSMState[]): FSMState | undefined {
    return states.find(s => s.isInitial);
}

/**
 * Get encoded value for a specific state
 */
export function getEncodedValue(
    stateId: string,
    states: FSMState[],
    encoding: StateEncoding
): EncodedState | undefined {
    const encoded = encodeStates(states, encoding);
    return encoded.find(e => e.id === stateId);
}

/**
 * Validate that encoding is appropriate for the number of states
 * Returns warnings if one-hot might be inefficient for many states
 */
export function validateEncoding(
    stateCount: number,
    encoding: StateEncoding
): { valid: boolean; warning?: string } {
    if (stateCount === 0) {
        return { valid: false, warning: 'FSM has no states' };
    }

    if (encoding === 'onehot' && stateCount > 16) {
        return {
            valid: true,
            warning: `One-hot encoding with ${stateCount} states requires ${stateCount} flip-flops. Consider binary or gray encoding.`,
        };
    }

    return { valid: true };
}
