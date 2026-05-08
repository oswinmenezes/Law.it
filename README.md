# ⚖️ FaceOff Courtroom — AI Litigation Simulator

> **"LeetCode for Litigators"**

A production-grade, realtime AI courtroom litigation simulator for Indian law. Practice oral arguments against AI-generated judges and opposing counsel through live voice interaction powered by **Gemini Live API**.

---

## 🎯 What Is This?

FaceOff Courtroom simulates realistic **Indian High Court / Supreme Court oral hearings**. You upload or select a legal case, and the system generates:

- A stern, procedurally rigorous **AI Judge**
- A sharp, adversarial **AI Opposing Counsel**
- Dynamic **interruptions**, judicial pressure, and procedural challenges
- Real-time **performance scoring** after each session

This is **NOT a chatbot**. It's a **realtime courtroom simulation engine**.

---

## 🚀 Quick Start

```bash
cd frontend
npm install
npm run dev
```

Open `http://localhost:5173` and enter your **Gemini API key** (get one at [Google AI Studio](https://aistudio.google.com/apikey)).

---

## ✨ Features

| Feature | Description |
|---|---|
| 🎤 **Live Voice Arguments** | Real-time voice interaction via Gemini Live WebSocket API |
| ⚡ **Dynamic Interruptions** | AI judge interrupts weak arguments naturally — not turn-based |
| 📊 **Performance Scoring** | AI-powered evaluation across 8 legal criteria |
| 📄 **Case Upload** | Upload PDF, DOCX, or TXT case files parsed in-browser |
| 🏛️ **Indian Law Realism** | Authentic HC/SC proceedings with proper terminology |
| 🎨 **Immersive UI** | Dark cinematic design with animated waveforms and pressure indicators |
| 🧠 **Session Memory** | Tracks submissions, contradictions, and unresolved issues |

---

## 🏗️ Architecture

```
frontend/src/
├── App.jsx                    # Root with page routing
├── main.jsx                   # Entry point
├── index.css                  # TailwindCSS v4 + custom theme
├── store/
│   └── useCourtStore.js       # Zustand state management
├── lib/
│   ├── geminiLive.js          # WebSocket Gemini Live API client
│   ├── audioManager.js        # PCM mic capture + audio playback
│   ├── fileParser.js          # PDF/DOCX/TXT in-browser parsing
│   ├── prompts.js             # System prompts for AI personas
│   └── prebuiltCases.js       # Sample Indian legal cases
└── components/
    ├── Landing.jsx             # Landing page
    ├── ApiKeyModal.jsx         # API key input
    ├── CaseSetup.jsx           # Case upload/selection
    ├── Courtroom.jsx           # Main courtroom orchestrator
    ├── JudgeBench.jsx          # Judge avatar + waveform
    ├── OpposingCounsel.jsx     # Opposing counsel section
    ├── LawyerPodium.jsx        # User's podium
    ├── TranscriptPanel.jsx     # Live transcript
    ├── PressureGauge.jsx       # Pressure indicator
    ├── SessionTimer.jsx        # 5-min countdown
    ├── WaveformVisualizer.jsx  # Audio waveform bars
    ├── ScoreCard.jsx           # Post-session scoring
    └── ParticleBackground.jsx  # Ambient particles
```

---

## 🔧 Tech Stack

- **React 19** + **Vite 8**
- **TailwindCSS v4** — Custom dark courtroom theme
- **Zustand** — Lightweight state management
- **Framer Motion** — Animations and transitions
- **Gemini Live API** — Realtime voice via raw WebSockets
- **Web Audio API** — PCM mic capture and audio playback
- **pdf.js** + **mammoth.js** — In-browser document parsing
- **Lucide React** — Icon system

---

## 📋 Session Flow

1. **Matter Called** — Judge opens the hearing
2. **Opening Question** — Judge addresses counsel
3. **Oral Submissions** — You argue your case via microphone
4. **Interruptions** — Judge interrupts weak arguments dynamically
5. **Opposing Attacks** — Opposing counsel challenges your position
6. **Pressure Escalation** — Intensity increases over 5 minutes
7. **Session End** — Hearing concludes
8. **Performance Report** — AI scores across 8 criteria

---

## 🇮🇳 Indian Legal Realism

- Authentic terminology: *My Lord*, *Learned Counsel*, *Maintainability*, *Writ*, *Locus*
- Procedural questioning over dramatic speeches
- Judge-dominated, interruption-heavy format
- No Hollywood courtroom behavior or jury-trial dynamics

---

## 📝 License

MIT