import { AnimatePresence } from 'framer-motion';
import useCourtStore from './store/useCourtStore';
import Landing from './components/Landing';
import CaseSetup from './components/CaseSetup';
import Courtroom from './components/Courtroom';
import ScoreCard from './components/ScoreCard';

export default function App() {
  const currentPage = useCourtStore((s) => s.currentPage);

  return (
    <div className="h-full w-full overflow-hidden bg-court-black">
      <AnimatePresence mode="wait">
        {currentPage === 'landing' && <Landing key="landing" />}
        {currentPage === 'setup' && <CaseSetup key="setup" />}
        {currentPage === 'courtroom' && <Courtroom key="courtroom" />}
        {currentPage === 'scorecard' && <ScoreCard key="scorecard" />}
      </AnimatePresence>
    </div>
  );
}
