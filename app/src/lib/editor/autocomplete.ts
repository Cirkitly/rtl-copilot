
// import { VerilogParser } from '../verilog/parser'; 
// import { ModuleNode, DataType } from '../verilog/types';

export interface CompletionItem {
    label: string;
    kind: 'keyword' | 'module' | 'signal' | 'port' | 'function';
    detail?: string;
}

const VERILOG_KEYWORDS = [
    'module', 'endmodule', 'input', 'output', 'inout', 'wire', 'reg',
    'always', 'begin', 'end', 'case', 'endcase', 'if', 'else', 'default',
    'parameter', 'assign', 'posedge', 'negedge', 'initial', 'generate', 'endgenerate'
];

/**
 * Provides autocomplete suggestions based on the current code and cursor position.
 * Uses the parser to extract locally defined signals and ports.
 */
export const getCompletions = (code: string, cursorLine: number, cursorChar: number): CompletionItem[] => {
    const completions: CompletionItem[] = [];

    // 1. Add Keywords
    VERILOG_KEYWORDS.forEach(kw => {
        completions.push({ label: kw, kind: 'keyword' });
    });

    /* AST Parsing - Logic Reserved for Future
    try {
        const parser = new VerilogParser();
        // const ast = parser.parse(code);
    } catch (e) {
        // Ignore parser errors
    }
    */

    // 2. Robust Regex Extraction (Always run)
    // Supports: "input clk", "wire [7:0] data", "output reg valid"
    const signalRegex = /\b(wire|reg|input|output|inout)(?:\s+(?:reg|bit|logic|signed))?\s+(?:\[[^\]]+\]\s+)?([a-zA-Z_][a-zA-Z0-9_]*)\b/g;
    let match;
    const foundSignals = new Set<string>();

    while ((match = signalRegex.exec(code)) !== null) {
        const type = match[1];
        const name = match[2];
        if (!foundSignals.has(name) && !VERILOG_KEYWORDS.includes(name)) {
            foundSignals.add(name);
            completions.push({
                label: name,
                kind: type === 'input' || type === 'output' ? 'port' : 'signal',
                detail: type
            });
        }
    }

    // Extract parameters
    const paramRegex = /\bparameter\s+(?:.*?\s+)?([a-zA-Z_][a-zA-Z0-9_]*)\s*=/g;
    while ((match = paramRegex.exec(code)) !== null) {
        const name = match[1];
        if (!foundSignals.has(name)) {
            foundSignals.add(name);
            completions.push({ label: name, kind: 'signal', detail: 'parameter' });
        }
    }

    return completions;
};
