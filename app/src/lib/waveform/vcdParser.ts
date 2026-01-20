/**
 * VCD (Value Change Dump) Parser
 * Parses VCD files for waveform visualization
 */

export interface VCDSignal {
    id: string;
    name: string;
    width: number;
    type: 'wire' | 'reg' | 'integer' | 'real';
    scope: string[];
}

export interface ValueChange {
    time: number;
    value: string; // Binary string for multi-bit, '0'|'1'|'x'|'z' for single-bit
}

export interface VCDData {
    timescale: string;
    date?: string;
    version?: string;
    signals: Map<string, VCDSignal>;
    changes: Map<string, ValueChange[]>;
}

export function parseVCD(vcdContent: string): VCDData {
    const lines = vcdContent.split('\n');

    const result: VCDData = {
        timescale: '1ns',
        signals: new Map(),
        changes: new Map()
    };

    let currentScope: string[] = [];
    let inDefinitions = true;
    let currentTime = 0;

    // Signal ID to name mapping (for value changes)
    const idToSignal = new Map<string, string>();

    for (let i = 0; i < lines.length; i++) {
        const line = lines[i].trim();
        if (!line) continue;

        // Parse header/definition section
        if (line.startsWith('$')) {
            const parts = line.split(/\s+/);
            const keyword = parts[0];

            switch (keyword) {
                case '$timescale':
                    result.timescale = extractValue(lines, i);
                    break;
                case '$date':
                    result.date = extractValue(lines, i);
                    break;
                case '$version':
                    result.version = extractValue(lines, i);
                    break;
                case '$scope':
                    if (parts.length >= 3) {
                        currentScope.push(parts[2]);
                    }
                    break;
                case '$upscope':
                    currentScope.pop();
                    break;
                case '$var':
                    // $var wire 1 ! clk $end
                    if (parts.length >= 5) {
                        const type = parts[1] as VCDSignal['type'];
                        const width = parseInt(parts[2], 10);
                        const id = parts[3];
                        const name = parts[4];

                        const fullName = [...currentScope, name].join('.');

                        result.signals.set(fullName, {
                            id,
                            name,
                            width,
                            type,
                            scope: [...currentScope]
                        });

                        idToSignal.set(id, fullName);
                        result.changes.set(fullName, []);
                    }
                    break;
                case '$enddefinitions':
                    inDefinitions = false;
                    break;
            }
            continue;
        }

        // Parse value changes (after definitions)
        if (!inDefinitions) {
            // Time marker: #1234
            if (line.startsWith('#')) {
                currentTime = parseInt(line.slice(1), 10);
                continue;
            }

            // Single-bit change: 0!, 1!, x!, z!
            if (line.length >= 2 && '01xzXZ'.includes(line[0])) {
                const value = line[0].toLowerCase();
                const id = line.slice(1);
                const signalName = idToSignal.get(id);

                if (signalName) {
                    result.changes.get(signalName)?.push({ time: currentTime, value });
                }
                continue;
            }

            // Multi-bit change: b1010 ! or bxxxx !
            if (line.startsWith('b') || line.startsWith('B')) {
                const match = line.match(/^[bB]([01xzXZ]+)\s+(\S+)/);
                if (match) {
                    const value = match[1].toLowerCase();
                    const id = match[2];
                    const signalName = idToSignal.get(id);

                    if (signalName) {
                        result.changes.get(signalName)?.push({ time: currentTime, value });
                    }
                }
                continue;
            }

            // Real number: r1.234 !
            if (line.startsWith('r') || line.startsWith('R')) {
                const match = line.match(/^[rR]([0-9.eE+-]+)\s+(\S+)/);
                if (match) {
                    const value = match[1];
                    const id = match[2];
                    const signalName = idToSignal.get(id);

                    if (signalName) {
                        result.changes.get(signalName)?.push({ time: currentTime, value });
                    }
                }
                continue;
            }
        }
    }

    return result;
}

/**
 * Extract value between $keyword and $end
 * Handles: "$timescale 1ns $end" or multi-line "$date\n  Mon Jan 20\n$end"
 */
function extractValue(lines: string[], startIdx: number): string {
    let value = '';
    for (let i = startIdx; i < lines.length; i++) {
        const line = lines[i].trim();

        // Check if $end is on this line
        if (line.includes('$end')) {
            // Extract content between keyword and $end
            // For "$timescale 1ns $end", we want "1ns"
            const endIdx = line.indexOf('$end');
            let content = line.substring(0, endIdx).trim();

            // Remove the initial $keyword if present
            const keywordMatch = content.match(/^\$\w+\s+/);
            if (keywordMatch) {
                content = content.slice(keywordMatch[0].length).trim();
            }

            if (content) {
                value += content;
            }
            break;
        }

        // Multi-line: skip $keyword line, collect content lines
        if (!line.startsWith('$')) {
            value += line + ' ';
        }
    }
    return value.trim();
}

/**
 * Get signal value at a specific time
 */
export function getValueAtTime(changes: ValueChange[], time: number): string | undefined {
    // Find the last change before or at the given time
    let lastValue: string | undefined;
    for (const change of changes) {
        if (change.time <= time) {
            lastValue = change.value;
        } else {
            break;
        }
    }
    return lastValue;
}

/**
 * Convert binary string to decimal
 */
export function binaryToDecimal(binary: string): number | null {
    if (binary.includes('x') || binary.includes('z')) {
        return null; // Unknown or high-impedance
    }
    return parseInt(binary, 2);
}
