
import { describe, it, expect } from 'vitest';
import { getCompletions } from '../autocomplete';

describe('Autocomplete Logic', () => {
    const code = `
        module test (
            input clk,
            input [3:0] data_in,
            output reg valid
        );
            parameter WIDTH = 8;
            wire [WIDTH-1:0] internal_sig;
            reg [3:0] counter;

            always @(posedge clk) begin
                if (valid) begin
                    counter <= counter + 1;
                end
            end
        endmodule
    `;

    it('suggests keywords', () => {
        const completions = getCompletions(code, 0, 0);
        expect(completions.some(c => c.label === 'always')).toBe(true);
        expect(completions.some(c => c.label === 'module')).toBe(true);
    });

    it('suggests ports', () => {
        const completions = getCompletions(code, 0, 0);
        expect(completions.some(c => c.label === 'clk' && c.kind === 'port')).toBe(true);
        expect(completions.some(c => c.label === 'data_in' && c.kind === 'port')).toBe(true);
        expect(completions.some(c => c.label === 'valid' && c.kind === 'port')).toBe(true);
    });

    it('suggests internal signals', () => {
        const completions = getCompletions(code, 0, 0);
        expect(completions.some(c => c.label === 'internal_sig' && c.kind === 'signal')).toBe(true);
        expect(completions.some(c => c.label === 'counter' && c.kind === 'signal')).toBe(true);
    });

    it('suggests parameters', () => {
        const completions = getCompletions(code, 0, 0);
        expect(completions.some(c => c.label === 'WIDTH' && c.detail === 'parameter')).toBe(true);
    });

    it('does not duplicate suggestions', () => {
        const completions = getCompletions(code, 0, 0);
        const clkSuggestions = completions.filter(c => c.label === 'clk');
        expect(clkSuggestions.length).toBe(1);
    });
});
