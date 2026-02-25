import { useState, useEffect, useRef, useCallback } from "react";

/**
 * Simulates a live-updating booking fee (0–5) with stock-market-style fluctuations.
 * Returns the current fee, the delta since last tick, and a history array for sparklines.
 */
export function useLiveFee(bookingFee = 5) {
  const [fee, setFee] = useState(bookingFee / 2);
  const [delta, setDelta] = useState(0);
  const [history, setHistory] = useState<number[]>([bookingFee / 2]);
  const prevFee = useRef(bookingFee / 2);

  useEffect(() => {
    const interval = setInterval(() => {
      setFee((prev) => {
        const change = (Math.random() - 0.48) * 0.4;
        const next = Math.max(0, Math.min(bookingFee, prev + change));
        const rounded = Math.round(next * 100) / 100;
        setDelta(rounded - prevFee.current);
        prevFee.current = rounded;
        setHistory((h) => [...h.slice(-29), rounded]);
        return rounded;
      });
    }, 1200);

    return () => clearInterval(interval);
  }, [bookingFee]);

  const capture = useCallback(() => fee, [fee]);

  return { fee, delta, history, capture };
}
