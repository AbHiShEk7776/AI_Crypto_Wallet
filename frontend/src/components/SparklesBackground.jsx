import React, { useMemo } from 'react';

const SPARKLE_COUNT = 250;

export default function SparklesBackground() {
  // Generate random sparkles once
  const sparkles = useMemo(
    () =>
      Array.from({ length: SPARKLE_COUNT }).map((_, i) => ({
        id: i,
        top: Math.random() * 100,   // vh
        left: Math.random() * 100,  // vw
        size: 2 + Math.random() * 3,
        delay: Math.random() * 5,   // seconds
        duration: 3 + Math.random() * 4
      })),
    []
  );

  return (
    <div className="pointer-events-none fixed inset-0 z-0 overflow-hidden">
      {sparkles.map((s) => (
        <div
          key={s.id}
         className="absolute rounded-full bg-cyan-400/80 shadow-[0_0_15px_rgba(34,211,238,0.9)]"
          style={{
            top: `${s.top}vh`,
            left: `${s.left}vw`,
            width: `${s.size}px`,
            height: `${s.size}px`,
            animation: `sparkle-float ${s.duration}s ease-in-out ${s.delay}s infinite`,
            animationDuration: `${s.duration}s`,
            animationDelay: `${s.delay}s`,
            opacity: 0.75
          }}
        />
      ))}
    </div>
  );
}
