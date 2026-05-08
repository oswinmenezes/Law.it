import { motion } from 'framer-motion';
import { Scale, Mic, FileText, Zap, Shield, ChevronRight } from 'lucide-react';
import useCourtStore from '../store/useCourtStore';
import ParticleBackground from './ParticleBackground';
import ApiKeyModal from './ApiKeyModal';
import { useState } from 'react';

export default function Landing() {
  const { setPage, apiKey } = useCourtStore();
  const [showApiModal, setShowApiModal] = useState(false);

  const handleStart = () => {
    if (!apiKey) {
      setShowApiModal(true);
      return;
    }
    setPage('setup');
  };

  const features = [
    { icon: Scale, title: 'Indian Courtroom Realism', desc: 'High Court & Supreme Court proceedings with authentic procedural dynamics' },
    { icon: Mic, title: 'Live Voice Arguments', desc: 'Real-time voice interaction with AI judges via Gemini Live API' },
    { icon: Zap, title: 'Dynamic Interruptions', desc: 'Judges interrupt weak arguments — no turn-based dialogue' },
    { icon: Shield, title: 'Performance Scoring', desc: 'AI-powered evaluation of legal reasoning, clarity, and composure' },
  ];

  return (
    <motion.div
      className="h-full w-full relative overflow-hidden"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.5 }}
    >
      <ParticleBackground />

      {/* Gradient overlays */}
      <div className="absolute inset-0 bg-gradient-to-b from-court-black via-transparent to-court-black z-[1]" />
      <div className="absolute inset-0 bg-gradient-to-r from-court-black/80 via-transparent to-court-black/80 z-[1]" />

      <div className="relative z-10 h-full flex flex-col items-center justify-center px-6">
        {/* Logo & Title */}
        <motion.div
          className="text-center mb-12"
          initial={{ y: -30, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.2, duration: 0.8 }}
        >
          <div className="flex items-center justify-center gap-3 mb-4">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-gold-400 to-gold-600 flex items-center justify-center shadow-lg shadow-gold-400/20">
              <Scale className="w-7 h-7 text-court-black" />
            </div>
          </div>

          <h1 className="font-[family-name:var(--font-display)] text-5xl md:text-7xl font-bold mb-3 tracking-tight">
            <span className="gold-gradient-text">FaceOff</span>
            <span className="text-white/90"> Courtroom</span>
          </h1>

          <p className="text-lg md:text-xl text-white/50 max-w-2xl mx-auto leading-relaxed font-light">
            AI-powered litigation simulator for Indian courts.
            <br />
            <span className="text-gold-400/70">Practice oral arguments. Face judicial pressure. Build courtroom instinct.</span>
          </p>
        </motion.div>

        {/* CTA Button */}
        <motion.button
          id="btn-enter-courtroom"
          onClick={handleStart}
          className="group relative px-10 py-4 rounded-2xl text-lg font-semibold text-court-black bg-gradient-to-r from-gold-300 via-gold-400 to-gold-500 shadow-xl shadow-gold-400/25 hover:shadow-gold-400/40 transition-all duration-300 mb-16 cursor-pointer"
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.5, duration: 0.6 }}
          whileHover={{ scale: 1.03 }}
          whileTap={{ scale: 0.98 }}
        >
          <span className="flex items-center gap-2">
            Enter the Courtroom
            <ChevronRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
          </span>
          <div className="absolute inset-0 rounded-2xl bg-white/10 opacity-0 group-hover:opacity-100 transition-opacity" />
        </motion.button>

        {/* Features */}
        <motion.div
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 max-w-5xl w-full"
          initial={{ y: 30, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.7, duration: 0.8 }}
        >
          {features.map((f, i) => (
            <motion.div
              key={f.title}
              className="glass-panel rounded-xl p-5 hover:border-gold-400/30 transition-all duration-300 group"
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.8 + i * 0.1 }}
              whileHover={{ y: -2 }}
            >
              <f.icon className="w-6 h-6 text-gold-400 mb-3 group-hover:scale-110 transition-transform" />
              <h3 className="text-sm font-semibold text-white/90 mb-1">{f.title}</h3>
              <p className="text-xs text-white/40 leading-relaxed">{f.desc}</p>
            </motion.div>
          ))}
        </motion.div>

        {/* Tagline */}
        <motion.p
          className="mt-12 text-xs text-white/20 tracking-widest uppercase"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1.2 }}
        >
          LeetCode for Litigators
        </motion.p>
      </div>

      {showApiModal && (
        <ApiKeyModal
          onClose={() => setShowApiModal(false)}
          onSaved={() => {
            setShowApiModal(false);
            setPage('setup');
          }}
        />
      )}
    </motion.div>
  );
}
