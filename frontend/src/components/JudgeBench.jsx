import { motion } from 'framer-motion';
import { Gavel } from 'lucide-react';
import useCourtStore from '../store/useCourtStore';
import WaveformVisualizer from './WaveformVisualizer';

export default function JudgeBench() {
  const activeSpeaker = useCourtStore((s) => s.activeSpeaker);
  const aiAudioLevel = useCourtStore((s) => s.aiAudioLevel);
  const isAiSpeaking = useCourtStore((s) => s.isAiSpeaking);
  const isActive = activeSpeaker === 'judge' || (isAiSpeaking && activeSpeaker !== 'opposing' && activeSpeaker !== 'lawyer');

  return (
    <motion.div
      className={`glass-panel rounded-2xl p-5 flex flex-col items-center gap-4 transition-all duration-500 ${
        isActive ? 'border-red-400/40 shadow-lg shadow-red-400/10' : 'border-court-border'
      }`}
      animate={isActive ? { scale: [1, 1.01, 1] } : {}}
      transition={{ duration: 2, repeat: Infinity }}
    >
      {/* Judge Avatar */}
      <div className="relative">
        <div className={`w-20 h-20 rounded-full flex items-center justify-center transition-all duration-500 ${
          isActive
            ? 'bg-gradient-to-br from-red-500/30 to-red-700/20 animate-glow-judge'
            : 'bg-court-surface border border-court-border'
        }`}>
          <Gavel className={`w-9 h-9 transition-colors duration-300 ${isActive ? 'text-red-400' : 'text-white/20'}`} />
        </div>
        {isActive && (
          <motion.div
            className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-red-500 border-2 border-court-dark"
            animate={{ scale: [1, 1.3, 1] }}
            transition={{ duration: 1, repeat: Infinity }}
          />
        )}
      </div>

      {/* Label */}
      <div className="text-center">
        <h3 className={`text-sm font-bold uppercase tracking-wider transition-colors ${
          isActive ? 'text-red-400' : 'text-white/30'
        }`}>
          Hon'ble Judge
        </h3>
        <p className="text-[10px] text-white/20 mt-0.5">Presiding Officer</p>
      </div>

      {/* Waveform */}
      <div className="w-full h-8">
        <WaveformVisualizer
          audioLevel={isActive ? aiAudioLevel : 0}
          color="#dc2626"
          barCount={24}
          active={isActive}
        />
      </div>

      {/* Status */}
      <div className={`text-[10px] px-3 py-1 rounded-full transition-all ${
        isActive
          ? 'bg-red-400/10 text-red-400 border border-red-400/20'
          : 'bg-court-surface text-white/20 border border-court-border'
      }`}>
        {isActive ? '● Speaking' : '○ Listening'}
      </div>
    </motion.div>
  );
}
