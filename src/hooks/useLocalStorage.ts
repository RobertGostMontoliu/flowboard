import { useState } from "react";

export function useLocalStorage<T>(key: string, initialValue: T) {
  const [value, setValue] = useState<T>(() => {
    try {
      const stored = window.localStorage.getItem(key);
      return stored ? (JSON.parse(stored) as T) : initialValue;
    } catch {
      return initialValue;
    }
  });

  function updateValue(next: T | ((current: T) => T)) {
    setValue((current) => {
      const resolved =
        typeof next === "function" ? (next as (value: T) => T)(current) : next;
      try {
        window.localStorage.setItem(key, JSON.stringify(resolved));
      } catch {
        /* The current session remains usable if storage is unavailable. */
      }
      return resolved;
    });
  }

  return [value, updateValue] as const;
}
