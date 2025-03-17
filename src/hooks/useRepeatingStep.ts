import { useEffect, useRef } from "react";

export function useRepeatingStep(
  callback: () => void,
  step: number | null
): void {
  const cbRef = useRef(callback);

  useEffect(() => {
    cbRef.current = callback;
  }, [callback]);

  useEffect(() => {
    if (!step || step <= 0) {
      return;
    }

    const interval = setInterval(() => cbRef.current(), step);

    return () => clearInterval(interval);
  }, [step]);
}
