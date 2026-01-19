
import OpenAI from 'openai';
import { LLMProvider, LLMRequest, LLMResponse, StreamCallback } from '../types';

export class OpenAIProvider implements LLMProvider {
    id = 'openai';
    private client: OpenAI;
    private defaultModel: string;

    constructor(apiKey?: string, baseUrl?: string, defaultModel: string = 'gpt-4o') {
        this.client = new OpenAI({
            apiKey: apiKey || process.env.OPENAI_API_KEY || 'dummy', // Ollama needs a dummy key
            baseURL: baseUrl || process.env.OPENAI_BASE_URL,
            dangerouslyAllowBrowser: true, // If we ever run client-side, though this is server-side
        });
        this.defaultModel = defaultModel;
    }

    async generate(request: LLMRequest): Promise<LLMResponse> {
        const response = await this.client.chat.completions.create({
            model: request.model || this.defaultModel,
            max_tokens: request.maxTokens || 4096,
            temperature: request.temperature || 0,
            messages: [
                { role: 'system', content: request.systemPrompt },
                { role: 'user', content: request.userPrompt },
            ],
        });

        const content = response.choices[0].message.content || '';

        return {
            content,
            usage: {
                inputTokens: response.usage?.prompt_tokens || 0,
                outputTokens: response.usage?.completion_tokens || 0,
            },
        };
    }

    async stream(request: LLMRequest, onChunk: StreamCallback): Promise<LLMResponse> {
        const stream = await this.client.chat.completions.create({
            model: request.model || this.defaultModel,
            max_tokens: request.maxTokens || 4096,
            temperature: request.temperature || 0,
            messages: [
                { role: 'system', content: request.systemPrompt },
                { role: 'user', content: request.userPrompt },
            ],
            stream: true,
        });

        let fullContent = '';
        let usage = { inputTokens: 0, outputTokens: 0 }; // OpenAI stream usage is tricky, often null

        for await (const chunk of stream) {
            const text = chunk.choices[0]?.delta?.content || '';
            if (text) {
                fullContent += text;
                onChunk(text);
            }
            // Usage tracking in stream is provider-dependent, often not sent until end or not at all
        }

        return {
            content: fullContent,
            usage,
        };
    }
}
