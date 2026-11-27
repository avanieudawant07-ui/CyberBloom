import React, { useEffect, useRef, useState } from 'react';

export default function AnimatedNumber({ value = 0, duration = 340, suffix = '' }) {
  const [displayValue, setDisplayValue] = useState(value);
  const prevRef = useRef(value);

  useEffect(() => {
    const startVal = prevRef.current;
    const endVal = Number(value) || 0;
    if (startVal === endVal) {
      setDisplayValue(endVal);
      return undefined;
    }

    let frameId = null;
    const startTime = performance.now();

    const tick = (now) => {
      const elapsed = now - startTime;
      const progress = Math.min(1, elapsed / duration);
      // Ease out cubic
      const eased = 1 - Math.pow(1 - progress, 3);
      const current = Math.round(startVal + (endVal - startVal) * eased);
      setDisplayValue(current);

      if (progress < 1) {
        frameId = requestAnimationFrame(tick);
      } else {
        prevRef.current = endVal;
      }
    };

    frameId = requestAnimationFrame(tick);
    return () => {
      if (frameId) cancelAnimationFrame(frameId);
      prevRef.current = endVal;
    };
  }, [value, duration]);

  return (
    <span className="tabular-nums">
      {displayValue}
      {suffix}
    </span>
  );
}
