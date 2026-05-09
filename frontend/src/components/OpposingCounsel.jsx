import { motion } from 'framer-motion';
import { Swords } from 'lucide-react';
import useCourtStore from '../store/useCourtStore';
import WaveformVisualizer from './WaveformVisualizer';

export default function OpposingCounsel() {
  const { activeSpeaker, aiAudioLevel, opponent, multiplayerMode } = useCourtStore();
  const isActive = multiplayerMode 
    ? activeSpeaker === opponent?.role 
    : activeSpeaker === 'opposing';

  return (
    <motion.div
      className={`glass-panel rounded-2xl p-6 flex flex-col items-center gap-4 transition-all duration-500 ${
        isActive ? 'border-blue-400/40 shadow-lg shadow-blue-400/10' : 'border-court-border'
      }`}
    >
      {/* Avatar */}
      <div className="relative">
        <div className={`w-[5.5rem] h-[5.5rem] rounded-full flex items-center justify-center transition-all duration-500 ${
          isActive
            ? 'bg-gradient-to-br from-blue-500/30 to-blue-700/20 animate-glow-oppose'
            : 'bg-court-surface border border-court-border'
        }`}>
          <Swords className={`w-10 h-10 transition-colors duration-300 ${isActive ? 'text-blue-400' : 'text-white/20'}`} />
        </div>
        {isActive && (
          <motion.div
            className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-blue-500 border-2 border-court-dark"
            animate={{ scale: [1, 1.3, 1] }}
            transition={{ duration: 1, repeat: Infinity }}
          />
        )}
      </div>

      {/* Label */}
      <div className="text-center">
        <h3 className={`text-sm font-bold uppercase tracking-wider transition-colors ${
          isActive ? 'text-blue-400' : 'text-white/30'
        }`}>
          {multiplayerMode ? (opponent?.name || 'Opp. Counsel') : 'Opp. Counsel'}
        </h3>
        <p className="text-[10px] text-white/20 mt-0.5 uppercase tracking-widest">
          {multiplayerMode ? (opponent?.role || 'Learned Counsel') : 'Learned Counsel for Respondent'}
        </p>
      </div>

      {/* Waveform */}
      <div className="w-full h-8">
        <WaveformVisualizer
          audioLevel={isActive ? aiAudioLevel : 0}
          color="#3b82f6"
          barCount={24}
          active={isActive}
        />
      </div>

      {/* Status */}
      <div className={`text-[10px] px-3 py-1 rounded-full transition-all ${
        isActive
          ? 'bg-blue-400/10 text-blue-400 border border-blue-400/20'
          : 'bg-court-surface text-white/20 border border-court-border'
      }`}>
        {isActive ? '● Speaking' : '○ Waiting'}
      </div>
    </motion.div>
  );
}
