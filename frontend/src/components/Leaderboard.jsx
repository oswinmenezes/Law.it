import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Trophy, Star, Award, Shield, AlertTriangle, ArrowLeft, Crown } from 'lucide-react';
import { supabase1 } from '../lib/supabase';
import useCourtStore from '../store/useCourtStore';
import ParticleBackground from './ParticleBackground';

export default function Leaderboard() {
  const [leaders, setLeaders] = useState([]);
  const [loading, setLoading] = useState(true);
  const { setPage, resetSession } = useCourtStore();

  useEffect(() => {
    async function fetchLeaderboard() {
      try {
        const { data, error } = await supabase1
          .from('leaderboard_scores')
          .select(`
            total_score,
            knowledge_score,
            persuasiveness_score,
            legal_reasoning_score,
            objection_handling_score,
            players ( username )
          `)
          .order('total_score', { ascending: false })
          .limit(50);
        
        if (error) throw error;
        setLeaders(data || []);
      } catch (err) {
        if (err.code !== 'PGRST205') {
            console.error('Error fetching leaderboard:', err);
        }
      } finally {
        setLoading(false);
      }
    }
    fetchLeaderboard();
  }, []);

  if (loading) return (
    <div className="h-full w-full flex items-center justify-center bg-court-black relative overflow-hidden">
      <ParticleBackground />
      <div className="text-center relative z-10">
        <Trophy className="w-12 h-12 text-gold-400/30 mx-auto mb-4 animate-spin" />
        <p className="text-white/40">Loading Hall of Fame...</p>
      </div>
    </div>
  );

  // Reorder for podium: Rank 2 (left), Rank 1 (center), Rank 3 (right)
  const topThree = [];
  if (leaders[1]) topThree.push({ ...leaders[1], rank: 2 });
  if (leaders[0]) topThree.push({ ...leaders[0], rank: 1 });
  if (leaders[2]) topThree.push({ ...leaders[2], rank: 3 });

  // Ensure Rank 1 is always in the middle by rendering them in specific flex order
  // Actually, just sorting them: 2, 1, 3 for visual rendering
  const podiumOrder = [
    leaders[1] ? { ...leaders[1], rank: 2 } : null,
    leaders[0] ? { ...leaders[0], rank: 1 } : null,
    leaders[2] ? { ...leaders[2], rank: 3 } : null,
  ].filter(Boolean);

  const theRest = leaders.slice(3);

  const getPodiumStyles = (rank) => {
    if (rank === 1) return {
      container: 'h-64 sm:h-72 w-full max-w-[200px] z-20 -mt-10',
      card: 'bg-gradient-to-b from-yellow-400/20 to-yellow-600/5 border-yellow-400/50 shadow-[0_0_40px_rgba(234,179,8,0.2)]',
      badge: 'bg-gradient-to-br from-yellow-200 to-yellow-500 text-yellow-900 shadow-[0_0_15px_rgba(234,179,8,0.5)]',
      text: 'text-yellow-400 drop-shadow-[0_0_10px_rgba(250,204,21,0.5)]',
      icon: <Crown className="w-8 h-8 text-yellow-400 mb-2 drop-shadow-[0_0_8px_rgba(250,204,21,0.5)]" />
    };
    if (rank === 2) return {
      container: 'h-52 sm:h-60 w-full max-w-[180px] z-10',
      card: 'bg-gradient-to-b from-slate-300/20 to-slate-500/5 border-slate-300/50 shadow-[0_0_30px_rgba(148,163,184,0.15)]',
      badge: 'bg-gradient-to-br from-slate-200 to-slate-400 text-slate-800 shadow-[0_0_10px_rgba(148,163,184,0.4)]',
      text: 'text-slate-300 drop-shadow-[0_0_10px_rgba(203,213,225,0.4)]',
      icon: <Award className="w-6 h-6 text-slate-300 mb-2" />
    };
    return {
      container: 'h-44 sm:h-52 w-full max-w-[180px] z-10',
      card: 'bg-gradient-to-b from-amber-600/20 to-amber-800/5 border-amber-600/50 shadow-[0_0_30px_rgba(217,119,6,0.15)]',
      badge: 'bg-gradient-to-br from-amber-500 to-amber-700 text-amber-100 shadow-[0_0_10px_rgba(217,119,6,0.4)]',
      text: 'text-amber-500 drop-shadow-[0_0_10px_rgba(245,158,11,0.4)]',
      icon: <Award className="w-6 h-6 text-amber-500 mb-2" />
    };
  };

  return (
    <motion.div 
      className="h-full w-full overflow-y-auto bg-court-black relative"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
    >
      <ParticleBackground />
      
      {/* Decorative gradients */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[400px] bg-gold-400/10 blur-[120px] rounded-full pointer-events-none" />
      
      <div className="max-w-6xl mx-auto px-4 sm:px-10 py-8 sm:py-12 relative z-10">
        
        {/* Navigation */}
        <motion.button
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.1 }}
          onClick={() => { resetSession(); setPage('setup'); }}
          className="flex items-center gap-2 text-white/50 hover:text-gold-400 transition-colors mb-6 group w-fit"
        >
          <ArrowLeft className="w-5 h-5 group-hover:-translate-x-1 transition-transform" />
          <span className="font-medium tracking-wide">Back to Chambers</span>
        </motion.button>

        {/* Header */}
        <motion.div 
          className="text-center mb-16 sm:mb-24"
          initial={{ y: -20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.2 }}
        >
          <h1 className="text-5xl md:text-6xl font-bold font-[family-name:var(--font-display)] text-white mb-4 tracking-tight">
            Hall of <span className="gold-gradient-text">Fame</span>
          </h1>
          <p className="text-white/40 max-w-xl mx-auto text-sm md:text-base leading-relaxed">
            The most formidable counsels to ever step into the courtroom. Ranked by cumulative performance, legal reasoning, and grace under pressure.
          </p>
        </motion.div>

        {/* Podium for Top 3 */}
        {podiumOrder.length > 0 && (
          <div className="flex justify-center items-end gap-2 sm:gap-6 mb-16 sm:mb-24 px-2">
            {podiumOrder.map((leader, idx) => {
              const styles = getPodiumStyles(leader.rank);
              return (
                <motion.div
                  key={leader.rank}
                  className={`flex flex-col items-center ${styles.container}`}
                  initial={{ opacity: 0, y: 50 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.3 + (idx * 0.1), type: 'spring', stiffness: 100 }}
                >
                  <div className={`w-10 h-10 sm:w-12 sm:h-12 rounded-full flex items-center justify-center font-bold text-lg sm:text-xl mb-4 ${styles.badge} relative z-20`}>
                    {leader.rank}
                  </div>
                  <div className={`w-full flex-1 rounded-t-3xl border-t border-l border-r p-4 flex flex-col items-center justify-start relative overflow-hidden backdrop-blur-md ${styles.card}`}>
                    <div className="absolute inset-0 bg-gradient-to-t from-court-black via-transparent to-transparent opacity-80" />
                    
                    <div className="relative z-10 flex flex-col items-center w-full">
                      {styles.icon}
                      <div className="text-white font-bold text-center truncate w-full mb-2 text-sm sm:text-base">
                        {leader.players?.username || 'Unknown'}
                      </div>
                      <div className={`font-[family-name:var(--font-mono)] font-bold text-2xl sm:text-3xl ${styles.text}`}>
                        {leader.total_score}
                      </div>
                      
                      {/* Mini stats for podium */}
                      <div className="grid grid-cols-2 gap-x-3 gap-y-2 mt-4 w-full px-2 opacity-80">
                        <div className="flex flex-col items-center">
                          <Shield className="w-3 h-3 text-emerald-400 mb-0.5" />
                          <span className="text-[10px] font-mono text-emerald-100">{leader.knowledge_score}</span>
                        </div>
                        <div className="flex flex-col items-center">
                          <Award className="w-3 h-3 text-blue-400 mb-0.5" />
                          <span className="text-[10px] font-mono text-blue-100">{leader.legal_reasoning_score}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </div>
        )}

        {/* List for Rank 4+ */}
        {theRest.length > 0 && (
          <motion.div 
            className="glass-panel rounded-3xl p-4 sm:p-8 border-gold-400/10 shadow-2xl"
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.6 }}
          >
            <div className="hidden md:grid grid-cols-12 gap-4 pb-4 border-b border-court-border mb-4 text-xs font-bold text-white/40 uppercase tracking-widest pl-2">
              <div className="col-span-1 text-center">Rank</div>
              <div className="col-span-4">Counsel</div>
              <div className="col-span-6 grid grid-cols-4 gap-2 text-center">
                <div>Knowledge</div>
                <div>Reasoning</div>
                <div>Persuasion</div>
                <div>Objections</div>
              </div>
              <div className="col-span-1 text-right pr-4">Total</div>
            </div>

            <div className="space-y-3">
              {theRest.map((leader, idx) => (
                <motion.div 
                  key={idx}
                  className="flex flex-col md:grid md:grid-cols-12 gap-4 items-center p-4 rounded-2xl bg-white/[0.02] border border-white/[0.05] hover:border-gold-400/30 hover:bg-white/[0.04] transition-all group"
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.7 + (idx * 0.03) }}
                >
                  <div className="w-full md:w-auto md:col-span-5 flex items-center justify-between md:justify-start gap-4">
                    <div className="flex items-center gap-4">
                      <div className="w-8 h-8 rounded-full flex items-center justify-center font-bold text-xs bg-court-border text-white/50 group-hover:bg-court-border/80 transition-colors">
                        {idx + 4}
                      </div>
                      <div className="text-white/80 font-medium tracking-wide group-hover:text-white transition-colors">
                        {leader.players?.username || 'Unknown Counsel'}
                      </div>
                    </div>
                    <div className="md:hidden text-xl font-bold text-gold-400/80 font-[family-name:var(--font-mono)]">
                      {leader.total_score}
                    </div>
                  </div>

                  <div className="w-full md:col-span-6 grid grid-cols-4 gap-2 md:gap-4 mt-2 md:mt-0">
                    <div className="flex flex-col items-center justify-center bg-black/40 rounded-lg py-1.5 md:py-2 border border-white/5">
                      <Shield className="w-3.5 h-3.5 text-emerald-400/60 mb-1" />
                      <span className="text-xs font-mono text-emerald-100/80">{leader.knowledge_score}</span>
                    </div>
                    <div className="flex flex-col items-center justify-center bg-black/40 rounded-lg py-1.5 md:py-2 border border-white/5">
                      <Award className="w-3.5 h-3.5 text-blue-400/60 mb-1" />
                      <span className="text-xs font-mono text-blue-100/80">{leader.legal_reasoning_score}</span>
                    </div>
                    <div className="flex flex-col items-center justify-center bg-black/40 rounded-lg py-1.5 md:py-2 border border-white/5">
                      <Star className="w-3.5 h-3.5 text-purple-400/60 mb-1" />
                      <span className="text-xs font-mono text-purple-100/80">{leader.persuasiveness_score}</span>
                    </div>
                    <div className="flex flex-col items-center justify-center bg-black/40 rounded-lg py-1.5 md:py-2 border border-white/5">
                      <AlertTriangle className="w-3.5 h-3.5 text-orange-400/60 mb-1" />
                      <span className="text-xs font-mono text-orange-100/80">{leader.objection_handling_score}</span>
                    </div>
                  </div>

                  <div className="hidden md:flex md:col-span-1 justify-end items-center pr-2">
                    <div className="text-xl font-bold text-gold-400/80 group-hover:text-gold-400 font-[family-name:var(--font-mono)] transition-colors">
                      {leader.total_score}
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          </motion.div>
        )}

        {leaders.length === 0 && !loading && (
          <div className="text-center py-20 relative z-10">
            <Trophy className="w-20 h-20 text-white/5 mx-auto mb-6" />
            <p className="text-2xl text-white/30 font-medium font-[family-name:var(--font-display)]">The Hall is Empty</p>
            <p className="text-white/20 mt-3 max-w-sm mx-auto">Step into the courtroom and be the first to engrave your name into history.</p>
          </div>
        )}
      </div>
    </motion.div>
  );
}
