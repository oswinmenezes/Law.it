import { motion } from 'framer-motion';
import { Trophy, ArrowLeft, RotateCcw, TrendingUp, TrendingDown, Lightbulb, Scale, ChevronRight } from 'lucide-react';
import useCourtStore from '../store/useCourtStore';

const criteriaLabels = {
  legal_reasoning: 'Legal Reasoning',
  responsiveness: 'Responsiveness',
  clarity: 'Clarity',
  courtroom_handling: 'Courtroom Handling',
  procedural_correctness: 'Procedural Correctness',
  consistency: 'Consistency',
  issue_prioritization: 'Issue Prioritization',
  pressure_management: 'Pressure Management',
};

function ScoreBar({ label, score, comment, delay = 0 }) {
  const getColor = (s) => {
    if (s >= 8) return '#22c55e';
    if (s >= 6) return '#eab308';
    if (s >= 4) return '#f97316';
    return '#ef4444';
  };
  const color = getColor(score);

  return (
    <motion.div
      className="space-y-1.5"
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay }}
    >
      <div className="flex items-center justify-between">
        <span className="text-sm text-white/70">{label}</span>
        <span className="text-sm font-bold font-[family-name:var(--font-mono)]" style={{ color }}>
          {score}/10
        </span>
      </div>
      <div className="h-2 bg-court-panel rounded-full overflow-hidden border border-court-border">
        <motion.div
          className="h-full rounded-full"
          style={{ background: `linear-gradient(90deg, ${color}80, ${color})` }}
          initial={{ width: 0 }}
          animate={{ width: `${(score / 10) * 100}%` }}
          transition={{ delay: delay + 0.2, duration: 0.8, ease: 'easeOut' }}
        />
      </div>
      {comment && (
        <p className="text-xs text-white/30 pl-1">{comment}</p>
      )}
    </motion.div>
  );
}

export default function ScoreCard() {
  const { scores, caseData, setPage, resetSession } = useCourtStore();

  if (!scores) {
    return (
      <div className="h-full w-full flex items-center justify-center bg-court-black">
        <div className="text-center">
          <Scale className="w-12 h-12 text-gold-400/30 mx-auto mb-4 animate-spin" />
          <p className="text-white/40">Generating evaluation...</p>
        </div>
      </div>
    );
  }

  const overallScore = scores.overall_score || 0;
  const getGrade = (s) => {
    if (s >= 90) return { grade: 'A+', color: '#22c55e', label: 'Outstanding' };
    if (s >= 80) return { grade: 'A', color: '#22c55e', label: 'Excellent' };
    if (s >= 70) return { grade: 'B+', color: '#eab308', label: 'Good' };
    if (s >= 60) return { grade: 'B', color: '#eab308', label: 'Above Average' };
    if (s >= 50) return { grade: 'C', color: '#f97316', label: 'Average' };
    if (s >= 40) return { grade: 'D', color: '#f97316', label: 'Below Average' };
    return { grade: 'F', color: '#ef4444', label: 'Needs Improvement' };
  };
  const { grade, color, label } = getGrade(overallScore);

  return (
    <motion.div
      className="h-full w-full overflow-y-auto bg-court-black"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
    >
      <div className="max-w-3xl mx-auto px-8 sm:px-10 py-12 sm:py-16">
        {/* Header */}
        <motion.div
          className="text-center mb-12"
          initial={{ y: -20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
        >
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-gold-400/20 to-gold-600/10 flex items-center justify-center mx-auto mb-4 border border-gold-400/20">
            <Trophy className="w-8 h-8 text-gold-400" />
          </div>
          <h1 className="text-3xl font-bold font-[family-name:var(--font-display)] text-white mb-1">
            Performance <span className="gold-gradient-text">Report</span>
          </h1>
          <p className="text-sm text-white/40">{caseData?.case_title || 'General Matter'}</p>
        </motion.div>

        {/* Overall Score */}
        <motion.div
          className="glass-panel rounded-2xl p-10 mb-8 text-center"
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ delay: 0.2 }}
        >
          <div className="relative inline-block mb-4">
            <svg className="w-32 h-32 -rotate-90" viewBox="0 0 100 100">
              <circle cx="50" cy="50" r="42" fill="none" stroke="rgba(255,255,255,0.05)" strokeWidth="6" />
              <motion.circle
                cx="50" cy="50" r="42" fill="none"
                stroke={color}
                strokeWidth="6"
                strokeLinecap="round"
                strokeDasharray={`${(overallScore / 100) * 264} 264`}
                initial={{ strokeDasharray: '0 264' }}
                animate={{ strokeDasharray: `${(overallScore / 100) * 264} 264` }}
                transition={{ delay: 0.5, duration: 1.5, ease: 'easeOut' }}
              />
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <motion.span
                className="text-3xl font-bold font-[family-name:var(--font-mono)]"
                style={{ color }}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 1 }}
              >
                {overallScore}
              </motion.span>
              <span className="text-xs text-white/30">/ 100</span>
            </div>
          </div>
          <div className="text-2xl font-bold mb-1" style={{ color }}>{grade}</div>
          <div className="text-sm text-white/50">{label}</div>
        </motion.div>

        {/* Criteria Scores */}
        <motion.div
          className="glass-panel rounded-2xl p-8 mb-8 space-y-5"
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.4 }}
        >
          <h2 className="text-sm font-bold text-white/60 uppercase tracking-wider mb-4">Detailed Scores</h2>
          {Object.entries(criteriaLabels).map(([key, lbl], i) => {
            const c = scores.criteria?.[key];
            return (
              <ScoreBar
                key={key}
                label={lbl}
                score={c?.score || 0}
                comment={c?.comment || ''}
                delay={0.5 + i * 0.08}
              />
            );
          })}
        </motion.div>

        {/* Strengths, Weaknesses, Improvements */}
        <div className="grid md:grid-cols-3 gap-5 mb-8">
          <motion.div
            className="glass-panel rounded-xl p-6"
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.8 }}
          >
            <div className="flex items-center gap-2 mb-3">
              <TrendingUp className="w-4 h-4 text-emerald-400" />
              <h3 className="text-sm font-semibold text-emerald-400">Strengths</h3>
            </div>
            <ul className="space-y-2">
              {(scores.strengths || []).map((s, i) => (
                <li key={i} className="text-xs text-white/50 flex items-start gap-2">
                  <span className="text-emerald-400 mt-0.5">•</span>{s}
                </li>
              ))}
            </ul>
          </motion.div>

          <motion.div
            className="glass-panel rounded-xl p-6"
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.9 }}
          >
            <div className="flex items-center gap-2 mb-3">
              <TrendingDown className="w-4 h-4 text-red-400" />
              <h3 className="text-sm font-semibold text-red-400">Weaknesses</h3>
            </div>
            <ul className="space-y-2">
              {(scores.weaknesses || []).map((w, i) => (
                <li key={i} className="text-xs text-white/50 flex items-start gap-2">
                  <span className="text-red-400 mt-0.5">•</span>{w}
                </li>
              ))}
            </ul>
          </motion.div>

          <motion.div
            className="glass-panel rounded-xl p-6"
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 1.0 }}
          >
            <div className="flex items-center gap-2 mb-3">
              <Lightbulb className="w-4 h-4 text-gold-400" />
              <h3 className="text-sm font-semibold text-gold-400">Improvements</h3>
            </div>
            <ul className="space-y-2">
              {(scores.improvements || []).map((im, i) => (
                <li key={i} className="text-xs text-white/50 flex items-start gap-2">
                  <span className="text-gold-400 mt-0.5">•</span>{im}
                </li>
              ))}
            </ul>
          </motion.div>
        </div>

        {/* Judicial Verdict */}
        {scores.judicial_verdict && (
          <motion.div
            className="glass-panel rounded-xl p-7 mb-10 border-gold-400/20"
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 1.1 }}
          >
            <p className="text-sm text-white/60 italic leading-relaxed">
              "{scores.judicial_verdict}"
            </p>
            <p className="text-xs text-gold-400/50 mt-2">— Judicial Observation</p>
          </motion.div>
        )}

        {/* Actions */}
        <motion.div
          className="flex items-center justify-center gap-5 pb-12"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1.3 }}
        >
          <button
            id="btn-back-to-cases"
            onClick={() => { resetSession(); setPage('setup'); }}
            className="flex items-center gap-2 px-6 py-3 rounded-xl bg-court-panel border border-court-border text-white/60 text-sm hover:border-gold-400/30 transition-all cursor-pointer"
          >
            <ArrowLeft className="w-4 h-4" />
            New Case
          </button>
          <button
            id="btn-retry-case"
            onClick={() => { resetSession(); setPage('courtroom'); }}
            className="flex items-center gap-2 px-6 py-3 rounded-xl bg-gradient-to-r from-gold-400 to-gold-500 text-court-black text-sm font-semibold hover:shadow-lg hover:shadow-gold-400/20 transition-all cursor-pointer"
          >
            <RotateCcw className="w-4 h-4" />
            Retry Case
          </button>
        </motion.div>
      </div>
    </motion.div>
  );
}
