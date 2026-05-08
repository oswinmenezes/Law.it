import { useEffect, useRef, useCallback, useState } from 'react';
import { motion } from 'framer-motion';
import { Mic, MicOff, PhoneOff, Scale, AlertCircle, Loader2 } from 'lucide-react';
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
    apiKey, caseData, sessionActive, sessionPhase, activeSpeaker,
    isMicOn, currentIssue, hearingPhase,
    startSession, endSession, setActiveSpeaker, setSessionPhase,
    addTranscript, updateLastTranscript,
    setMicOn, setAiSpeaking, setUserAudioLevel, setAiAudioLevel,
    setScores, setPage, increasePressure, resetSession,
  } = useCourtStore();

  const [error, setError] = useState('');
  const [isConnecting, setIsConnecting] = useState(false);
  const outputBufferRef = useRef('');
  const inputBufferRef = useRef('');
  const currentAiEntryIdRef = useRef(null);
  const currentUserEntryIdRef = useRef(null);
  const sessionActiveRef = useRef(false);
  const aiSpeakingRef = useRef(false);

  // Keep ref in sync
  useEffect(() => {
    sessionActiveRef.current = sessionActive;
  }, [sessionActive]);

  // Helper: finalize the current AI transcript entry
  const finalizeAiEntry = useCallback(() => {
    if (currentAiEntryIdRef.current && outputBufferRef.current) {
      // Mark streaming as false on the last entry
      const store = useCourtStore.getState();
      const idx = store.transcript.findIndex((t) => t.id === currentAiEntryIdRef.current);
      if (idx >= 0) {
        const updated = [...store.transcript];
        updated[idx] = { ...updated[idx], streaming: false };
        useCourtStore.setState({ transcript: updated });
      }
    }
    outputBufferRef.current = '';
    currentAiEntryIdRef.current = null;
  }, []);

  // Helper: finalize the current user transcript entry
  const finalizeUserEntry = useCallback(() => {
    if (currentUserEntryIdRef.current && inputBufferRef.current) {
      const store = useCourtStore.getState();
      const idx = store.transcript.findIndex((t) => t.id === currentUserEntryIdRef.current);
      if (idx >= 0) {
        const updated = [...store.transcript];
        updated[idx] = { ...updated[idx], streaming: false };
        useCourtStore.setState({ transcript: updated });
      }
    }
    inputBufferRef.current = '';
    currentUserEntryIdRef.current = null;
  }, []);

  // Track the current AI speaker for the active buffer
  const currentAiSpeakerRef = useRef('judge');

  // Split patterns for detecting speaker transitions in the audio transcription
  const OPPOSING_CUE = /respondent'?s?\s*counsel\s*:/i;
  const JUDGE_CUE = /the\s*court\s*:/i;

  // Initialize session
  const initSession = useCallback(async () => {
    setError('');
    setIsConnecting(true);

    try {
      const systemPrompt = buildSystemPrompt(caseData);

      // --- Gemini Live callbacks ---

      // Audio data → play it and mark AI as speaking
      geminiLive.onAudioData = (base64) => {
        if (!sessionActiveRef.current) return;
        audioManager.playAudioChunk(base64);
        aiSpeakingRef.current = true;
        setAiSpeaking(true);
      };

      // Model turn started → finalize any prior user entry, prepare for new AI entry
      geminiLive.onModelTurnStarted = () => {
        if (!sessionActiveRef.current) return;
        finalizeUserEntry();
        // Reset speaker to judge (default) for new turn
        currentAiSpeakerRef.current = 'judge';
      };

      // Output transcription (what AI said) — detect speaker switches mid-turn
      geminiLive.onOutputTranscript = (text) => {
        if (!sessionActiveRef.current) return;
        outputBufferRef.current += text;
        const fullText = outputBufferRef.current.trim();

        if (!fullText) return;

        // Check if there's a speaker switch cue in the FULL buffer
        // We look for the LAST cue to determine current speaker
        let activeSpeakerForText = currentAiSpeakerRef.current;
        let displayText = fullText;

        // Find opposing counsel cue
        const oppMatch = fullText.match(OPPOSING_CUE);
        const judgeMatch = fullText.match(JUDGE_CUE);

        if (oppMatch || judgeMatch) {
          // Determine the latest cue position
          const oppPos = oppMatch ? fullText.search(OPPOSING_CUE) : -1;
          const judgePos = judgeMatch ? fullText.search(JUDGE_CUE) : -1;

          if (oppPos > judgePos) {
            // Opposing counsel is speaking now
            if (currentAiSpeakerRef.current !== 'opposing') {
              // Speaker switch! Finalize current entry and start new one
              const beforeSwitch = fullText.substring(0, oppPos).trim();
              const afterSwitch = fullText.substring(oppPos).replace(OPPOSING_CUE, '').trim();

              // Update the existing entry with text before the switch
              if (currentAiEntryIdRef.current && beforeSwitch) {
                updateLastTranscript(beforeSwitch);
                // Mark it as finalized
                const store = useCourtStore.getState();
                const idx = store.transcript.findIndex((t) => t.id === currentAiEntryIdRef.current);
                if (idx >= 0) {
                  const updated = [...store.transcript];
                  updated[idx] = { ...updated[idx], streaming: false };
                  useCourtStore.setState({ transcript: updated });
                }
              }

              // Start new opposing counsel entry
              currentAiSpeakerRef.current = 'opposing';
              currentAiEntryIdRef.current = null;
              outputBufferRef.current = afterSwitch;
              displayText = afterSwitch;
              activeSpeakerForText = 'opposing';

              if (afterSwitch) {
                addTranscript({ speaker: 'opposing', text: afterSwitch, streaming: true });
                const store2 = useCourtStore.getState();
                currentAiEntryIdRef.current = store2.transcript[store2.transcript.length - 1]?.id;
              }
              setActiveSpeaker('opposing');
              return;
            }
            // Already opposing, strip the cue and continue
            displayText = fullText.replace(OPPOSING_CUE, '').trim();
            activeSpeakerForText = 'opposing';
          } else if (judgePos > oppPos) {
            // Judge is speaking now
            if (currentAiSpeakerRef.current !== 'judge') {
              const beforeSwitch = fullText.substring(0, judgePos).trim();
              const afterSwitch = fullText.substring(judgePos).replace(JUDGE_CUE, '').trim();

              if (currentAiEntryIdRef.current && beforeSwitch) {
                updateLastTranscript(beforeSwitch);
                const store = useCourtStore.getState();
                const idx = store.transcript.findIndex((t) => t.id === currentAiEntryIdRef.current);
                if (idx >= 0) {
                  const updated = [...store.transcript];
                  updated[idx] = { ...updated[idx], streaming: false };
                  useCourtStore.setState({ transcript: updated });
                }
              }

              currentAiSpeakerRef.current = 'judge';
              currentAiEntryIdRef.current = null;
              outputBufferRef.current = afterSwitch;
              displayText = afterSwitch;
              activeSpeakerForText = 'judge';

              if (afterSwitch) {
                addTranscript({ speaker: 'judge', text: afterSwitch, streaming: true });
                const store2 = useCourtStore.getState();
                currentAiEntryIdRef.current = store2.transcript[store2.transcript.length - 1]?.id;
              }
              setActiveSpeaker('judge');
              return;
            }
            displayText = fullText.replace(JUDGE_CUE, '').trim();
            activeSpeakerForText = 'judge';
          }
        }

        // Clean any remaining tags
        displayText = displayText
          .replace(/\[JUDGE\]/gi, '')
          .replace(/\[OPPOSING\]/gi, '')
          .replace(OPPOSING_CUE, '')
          .replace(JUDGE_CUE, '')
          .trim();

        if (!displayText) return;

        setActiveSpeaker(activeSpeakerForText);

        if (currentAiEntryIdRef.current) {
          updateLastTranscript(displayText);
        } else {
          addTranscript({ speaker: activeSpeakerForText, text: displayText, streaming: true });
          const store = useCourtStore.getState();
          currentAiEntryIdRef.current = store.transcript[store.transcript.length - 1]?.id;
        }
      };

      // Input transcription (what user said) — accumulate into one entry
      geminiLive.onInputTranscript = (text) => {
        if (!sessionActiveRef.current) return;
        inputBufferRef.current += text;
        const fullText = inputBufferRef.current.trim();

        if (!fullText) return;

        setActiveSpeaker('lawyer');

        if (currentUserEntryIdRef.current) {
          updateLastTranscript(fullText);
        } else {
          // Finalize any AI entry first
          finalizeAiEntry();
          addTranscript({ speaker: 'lawyer', text: fullText, streaming: true });
          const store = useCourtStore.getState();
          currentUserEntryIdRef.current = store.transcript[store.transcript.length - 1]?.id;
        }
      };

      // Turn complete → finalize the current AI entry
      geminiLive.onTurnComplete = () => {
        finalizeAiEntry();
        aiSpeakingRef.current = false;
        setAiSpeaking(false);
        setActiveSpeaker('none');
      };

      // Interrupted → finalize and increase pressure
      geminiLive.onInterrupted = () => {
        finalizeAiEntry();
        audioManager.stopPlayback();
        aiSpeakingRef.current = false;
        setAiSpeaking(false);
        increasePressure(1);
      };

      geminiLive.onSetupComplete = () => {
        console.log('[Courtroom] Setup complete, ready for hearing');
      };

      geminiLive.onClose = () => {
        if (sessionActiveRef.current) {
          handleEndSession();
        }
      };

      geminiLive.onError = (err) => {
        console.error('[Courtroom] Gemini error:', err);
        setError('Connection lost. The hearing has been adjourned.');
      };

      // Connect to Gemini
      await geminiLive.connect(apiKey, systemPrompt);

      // --- Audio manager callbacks ---

      audioManager.onAudioChunk = (base64) => {
        geminiLive.sendAudioChunk(base64);
      };

      audioManager.onAudioLevel = (level) => {
        setUserAudioLevel(level);
      };

      audioManager.onPlaybackLevel = (level) => {
        setAiAudioLevel(level);
      };

      // Start session
      startSession();
      setIsConnecting(false);

      // Start mic capture
      await audioManager.startCapture();
      setMicOn(true);

      // Add system transcript
      addTranscript({
        speaker: 'system',
        text: `Court is now in session. Matter: ${caseData?.case_title || 'General Matter'}`,
      });

    } catch (err) {
      console.error('[Courtroom] Init error:', err);
      setError(`Failed to connect: ${err.message}. Please check your API key and try again.`);
      setIsConnecting(false);
    }
  }, [apiKey, caseData]);

  // Auto-init on mount
  useEffect(() => {
    initSession();

    return () => {
      geminiLive.disconnect();
      audioManager.cleanup();
    };
  }, []);

  // Handle session end (time up or manual)
  const handleEndSession = useCallback(async () => {
    setMicOn(false);
    audioManager.stopCapture();
    geminiLive.disconnect();
    audioManager.stopPlayback();
    endSession();

    addTranscript({
      speaker: 'system',
      text: 'The hearing has concluded. Generating performance evaluation...',
    });

    // Generate scores using Gemini text API
    try {
      const store = useCourtStore.getState();
      const scoringPrompt = buildScoringPrompt(store.caseData, store.transcript);

      console.log('[Scoring] Sending transcript for evaluation...', {
        entryCount: store.transcript.length,
        promptLength: scoringPrompt.length,
      });

      let response;
      let responseOk = false;
      const modelsToTry = ['gemini-2.5-flash', 'gemini-1.5-pro', 'gemini-1.5-flash'];
      
      for (const model of modelsToTry) {
        try {
          console.log(`[Scoring] Attempting evaluation with ${model}...`);
          response = await fetch(
            `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`,
            {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                contents: [{ parts: [{ text: scoringPrompt }] }],
                generationConfig: {
                  temperature: 0.3,
                  responseMimeType: 'application/json',
                },
              }),
            }
          );
          
          if (response.ok) {
            responseOk = true;
            break;
          } else {
            const errBody = await response.text();
            console.warn(`[Scoring] ${model} failed with ${response.status}:`, errBody);
          }
        } catch (e) {
          console.warn(`[Scoring] Network error with ${model}:`, e.message);
        }
      }

      if (!responseOk) {
        throw new Error(`All scoring API attempts failed. Please try again later.`);
      }

      const data = await response.json();
      console.log('[Scoring] Raw response:', data);
      const text = data.candidates?.[0]?.content?.parts?.[0]?.text || '';

      // Parse JSON from response
      const jsonMatch = text.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        const scores = JSON.parse(jsonMatch[0]);
        console.log('[Scoring] Parsed scores:', scores);
        setScores(scores);
      } else {
        console.warn('[Scoring] No JSON found in response text:', text);
        setScores({
          overall_score: 50,
          criteria: {},
          strengths: ['Session completed'],
          weaknesses: ['Could not generate detailed evaluation'],
          improvements: ['Try again with a longer session'],
          judicial_verdict: 'The evaluation could not be fully completed.',
        });
      }
    } catch (err) {
      console.error('[Scoring] Error:', err);
      setScores({
        overall_score: 0,
        criteria: {},
        strengths: [],
        weaknesses: ['Scoring failed: ' + err.message],
        improvements: [],
        judicial_verdict: 'Evaluation failed due to a technical error.',
      });
    }
  }, [apiKey]);

  // Watch for session time expiry
  const timeRemaining = useCourtStore((s) => s.timeRemaining);
  useEffect(() => {
    if (sessionActive && timeRemaining <= 0) {
      handleEndSession();
    }
  }, [timeRemaining, sessionActive]);

  const toggleMic = useCallback(async () => {
    if (isMicOn) {
      audioManager.stopCapture();
      setMicOn(false);
    } else {
      await audioManager.startCapture();
      setMicOn(true);
    }
  }, [isMicOn]);

  // Error state
  if (error && !sessionActive) {
    return (
      <motion.div
        className="h-full w-full flex items-center justify-center bg-court-black"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
      >
        <div className="glass-panel rounded-2xl p-10 max-w-md text-center">
          <AlertCircle className="w-12 h-12 text-red-400 mx-auto mb-4" />
          <h2 className="text-xl font-bold text-white mb-2">Session Error</h2>
          <p className="text-sm text-white/50 mb-6">{error}</p>
          <div className="flex gap-3 justify-center">
            <button
              onClick={() => { resetSession(); setPage('setup'); }}
              className="px-5 py-2.5 rounded-xl bg-court-panel border border-court-border text-white/70 text-sm hover:border-gold-400/30 transition-all cursor-pointer"
            >
              Back to Cases
            </button>
            <button
              onClick={() => { setError(''); initSession(); }}
              className="px-5 py-2.5 rounded-xl bg-gold-400 text-court-black text-sm font-semibold hover:bg-gold-300 transition-all cursor-pointer"
            >
              Retry
            </button>
          </div>
        </div>
      </motion.div>
    );
  }

  // Loading state
  if (isConnecting) {
    return (
      <motion.div
        className="h-full w-full flex items-center justify-center bg-court-black"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
      >
        <div className="text-center">
          <Loader2 className="w-12 h-12 text-gold-400 mx-auto mb-4 animate-spin" />
          <h2 className="text-xl font-bold text-white mb-2 font-[family-name:var(--font-display)]">
            Entering the Courtroom
          </h2>
          <p className="text-sm text-white/40">Establishing live connection with the bench...</p>
        </div>
      </motion.div>
    );
  }

  return (
    <motion.div
      className="h-full w-full flex flex-col bg-court-black overflow-hidden"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
    >
      {/* Top Bar */}
      <div className="flex items-center justify-between px-8 py-4 border-b border-court-border/60 bg-court-dark/90 backdrop-blur-md">
        <div className="flex items-center gap-3">
          <Scale className="w-5 h-5 text-gold-400/60" />
          <div>
            <h1 className="text-sm font-semibold text-white/80 truncate max-w-[300px]">
              {caseData?.case_title || 'General Matter'}
            </h1>
            <p className="text-[10px] text-white/30">{caseData?.court_type || 'High Court'}</p>
          </div>
        </div>

        <div className="flex items-center gap-6">
          {/* Current Issue */}
          <div className="hidden md:flex items-center gap-2">
            <span className="text-[10px] text-white/25 uppercase tracking-wider">Issue:</span>
            <span className="text-xs text-gold-400/70 font-medium">{currentIssue || 'General'}</span>
          </div>

          {/* Hearing Phase */}
          <div className="hidden md:flex items-center gap-2">
            <span className="text-[10px] text-white/25 uppercase tracking-wider">Phase:</span>
            <span className="text-xs text-white/50 capitalize">{hearingPhase}</span>
          </div>

          <PressureGauge />
          <SessionTimer />
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex overflow-hidden">
        {/* Courtroom Arena */}
        <div className="flex-1 flex flex-col p-8 gap-8">
          {/* Judge (top center) */}
          <div className="flex justify-center">
            <div className="w-full max-w-xs">
              <JudgeBench />
            </div>
          </div>

          {/* Opposing + Lawyer (bottom row) */}
          <div className="flex-1 flex items-center justify-center gap-8">
            <div className="w-full max-w-xs">
              <OpposingCounsel />
            </div>
            <div className="w-full max-w-xs">
              <LawyerPodium />
            </div>
          </div>

          {/* Controls */}
          <div className="flex items-center justify-center gap-5">
            {/* Mic Toggle */}
            <motion.button
              id="btn-toggle-mic"
              onClick={toggleMic}
              className={`w-14 h-14 rounded-full flex items-center justify-center transition-all cursor-pointer ${
                isMicOn
                  ? 'bg-emerald-500 shadow-lg shadow-emerald-500/30 hover:bg-emerald-400'
                  : 'bg-court-panel border border-court-border hover:border-white/20'
              }`}
              whileTap={{ scale: 0.9 }}
            >
              {isMicOn
                ? <Mic className="w-6 h-6 text-white" />
                : <MicOff className="w-6 h-6 text-white/40" />
              }
            </motion.button>

            {/* End Session */}
            <motion.button
              id="btn-end-session"
              onClick={handleEndSession}
              className="w-14 h-14 rounded-full bg-red-500/20 border border-red-500/30 flex items-center justify-center hover:bg-red-500/30 transition-all cursor-pointer"
              whileTap={{ scale: 0.9 }}
            >
              <PhoneOff className="w-6 h-6 text-red-400" />
            </motion.button>
          </div>
        </div>

        {/* Transcript Sidebar */}
        <div className="w-80 lg:w-[26rem] border-l border-court-border/60 bg-transcript-bg flex flex-col">
          <TranscriptPanel />
        </div>
      </div>

      {/* Error toast */}
      {error && (
        <motion.div
          className="fixed bottom-6 left-1/2 -translate-x-1/2 bg-red-500/20 border border-red-500/30 rounded-xl px-6 py-3 text-sm text-red-300 backdrop-blur-sm z-50"
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
        >
          {error}
        </motion.div>
      )}
    </motion.div>
  );
}
