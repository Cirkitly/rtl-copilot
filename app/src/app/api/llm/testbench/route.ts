
import { NextRequest, NextResponse } from 'next/server';
import { LLMFactory } from '@/lib/llm/factory';
import { constructPrompt } from '@/lib/llm/context';
import { checkRateLimit, rateLimitHeaders, getClientId, LLM_RATE_LIMIT } from '@/lib/rateLimit';

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
        const { code, moduleName, provider = 'anthropic', model } = body;

        const llmProvider = LLMFactory.createProvider(provider, { defaultModel: model });

        const prompt = `
You are an expert Verilog Verification Engineer.
Your task is to write a comprehensive, self-checking testbench for the following Verilog module.

MODULE CODE:
\`\`\`verilog
${code}
\`\`\`

REQUIREMENTS:
1.  The testbench module name should be \`${moduleName}_tb\`.
2.  Instantiate the DUT (Device Under Test).
3.  Generate a clock (if the module has one).
4.  Apply a proper reset sequence.
5.  Provide test vectors to cover major functionality.
6.  Use \`$display\` to log results and \`$finish\` to end simulation.
7.  Check outputs using \`if (out !== expected) $error(...)\`.
8.  Include \`initial begin $dumpfile("waveform.vcd"); $dumpvars(0, ${moduleName}_tb); end\` for VCD generation.
9.  Output ONLY the Verilog code for the testbench, wrapped in a code block.

GENERATE TESTBENCH:
`;

        const llmRequest = {
            systemPrompt: 'You are an expert Verilog verification engineer.',
            userPrompt: prompt,
            maxTokens: 4096
        };

        const response = await llmProvider.generate(llmRequest);

        // Extract code block
        const match = response.content.match(/```(?:verilog|systemverilog)?\n([\s\S]*?)\n```/);
        const tbCode = match ? match[1] : response.content;

        return NextResponse.json({ code: tbCode });

    } catch (error: any) {
        console.error('Testbench Gen Error:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
