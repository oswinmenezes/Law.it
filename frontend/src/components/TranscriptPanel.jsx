import { useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { MessageSquare } from 'lucide-react';
import useCourtStore from '../store/useCourtStore';

const speakerConfig = {
  judge: { label: 'HON\'BLE JUDGE', color: 'text-red-400', dot: 'bg-red-400', border: 'border-red-400/20' },
  opposing: { label: 'OPP. COUNSEL', color: 'text-blue-400', dot: 'bg-blue-400', border: 'border-blue-400/20' },
  prosecutor: { label: 'PROSECUTOR', color: 'text-emerald-400', dot: 'bg-emerald-400', border: 'border-emerald-400/20' },
  defendant: { label: 'DEFENSE', color: 'text-blue-400', dot: 'bg-blue-400', border: 'border-blue-400/20' },
  lawyer: { label: 'YOU', color: 'text-emerald-400', dot: 'bg-emerald-400', border: 'border-emerald-400/20' },
  system: { label: 'COURT', color: 'text-gold-400', dot: 'bg-gold-400', border: 'border-gold-400/20' },
};

export default function TranscriptPanel() {
  const transcript = useCourtStore((s) => s.transcript);
  const scrollRef = useRef(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [transcript]);

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center gap-2.5 px-5 py-4 border-b border-court-border/60">
        <MessageSquare className="w-4 h-4 text-gold-400/60" />
        <span className="text-xs font-semibold text-white/50 uppercase tracking-wider">Live Transcript</span>
        <span className="ml-auto text-[10px] text-white/20 font-[family-name:var(--font-mono)]">
          {transcript.length} entries
        </span>
      </div>

      {/* Transcript body */}
      <div
        ref={scrollRef}
        className="flex-1 overflow-y-auto px-5 py-4 space-y-4"
        style={{ scrollBehavior: 'smooth' }}
      >
        {transcript.length === 0 && (
          <div className="flex items-center justify-center h-full text-white/15 text-sm">
            Hearing transcript will appear here...
          </div>
        )}

        <AnimatePresence initial={false}>
          {transcript.map((entry) => {
            const cfg = speakerConfig[entry.speaker] || speakerConfig.system;
            return (
              <motion.div
                key={entry.id}
                className={`border-l-2 pl-3 py-1 ${cfg.border}`}
                initial={{ opacity: 0, x: -10, height: 0 }}
                animate={{ opacity: 1, x: 0, height: 'auto' }}
                transition={{ duration: 0.2 }}
              >
                <div className="flex items-center gap-2 mb-0.5">
                  <div className={`w-1.5 h-1.5 rounded-full ${cfg.dot}`} />
                  <span className={`text-[10px] font-bold uppercase tracking-wider ${cfg.color}`}>
                    {entry.name || cfg.label}
                  </span>
                  <span className="text-[9px] text-white/15 font-[family-name:var(--font-mono)]">
                    {new Date(entry.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                  </span>
                </div>
                <p className="text-sm text-white/70 leading-relaxed">
                  {entry.text}
                  {entry.streaming && (
                    <span className="inline-block w-1.5 h-4 bg-white/50 ml-0.5 animate-typing-cursor" />
                  )}
                </p>
              </motion.div>
            );
          })}
        </AnimatePresence>
      </div>
    </div>
  );
}
