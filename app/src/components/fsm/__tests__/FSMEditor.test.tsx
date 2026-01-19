import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { FSMEditor } from '../FSMEditor';

// Mock ResizeObserver
class ResizeObserver {
    observe() { }
    unobserve() { }
    disconnect() { }
}

describe('FSMEditor', () => {
    beforeEach(() => {
        global.ResizeObserver = ResizeObserver;

        // Mock window properties needed by ReactFlow
        Object.defineProperty(window, 'DOMMatrixReadOnly', {
            writable: true,
            value: vi.fn(),
        });
    });

    it('should render without crashing', () => {
        // Basic render test
        // Note: detailed interaction testing requires more complex ReactFlow mocks
        const { container } = render(<FSMEditor />);
        expect(container).toBeDefined();
    });
});
