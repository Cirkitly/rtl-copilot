
import { parse } from '../verilog/parser';
import { cstToAst } from '../verilog/visitor';
import { validateModule } from '../verilog/validator';

export interface Diagnostic {
    message: string;
    severity: 'error' | 'warning' | 'info';
    startLine: number;
    startColumn: number;
    endLine?: number;
    endColumn?: number;
    suggestion?: string;
    source: 'parser' | 'validator';
}

/**
 * analyzes Verilog code and returns a list of diagnostics (syntax errors, lint warnings, suggestions).
 */
export const getSuggestions = (code: string): Diagnostic[] => {
    const diagnostics: Diagnostic[] = [];

    try {
        // 1. Syntax Analysis (Parser)
        const parseResult = parse(code);

        // Add Syntax Errors
        if (parseResult.errors.length > 0) {
            parseResult.errors.forEach(err => {
                diagnostics.push({
                    message: err.message,
                    severity: 'error',
                    startLine: err.line,
                    startColumn: err.column,
                    source: 'parser'
                });
            });
            // If syntax is broken, AST generation might fail or be incomplete, but let's try if CST exists
            if (!parseResult.cst) return diagnostics;
        }

        // 2. Semantic Analysis (Validator)
        try {
            if (parseResult.cst) {
                const ast = cstToAst(parseResult.cst);
                const validationResult = validateModule(ast);

                validationResult.violations.forEach(v => {
                    diagnostics.push({
                        message: v.message,
                        severity: v.severity,
                        startLine: v.line || 1,
                        startColumn: v.column || 1,
                        suggestion: v.suggestion,
                        source: 'validator'
                    });
                });
            }
        } catch (e: any) {
            // AST Conversion or Validation failed
            diagnostics.push({
                message: `Analysis failed: ${e.message}`,
                severity: 'info',
                startLine: 1,
                startColumn: 1,
                source: 'validator'
            });
        }

    } catch (e: any) {
        diagnostics.push({
            message: `Internal error: ${e.message}`,
            severity: 'error',
            startLine: 1,
            startColumn: 1,
            source: 'parser'
        });
    }

    return diagnostics;
};
