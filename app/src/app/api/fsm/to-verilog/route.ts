import { NextRequest, NextResponse } from 'next/server';
import { generateFSMVerilog } from '@/lib/fsm/generator';
import type { FSM, FSMGeneratorOptions } from '@/lib/fsm/types';

export async function POST(req: NextRequest) {
    try {
        const body = await req.json();
        const { fsm, options } = body as { fsm: FSM; options?: FSMGeneratorOptions };

        if (!fsm) {
            return NextResponse.json(
                { error: 'FSM data is required' },
                { status: 400 }
            );
        }

        const verilog = generateFSMVerilog(fsm, options);

        return NextResponse.json({ verilog });
    } catch (error) {
        console.error('FSM Generation Error:', error);
        return NextResponse.json(
            { error: error instanceof Error ? error.message : 'Failed to generate Verilog' },
            { status: 500 }
        );
    }
}
