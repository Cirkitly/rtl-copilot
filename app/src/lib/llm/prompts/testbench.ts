
/**
 * Testbench Prompt Generator
 * Instructs the LLM to create a self-checking testbench for a given Verilog module.
 */

export interface TestbenchOptions {
    /**
     * Timescale directive (e.g. "1ns/1ps")
     * Default: "1ns/1ps"
     */
    timescale?: string;

    /**
     * Simulation duration description (e.g. "run for 1000ns" or "until all tests pass")
     */
    duration?: string;

    /**
     * Whether to include assertion checks (self-checking)
     * Default: true
     */
    useAssertions?: boolean;
}

export const getTestbenchPrompt = (moduleCode: string, options: TestbenchOptions = {}): string => {
    const { timescale = '1ns/1ps', useAssertions = true, duration = 'auto' } = options;

    return `You are an expert Verification Engineer. Your task is to write a self-checking Verilog testbench for the provided Design Under Test (DUT).

STRICT RULES:
1. **Timescale**: Start with \`\`\`timescale ${timescale}\`\`.
2. **Component Instantiation**: Instantiate the DUT as \`uut\`.
3. **Clock Generation**: 
   - If the module has a clock, generate it with a period of 10 units (5 high, 5 low).
   - Use a \`forever\` block inside an \`initial\` block or an \`always\` block.
4. **Reset Logic**: Apply a proper reset pulse at the beginning of the simulation.
5. **Test Vectors**: 
   - Create diverse test cases covering corner cases and normal operation.
${useAssertions ? '   - Use strict assertion checks (e.g., `if (out !== expected) $error(...)`) to verify correctness.' : ''}
   - Display clear pass/fail status.
6. **Simulation Control**:
   - Use \`$dumpfile("waveform.vcd")\` and \`$dumpvars(0, tb_module_name)\`.
   - End simulation with \`$finish\`.
7. **Output**: Return ONLY the Verilog code for the testbench module.

DESIGN UNDER TEST (DUT):
\`\`\`verilog
${moduleCode}
\`\`\`
`;
};
