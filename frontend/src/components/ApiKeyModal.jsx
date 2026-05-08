import { useState } from 'react';

export default function ApiKeyModal({ onSave, onClose, currentKey }) {
  const [key, setKey] = useState(currentKey || '');

  const handleSubmit = (e) => {
    e.preventDefault();
    const trimmed = key.trim();
    if (!trimmed) return;
    onSave(trimmed);
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        <h2 className="modal-title">API Key Configuration</h2>
        <p className="modal-desc">
          Enter your OpenRouter API key to enable text extraction.
          <br />
          Keys can be generated at{' '}
          <a href="https://openrouter.ai/keys" target="_blank" rel="noopener noreferrer">
            openrouter.ai/keys
          </a>{' '}
          — no credit card needed.
        </p>

        <form onSubmit={handleSubmit}>
          <div className="input-group">
            <label className="input-label" htmlFor="api-key-input">
              OpenRouter API Key
            </label>
            <input
              id="api-key-input"
              type="password"
              className="input-field"
              placeholder="sk-or-v1-..."
              value={key}
              onChange={(e) => setKey(e.target.value)}
              autoFocus
              autoComplete="off"
            />
          </div>

          <div className="modal-actions">
            <button type="button" className="btn btn-ghost" onClick={onClose}>
              Cancel
            </button>
            <button
              type="submit"
              className="btn btn-primary"
              disabled={!key.trim()}
              id="save-key-button"
            >
              Save Configuration
            </button>
          </div>
        </form>

        <p
          className="modal-desc"
          style={{ marginTop: 20, marginBottom: 0, fontSize: 11, opacity: 0.7 }}
        >
          Your key is stored locally in your browser. It is only sent to the OpenRouter API endpoint.
        </p>
      </div>
    </div>
  );
}
