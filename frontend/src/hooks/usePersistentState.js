import { useCallback, useEffect, useState } from 'react';

function resolveStorage(storageType) {
  if (typeof window === 'undefined') {
    return null;
  }

  return storageType === 'local' ? window.localStorage : window.sessionStorage;
}

function resolveInitialState(initialState) {
  return typeof initialState === 'function' ? initialState() : initialState;
}

export default function usePersistentState(storageKey, initialState, options = {}) {
  const { storageType = 'session' } = options;

  const readStoredState = useCallback(() => {
    const fallbackState = resolveInitialState(initialState);
    const storage = resolveStorage(storageType);

    if (!storage || !storageKey) {
      return fallbackState;
    }

    try {
      const storedValue = storage.getItem(storageKey);

      if (!storedValue) {
        return fallbackState;
      }

      return JSON.parse(storedValue);
    } catch {
      return fallbackState;
    }
  }, [initialState, storageKey, storageType]);

  const [state, setState] = useState(readStoredState);

  useEffect(() => {
    setState(readStoredState());
  }, [readStoredState]);

  useEffect(() => {
    const storage = resolveStorage(storageType);

    if (!storage || !storageKey) {
      return;
    }

    try {
      storage.setItem(storageKey, JSON.stringify(state));
    } catch {
      // Ignore storage and serialization errors.
    }
  }, [state, storageKey, storageType]);

  const clearState = useCallback(() => {
    const storage = resolveStorage(storageType);
    const fallbackState = resolveInitialState(initialState);

    if (storage && storageKey) {
      try {
        storage.removeItem(storageKey);
      } catch {
        // Ignore storage cleanup errors.
      }
    }

    setState(fallbackState);
  }, [initialState, storageKey, storageType]);

  return [state, setState, clearState];
}
