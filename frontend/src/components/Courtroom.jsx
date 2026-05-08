import { useEffect, useRef, useCallback, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Mic, MicOff, PhoneOff, Scale, AlertCircle, Loader2, MessageSquare, Volume2 } from 'lucide-react';
import useCourtStore from '../store/useCourtStore';
import { supabase } from '../lib/supabase';
import { JUDGE_SYSTEM_PROMPT, EVALUATION_PROMPT } from '../lib/judgeLogic';
import JudgeBench from './JudgeBench';
import OpposingCounsel from './OpposingCounsel';
import LawyerPodium from './LawyerPodium';
import TranscriptPanel from './TranscriptPanel';
import SessionTimer from './SessionTimer';
import PressureGauge from './PressureGauge';

export default function Courtroom() {
  const {
    apiKey, roomData, currentUser, sessionActive, sessionPhase, activeSpeaker,
    isMicOn, currentIssue, hearingPhase, transcript,
    startSession, endSession, setActiveSpeaker, setSessionPhase,
    addTranscript, setMicOn, setAiSpeaking, setPage, setScores, resetSession, setOpponent
  } = useCourtStore();

  const [error, setError] = useState('');
  const [isInitializing, setIsInitializing] = useState(true);
  const recognitionRef = useRef(null);
  const synthRef = useRef(window.speechSynthesis);
  const lastProcessedIdRef = useRef(null);
  const isJudgeProcessingRef = useRef(false);

  // Initialize Speech Recognition
  useEffect(() => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (SpeechRecognition) {
      recognitionRef.current = new SpeechRecognition();
      recognitionRef.current.continuous = true;
      recognitionRef.current.interimResults = true;
      recognitionRef.current.lang = 'en-IN';

      recognitionRef.current.onresult = (event) => {
        const result = event.results[event.results.length - 1];
        if (result.isFinal) {
          const text = result[0].transcript.trim();
          if (text) {
            handleNewStatement(text);
          }
        }
      };

      recognitionRef.current.onerror = (event) => {
        console.error('Speech recognition error:', event.error);
        if (event.error === 'not-allowed') {
          setError('Microphone access denied.');
          setMicOn(false);
        }
      };
    } else {
      setError('Speech recognition not supported in this browser.');
    }
  }, []);

  // Handle Supabase Realtime for Transcripts
  useEffect(() => {
    if (!roomData) return;

    // Fetch opponent
    const fetchOpponent = async () => {
      const { data } = await supabase
        .from('court_players')
        .select('*')
        .eq('room_id', roomData.room_id)
        .neq('user_id', currentUser.id)
        .single();
      
      if (data) setOpponent(data);
    };

    fetchOpponent();

    const channel = supabase
      .channel(`room-${roomData.room_id}`)
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'court_case',
        filter: `room_id=eq.${roomData.room_id}`
      }, (payload) => {
        const newEntry = payload.new;
        addTranscript({
          speaker: newEntry.role,
          text: newEntry.statement,
          name: newEntry.name,
          type: newEntry.type
        });

        // Play voice if it's not from us
        if (newEntry.user_id !== currentUser.id) {
          speak(newEntry.statement, newEntry.role);
        }

        // Judge logic: Prosecutor (Creator) manages the judge
        if (currentUser.role === 'prosecutor' && newEntry.type !== 'judge') {
          triggerJudgeAI();
        }
      })
      .subscribe();

    setIsInitializing(false);
    startSession();

    return () => {
      supabase.removeChannel(channel);
      stopSpeaking();
    };
  }, [roomData, currentUser]);

  const handleNewStatement = async (text) => {
    if (!roomData || !currentUser) return;

    try {
      const { error } = await supabase
        .from('court_case')
        .insert([{
          room_id: roomData.room_id,
          user_id: currentUser.id,
          name: currentUser.name,
          role: currentUser.role,
          statement: text,
          type: 'lawyer'
        }]);
      
      if (error) throw error;
    } catch (err) {
      console.error('Failed to save statement:', err);
    }
  };

  const triggerJudgeAI = async () => {
    if (isJudgeProcessingRef.current) return;
    isJudgeProcessingRef.current = true;

    try {
      const store = useCourtStore.getState();
      const recentTranscript = store.transcript
        .slice(-10)
        .map(t => `${t.name} (${t.speaker}): ${t.text}`)
        .join('\n');

      const response = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${apiKey}`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            contents: [{ 
              parts: [{ 
                text: `${JUDGE_SYSTEM_PROMPT(roomData.title, roomData.description)}\n\nRECENT TRANSCRIPT:\n${recentTranscript}` 
              }] 
            }],
            generationConfig: { temperature: 0.7 }
          }),
        }
      );

      const data = await response.json();
      const judgeText = data.candidates?.[0]?.content?.parts?.[0]?.text?.trim();

      if (judgeText && judgeText !== 'NO_INTERVENTION') {
        // Insert Judge Statement
        await supabase
          .from('court_case')
          .insert([{
            room_id: roomData.room_id,
            user_id: '00000000-0000-0000-0000-000000000000', // System ID for Judge
            name: 'The Honorable Judge',
            role: 'judge',
            statement: judgeText,
            type: 'judge'
          }]);
      }
    } catch (err) {
      console.error('Judge AI Error:', err);
    } finally {
      isJudgeProcessingRef.current = false;
    }
  };

  const speak = (text, role) => {
    stopSpeaking();
    const utterance = new SpeechSynthesisUtterance(text);
    
    // Select voice based on role
    const voices = synthRef.current.getVoices();
    if (role === 'judge') {
      utterance.pitch = 0.8;
      utterance.rate = 0.9;
    } else {
      utterance.pitch = 1.0;
      utterance.rate = 1.0;
    }

    utterance.onstart = () => {
      setActiveSpeaker(role);
      setAiSpeaking(true);
    };
    utterance.onend = () => {
      setActiveSpeaker('none');
      setAiSpeaking(false);
    };

    synthRef.current.speak(utterance);
  };

  const stopSpeaking = () => {
    synthRef.current.cancel();
    setAiSpeaking(false);
  };

  const toggleMic = () => {
    if (isMicOn) {
      recognitionRef.current?.stop();
      setMicOn(false);
    } else {
      recognitionRef.current?.start();
      setMicOn(true);
    }
  };

  const handleEndSession = async () => {
    endSession();
    stopSpeaking();
    recognitionRef.current?.stop();
    setMicOn(false);

    // Final evaluation logic
    try {
      const store = useCourtStore.getState();
      const myTranscript = store.transcript
        .filter(t => t.speaker === currentUser.role)
        .map(t => t.text)
        .join('\n');

      const response = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${apiKey}`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            contents: [{ 
              parts: [{ 
                text: EVALUATION_PROMPT(myTranscript, currentUser.role) 
              }] 
            }],
            generationConfig: { 
              temperature: 0.3,
              responseMimeType: 'application/json'
            }
          }),
        }
      );

      const data = await response.json();
      const evaluationText = data.candidates?.[0]?.content?.parts?.[0]?.text;
      if (evaluationText) {
        setScores(JSON.parse(evaluationText));
      }
    } catch (err) {
      console.error('Evaluation Error:', err);
    }
  };

  if (isInitializing) {
    return (
      <div className="h-full w-full flex items-center justify-center bg-court-black">
        <div className="text-center">
          <Loader2 className="w-12 h-12 text-gold-400 mx-auto mb-4 animate-spin" />
          <h2 className="text-xl font-bold text-white mb-2 font-[family-name:var(--font-display)]">Entering the Courtroom</h2>
          <p className="text-sm text-white/40">Synchronizing with opposing counsel...</p>
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
      {/* Top Bar */}
      <div className="flex items-center justify-between px-8 py-4 border-b border-court-border/60 bg-court-dark/90 backdrop-blur-md">
        <div className="flex items-center gap-3">
          <Scale className="w-5 h-5 text-gold-400/60" />
          <div>
            <h1 className="text-sm font-semibold text-white/80 truncate max-w-[300px]">
              {roomData?.title}
            </h1>
            <p className="text-[10px] text-white/30 uppercase tracking-widest">{currentUser?.role}</p>
          </div>
        </div>

        <div className="flex items-center gap-6">
          <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20">
            <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
            <span className="text-[10px] font-bold text-emerald-500 uppercase tracking-widest">Live Sync</span>
          </div>
          <PressureGauge />
          <SessionTimer />
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex overflow-hidden">
        <div className="flex-1 flex flex-col p-8 gap-8 relative">
          {/* Judge */}
          <div className="flex justify-center">
            <div className="w-full max-w-xs">
              <JudgeBench />
            </div>
          </div>

          {/* Lawyers */}
          <div className="flex-1 flex items-center justify-center gap-12">
            <div className={`w-full max-w-xs transition-opacity ${activeSpeaker === (currentUser.role === 'prosecutor' ? 'defendant' : 'prosecutor') ? 'opacity-100' : 'opacity-40'}`}>
              <OpposingCounsel />
            </div>
            <div className={`w-full max-w-xs transition-opacity ${activeSpeaker === currentUser.role ? 'opacity-100' : 'opacity-40'}`}>
              <LawyerPodium />
            </div>
          </div>

          {/* Controls */}
          <div className="flex items-center justify-center gap-5 pb-4">
            <motion.button
              onClick={toggleMic}
              className={`w-16 h-16 rounded-full flex items-center justify-center transition-all cursor-pointer ${
                isMicOn
                  ? 'bg-emerald-500 shadow-lg shadow-emerald-500/30'
                  : 'bg-court-panel border border-court-border text-white/40'
              }`}
              whileTap={{ scale: 0.9 }}
            >
              {isMicOn ? <Mic size={24} className="text-white" /> : <MicOff size={24} />}
            </motion.button>

            <motion.button
              onClick={handleEndSession}
              className="w-16 h-16 rounded-full bg-red-500/20 border border-red-500/30 flex items-center justify-center hover:bg-red-500/30 transition-all cursor-pointer"
              whileTap={{ scale: 0.9 }}
            >
              <PhoneOff className="w-6 h-6 text-red-400" />
            </motion.button>
          </div>
        </div>

        {/* Transcript */}
        <div className="w-80 lg:w-[28rem] border-l border-court-border/60 bg-transcript-bg flex flex-col">
          <TranscriptPanel />
        </div>
      </div>

      {error && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 bg-red-500/20 border border-red-500/30 rounded-xl px-6 py-3 text-sm text-red-300 backdrop-blur-sm z-50">
          {error}
        </div>
      )}
    </motion.div>
  );
}
