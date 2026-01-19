
import { describe, it, expect } from 'vitest';
import { constructPrompt, buildContext, ProjectContextFile } from '../context';

describe('Context Injection', () => {
    const mockFiles: ProjectContextFile[] = [
        { name: 'alu.v', content: 'module alu(input a, b, output y); assign y = a + b; endmodule' }
    ];

    it('formats file context correctly', () => {
        const context = buildContext(mockFiles);
        expect(context).toContain('File: alu.v');
        expect(context).toContain('```verilog');
        expect(context).toContain('module alu');
        expect(context).toContain('EXISTING PROJECT CONTEXT');
    });

    it('returns empty string for empty file list', () => {
        const context = buildContext([]);
        expect(context).toBe('');
    });

    it('constructs full prompt with all components', () => {
        const userQuery = 'Make a 4-bit adder';
        const prompt = constructPrompt(userQuery, mockFiles, {
            systemOptions: { role: 'expert' },
            topic: 'general'
        });

        // 1. System Prompt
        expect(prompt).toContain('You are an expert hardware engineer');

        // 2. Context
        expect(prompt).toContain('EXISTING PROJECT CONTEXT');
        expect(prompt).toContain('alu.v');

        // 3. Examples
        expect(prompt).toContain('FEW-SHOT EXAMPLES');
        expect(prompt).toContain('multiplexer'); // From general examples

        // 4. User Query
        expect(prompt).toContain('USER REQUEST:');
        expect(prompt).toContain('Make a 4-bit adder');
    });

    it('excludes context block when no files provided', () => {
        const prompt = constructPrompt('Just help me', []);
        expect(prompt).not.toContain('EXISTING PROJECT CONTEXT');
    });
});
