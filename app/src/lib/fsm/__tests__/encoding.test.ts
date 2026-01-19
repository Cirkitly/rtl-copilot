/**
 * Tests for FSM State Encoding Utilities
 */

import { describe, it, expect } from 'vitest';
import {
    getBinaryWidth,
    getEncodingWidth,
    toBinaryString,
    binaryToGray,
    grayToBinary,
    binaryEncode,
    oneHotEncode,
    grayEncode,
    encodeStates,
    generateStateParam,
    generateStateParams,
    findInitialState,
    getEncodedValue,
    validateEncoding,
} from '../encoding';
import { createState } from '../types';
import type { FSMState } from '../types';

describe('State Encoding Utilities', () => {

    describe('getBinaryWidth', () => {
        it('should return 0 for 0 states', () => {
            expect(getBinaryWidth(0)).toBe(0);
        });

        it('should return 1 for 1 state', () => {
            expect(getBinaryWidth(1)).toBe(1);
        });

        it('should return 1 for 2 states', () => {
            expect(getBinaryWidth(2)).toBe(1);
        });

        it('should return 2 for 3-4 states', () => {
            expect(getBinaryWidth(3)).toBe(2);
            expect(getBinaryWidth(4)).toBe(2);
        });

        it('should return 3 for 5-8 states', () => {
            expect(getBinaryWidth(5)).toBe(3);
            expect(getBinaryWidth(8)).toBe(3);
        });

        it('should return 4 for 9-16 states', () => {
            expect(getBinaryWidth(9)).toBe(4);
            expect(getBinaryWidth(16)).toBe(4);
        });
    });

    describe('getEncodingWidth', () => {
        it('should return binary width for binary encoding', () => {
            expect(getEncodingWidth(4, 'binary')).toBe(2);
            expect(getEncodingWidth(8, 'binary')).toBe(3);
        });

        it('should return state count for one-hot encoding', () => {
            expect(getEncodingWidth(4, 'onehot')).toBe(4);
            expect(getEncodingWidth(8, 'onehot')).toBe(8);
        });

        it('should return binary width for gray encoding', () => {
            expect(getEncodingWidth(4, 'gray')).toBe(2);
            expect(getEncodingWidth(8, 'gray')).toBe(3);
        });

        it('should return 0 for 0 states', () => {
            expect(getEncodingWidth(0, 'binary')).toBe(0);
            expect(getEncodingWidth(0, 'onehot')).toBe(0);
            expect(getEncodingWidth(0, 'gray')).toBe(0);
        });
    });

    describe('toBinaryString', () => {
        it('should convert numbers to padded binary strings', () => {
            expect(toBinaryString(0, 2)).toBe('00');
            expect(toBinaryString(1, 2)).toBe('01');
            expect(toBinaryString(2, 2)).toBe('10');
            expect(toBinaryString(3, 2)).toBe('11');
        });

        it('should handle larger widths', () => {
            expect(toBinaryString(5, 4)).toBe('0101');
            expect(toBinaryString(15, 4)).toBe('1111');
        });
    });

    describe('Gray Code Conversion', () => {
        it('should convert binary to Gray code', () => {
            expect(binaryToGray(0)).toBe(0);  // 000 -> 000
            expect(binaryToGray(1)).toBe(1);  // 001 -> 001
            expect(binaryToGray(2)).toBe(3);  // 010 -> 011
            expect(binaryToGray(3)).toBe(2);  // 011 -> 010
            expect(binaryToGray(4)).toBe(6);  // 100 -> 110
            expect(binaryToGray(5)).toBe(7);  // 101 -> 111
            expect(binaryToGray(6)).toBe(5);  // 110 -> 101
            expect(binaryToGray(7)).toBe(4);  // 111 -> 100
        });

        it('should convert Gray code back to binary', () => {
            for (let i = 0; i < 16; i++) {
                expect(grayToBinary(binaryToGray(i))).toBe(i);
            }
        });

        it('should ensure only one bit changes between consecutive Gray codes', () => {
            for (let i = 0; i < 15; i++) {
                const g1 = binaryToGray(i);
                const g2 = binaryToGray(i + 1);
                const diff = g1 ^ g2;
                // Check that diff is a power of 2 (only one bit set)
                expect(diff & (diff - 1)).toBe(0);
                expect(diff).toBeGreaterThan(0);
            }
        });
    });

    describe('binaryEncode', () => {
        const states: FSMState[] = [
            createState('s0', 'IDLE', { x: 0, y: 0 }, true),
            createState('s1', 'ACTIVE'),
            createState('s2', 'WAIT'),
            createState('s3', 'DONE'),
        ];

        it('should encode states with binary values', () => {
            const encoded = binaryEncode(states);

            expect(encoded).toHaveLength(4);
            expect(encoded[0]).toEqual({ id: 's0', name: 'IDLE', value: '00', width: 2 });
            expect(encoded[1]).toEqual({ id: 's1', name: 'ACTIVE', value: '01', width: 2 });
            expect(encoded[2]).toEqual({ id: 's2', name: 'WAIT', value: '10', width: 2 });
            expect(encoded[3]).toEqual({ id: 's3', name: 'DONE', value: '11', width: 2 });
        });

        it('should handle single state', () => {
            const single = [createState('s0', 'ONLY')];
            const encoded = binaryEncode(single);

            expect(encoded).toHaveLength(1);
            expect(encoded[0]).toEqual({ id: 's0', name: 'ONLY', value: '0', width: 1 });
        });

        it('should return empty array for empty states', () => {
            expect(binaryEncode([])).toEqual([]);
        });
    });

    describe('oneHotEncode', () => {
        const states: FSMState[] = [
            createState('s0', 'IDLE', { x: 0, y: 0 }, true),
            createState('s1', 'ACTIVE'),
            createState('s2', 'WAIT'),
        ];

        it('should encode states with one-hot values', () => {
            const encoded = oneHotEncode(states);

            expect(encoded).toHaveLength(3);
            expect(encoded[0]).toEqual({ id: 's0', name: 'IDLE', value: '100', width: 3 });
            expect(encoded[1]).toEqual({ id: 's1', name: 'ACTIVE', value: '010', width: 3 });
            expect(encoded[2]).toEqual({ id: 's2', name: 'WAIT', value: '001', width: 3 });
        });

        it('should ensure each encoding has exactly one bit set', () => {
            const manyStates = Array.from({ length: 8 }, (_, i) =>
                createState(`s${i}`, `STATE_${i}`)
            );
            const encoded = oneHotEncode(manyStates);

            encoded.forEach((e, i) => {
                const ones = e.value.split('').filter(c => c === '1').length;
                expect(ones).toBe(1);
                // Check the '1' is at the correct position
                expect(e.value[i]).toBe('1');
            });
        });

        it('should return empty array for empty states', () => {
            expect(oneHotEncode([])).toEqual([]);
        });
    });

    describe('grayEncode', () => {
        const states: FSMState[] = [
            createState('s0', 'S0'),
            createState('s1', 'S1'),
            createState('s2', 'S2'),
            createState('s3', 'S3'),
        ];

        it('should encode states with Gray code values', () => {
            const encoded = grayEncode(states);

            expect(encoded).toHaveLength(4);
            expect(encoded[0]).toEqual({ id: 's0', name: 'S0', value: '00', width: 2 });
            expect(encoded[1]).toEqual({ id: 's1', name: 'S1', value: '01', width: 2 });
            expect(encoded[2]).toEqual({ id: 's2', name: 'S2', value: '11', width: 2 });
            expect(encoded[3]).toEqual({ id: 's3', name: 'S3', value: '10', width: 2 });
        });

        it('should ensure consecutive states differ by one bit', () => {
            const encoded = grayEncode(states);

            for (let i = 0; i < encoded.length - 1; i++) {
                const v1 = parseInt(encoded[i].value, 2);
                const v2 = parseInt(encoded[i + 1].value, 2);
                const diff = v1 ^ v2;
                // Check that diff is a power of 2 (only one bit set)
                expect(diff & (diff - 1)).toBe(0);
                expect(diff).toBeGreaterThan(0);
            }
        });

        it('should return empty array for empty states', () => {
            expect(grayEncode([])).toEqual([]);
        });
    });

    describe('encodeStates', () => {
        const states: FSMState[] = [
            createState('s0', 'IDLE'),
            createState('s1', 'ACTIVE'),
        ];

        it('should dispatch to correct encoding function', () => {
            expect(encodeStates(states, 'binary')).toEqual(binaryEncode(states));
            expect(encodeStates(states, 'onehot')).toEqual(oneHotEncode(states));
            expect(encodeStates(states, 'gray')).toEqual(grayEncode(states));
        });

        it('should default to binary for unknown encoding', () => {
            expect(encodeStates(states, 'unknown' as any)).toEqual(binaryEncode(states));
        });
    });

    describe('generateStateParam', () => {
        it('should generate localparam declaration', () => {
            const encoded = { id: 's0', name: 'IDLE', value: '00', width: 2 };
            expect(generateStateParam(encoded)).toBe("localparam [1:0] IDLE = 2'b00;");
        });

        it('should handle one-hot encoding', () => {
            const encoded = { id: 's0', name: 'ACTIVE', value: '010', width: 3 };
            expect(generateStateParam(encoded)).toBe("localparam [2:0] ACTIVE = 3'b010;");
        });

        it('should handle single-bit width', () => {
            const encoded = { id: 's0', name: 'ONLY', value: '0', width: 1 };
            expect(generateStateParam(encoded)).toBe("localparam [0:0] ONLY = 1'b0;");
        });
    });

    describe('generateStateParams', () => {
        const states: FSMState[] = [
            createState('s0', 'IDLE'),
            createState('s1', 'RUN'),
        ];

        it('should generate all state parameter declarations', () => {
            const params = generateStateParams(states, 'binary');

            expect(params).toHaveLength(2);
            expect(params[0]).toBe("localparam [0:0] IDLE = 1'b0;");
            expect(params[1]).toBe("localparam [0:0] RUN = 1'b1;");
        });
    });

    describe('findInitialState', () => {
        it('should find the initial state', () => {
            const states: FSMState[] = [
                createState('s0', 'IDLE'),
                createState('s1', 'ACTIVE', { x: 0, y: 0 }, true),
                createState('s2', 'DONE'),
            ];

            const initial = findInitialState(states);
            expect(initial).toBeDefined();
            expect(initial?.id).toBe('s1');
            expect(initial?.name).toBe('ACTIVE');
        });

        it('should return undefined if no initial state', () => {
            const states: FSMState[] = [
                createState('s0', 'IDLE'),
                createState('s1', 'ACTIVE'),
            ];

            expect(findInitialState(states)).toBeUndefined();
        });

        it('should return first initial if multiple marked', () => {
            const states: FSMState[] = [
                createState('s0', 'IDLE', { x: 0, y: 0 }, true),
                createState('s1', 'ACTIVE', { x: 0, y: 0 }, true),
            ];

            const initial = findInitialState(states);
            expect(initial?.id).toBe('s0');
        });
    });

    describe('getEncodedValue', () => {
        const states: FSMState[] = [
            createState('s0', 'IDLE'),
            createState('s1', 'ACTIVE'),
            createState('s2', 'DONE'),
        ];

        it('should get encoded value for state by ID', () => {
            const encoded = getEncodedValue('s1', states, 'binary');

            expect(encoded).toBeDefined();
            expect(encoded?.name).toBe('ACTIVE');
            expect(encoded?.value).toBe('01');
        });

        it('should return undefined for non-existent state', () => {
            expect(getEncodedValue('s99', states, 'binary')).toBeUndefined();
        });

        it('should work with different encodings', () => {
            const binary = getEncodedValue('s1', states, 'binary');
            const onehot = getEncodedValue('s1', states, 'onehot');
            const gray = getEncodedValue('s1', states, 'gray');

            expect(binary?.value).toBe('01');
            expect(onehot?.value).toBe('010');
            expect(gray?.value).toBe('01');
        });
    });

    describe('validateEncoding', () => {
        it('should return invalid for 0 states', () => {
            const result = validateEncoding(0, 'binary');
            expect(result.valid).toBe(false);
            expect(result.warning).toBe('FSM has no states');
        });

        it('should return valid for normal state counts', () => {
            expect(validateEncoding(4, 'binary').valid).toBe(true);
            expect(validateEncoding(4, 'onehot').valid).toBe(true);
            expect(validateEncoding(4, 'gray').valid).toBe(true);
        });

        it('should warn about one-hot with many states', () => {
            const result = validateEncoding(20, 'onehot');
            expect(result.valid).toBe(true);
            expect(result.warning).toContain('20 states');
            expect(result.warning).toContain('20 flip-flops');
        });

        it('should not warn about binary/gray with many states', () => {
            expect(validateEncoding(20, 'binary').warning).toBeUndefined();
            expect(validateEncoding(20, 'gray').warning).toBeUndefined();
        });
    });
});
