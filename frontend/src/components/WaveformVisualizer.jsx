import { useEffect, useRef } from 'react';
import { motion } from 'framer-motion';

export default function WaveformVisualizer({ audioLevel = 0, color = '#c8a415', barCount = 32, active = false }) {
  const canvasRef = useRef(null);
  const barsRef = useRef(new Array(barCount).fill(0));

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    let animId;

    const draw = () => {
      const w = canvas.width;
      const h = canvas.height;
      ctx.clearRect(0, 0, w, h);

      const bars = barsRef.current;
      const barWidth = w / barCount;
      const gap = 2;

      for (let i = 0; i < barCount; i++) {
        // Smoothly animate bars toward target
        const target = active
          ? Math.random() * audioLevel * 0.8 + audioLevel * 0.2
          : 0.02;
        bars[i] += (target - bars[i]) * 0.15;

        const barHeight = Math.max(2, bars[i] * h * 0.9);
        const x = i * barWidth + gap / 2;
        const y = (h - barHeight) / 2;

        // Gradient bar
        const gradient = ctx.createLinearGradient(x, y, x, y + barHeight);
        gradient.addColorStop(0, color + '90');
        gradient.addColorStop(0.5, color);
        gradient.addColorStop(1, color + '90');

        ctx.fillStyle = gradient;
        ctx.beginPath();
        ctx.roundRect(x, y, barWidth - gap, barHeight, 1);
        ctx.fill();
      }

      animId = requestAnimationFrame(draw);
    };
    draw();

    return () => cancelAnimationFrame(animId);
  }, [audioLevel, color, barCount, active]);

  return (
    <motion.canvas
      ref={canvasRef}
      width={200}
      height={50}
      className="w-full h-full"
      initial={{ opacity: 0 }}
      animate={{ opacity: active ? 1 : 0.3 }}
      transition={{ duration: 0.3 }}
    />
  );
}
