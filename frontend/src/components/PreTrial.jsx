import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Users, Copy, Check, ShieldCheck, Gavel, 
  ArrowRight, Loader2, UserCheck, Scale, Info
} from 'lucide-react';
import useCourtStore from '../store/useCourtStore';
import { supabase } from '../lib/supabase';

export default function PreTrial() {
  const { 
    setPage, roomData, currentUser, isReady, setReady, multiplayerMode 
  } = useCourtStore();
  
  const [oppReady, setOppReady] = useState(false);
  const [opponent, setOpponent] = useState(null);
  const [copied, setCopied] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!roomData) return;

    // Listen for players joining and readiness
    const channel = supabase
      .channel(`room-${roomData.room_id}`)
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'court_players',
        filter: `room_id=eq.${roomData.room_id}`
      }, (payload) => {
        if (payload.new.user_id !== currentUser.id) {
          if (payload.eventType === 'INSERT') {
            setOpponent(payload.new);
          } else if (payload.eventType === 'UPDATE') {
            setOppReady(payload.new.is_ready);
          }
        }
      })
      .subscribe();

    // Initial check
    const checkStatus = async () => {
      const { data: players } = await supabase
        .from('court_players')
        .select('*')
        .eq('room_id', roomData.room_id)
        .neq('user_id', currentUser.id)
        .maybeSingle();
      
      if (players) {
        setOpponent(players);
        setOppReady(players.is_ready);
      }
    };

    checkStatus();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [roomData, currentUser]);

  // Auto-start
  useEffect(() => {
    if (isReady && oppReady) {
      setTimeout(() => setPage('courtroom'), 1500);
    }
  }, [isReady, oppReady, setPage]);

  const handleContinue = async () => {
    setLoading(true);
    try {
      const { error } = await supabase
        .from('court_players')
        .update({ is_ready: true })
        .eq('user_id', currentUser.id)
        .eq('room_id', roomData.room_id);

      if (error) throw error;
      setReady(true);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  if (!roomData) return null;

  return (
    <div className="h-full w-full flex flex-col bg-court-black overflow-hidden relative">
      {/* Background Decor */}
      <div className="absolute top-0 left-0 w-full h-full pointer-events-none overflow-hidden">
        <div className="absolute -top-1/4 -left-1/4 w-1/2 h-1/2 bg-gold-400/5 rounded-full blur-[150px]" />
        <div className="absolute -bottom-1/4 -right-1/4 w-1/2 h-1/2 bg-blue-500/5 rounded-full blur-[150px]" />
      </div>

      {/* Top Protocol Bar */}
      <div className="relative z-10 flex items-center justify-between px-8 py-5 border-b border-white/5 bg-court-dark/80 backdrop-blur-xl">
        <div className="flex items-center gap-4">
          <div className="w-10 h-10 rounded-xl bg-gold-400/10 flex items-center justify-center border border-gold-400/20 shadow-lg shadow-gold-400/5">
            <Scale size={20} className="text-gold-400" />
          </div>
          <div>
            <h1 className="text-sm font-black text-white uppercase tracking-widest leading-none">Pre-Trial Briefing</h1>
            <p className="text-[10px] text-white/20 mt-1 uppercase font-bold tracking-widest">Protocol ID: {roomData.room_id}</p>
          </div>
        </div>

        <div className="flex items-center gap-6">
          <div className="flex items-center gap-3 px-4 py-2 rounded-full bg-white/[0.03] border border-white/5">
            <code className="text-xs font-bold text-white/60 tracking-widest">{roomData.room_id}</code>
            <div className="w-px h-3 bg-white/10" />
            <button 
              onClick={() => copyToClipboard(roomData.room_id)}
              className="text-white/20 hover:text-gold-400 transition-colors"
            >
              {copied ? <Check size={14} /> : <Copy size={14} />}
            </button>
          </div>
          <div className="hidden md:flex items-center gap-2">
            <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
            <span className="text-[10px] font-bold text-emerald-500 uppercase tracking-widest">Secure Link Active</span>
          </div>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="relative z-10 flex-1 flex flex-col md:flex-row overflow-hidden">
        
        {/* Left: Case Brief (The Bench) */}
        <div className="flex-1 overflow-y-auto p-12 lg:p-20 border-r border-white/5">
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            className="max-w-2xl"
          >
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-500/10 border border-blue-500/20 mb-8">
              <Info size={12} className="text-blue-400" />
              <span className="text-[10px] font-bold text-blue-400 uppercase tracking-widest">Judicial Instruction</span>
            </div>

            <h2 className="text-5xl font-black text-white mb-8 font-[family-name:var(--font-display)] leading-tight">
              {roomData.title}
            </h2>

            <div className="relative">
              <div className="absolute -left-6 top-0 bottom-0 w-1 bg-gradient-to-b from-gold-400/40 to-transparent rounded-full" />
              <p className="text-xl text-white/60 leading-relaxed font-serif italic mb-12">
                "{roomData.description}"
              </p>
            </div>

            <div className="grid grid-cols-2 gap-8 pt-10 border-t border-white/5">
              <div>
                <span className="block text-[10px] font-black text-white/20 uppercase tracking-[0.2em] mb-3 text-left">Jurisdiction</span>
                <span className="text-sm font-bold text-white/80 uppercase">High Court of India</span>
              </div>
              <div>
                <span className="block text-[10px] font-black text-white/20 uppercase tracking-[0.2em] mb-3 text-left">Session Mode</span>
                <span className="text-sm font-bold text-white/80 uppercase">Bilateral Oral Arguments</span>
              </div>
            </div>
          </motion.div>
        </div>

        {/* Right: Players & Readiness (The Podium) */}
        <div className="w-full md:w-[450px] bg-white/[0.01] flex flex-col">
          <div className="flex-1 p-12 flex flex-col justify-center gap-12">
            
            {/* Player Cards */}
            <div className="space-y-6">
              {/* You */}
              <motion.div 
                className={`p-6 rounded-2xl border transition-all duration-500 ${
                  isReady ? 'bg-emerald-500/5 border-emerald-500/30' : 'bg-white/[0.03] border-white/10'
                }`}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
              >
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-xl bg-court-surface border border-white/10 flex items-center justify-center">
                      <span className="text-lg font-black text-white">{currentUser.name.charAt(0).toUpperCase()}</span>
                    </div>
                    <div>
                      <span className="block text-xs font-bold text-white uppercase">{currentUser.name}</span>
                      <span className="text-[10px] text-white/20 uppercase tracking-widest font-black">{currentUser.role}</span>
                    </div>
                  </div>
                  {isReady ? (
                    <div className="flex items-center gap-2 text-emerald-400">
                      <span className="text-[10px] font-black uppercase">Confirmed</span>
                      <UserCheck size={18} />
                    </div>
                  ) : (
                    <span className="text-[10px] font-black text-white/20 uppercase">Pending</span>
                  )}
                </div>
              </motion.div>

              {/* Opponent */}
              <motion.div 
                className={`p-6 rounded-2xl border transition-all duration-500 ${
                  oppReady ? 'bg-blue-500/5 border-blue-500/30' : 'bg-white/[0.03] border-white/10'
                }`}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
              >
                {opponent ? (
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 rounded-xl bg-court-surface border border-white/10 flex items-center justify-center">
                        <span className="text-lg font-black text-white">{opponent.name.charAt(0).toUpperCase()}</span>
                      </div>
                      <div>
                        <span className="block text-xs font-bold text-white uppercase">{opponent.name}</span>
                        <span className="text-[10px] text-white/20 uppercase tracking-widest font-black">
                          {currentUser.role === 'prosecutor' ? 'Defendant' : 'Prosecutor'}
                        </span>
                      </div>
                    </div>
                    {oppReady ? (
                      <div className="flex items-center gap-2 text-blue-400">
                        <span className="text-[10px] font-black uppercase">Confirmed</span>
                        <UserCheck size={18} />
                      </div>
                    ) : (
                      <span className="text-[10px] font-black text-white/20 uppercase">Briefing...</span>
                    )}
                  </div>
                ) : (
                  <div className="flex items-center gap-4 animate-pulse">
                    <div className="w-12 h-12 rounded-xl bg-white/5 border border-dashed border-white/10 flex items-center justify-center">
                      <Loader2 size={18} className="text-white/20 animate-spin" />
                    </div>
                    <div>
                      <span className="block text-xs font-bold text-white/20 uppercase">Waiting for Opponent</span>
                      <span className="text-[10px] text-white/10 uppercase tracking-widest font-black">Defense Counsel</span>
                    </div>
                  </div>
                )}
              </motion.div>
            </div>

            {/* Action Area */}
            <div className="mt-auto space-y-6">
              <button
                onClick={handleContinue}
                disabled={isReady || loading || !opponent}
                className={`w-full py-6 rounded-2xl font-black uppercase tracking-[0.2em] transition-all flex items-center justify-center gap-3 ${
                  isReady 
                    ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 cursor-default'
                    : 'btn-gold shadow-xl shadow-gold-400/10 group disabled:opacity-30 disabled:grayscale'
                }`}
              >
                {loading ? <Loader2 className="animate-spin" /> : (
                  <>
                    {isReady ? 'Waiting for Bench' : 'Confirm Readiness'}
                    {!isReady && <ArrowRight size={20} className="group-hover:translate-x-1.5 transition-transform" />}
                  </>
                )}
              </button>

              <div className="flex flex-col items-center gap-4">
                <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-white/[0.02] border border-white/5">
                  <Gavel size={14} className="text-white/20" />
                  <span className="text-[9px] font-black text-white/20 uppercase tracking-[0.2em]">
                    Judicial Proceeding • High Court Rule 42-A
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Start Animation Overlay */}
      <AnimatePresence>
        {isReady && oppReady && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="fixed inset-0 z-[100] bg-court-black flex flex-col items-center justify-center text-center p-6"
          >
            <motion.div
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ delay: 0.2 }}
            >
              <div className="w-24 h-24 rounded-full bg-gold-400/20 flex items-center justify-center mb-8 border border-gold-400/30 mx-auto">
                <Gavel size={40} className="text-gold-400" />
              </div>
              <h2 className="text-4xl font-black text-white mb-4 uppercase tracking-[0.1em] font-[family-name:var(--font-display)]">Court is in Session</h2>
              <p className="text-white/40 uppercase tracking-[0.3em] font-bold text-xs">All Rise for the Honorable Judge</p>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
