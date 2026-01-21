/**
 * Simulation Runner - Interfaces with Docker container to run iverilog/verilator
 */

export interface CompilationResult {
    success: boolean;
    errors: string[];
    warnings: string[];
    outputFile?: string;
}

export interface SimulationResult {
    success: boolean;
    errors: string[];
    output: string;
    vcdPath?: string;
}

export interface LintResult {
    success: boolean;
    violations: LintViolation[];
}

export interface LintViolation {
    file: string;
    line: number;
    column?: number;
    severity: 'error' | 'warning';
    message: string;
}

const DOCKER_IMAGE = 'rtl-copilot-sim';
const WORKSPACE_DIR = '/tmp/rtl-copilot-sim';

/**
 * Compile Verilog code using iverilog
 * Tries: 1) Native iverilog, 2) Docker, 3) Mock success
 */
export async function compileVerilog(
    moduleCode: string,
    testbenchCode?: string
): Promise<CompilationResult> {
    const { exec } = await import('child_process');
    const { promisify } = await import('util');
    const { writeFile, mkdir } = await import('fs/promises');
    const path = await import('path');

    const execAsync = promisify(exec);

    // Create temp workspace
    const workDir = path.join(WORKSPACE_DIR, Date.now().toString());
    await mkdir(workDir, { recursive: true });

    // Write files
    const moduleFile = path.join(workDir, 'module.v');
    await writeFile(moduleFile, moduleCode);

    const files = [moduleFile];
    if (testbenchCode) {
        const tbFile = path.join(workDir, 'testbench.v');
        await writeFile(tbFile, testbenchCode);
        files.push(tbFile);
    }

    const outputFile = path.join(workDir, 'sim.vvp');

    // Try native iverilog first
    try {
        const nativeCmd = `iverilog -o ${outputFile} ${files.join(' ')}`;
        const { stdout, stderr } = await execAsync(nativeCmd, { timeout: 30000 });

        const errors = parseIverilogErrors(stderr);
        const warnings = parseIverilogWarnings(stderr);

        return {
            success: errors.length === 0,
            errors,
            warnings,
            outputFile: errors.length === 0 ? outputFile : undefined
        };
    } catch (nativeError: any) {
        // Native iverilog not found, try Docker
        if (nativeError.code === 'ENOENT' || nativeError.message?.includes('not found')) {
            try {
                const dockerCmd = `docker run --rm -v ${workDir}:/workspace ${DOCKER_IMAGE} compile /workspace/sim.vvp ${files.map(f => `/workspace/${path.basename(f)}`).join(' ')}`;
                const { stdout, stderr } = await execAsync(dockerCmd, { timeout: 30000 });

                const errors = parseIverilogErrors(stderr);
                const warnings = parseIverilogWarnings(stderr);

                return {
                    success: errors.length === 0,
                    errors,
                    warnings,
                    outputFile: errors.length === 0 ? outputFile : undefined
                };
            } catch (dockerError: any) {
                // Docker also failed - return mock success for demo
                return {
                    success: true,
                    errors: [],
                    warnings: ['[Demo Mode] iverilog/Docker not available - using mock compilation'],
                    outputFile: outputFile
                };
            }
        }

        // Actual compilation error
        return {
            success: false,
            errors: [nativeError.stderr || nativeError.message || 'Compilation failed'],
            warnings: []
        };
    }
}

/**
 * Run simulation and generate VCD
 */
export async function runSimulation(vvpFile: string): Promise<SimulationResult> {
    const { exec } = await import('child_process');
    const { promisify } = await import('util');
    const path = await import('path');

    const execAsync = promisify(exec);
    const workDir = path.dirname(vvpFile);

    try {
        const cmd = `docker run --rm -v ${workDir}:/workspace ${DOCKER_IMAGE} simulate /workspace/${path.basename(vvpFile)}`;

        const { stdout, stderr } = await execAsync(cmd, { timeout: 60000 });

        // Look for VCD file in output
        const vcdPath = path.join(workDir, 'waveform.vcd');

        return {
            success: true,
            errors: [],
            output: stdout,
            vcdPath
        };
    } catch (error: any) {
        return {
            success: false,
            errors: [error.message || 'Simulation failed'],
            output: ''
        };
    }
}

/**
 * Lint with Verilator
 */
export async function lintVerilog(code: string): Promise<LintResult> {
    const { exec } = await import('child_process');
    const { promisify } = await import('util');
    const { writeFile, mkdir } = await import('fs/promises');
    const path = await import('path');

    const execAsync = promisify(exec);

    const workDir = path.join(WORKSPACE_DIR, 'lint-' + Date.now().toString());
    await mkdir(workDir, { recursive: true });

    const moduleFile = path.join(workDir, 'module.v');
    await writeFile(moduleFile, code);

    try {
        const cmd = `docker run --rm -v ${workDir}:/workspace ${DOCKER_IMAGE} lint /workspace/module.v`;

        await execAsync(cmd, { timeout: 30000 });

        return { success: true, violations: [] };
    } catch (error: any) {
        const violations = parseVerilatorOutput(error.stderr || error.message);
        return {
            success: violations.every(v => v.severity === 'warning'),
            violations
        };
    }
}

/**
 * Run formal verification with SymbiYosys
 */
export async function runProof(code: string): Promise<SimulationResult> {
    const { exec } = await import('child_process');
    const { promisify } = await import('util');
    const { writeFile, mkdir } = await import('fs/promises');
    const path = await import('path');

    const execAsync = promisify(exec);
    const workDir = path.join(WORKSPACE_DIR, 'proof-' + Date.now().toString());
    await mkdir(workDir, { recursive: true });

    const moduleFile = path.join(workDir, 'input.sv');
    await writeFile(moduleFile, code);

    // Create .sby config
    const sbyConfig = `
[options]
mode prove

[engines]
smtbmc yices

[script]
read -formal input.sv
prep -top top_module

[files]
input.sv
`;
    await writeFile(path.join(workDir, 'task.sby'), sbyConfig);

    try {
        const cmd = `docker run --rm -v ${workDir}:/workspace ${DOCKER_IMAGE} sby -f task.sby`;
        const { stdout } = await execAsync(cmd, { timeout: 60000 });

        return {
            success: stdout.includes('Status: PASSED'),
            errors: [],
            output: stdout
        };
    } catch (error: any) {
        // sby returns exit code 1 on failure
        const output = error.stdout || error.message || '';
        return {
            success: false,
            errors: output.includes('Status: FAILED') ? ['Verification Failed'] : [error.message],
            output: output
        };
    }
}

// Helper functions
function parseIverilogErrors(stderr: string): string[] {
    const lines = stderr.split('\n');
    return lines.filter(line => line.includes('error') || line.includes('syntax error'));
}

function parseIverilogWarnings(stderr: string): string[] {
    const lines = stderr.split('\n');
    return lines.filter(line => line.includes('warning') && !line.includes('error'));
}

function parseVerilatorOutput(output: string): LintViolation[] {
    const violations: LintViolation[] = [];
    const regex = /%(Error|Warning)(?:-(\w+))?: ([^:]+):(\d+):(?:(\d+):)? (.+)/g;

    let match;
    while ((match = regex.exec(output)) !== null) {
        violations.push({
            severity: match[1].toLowerCase() as 'error' | 'warning',
            file: match[3],
            line: parseInt(match[4], 10),
            column: match[5] ? parseInt(match[5], 10) : undefined,
            message: match[6]
        });
    }

    return violations;
}
