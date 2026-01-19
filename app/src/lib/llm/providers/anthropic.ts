
import Anthropic from '@anthropic-ai/sdk';
import { LLMProvider, LLMRequest, LLMResponse, StreamCallback } from '../types';

export class AnthropicProvider implements LLMProvider {
    id = 'anthropic';
    private client: Anthropic;
    private defaultModel: string;

    constructor(apiKey?: string, defaultModel: string = 'claude-3-5-sonnet-20241022') {
        this.client = new Anthropic({
            apiKey: apiKey || process.env.ANTHROPIC_API_KEY,
        });
        this.defaultModel = defaultModel;
    }

    async generate(request: LLMRequest): Promise<LLMResponse> {
        const response = await this.client.messages.create({
            model: request.model || this.defaultModel,
            max_tokens: request.maxTokens || 4096,
            temperature: request.temperature || 0,
            system: request.systemPrompt,
            messages: [{ role: 'user', content: request.userPrompt }],
        });

        const content = response.content[0].type === 'text' ? response.content[0].text : '';

        return {
            content,
            usage: {
                inputTokens: response.usage.input_tokens,
                outputTokens: response.usage.output_tokens,
            },
        };
    }

    async stream(request: LLMRequest, onChunk: StreamCallback): Promise<LLMResponse> {
        const stream = await this.client.messages.create({
            model: request.model || this.defaultModel,
            max_tokens: request.maxTokens || 4096,
            temperature: request.temperature || 0,
            system: request.systemPrompt,
            messages: [{ role: 'user', content: request.userPrompt }],
            stream: true,
        });

        let fullContent = '';
        let usage = { inputTokens: 0, outputTokens: 0 };

        for await (const chunk of stream) {
            if (chunk.type === 'content_block_delta' && chunk.delta.type === 'text_delta') {
                const text = chunk.delta.text;
                fullContent += text;
                onChunk(text);
            }
            if (chunk.type === 'message_start') {
                usage.inputTokens = chunk.message.usage.input_tokens;
            }
            if (chunk.type === 'message_delta') {
                usage.outputTokens = chunk.usage.output_tokens;
            }
        }

        return {
            content: fullContent,
            usage,
        };
    }
}
