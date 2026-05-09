import { motion } from 'framer-motion';
import { Scale, Mic, Zap, Shield, ChevronRight, Trophy, User } from 'lucide-react';
import useCourtStore from '../store/useCourtStore';
import ParticleBackground from './ParticleBackground';
import ApiKeyModal from './ApiKeyModal';
import { useState } from 'react';
import { supabase1 } from '../lib/supabase';
import Cookies from 'js-cookie';

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
  const [legalName, setLegalName] = useState(Cookies.get('legal_name') || '');

  const handleStart = async () => {
    if (!legalName.trim()) {
      alert("Please enter your Legal Identity to proceed.");
      return;
    }
    if (!apiKey) {
      setShowApiModal(true);
      return;
    }
    
    setIsLoading(true);
    try {
      let newPlayerId = crypto.randomUUID();
      
      // Try to save to Supabase for Leaderboard purposes
      const { data, error } = await supabase1
        .from('players')
        .insert([{ username: legalName.trim() }])
        .select()
        .single();
        
      if (error) {
        if (error.code !== 'PGRST205') {
           console.warn("Failed to create player record:", error);
        }
        // If table doesn't exist, we just proceed with the local UUID
      } else if (data) {
        newPlayerId = data.id;
      }
      
      setPlayerName(legalName.trim());
      setPlayerId(newPlayerId);
      Cookies.set('legal_name', legalName.trim(), { expires: 7 });
      setPage('setup');
    } catch (err) {
      console.error("Error creating player:", err);
      alert("Failed to connect to the courtroom server.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleJoinCustom = async () => {
    if (!legalName.trim()) {
      alert("Please enter your Legal Identity to proceed.");
      return;
    }
    
    setIsLoading(true);
    try {
      let newPlayerId = crypto.randomUUID();
      
      // Try to save to Supabase for Leaderboard purposes
      const { data, error } = await supabase1
        .from('players')
        .insert([{ username: legalName.trim() }])
        .select()
        .single();
        
      if (error) {
        if (error.code !== 'PGRST205') {
           console.warn("Failed to create player record:", error);
        }
        // If table doesn't exist, we just proceed with the local UUID
      } else if (data) {
        newPlayerId = data.id;
      }
      
      setPlayerName(legalName.trim());
      setPlayerId(newPlayerId);
      Cookies.set('legal_name', legalName.trim(), { expires: 7 });
      setPage('custom');
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
        
        {/* Name Input */}
        <motion.div variants={itemVariants} className="w-full max-w-sm mb-8">
          <div className="relative group">
            <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
              <User size={18} className="text-white/20 group-focus-within:text-gold-400 transition-colors" />
            </div>
            <input
              type="text"
              placeholder="Enter Your Legal Identity"
              value={legalName}
              onChange={(e) => setLegalName(e.target.value)}
              className="w-full bg-white/[0.03] border border-white/10 rounded-2xl py-8 pl-16 pr-8 text-xl text-white placeholder:text-white/20 focus:outline-none focus:border-gold-400/50 focus:bg-white/[0.05] transition-all"
            />
          </div>
        </motion.div>

        {/* CTA */}
        <motion.div variants={itemVariants} className="flex flex-col md:flex-row gap-4 items-center justify-center mt-6 mb-8 w-full max-w-lg">
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
          <button
            id="btn-join-custom"
            className="px-8 py-4 rounded-2xl bg-white/5 border border-white/10 text-white font-bold hover:bg-white/10 transition-all flex items-center gap-2 group cursor-pointer"
            onClick={handleJoinCustom}
          >
            Join Custom Room
            <ChevronRight size={18} className="group-hover:translate-x-1 transition-transform" />
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
