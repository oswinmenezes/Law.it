import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Gavel, ArrowRight, Loader2, UserCheck, Shield } from 'lucide-react';
import useCourtStore from '../store/useCourtStore';
import { supabase } from '../lib/supabase';

export default function CaseOverview() {
  const { setPage, roomData, currentUser, isReady, setReady } = useCourtStore();
  const [oppReady, setOppReady] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!roomData) return;

    // Listen for readiness updates
    const channel = supabase
      .channel('readiness-updates')
      .on('postgres_changes', {
        event: 'UPDATE',
        schema: 'public',
        table: 'court_players',
        filter: `room_id=eq.${roomData.room_id}`
      }, (payload) => {
        if (payload.new.user_id !== currentUser.id) {
          setOppReady(payload.new.is_ready);
        }
      })
      .subscribe();

    // Check initial state
    const checkInitial = async () => {
      const { data } = await supabase
        .from('court_players')
        .select('is_ready')
        .eq('room_id', roomData.room_id)
        .neq('user_id', currentUser.id)
        .single();
      
      if (data) setOppReady(data.is_ready);
    };

    checkInitial();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [roomData, currentUser]);

  // Handle auto-start when both ready
  useEffect(() => {
    if (isReady && oppReady) {
      setTimeout(() => {
        setPage('courtroom');
      }, 1500);
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

  if (!roomData) return null;

  return (
    <div className="h-full w-full flex items-center justify-center bg-court-black relative overflow-hidden p-6">
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[1000px] h-[1000px] bg-gold-400/5 rounded-full blur-[180px] pointer-events-none" />

      <motion.div 
        className="relative z-10 w-full max-w-4xl"
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
      >
        <div className="glass-panel border border-white/5 overflow-hidden flex flex-col md:flex-row !p-0">
          {/* Left: Case Info */}
          <div className="flex-1 p-12 md:p-16 border-r border-white/5">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-gold-400/10 border border-gold-400/20 mb-8">
              <Shield size={12} className="text-gold-400" />
              <span className="text-[10px] font-bold text-gold-400 uppercase tracking-widest">Case Briefing</span>
            </div>

            <h1 className="text-4xl font-black text-white mb-6 font-[family-name:var(--font-display)] leading-tight">
              {roomData.title}
            </h1>

            <div className="space-y-6">
              <div className="bg-white/[0.03] border border-white/5 rounded-2xl p-8">
                <p className="text-white/60 leading-relaxed text-lg italic font-serif">
                  "{roomData.description}"
                </p>
              </div>

              <div className="flex items-center gap-6 pt-4">
                <div className="flex -space-x-3">
                  {[1, 2].map((i) => (
                    <div key={i} className="w-10 h-10 rounded-full border-2 border-court-black bg-white/10 flex items-center justify-center">
                      <Users size={16} className="text-white/40" />
                    </div>
                  ))}
                </div>
                <p className="text-xs text-white/20 uppercase tracking-widest font-bold">
                  Benches Assigned • High Court Protocol
                </p>
              </div>
            </div>
          </div>

          {/* Right: Readiness */}
          <div className="w-full md:w-[350px] bg-white/[0.01] p-12 flex flex-col justify-center items-center text-center">
            <div className="w-20 h-20 rounded-3xl bg-gold-400/10 border border-gold-400/20 flex items-center justify-center mb-10">
              <Gavel className="w-10 h-10 text-gold-400" />
            </div>

            <div className="space-y-8 w-full mb-12">
              <div className="flex items-center justify-between p-4 rounded-xl bg-white/[0.03] border border-white/5">
                <div className="text-left">
                  <span className="block text-[9px] font-black text-white/20 uppercase tracking-[0.2em] mb-1">You</span>
                  <span className="text-sm font-bold text-white uppercase">{currentUser.role}</span>
                </div>
                {isReady ? <UserCheck className="text-emerald-500" /> : <div className="w-5 h-5 rounded-full border-2 border-white/10" />}
              </div>

              <div className="flex items-center justify-between p-4 rounded-xl bg-white/[0.03] border border-white/5">
                <div className="text-left">
                  <span className="block text-[9px] font-black text-white/20 uppercase tracking-[0.2em] mb-1">Opponent</span>
                  <span className="text-sm font-bold text-white uppercase">{currentUser.role === 'prosecutor' ? 'Defendant' : 'Prosecutor'}</span>
                </div>
                {oppReady ? <UserCheck className="text-emerald-500" /> : <div className="w-5 h-5 rounded-full border-2 border-white/10" />}
              </div>
            </div>

            <button
              onClick={handleContinue}
              disabled={isReady || loading}
              className="w-full btn-gold py-5 group disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? (
                <Loader2 className="animate-spin mx-auto" />
              ) : isReady ? (
                <span className="flex items-center justify-center gap-2">
                  Ready <UserCheck size={18} />
                </span>
              ) : (
                <span className="flex items-center justify-center gap-2">
                  Continue to Hearing <ArrowRight size={18} className="group-hover:translate-x-1 transition-transform" />
                </span>
              )}
            </button>

            {isReady && !oppReady && (
              <p className="mt-6 text-[10px] text-white/20 uppercase tracking-[0.2em] font-black animate-pulse">
                Waiting for Opponent...
              </p>
            )}

            {isReady && oppReady && (
              <p className="mt-6 text-emerald-400 text-[10px] text-center uppercase tracking-[0.2em] font-black">
                Both Ready. Entering Courtroom...
              </p>
            )}
          </div>
        </div>
      </motion.div>
    </div>
  );
}
