import { motion } from 'framer-motion';
import useCourtStore from '../store/useCourtStore';

export default function SessionTimer() {
  const timeRemaining = useCourtStore((s) => s.timeRemaining);
  const sessionActive = useCourtStore((s) => s.sessionActive);

  const mins = Math.floor(timeRemaining / 60);
  const secs = timeRemaining % 60;
  const isLow = timeRemaining <= 60;
  const isCritical = timeRemaining <= 30;

  const progress = timeRemaining / 300; // 5 min total

  return (
    <motion.div
      className="flex items-center gap-3"
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
    >
      {/* Circular progress */}
      <div className="relative w-10 h-10">
        <svg className="w-full h-full -rotate-90" viewBox="0 0 36 36">
          <circle
            cx="18" cy="18" r="15"
            fill="none"
            stroke="rgba(255,255,255,0.06)"
            strokeWidth="2.5"
          />
          <circle
            cx="18" cy="18" r="15"
            fill="none"
            stroke={isCritical ? '#ef4444' : isLow ? '#f59e0b' : '#c8a415'}
            strokeWidth="2.5"
            strokeDasharray={`${progress * 94.2} 94.2`}
            strokeLinecap="round"
            className="transition-all duration-1000"
          />
        </svg>
      </div>

      <div className={`font-[family-name:var(--font-mono)] text-lg font-semibold tabular-nums ${
        isCritical ? 'text-red-400' : isLow ? 'text-yellow-400' : 'text-white/80'
      } ${isCritical && sessionActive ? 'animate-pulse' : ''}`}>
        {String(mins).padStart(2, '0')}:{String(secs).padStart(2, '0')}
      </div>
    </motion.div>
  );
}
