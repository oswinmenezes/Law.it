import { create } from 'zustand';

const INITIAL_SESSION_DURATION = 300; // 5 minutes in seconds

const useCourtStore = create((set, get) => ({
  // App state
  currentPage: 'landing', // landing | setup | courtroom | scorecard
  apiKey: localStorage.getItem('gemini_api_key') || '',

  // Case data
  caseData: null,
  caseTitle: '',

  // Session state
  sessionActive: false,
  sessionPhase: 'idle', // idle | connecting | hearing | deliberating | complete
  timeRemaining: INITIAL_SESSION_DURATION,
  timerId: null,

  // Courtroom state
  activeSpeaker: 'none', // none | judge | opposing | lawyer
  currentIssue: '',
  pressureLevel: 3,
  pendingQuestion: false,
  contradictions: [],
  proceduralPosture: '',
  hearingPhase: 'opening', // opening | arguments | cross | rebuttal | closing | order

  // Transcript
  transcript: [],

  // Memory
  sessionMemory: {
    priorSubmissions: [],
    judicialObservations: [],
    unresolvedIssues: [],
    proceduralWeaknesses: [],
  },

  // Audio state
  isMicOn: false,
  isAiSpeaking: false,
  userAudioLevel: 0,
  aiAudioLevel: 0,

  // Scoring
  scores: null,

  // Multiplayer
  roomData: null,
  currentUser: null, // { id, name, role }
  opponent: null, // { id, name, role }
  multiplayerMode: false,
  isReady: false,

  // Actions
  setApiKey: (key) => {
    localStorage.setItem('gemini_api_key', key);
    set({ apiKey: key });
  },

  setPage: (page) => set({ currentPage: page }),

  setCaseData: (data) => set({
    caseData: data,
    caseTitle: data?.case_title || 'Untitled Matter',
    currentIssue: data?.legal_issues?.[0] || '',
  }),

  startSession: () => {
    const timerId = setInterval(() => {
      const state = get();
      if (state.timeRemaining <= 0) {
        clearInterval(state.timerId);
        set({ sessionActive: false, sessionPhase: 'complete', timerId: null });
        return;
      }
      // Dynamic pressure increase over time
      const elapsed = INITIAL_SESSION_DURATION - state.timeRemaining;
      const timePressure = Math.min(10, 3 + Math.floor(elapsed / 30));
      set((s) => ({
        timeRemaining: s.timeRemaining - 1,
        pressureLevel: Math.max(s.pressureLevel, timePressure),
      }));
    }, 1000);

    set({
      sessionActive: true,
      sessionPhase: 'hearing',
      timeRemaining: INITIAL_SESSION_DURATION,
      timerId,
      transcript: [],
      pressureLevel: 3,
      hearingPhase: 'opening',
      activeSpeaker: 'judge',
      scores: null,
      sessionMemory: {
        priorSubmissions: [],
        judicialObservations: [],
        unresolvedIssues: [],
        proceduralWeaknesses: [],
      },
    });
  },

  endSession: () => {
    const { timerId } = get();
    if (timerId) clearInterval(timerId);
    set({
      sessionActive: false,
      sessionPhase: 'complete',
      timerId: null,
      activeSpeaker: 'none',
    });
  },

  setActiveSpeaker: (speaker) => set({ activeSpeaker: speaker }),

  setSessionPhase: (phase) => set({ sessionPhase: phase }),

  setHearingPhase: (phase) => set({ hearingPhase: phase }),

  increasePressure: (amount = 1) => set((s) => ({
    pressureLevel: Math.min(10, s.pressureLevel + amount),
  })),

  setCurrentIssue: (issue) => set({ currentIssue: issue }),

  setPendingQuestion: (pending) => set({ pendingQuestion: pending }),

  addContradiction: (c) => set((s) => ({
    contradictions: [...s.contradictions, c],
    pressureLevel: Math.min(10, s.pressureLevel + 1),
  })),

  addTranscript: (entry) => set((s) => ({
    transcript: [...s.transcript, {
      ...entry,
      timestamp: Date.now(),
      id: `t-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
    }],
  })),

  updateLastTranscript: (text) => set((s) => {
    const transcript = [...s.transcript];
    // Find the last streaming entry to update
    for (let i = transcript.length - 1; i >= 0; i--) {
      if (transcript[i].streaming) {
        transcript[i] = { ...transcript[i], text };
        break;
      }
    }
    return { transcript };
  }),

  addToMemory: (type, item) => set((s) => ({
    sessionMemory: {
      ...s.sessionMemory,
      [type]: [...(s.sessionMemory[type] || []), item],
    },
  })),

  setMicOn: (on) => set({ isMicOn: on }),
  setAiSpeaking: (speaking) => set({ isAiSpeaking: speaking }),
  setUserAudioLevel: (level) => set({ userAudioLevel: level }),
  setAiAudioLevel: (level) => set({ aiAudioLevel: level }),

  setScores: (scores) => set({ scores, currentPage: 'scorecard' }),

  setRoomData: (data) => set({ roomData: data }),
  setCurrentUser: (user) => set({ currentUser: user }),
  setOpponent: (user) => set({ opponent: user }),
  setMultiplayerMode: (enabled) => set({ multiplayerMode: enabled }),
  setReady: (ready) => set({ isReady: ready }),

  resetSession: () => {
    const { timerId } = get();
    if (timerId) clearInterval(timerId);
    set({
      sessionActive: false,
      sessionPhase: 'idle',
      timeRemaining: INITIAL_SESSION_DURATION,
      timerId: null,
      activeSpeaker: 'none',
      currentIssue: '',
      pressureLevel: 3,
      pendingQuestion: false,
      contradictions: [],
      proceduralPosture: '',
      hearingPhase: 'opening',
      transcript: [],
      isMicOn: false,
      isAiSpeaking: false,
      scores: null,
      sessionMemory: {
        priorSubmissions: [],
        judicialObservations: [],
        unresolvedIssues: [],
        proceduralWeaknesses: [],
      },
    });
  },
}));

export default useCourtStore;
