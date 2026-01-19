
import { describe, it, expect } from 'vitest';
import { getFewShotExamples } from '../examples';

describe('Few-Shot Examples Database', () => {
    it('returns general examples by default', () => {
        const examples = getFewShotExamples();
        expect(examples.length).toBeGreaterThan(0);
        expect(examples.some(e => e.description.includes('multiplexer'))).toBe(true);
        expect(examples.some(e => e.description.includes('counter'))).toBe(true);
        // Should not include FSM by default
        expect(examples.some(e => e.description.includes('FSM'))).toBe(false);
    });

    it('returns FSM examples when topic requests it', () => {
        const examples = getFewShotExamples('design an fsm');
        expect(examples.some(e => e.description.includes('FSM'))).toBe(true);
        // Should still include general examples as foundation
        expect(examples.some(e => e.description.includes('multiplexer'))).toBe(true);
    });

    it('examples contain valid-looking Verilog', () => {
        const examples = getFewShotExamples('fsm');
        examples.forEach(ex => {
            expect(ex.code).toContain('module');
            expect(ex.code).toContain('endmodule');
            expect(ex.code).toContain('input');
            expect(ex.code).toContain('output');
        });
    });
});
