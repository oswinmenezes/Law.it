import { motion } from 'framer-motion';
import { Scale, Mic, Zap, Shield, ChevronRight } from 'lucide-react';
import useCourtStore from '../store/useCourtStore';
import ParticleBackground from './ParticleBackground';
import ApiKeyModal from './ApiKeyModal';
import { useState } from 'react';

const features = [
  {
    icon: Scale,
    title: 'Indian Courtroom Realism',
    desc: 'High Court & Supreme Court proceedings with authentic procedural dynamics',
  },
  {
    icon: Mic,
    title: 'Live Voice Arguments',
    desc: 'Real-time voice interaction with AI judges via Gemini Live API',
  },
  {
    icon: Zap,
    title: 'Dynamic Interruptions',
    desc: 'Judges interrupt weak arguments — no turn-based dialogue',
  },
  {
    icon: Shield,
    title: 'Performance Scoring',
    desc: 'AI-powered evaluation of legal reasoning, clarity, and composure',
  },
];

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.12, delayChildren: 0.15 },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 24 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.6, ease: [0.22, 1, 0.36, 1] } },
};

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

  return (
    <motion.div
      className="landing-root"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.45 }}
    >
      <ParticleBackground />
      <div className="landing-gradient-v" />
      <div className="landing-gradient-h" />
      <div className="landing-radial" />

      <motion.div
        className="landing-content"
        variants={containerVariants}
        initial="hidden"
        animate="visible"
      >
        {/* Logo */}
        <motion.div variants={itemVariants} className="landing-logo-wrap">
          <div className="landing-logo-icon">
            <Scale size={32} color="#08080f" strokeWidth={2.2} />
          </div>
        </motion.div>

        {/* Title */}
        <motion.h1 variants={itemVariants} className="landing-title">
          <span className="gold-gradient-text">FaceOff</span>{' '}
          <span style={{ color: 'rgba(255,255,255,0.92)' }}>Courtroom</span>
        </motion.h1>

        {/* Subtitles */}
        <motion.p variants={itemVariants} className="landing-subtitle">
          AI-powered litigation simulator for Indian courts.
        </motion.p>
        <motion.p variants={itemVariants} className="landing-tagline-sub">
          Practice oral arguments. Face judicial pressure. Build courtroom instinct.
        </motion.p>

        {/* CTA */}
        <motion.div variants={itemVariants}>
          <button
            id="btn-enter-courtroom"
            className="btn-gold"
            onClick={handleStart}
          >
            Enter the Courtroom
            <ChevronRight size={18} strokeWidth={2.5} />
          </button>
        </motion.div>

        {/* Feature cards */}
        <motion.div variants={itemVariants} className="landing-features">
          {features.map((f, i) => (
            <motion.div
              key={f.title}
              className="feature-card"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.55 + i * 0.09, duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
            >
              <div className="feature-card-icon">
                <f.icon size={18} color="var(--gold-400)" strokeWidth={2} />
              </div>
              <div className="feature-card-title">{f.title}</div>
              <div className="feature-card-desc">{f.desc}</div>
            </motion.div>
          ))}
        </motion.div>

        {/* Footer tagline */}
        <motion.p
          variants={itemVariants}
          className="landing-footer-tag"
        >
          LeetCode for Litigators
        </motion.p>
      </motion.div>

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
