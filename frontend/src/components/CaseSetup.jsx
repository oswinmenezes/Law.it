import { useState, useCallback } from 'react';
import { motion } from 'framer-motion';
import { Upload, Scale, ArrowLeft, Loader2, ChevronRight, Gavel, AlertTriangle } from 'lucide-react';
import useCourtStore from '../store/useCourtStore';
import { parseFile, extractCaseStructure } from '../lib/fileParser';
import prebuiltCases from '../lib/prebuiltCases';
import ApiKeyModal from './ApiKeyModal';

function diffClass(d) {
  if (d === 'Medium') return 'diff-medium';
  if (d === 'Hard') return 'diff-hard';
  return 'diff-expert';
}

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: (i) => ({
    opacity: 1,
    y: 0,
    transition: { delay: 0.12 + i * 0.08, duration: 0.5, ease: [0.22, 1, 0.36, 1] },
  }),
};

export default function CaseSetup() {
  const { setPage, setCaseData, apiKey } = useCourtStore();
  const [isUploading, setIsUploading] = useState(false);
  const [uploadError, setUploadError] = useState('');
  const [dragOver, setDragOver] = useState(false);
  const [showApiModal, setShowApiModal] = useState(false);

  const handleFileUpload = useCallback(async (file) => {
    if (!file) return;
    const ext = file.name.split('.').pop().toLowerCase();
    if (!['pdf', 'docx', 'txt'].includes(ext)) {
      setUploadError('Supported formats: PDF, DOCX, TXT');
      return;
    }
    setIsUploading(true);
    setUploadError('');
    try {
      const rawText = await parseFile(file);
      if (!rawText || rawText.length < 50) {
        setUploadError('Could not extract sufficient text from the file');
        setIsUploading(false);
        return;
      }
      const caseData = extractCaseStructure(rawText);
      setCaseData(caseData);
      proceedToCourtroom();
    } catch (err) {
      console.error('File parse error:', err);
      setUploadError(`Failed to parse file: ${err.message}`);
    } finally {
      setIsUploading(false);
    }
  }, []);

  const handleDrop = useCallback((e) => {
    e.preventDefault();
    setDragOver(false);
    handleFileUpload(e.dataTransfer.files[0]);
  }, [handleFileUpload]);

  const selectPrebuilt = (caseItem) => {
    setCaseData(caseItem);
    proceedToCourtroom();
  };

  const proceedToCourtroom = () => {
    if (!apiKey) { setShowApiModal(true); return; }
    setPage('courtroom');
  };

  return (
    <motion.div
      className="setup-root"
      initial={{ opacity: 0, x: 40 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -40 }}
      transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
    >
      <div className="setup-bg" />

      <div className="setup-content">
        {/* Header */}
        <motion.div
          className="setup-header"
          initial={{ opacity: 0, y: -16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <button
            className="setup-back-btn"
            onClick={() => setPage('landing')}
            title="Back"
          >
            <ArrowLeft size={20} strokeWidth={2} />
          </button>
          <div>
            <h1 className="setup-title">
              Prepare Your{' '}
              <span className="gold-gradient-text">Case</span>
            </h1>
            <p className="setup-subtitle">Upload a case file or select a prebuilt scenario</p>
          </div>
        </motion.div>

        {/* Upload Zone */}
        <motion.div
          className={`upload-zone${dragOver ? ' dragover' : ''}`}
          onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
          onDragLeave={() => setDragOver(false)}
          onDrop={handleDrop}
          onClick={() => { if (!isUploading) document.getElementById('case-file-input').click(); }}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1, duration: 0.5 }}
        >
          <input
            id="case-file-input"
            type="file"
            accept=".pdf,.docx,.txt"
            style={{ display: 'none' }}
            onChange={(e) => handleFileUpload(e.target.files[0])}
          />

          {isUploading ? (
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 16 }}>
              <Loader2 size={48} color="var(--gold-400)" className="animate-spin" style={{ animation: 'spin 1s linear infinite' }} />
              <p className="upload-title">Parsing case file…</p>
            </div>
          ) : (
            <>
              <div className="upload-icon-wrap">
                <Upload size={30} color="var(--gold-400)" strokeWidth={1.8} />
              </div>
              <p className="upload-title">Upload Case Document</p>
              <p className="upload-hint">Drag & drop or click to upload — PDF, DOCX, or TXT</p>
            </>
          )}

          {uploadError && (
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, color: '#f87171', fontSize: '0.85rem', marginTop: 18 }}>
              <AlertTriangle size={15} />
              {uploadError}
            </div>
          )}
        </motion.div>

        {/* Divider */}
        <motion.div
          className="divider-or"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.2 }}
        >
          <div className="divider-line" />
          <span className="divider-text">or select a scenario</span>
          <div className="divider-line" />
        </motion.div>

        {/* Prebuilt Cases */}
        <div className="case-cards-list">
          {prebuiltCases.map((c, i) => (
            <motion.div
              key={c.id}
              className="case-card"
              custom={i}
              variants={itemVariants}
              initial="hidden"
              animate="visible"
              whileHover={{ y: -3 }}
              onClick={() => selectPrebuilt(c)}
            >
              <div className="case-card-gavel">
                <Gavel size={18} color="var(--gold-400)" strokeWidth={1.8} />
              </div>
              <div className="case-card-body">
                <div className="case-card-title">{c.case_title}</div>
                <div className="case-card-desc">{c.description}</div>
                <div className="case-card-meta">
                  <span className="case-card-court">
                    <Scale size={13} strokeWidth={1.8} />
                    {c.court_type}
                  </span>
                  <span className={`case-card-difficulty ${diffClass(c.difficulty)}`}>
                    {c.difficulty}
                  </span>
                  <span className="case-card-issues">{c.legal_issues.length} issues</span>
                </div>
              </div>
              <div className="case-card-arrow">
                <ChevronRight size={16} strokeWidth={2} />
              </div>
            </motion.div>
          ))}
        </div>
      </div>

      {showApiModal && (
        <ApiKeyModal
          onClose={() => setShowApiModal(false)}
          onSaved={() => {
            setShowApiModal(false);
            setPage('courtroom');
          }}
        />
      )}
    </motion.div>
  );
}

/* spinner keyframe via style tag trick */
if (!document.getElementById('__spin_kf')) {
  const s = document.createElement('style');
  s.id = '__spin_kf';
  s.textContent = '@keyframes spin { to { transform: rotate(360deg); } }';
  document.head.appendChild(s);
}
