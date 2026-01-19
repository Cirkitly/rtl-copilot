/**
 * Error Formatter
 * Provides structured error messages with source snippets and source mapping
 */

// ============================================================================
// Error Types
// ============================================================================
export type ErrorSeverity = 'error' | 'warning' | 'info' | 'hint'

export interface SourceLocation {
    file?: string
    line: number
    column: number
    endLine?: number
    endColumn?: number
}

export interface FormattedError {
    code: string           // Error code like "E001" or "W002"
    severity: ErrorSeverity
    message: string
    location?: SourceLocation
    source?: string        // The source line containing the error
    pointer?: string       // Visual pointer to the error position
    suggestion?: string    // Suggested fix
    context?: string[]     // Additional context lines
}

export interface ErrorReport {
    file?: string
    source: string
    errors: FormattedError[]
    warnings: FormattedError[]
    totalErrors: number
    totalWarnings: number
    summary: string
}

// ============================================================================
// Error Codes
// ============================================================================
export const ErrorCodes = {
    // Syntax Errors (E0xx)
    SYNTAX_ERROR: 'E001',
    UNEXPECTED_TOKEN: 'E002',
    MISSING_TOKEN: 'E003',

    // Semantic Errors (E1xx)
    UNDRIVEN_SIGNAL: 'E101',
    MULTI_DRIVEN_SIGNAL: 'E102',
    UNDEFINED_SIGNAL: 'E103',

    // Warnings (W0xx)
    BLOCKING_IN_SEQUENTIAL: 'W001',
    NONBLOCKING_IN_COMBINATIONAL: 'W002',
    MISSING_DEFAULT_CASE: 'W003',
    INCOMPLETE_SENSITIVITY: 'W004',

    // Info (I0xx)
    STYLE_SUGGESTION: 'I001',
} as const

// ============================================================================
// Error Formatter Class
// ============================================================================
export class ErrorFormatter {
    private sourceLines: string[] = []
    private fileName?: string

    constructor(source?: string, fileName?: string) {
        if (source) {
            this.sourceLines = source.split('\n')
        }
        this.fileName = fileName
    }

    /**
     * Format a single error with source context
     */
    format(error: {
        message: string
        severity: ErrorSeverity
        line?: number
        column?: number
        code?: string
        suggestion?: string
    }): FormattedError {
        const formatted: FormattedError = {
            code: error.code || this.inferErrorCode(error.severity, error.message),
            severity: error.severity,
            message: error.message,
            suggestion: error.suggestion,
        }

        if (error.line !== undefined && error.line > 0) {
            formatted.location = {
                file: this.fileName,
                line: error.line,
                column: error.column || 1,
            }

            // Get source line if available
            if (this.sourceLines.length >= error.line) {
                formatted.source = this.sourceLines[error.line - 1]

                // Create pointer
                if (error.column !== undefined && error.column > 0) {
                    formatted.pointer = ' '.repeat(error.column - 1) + '^'
                }

                // Get context lines (1 before, 1 after)
                formatted.context = this.getContextLines(error.line, 1)
            }
        }

        return formatted
    }

    /**
     * Format multiple errors into a report
     */
    formatReport(errors: Array<{
        message: string
        severity: ErrorSeverity
        line?: number
        column?: number
        code?: string
        suggestion?: string
    }>): ErrorReport {
        const formatted = errors.map(e => this.format(e))
        const errorList = formatted.filter(e => e.severity === 'error')
        const warningList = formatted.filter(e => e.severity === 'warning')

        return {
            file: this.fileName,
            source: this.sourceLines.join('\n'),
            errors: errorList,
            warnings: warningList,
            totalErrors: errorList.length,
            totalWarnings: warningList.length,
            summary: this.createSummary(errorList.length, warningList.length),
        }
    }

    /**
     * Format error as a string for console output
     */
    formatAsString(error: FormattedError): string {
        const lines: string[] = []

        // Header: file:line:column: severity: message
        const loc = error.location
            ? `${error.location.file || '<source>'}:${error.location.line}:${error.location.column}`
            : '<unknown>'

        lines.push(`${loc}: ${error.severity}: [${error.code}] ${error.message}`)

        // Source and pointer
        if (error.source !== undefined) {
            lines.push(`  ${error.location?.line || ''} | ${error.source}`)
            if (error.pointer) {
                lines.push(`    | ${error.pointer}`)
            }
        }

        // Suggestion
        if (error.suggestion) {
            lines.push(`    = help: ${error.suggestion}`)
        }

        return lines.join('\n')
    }

    /**
     * Format entire report as string
     */
    formatReportAsString(report: ErrorReport): string {
        const lines: string[] = []

        // All errors and warnings
        for (const err of [...report.errors, ...report.warnings]) {
            lines.push(this.formatAsString(err))
            lines.push('')
        }

        // Summary
        lines.push(report.summary)

        return lines.join('\n')
    }

    // Private helpers
    private getContextLines(centerLine: number, radius: number): string[] {
        const context: string[] = []
        const start = Math.max(1, centerLine - radius)
        const end = Math.min(this.sourceLines.length, centerLine + radius)

        for (let i = start; i <= end; i++) {
            if (i !== centerLine) {
                context.push(`${i} | ${this.sourceLines[i - 1]}`)
            }
        }

        return context
    }

    private createSummary(errors: number, warnings: number): string {
        if (errors === 0 && warnings === 0) {
            return '✓ No errors or warnings'
        }

        const parts: string[] = []
        if (errors > 0) {
            parts.push(`${errors} error${errors > 1 ? 's' : ''}`)
        }
        if (warnings > 0) {
            parts.push(`${warnings} warning${warnings > 1 ? 's' : ''}`)
        }

        const status = errors > 0 ? '✗' : '⚠'
        return `${status} ${parts.join(', ')}`
    }

    private inferErrorCode(severity: ErrorSeverity, message: string): string {
        // Try to infer error code from message content
        const lowerMsg = message.toLowerCase()

        if (severity === 'error') {
            if (lowerMsg.includes('undriven')) return ErrorCodes.UNDRIVEN_SIGNAL
            if (lowerMsg.includes('multi') && lowerMsg.includes('driven')) return ErrorCodes.MULTI_DRIVEN_SIGNAL
            if (lowerMsg.includes('undefined')) return ErrorCodes.UNDEFINED_SIGNAL
            if (lowerMsg.includes('syntax')) return ErrorCodes.SYNTAX_ERROR
            return ErrorCodes.SYNTAX_ERROR
        }

        if (severity === 'warning') {
            if (lowerMsg.includes('blocking') && lowerMsg.includes('sequential')) return ErrorCodes.BLOCKING_IN_SEQUENTIAL
            if (lowerMsg.includes('non-blocking') || lowerMsg.includes('nonblocking')) return ErrorCodes.NONBLOCKING_IN_COMBINATIONAL
            if (lowerMsg.includes('default')) return ErrorCodes.MISSING_DEFAULT_CASE
            if (lowerMsg.includes('sensitivity')) return ErrorCodes.INCOMPLETE_SENSITIVITY
            return 'W000'
        }

        return 'I000'
    }
}

// ============================================================================
// Utility Functions
// ============================================================================

/**
 * Create a formatted error report from source and errors
 */
export function formatErrors(
    source: string,
    errors: Array<{
        message: string
        severity: ErrorSeverity
        line?: number
        column?: number
        code?: string
        suggestion?: string
    }>,
    fileName?: string
): ErrorReport {
    const formatter = new ErrorFormatter(source, fileName)
    return formatter.formatReport(errors)
}

/**
 * Create a source pointer string (^^^) at the given column
 */
export function createPointer(column: number, length: number = 1): string {
    return ' '.repeat(Math.max(0, column - 1)) + '^'.repeat(Math.max(1, length))
}

/**
 * Extract line from source at given line number
 */
export function getSourceLine(source: string, lineNumber: number): string | undefined {
    const lines = source.split('\n')
    if (lineNumber > 0 && lineNumber <= lines.length) {
        return lines[lineNumber - 1]
    }
    return undefined
}
