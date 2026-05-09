import { AnimatePresence } from 'framer-motion';
import useCourtStore from './store/useCourtStore';
import Landing from './components/Landing';
import CaseSetup from './components/CaseSetup';
import Courtroom from './components/Courtroom';
import CustomCourtroom from './components/CustomCourtroom';
import ScoreCard from './components/ScoreCard';
import Leaderboard from './components/Leaderboard';
import CustomRoom from './components/CustomRoom';
import PreTrial from './components/PreTrial';

export default function App() {
  const currentPage = useCourtStore((s) => s.currentPage);
  const multiplayerMode = useCourtStore((s) => s.multiplayerMode);

  return (
    <div style={{ height: '100%', width: '100%', overflow: 'auto', background: 'var(--c-black)' }}>
      <AnimatePresence mode="wait">
        {currentPage === 'landing'   && <Landing      key="landing"   />}
        {currentPage === 'custom'    && <CustomRoom   key="custom"    />}
        {currentPage === 'pretrial'  && <PreTrial     key="pretrial"  />}
        {currentPage === 'setup'     && <CaseSetup    key="setup"     />}
        {currentPage === 'courtroom' && (multiplayerMode ? <CustomCourtroom key="customCourtroom" /> : <Courtroom key="courtroom" />)}
        {currentPage === 'scorecard' && <ScoreCard    key="scorecard" />}
        {currentPage === 'leaderboard' && <Leaderboard key="leaderboard" />}
      </AnimatePresence>
    </div>
  );
}

