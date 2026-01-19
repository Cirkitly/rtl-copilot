
import { getSystemPrompt, SystemPromptOptions } from './prompts/system';
import { getFewShotExamples } from './prompts/examples';

export interface ProjectContextFile {
    name: string;
    content: string;
}

export interface PromptConstructionOptions {
    systemOptions?: SystemPromptOptions;
    topic?: string; // For selecting few-shot examples
}

/**
 * Formats the project files into a single context string.
 * Currently matches the whole file content. Future optimization: only include module headers.
 */
export const buildContext = (files: ProjectContextFile[]): string => {
    if (files.length === 0) return '';

    const fileContexts = files.map(file =>
        `File: ${file.name}\n\`\`\`verilog\n${file.content}\n\`\`\``
    ).join('\n\n');

    return `EXISTING PROJECT CONTEXT:\nThe following files exist in the user's project. Use their signal names and module interfaces if relevant.\n\n${fileContexts}`;
};

/**
 * Constructs the full prompt payload for the LLM.
 */
export const constructPrompt = (
    userQuery: string,
    projectFiles: ProjectContextFile[] = [],
    options: PromptConstructionOptions = {}
): string => {
    const systemPrompt = getSystemPrompt(options.systemOptions);

    const contextBlock = buildContext(projectFiles);

    const examples = getFewShotExamples(options.topic || 'general');
    const examplesBlock = examples.length > 0
        ? `FEW-SHOT EXAMPLES:\n${examples.map(ex => `Input: ${ex.description}\nOutput:\n\`\`\`verilog\n${ex.code}\n\`\`\``).join('\n\n')}`
        : '';

    // Order: 
    // 1. System Prompt (defines persona and rules)
    // 2. Context (background info)
    // 3. Examples (style guide)
    // 4. User Query (immediate task)

    return `${systemPrompt}

${contextBlock}

${examplesBlock}

USER REQUEST:
${userQuery}
`;
};
