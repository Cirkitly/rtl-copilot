/**
 * Icarus Verilog (iverilog) Integration
 * Provides external syntax validation using the iverilog compiler
 */
import { exec, spawn } from 'child_process'
import { promisify } from 'util'
import { writeFile, unlink, mkdtemp } from 'fs/promises'
import { join } from 'path'
import { tmpdir } from 'os'
import { ErrorFormatter, type FormattedError, type ErrorSeverity } from './errors'

const execAsync = promisify(exec)

// ============================================================================
// Types
// ============================================================================
export interface IverilogError {
    file: string
    line: number
    column?: number
    severity: 'error' | 'warning'
    message: string
    raw: string
}

export interface IverilogResult {
    success: boolean
    errors: IverilogError[]
    warnings: IverilogError[]
    output: string
    command: string
    available: boolean
}

export interface IverilogOptions {
    timeout?: number           // Timeout in ms (default: 10000)
    includeWarnings?: boolean  // Include warnings (default: true)
    standard?: '1995' | '2001' | '2005'  // Verilog standard
    defines?: Record<string, string>     // Preprocessor defines
    includeDirs?: string[]    // Include directories
}

const defaultOptions: IverilogOptions = {
    timeout: 10000,
    includeWarnings: true,
    standard: '2005',
}

// ============================================================================
// Iverilog Checker Class
// ============================================================================
export class IverilogChecker {
    private options: IverilogOptions
    private iverilogPath: string = 'iverilog'
    private available: boolean | null = null

    constructor(options: Partial<IverilogOptions> = {}) {
        this.options = { ...defaultOptions, ...options }
    }

    /**
     * Check if iverilog is available on the system
     */
    async isAvailable(): Promise<boolean> {
        if (this.available !== null) {
            return this.available
        }

        try {
            await execAsync(`${this.iverilogPath} -V`, { timeout: 5000 })
            this.available = true
            return true
        } catch {
            this.available = false
            return false
        }
    }

    /**
     * Get iverilog version
     */
    async getVersion(): Promise<string | null> {
        try {
            const { stdout } = await execAsync(`${this.iverilogPath} -V`, { timeout: 5000 })
            const match = stdout.match(/Icarus Verilog version (\S+)/)
            return match ? match[1] : stdout.split('\n')[0]
        } catch {
            return null
        }
    }

    /**
     * Validate Verilog source code
     */
    async validate(source: string, fileName?: string): Promise<IverilogResult> {
        // Check availability first
        const available = await this.isAvailable()
        if (!available) {
            return {
                success: false,
                errors: [],
                warnings: [],
                output: 'iverilog is not installed or not in PATH',
                command: '',
                available: false,
            }
        }

        // Create temp file for the source
        let tempDir: string | null = null
        let tempFile: string | null = null

        try {
            tempDir = await mkdtemp(join(tmpdir(), 'verilog-'))
            tempFile = join(tempDir, fileName || 'input.v')
            await writeFile(tempFile, source)

            // Build command
            const args = this.buildArgs(tempFile)
            const command = `${this.iverilogPath} ${args.join(' ')}`

            // Run iverilog
            const result = await this.runIverilog(args)

            // Parse output
            const { errors, warnings } = this.parseOutput(result.output, tempFile, fileName)

            return {
                success: errors.length === 0,
                errors,
                warnings,
                output: result.output,
                command,
                available: true,
            }
        } finally {
            // Cleanup temp files
            if (tempFile) {
                try { await unlink(tempFile) } catch { /* ignore */ }
            }
            if (tempDir) {
                try { await unlink(tempDir) } catch { /* ignore */ }
            }
        }
    }

    /**
     * Validate and return formatted errors
     */
    async validateWithFormatting(source: string, fileName?: string): Promise<{
        result: IverilogResult
        formatted: FormattedError[]
    }> {
        const result = await this.validate(source, fileName)
        const formatter = new ErrorFormatter(source, fileName)

        const formatted = [...result.errors, ...result.warnings].map(err =>
            formatter.format({
                message: err.message,
                severity: err.severity,
                line: err.line,
                column: err.column,
            })
        )

        return { result, formatted }
    }

    // Private methods
    private buildArgs(inputFile: string): string[] {
        const args: string[] = []

        // Output to null (we only want syntax checking)
        args.push('-o', '/dev/null')

        // Verilog standard
        if (this.options.standard) {
            args.push(`-g${this.options.standard}`)
        }

        // Include directories
        if (this.options.includeDirs) {
            for (const dir of this.options.includeDirs) {
                args.push('-I', dir)
            }
        }

        // Preprocessor defines
        if (this.options.defines) {
            for (const [key, value] of Object.entries(this.options.defines)) {
                args.push('-D', `${key}=${value}`)
            }
        }

        // Input file
        args.push(inputFile)

        return args
    }

    private async runIverilog(args: string[]): Promise<{ output: string; exitCode: number }> {
        return new Promise((resolve) => {
            const proc = spawn(this.iverilogPath, args, {
                timeout: this.options.timeout,
            })

            let output = ''

            proc.stdout.on('data', (data) => {
                output += data.toString()
            })

            proc.stderr.on('data', (data) => {
                output += data.toString()
            })

            proc.on('close', (code) => {
                resolve({ output, exitCode: code || 0 })
            })

            proc.on('error', (err) => {
                resolve({ output: err.message, exitCode: -1 })
            })
        })
    }

    private parseOutput(
        output: string,
        tempFile: string,
        originalFileName?: string
    ): { errors: IverilogError[]; warnings: IverilogError[] } {
        const errors: IverilogError[] = []
        const warnings: IverilogError[] = []

        // iverilog error format: filename:line: error/warning: message
        // or: filename:line:column: error/warning: message
        const lines = output.split('\n')

        const errorRegex = /^(.+?):(\d+)(?::(\d+))?\s*:\s*(error|warning)\s*:\s*(.+)$/i
        const simpleErrorRegex = /^(.+?):(\d+)\s*:\s*(.+)$/

        for (const line of lines) {
            if (!line.trim()) continue

            let match = line.match(errorRegex)
            if (match) {
                const [raw, file, lineStr, colStr, severity, message] = match
                const ivError: IverilogError = {
                    file: file === tempFile ? (originalFileName || 'input.v') : file,
                    line: parseInt(lineStr, 10),
                    column: colStr ? parseInt(colStr, 10) : undefined,
                    severity: severity.toLowerCase() as 'error' | 'warning',
                    message: message.trim(),
                    raw: line,
                }

                if (ivError.severity === 'error') {
                    errors.push(ivError)
                } else {
                    warnings.push(ivError)
                }
                continue
            }

            // Try simple error format (no severity prefix)
            match = line.match(simpleErrorRegex)
            if (match) {
                const [raw, file, lineStr, message] = match
                // Determine if it's an error or warning from message content
                const isWarning = message.toLowerCase().includes('warning')
                const isError = !isWarning && (
                    message.toLowerCase().includes('error') ||
                    message.toLowerCase().includes('syntax') ||
                    message.toLowerCase().includes('undefined')
                )

                if (isError || isWarning) {
                    const ivError: IverilogError = {
                        file: file === tempFile ? (originalFileName || 'input.v') : file,
                        line: parseInt(lineStr, 10),
                        severity: isWarning ? 'warning' : 'error',
                        message: message.trim(),
                        raw: line,
                    }

                    if (ivError.severity === 'error') {
                        errors.push(ivError)
                    } else {
                        warnings.push(ivError)
                    }
                }
            }
        }

        return { errors, warnings }
    }
}

// ============================================================================
// Convenience Functions
// ============================================================================

/**
 * Quick syntax check using iverilog
 */
export async function checkVerilogSyntax(source: string, fileName?: string): Promise<IverilogResult> {
    const checker = new IverilogChecker()
    return checker.validate(source, fileName)
}

/**
 * Check if iverilog is installed
 */
export async function isIverilogAvailable(): Promise<boolean> {
    const checker = new IverilogChecker()
    return checker.isAvailable()
}
