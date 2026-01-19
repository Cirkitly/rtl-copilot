
import { describe, it, expect, vi } from 'vitest';
import { LLMFactory } from '../factory';
import { AnthropicProvider } from '../providers/anthropic';
import { OpenAIProvider } from '../providers/openai';

// Mock the SDKs to avoid instantiation errors
vi.mock('@anthropic-ai/sdk', () => {
    return {
        default: class MockAnthropic {
            messages = { create: vi.fn() };
            constructor(options: any) { }
        }
    };
});

vi.mock('openai', () => {
    return {
        default: class MockOpenAI {
            chat = { completions: { create: vi.fn() } };
            constructor(options: any) { }
        }
    };
});

describe('LLMFactory', () => {
    it('creates Anthropic provider', () => {
        const provider = LLMFactory.createProvider('anthropic', { apiKey: 'test' });
        expect(provider).toBeInstanceOf(AnthropicProvider);
        expect(provider.id).toBe('anthropic');
    });

    it('creates OpenAI provider', () => {
        const provider = LLMFactory.createProvider('openai', { apiKey: 'test' });
        expect(provider).toBeInstanceOf(OpenAIProvider);
        expect(provider.id).toBe('openai');
    });

    it('creates Ollama provider as OpenAI compatible', () => {
        const provider = LLMFactory.createProvider('ollama', { baseUrl: 'http://localhost:11434' });
        expect(provider).toBeInstanceOf(OpenAIProvider);
    });

    it('throws on unknown provider', () => {
        expect(() => LLMFactory.createProvider('unknown' as any)).toThrow();
    });
});

