/**
 * Gemini Live API WebSocket Manager
 * Handles realtime bidirectional audio streaming with Gemini
 */

class GeminiLiveConnection {
  constructor() {
    this.ws = null;
    this.isConnected = false;
    this.isConfigured = false;
    this.onAudioData = null;
    this.onInputTranscript = null;
    this.onOutputTranscript = null;
    this.onError = null;
    this.onClose = null;
    this.onSetupComplete = null;
    this.onInterrupted = null;
    this.onTurnComplete = null;
    this.onModelTurnStarted = null;
    this.audioQueue = [];
    this.isProcessingAudio = false;
    this._modelTurnActive = false;
  }

  connect(apiKey, systemPrompt, voiceName = 'Orus') {
    return new Promise((resolve, reject) => {
      const MODEL_NAME = 'gemini-3.1-flash-live-preview';
      const WS_URL = `wss://generativelanguage.googleapis.com/ws/google.ai.generativelanguage.v1beta.GenerativeService.BidiGenerateContent?key=${apiKey}`;

      try {
        this.ws = new WebSocket(WS_URL);
      } catch (err) {
        reject(new Error(`Failed to create WebSocket: ${err.message}`));
        return;
      }

      this.ws.onopen = () => {
        console.log('[Gemini] WebSocket connected');
        this.isConnected = true;

        // Send setup configuration
        const configMessage = {
          setup: {
            model: `models/${MODEL_NAME}`,
            generationConfig: {
              responseModalities: ['AUDIO'],
              speechConfig: {
                voiceConfig: {
                  prebuiltVoiceConfig: {
                    voiceName: voiceName,
                  },
                },
              },
            },
            systemInstruction: {
              parts: [{ text: systemPrompt }],
            },
            realtimeInputConfig: {
              automaticActivityDetection: {
                disabled: false,
              },
            },
            inputAudioTranscription: {},
            outputAudioTranscription: {},
          },
        };

        this.ws.send(JSON.stringify(configMessage));
        console.log('[Gemini] Setup configuration sent');
      };

      this.ws.onmessage = async (event) => {
        try {
          let rawData = event.data;
          if (rawData instanceof Blob) {
            rawData = await rawData.text();
          }
          const response = JSON.parse(rawData);
          this._handleMessage(response, resolve);
        } catch (err) {
          console.error('[Gemini] Failed to parse message:', err);
        }
      };

      this.ws.onerror = (error) => {
        console.error('[Gemini] WebSocket error:', error);
        this.isConnected = false;
        if (this.onError) this.onError(error);
        reject(new Error('WebSocket connection failed'));
      };

      this.ws.onclose = (event) => {
        console.log('[Gemini] WebSocket closed:', event.code, event.reason);
        this.isConnected = false;
        this.isConfigured = false;
        if (this.onClose) this.onClose(event);
      };
    });
  }

  _handleMessage(response, resolveConnect) {
    // Setup complete acknowledgment
    if (response.setupComplete) {
      console.log('[Gemini] Setup complete');
      this.isConfigured = true;
      if (this.onSetupComplete) this.onSetupComplete();
      if (resolveConnect) resolveConnect();
      return;
    }

    // Server content (audio + transcriptions)
    if (response.serverContent) {
      const sc = response.serverContent;

      // Audio data from model — also signals model turn has started
      if (sc.modelTurn?.parts) {
        if (!this._modelTurnActive) {
          this._modelTurnActive = true;
          if (this.onModelTurnStarted) this.onModelTurnStarted();
        }
        for (const part of sc.modelTurn.parts) {
          if (part.inlineData) {
            const audioBase64 = part.inlineData.data;
            if (this.onAudioData) {
              this.onAudioData(audioBase64);
            }
          }
        }
      }

      // Input transcription (what user said)
      if (sc.inputTranscription?.text) {
        if (this.onInputTranscript) {
          this.onInputTranscript(sc.inputTranscription.text);
        }
      }

      // Output transcription (what AI said)
      if (sc.outputTranscription?.text) {
        if (this.onOutputTranscript) {
          this.onOutputTranscript(sc.outputTranscription.text);
        }
      }

      // Turn complete — model finished speaking
      if (sc.turnComplete) {
        console.log('[Gemini] Turn complete');
        this._modelTurnActive = false;
        if (this.onTurnComplete) this.onTurnComplete();
      }

      // Check if model was interrupted (barge-in)
      if (sc.interrupted) {
        console.log('[Gemini] Model was interrupted');
        this._modelTurnActive = false;
        if (this.onInterrupted) this.onInterrupted();
      }
    }

    // Tool calls (not used in MVP but ready)
    if (response.toolCall) {
      console.log('[Gemini] Tool call received:', response.toolCall);
    }
  }

  sendAudioChunk(pcmBase64) {
    if (!this.ws || this.ws.readyState !== WebSocket.OPEN || !this.isConfigured) {
      return;
    }

    const audioMessage = {
      realtimeInput: {
        audio: {
          data: pcmBase64,
          mimeType: 'audio/pcm;rate=16000',
        },
      },
    };

    this.ws.send(JSON.stringify(audioMessage));
  }

  sendTextMessage(text) {
    if (!this.ws || this.ws.readyState !== WebSocket.OPEN || !this.isConfigured) {
      console.warn('[Gemini] Cannot send text - not connected');
      return;
    }

    const textMessage = {
      clientContent: {
        turns: [{
          role: 'user',
          parts: [{ text }],
        }],
        turnComplete: true,
      },
    };

    this.ws.send(JSON.stringify(textMessage));
    console.log('[Gemini] Text message sent');
  }

  disconnect() {
    if (this.ws) {
      this.ws.close();
      this.ws = null;
      this.isConnected = false;
      this.isConfigured = false;
    }
  }

  get connected() {
    return this.isConnected && this.isConfigured;
  }
}

// Singleton instance
const geminiLive = new GeminiLiveConnection();
export default geminiLive;
