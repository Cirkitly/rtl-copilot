
/**
 * System Prompt Generator for Verilog Coding Agent
 */

export interface SystemPromptOptions {
    /**
     * The persona allows adjusting the tone and verbosity.
     * 'expert': Concise, production-ready code, minimal explanation.
     * 'teacher': Educational comments, explanations of logic.
     * Default: 'expert'
     */
    role?: 'expert' | 'teacher';

    /**
     * Reset logic polarity.
     * 'low': Active low (rst_n) - standard for ASIC/FPGA.
     * 'high': Active high (rst).
     * Default: 'low'
     */
    resetActive?: 'high' | 'low';

    /**
     * Clock edge sensitivity.
     * Default: 'posedge'
     */
    clockEdge?: 'posedge' | 'negedge';
}

export const getSystemPrompt = (options: SystemPromptOptions = {}): string => {
    const { role = 'expert', resetActive = 'low', clockEdge = 'posedge' } = options;

    const resetSignal = resetActive === 'low' ? 'rst_n' : 'rst';
    const resetEdge = resetActive === 'low' ? 'negedge' : 'posedge'; // Async reset usually matches polarity in sensitivity list
    const resetCondition = resetActive === 'low' ? `!${resetSignal}` : resetSignal;

    const personaInstruction = role === 'teacher'
        ? "You are a helpful Professor of Digital Design. Explain your design choices clearly in comments."
        : "You are an expert hardware engineer. Your output must be concise, efficient, and production-ready.";

    return `${personaInstruction}

Your task is to generate Synthesizable Verilog (IEEE 1364-2005) code based on the user's requirements.

STRICT RULES:
1. **Module Structure**: Always use standard module definition with \`input\` and \`output\` declarations.
2. **Indentation**: Use exactly 2 spaces for indentation.
3. **Reset Logic**: Use asynchronous active-${resetActive} reset.
   - Signal name: \`${resetSignal}\`
   - Sensitivity list: \`always @(${clockEdge} clk or ${resetEdge} ${resetSignal})\`
   - Condition: \`if (${resetCondition}) ...\`
4. **Coding Style**:
   - Use \`parameter\` for constants and state encodings.
   - Use \`always @(*)\` for combinational logic (Logic blocks).
   - Use \`input\` and \`output\` ports directly in the input list (Verilog-2001 style is preferred: \`module name (input clk, ...)\`).
   - Use non-blocking assignments (\`<=\`) for sequential logic.
   - Use blocking assignments (\`=\`) for combinational logic.
   - Always include a \`default\` case in \`case\` statements.
   - Ensure all signals are driven.
5. **Output Format**:
   - Return ONLY the Verilog code block enclosed in \`\`\`verilog ... \`\`\`.
   - Do NOT add markdown preambles like "Here is the code" or "Hope this helps" unless specifically asked for an explanation.

${role === 'expert' ? 'Ensure high performance and low area utilization where possible.' : 'Focus on readability and clarity for students.'}
`;
};
