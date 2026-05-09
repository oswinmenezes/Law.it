import { useEffect, useRef, useState } from 'react';
import { motion } from 'framer-motion';
import { PhoneOff, Scale, Loader2 } from 'lucide-react';
import useCourtStore from '../store/useCourtStore';
import { supabase } from '../lib/supabase';
import { buildSystemPrompt, buildScoringPrompt } from '../lib/prompts'; // Use existing prompt logic
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
  const [judgeCooldown, setJudgeCooldown] = useState(false);

  const recognitionRef = useRef(null);
  const synthRef = useRef(window.speechSynthesis);

  const isJudgeProcessingRef = useRef(false);
  const lastJudgeCallRef = useRef(0);

  const isMicOnRef = useRef(false);
  const intentionalStopRef = useRef(false);

  const stopSpeaking = () => {
    synthRef.current.cancel();
    setAiSpeaking(false);
  };

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

  const handleNewStatement = async (text) => {
    if (!roomData || !currentUser) return;

    addTranscript({
      speaker: currentUser.role,
      text,
      name: currentUser.name,
      type: 'lawyer'
    });

    try {
      await supabase.from('court_case').insert([
        {
          room_id: roomData.room_id,
          user_id: currentUser.id,
          name: currentUser.name,
          role: currentUser.role,
          statement: text,
          type: 'lawyer'
        }
      ]);
    } catch (err) {
      console.error('Failed to save statement:', err);
    }
  };

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

    recognitionRef.current.onresult = (event) => {
      const result = event.results[event.results.length - 1];
      if (result.isFinal) {
        const text = result[0].transcript.trim();
        if (text && handleNewStatementRef.current) {
          handleNewStatementRef.current(text);
        }
      }
    };

    recognitionRef.current.onend = () => {
      if (isMicOnRef.current && !intentionalStopRef.current) {
        try {
          recognitionRef.current.start();
        } catch (e) {}
      }
    };
  }, []);

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
          if (newEntry.user_id === currentUser.id && newEntry.type === 'lawyer') return;
          
          addTranscript({
            speaker: newEntry.role,
            text: newEntry.statement,
            name: newEntry.name,
            type: newEntry.type
          });

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
            handleEndSession(true);
          }
        }
      )
      .subscribe();

    setIsReady(true);
    startSession();

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

  const triggerJudgeAI = async () => {
    if (!apiKey || currentUser?.role !== 'prosecutor' || isJudgeProcessingRef.current) return;

    const now = Date.now();
    if (now - lastJudgeCallRef.current < 30000) return;

    isJudgeProcessingRef.current = true;
    lastJudgeCallRef.current = now;
    setJudgeCooldown(true);
    setTimeout(() => setJudgeCooldown(false), 30000);

    try {
      const store = useCourtStore.getState();
      const fullTranscript = store.transcript
        .map((t) => `${t.name} (${t.speaker}): ${t.text}`)
        .join('\n');

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
              parts: [{ text: `You are the judge in ${roomData.title}. Respond to the lawyers. Keep it under 2 sentences.` }]
            },
            contents: [{ parts: [{ text: `TRANSCRIPT:\n${fullTranscript}\n\nRespond as the judge.` }] }],
            generationConfig: { temperature: 0.7 }
          })
        }
      );

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
              const textPart = parsed.candidates?.[0]?.content?.parts?.[0]?.text;
              if (textPart) {
                judgeText += textPart;
                useCourtStore.getState().updateLastTranscript(judgeText);
              }
            } catch (_) {}
          }
        }
      }

      useCourtStore.getState().updateLastTranscript(judgeText, true);
      if (judgeText) {
        speak(judgeText, 'judge');
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
    } finally {
      isJudgeProcessingRef.current = false;
    }
  };

  const handleEndSession = async (skipStatusUpdate = false) => {
    endSession();
    stopSpeaking();
    intentionalStopRef.current = true;
    isMicOnRef.current = false;
    recognitionRef.current?.stop();
    setMicOn(false);

    if (currentUser?.role === 'prosecutor' && !skipStatusUpdate) {
      await supabase.from('court_rooms').update({ status: 'finished' }).eq('room_id', roomData.room_id);
    }

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

      const response = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash-lite:generateContent?key=${apiKey}`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            contents: [{ parts: [{ text: buildScoringPrompt(roomData, store.transcript) }] }],
            generationConfig: { temperature: 0.3, responseMimeType: 'application/json' }
          })
        }
      );

      const data = await response.json();
      const evaluationText = data.candidates?.[0]?.content?.parts?.[0]?.text;
      if (evaluationText) setScores(JSON.parse(evaluationText));
      else setPage('scorecard');
    } catch (err) {
      setPage('scorecard');
    }
  };

  if (!isReady) {
    return (
      <div className="h-full w-full flex items-center justify-center bg-court-black">
        <Loader2 className="w-12 h-12 text-gold-400 animate-spin" />
      </div>
    );
  }

  return (
    <motion.div className="h-full w-full flex flex-col bg-court-black overflow-hidden">
      <div className="flex items-center justify-between px-8 py-4 border-b border-white/5 bg-black/40 backdrop-blur-md">
        <div className="flex items-center gap-3">
          <Scale className="w-5 h-5 text-gold-400" />
          <div>
            <h1 className="text-sm font-semibold text-white">{roomData?.title}</h1>
            <p className="text-[10px] text-white/30 uppercase tracking-widest">{currentUser?.role}</p>
          </div>
        </div>
        <div className="flex items-center gap-6">
          <PressureGauge />
          <SessionTimer />
        </div>
      </div>

      <div className="flex-1 flex overflow-hidden">
        <div className="flex-1 flex flex-col p-8 gap-8 relative">
          <div className="flex justify-center"><JudgeBench /></div>
          <div className="flex-1 flex items-center justify-center gap-12">
            <div className={`w-full max-w-xs transition-opacity ${activeSpeaker !== currentUser?.role && activeSpeaker !== 'none' ? 'opacity-100' : 'opacity-40'}`}><OpposingCounsel /></div>
            <div className={`w-full max-w-xs transition-opacity ${activeSpeaker === currentUser?.role ? 'opacity-100' : 'opacity-40'}`}><LawyerPodium /></div>
          </div>
          <div className="flex items-center justify-center gap-5 pb-4">
            {currentUser?.role === 'prosecutor' && (
              <button onClick={triggerJudgeAI} disabled={judgeCooldown} className="px-6 h-12 rounded-full font-bold uppercase tracking-wider bg-gold-400/20 border border-gold-400/50 text-gold-400">Call Judge</button>
            )}
            <button onClick={toggleMic} className={`px-8 h-12 rounded-full font-bold uppercase tracking-wider ${isMicOn ? 'bg-red-500/20 text-red-400' : 'bg-emerald-500/20 text-emerald-400'}`}>{isMicOn ? 'Stop Talking' : 'Start Talking'}</button>
            <button onClick={() => handleEndSession()} className="w-16 h-16 rounded-full bg-red-500/20 border border-red-500/30 flex items-center justify-center"><PhoneOff className="w-6 h-6 text-red-400" /></button>
          </div>
        </div>
        <div className="w-96 border-l border-white/5 bg-white/[0.01]"><TranscriptPanel /></div>
      </div>
    </motion.div>
  );
}
