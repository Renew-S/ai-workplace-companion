import { useCallback, useEffect, useRef, useState } from "react";

const EVENT = "wai:local-storage";

function read<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key);
    if (raw) return JSON.parse(raw) as T;
  } catch {
    /* ignore */
  }
  return fallback;
}

export function useLocalStorage<T>(key: string, initial: T) {
  const [value, setValue] = useState<T>(initial);
  const valueRef = useRef<T>(initial);
  valueRef.current = value;

  useEffect(() => {
    const stored = read(key, initial);
    valueRef.current = stored;
    setValue(stored);
    const onChange = (e: Event) => {
      const detail = (e as CustomEvent<{ key: string; value: unknown }>).detail;
      if (detail?.key === key) {
        valueRef.current = detail.value as T;
        setValue(detail.value as T);
      }
    };
    window.addEventListener(EVENT, onChange);
    return () => window.removeEventListener(EVENT, onChange);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key]);

  const set = useCallback(
    (next: T | ((prev: T) => T)) => {
      const resolved =
        typeof next === "function"
          ? (next as (p: T) => T)(valueRef.current)
          : next;
      valueRef.current = resolved;
      setValue(resolved);
      try {
        localStorage.setItem(key, JSON.stringify(resolved));
      } catch {
        /* ignore */
      }
      window.dispatchEvent(
        new CustomEvent(EVENT, { detail: { key, value: resolved } }),
      );
    },
    [key],
  );

  return [value, set, true] as const;
}
