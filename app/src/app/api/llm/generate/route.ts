
import { NextRequest, NextResponse } from 'next/server';
import { LLMFactory, ProviderType } from '@/lib/llm/factory';
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
        const {
            provider = 'anthropic',
            model,
            userQuery,
            projectFiles = [],
            systemOptions = {},
            stream = false
        } = body;

        const llmProvider = LLMFactory.createProvider(provider as ProviderType, { defaultModel: model });

        const fullPrompt = constructPrompt(userQuery, projectFiles, { systemOptions });

        const requestPayload = {
            systemPrompt: fullPrompt.split('USER REQUEST:')[0], // Split strictly for API that support 'system' role
            userPrompt: `USER REQUEST:\n${userQuery}`, // Or keep full prompt if needed, but providers split system/user
            // Actually, constructPrompt combines them. Providers expect separate system/user often.
            // Let's adjust usage:
            // constructPrompt returns a big string.
            // But LLMRequest interface has systemPrompt and userPrompt.
            // We should probably rely on constructPrompt for the "System" part primarily, 
            // but generic providers might work better if we separate them.
            //
            // Valid Strategy: 
            // 1. extract system part from constructPrompt logic (or call getSystemPrompt directly)
            // 2. build user part with context and query
        };

        // Refined prompt handling
        const systemPromptText = constructPrompt('', [], { systemOptions }).split('USER REQUEST:')[0].trim();
        // Re-construct the user logic part (Context + Examples + Query)
        // We can cheat: constructPrompt(userQuery, projectFiles) contains everything.
        // If we pass everything as "User Prompt" it works for most models, but setting "System Prompt" is better.

        // Let's do:
        // System = getSystemPrompt()
        // User = Context + Examples + Query

        // We need to import helper functions again properly or just use constructPrompt's logic.
        // For now, let's use the constructPrompt result as the USER prompt (and empty system default? no, system is strong).
        // Better: let's update constructPrompt in future to support separation.
        // Current workaround:

        const llmRequest = {
            systemPrompt: systemPromptText, // The Persona + Rues
            userPrompt: fullPrompt.replace(systemPromptText, '').trim(), // The Context + Examples + Query
            maxTokens: 4096
        };

        if (stream) {
            // Simple streaming response setup
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
        } else {
            const response = await llmProvider.generate(llmRequest);
            return NextResponse.json(response);
        }

    } catch (error: any) {
        console.error('LLM API Error:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
