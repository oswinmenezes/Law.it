import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Hash, Lock, ChevronLeft, ArrowRight, Loader2, Users } from 'lucide-react';
import useCourtStore from '../store/useCourtStore';
import { supabase } from '../lib/supabase';
import Cookies from 'js-cookie';

export default function CustomRoom() {
  const { setPage, setRoomData, setCurrentUser, setMultiplayerMode } = useCourtStore();
  const [mode, setMode] = useState('join'); // 'join' | 'create'
  const [roomId, setRoomId] = useState('');
  const [password, setPassword] = useState('');
  const [heading, setHeading] = useState('');
  const [description, setDescription] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const legalName = Cookies.get('legal_name') || 'Counsel';

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    if (!roomId || !password) return;
    if (mode === 'create' && (!heading || !description)) return;
    if (!legalName) {
      setError('Legal Identity not found. Please go back to the landing page.');
      return;
    }
    
    setIsLoading(true);

    try {
      if (mode === 'create') {
        // Create Room
        const { data: room, error: roomError } = await supabase
          .from('court_rooms')
          .insert([{
            room_id: roomId,
            password,
            title: heading,
            description,
            creator_id: crypto.randomUUID(),
            status: 'waiting'
          }])
          .select()
          .single();

        if (roomError) throw roomError;

        // Join as Prosecutor (Creator)
        const userId = crypto.randomUUID();
        const { error: playerError } = await supabase
          .from('court_players')
          .insert([{
            room_id: roomId,
            user_id: userId,
            name: legalName,
            role: 'prosecutor',
            is_ready: false
          }]);

        if (playerError) throw playerError;

        setRoomData(room);
        setCurrentUser({ id: userId, name: legalName, role: 'prosecutor' });
        setMultiplayerMode(true);
        setPage('pretrial'); 
      } else {
        // Join Room
        const { data: room, error: roomError } = await supabase
          .from('court_rooms')
          .select('*')
          .eq('room_id', roomId)
          .eq('password', password)
          .maybeSingle();

        if (roomError) throw roomError;
        
        if (!room) {
          throw new Error('Invalid Room ID or Password');
        }

        // Check if room is full
        const { data: players, error: playersError } = await supabase
          .from('court_players')
          .select('*')
          .eq('room_id', roomId);

        if (playersError) throw playersError;
        if (players.length >= 2) {
          throw new Error('Courtroom is already full');
        }

        // Join as Defendant
        const userId = crypto.randomUUID();
        const { error: playerError } = await supabase
          .from('court_players')
          .insert([{
            room_id: roomId,
            user_id: userId,
            name: legalName,
            role: 'defendant',
            is_ready: false
          }]);

        if (playerError) throw playerError;

        setRoomData(room);
        setCurrentUser({ id: userId, name: legalName, role: 'defendant' });
        setMultiplayerMode(true);
        setPage('pretrial'); 
      }
    } catch (err) {
      console.error(err);
      setError(err.message || 'An error occurred. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="h-full w-full flex items-center justify-center bg-court-black relative overflow-hidden">
      {/* Background glow */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-gold-400/5 rounded-full blur-[120px] pointer-events-none" />

      <motion.div 
        className="relative z-10 w-full max-w-xl px-6 py-12"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <button 
          onClick={() => setPage('landing')}
          className="flex items-center gap-2 text-white/40 hover:text-white/60 transition-colors mb-8 group cursor-pointer"
        >
          <ChevronLeft size={16} className="group-hover:-translate-x-1 transition-transform" />
          <span className="text-xs font-bold uppercase tracking-widest">Back to Chambers</span>
        </button>

        <div className="glass-panel custom-room-card border border-white/5 mx-auto relative overflow-hidden p-8 rounded-3xl bg-white/[0.02] backdrop-blur-xl">
          {/* Toggle Tabs */}
          <div className="flex p-1 bg-white/[0.03] border border-white/5 rounded-2xl mb-10">
            <button
              onClick={() => { setMode('join'); setError(''); }}
              className={`flex-1 py-3 text-xs font-bold uppercase tracking-widest rounded-xl transition-all cursor-pointer ${
                mode === 'join' ? 'bg-gold-400 text-court-black shadow-lg' : 'text-white/40 hover:text-white/60'
              }`}
            >
              Join Room
            </button>
            <button
              onClick={() => { setMode('create'); setError(''); }}
              className={`flex-1 py-3 text-xs font-bold uppercase tracking-widest rounded-xl transition-all cursor-pointer ${
                mode === 'create' ? 'bg-gold-400 text-court-black shadow-lg' : 'text-white/40 hover:text-white/60'
              }`}
            >
              Create Room
            </button>
          </div>

          <div className="flex flex-col items-center text-center mb-10">
            <div className="w-20 h-20 rounded-[1.5rem] bg-gold-400/10 flex items-center justify-center border border-gold-400/20 mb-8 shadow-lg shadow-gold-400/5">
              {mode === 'join' ? <Users className="w-10 h-10 text-gold-400" /> : <Hash className="w-10 h-10 text-gold-400" />}
            </div>
            <h1 className="text-3xl font-black text-white mb-3 tracking-tight">
              {mode === 'join' ? 'Join Private Hearing' : 'Establish Courtroom'}
            </h1>
            <p className="text-sm md:text-base text-white/40 leading-relaxed">
              {mode === 'join' 
                ? 'Enter the credentials provided to access the designated courtroom.'
                : 'Configure a unique room identity and case details for your session.'
              }
            </p>
          </div>

          {error && (
            <motion.div 
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="mb-8 p-4 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-xs font-bold text-center uppercase tracking-widest"
            >
              {error}
            </motion.div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-3">
                <label className="text-[10px] font-bold text-white/30 uppercase tracking-[0.2em] ml-1">
                  {mode === 'join' ? 'Room Identity' : 'Proposed Room ID'}
                </label>
                <div className="relative">
                  <Hash className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-white/20" />
                  <input
                    type="text"
                    placeholder={mode === 'join' ? "e.g. CR-8829" : "e.g. ALPHA-ROOM"}
                    value={roomId}
                    onChange={(e) => setRoomId(e.target.value)}
                    className="w-full bg-white/[0.03] border border-white/10 rounded-xl py-4 pl-12 pr-4 text-white placeholder:text-white/10 focus:border-gold-400/50 transition-colors uppercase outline-none"
                    required
                  />
                </div>
              </div>

              <div className="space-y-3">
                <label className="text-[10px] font-bold text-white/30 uppercase tracking-[0.2em] ml-1">
                  {mode === 'join' ? 'Access Credentials' : 'Set Access Key'}
                </label>
                <div className="relative">
                  <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-white/20" />
                  <input
                    type="password"
                    autoComplete="current-password"
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full bg-white/[0.03] border border-white/10 rounded-xl py-4 pl-12 pr-4 text-white placeholder:text-white/10 focus:border-gold-400/50 transition-colors outline-none"
                    required
                  />
                </div>
              </div>
            </div>

            {mode === 'create' && (
              <motion.div 
                className="space-y-6"
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
              >
                <div className="space-y-3">
                  <label className="text-[10px] font-bold text-white/30 uppercase tracking-[0.2em] ml-1">Matter Heading</label>
                  <input
                    type="text"
                    placeholder="e.g. State vs K. Nanavati"
                    value={heading}
                    onChange={(e) => setHeading(e.target.value)}
                    className="w-full bg-white/[0.03] border border-white/10 rounded-xl py-4 px-6 text-white placeholder:text-white/10 focus:border-gold-400/50 transition-colors outline-none"
                    required={mode === 'create'}
                  />
                </div>

                <div className="space-y-3">
                  <label className="text-[10px] font-bold text-white/30 uppercase tracking-[0.2em] ml-1">Case Description</label>
                  <textarea
                    placeholder="Provide a brief overview of the legal matter..."
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    className="w-full bg-white/[0.03] border border-white/10 rounded-xl py-4 px-6 text-white placeholder:text-white/10 focus:border-gold-400/50 transition-colors min-h-[120px] resize-none outline-none"
                    required={mode === 'create'}
                  />
                </div>
              </motion.div>
            )}

            <button
              type="submit"
              disabled={isLoading || !roomId || !password || (mode === 'create' && (!heading || !description))}
              className="w-full bg-gold-400 hover:bg-gold-500 disabled:opacity-50 text-court-black font-black uppercase tracking-widest py-5 rounded-2xl flex items-center justify-center gap-3 transition-all cursor-pointer shadow-xl shadow-gold-400/10"
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-6 h-6 animate-spin" />
                  <span>{mode === 'create' ? 'Establishing...' : 'Authenticating...'}</span>
                </>
              ) : (
                <>
                  <span>{mode === 'join' ? 'Join Session' : 'Create & Enter'}</span>
                  <ArrowRight className="w-6 h-6" />
                </>
              )}
            </button>
          </form>

          <div className="mt-12 pt-10 border-t border-white/5 text-center">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/[0.02] border border-white/5">
              <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]" />
              <p className="text-[10px] text-white/20 uppercase tracking-[0.15em] font-bold">
                End-to-End Encrypted Session
              </p>
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  );
}