
/**
 * Generic Interface for LLM Providers.
 * Allows switching between Claude, OpenAI, Ollama, etc.
 */

export interface LLMRequest {
    systemPrompt: string;
    userPrompt: string;
    temperature?: number;
    maxTokens?: number;
    model?: string; // Provider-specific model ID (e.g. "claude-3-opus", "gpt-4")
}

export interface LLMResponse {
    content: string;
    usage?: {
        inputTokens: number;
        outputTokens: number;
    };
}

export type StreamCallback = (chunk: string) => void;

export interface LLMProvider {
    /**
     * Unique identifier for the provider (e.g. 'anthropic', 'openai')
     */
    id: string;

    /**
     * Generates a complete response (non-streaming).
     */
    generate(request: LLMRequest): Promise<LLMResponse>;

    /**
     * Generates a response stream.
     * Calls onChunk for each token/chunk received.
     * Returns the full accumulated response at the end.
     */
    stream(request: LLMRequest, onChunk: StreamCallback): Promise<LLMResponse>;
}

export interface LLMProviderConfig {
    apiKey?: string;
    baseUrl?: string; // For Ollama/LocalAI
    defaultModel?: string;
}
