export default function ScanHistory({ history, onSelect, onClear }) {
  if (!history || history.length === 0) {
    return (
      <section className="history-section">
        <div className="history-header">
          <h2 className="history-title">Recent Scans</h2>
        </div>
        <div className="history-empty glass-card">
          No previous scans found
        </div>
      </section>
    );
  }

  const formatTime = (timestamp) => {
    const d = new Date(timestamp);
    const now = new Date();
    const diff = now - d;

    if (diff < 60000) return 'Just now';
    if (diff < 3600000) return `${Math.floor(diff / 60000)}m ago`;
    if (diff < 86400000) return `${Math.floor(diff / 3600000)}h ago`;
    return d.toLocaleDateString();
  };

  return (
    <section className="history-section">
      <div className="history-header">
        <h2 className="history-title">Recent Scans ({history.length})</h2>
        <button className="btn btn-ghost btn-sm" onClick={onClear} id="clear-history-button">
          Clear All
        </button>
      </div>
      <div className="history-list">
        {history.map((item, i) => (
          <div
            key={item.timestamp}
            className="history-item"
            onClick={() => onSelect(item)}
            role="button"
            tabIndex={0}
            id={`history-item-${i}`}
          >
            <img
              src={item.thumbnail}
              alt="Scan thumbnail"
              className="history-thumb"
              loading="lazy"
            />
            <div className="history-info">
              <div className="history-text-preview">
                {item.text.substring(0, 80) || '[Empty result]'}
              </div>
              <div className="history-meta">
                {formatTime(item.timestamp)} · {item.text.split(/\s+/).filter(Boolean).length} words
              </div>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
