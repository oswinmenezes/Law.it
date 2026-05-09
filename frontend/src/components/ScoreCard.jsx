import { motion } from 'framer-motion';
import { Trophy, ArrowLeft, RotateCcw, TrendingUp, TrendingDown, Lightbulb, Scale } from 'lucide-react';
import useCourtStore from '../store/useCourtStore';
import { useEffect, useRef } from 'react';
import { supabase1 } from '../lib/supabase';

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
      className="scorecard-bar-wrap"
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay }}
    >
      <div className="scorecard-bar-header">
        <span className="scorecard-bar-label">{label}</span>
        <span className="scorecard-bar-score" style={{ color }}>
          {score}/10
        </span>
      </div>
      <div className="scorecard-bar-track">
        <motion.div
          className="scorecard-bar-fill"
          style={{ background: `linear-gradient(90deg, ${color}80, ${color})` }}
          initial={{ width: 0 }}
          animate={{ width: `${(score / 10) * 100}%` }}
          transition={{ delay: delay + 0.2, duration: 0.8, ease: 'easeOut' }}
        />
      </div>
      {comment && (
        <p className="scorecard-bar-comment">{comment}</p>
      )}
    </motion.div>
  );
}

export default function ScoreCard() {
  const { scores, caseData, setPage, resetSession, playerId } = useCourtStore();
  const savedScoreRef = useRef(false);

  useEffect(() => {
    async function saveScore() {
      if (!scores || !playerId || savedScoreRef.current) return;
      
      try {
        const payload = {
          player_id: playerId,
          total_score: scores.overall_score || 0,
          knowledge_score: scores.criteria?.legal_reasoning?.score || 0,
          persuasiveness_score: scores.criteria?.courtroom_handling?.score || 0,
          legal_reasoning_score: scores.criteria?.issue_prioritization?.score || 0,
          objection_handling_score: scores.criteria?.pressure_management?.score || 0,
        };
        
        // Supabase might throw if leaderboard_scores doesn't exist
        const { error } = await supabase1.from('leaderboard_scores').insert([payload]);
        if (error && error.code !== 'PGRST205') {
            console.error("Error saving score:", error);
        }
        
        savedScoreRef.current = true;
      } catch (err) {
        // Ignore errors if leaderboard table is missing to prevent crashing
      }
    }
    saveScore();
  }, [scores, playerId]);

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
      className="scorecard-root"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
    >
      <div className="scorecard-content">
        {/* Header */}
        <motion.div
          className="scorecard-header"
          initial={{ y: -20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
        >
          <div className="scorecard-icon-wrap">
            <Trophy className="w-8 h-8 text-gold-400" />
          </div>
          <h1 className="scorecard-title">
            Performance <span className="gold-gradient-text">Report</span>
          </h1>
          <p className="scorecard-subtitle">{caseData?.case_title || 'General Matter'}</p>
        </motion.div>

        {/* Overall Score */}
        <motion.div
          className="glass-panel scorecard-overall"
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ delay: 0.2 }}
        >
          <div className="scorecard-chart-wrap">
            <svg className="scorecard-chart-svg" viewBox="0 0 100 100">
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
            <div className="scorecard-chart-center">
              <motion.span
                className="scorecard-chart-score"
                style={{ color }}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 1 }}
              >
                {overallScore}
              </motion.span>
              <span className="scorecard-chart-max">/ 100</span>
            </div>
          </div>
          <div className="scorecard-grade" style={{ color }}>{grade}</div>
          <div className="scorecard-grade-label">{label}</div>
        </motion.div>

        {/* Criteria Scores */}
        <motion.div
          className="glass-panel scorecard-criteria"
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.4 }}
        >
          <h2 className="scorecard-criteria-title">Detailed Scores</h2>
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
        <div className="scorecard-feedback-grid">
          <motion.div
            className="glass-panel scorecard-feedback-card"
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.8 }}
          >
            <div className="scorecard-feedback-header">
              <TrendingUp className="scorecard-feedback-icon text-emerald-400" />
              <h3 className="scorecard-feedback-title text-emerald-400">Strengths</h3>
            </div>
            <ul className="scorecard-feedback-list">
              {(scores.strengths || []).map((s, i) => (
                <li key={i} className="scorecard-feedback-item">
                  <span className="text-emerald-400 scorecard-feedback-bullet">•</span>{s}
                </li>
              ))}
            </ul>
          </motion.div>

          <motion.div
            className="glass-panel scorecard-feedback-card"
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.9 }}
          >
            <div className="scorecard-feedback-header">
              <TrendingDown className="scorecard-feedback-icon text-red-400" />
              <h3 className="scorecard-feedback-title text-red-400">Weaknesses</h3>
            </div>
            <ul className="scorecard-feedback-list">
              {(scores.weaknesses || []).map((w, i) => (
                <li key={i} className="scorecard-feedback-item">
                  <span className="text-red-400 scorecard-feedback-bullet">•</span>{w}
                </li>
              ))}
            </ul>
          </motion.div>

          <motion.div
            className="glass-panel scorecard-feedback-card"
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 1.0 }}
          >
            <div className="scorecard-feedback-header">
              <Lightbulb className="scorecard-feedback-icon text-gold-400" />
              <h3 className="scorecard-feedback-title text-gold-400">Improvements</h3>
            </div>
            <ul className="scorecard-feedback-list">
              {(scores.improvements || []).map((im, i) => (
                <li key={i} className="scorecard-feedback-item">
                  <span className="text-gold-400 scorecard-feedback-bullet">•</span>{im}
                </li>
              ))}
            </ul>
          </motion.div>
        </div>

        {/* Judicial Verdict */}
        {scores.judicial_verdict && (
          <motion.div
            className="glass-panel scorecard-verdict"
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 1.1 }}
          >
            <p className="scorecard-verdict-text">
              "{scores.judicial_verdict}"
            </p>
            <p className="scorecard-verdict-author">— Judicial Observation</p>
          </motion.div>
        )}

        {/* Actions */}
        <motion.div
          className="scorecard-actions"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1.3 }}
        >
          <button
            id="btn-back-to-cases"
            onClick={() => { resetSession(); setPage('setup'); }}
            className="scorecard-btn scorecard-btn-secondary"
          >
            <ArrowLeft className="w-4 h-4" />
            New Case
          </button>
          
          <button
            id="btn-view-leaderboard"
            onClick={() => setPage('leaderboard')}
            className="scorecard-btn scorecard-btn-outline"
          >
            <Trophy className="w-4 h-4" />
            View Leaderboard
          </button>

          <button
            id="btn-retry-case"
            onClick={() => { resetSession(); setPage('courtroom'); }}
            className="scorecard-btn scorecard-btn-primary"
          >
            <RotateCcw className="w-4 h-4" />
            Retry Case
          </button>
        </motion.div>
      </div>
    </motion.div>
  );
}
