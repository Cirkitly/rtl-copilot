
import { NextRequest, NextResponse } from 'next/server';
import { LLMFactory, ProviderType } from '@/lib/llm/factory';
import { constructPrompt } from '@/lib/llm/context';
import { checkRateLimit, rateLimitHeaders, getClientId, LLM_RATE_LIMIT } from '@/lib/rateLimit';

// Helper to extract code block
function extractCodeBlock(text: string): string {
    const match = text.match(/```(?:verilog|systemverilog)?\n([\s\S]*?)\n```/);
    return match ? match[1] : text;
}

export async function POST(req: NextRequest) {
    try {
        // Rate limiting check
        const clientId = getClientId(req);
        const rateLimitResult = checkRateLimit(`llm:generate:${clientId}`, LLM_RATE_LIMIT);

        if (!rateLimitResult.success) {
            return NextResponse.json(
                { error: 'Rate limit exceeded. Please try again later.' },
                {
                    status: 429,
                    headers: rateLimitHeaders(rateLimitResult, LLM_RATE_LIMIT)
                }
            );
        }

        const body = await req.json();
        const {
            provider = 'anthropic',
            model,
            userQuery,
            projectFiles = [],
            systemOptions = {},
            stream = false,
            mode = 'standard' // 'standard' | 'iterative'
        } = body;

        const llmProvider = LLMFactory.createProvider(provider as ProviderType, { defaultModel: model });

        // Base Prompt Construction
        const systemPromptText = constructPrompt('', [], { systemOptions }).split('USER REQUEST:')[0].trim();
        let currentPrompt = constructPrompt(userQuery, projectFiles, { systemOptions }).replace(systemPromptText, '').trim();

        // Initial Generation
        const llmRequest = {
            systemPrompt: systemPromptText,
            userPrompt: currentPrompt,
            maxTokens: 4096
        };

        // If streaming, we just return the stream (Iterative not supported in streaming yet)
        if (stream) {
            const encoder = new TextEncoder();
            const customStream = new ReadableStream({
                async start(controller) {
                    const onChunk = (text: string) => {
                        controller.enqueue(encoder.encode(text));
                    };
                    await llmProvider.stream(llmRequest, onChunk);
                    controller.close();
                }
            });
            return new NextResponse(customStream, {
                headers: { 'Content-Type': 'text/plain; charset=utf-8' }
            });
        }

        // Standard Generation
        let response = await llmProvider.generate(llmRequest);

        // Iterative Refinement Loop
        if (mode === 'iterative') {
            const { parse } = await import('@/lib/verilog/parser');
            const { cstToAst } = await import('@/lib/verilog/visitor');
            const { validateModule } = await import('@/lib/verilog/validator');

            let iterations = 0;
            const maxIterations = 3;
            let isValid = false;

            while (iterations < maxIterations && !isValid) {
                try {
                    const code = extractCodeBlock(response.content);
                    const parseResult = parse(code);

                    if (parseResult.errors.length > 0) {
                        // Syntax errors
                        const errorMsg = parseResult.errors.map(e => `Line ${e.line}: ${e.message}`).join('\n');
                        const refinementPrompt = `
The generated code had syntax errors:
${errorMsg}

Please fix the syntax and regenerate the code.
`;
                        llmRequest.userPrompt += `\n\nAssistant: ${response.content}\n\nUser: ${refinementPrompt}`;
                        response = await llmProvider.generate(llmRequest);
                        iterations++;
                        continue;
                    }

                    // CST -> AST -> Validate
                    const ast = cstToAst(parseResult.cst);
                    const validation = validateModule(ast);

                    if (validation.isValid) {
                        isValid = true;
                        break;
                    }

                    // Logic errors
                    const errors = validation.errors.map(e => `- Line ${e.line}: ${e.message}`).join('\n');
                    const refinementPrompt = `
The previous generation had the following lint errors:
${errors}

Please fix these errors and regenerate the full module code.
`;
                    llmRequest.userPrompt += `\n\nAssistant: ${response.content}\n\nUser: ${refinementPrompt}`;

                    console.log(`[Iterative] Retrying... (${iterations + 1}) Errors: ${validation.errors.length}`);

                    response = await llmProvider.generate(llmRequest);
                    iterations++;

                } catch (err: any) {
                    console.error('Refinement loop error:', err);
                    break; // Exit loop on unexpected error to return what we have
                }
            }
        }


        return NextResponse.json(response);

    } catch (error: any) {
        console.error('LLM API Error:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
