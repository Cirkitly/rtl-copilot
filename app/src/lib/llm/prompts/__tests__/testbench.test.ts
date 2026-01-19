
import { describe, it, expect } from 'vitest';
import { getTestbenchPrompt } from '../testbench';

describe('Testbench Prompt Generator', () => {
    const mockCode = 'module dut(input clk, output y); endmodule';

    it('includes formatting rules and DUT code', () => {
        const prompt = getTestbenchPrompt(mockCode);
        expect(prompt).toContain('expert Verification Engineer');
        expect(prompt).toContain(mockCode);
        expect(prompt).toContain('DESIGN UNDER TEST (DUT)');
    });

    it('enforces timescale', () => {
        const prompt = getTestbenchPrompt(mockCode, { timescale: '10ns/1ns' });
        expect(prompt).toContain('timescale 10ns/1ns');
    });

    it('includes assertion instructions by default', () => {
        const prompt = getTestbenchPrompt(mockCode);
        expect(prompt).toContain('strict assertion checks');
    });

    it('can disable assertions', () => {
        const prompt = getTestbenchPrompt(mockCode, { useAssertions: false });
        expect(prompt).not.toContain('strict assertion checks');
    });
});
