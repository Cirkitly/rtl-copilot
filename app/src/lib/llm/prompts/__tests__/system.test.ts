
import { describe, it, expect } from 'vitest';
import { getSystemPrompt } from '../system';

describe('System Prompt Generator', () => {
    it('generates standard expert prompt by default', () => {
        const prompt = getSystemPrompt();
        expect(prompt).toContain('You are an expert hardware engineer');
        expect(prompt).toContain('active-low reset');
        expect(prompt).toContain('rst_n');
        expect(prompt).toContain('negedge rst_n');
    });

    it('generates teacher prompt when requested', () => {
        const prompt = getSystemPrompt({ role: 'teacher' });
        expect(prompt).toContain('Professor of Digital Design');
        expect(prompt).toContain('Focus on readability');
    });

    it('handles active high reset configuration', () => {
        const prompt = getSystemPrompt({ resetActive: 'high' });
        expect(prompt).toContain('active-high reset');
        expect(prompt).toContain('rst');
        expect(prompt).toContain('posedge rst');
        expect(prompt).not.toContain('rst_n');
        expect(prompt).toContain('if (rst)');
    });

    it('handles clock edge configuration', () => {
        const prompt = getSystemPrompt({ clockEdge: 'negedge' });
        expect(prompt).toContain('negedge clk');
    });
});
