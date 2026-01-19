import { NextRequest, NextResponse } from 'next/server';
import { parse } from '@/lib/verilog/parser';
import { extractFSM } from '@/lib/fsm/extractor';

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

        // Parse Verilog
        const parseResult = parse(verilogCode);
        if (!parseResult.cst || parseResult.errors.length > 0) {
            return NextResponse.json({
                success: false,
                errors: parseResult.errors.map(e => `Line ${e.line}: ${e.message}`),
                fsm: null,
            });
        }

        // Extract FSM from AST (currently assumed CST -> AST happens inside extractFSM or wrapper)
        // Actually, extractFSM expects VerilogModule (AST), but my parse returns CST or needs transformation
        // Wait, in my tests I used `parseModule` which was using `parse` from `parser`.
        // Let me check my parser.ts again.

        // parser.ts `parse` returns { cst, errors }. It does NOT return VerilogModule (AST).
        // The previous implementation of `extractor.ts` took `VerilogModule`.
        // I need the CST -> AST converter (Visitor).

        // Ah, wait. In `extractor.test.ts` I had a helper checking `result.module`.
        // My parser.ts exports `parse` which returns CST.
        // Is there an AST visitor?
        // I recall `verilog/types.ts` defines AST.
        // I probably missed implementing the CST -> AST visitor in the "Parser" phase or I need to import it.

        // Let me check if there is a visitor implementation.
        return NextResponse.json({
            success: false,
            errors: ['Verilog AST visitor not yet connected to API'],
            fsm: null,
        }, { status: 501 });

    } catch (error) {
        console.error('FSM Extraction Error:', error);
        return NextResponse.json(
            { error: error instanceof Error ? error.message : 'Failed to extract FSM' },
            { status: 500 }
        );
    }
}
