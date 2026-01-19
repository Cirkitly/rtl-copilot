import { NextRequest, NextResponse } from 'next/server';
import { parse } from '@/lib/verilog/parser';
import { extractFSM } from '@/lib/fsm/extractor';
import { cstToAst } from '@/lib/verilog/visitor';

export async function POST(req: NextRequest) {
    try {
        const body = await req.json();
        const { verilogCode } = body;

        if (!verilogCode) {
            return NextResponse.json(
                { error: 'Verilog code is required' },
                { status: 400 }
            );
        }

        // 1. Parse Verilog to CST
        const parseResult = parse(verilogCode);
        if (!parseResult.cst || parseResult.errors.length > 0) {
            return NextResponse.json({
                success: false,
                errors: parseResult.errors.map(e => `Line ${e.line}: ${e.message}`),
                fsm: null,
            });
        }

        // 2. Convert CST to AST
        const ast = cstToAst(parseResult.cst);

        // 3. Extract FSM from AST
        const extractionResult = extractFSM(ast);

        if (!extractionResult.success) {
            return NextResponse.json({
                success: false,
                errors: extractionResult.errors,
                fsm: null,
            });
        }

        return NextResponse.json({
            success: true,
            fsm: extractionResult.fsm,
            confidence: extractionResult.confidence,
        });

    } catch (error) {
        console.error('FSM Extraction Error:', error);
        return NextResponse.json(
            { error: error instanceof Error ? error.message : 'Failed to extract FSM' },
            { status: 500 }
        );
    }
}
