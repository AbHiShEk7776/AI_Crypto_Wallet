import React, { useState, useEffect } from 'react';
import clsx from 'clsx';
import SparklesBackground from './SparklesBackground';

export default function MouseRippleBackground({ children }) {
  const [pos, setPos] = useState({ x: 0, y: 0 });
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const handleMove = (e) => {
      setPos({ x: e.clientX, y: e.clientY });
      setVisible(true);
    };

    const handleLeave = () => {
      setVisible(false);
    };

    window.addEventListener('mousemove', handleMove);
    window.addEventListener('mouseleave', handleLeave);

    return () => {
      window.removeEventListener('mousemove', handleMove);
      window.removeEventListener('mouseleave', handleLeave);
    };
  }, []);

  return (
   <div className="relative min-h-screen bg-slate-950 text-white overflow-hidden">
      {/* Base dark gradient */}
      <div className="pointer-events-none fixed inset-0 z-0 bg-gradient-to-br from-slate-950 via-slate-950 to-black opacity-100" />

      {/* Sparkles field */}
      <SparklesBackground />
      {/* Ripple / glow layer */}
      <div
        className={clsx(
          'pointer-events-none fixed inset-0 z-0 transition-opacity duration-300',
          visible ? 'opacity-80' : 'opacity-0'
        )}
        style={{
          background: `radial-gradient(
            600px circle at ${pos.x}px ${pos.y}px,
            rgba(99, 102, 241, 0.35),
            transparent 60%
          )`,
        }}
      />

      {/* Optional base gradient behind everything */}
      <div className="pointer-events-none fixed inset-0 z-0 bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 opacity-80" />

      {/* Actual app content above the effect */}
      <div className="relative z-10">
        {children}
      </div>
      <div
  className={clsx(
    'pointer-events-none fixed inset-0 z-0 transition-opacity duration-200',
    visible ? 'opacity-100' : 'opacity-0'
  )}
  style={{
    background: `radial-gradient(
      120px circle at ${pos.x}px ${pos.y}px,
      rgba(129, 140, 248, 0.55),   /* bright indigo glow */
      rgba(56, 189, 248, 0.35),   /* cyan mid-ring */
      transparent 70%
    )`,
    mixBlendMode: 'screen',        // makes it pop on dark bg
  }}
/>

    </div>
  );
}
