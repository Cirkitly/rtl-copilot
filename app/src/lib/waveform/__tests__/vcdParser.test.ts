/**
 * VCD Parser Unit Tests
 */
import { describe, it, expect } from 'vitest';
import { parseVCD, getValueAtTime, binaryToDecimal } from '../vcdParser';

describe('VCD Parser', () => {
    const sampleVCD = `
$date
    Mon Jan 20 10:00:00 2026
$end
$version
    RTL Copilot 1.0
$end
$timescale 1ns $end
$scope module tb $end
$var wire 1 ! clk $end
$var wire 1 " rst_n $end
$var wire 8 # data [7:0] $end
$upscope $end
$enddefinitions $end
#0
0!
0"
b00000000 #
#5
1!
#10
0!
1"
#15
1!
b10101010 #
#20
0!
`;

    it('parses timescale correctly', () => {
        const result = parseVCD(sampleVCD);
        expect(result.timescale).toBe('1ns');
    });

    it('parses date and version', () => {
        const result = parseVCD(sampleVCD);
        expect(result.date).toContain('Mon Jan 20');
        expect(result.version).toContain('RTL Copilot');
    });

    it('parses signal definitions', () => {
        const result = parseVCD(sampleVCD);

        expect(result.signals.size).toBe(3);

        const clk = result.signals.get('tb.clk');
        expect(clk).toBeDefined();
        expect(clk?.width).toBe(1);
        expect(clk?.type).toBe('wire');

        const data = result.signals.get('tb.data');
        expect(data).toBeDefined();
        expect(data?.width).toBe(8);
    });

    it('parses single-bit value changes', () => {
        const result = parseVCD(sampleVCD);

        const clkChanges = result.changes.get('tb.clk');
        expect(clkChanges).toBeDefined();
        expect(clkChanges?.length).toBeGreaterThan(0);

        // t=0: 0, t=5: 1, t=10: 0, t=15: 1, t=20: 0
        expect(clkChanges).toContainEqual({ time: 0, value: '0' });
        expect(clkChanges).toContainEqual({ time: 5, value: '1' });
        expect(clkChanges).toContainEqual({ time: 10, value: '0' });
    });

    it('parses multi-bit value changes', () => {
        const result = parseVCD(sampleVCD);

        const dataChanges = result.changes.get('tb.data');
        expect(dataChanges).toBeDefined();

        expect(dataChanges).toContainEqual({ time: 0, value: '00000000' });
        expect(dataChanges).toContainEqual({ time: 15, value: '10101010' });
    });

    it('handles reset signal correctly', () => {
        const result = parseVCD(sampleVCD);

        const rstChanges = result.changes.get('tb.rst_n');
        expect(rstChanges).toBeDefined();

        // t=0: 0, t=10: 1
        expect(rstChanges).toContainEqual({ time: 0, value: '0' });
        expect(rstChanges).toContainEqual({ time: 10, value: '1' });
    });
});

describe('getValueAtTime', () => {
    const changes = [
        { time: 0, value: '0' },
        { time: 5, value: '1' },
        { time: 10, value: '0' },
        { time: 15, value: '1' },
    ];

    it('returns correct value at exact time', () => {
        expect(getValueAtTime(changes, 5)).toBe('1');
        expect(getValueAtTime(changes, 10)).toBe('0');
    });

    it('returns last value before given time', () => {
        expect(getValueAtTime(changes, 7)).toBe('1');
        expect(getValueAtTime(changes, 12)).toBe('0');
    });

    it('returns undefined before any changes', () => {
        expect(getValueAtTime([], 5)).toBeUndefined();
    });
});

describe('binaryToDecimal', () => {
    it('converts binary strings correctly', () => {
        expect(binaryToDecimal('0')).toBe(0);
        expect(binaryToDecimal('1')).toBe(1);
        expect(binaryToDecimal('1010')).toBe(10);
        expect(binaryToDecimal('10101010')).toBe(170);
        expect(binaryToDecimal('11111111')).toBe(255);
    });

    it('returns null for unknown values', () => {
        expect(binaryToDecimal('xxxx')).toBeNull();
        expect(binaryToDecimal('zzzz')).toBeNull();
        expect(binaryToDecimal('10x0')).toBeNull();
    });
});
