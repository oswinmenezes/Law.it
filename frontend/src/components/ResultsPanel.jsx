import { useState, useCallback } from 'react';
import ReactMarkdown from 'react-markdown';

export default function ResultsPanel({ result, isLoading, onSummarize, summary, isSummarizing, processingPage }) {
  const [copyAnim, setCopyAnim] = useState(false);
  const [activeTab, setActiveTab] = useState('text'); // 'text' or 'summary'

  const handleCopy = useCallback(async () => {
    const textToCopy = activeTab === 'summary' ? summary : result?.text;
    if (!textToCopy) return;
    try {
      await navigator.clipboard.writeText(textToCopy);
      setCopyAnim(true);
      setTimeout(() => setCopyAnim(false), 1400);
    } catch {
      const ta = document.createElement('textarea');
      ta.value = textToCopy;
      document.body.appendChild(ta);
      ta.select();
      document.execCommand('copy');
      document.body.removeChild(ta);
      setCopyAnim(true);
      setTimeout(() => setCopyAnim(false), 1400);
    }
  }, [result, summary, activeTab]);

  const handleDownload = useCallback(() => {
    const textToDownload = activeTab === 'summary' ? summary : result?.text;
    if (!textToDownload) return;
    const blob = new Blob([textToDownload], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `ocr-${activeTab}-${Date.now()}.txt`;
    a.click();
    URL.revokeObjectURL(url);
  }, [result, summary, activeTab]);

  const wordCount = result?.text ? result.text.trim().split(/\s+/).filter(Boolean).length : 0;
  const charCount = result?.text ? result.text.length : 0;

  return (
    <section className="results-card">
      <div className="results-header">
        <div className="results-tabs">
          <button 
            className={`results-tab ${activeTab === 'text' ? 'active' : ''}`}
            onClick={() => setActiveTab('text')}
          >
            Raw Text
          </button>
          <button 
            className={`results-tab ${activeTab === 'summary' ? 'active' : ''}`}
            onClick={() => setActiveTab('summary')}
            disabled={!result?.text}
          >
            Legal Analysis
          </button>
        </div>
        {(result?.text || summary) && (
          <div className="header-actions">
            <button
              className="btn-icon"
              onClick={handleCopy}
              title="Copy"
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path></svg>
            </button>
            <button
              className="btn-icon"
              onClick={handleDownload}
              title="Download"
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v4"></path><polyline points="7 10 12 15 17 10"></polyline><line x1="12" y1="15" x2="12" y2="3"></line></svg>
            </button>
          </div>
        )}
      </div>

      <div className="results-content">
        {isLoading || (activeTab === 'summary' && isSummarizing) ? (
          <div className="empty-state">
            <div className="loading-spinner" style={{ marginBottom: '16px' }} />
            <p>{isSummarizing ? 'Generating Legal Analysis...' : (
              processingPage ? `Processing page ${processingPage}...` : 'Analyzing document...'
            )}</p>
          </div>
        ) : activeTab === 'summary' ? (
          summary ? (
            <div className="summary-content markdown-body">
              <ReactMarkdown>{summary}</ReactMarkdown>
            </div>
          ) : (
            <div className="empty-state">
              <p style={{ marginBottom: '20px' }}>No analysis generated yet</p>
              <button className="btn-primary" style={{ width: 'auto', padding: '0 24px' }} onClick={onSummarize}>
                Generate Legal Analysis
              </button>
            </div>
          )
        ) : result?.text ? (
          <div className="raw-text">
            {result.text}
          </div>
        ) : (
          <div className="empty-state">
            <p>Upload a document to begin extraction</p>
          </div>
        )}
      </div>

      {result?.text && activeTab === 'text' && (
        <div className="results-header" style={{ borderTop: '1px solid var(--border-light)', borderBottom: 'none', background: 'transparent' }}>
          <div className="image-info" style={{ margin: 0 }}>
            <span className="image-info-badge">Words: {wordCount.toLocaleString()}</span>
            <span className="image-info-badge">Chars: {charCount.toLocaleString()}</span>
            {result.model && (
              <span className="image-info-badge">
                AI: {result.model.split('/').pop()}
                {result.isLocal && ' (Local)'}
              </span>
            )}
          </div>
        </div>
      )}
    </section>
  );
}
