import '@testing-library/jest-dom/vitest';
import { cleanup } from '@testing-library/react';
import { afterEach, vi } from 'vitest';

// Automatically unmount rendered React trees after each test
afterEach(() => {
  cleanup();
});

// Polyfill window.matchMedia for jsdom
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: vi.fn().mockImplementation((query: string) => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: vi.fn(),
    removeListener: vi.fn(),
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    dispatchEvent: vi.fn(),
  })),
});

// Polyfill ResizeObserver for Radix and Recharts
const ResizeObserverMock = class ResizeObserver {
  observe() {}
  unobserve() {}
  disconnect() {}
};

(globalThis as any).ResizeObserver = ResizeObserverMock;
if (typeof window !== 'undefined') {
  (window as any).ResizeObserver = ResizeObserverMock;
}

// Polyfill PointerEvent methods for Radix UI primitives
if (typeof window !== 'undefined') {
  window.HTMLElement.prototype.scrollIntoView = vi.fn();
  window.HTMLElement.prototype.hasPointerCapture = vi.fn().mockReturnValue(false);
  window.HTMLElement.prototype.setPointerCapture = vi.fn();
  window.HTMLElement.prototype.releasePointerCapture = vi.fn();

  // Radix UI dropdown and dialog bounding rects
  window.HTMLElement.prototype.getBoundingClientRect = vi.fn().mockReturnValue({
    x: 0,
    y: 0,
    top: 0,
    left: 0,
    bottom: 0,
    right: 0,
    width: 100,
    height: 100,
    toJSON: () => {},
  });

  window.DOMRect = class DOMRect {
    bottom = 0;
    left = 0;
    right = 0;
    top = 0;
    x = 0;
    y = 0;
    width = 100;
    height = 100;
    toJSON() {
      return {};
    }
    static fromRect() {
      return new DOMRect();
    }
  } as any;
}
