
import { NextRequest, NextResponse } from 'next/server';
import { runProof } from '@/lib/simulation/runner';
import { z } from 'zod';

const schema = z.object({
    code: z.string(),
});

export async function POST(req: NextRequest) {
    try {
        const body = await req.json();
        const { code } = schema.parse(body);

        // Rate limiting would go here

        const result = await runProof(code);

        return NextResponse.json(result);
    } catch (error: any) {
        return NextResponse.json(
            { error: error.message || 'Verification failed' },
            { status: 500 }
        );
    }
}
