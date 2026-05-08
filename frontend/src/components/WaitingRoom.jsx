import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Loader2, Users, Copy, Check, ChevronLeft, ShieldCheck } from 'lucide-react';
import useCourtStore from '../store/useCourtStore';
import { supabase } from '../lib/supabase';

export default function WaitingRoom() {
  const { setPage, roomData, currentUser } = useCourtStore();
  const [copied, setCopied] = useState(false);
  const [player2, setPlayer2] = useState(null);

  useEffect(() => {
    if (!roomData) return;

    // Listen for players joining
    const channel = supabase
      .channel('room-updates')
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'court_players',
        filter: `room_id=eq.${roomData.room_id}`
      }, (payload) => {
        if (payload.new.user_id !== currentUser.id) {
          setPlayer2(payload.new);
          // Transition after a brief delay
          setTimeout(() => {
            setPage('overview');
          }, 2000);
        }
      })
      .subscribe();

    // Check if player 2 is already there (in case of refresh)
    const checkExisting = async () => {
      const { data } = await supabase
        .from('court_players')
        .select('*')
        .eq('room_id', roomData.room_id)
        .neq('user_id', currentUser.id)
        .single();
      
      if (data) {
        setPlayer2(data);
        setTimeout(() => setPage('overview'), 2000);
      }
    };

    checkExisting();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [roomData, currentUser, setPage]);

  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  if (!roomData) return null;

  return (
    <div className="h-full w-full flex items-center justify-center bg-court-black relative overflow-hidden p-6">
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-gold-400/5 rounded-full blur-[160px] pointer-events-none" />

      <motion.div 
        className="relative z-10 w-full max-w-2xl"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <div className="glass-panel border border-white/5 p-12 text-center">
          <div className="mb-10 inline-flex items-center gap-3 px-4 py-2 rounded-full bg-gold-400/10 border border-gold-400/20">
            <div className="w-2 h-2 rounded-full bg-gold-400 animate-pulse" />
            <span className="text-[10px] font-bold text-gold-400 uppercase tracking-[0.2em]">Establishing Connection</span>
          </div>

          <h1 className="text-4xl font-black text-white mb-4 font-[family-name:var(--font-display)]">
            Waiting for Opposing Counsel
          </h1>
          <p className="text-white/40 mb-12 max-w-md mx-auto">
            Share the credentials below with the defense to begin the proceedings.
          </p>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-12">
            <div className="bg-white/[0.03] border border-white/5 rounded-2xl p-6 relative group">
              <span className="block text-[10px] font-bold text-white/20 uppercase tracking-widest mb-2 text-left">Room ID</span>
              <div className="flex items-center justify-between">
                <code className="text-xl font-bold text-white uppercase tracking-wider">{roomData.room_id}</code>
                <button 
                  onClick={() => copyToClipboard(roomData.room_id)}
                  className="p-2 hover:bg-white/5 rounded-lg transition-colors text-white/40 hover:text-white"
                >
                  {copied ? <Check size={16} /> : <Copy size={16} />}
                </button>
              </div>
            </div>

            <div className="bg-white/[0.03] border border-white/5 rounded-2xl p-6 relative">
              <span className="block text-[10px] font-bold text-white/20 uppercase tracking-widest mb-2 text-left">Access Key</span>
              <div className="flex items-center justify-between">
                <code className="text-xl font-bold text-white tracking-widest">{roomData.password}</code>
                <ShieldCheck size={18} className="text-gold-400/40" />
              </div>
            </div>
          </div>

          <div className="flex flex-col items-center gap-6">
            <div className="flex items-center gap-8">
              <div className="flex flex-col items-center gap-3">
                <div className="w-16 h-16 rounded-full bg-gold-400 flex items-center justify-center text-court-black shadow-lg shadow-gold-400/20">
                  <span className="text-lg font-black">{currentUser.name.charAt(0).toUpperCase()}</span>
                </div>
                <span className="text-xs font-bold text-white/60 uppercase tracking-widest">Prosecutor</span>
              </div>

              <div className="w-12 h-px bg-white/10 relative">
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-court-black px-2">
                  <Users size={14} className="text-white/20" />
                </div>
              </div>

              <div className="flex flex-col items-center gap-3">
                <div className={`w-16 h-16 rounded-full border-2 border-dashed flex items-center justify-center transition-all ${
                  player2 ? 'bg-white/10 border-white/20 text-white' : 'border-white/10 text-white/10'
                }`}>
                  {player2 ? (
                    <span className="text-lg font-black">{player2.name.charAt(0).toUpperCase()}</span>
                  ) : (
                    <Loader2 size={24} className="animate-spin" />
                  )}
                </div>
                <span className={`text-xs font-bold uppercase tracking-widest ${player2 ? 'text-white/60' : 'text-white/20'}`}>
                  {player2 ? 'Defendant' : 'Joining...'}
                </span>
              </div>
            </div>

            <AnimatePresence>
              {player2 && (
                <motion.p 
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="text-emerald-400 text-xs font-bold uppercase tracking-[0.2em]"
                >
                  Opponent Found. Preparing Briefing...
                </motion.p>
              )}
            </AnimatePresence>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
