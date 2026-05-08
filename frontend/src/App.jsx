import { useState, useCallback, useEffect, useRef } from 'react';
import ReactMarkdown from 'react-markdown';
import * as pdfjsLib from 'pdfjs-dist/build/pdf.mjs';

// PDF.js Worker Configuration
const PDFJS_VERSION = '5.6.205';
pdfjsLib.GlobalWorkerOptions.workerSrc = `https://unpkg.com/pdfjs-dist@${PDFJS_VERSION}/build/pdf.worker.min.mjs`;
import Header from './components/Header';
import UploadZone from './components/UploadZone';
import ResultsPanel from './components/ResultsPanel';
import ScanHistory from './components/ScanHistory';
import ApiKeyModal from './components/ApiKeyModal';
import Toast, { useToasts } from './components/Toast';
import { performOCR, summarizeText } from './api/ocr';

const STORAGE_KEY_API = 'ocr_scanner_api_key';
const STORAGE_KEY_HISTORY = 'ocr_scanner_history';
const MAX_HISTORY = 20;

function loadHistory() {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY_HISTORY)) || [];
  } catch {
    return [];
  }
}

function saveHistory(history) {
  try {
    localStorage.setItem(STORAGE_KEY_HISTORY, JSON.stringify(history.slice(0, MAX_HISTORY)));
  } catch {
    // localStorage might be full
  }
}

function createThumbnail(dataUrl) {
  return resizeImage(dataUrl, 104, 104, 0.6);
}

function resizeImage(dataUrl, maxWidth, maxHeight, quality = 0.8) {
  return new Promise((resolve) => {
    const img = new Image();
    img.onload = () => {
      let width = img.width;
      let height = img.height;

      if (width > maxWidth || height > maxHeight) {
        if (width > height) {
          height *= maxWidth / width;
          width = maxWidth;
        } else {
          width *= maxHeight / height;
          height = maxHeight;
        }
      }

      const canvas = document.createElement('canvas');
      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext('2d');
      ctx.drawImage(img, 0, 0, width, height);
      resolve(canvas.toDataURL('image/jpeg', quality));
    };
    img.onerror = () => resolve(dataUrl);
    img.src = dataUrl;
  });
}

export default function App() {
  const [apiKeys] = useState(() => {
    const keys = import.meta.env.VITE_OPENROUTER_API_KEYS || import.meta.env.VITE_OPENROUTER_API_KEY || '';
    return keys.split(',').map(k => k.trim()).filter(Boolean);
  });
  
  // Workspace state
  const [history, setHistory] = useState(loadHistory());
  const [activeDocId, setActiveDocId] = useState(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [processingPage, setProcessingPage] = useState(null);
  const [activeTab, setActiveTab] = useState('analysis'); // 'analysis' or 'text'
  const [promptKey, setPromptKey] = useState('default');
  const [showViewer, setShowViewer] = useState(true);

  const { toasts, addToast, removeToast } = useToasts();
  const fileInputRef = useRef(null);

  const activeDoc = history.find(d => d.id === activeDocId) || null;

  useEffect(() => {
    // API key is now set internally
  }, []);


  const handleUpload = useCallback(async (base64, info, error) => {
    if (error) { addToast(error, 'error'); return; }

    const newDocId = Date.now();
    const newDoc = {
      id: newDocId,
      name: info.name,
      image: info.dataUrl,
      info: info,
      status: 'pending', // Waiting for user to click "Scan"
      timestamp: Date.now()
    };

    setHistory(prev => [newDoc, ...prev]);
    setActiveDocId(newDocId);
    saveHistory([newDoc, ...history]);
  }, [history, addToast]);

  const handleScan = useCallback(async () => {
    if (!activeDoc || activeDoc.status !== 'pending') return;

    setIsProcessing(true);
    setHistory(prev => prev.map(d => d.id === activeDoc.id ? { ...d, status: 'processing' } : d));

    try {
      const pagesToProcess = activeDoc.info.pages || [activeDoc.image];
      let fullText = '';
      
      for (let i = 0; i < pagesToProcess.length; i++) {
        setProcessingPage(i + 1);
        const optimized = await resizeImage(pagesToProcess[i], 2048, 2048, 0.8);
        const result = await performOCR(apiKeys, optimized.split(',')[1], 'image/jpeg', promptKey);
        if (result.error) throw new Error(result.error);
        fullText += (i > 0 ? `\n\n--- Page ${i + 1} ---\n\n` : '') + result.text;
      }

      setProcessingPage(pagesToProcess.length + 1);
      // Stage 2: Summarization
      const summary = await summarizeText(apiKeys, fullText);
      
      const updatedDoc = {
        ...activeDoc,
        status: 'complete',
        text: fullText,
        analysis: summary.error ? `### ⚠️ ANALYSIS PARTIALLY FAILED

**Reason:** ${summary.error}

**How to resolve:**
1. **Global Cap:** If you see "free-models-per-day", your OpenRouter account hit its daily free limit.
2. **Add Credits:** Adding $5 to your OpenRouter account usually unlocks 1000+ free requests/day.
3. **Multi-Account:** Add keys from *different* accounts to your \`.env\` file.

The document text was still extracted successfully—you can view it in the **EXTRACTED TEXT** tab.` : summary.text,
        model: summary.model || 'N/A'
      };

      setProcessingPage(Infinity);
      await new Promise(resolve => setTimeout(resolve, 1000));

      setHistory(prev => {
        const newHistory = prev.map(d => d.id === activeDoc.id ? updatedDoc : d);
        saveHistory(newHistory);
        return newHistory;
      });
      
      setActiveTab('analysis'); // Auto-switch to analysis tab
      addToast('Document scanned successfully', 'success');
    } catch (err) {
      addToast(err.message, 'error');
      setHistory(prev => prev.map(d => d.id === activeDoc.id ? { ...d, status: 'pending' } : d));
    } finally {
      setIsProcessing(false);
      setProcessingPage(null);
    }
  }, [activeDoc, apiKeys, promptKey, history, addToast]);

  const handleRetryAnalysis = useCallback(async () => {
    if (!activeDoc || !activeDoc.text) return;
    setIsProcessing(true);
    setProcessingPage(activeDoc.info.pages?.length + 1 || 2);
    
    try {
      const summary = await summarizeText(apiKeys, activeDoc.text);
      const updatedDoc = {
        ...activeDoc,
        analysis: summary.error ? `### ⚠️ ANALYSIS PARTIALLY FAILED

**Reason:** ${summary.error}

**How to resolve:**
1. **Global Cap:** If you see "free-models-per-day", your OpenRouter account hit its daily free limit.
2. **Add Credits:** Adding $5 to your OpenRouter account usually unlocks 1000+ free requests/day.
3. **Multi-Account:** Add keys from *different* accounts to your \`.env\` file.

The document text was still extracted successfully—you can view it in the **EXTRACTED TEXT** tab.` : summary.text,
        model: summary.model || 'N/A'
      };
      
      setProcessingPage(Infinity);
      await new Promise(r => setTimeout(r, 800));
      setHistory(prev => {
        const newHistory = prev.map(d => d.id === activeDoc.id ? updatedDoc : d);
        saveHistory(newHistory);
        return newHistory;
      });
    } catch (err) {
      addToast(`Retry failed: ${err.message}`, 'error');
    } finally {
      setIsProcessing(false);
      setProcessingPage(null);
    }
  }, [activeDoc, apiKeys, addToast]);

  const handleDeleteDoc = useCallback((id) => {
    const newHistory = history.filter(d => d.id !== id);
    setHistory(newHistory);
    saveHistory(newHistory);
    if (activeDocId === id) setActiveDocId(newHistory[0]?.id || null);
    addToast('Document removed', 'success');
  }, [history, activeDocId, addToast]);

  return (
    <div className="app-container">
      <aside className="sidebar">
        <div className="sidebar-header">
          <h1 className="logo-text">Law<span>.it</span></h1>
          <div className="sidebar-badge">Workspace</div>
        </div>

        <div className="sidebar-actions" style={{ padding: '0 16px 24px' }}>
          <button className="btn-primary-sidebar" onClick={() => fileInputRef.current?.click()}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><line x1="12" y1="5" x2="12" y2="19"></line><line x1="5" y1="12" x2="19" y2="12"></line></svg>
            New Analysis
          </button>
        </div>

        <div className="sidebar-content">
          <div style={{ fontSize: '10px', fontWeight: '900', color: 'var(--text-muted)', marginBottom: '16px', letterSpacing: '0.15em', padding: '0 8px' }}>RECENT DOCUMENTS</div>
          {history.map(doc => (
            <div 
              key={doc.id} 
              className={`sidebar-item ${activeDocId === doc.id ? 'active' : ''}`}
              onClick={() => setActiveDocId(doc.id)}
            >
              <div className="doc-icon">
                {doc.info.type === 'application/pdf' ? (
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path><polyline points="14 2 14 8 20 8"></polyline><line x1="16" y1="13" x2="8" y2="13"></line><line x1="16" y1="17" x2="8" y2="17"></line><polyline points="10 9 9 9 8 9"></polyline></svg>
                ) : (
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect><circle cx="8.5" cy="8.5" r="1.5"></circle><polyline points="21 15 16 10 5 21"></polyline></svg>
                )}
              </div>
              <div className="doc-info">
                <div className="doc-name">{doc.name}</div>
                <div className="doc-meta">{new Date(doc.id).toLocaleDateString([], { month: 'short', day: 'numeric' })}</div>
              </div>
              {doc.status === 'processing' && <div className="pulse-indicator" />}
            </div>
          ))}
        </div>
      </aside>

      {/* ── Main Workspace ── */}
      <main className="workspace">
        <div className="workspace-header">
          <div style={{ fontSize: '14px', fontWeight: '700' }}>{activeDoc?.name || 'No document selected'}</div>
          <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
             <select 
              className="select-premium" 
              value={promptKey}
              onChange={(e) => setPromptKey(e.target.value)}
            >
              <option value="default">Legal Standard</option>
              <option value="table">Data Extraction</option>
              <option value="handwriting">Handwriting</option>
            </select>
            
            <div style={{ width: '1px', height: '20px', background: 'var(--border-subtle)' }} />
            
            <button 
              className={`panel-tab ${!showViewer ? 'active' : ''}`}
              style={{ border: 'none', background: 'transparent', padding: '0 12px', display: 'flex', alignItems: 'center', gap: '8px', height: 'auto' }}
              onClick={() => setShowViewer(!showViewer)}
            >
              {showViewer ? (
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path><circle cx="12" cy="12" r="3"></circle></svg>
              ) : (
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"></path><line x1="1" y1="1" x2="23" y2="23"></line></svg>
              )}
              {showViewer ? 'Focus Mode' : 'Split View'}
            </button>
          </div>
        </div>

        <div className={`workspace-content ${!showViewer ? 'viewer-hidden' : ''}`}>
          {!activeDoc ? (
            <div className="empty-workspace" style={{ flex: 1 }}>
              <div className="upload-trigger" onClick={() => fileInputRef.current?.click()}>
                <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path><polyline points="17 8 12 3 7 8"></polyline><line x1="12" y1="3" x2="12" y2="15"></line></svg>
                <div style={{ marginTop: '20px', fontWeight: '600' }}>Select Document to Start</div>
                <div style={{ marginTop: '8px', fontSize: '13px', opacity: 0.5 }}>PDF or Images supported</div>
              </div>
            </div>
          ) : (
            <>
              <div className="viewer-panel">
                <div className="viewer-scroll-area">
                  <img src={activeDoc.image} alt="Original" className="document-canvas" />
                  
                  {!isProcessing && activeDoc.status === 'pending' && (
                    <div className="viewer-actions">
                      <button className="btn-action" style={{ flex: 1 }} onClick={handleScan}>
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83"></path></svg>
                        Scan Document
                      </button>
                      <button className="btn-destructive" onClick={() => handleDeleteDoc(activeDoc.id)}>
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M3 6h18"></path><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path></svg>
                      </button>
                    </div>
                  )}
                </div>
              </div>
              <div className="analysis-panel">
                <div className="panel-tabs">
                  <button className={`panel-tab ${activeTab === 'analysis' ? 'active' : ''}`} onClick={() => setActiveTab('analysis')}>LEGAL ABSTRACT</button>
                  <button className={`panel-tab ${activeTab === 'text' ? 'active' : ''}`} onClick={() => setActiveTab('text')}>EXTRACTED TEXT</button>
                </div>
                <div className="panel-content">
                  {activeDoc.status === 'pending' ? (
                    <div className="empty-state" style={{ height: '100%' }}>
                      <div className="doc-icon" style={{ width: '64px', height: '64px', marginBottom: '24px', background: 'rgba(251, 191, 36, 0.05)', color: 'var(--accent-primary)' }}>
                        <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path><polyline points="14 2 14 8 20 8"></polyline><line x1="16" y1="13" x2="8" y2="13"></line><line x1="16" y1="17" x2="8" y2="17"></line><polyline points="10 9 9 9 8 9"></polyline></svg>
                      </div>
                      <h2 style={{ fontSize: '20px', fontWeight: '800', marginBottom: '12px' }}>Document Ready</h2>
                      <p style={{ color: 'var(--text-secondary)', maxWidth: '320px', textAlign: 'center', lineHeight: '1.6' }}>
                        Click <strong>Scan Document</strong> in the viewer panel to begin the AI extraction and legal analysis.
                      </p>
                    </div>
                  ) : activeDoc.status === 'processing' ? (
                    <div className="empty-state" style={{ height: '100%', flex: 1 }}>
                      <div className="status-badge" style={{ marginBottom: '16px' }}>
                        {processingPage === Infinity ? 'Analysis Completed' : 'Loading...'}
                      </div>
                      
                      <h2 style={{ fontSize: '24px', fontWeight: '800', marginBottom: '8px' }}>
                        {processingPage === Infinity ? '100% Complete' : `${Math.min(99, Math.round((processingPage / ((activeDoc.info.pages?.length || 1) + 1)) * 100))}% Complete`}
                      </h2>
                      
                      <p style={{ color: 'var(--text-secondary)', marginBottom: '32px' }}>
                        {processingPage <= (activeDoc.info.pages?.length || 1) 
                          ? (activeDoc.info.pages?.length > 1 
                              ? `Analyzing Page ${processingPage} of ${activeDoc.info.pages?.length}...` 
                              : 'Analyzing Document...') 
                          : 'Drafting Legal Abstract...'}
                      </p>

                      <div className="progress-container">
                        <div 
                          className="progress-bar" 
                          style={{ width: `${processingPage === Infinity ? 100 : Math.min(99, (processingPage / ((activeDoc.info.pages?.length || 1) + 1)) * 100)}%` }} 
                        />
                      </div>
                      
                      <button 
                        className="panel-tab" 
                        style={{ border: '1px solid var(--border-subtle)', borderRadius: 'var(--radius-sm)', padding: '8px 16px', fontSize: '11px', marginTop: '24px' }}
                        onClick={() => {
                          setIsProcessing(false);
                          setProcessingPage(null);
                          setHistory(prev => prev.map(d => d.id === activeDoc.id ? { ...d, status: 'pending' } : d));
                        }}
                      >
                        ABORT PROCESSING
                      </button>
                    </div>
                  ) : activeTab === 'analysis' ? (
                    <div className="markdown-body">
                      <ReactMarkdown>{activeDoc.analysis}</ReactMarkdown>
                      {activeDoc.analysis?.includes('PARTIALLY FAILED') && (
                        <div style={{ marginTop: '40px', display: 'flex', justifyContent: 'center' }}>
                           <button className="btn-primary-sidebar" style={{ maxWidth: '240px' }} onClick={handleRetryAnalysis}>
                            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M23 4v6h-6"></path><path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10"></path></svg>
                            Retry AI Analysis
                          </button>
                        </div>
                      )}
                    </div>
                  ) : (
                    <div style={{ fontFamily: 'JetBrains Mono', fontSize: '13px', whiteSpace: 'pre-wrap', lineHeight: 1.7 }}>
                      {activeDoc.text}
                    </div>
                  )}
                </div>
              </div>
            </>
          )}
        </div>

      </main>

      <input 
        ref={fileInputRef} 
        type="file" 
        style={{ display: 'none' }} 
        accept="image/*,application/pdf"
        onChange={async (e) => {
          const file = e.target.files[0];
          if (!file) return;
          if (file.type === 'application/pdf') {
            const buffer = await file.arrayBuffer();
            const pdf = await pdfjsLib.getDocument({ data: buffer }).promise;
            const imgs = [];
            for (let i = 1; i <= pdf.numPages; i++) {
              const p = await pdf.getPage(i);
              const v = p.getViewport({ scale: 2 });
              const c = document.createElement('canvas');
              const ctx = c.getContext('2d');
              c.height = v.height; c.width = v.width;
              await p.render({ canvasContext: ctx, viewport: v }).promise;
              imgs.push(c.toDataURL('image/png'));
            }
            handleUpload(imgs[0].split(',')[1], { name: file.name, size: file.size, type: file.type, dataUrl: imgs[0], pages: imgs });
          } else {
            const r = new FileReader();
            r.onload = (ev) => handleUpload(ev.target.result.split(',')[1], { name: file.name, size: file.size, type: file.type, dataUrl: ev.target.result });
            r.readAsDataURL(file);
          }
          e.target.value = '';
        }}
      />

      <Toast toasts={toasts} removeToast={removeToast} />
    </div>
  );
}
