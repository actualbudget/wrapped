import { renderHook, act } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

import { useLocalStorage } from './useLocalStorage';

describe('useLocalStorage', () => {
  const mockLocalStorage = (() => {
    let store: Record<string, string> = {};

    return {
      getItem: (key: string) => store[key] || null,
      setItem: (key: string, value: string) => {
        store[key] = value.toString();
      },
      removeItem: (key: string) => {
        delete store[key];
      },
      clear: () => {
        store = {};
      },
    };
  })();

  beforeEach(() => {
    Object.defineProperty(window, 'localStorage', {
      value: mockLocalStorage,
      writable: true,
    });
    mockLocalStorage.clear();
  });

  afterEach(() => {
    mockLocalStorage.clear();
  });

  it('returns initial value when localStorage is empty', () => {
    const { result } = renderHook(() => useLocalStorage('test-key', 'initial'));

    expect(result.current[0]).toBe('initial');
  });

  it('returns stored value from localStorage', () => {
    mockLocalStorage.setItem('test-key', JSON.stringify('stored-value'));

    const { result } = renderHook(() => useLocalStorage('test-key', 'initial'));

    expect(result.current[0]).toBe('stored-value');
  });

  it('updates localStorage when value changes', () => {
    const { result } = renderHook(() => useLocalStorage('test-key', 'initial'));

    act(() => {
      result.current[1]('new-value');
    });

    expect(result.current[0]).toBe('new-value');
    expect(mockLocalStorage.getItem('test-key')).toBe(JSON.stringify('new-value'));
  });

  it('handles object values', () => {
    const initialValue = { name: 'Test', count: 0 };
    const { result } = renderHook(() => useLocalStorage('test-key', initialValue));

    act(() => {
      result.current[1]({ name: 'Updated', count: 1 });
    });

    expect(result.current[0]).toEqual({ name: 'Updated', count: 1 });
    expect(mockLocalStorage.getItem('test-key')).toBe(
      JSON.stringify({ name: 'Updated', count: 1 }),
    );
  });

  it('handles array values', () => {
    const initialValue = [1, 2, 3];
    const { result } = renderHook(() => useLocalStorage('test-key', initialValue));

    act(() => {
      result.current[1]([4, 5, 6]);
    });

    expect(result.current[0]).toEqual([4, 5, 6]);
  });

  it('handles number values', () => {
    const { result } = renderHook(() => useLocalStorage('test-key', 0));

    act(() => {
      result.current[1](42);
    });

    expect(result.current[0]).toBe(42);
  });

  it('handles boolean values', () => {
    const { result } = renderHook(() => useLocalStorage('test-key', false));

    act(() => {
      result.current[1](true);
    });

    expect(result.current[0]).toBe(true);
  });

  it('handles function updater', () => {
    const { result } = renderHook(() => useLocalStorage('test-key', 0));

    act(() => {
      result.current[1](prev => prev + 1);
    });

    expect(result.current[0]).toBe(1);

    act(() => {
      result.current[1](prev => prev * 2);
    });

    expect(result.current[0]).toBe(2);
  });

  it('handles invalid JSON in localStorage', () => {
    mockLocalStorage.setItem('test-key', 'invalid-json');
    const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

    const { result } = renderHook(() => useLocalStorage('test-key', 'initial'));

    expect(result.current[0]).toBe('initial');
    expect(consoleErrorSpy).toHaveBeenCalled();

    consoleErrorSpy.mockRestore();
  });

  it('handles localStorage setItem errors gracefully', () => {
    const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    const setItemSpy = vi.spyOn(mockLocalStorage, 'setItem').mockImplementation(() => {
      throw new Error('QuotaExceededError');
    });

    const { result } = renderHook(() => useLocalStorage('test-key', 'initial'));

    act(() => {
      result.current[1]('new-value');
    });

    // Should not throw, but value should still update in state
    expect(result.current[0]).toBe('new-value');
    expect(consoleErrorSpy).toHaveBeenCalled();

    setItemSpy.mockRestore();
    consoleErrorSpy.mockRestore();
  });

  it('persists value across multiple renders', () => {
    const { result, rerender } = renderHook(() => useLocalStorage('test-key', 'initial'));

    act(() => {
      result.current[1]('persisted');
    });

    rerender();

    expect(result.current[0]).toBe('persisted');
  });

  it('handles null values', () => {
    const { result } = renderHook(() => useLocalStorage('test-key', null));

    expect(result.current[0]).toBeNull();

    act(() => {
      result.current[1](null);
    });

    expect(result.current[0]).toBeNull();
  });

  it('handles complex nested objects', () => {
    const complexValue = {
      user: {
        name: 'Test',
        preferences: {
          theme: 'dark',
          notifications: true,
        },
      },
      items: [1, 2, 3],
    };

    const { result } = renderHook(() => useLocalStorage('test-key', complexValue));

    act(() => {
      result.current[1]({
        ...complexValue,
        user: { ...complexValue.user, name: 'Updated' },
      });
    });

    expect(result.current[0].user.name).toBe('Updated');
  });
});
