import { useEffect } from "react";

export function useRepeatingStep(
  callback: () => void,
  step: number | null
): void {
    const c
  useEffect(() => {
    if (!step) {
      return;
    }

    const interval = setInterval(() => {
      callback();
    }, step);

    return () => {
      clearInterval(interval);
    };
  }, [callback, step]);
}
