
import { describe, it, expect } from 'vitest';
import { getSuggestions } from '../suggestions';

describe('Smart Suggestions', () => {
    it('detects syntax errors', () => {
        const code = 'module broken_syntax ( input a '; // Missing closing paren/semicolon
        const diagnostics = getSuggestions(code);

        expect(diagnostics.length).toBeGreaterThan(0);
        expect(diagnostics.some(d => d.source === 'parser' && d.severity === 'error')).toBe(true);
    });

    it('detects lint violations (undriven signal)', () => {
        const code = `
            module test(input a, output y);
                wire internal; // Undriven
                assign y = a;
            endmodule
        `;
        const diagnostics = getSuggestions(code);

        // Validator undriven-signal rule should catch 'internal'
        expect(diagnostics.some(d => d.message.includes('undriven') || d.message.includes('declared but never assigned'))).toBe(true);
        expect(diagnostics.some(d => d.source === 'validator')).toBe(true);
    });

    it('returns empty diagnostics for valid code', () => {
        const code = `
            module valid(input a, output y);
                assign y = a;
            endmodule
        `;
        const diagnostics = getSuggestions(code);
        // Assuming no strict lints trigger on this simple code
        // Note: Missing default case only applies to case statements.
        // Undriven signal: y is driven, a is input.
        // Should be clean or low severity info.
        const errors = diagnostics.filter(d => d.severity === 'error');
        expect(errors.length).toBe(0);
    });
});
