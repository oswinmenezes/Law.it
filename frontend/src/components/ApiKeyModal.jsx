import { useState } from 'react';
import { motion } from 'framer-motion';
import { Key, X, Eye, EyeOff } from 'lucide-react';
import useCourtStore from '../store/useCourtStore';

export default function ApiKeyModal({ onClose, onSaved }) {
  const { apiKey, setApiKey } = useCourtStore();
  const [key, setKey] = useState(apiKey);
  const [showKey, setShowKey] = useState(false);
  const [error, setError] = useState('');

  const handleSave = () => {
    const trimmed = key.trim();
    if (!trimmed) {
      setError('API key is required');
      return;
    }
    if (trimmed.length < 20) {
      setError('Invalid API key format');
      return;
    }
    setApiKey(trimmed);
    if (onSaved) onSaved();
  };

  return (
    <motion.div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
    >
      <motion.div
        className="glass-panel rounded-2xl p-8 max-w-md w-full mx-4 border border-gold-400/20"
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ type: 'spring', damping: 25 }}
      >
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-gold-400/10 flex items-center justify-center">
              <Key className="w-5 h-5 text-gold-400" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-white">Gemini API Key</h2>
              <p className="text-xs text-white/40">Required for live courtroom sessions</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-lg hover:bg-white/5 flex items-center justify-center transition-colors cursor-pointer"
          >
            <X className="w-4 h-4 text-white/40" />
          </button>
        </div>

        <div className="space-y-4">
          <div>
            <label className="block text-sm text-white/60 mb-2">API Key</label>
            <div className="relative">
              <input
                id="input-api-key"
                type={showKey ? 'text' : 'password'}
                value={key}
                onChange={(e) => { setKey(e.target.value); setError(''); }}
                placeholder="AIza..."
                className="w-full bg-court-black/60 border border-court-border rounded-xl px-4 py-3 text-sm text-white/90 placeholder-white/20 focus:outline-none focus:border-gold-400/50 transition-colors font-[family-name:var(--font-mono)]"
              />
              <button
                onClick={() => setShowKey(!showKey)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-white/30 hover:text-white/60 cursor-pointer"
              >
                {showKey ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
            {error && <p className="text-red-400 text-xs mt-1">{error}</p>}
          </div>

          <p className="text-xs text-white/30 leading-relaxed">
            Get your API key from{' '}
            <a
              href="https://aistudio.google.com/apikey"
              target="_blank"
              rel="noreferrer"
              className="text-gold-400/70 hover:text-gold-400 underline"
            >
              Google AI Studio
            </a>
            . Your key is stored locally in your browser only.
          </p>

          <button
            id="btn-save-api-key"
            onClick={handleSave}
            className="w-full py-3 rounded-xl bg-gradient-to-r from-gold-400 to-gold-500 text-court-black font-semibold text-sm hover:shadow-lg hover:shadow-gold-400/20 transition-all cursor-pointer"
          >
            Save & Continue
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
}
