"use client";

import React, { useEffect, useRef, useState, useCallback } from "react";

interface WheelProps {
  items: string[];
  onSpinEnd: (winner: string) => void;
  isSpinning: boolean;
}

const COLORS = [
  "#FF6B6B", "#4ECDC4", "#45B7D1", "#FFA07A", "#98D8C8",
  "#F7DC6F", "#BB8FCE", "#82E0AA", "#F1948A", "#85C1E9"
];

const getContrastColor = (hex: string) => {
  const r = parseInt(hex.substring(1, 3), 16);
  const g = parseInt(hex.substring(3, 5), 16);
  const b = parseInt(hex.substring(5, 7), 16);
  const yiq = (r * 299 + g * 587 + b * 114) / 1000;
  return yiq >= 128 ? "#171717" : "#FFFFFF"; // threshold of 128 (midpoint)
};

export default function Wheel({ items, onSpinEnd, isSpinning }: WheelProps) {
  const [rotation, setRotation] = useState(0);
  const wheelRef = useRef<SVGSVGElement>(null);
  const [transitionDuration, setTransitionDuration] = useState(0);
  const audioContext = useRef<AudioContext | null>(null);
  const lastTickIndex = useRef<number>(-1);

  // Initialize audio context
  useEffect(() => {
    const AudioContextClass = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    audioContext.current = new AudioContextClass();
    return () => {
      audioContext.current?.close();
    };
  }, []);

  const playClick = useCallback(() => {
    if (!audioContext.current) return;
    
    // Resume context if suspended (common browser policy)
    if (audioContext.current.state === 'suspended') {
      audioContext.current.resume();
    }

    const osc = audioContext.current.createOscillator();
    const gain = audioContext.current.createGain();

    osc.type = "sine";
    osc.frequency.setValueAtTime(1200, audioContext.current.currentTime);
    osc.frequency.exponentialRampToValueAtTime(40, audioContext.current.currentTime + 0.1);

    gain.gain.setValueAtTime(0.1, audioContext.current.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.01, audioContext.current.currentTime + 0.1);

    osc.connect(gain);
    gain.connect(audioContext.current.destination);

    osc.start();
    osc.stop(audioContext.current.currentTime + 0.1);
  }, []);

  const currentRotationRef = useRef(0);

  const playWinSound = useCallback(() => {
    if (!audioContext.current) return;
    
    if (audioContext.current.state === 'suspended') {
      audioContext.current.resume();
    }

    const now = audioContext.current.currentTime;
    
    // Play a simple major chord (C-E-G)
    [523.25, 659.25, 783.99].forEach((freq, i) => {
      const osc = audioContext.current!.createOscillator();
      const gain = audioContext.current!.createGain();
      
      osc.type = "sine";
      osc.frequency.setValueAtTime(freq, now + i * 0.1);
      
      gain.gain.setValueAtTime(0, now + i * 0.1);
      gain.gain.linearRampToValueAtTime(0.2, now + i * 0.1 + 0.05);
      gain.gain.exponentialRampToValueAtTime(0.01, now + i * 0.1 + 0.5);
      
      osc.connect(gain);
      gain.connect(audioContext.current!.destination);
      
      osc.start(now + i * 0.1);
      osc.stop(now + i * 0.1 + 0.5);
    });
  }, []);

  const [winningIndex, setWinningIndex] = useState<number | null>(null);

  useEffect(() => {
    if (isSpinning) {
      const extraDegrees = Math.floor(Math.random() * 360) + 1440; // At least 4 full rotations
      const newRotation = currentRotationRef.current + extraDegrees;
      currentRotationRef.current = newRotation;
      
      requestAnimationFrame(() => {
        setWinningIndex(null);
        setTransitionDuration(5);
        setRotation(newRotation);
      });

      // Track rotation via rAF to play sound
      let animationId: number;
      const segmentAngle = 360 / items.length;
      
      const trackPosition = () => {
        if (!wheelRef.current) return;
        
        const style = window.getComputedStyle(wheelRef.current);
        const matrix = new DOMMatrixReadOnly(style.transform);
        // Calculate angle from matrix
        const angle = Math.atan2(matrix.b, matrix.a) * (180 / Math.PI);
        const normalizedAngle = (angle < 0 ? angle + 360 : angle);
        
        // Offset to align pointer (Right side is 90 degrees offset from Top)
        // normalizedAngle is the current rotation from Top.
        // If pointer is at 90 deg (Right), we need (90 - normalizedAngle)
        const currentIndex = Math.floor(((450 - normalizedAngle) % 360) / segmentAngle);
        
        if (currentIndex !== lastTickIndex.current) {
          playClick();
          lastTickIndex.current = currentIndex;
        }
        
        animationId = requestAnimationFrame(trackPosition);
      };

      animationId = requestAnimationFrame(trackPosition);

      const timer = setTimeout(() => {
        cancelAnimationFrame(animationId);
        const actualRotation = newRotation % 360;
        // Adjust winner calculation for right-side pointer (90 deg offset)
        const winnerIdx = Math.floor(((450 - actualRotation) % 360) / segmentAngle) % items.length;
        setWinningIndex(winnerIdx);
        playWinSound();
        onSpinEnd(items[winnerIdx]);
      }, 5000);

      return () => {
        clearTimeout(timer);
        cancelAnimationFrame(animationId);
      };
    }
  }, [isSpinning, items, onSpinEnd, playClick, playWinSound]);

  if (items.length === 0) return null;

  const segmentAngle = 360 / items.length;

  return (
    <div className="relative w-80 h-80 sm:w-96 sm:h-96 group flex items-center justify-center">
      {/* Pointer (Right) */}
      <div className="absolute right-[-20px] top-1/2 -translate-y-1/2 z-10 w-10 h-8 bg-rose-500 shadow-lg" 
           style={{ clipPath: 'polygon(0% 50%, 100% 0%, 100% 100%)' }}>
      </div>
      
      {/* Center Cap */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-20 w-12 h-12 bg-white rounded-full shadow-inner border-4 border-zinc-100 flex items-center justify-center">
        <div className="w-2 h-2 bg-zinc-300 rounded-full"></div>
      </div>

      <svg
        ref={wheelRef}
        viewBox="0 0 100 100"
        className="w-full h-full drop-shadow-2xl transition-transform ease-out"
        style={{
          transform: `rotate(${rotation}deg)`,
          transitionDuration: `${transitionDuration}s`,
        }}
      >
        <circle cx="50" cy="50" r="48" fill="#f4f4f5" stroke="#e4e4e7" strokeWidth="1" />
        
        {items.map((item, index) => {
          const startAngle = index * segmentAngle;
          const endAngle = (index + 1) * segmentAngle;
          
          // SVG Arc calculation
          const x1 = 50 + 45 * Math.cos((Math.PI * (startAngle - 90)) / 180);
          const y1 = 50 + 45 * Math.sin((Math.PI * (startAngle - 90)) / 180);
          const x2 = 50 + 45 * Math.cos((Math.PI * (endAngle - 90)) / 180);
          const y2 = 50 + 45 * Math.sin((Math.PI * (endAngle - 90)) / 180);
          
          const largeArcFlag = segmentAngle > 180 ? 1 : 0;
          const pathData = `M 50 50 L ${x1} ${y1} A 45 45 0 ${largeArcFlag} 1 ${x2} ${y2} Z`;
          
          const isWinner = winningIndex === index;

          return (
            <g key={index} className={isWinner ? "animate-pulse" : ""}>
              <path
                d={pathData}
                fill={COLORS[index % COLORS.length]}
                stroke={isWinner ? "white" : "white"}
                strokeWidth={isWinner ? "1" : "0.5"}
                className={`transition-all ${isWinner ? "brightness-125" : "hover:brightness-110"}`}
              />
              <text
                x="50"
                y="50"
                dx="12"
                textAnchor="start"
                dominantBaseline="middle"
                transform={`rotate(${startAngle + segmentAngle / 2 - 90}, 50, 50)`}
                fill={getContrastColor(COLORS[index % COLORS.length])}
                fontSize={items.length > 20 ? "2" : items.length > 10 ? "3" : "4.5"}
                fontWeight="800"
                className={`pointer-events-none ${isWinner ? "scale-110" : ""}`}
              >
                {item.length > 15 ? item.slice(0, 12) + '...' : item}
              </text>
            </g>
          );
        })}
      </svg>
    </div>
  );
}
