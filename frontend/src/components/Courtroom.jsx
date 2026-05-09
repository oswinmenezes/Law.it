import { useEffect, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { PhoneOff, Scale, Loader2, Gavel, Volume2, Mic, MicOff } from 'lucide-react';
import useCourtStore from '../store/useCourtStore';
import geminiLive from '../lib/geminiLive';
import audioManager from '../lib/audioManager';
import { buildSystemPrompt, buildScoringPrompt } from '../lib/prompts';
import JudgeBench from './JudgeBench';
import OpposingCounsel from './OpposingCounsel';
import LawyerPodium from './LawyerPodium';
import TranscriptPanel from './TranscriptPanel';
import SessionTimer from './SessionTimer';
import PressureGauge from './PressureGauge';

export default function Courtroom() {
  const {
    apiKey, caseData, caseTitle, sessionActive, activeSpeaker,
    isMicOn, transcript, startSession, endSession, 
    setActiveSpeaker, addTranscript, updateLastTranscript,
    setMicOn, setAiSpeaking, setPage, setScores, resetSession
  } = useCourtStore();

  const [error, setError] = useState('');
  const [isInitializing, setIsInitializing] = useState(true);
  const [connectionStatus, setConnectionStatus] = useState('disconnected'); // disconnected | connecting | connected
  
  const lastProcessedOutputRef = useRef('');

  // ─── Initialization: Connect to Gemini Live ───────────────────────────────
  useEffect(() => {
    if (!apiKey) {
      setError('Gemini API Key is missing. Please set it in settings.');
      setIsInitializing(false);
      return;
    }

    const initLiveSession = async () => {
      try {
        setConnectionStatus('connecting');
        
        // Setup Gemini Live Handlers
        geminiLive.onSetupComplete = () => {
          console.log('[Courtroom] Live Session Ready');
          setConnectionStatus('connected');
          setIsInitializing(false);
          startSession();
        };

        geminiLive.onAudioData = (base64) => {
          audioManager.playAudioChunk(base64);
        };

        geminiLive.onInputTranscript = (text) => {
          // Live input from user
          // We only add to transcript when we detect a pause or transition? 
          // Actually, let's update a "live" entry or just log it
          console.log('[STT Input]:', text);
        };

        geminiLive.onOutputTranscript = (text) => {
          // AI is speaking
          const cleanText = text.trim();
          if (!cleanText) return;

          // Parse role from text if Gemini follows prompt ("Respondent's counsel:" / "The Court:")
          let role = 'judge';
          let displayName = 'The Honorable Judge';
          let finalMsg = cleanText;

          if (cleanText.toLowerCase().includes("respondent's counsel:")) {
            role = 'opposing';
            displayName = 'Opposing Counsel';
            finalMsg = cleanText.replace(/respondent's counsel:/i, '').trim();
          } else if (cleanText.toLowerCase().includes("the court:")) {
            role = 'judge';
            displayName = 'The Honorable Judge';
            finalMsg = cleanText.replace(/the court:/i, '').trim();
          }

          // Update active speaker for visuals
          setActiveSpeaker(role);
          setAiSpeaking(true);

          // Update transcript store
          const store = useCourtStore.getState();
          const lastEntry = store.transcript[store.transcript.length - 1];

          if (lastEntry && lastEntry.streaming && lastEntry.speaker === role) {
            updateLastTranscript(finalMsg);
          } else {
            addTranscript({
              speaker: role,
              text: finalMsg,
              name: displayName,
              type: role === 'judge' ? 'judge' : 'lawyer',
              streaming: true
            });
          }
        };

        geminiLive.onTurnComplete = () => {
          setAiSpeaking(false);
          setActiveSpeaker('none');
          updateLastTranscript(undefined, true); // Mark last streaming as done
        };

        geminiLive.onInterrupted = () => {
          console.log('[Courtroom] AI Interrupted by user');
          audioManager.stopPlayback();
          setAiSpeaking(false);
          setActiveSpeaker('none');
          updateLastTranscript(undefined, true);
        };

        geminiLive.onError = (err) => {
          setError(`Live Session Error: ${err.message || 'Unknown error'}`);
          setConnectionStatus('disconnected');
        };

        // Start Connection
        const systemPrompt = buildSystemPrompt(caseData);
        await geminiLive.connect(apiKey, systemPrompt);

        // Start Audio Capture immediately
        audioManager.onAudioChunk = (base64) => {
          if (geminiLive.connected) {
            geminiLive.sendAudioChunk(base64);
          }
        };

        audioManager.onAudioLevel = (level) => {
          // Could update a visualizer here
        };

        await audioManager.startCapture();
        setMicOn(true);

      } catch (err) {
        console.error('Failed to initialize courtroom:', err);
        setError(`Initialization Failed: ${err.message}`);
        setIsInitializing(false);
      }
    };

    initLiveSession();

    return () => {
      geminiLive.disconnect();
      audioManager.cleanup();
      resetSession();
    };
  }, [apiKey, caseData]);

  // ─── Manual Controls ──────────────────────────────────────────────────────
  const toggleMic = () => {
    if (isMicOn) {
      audioManager.stopCapture();
      setMicOn(false);
    } else {
      audioManager.startCapture().then(() => setMicOn(true));
    }
  };

  const handleEndSession = async () => {
    setIsInitializing(true); // Show loader during evaluation
    endSession();
    audioManager.cleanup();
    geminiLive.disconnect();

    try {
      const store = useCourtStore.getState();
      const scoringPrompt = buildScoringPrompt(caseData, store.transcript);
      
      const res = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            contents: [{ parts: [{ text: scoringPrompt }] }],
            generationConfig: { responseMimeType: 'application/json' }
          })
        }
      );

      const data = await res.json();
      const resultText = data.candidates?.[0]?.content?.parts?.[0]?.text;
      if (resultText) {
        setScores(JSON.parse(resultText));
        setPage('scorecard');
      }
    } catch (err) {
      console.error('Scoring failed:', err);
      setPage('scorecard'); // Navigate anyway
    }
  };

  if (isInitializing) {
    return (
      <div className="h-full w-full flex items-center justify-center bg-court-black">
        <div className="text-center">
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 4, repeat: Infinity, ease: "linear" }}
            className="mb-8 relative"
          >
            <div className="absolute inset-0 bg-gold-400/20 blur-2xl rounded-full" />
            <Gavel className="w-16 h-16 text-gold-400 relative z-10" />
          </motion.div>
          <h2 className="text-2xl font-black text-white mb-3 uppercase tracking-[0.2em] font-[family-name:var(--font-display)]">
            Opening the Bench
          </h2>
          <div className="flex items-center justify-center gap-3">
            <Loader2 className="w-4 h-4 text-gold-400/50 animate-spin" />
            <p className="text-xs text-white/40 uppercase tracking-widest font-bold">
              {connectionStatus === 'connecting' ? 'Establishing Live Link...' : 'Syncing Judicial Protocol...'}
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <motion.div
      className="h-full w-full flex flex-col bg-court-black overflow-hidden"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
    >
      {/* Top Protocol Bar */}
      <div className="flex items-center justify-between px-8 py-5 border-b border-white/5 bg-court-dark/80 backdrop-blur-xl z-20">
        <div className="flex items-center gap-4">
          <div className="w-10 h-10 rounded-xl bg-gold-400/10 flex items-center justify-center border border-gold-400/20 shadow-lg shadow-gold-400/5">
            <Scale size={20} className="text-gold-400" />
          </div>
          <div>
            <h1 className="text-sm font-black text-white uppercase tracking-widest leading-none truncate max-w-[400px]">
              {caseTitle || 'Solo Hearing'}
            </h1>
            <p className="text-[10px] text-gold-400/40 mt-1 uppercase font-bold tracking-widest flex items-center gap-2">
              <span className="w-1 h-1 rounded-full bg-gold-400" />
              Live Procedural Session
            </p>
          </div>
        </div>

        <div className="flex items-center gap-8">
          <div className="hidden lg:flex items-center gap-3 px-4 py-2 rounded-full bg-emerald-500/5 border border-emerald-500/10">
            <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
            <span className="text-[10px] font-black text-emerald-500 uppercase tracking-widest">Active Interrupt Mode</span>
          </div>
          <PressureGauge />
          <SessionTimer />
        </div>
      </div>

      {/* Main Courtroom Area */}
      <div className="flex-1 flex overflow-hidden relative">
        {/* Background Atmosphere */}
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-0 left-1/4 w-1/2 h-1/2 bg-gold-400/5 rounded-full blur-[120px]" />
          <div className="absolute bottom-0 right-1/4 w-1/2 h-1/2 bg-blue-500/5 rounded-full blur-[120px]" />
        </div>

        <div className="flex-1 flex flex-col p-8 gap-12 relative z-10">
          {/* Judge Bench */}
          <div className="flex justify-center mt-4">
            <div className="w-full max-w-sm">
              <JudgeBench />
            </div>
          </div>

          {/* Opponent & User */}
          <div className="flex-1 flex items-center justify-center gap-24">
            <div className={`w-full max-w-xs transition-all duration-700 ${activeSpeaker === 'opposing' ? 'scale-110 opacity-100' : 'scale-95 opacity-30 grayscale'}`}>
              <OpposingCounsel />
            </div>
            <div className={`w-full max-w-xs transition-all duration-700 ${activeSpeaker === 'lawyer' || activeSpeaker === 'none' ? 'scale-110 opacity-100' : 'scale-95 opacity-30 grayscale'}`}>
              <LawyerPodium />
            </div>
          </div>

          {/* Interactive Controls */}
          <div className="flex items-center justify-center gap-8 pb-8">
            <motion.button
              onClick={toggleMic}
              className={`group flex items-center gap-4 px-10 h-16 rounded-2xl font-black uppercase tracking-[0.2em] transition-all border ${
                isMicOn
                  ? 'bg-red-500/10 border-red-500/30 text-red-500 hover:bg-red-500/20'
                  : 'bg-emerald-500/10 border-emerald-500/30 text-emerald-500 hover:bg-emerald-500/20'
              }`}
              whileHover={{ y: -2 }}
              whileTap={{ scale: 0.98 }}
            >
              {isMicOn ? <MicOff size={24} /> : <Mic size={24} />}
              <span>{isMicOn ? 'Mute Counsel' : 'Unmute Counsel'}</span>
            </motion.button>

            <motion.button
              onClick={handleEndSession}
              className="w-16 h-16 rounded-2xl bg-white/[0.03] border border-white/10 flex items-center justify-center hover:bg-red-500/20 hover:border-red-500/30 hover:text-red-500 transition-all text-white/40 group"
              whileHover={{ y: -2 }}
              whileTap={{ scale: 0.9 }}
              title="End Hearing"
            >
              <PhoneOff className="w-6 h-6 transition-transform group-hover:scale-110" />
            </motion.button>
          </div>
        </div>

        {/* Transcript Panel */}
        <div className="w-[450px] border-l border-white/5 bg-court-dark/40 backdrop-blur-md">
          <TranscriptPanel />
        </div>
      </div>

      {/* Error Overlay */}
      <AnimatePresence>
        {error && (
          <motion.div 
            initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 50 }}
            className="fixed bottom-10 left-1/2 -translate-x-1/2 z-[100] px-8 py-4 bg-red-500/20 border border-red-500/30 rounded-2xl backdrop-blur-xl flex items-center gap-4"
          >
            <div className="w-8 h-8 rounded-full bg-red-500/20 flex items-center justify-center text-red-500">
              <Volume2 size={16} />
            </div>
            <p className="text-sm font-bold text-red-200">{error}</p>
            <button 
              onClick={() => setError('')}
              className="text-[10px] font-black text-white/20 hover:text-white uppercase tracking-widest ml-4"
            >
              Dismiss
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

