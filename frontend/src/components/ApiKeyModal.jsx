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
    if (!trimmed) { setError('API key is required'); return; }
    if (trimmed.length < 20) { setError('Invalid API key format'); return; }
    setApiKey(trimmed);
    if (onSaved) onSaved();
  };

  return (
    <motion.div
      style={{
        position: 'fixed', inset: 0, zIndex: 200,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        background: 'rgba(8,8,15,0.82)', backdropFilter: 'blur(12px)',
        padding: '24px',
      }}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <motion.div
        className="glass-panel"
        style={{
          borderRadius: 24, padding: '40px 36px',
          width: '100%', maxWidth: 480,
          border: '1px solid rgba(200,164,21,0.25)',
          boxShadow: '0 24px 80px rgba(0,0,0,0.6)',
        }}
        initial={{ scale: 0.88, opacity: 0, y: 20 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        transition={{ type: 'spring', damping: 22, stiffness: 260 }}
      >
        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 28 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
            <div style={{
              width: 44, height: 44, borderRadius: 12,
              background: 'rgba(200,164,21,0.1)',
              border: '1px solid rgba(200,164,21,0.18)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              <Key size={20} color="var(--gold-400)" strokeWidth={2} />
            </div>
            <div>
              <h2 style={{ fontSize: '1.1rem', fontWeight: 700, color: 'rgba(255,255,255,0.95)', marginBottom: 2 }}>
                Gemini API Key
              </h2>
              <p style={{ fontSize: '0.78rem', color: 'rgba(255,255,255,0.38)' }}>
                Required for live courtroom sessions
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            style={{
              width: 32, height: 32, borderRadius: 8,
              background: 'rgba(255,255,255,0)', border: 'none',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              cursor: 'pointer', color: 'rgba(255,255,255,0.35)',
              transition: 'background 0.2s',
            }}
            onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(255,255,255,0.07)'}
            onMouseLeave={(e) => e.currentTarget.style.background = 'rgba(255,255,255,0)'}
          >
            <X size={16} strokeWidth={2} />
          </button>
        </div>

        {/* Input */}
        <div style={{ marginBottom: 16 }}>
          <label style={{ display: 'block', fontSize: '0.82rem', color: 'rgba(255,255,255,0.55)', marginBottom: 8 }}>
            API Key
          </label>
          <div style={{ position: 'relative' }}>
            <input
              id="input-api-key"
              type={showKey ? 'text' : 'password'}
              value={key}
              onChange={(e) => { setKey(e.target.value); setError(''); }}
              placeholder="AIza..."
              style={{
                width: '100%',
                background: 'rgba(8,8,15,0.7)',
                border: `1px solid ${error ? 'rgba(248,113,113,0.4)' : 'rgba(255,255,255,0.09)'}`,
                borderRadius: 12,
                padding: '12px 44px 12px 16px',
                fontSize: '0.87rem',
                color: 'rgba(255,255,255,0.9)',
                fontFamily: 'var(--font-mono)',
                outline: 'none',
                transition: 'border-color 0.2s',
              }}
              onFocus={(e) => e.target.style.borderColor = 'rgba(200,164,21,0.45)'}
              onBlur={(e) => e.target.style.borderColor = error ? 'rgba(248,113,113,0.4)' : 'rgba(255,255,255,0.09)'}
            />
            <button
              onClick={() => setShowKey(!showKey)}
              style={{
                position: 'absolute', right: 14, top: '50%', transform: 'translateY(-50%)',
                background: 'none', border: 'none', cursor: 'pointer',
                color: 'rgba(255,255,255,0.3)', display: 'flex',
              }}
            >
              {showKey ? <EyeOff size={16} /> : <Eye size={16} />}
            </button>
          </div>
          {error && (
            <p style={{ color: '#f87171', fontSize: '0.78rem', marginTop: 6 }}>{error}</p>
          )}
        </div>

        {/* Help text */}
        <p style={{ fontSize: '0.78rem', color: 'rgba(255,255,255,0.3)', lineHeight: 1.6, marginBottom: 24 }}>
          Get your API key from{' '}
          <a
            href="https://aistudio.google.com/apikey"
            target="_blank"
            rel="noreferrer"
            style={{ color: 'rgba(200,164,21,0.7)', textDecoration: 'underline' }}
          >
            Google AI Studio
          </a>
          . Your key is stored locally in your browser only.
        </p>

        {/* Save button */}
        <button
          id="btn-save-api-key"
          onClick={handleSave}
          className="btn-gold"
          style={{ width: '100%', justifyContent: 'center', borderRadius: 12, padding: '13px 24px' }}
        >
          Save &amp; Continue
        </button>
      </motion.div>
    </motion.div>
  );
}
