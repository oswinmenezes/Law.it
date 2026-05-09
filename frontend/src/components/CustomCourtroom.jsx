import { useEffect, useRef, useState } from 'react';
import { motion } from 'framer-motion';
import { PhoneOff, Scale, Loader2 } from 'lucide-react';
import useCourtStore from '../store/useCourtStore';
import { supabase } from '../lib/supabase';
import { CUSTOM_JUDGE_SYSTEM_PROMPT } from '../lib/customJudgeLogic';
import { EVALUATION_PROMPT } from '../lib/judgeLogic';
import JudgeBench from './JudgeBench';
import OpposingCounsel from './OpposingCounsel';
import LawyerPodium from './LawyerPodium';
import TranscriptPanel from './TranscriptPanel';
import SessionTimer from './SessionTimer';
import PressureGauge from './PressureGauge';

export default function CustomCourtroom() {
  const {
    apiKey,
    roomData,
    currentUser,
    activeSpeaker,
    isMicOn,
    startSession,
    endSession,
    setActiveSpeaker,
    addTranscript,
    setMicOn,
    setAiSpeaking,
    setScores,
    setOpponent,
    setPage
  } = useCourtStore();

  const [error, setError] = useState('');
  const [isReady, setIsReady] = useState(false);
  // Track judge button cooldown for UI feedback
  const [judgeCooldown, setJudgeCooldown] = useState(false);

  const recognitionRef = useRef(null);
  const synthRef = useRef(window.speechSynthesis);

  const isJudgeProcessingRef = useRef(false);
  const lastJudgeCallRef = useRef(0);

  const isMicOnRef = useRef(false);
  const intentionalStopRef = useRef(false);

  // ─── Shared helper: stop speaking ─────────────────────────────────────────
  const stopSpeaking = () => {
    synthRef.current.cancel();
    setAiSpeaking(false);
  };

  // ─── TTS: speak text ──────────────────────────────────────────────────────
  const speak = (text, role) => {
    if (!text) return;
    stopSpeaking();

    const utterance = new SpeechSynthesisUtterance(text);
    const voices = synthRef.current.getVoices();

    if (role === 'judge') {
      const judgeVoice =
        voices.find(
          (v) =>
            v.name.includes('Male') || v.name.includes('Google UK English')
        ) || voices[0];
      if (judgeVoice) utterance.voice = judgeVoice;
      utterance.pitch = 0.7;
      utterance.rate = 0.85;
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

  // ─── Save lawyer statement to Supabase ────────────────────────────────────
  const handleNewStatement = async (text) => {
    if (!roomData || !currentUser) return;

    console.log(`[STT] Speech converted to text: "${text}" | Speaker: ${currentUser.role}`);

    // Add locally for immediate UX
    addTranscript({
      speaker: currentUser.role,
      text,
      name: currentUser.name,
      type: 'lawyer'
    });

    try {
      const { error: insertError } = await supabase.from('court_case').insert([
        {
          room_id: roomData.room_id,
          user_id: currentUser.id,
          name: currentUser.name,
          role: currentUser.role,
          statement: text,
          type: 'lawyer'
        }
      ]);
      if (insertError) throw insertError;
    } catch (err) {
      console.error('Failed to save statement:', err);
    }
  };

  // ─── Mic toggle ───────────────────────────────────────────────────────────
  const toggleMic = () => {
    if (isMicOn) {
      intentionalStopRef.current = true;
      isMicOnRef.current = false;
      recognitionRef.current?.stop();
      setMicOn(false);
    } else {
      intentionalStopRef.current = false;
      isMicOnRef.current = true;
      recognitionRef.current?.start();
      setMicOn(true);
    }
  };

  // ─── Preload voices ────────────────────────────────────────────────────────
  useEffect(() => {
    const loadVoices = () => synthRef.current.getVoices();
    loadVoices();
    if (synthRef.current.onvoiceschanged !== undefined) {
      synthRef.current.onvoiceschanged = loadVoices;
    }
  }, []);

  const handleNewStatementRef = useRef(null);
  useEffect(() => {
    handleNewStatementRef.current = handleNewStatement;
  }, [handleNewStatement]);

  // ─── Speech Recognition (init once) ───────────────────────────────────────
  useEffect(() => {
    const SpeechRecognition =
      window.SpeechRecognition || window.webkitSpeechRecognition;

    if (!SpeechRecognition) {
      setError('Speech recognition not supported in this browser.');
      return;
    }

    recognitionRef.current = new SpeechRecognition();
    recognitionRef.current.continuous = true;
    recognitionRef.current.interimResults = true;
    recognitionRef.current.lang = 'en-IN';

    recognitionRef.current.onstart = () => {
      console.log('Speech recognition started');
    };

    recognitionRef.current.onresult = (event) => {
      const result = event.results[event.results.length - 1];
      if (result.isFinal) {
        const text = result[0].transcript.trim();
        if (text && handleNewStatementRef.current) {
          handleNewStatementRef.current(text);
        }
      }
    };

    recognitionRef.current.onerror = (event) => {
      console.error('Speech recognition error:', event.error);
      
      if (event.error === 'not-allowed') {
        setError('Microphone access denied.');
        setMicOn(false);
        isMicOnRef.current = false;
      }

      // If no-speech occurs, Chrome might stop. We want it to restart if logically on.
      if (event.error === 'no-speech') {
        console.log('No speech detected, recognition will restart via onend...');
      }
    };

    recognitionRef.current.onend = () => {
      console.log('Speech recognition ended');
      // Auto-restart only if mic should be on and stop wasn't intentional
      if (isMicOnRef.current && !intentionalStopRef.current) {
        try {
          recognitionRef.current.start();
        } catch (e) {
          // already started or other error — ignore
        }
      }
    };
  }, []);

  // ─── Supabase realtime sync ────────────────────────────────────────────────
  useEffect(() => {
    if (!roomData) return;

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
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'court_case',
          filter: `room_id=eq.${roomData.room_id}`
        },
        (payload) => {
          const newEntry = payload.new;

          // Skip own lawyer statements (already added locally)
          if (newEntry.user_id === currentUser.id && newEntry.type === 'lawyer') {
            return;
          }

          // Prosecutor already adds judge entries locally during streaming — skip duplicates
          if (currentUser.role === 'prosecutor' && newEntry.type === 'judge') {
            const state = useCourtStore.getState();
            const exists = state.transcript.some(
              (t) => t.text === newEntry.statement && t.type === 'judge'
            );
            if (exists) return;
          }

          addTranscript({
            speaker: newEntry.role,
            text: newEntry.statement,
            name: newEntry.name,
            type: newEntry.type
          });

          // Speak messages from the other side
          if (newEntry.user_id !== currentUser.id) {
            speak(newEntry.statement, newEntry.role);
          }
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'court_rooms',
          filter: `room_id=eq.${roomData.room_id}`
        },
        (payload) => {
          if (payload.new.status === 'finished') {
            console.log('Session finished by host. Triggering evaluation...');
            if (handleEndSessionRef.current) {
              handleEndSessionRef.current(true); // pass true to skip status update
            }
          }
        }
      )
      .subscribe((status) => {
        if (status === 'CHANNEL_ERROR') {
          setError(
            'Sync Error: Realtime connection failed. Check if Realtime is enabled in Supabase.'
          );
        }
      });

    setIsReady(true);
    startSession();

    // Prosecutor inserts the opening judge statement (only once)
    if (currentUser.role === 'prosecutor') {
      setTimeout(async () => {
        const { data } = await supabase
          .from('court_case')
          .select('id')
          .eq('room_id', roomData.room_id)
          .eq('type', 'judge')
          .limit(1);

        if (!data || data.length === 0) {
          await supabase.from('court_case').insert([
            {
              room_id: roomData.room_id,
              user_id: '00000000-0000-0000-0000-000000000000',
              name: 'The Honorable Judge',
              role: 'judge',
              statement: `This court is now in session. The matter before us is ${roomData.title}. Learned Counsel, you may present your opening statements.`,
              type: 'judge'
            }
          ]);
        }
      }, 2000);
    }

    return () => {
      supabase.removeChannel(channel);
      stopSpeaking();
    };
  }, [roomData, currentUser]);



  // ─── Judge AI ─────────────────────────────────────────────────────────────
  const triggerJudgeAI = async () => {
    if (!apiKey) {
      console.warn('Judge AI skipped: No API key.');
      return;
    }

    if (currentUser?.role !== 'prosecutor') {
      console.log('Judge AI skipped: only prosecutor can trigger.');
      return;
    }

    // Prevent concurrent calls
    if (isJudgeProcessingRef.current) {
      console.log('Judge AI already processing.');
      return;
    }

    // 30s cooldown
    const now = Date.now();
    const elapsed = now - lastJudgeCallRef.current;
    if (elapsed < 30000) {
      const remaining = Math.ceil((30000 - elapsed) / 1000);
      console.log(`Judge AI cooldown: ${remaining}s remaining.`);
      return;
    }

    // Lock
    isJudgeProcessingRef.current = true;
    lastJudgeCallRef.current = now;
    setJudgeCooldown(true);
    setTimeout(() => setJudgeCooldown(false), 30000);

    try {
      const store = useCourtStore.getState();

      // Sending ENTIRE transcript history as requested
      const fullTranscript = store.transcript
        .map((t) => `${t.name} (${t.speaker}): ${t.text}`)
        .join('\n');

      console.log('Sending full courtroom state to Judge AI:', store.transcript);

      // Add a streaming placeholder
      store.addTranscript({
        speaker: 'judge',
        text: '',
        name: 'The Honorable Judge',
        type: 'judge',
        streaming: true
      });

      const res = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash-lite:streamGenerateContent?alt=sse&key=${apiKey}`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            system_instruction: {
              parts: [
                {
                  text: CUSTOM_JUDGE_SYSTEM_PROMPT(
                    roomData.title,
                    roomData.description
                  )
                }
              ]
            },
            contents: [
              {
                parts: [
                  {
                    text: `FULL COURTROOM TRANSCRIPT:\n${fullTranscript}\n\nIt is your turn. Please respond naturally as a judge within 2 sentences.`
                  }
                ]
              }
            ],
            generationConfig: { temperature: 0.7 }
          })
        }
      );

      if (!res.ok) {
        const msg = res.status === 429
          ? 'Rate limit hit. Please wait before calling the judge again.'
          : `API Error: ${res.status}`;
        throw new Error(msg);
      }

      const reader = res.body.getReader();
      const decoder = new TextDecoder('utf-8');
      let judgeText = '';
      let done = false;

      while (!done) {
        const { value, done: readerDone } = await reader.read();
        done = readerDone;

        if (value) {
          const chunk = decoder.decode(value, { stream: true });
          for (const line of chunk.split('\n')) {
            if (!line.startsWith('data: ')) continue;
            const dataStr = line.replace('data: ', '').trim();
            if (dataStr === '[DONE]') continue;
            try {
              const parsed = JSON.parse(dataStr);
              const textPart =
                parsed.candidates?.[0]?.content?.parts?.[0]?.text;
              if (textPart) {
                judgeText += textPart;
                useCourtStore.getState().updateLastTranscript(judgeText);
              }
            } catch (_) {}
          }
        }
      }

      // Finalise the streaming entry
      useCourtStore.getState().updateLastTranscript(judgeText, true);

      const isNoIntervention =
        !judgeText ||
        judgeText === 'NO_INTERVENTION' ||
        judgeText.includes('NO_INTERVENTION');

      if (judgeText && !isNoIntervention) {
        speak(judgeText, 'judge');

        // Sync to Supabase for the other player
        await supabase.from('court_case').insert([
          {
            room_id: roomData.room_id,
            user_id: '00000000-0000-0000-0000-000000000000',
            name: 'The Honorable Judge',
            role: 'judge',
            statement: judgeText,
            type: 'judge'
          }
        ]);
      }
    } catch (err) {
      console.error('Judge AI Error:', err);
      setError(err.message || 'Judge AI failed. Please try again.');
      setTimeout(() => setError(''), 5000);
    } finally {
      isJudgeProcessingRef.current = false;
    }
  };

  const handleEndSessionRef = useRef(null);

  // ─── End session — ONE evaluation call only ────────────────────────────────
  const handleEndSession = async (skipStatusUpdate = false) => {
    // Stop everything first
    endSession();
    stopSpeaking();
    intentionalStopRef.current = true;
    isMicOnRef.current = false;
    recognitionRef.current?.stop();
    setMicOn(false);

    // Mark room finished so the other player navigates away
    if (currentUser?.role === 'prosecutor' && !skipStatusUpdate) {
      await supabase
        .from('court_rooms')
        .update({ status: 'finished' })
        .eq('room_id', roomData.room_id);
    }

    // No API key — skip evaluation
    if (!apiKey) {
      setPage('scorecard');
      return;
    }

    try {
      const store = useCourtStore.getState();
      const myTranscript = store.transcript
        .filter((t) => t.speaker === currentUser.role)
        .map((t) => t.text)
        .join('\n');

      // Single evaluation call — no streaming, no duplicate
      const response = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash-lite:generateContent?key=${apiKey}`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            contents: [
              {
                parts: [{ text: EVALUATION_PROMPT(myTranscript, currentUser.role) }]
              }
            ],
            generationConfig: {
              temperature: 0.3,
              responseMimeType: 'application/json'
            }
          })
        }
      );

      if (!response.ok) {
        console.error(`Evaluation API error: ${response.status}`);
        setPage('scorecard');
        return;
      }

      const data = await response.json();
      const evaluationText = data.candidates?.[0]?.content?.parts?.[0]?.text;

      if (evaluationText) {
        try {
          setScores(JSON.parse(evaluationText));
        } catch (_) {
          // JSON parse failed — go to scorecard anyway
          setPage('scorecard');
        }
      } else {
        setPage('scorecard');
      }
    } catch (err) {
      console.error('Evaluation Error:', err);
      setPage('scorecard');
    }
  };

  useEffect(() => {
    handleEndSessionRef.current = handleEndSession;
  }, [handleEndSession]);





  // ─── Loading screen ───────────────────────────────────────────────────────
  if (!isReady) {
    return (
      <div className="h-full w-full flex items-center justify-center bg-court-black">
        <div className="text-center">
          <Loader2 className="w-12 h-12 text-gold-400 mx-auto mb-4 animate-spin" />
          <h2 className="text-xl font-bold text-white mb-2">Entering Courtroom</h2>
          <p className="text-sm text-white/40">Synchronizing...</p>
        </div>
      </div>
    );
  }

  // ─── Main render ──────────────────────────────────────────────────────────
  return (
    <motion.div
      className="h-full w-full flex flex-col bg-court-black overflow-hidden"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
    >
      {/* Header */}
      <div className="flex items-center justify-between px-8 py-4 border-b border-court-border/60 bg-court-dark/90 backdrop-blur-md">
        <div className="flex items-center gap-3">
          <Scale className="w-5 h-5 text-gold-400/60" />
          <div>
            <h1 className="text-sm font-semibold text-white/80">
              {roomData?.title}
            </h1>
            <p className="text-[10px] text-white/30 uppercase tracking-widest">
              {currentUser?.role}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-6">
          <PressureGauge />
          <SessionTimer />
        </div>
      </div>

      {/* Body */}
      <div className="flex-1 flex overflow-hidden">
        {/* Courtroom stage */}
        <div className="flex-1 flex flex-col p-8 gap-8 relative">
          {/* Judge bench */}
          <div className="flex justify-center">
            <div className="w-full max-w-xs">
              <JudgeBench />
            </div>
          </div>

          {/* Podiums */}
          <div className="flex-1 flex items-center justify-center gap-12">
            <div
              className={`w-full max-w-xs transition-opacity ${
                activeSpeaker ===
                (currentUser?.role === 'prosecutor' ? 'defendant' : 'prosecutor')
                  ? 'opacity-100'
                  : 'opacity-40'
              }`}
            >
              <OpposingCounsel />
            </div>

            <div
              className={`w-full max-w-xs transition-opacity ${
                activeSpeaker === currentUser?.role ? 'opacity-100' : 'opacity-40'
              }`}
            >
              <LawyerPodium />
            </div>
          </div>

          {/* Controls */}
          <div className="flex items-center justify-center gap-5 pb-4">
            {/* Call Judge — only visible to prosecutor */}
            {currentUser?.role === 'prosecutor' && (
              <motion.button
                onClick={triggerJudgeAI}
                disabled={isJudgeProcessingRef.current || judgeCooldown}
                className={`px-6 h-12 rounded-full font-bold uppercase tracking-wider flex items-center justify-center gap-2 border transition-all cursor-pointer
                  ${
                    isJudgeProcessingRef.current || judgeCooldown
                      ? 'bg-gold-400/5 border-gold-400/20 text-gold-400/30 cursor-not-allowed'
                      : 'bg-gold-400/20 border-gold-400/50 text-gold-400 hover:bg-gold-400/30'
                  }`}
                whileTap={{ scale: 0.95 }}
              >
                {isJudgeProcessingRef.current ? (
                  <Loader2 className="w-5 h-5 animate-spin" />
                ) : (
                  <Scale className="w-5 h-5" />
                )}
                Call Judge
              </motion.button>
            )}

            {/* Mic toggle */}
            <motion.button
              onClick={toggleMic}
              className={`px-8 h-12 rounded-full font-bold uppercase tracking-wider flex items-center justify-center transition-all cursor-pointer ${
                isMicOn
                  ? 'bg-red-500/20 border border-red-500/50 text-red-400'
                  : 'bg-emerald-500/20 border border-emerald-500/50 text-emerald-400'
              }`}
              whileTap={{ scale: 0.95 }}
            >
              {isMicOn ? 'Stop Talking' : 'Start Talking'}
            </motion.button>

            {/* End session */}
            <motion.button
              onClick={handleEndSession}
              className="w-16 h-16 rounded-full bg-red-500/20 border border-red-500/30 flex items-center justify-center cursor-pointer"
              whileTap={{ scale: 0.9 }}
            >
              <PhoneOff className="w-6 h-6 text-red-400" />
            </motion.button>
          </div>
        </div>

        {/* Transcript panel */}
        <div className="w-80 lg:w-[28rem] border-l border-court-border/60 bg-transcript-bg flex flex-col">
          <TranscriptPanel />
        </div>
      </div>

      {/* Error toast */}
      {error && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 bg-red-500/20 border border-red-500/30 rounded-xl px-6 py-3 text-sm text-red-300 backdrop-blur-sm z-50">
          {error}
        </div>
      )}
    </motion.div>
  );
}
