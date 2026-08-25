"use client";

import React, { useEffect, useRef } from "react";

interface AtmosphericBackgroundProps {
  mouseRef: React.RefObject<{ x: number; y: number }>;
}

export function AtmosphericBackground({ mouseRef }: AtmosphericBackgroundProps) {
  const orb1Ref = useRef<HTMLDivElement>(null);
  const orb2Ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    let animFrameId: number;
    // Track the last applied position to skip frames when nothing changed
    let lastX = 0;
    let lastY = 0;
    // Whether the mouse has moved since the last rAF flush
    let dirty = false;

    // Only mark dirty (schedule a repaint) when mouse actually moves
    const markDirty = () => {
      dirty = true;
    };

    const updateOrbs = () => {
      // Only write to DOM when there is something new to paint
      if (dirty) {
        const x = mouseRef.current?.x || 0;
        const y = mouseRef.current?.y || 0;

        if (x !== lastX || y !== lastY) {
          lastX = x;
          lastY = y;

          if (orb1Ref.current) {
            orb1Ref.current.style.transform = `translate3d(${x * 30}px, ${y * 30}px, 0)`;
          }
          if (orb2Ref.current) {
            orb2Ref.current.style.transform = `translate3d(${x * -20}px, ${y * -20}px, 0)`;
          }
        }

        dirty = false;
      }

      animFrameId = requestAnimationFrame(updateOrbs);
    };

    // Listen for mouse movement to schedule updates
    window.addEventListener("mousemove", markDirty, { passive: true });
    animFrameId = requestAnimationFrame(updateOrbs);

    return () => {
      window.removeEventListener("mousemove", markDirty);
      cancelAnimationFrame(animFrameId);
    };
  }, [mouseRef]);

  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none z-0">
      {/* Deep Graphite Base */}
      <div className="absolute inset-0 bg-[#05070d]" />

      {/* Volumetric Light Orb 1 (Indigo) — mouse-tracked */}
      <div
        ref={orb1Ref}
        className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] h-[420px] bg-indigo-600/15 blur-[140px] rounded-full will-change-transform"
      />

      {/* Volumetric Light Orb 2 (Purple) — mouse-tracked */}
      <div
        ref={orb2Ref}
        className="absolute top-1/3 left-1/3 w-[450px] h-[450px] bg-purple-600/10 blur-[100px] rounded-full will-change-transform"
      />

      {/* Volumetric Light Orb 3 (Cyan Accent) — static, no rAF needed */}
      <div className="absolute bottom-1/4 right-1/4 w-[480px] h-[320px] bg-sky-600/10 blur-[130px] rounded-full pointer-events-none" />

      {/* Subtle Spatial Dot Matrix */}
      <div
        className="absolute inset-0 opacity-[0.03] pointer-events-none"
        style={{
          backgroundImage: `radial-gradient(circle at 1px 1px, #818cf8 1px, transparent 0)`,
          backgroundSize: "40px 40px",
        }}
      />
    </div>
  );
}
