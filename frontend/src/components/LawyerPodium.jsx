import { motion } from 'framer-motion';
import { Mic, MicOff, User } from 'lucide-react';
import useCourtStore from '../store/useCourtStore';
import WaveformVisualizer from './WaveformVisualizer';

export default function LawyerPodium() {
  const { activeSpeaker, isMicOn, userAudioLevel, currentUser } = useCourtStore();
  const isActive = activeSpeaker === currentUser?.role;

  return (
    <motion.div
      className={`glass-panel rounded-2xl p-6 flex flex-col items-center gap-4 transition-all duration-500 ${
        isActive ? 'border-emerald-400/40 shadow-lg shadow-emerald-400/10' : 'border-court-border'
      }`}
    >
      {/* Avatar */}
      <div className="relative">
        <div className={`w-[5.5rem] h-[5.5rem] rounded-full flex items-center justify-center transition-all duration-500 ${
          isActive
            ? 'bg-gradient-to-br from-emerald-500/30 to-emerald-700/20 animate-glow-lawyer'
            : 'bg-court-surface border border-court-border'
        }`}>
          <User className={`w-10 h-10 transition-colors duration-300 ${isActive ? 'text-emerald-400' : 'text-white/20'}`} />
        </div>
        {/* Mic indicator */}
        <div className={`absolute -bottom-1 -right-1 w-7 h-7 rounded-full flex items-center justify-center border-2 border-court-dark ${
          isMicOn ? 'bg-emerald-500' : 'bg-court-surface'
        }`}>
          {isMicOn
            ? <Mic className="w-3.5 h-3.5 text-white" />
            : <MicOff className="w-3.5 h-3.5 text-white/30" />
          }
        </div>
      </div>

      {/* Label */}
        <h3 className={`text-sm font-bold uppercase tracking-wider transition-colors ${
          isActive ? 'text-emerald-400' : 'text-white/30'
        }`}>
          {currentUser?.name || 'You'}
        </h3>
        <p className="text-[10px] text-white/20 mt-0.5 uppercase tracking-widest">{currentUser?.role}</p>

      {/* Waveform */}
      <div className="w-full h-8">
        <WaveformVisualizer
          audioLevel={isMicOn ? userAudioLevel : 0}
          color="#22c55e"
          barCount={24}
          active={isMicOn && userAudioLevel > 0.05}
        />
      </div>

      {/* Status */}
      <div className={`text-[10px] px-3 py-1 rounded-full transition-all ${
        isMicOn
          ? 'bg-emerald-400/10 text-emerald-400 border border-emerald-400/20'
          : 'bg-court-surface text-white/20 border border-court-border'
      }`}>
        {isMicOn ? '● Mic Live' : '○ Mic Off'}
      </div>
    </motion.div>
  );
}
