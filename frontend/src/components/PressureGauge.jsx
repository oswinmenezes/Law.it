import { motion } from 'framer-motion';
import useCourtStore from '../store/useCourtStore';

export default function PressureGauge() {
  const pressureLevel = useCourtStore((s) => s.pressureLevel);

  const getColor = (level) => {
    if (level <= 3) return { bar: '#22c55e', glow: '#22c55e30', label: 'Composed' };
    if (level <= 5) return { bar: '#eab308', glow: '#eab30830', label: 'Moderate' };
    if (level <= 7) return { bar: '#f97316', glow: '#f9731630', label: 'High Pressure' };
    return { bar: '#ef4444', glow: '#ef444430', label: 'Critical' };
  };

  const { bar, glow, label } = getColor(pressureLevel);
  const percentage = (pressureLevel / 10) * 100;

  return (
    <motion.div
      className="flex items-center gap-3"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
    >
      <div className="flex flex-col items-end gap-1">
        <span className="text-[10px] uppercase tracking-wider text-white/30">Pressure</span>
        <span className="text-xs font-medium" style={{ color: bar }}>{label}</span>
      </div>

      <div className="relative w-24 h-2 bg-court-panel rounded-full overflow-hidden border border-court-border">
        <motion.div
          className="h-full rounded-full"
          style={{
            background: `linear-gradient(90deg, ${bar}80, ${bar})`,
            boxShadow: `0 0 8px ${glow}`,
          }}
          animate={{ width: `${percentage}%` }}
          transition={{ type: 'spring', stiffness: 100, damping: 15 }}
        />
      </div>

      <span
        className="text-sm font-bold font-[family-name:var(--font-mono)] w-5 text-right"
        style={{ color: bar }}
      >
        {pressureLevel}
      </span>
    </motion.div>
  );
}
