
import { LLMProvider, LLMProviderConfig } from './types';
import { AnthropicProvider } from './providers/anthropic';
import { OpenAIProvider } from './providers/openai';

export type ProviderType = 'anthropic' | 'openai' | 'ollama' | 'local';

export class LLMFactory {
    static createProvider(type: ProviderType, config: LLMProviderConfig = {}): LLMProvider {
        switch (type) {
            case 'anthropic':
                return new AnthropicProvider(config.apiKey, config.defaultModel);

            case 'openai':
                return new OpenAIProvider(config.apiKey, undefined, config.defaultModel);

            case 'ollama':
            case 'local':
                // Ollama usually runs on localhost:11434/v1
                const baseUrl = config.baseUrl || 'http://localhost:11434/v1';
                return new OpenAIProvider(config.apiKey || 'ollama', baseUrl, config.defaultModel || 'llama3');

            default:
                throw new Error(`Unknown provider type: ${type}`);
        }
    }
}
