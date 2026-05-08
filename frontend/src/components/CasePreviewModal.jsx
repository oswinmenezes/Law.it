import { motion } from 'framer-motion';
import { X, Scale, Gavel, ChevronRight, User } from 'lucide-react';

export default function CasePreviewModal({ caseData, onClose, onSelect }) {
  if (!caseData) return null;

  return (
    <motion.div
      style={{
        position: 'fixed', inset: 0, zIndex: 200,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        background: 'rgba(8,8,15,0.85)', backdropFilter: 'blur(12px)',
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
          borderRadius: 24, padding: '0',
          width: '100%', maxWidth: 700, maxHeight: '90vh',
          display: 'flex', flexDirection: 'column',
          border: '1px solid rgba(200,164,21,0.25)',
          boxShadow: '0 24px 80px rgba(0,0,0,0.6)',
          overflow: 'hidden',
        }}
        initial={{ scale: 0.95, opacity: 0, y: 20 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        transition={{ type: 'spring', damping: 25, stiffness: 300 }}
      >
        {/* Header (sticky) */}
        <div style={{
          padding: '24px 32px',
          borderBottom: '1px solid rgba(255,255,255,0.05)',
          display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between',
          background: 'rgba(20,20,31,0.6)',
        }}>
          <div style={{ display: 'flex', gap: 16 }}>
            <div style={{
              width: 48, height: 48, borderRadius: 12,
              background: 'rgba(200,164,21,0.1)',
              border: '1px solid rgba(200,164,21,0.18)',
              display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
            }}>
              <Gavel size={24} color="var(--gold-400)" strokeWidth={1.8} />
            </div>
            <div>
              <h2 style={{ fontSize: '1.25rem', fontWeight: 700, color: 'rgba(255,255,255,0.95)', marginBottom: 4 }}>
                {caseData.case_title}
              </h2>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12, fontSize: '0.8rem', color: 'rgba(255,255,255,0.4)' }}>
                <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                  <Scale size={14} /> {caseData.court_type}
                </span>
                <span>•</span>
                <span style={{
                  color: caseData.difficulty === 'Expert' ? '#f87171' : caseData.difficulty === 'Hard' ? '#fb923c' : '#fbbf24',
                  fontWeight: 600,
                }}>
                  {caseData.difficulty} Difficulty
                </span>
              </div>
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
            <X size={18} strokeWidth={2} />
          </button>
        </div>

        {/* Scrollable Body */}
        <div style={{ padding: '32px', overflowY: 'auto', flex: 1 }}>
          <p style={{ fontSize: '0.95rem', color: 'rgba(255,255,255,0.7)', lineHeight: 1.6, marginBottom: 28 }}>
            {caseData.description}
          </p>
          <div style={{
            background: 'rgba(200,164,21,0.08)',
            border: '1px solid rgba(200,164,21,0.2)',
            borderRadius: 12, padding: '16px', marginBottom: 24,
            display: 'flex', alignItems: 'center', gap: 14
          }}>
            <div style={{ background: 'rgba(200,164,21,0.15)', padding: 10, borderRadius: 10 }}>
              <User size={20} color="var(--gold-400)" />
            </div>
            <div>
              <h3 style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--gold-400)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 4 }}>
                Your Role in Court
              </h3>
              <p style={{ fontSize: '0.95rem', color: 'rgba(255,255,255,0.95)' }}>
                You will argue as Counsel for the <span style={{ fontWeight: 600, color: 'var(--gold-300)' }}>{caseData.parties?.petitioner || 'Petitioner'}</span>
              </p>
            </div>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
            {/* Legal Issues */}
            <div>
              <h3 style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--gold-400)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 12 }}>
                Legal Issues
              </h3>
              <ul style={{ listStyleType: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: 8 }}>
                {caseData.legal_issues.map((issue, idx) => (
                  <li key={idx} style={{ display: 'flex', gap: 10, fontSize: '0.9rem', color: 'rgba(255,255,255,0.85)', lineHeight: 1.5 }}>
                    <span style={{ color: 'var(--gold-400)', opacity: 0.5 }}>•</span> {issue}
                  </li>
                ))}
              </ul>
            </div>

            {/* Facts */}
            <div>
              <h3 style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--gold-400)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 12 }}>
                Key Facts
              </h3>
              <ul style={{ listStyleType: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: 8 }}>
                {caseData.facts.slice(0, 5).map((fact, idx) => (
                  <li key={idx} style={{ display: 'flex', gap: 10, fontSize: '0.9rem', color: 'rgba(255,255,255,0.6)', lineHeight: 1.5 }}>
                    <span style={{ color: 'rgba(255,255,255,0.2)' }}>—</span> {fact}
                  </li>
                ))}
                {caseData.facts.length > 5 && (
                  <li style={{ fontSize: '0.85rem', color: 'rgba(255,255,255,0.3)', fontStyle: 'italic', marginTop: 4 }}>
                    + {caseData.facts.length - 5} more facts...
                  </li>
                )}
              </ul>
            </div>
            
            {/* Relief Sought */}
            <div>
              <h3 style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--gold-400)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 12 }}>
                Relief Sought
              </h3>
              <ul style={{ listStyleType: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: 8 }}>
                {caseData.relief_sought.map((relief, idx) => (
                  <li key={idx} style={{ display: 'flex', gap: 10, fontSize: '0.9rem', color: 'rgba(255,255,255,0.6)', lineHeight: 1.5 }}>
                    <span style={{ color: 'rgba(255,255,255,0.2)' }}>—</span> {relief}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div style={{
          padding: '20px 32px',
          borderTop: '1px solid rgba(255,255,255,0.05)',
          display: 'flex', justifyContent: 'flex-end', gap: 12,
          background: 'rgba(20,20,31,0.8)',
        }}>
          <button
            onClick={onClose}
            style={{
              padding: '12px 24px', borderRadius: 12,
              background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)',
              color: 'rgba(255,255,255,0.7)', fontSize: '0.95rem', fontWeight: 500,
              cursor: 'pointer', transition: 'all 0.2s',
            }}
            onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(255,255,255,0.1)'}
            onMouseLeave={(e) => e.currentTarget.style.background = 'rgba(255,255,255,0.05)'}
          >
            Cancel
          </button>
          <button
            onClick={() => onSelect(caseData)}
            className="btn-gold"
            style={{
              padding: '12px 28px', borderRadius: 12,
              fontSize: '0.95rem',
            }}
          >
            Select &amp; Proceed
            <ChevronRight size={16} strokeWidth={2.5} />
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
}
