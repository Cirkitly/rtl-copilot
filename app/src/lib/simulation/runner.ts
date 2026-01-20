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

    try {
        // Run iverilog via Docker
        const cmd = `docker run --rm -v ${workDir}:/workspace ${DOCKER_IMAGE} compile /workspace/sim.vvp ${files.map(f => `/workspace/${path.basename(f)}`).join(' ')}`;

        const { stdout, stderr } = await execAsync(cmd, { timeout: 30000 });

        const errors = parseIverilogErrors(stderr);
        const warnings = parseIverilogWarnings(stderr);

        return {
            success: errors.length === 0,
            errors,
            warnings,
            outputFile: errors.length === 0 ? outputFile : undefined
        };
    } catch (error: any) {
        return {
            success: false,
            errors: [error.message || 'Compilation failed'],
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
