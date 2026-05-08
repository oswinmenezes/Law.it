/**
 * Audio Manager — Handles microphone capture and audio playback
 * Input: 16-bit PCM at 16kHz
 * Output: 16-bit PCM at 24kHz
 */

class AudioManager {
  constructor() {
    this.audioContext = null;
    this.mediaStream = null;
    this.workletNode = null;
    this.sourceNode = null;
    this.analyserNode = null;
    this.playbackContext = null;
    this.playbackQueue = [];
    this.isPlaying = false;
    this.isCapturing = false;
    this.onAudioChunk = null;
    this.onAudioLevel = null;
    this.onPlaybackLevel = null;
    this.nextPlaybackTime = 0;
  }

  async startCapture() {
    try {
      this.mediaStream = await navigator.mediaDevices.getUserMedia({
        audio: {
          sampleRate: 16000,
          channelCount: 1,
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
        },
      });

      this.audioContext = new AudioContext({ sampleRate: 16000 });
      const source = this.audioContext.createMediaStreamSource(this.mediaStream);

      // Analyser for visualizing audio level
      this.analyserNode = this.audioContext.createAnalyser();
      this.analyserNode.fftSize = 256;
      source.connect(this.analyserNode);

      // ScriptProcessor for getting raw PCM (AudioWorklet alternative for simplicity)
      const bufferSize = 4096;
      const processor = this.audioContext.createScriptProcessor(bufferSize, 1, 1);

      source.connect(processor);
      processor.connect(this.audioContext.destination);

      processor.onaudioprocess = (e) => {
        if (!this.isCapturing) return;

        const inputData = e.inputBuffer.getChannelData(0);

        // Convert float32 to int16 PCM
        const pcm16 = new Int16Array(inputData.length);
        for (let i = 0; i < inputData.length; i++) {
          const s = Math.max(-1, Math.min(1, inputData[i]));
          pcm16[i] = s < 0 ? s * 0x8000 : s * 0x7fff;
        }

        // Convert to base64
        const bytes = new Uint8Array(pcm16.buffer);
        const base64 = this._arrayBufferToBase64(bytes);

        if (this.onAudioChunk) {
          this.onAudioChunk(base64);
        }
      };

      this.isCapturing = true;
      this._startLevelMonitoring();
      console.log('[Audio] Capture started');
    } catch (err) {
      console.error('[Audio] Failed to start capture:', err);
      throw err;
    }
  }

  stopCapture() {
    this.isCapturing = false;
    if (this.mediaStream) {
      this.mediaStream.getTracks().forEach((t) => t.stop());
      this.mediaStream = null;
    }
    if (this.audioContext) {
      this.audioContext.close();
      this.audioContext = null;
    }
    console.log('[Audio] Capture stopped');
  }

  _startLevelMonitoring() {
    const monitor = () => {
      if (!this.analyserNode || !this.isCapturing) return;

      const data = new Uint8Array(this.analyserNode.frequencyBinCount);
      this.analyserNode.getByteFrequencyData(data);

      let sum = 0;
      for (let i = 0; i < data.length; i++) {
        sum += data[i];
      }
      const avg = sum / data.length / 255;

      if (this.onAudioLevel) {
        this.onAudioLevel(avg);
      }

      requestAnimationFrame(monitor);
    };
    monitor();
  }

  async playAudioChunk(base64Data) {
    if (!this.playbackContext) {
      this.playbackContext = new AudioContext({ sampleRate: 24000 });
      this.nextPlaybackTime = this.playbackContext.currentTime;
    }

    try {
      const binaryString = atob(base64Data);
      const bytes = new Uint8Array(binaryString.length);
      for (let i = 0; i < binaryString.length; i++) {
        bytes[i] = binaryString.charCodeAt(i);
      }

      // Convert int16 PCM to float32
      const int16 = new Int16Array(bytes.buffer);
      const float32 = new Float32Array(int16.length);
      for (let i = 0; i < int16.length; i++) {
        float32[i] = int16[i] / 32768.0;
      }

      // Create audio buffer
      const audioBuffer = this.playbackContext.createBuffer(1, float32.length, 24000);
      audioBuffer.getChannelData(0).set(float32);

      // Schedule playback
      const source = this.playbackContext.createBufferSource();
      source.buffer = audioBuffer;

      // Analyser for playback level
      const analyser = this.playbackContext.createAnalyser();
      analyser.fftSize = 256;
      source.connect(analyser);
      analyser.connect(this.playbackContext.destination);

      const now = this.playbackContext.currentTime;
      const startTime = Math.max(now, this.nextPlaybackTime);
      source.start(startTime);
      this.nextPlaybackTime = startTime + audioBuffer.duration;

      // Monitor playback level
      this._monitorPlaybackLevel(analyser, audioBuffer.duration);

      this.isPlaying = true;
      source.onended = () => {
        if (this.playbackContext && this.playbackContext.currentTime >= this.nextPlaybackTime - 0.05) {
          this.isPlaying = false;
          if (this.onPlaybackLevel) this.onPlaybackLevel(0);
        }
      };
    } catch (err) {
      console.error('[Audio] Playback error:', err);
    }
  }

  _monitorPlaybackLevel(analyser, duration) {
    const endTime = performance.now() + duration * 1000;
    const monitor = () => {
      if (performance.now() > endTime) return;

      const data = new Uint8Array(analyser.frequencyBinCount);
      analyser.getByteFrequencyData(data);
      let sum = 0;
      for (let i = 0; i < data.length; i++) sum += data[i];
      const avg = sum / data.length / 255;

      if (this.onPlaybackLevel) this.onPlaybackLevel(avg);
      requestAnimationFrame(monitor);
    };
    monitor();
  }

  stopPlayback() {
    if (this.playbackContext) {
      this.playbackContext.close();
      this.playbackContext = null;
      this.isPlaying = false;
      this.nextPlaybackTime = 0;
    }
  }

  cleanup() {
    this.stopCapture();
    this.stopPlayback();
  }

  _arrayBufferToBase64(buffer) {
    let binary = '';
    const bytes = new Uint8Array(buffer);
    const chunkSize = 8192;
    for (let i = 0; i < bytes.length; i += chunkSize) {
      const chunk = bytes.subarray(i, i + chunkSize);
      binary += String.fromCharCode.apply(null, chunk);
    }
    return btoa(binary);
  }
}

const audioManager = new AudioManager();
export default audioManager;
