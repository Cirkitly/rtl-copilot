/**
 * Simulation API - Run Verilog simulations
 * POST /api/simulation/run
 */
import { NextRequest, NextResponse } from 'next/server';
import { compileVerilog, runSimulation } from '@/lib/simulation/runner';

export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const { moduleCode, testbenchCode } = body;

        if (!moduleCode) {
            return NextResponse.json(
                { error: 'moduleCode is required' },
                { status: 400 }
            );
        }

        // Step 1: Compile
        const compileResult = await compileVerilog(moduleCode, testbenchCode);

        if (!compileResult.success) {
            return NextResponse.json({
                success: false,
                stage: 'compilation',
                errors: compileResult.errors,
                warnings: compileResult.warnings
            });
        }

        // Step 2: Run simulation (only if testbench provided)
        if (testbenchCode && compileResult.outputFile) {
            const simResult = await runSimulation(compileResult.outputFile);

            return NextResponse.json({
                success: simResult.success,
                stage: 'simulation',
                errors: simResult.errors,
                warnings: compileResult.warnings,
                output: simResult.output,
                vcdPath: simResult.vcdPath
            });
        }

        // Compilation only
        return NextResponse.json({
            success: true,
            stage: 'compilation',
            errors: [],
            warnings: compileResult.warnings,
            outputFile: compileResult.outputFile
        });

    } catch (error: any) {
        console.error('Simulation error:', error);
        return NextResponse.json(
            { error: error.message || 'Internal server error' },
            { status: 500 }
        );
    }
}
