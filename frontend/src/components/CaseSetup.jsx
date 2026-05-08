import { useState, useCallback } from 'react';
import { motion } from 'framer-motion';
import { Upload, FileText, Scale, ArrowLeft, Loader2, ChevronRight, Gavel, AlertTriangle, Star } from 'lucide-react';
import useCourtStore from '../store/useCourtStore';
import { parseFile, extractCaseStructure } from '../lib/fileParser';
import prebuiltCases from '../lib/prebuiltCases';
import ParticleBackground from './ParticleBackground';
import ApiKeyModal from './ApiKeyModal';

const difficultyColors = {
  Medium: 'text-yellow-400 bg-yellow-400/10 border-yellow-400/20',
  Hard: 'text-orange-400 bg-orange-400/10 border-orange-400/20',
  Expert: 'text-red-400 bg-red-400/10 border-red-400/20',
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
    const file = e.dataTransfer.files[0];
    handleFileUpload(file);
  }, [handleFileUpload]);

  const selectPrebuilt = (caseItem) => {
    setCaseData(caseItem);
    proceedToCourtroom();
  };

  const proceedToCourtroom = () => {
    if (!apiKey) {
      setShowApiModal(true);
      return;
    }
    setPage('courtroom');
  };

  return (
    <motion.div
      className="h-full w-full relative overflow-y-auto"
      initial={{ opacity: 0, x: 50 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -50 }}
      transition={{ duration: 0.4 }}
    >
      <ParticleBackground />
      <div className="absolute inset-0 bg-gradient-to-b from-court-black/90 via-court-black/70 to-court-black/90 z-[1]" />

      <div className="relative z-10 max-w-4xl mx-auto px-6 py-10">
        {/* Header */}
        <div className="flex items-center gap-4 mb-10">
          <button
            onClick={() => setPage('landing')}
            className="w-10 h-10 rounded-xl bg-court-panel border border-court-border hover:border-gold-400/30 flex items-center justify-center transition-all cursor-pointer"
          >
            <ArrowLeft className="w-4 h-4 text-white/60" />
          </button>
          <div>
            <h1 className="text-2xl font-bold text-white font-[family-name:var(--font-display)]">
              Prepare Your <span className="gold-gradient-text">Case</span>
            </h1>
            <p className="text-sm text-white/40 mt-1">Upload a case file or select a prebuilt scenario</p>
          </div>
        </div>

        {/* Upload Zone */}
        <motion.div
          className={`glass-panel rounded-2xl p-8 mb-8 border-2 border-dashed transition-all duration-300 cursor-pointer ${
            dragOver ? 'border-gold-400/60 bg-gold-400/5' : 'border-court-border hover:border-gold-400/30'
          }`}
          onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
          onDragLeave={() => setDragOver(false)}
          onDrop={handleDrop}
          onClick={() => {
            if (!isUploading) document.getElementById('file-input').click();
          }}
          whileHover={{ y: -2 }}
        >
          <input
            id="file-input"
            type="file"
            accept=".pdf,.docx,.txt"
            className="hidden"
            onChange={(e) => handleFileUpload(e.target.files[0])}
          />

          <div className="text-center">
            {isUploading ? (
              <Loader2 className="w-10 h-10 text-gold-400 mx-auto mb-3 animate-spin" />
            ) : (
              <Upload className="w-10 h-10 text-gold-400/60 mx-auto mb-3" />
            )}
            <h3 className="text-lg font-semibold text-white/80 mb-1">
              {isUploading ? 'Parsing case file...' : 'Upload Case Document'}
            </h3>
            <p className="text-sm text-white/30">
              Drag & drop or click to upload — PDF, DOCX, or TXT
            </p>
            {uploadError && (
              <div className="mt-3 flex items-center justify-center gap-2 text-red-400 text-sm">
                <AlertTriangle className="w-4 h-4" />
                {uploadError}
              </div>
            )}
          </div>
        </motion.div>

        {/* Divider */}
        <div className="flex items-center gap-4 mb-8">
          <div className="flex-1 h-px bg-court-border" />
          <span className="text-xs text-white/30 uppercase tracking-widest">or select a scenario</span>
          <div className="flex-1 h-px bg-court-border" />
        </div>

        {/* Prebuilt Cases */}
        <div className="grid gap-4">
          {prebuiltCases.map((c, i) => (
            <motion.div
              key={c.id}
              className="glass-panel rounded-xl p-6 hover:border-gold-400/30 transition-all group cursor-pointer"
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.1 * i }}
              whileHover={{ y: -2 }}
              onClick={() => selectPrebuilt(c)}
            >
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <Gavel className="w-5 h-5 text-gold-400/70" />
                    <h3 className="text-base font-semibold text-white/90 group-hover:text-gold-300 transition-colors">
                      {c.case_title}
                    </h3>
                  </div>
                  <p className="text-sm text-white/40 mb-3 ml-8">{c.description}</p>
                  <div className="flex items-center gap-3 ml-8">
                    <span className="text-xs text-white/30 flex items-center gap-1">
                      <Scale className="w-3 h-3" />
                      {c.court_type}
                    </span>
                    <span className={`text-xs px-2 py-0.5 rounded-full border ${difficultyColors[c.difficulty]}`}>
                      {c.difficulty}
                    </span>
                    <span className="text-xs text-white/20">
                      {c.legal_issues.length} issues
                    </span>
                  </div>
                </div>
                <ChevronRight className="w-5 h-5 text-white/20 group-hover:text-gold-400 group-hover:translate-x-1 transition-all mt-1" />
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
