import { useCallback, useRef, useEffect } from 'react';

interface UseDebounceOptions {
  delay?: number;
  maxWait?: number;
}

export function useDebounce<T extends (...args: any[]) => any>(
  callback: T,
  options: UseDebounceOptions = {}
) {
  const { delay = 500, maxWait = 2000 } = options;
  
  const timeoutRef = useRef<NodeJS.Timeout>();
  const maxWaitTimeoutRef = useRef<NodeJS.Timeout>();
  const callbackRef = useRef(callback);
  const lastCallTime = useRef<number>();
  const lastArgs = useRef<Parameters<T>>();

  useEffect(() => {
    callbackRef.current = callback;
  }, [callback]);

  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
      if (maxWaitTimeoutRef.current) {
        clearTimeout(maxWaitTimeoutRef.current);
      }
    };
  }, []);

  const debouncedCallback = useCallback(
    (...args: Parameters<T>) => {
      lastArgs.current = args;
      const now = Date.now();

      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }

      if (!lastCallTime.current || (now - lastCallTime.current >= maxWait)) {
        lastCallTime.current = now;
        callbackRef.current(...args);
        return;
      }

      timeoutRef.current = setTimeout(() => {
        lastCallTime.current = Date.now();
        callbackRef.current(...lastArgs.current!);
      }, delay);

      if (!maxWaitTimeoutRef.current) {
        maxWaitTimeoutRef.current = setTimeout(() => {
          if (lastArgs.current) {
            lastCallTime.current = Date.now();
            callbackRef.current(...lastArgs.current);
          }
          maxWaitTimeoutRef.current = undefined;
        }, maxWait);
      }
    },
    [delay, maxWait]
  );

  return debouncedCallback;
}