import { motion } from 'framer-motion';
import { Scale, Mic, Zap, Shield, ChevronRight, Trophy } from 'lucide-react';
import useCourtStore from '../store/useCourtStore';
import ParticleBackground from './ParticleBackground';
import ApiKeyModal from './ApiKeyModal';
import { useState } from 'react';
import { supabase } from '../lib/supabase';

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
  const { setPage, apiKey, playerName, setPlayerName, setPlayerId } = useCourtStore();
  const [showApiModal, setShowApiModal] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const handleStart = async () => {
    if (!playerName.trim()) {
      alert("Please enter your name, Counsel.");
      return;
    }
    if (!apiKey) {
      setShowApiModal(true);
      return;
    }
    
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from('players')
        .insert([{ username: playerName.trim() }])
        .select()
        .single();
        
      if (error) throw error;
      
      setPlayerId(data.id);
      setPage('setup');
    } catch (err) {
      console.error("Error creating player:", err);
      alert("Failed to connect to the courtroom server.");
    } finally {
      setIsLoading(false);
    }
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
        <motion.div variants={itemVariants} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1rem', marginTop: '1.5rem', marginBottom: '2rem' }}>
          <input 
            type="text" 
            placeholder="Enter your name, Counsel..." 
            value={playerName}
            onChange={(e) => setPlayerName(e.target.value)}
            style={{
              padding: '0.875rem 1.25rem',
              borderRadius: '0.75rem',
              border: '1px solid var(--gold-500)',
              background: 'rgba(20, 20, 25, 0.8)',
              color: 'var(--c-text-primary)',
              width: '100%',
              maxWidth: '300px',
              fontSize: '1rem',
              outline: 'none',
              boxShadow: '0 4px 12px rgba(0,0,0,0.2)'
            }}
          />
          <button
            id="btn-enter-courtroom"
            className="btn-gold"
            onClick={handleStart}
            disabled={isLoading}
            style={{ opacity: isLoading ? 0.7 : 1, width: '100%', maxWidth: '300px', justifyContent: 'center' }}
          >
            {isLoading ? 'Entering...' : 'Enter the Courtroom'}
            {!isLoading && <ChevronRight size={18} strokeWidth={2.5} />}
          </button>
          
          <button
            onClick={() => setPage('leaderboard')}
            style={{
              padding: '0.75rem',
              color: 'var(--gold-400)',
              background: 'transparent',
              border: 'none',
              fontSize: '0.875rem',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
              opacity: 0.8,
            }}
            onMouseOver={(e) => e.currentTarget.style.opacity = '1'}
            onMouseOut={(e) => e.currentTarget.style.opacity = '0.8'}
          >
            <Trophy size={16} /> View Hall of Fame
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
