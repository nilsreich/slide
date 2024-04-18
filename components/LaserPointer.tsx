import React, { useEffect, useRef, useState } from "react";

const LaserPointer = () => {
  const cursorRef = useRef<HTMLDivElement>(null);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [trail, setTrail] = useState<{ x: number; y: number }[]>([]);

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      setPosition({ x: e.clientX, y: e.clientY });
      // Only add new point if mouse moves, but don't slice here
      setTrail((prevTrail) => [...prevTrail, { x: e.clientX, y: e.clientY }]);
    };

    window.addEventListener("mousemove", handleMouseMove);

    // This interval controls the lifespan of each point in the trail
    const trailInterval = setInterval(() => {
      setTrail((prevTrail) => {
        if (prevTrail.length > 0) {
          return prevTrail.slice(1); // Remove the oldest point
        }
        return prevTrail;
      });
    }, 30); // Adjust time as necessary to control fade speed

    return () => {
      window.removeEventListener("mousemove", handleMouseMove);
      clearInterval(trailInterval);
    };
  }, []);

  return (
    <>
      
      {trail.map((trailPosition, index) => (
        <div
          key={index}
          className="fixed pointer-events-none w-6 h-6 rounded-full -ml-3 -mt-3 bg-red-500/40 blur-sm"
          style={{
            left: `${trailPosition.x}px`,
            top: `${trailPosition.y}px`,
            opacity: `${(index + 1) / (trail.length + 1)}`
          }}
        />
      ))}
      <div
        ref={cursorRef}
        className="fixed pointer-events-none w-6 h-6 rounded-full -ml-3 -mt-3 bg-red-500/40 blur-sm"
        style={{ left: `${position.x}px`, top: `${position.y}px` }}
      />
    </>
  );
};

export default LaserPointer;
