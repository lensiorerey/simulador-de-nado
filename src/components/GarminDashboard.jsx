import React, { useState, useEffect } from 'react';
import { GarminConnectModal } from './GarminConnectModal';
import { SwimEfficiencyHeroBlock } from './SwimEfficiencyHeroBlock';

import { SwimStrokeSimulator } from './SwimStrokeSimulator';
import { SwimmerProfileManager } from './SwimmerProfileManager';
import { SwimmerComparisonMatrix } from './SwimmerComparisonMatrix';
import { ShareSimulationModal } from './ShareSimulationModal';
import { swimmerProfileService } from '../services/swimmerProfileService';
import { shareService } from '../services/shareService';
import { dbService } from '../services/firebaseService';
import { garminConnectService } from '../services/garminConnectService';

import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement,
  Filler,
} from 'chart.js';
import { Line, Bar, Doughnut } from 'react-chartjs-2';
import {
  Activity,
  Waves,
  Timer,
  Zap,
  Heart,
  Flame,
  Upload,
  RefreshCw,
  PlusCircle,
  TrendingDown,
  Award,
  CheckCircle2,
  HelpCircle,
  Swords,
  Users,
  Share2,
  Sliders,
  Check,
  FileSpreadsheet,
} from 'lucide-react';
import { aquaticAudio } from '../audio/aquaticAudioEngine';

// Register ChartJS Components
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement,
  Filler
);

export const GarminDashboard = ({ onOpenGuide }) => {
  // Navigation Tabs: 'technique' | 'simulator' | 'profiles' | 'matrix'
  const [activeTab, setActiveTab] = useState('technique');

  // Swimmer Profiles state
  const [profiles, setProfiles] = useState([]);
  const [activeSwimmerIds, setActiveSwimmerIds] = useState([]);

  // Garmin Modal & Share Modal
  const [isGarminConnectOpen, setIsGarminConnectOpen] = useState(false);
  const [isShareModalOpen, setIsShareModalOpen] = useState(false);

  // Single Session Detailed Analytics state
  const [sessions, setSessions] = useState([]);
  const [selectedSessionId, setSelectedSessionId] = useState(null);

  // Load swimmer profiles & check shared URL hash on mount
  useEffect(() => {
    // 1. Load swimmer profiles
    const loadedProfiles = swimmerProfileService.getProfiles();
    setProfiles(loadedProfiles);

    // 2. Check for shared URL hash
    const sharedData = shareService.parseShareHash();
    if (sharedData && sharedData.swimmers && sharedData.swimmers.length > 0) {
      // Merge shared swimmers into profile service
      const mergedProfiles = [...sharedData.swimmers, ...loadedProfiles];
      setProfiles(mergedProfiles);
      setActiveSwimmerIds(sharedData.swimmers.map((s) => s.id));
      setActiveTab('technique');
      try {
        aquaticAudio.playChime();
      } catch (e) {}
    } else {
      // Default: activate first 2 swimmers for instant race comparison
      const initialActive = loadedProfiles.slice(0, 2).map((p) => p.id);
      setActiveSwimmerIds(initialActive);
    }

    // 3. Load DB sessions for detailed analytics tab
    async function loadDbData() {
      const dbSessions = await dbService.getSessions();
      if (dbSessions && dbSessions.length > 0) {
        setSessions(dbSessions);
        setSelectedSessionId(dbSessions[0].id);
      }
    }
    loadDbData();
  }, []);

  // Reload profiles helper
  const reloadProfiles = () => {
    const updated = swimmerProfileService.getProfiles();
    setProfiles(updated);
  };

  // Toggle active swimmer in simulator roster
  const handleToggleActiveSwimmer = (id) => {
    if (activeSwimmerIds.includes(id)) {
      if (activeSwimmerIds.length <= 1) return; // keep at least 1
      setActiveSwimmerIds(activeSwimmerIds.filter((item) => item !== id));
    } else {
      if (activeSwimmerIds.length >= 8) return; // limit to 8 lanes
      setActiveSwimmerIds([...activeSwimmerIds, id]);
    }
    try {
      aquaticAudio.playBubbleSound();
    } catch (e) {}
  };

  // Active Swimmers objects for simulator & comparison matrix
  const activeSwimmers = profiles.filter((p) => activeSwimmerIds.includes(p.id));

  // Current session object for analytics tab
  const currentSession =
    sessions.find((s) => s.id === selectedSessionId) || profiles[0]?.workouts[0] || {
      id: 'default',
      title: 'Sesión Garmin Base',
      totalDistance: 2500,
      avgSwolf: 32,
      avgPace100m: '1:26',
      avgHeartRate: 146,
      laps: [
        { lap: 1, dist: 500, swolf: 33, hr: 140, pace: '1:28' },
        { lap: 2, dist: 500, swolf: 31, hr: 148, pace: '1:25' },
        { lap: 3, dist: 500, swolf: 30, hr: 152, pace: '1:24' },
      ],
      strokesDistribution: { freestyle: 90, backstroke: 10, breaststroke: 0, butterfly: 0 },
    };

  return (
    <div className="space-y-3 animate-fadeIn">
      
      {/* Top Banner Navigation & Quick Actions */}
      <div className="flex flex-col sm:flex-row glass-panel-glow p-3 px-4 sm:px-5 rounded-2xl border border-biolum-cyan/40 items-start sm:items-center justify-between gap-3">
        <div className="flex items-center gap-2.5">
          <span className="px-2 py-0.5 rounded-full text-[9px] sm:text-[10px] font-bold bg-biolum-cyan/20 text-biolum-cyan border border-biolum-cyan/40 flex items-center gap-1 font-mono">
            <Waves className="w-3 h-3 animate-pulse" />
            CÓMO NADO 2D
          </span>
          <h2 className="text-xs sm:text-base font-black font-heading text-white tracking-tight">
            Plataforma de Simulación &amp; Comparación en Vivo
          </h2>
        </div>

        {/* Global Action Buttons */}
        <div className="flex items-center gap-2 w-full sm:w-auto justify-between sm:justify-end">
          <button
            onClick={() => setIsGarminConnectOpen(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-ocean-950 hover:bg-ocean-800 text-biolum-cyan border border-biolum-cyan/40 font-extrabold text-[10px] sm:text-[11px] transition-all shadow-md"
          >
            <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-400" /> Cargar Garmin / CSV
          </button>

          <button
            onClick={() => setIsShareModalOpen(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 text-ocean-950 font-black text-[10px] sm:text-[11px] shadow-md shadow-amber-500/20 hover:brightness-110 transition-all"
          >
            <Share2 className="w-3.5 h-3.5" /> Compartir
          </button>
        </div>
      </div>

      {/* Main Navigation Tabs */}
      <div className="flex flex-nowrap overflow-x-auto items-center gap-1.5 sm:gap-2 border-b border-ocean-800 pb-2.5 scrollbar-thin">
        <button
          onClick={() => setActiveTab('technique')}
          className={`flex items-center gap-1.5 px-3 sm:px-5 py-2 sm:py-3 rounded-xl sm:rounded-2xl font-heading font-extrabold text-[11px] sm:text-xs transition-all shrink-0 ${
            activeTab === 'technique'
              ? 'bg-biolum-cyan text-ocean-950 shadow-lg shadow-biolum-cyan/30 scale-105'
              : 'glass-panel text-slate-300 hover:text-white border border-ocean-750'
          }`}
        >
          <Sliders className="w-3.5 h-3.5 text-amber-300" /> Simulador Biomecánico
        </button>



        <button
          onClick={() => setActiveTab('profiles')}
          className={`flex items-center gap-1.5 px-3 sm:px-5 py-2 sm:py-3 rounded-xl sm:rounded-2xl font-heading font-extrabold text-[11px] sm:text-xs transition-all shrink-0 ${
            activeTab === 'profiles'
              ? 'bg-biolum-cyan text-ocean-950 shadow-lg shadow-biolum-cyan/30 scale-105'
              : 'glass-panel text-slate-300 hover:text-white border border-ocean-750'
          }`}
        >
          <Users className="w-3.5 h-3.5" /> Perfiles Garmin ({profiles.length})
        </button>

        <button
          onClick={() => setActiveTab('matrix')}
          className={`flex items-center gap-1.5 px-3 sm:px-5 py-2 sm:py-3 rounded-xl sm:rounded-2xl font-heading font-extrabold text-[11px] sm:text-xs transition-all shrink-0 ${
            activeTab === 'matrix'
              ? 'bg-biolum-cyan text-ocean-950 shadow-lg shadow-biolum-cyan/30 scale-105'
              : 'glass-panel text-slate-300 hover:text-white border border-ocean-750'
          }`}
        >
          <Swords className="w-3.5 h-3.5" /> Cabeza a Cabeza
        </button>
      </div>


      {/* TAB 2: Biomechanical Technique Stroke Simulator */}
      {activeTab === 'technique' && (
        <div className="space-y-8">
          <SwimStrokeSimulator session={currentSession} allSessions={sessions} profiles={profiles} />
        </div>
      )}

      {/* TAB 3: Swimmer Profiles & Garmin Averages Manager */}
      {activeTab === 'profiles' && (
        <SwimmerProfileManager
          profiles={profiles}
          activeSwimmerIds={activeSwimmerIds}
          onToggleActiveSwimmer={handleToggleActiveSwimmer}
          onProfilesUpdated={reloadProfiles}
          onOpenGarminConnect={() => setIsGarminConnectOpen(true)}
        />
      )}

      {/* TAB 4: Side-by-Side Comparison Matrix */}
      {activeTab === 'matrix' && (
        <SwimmerComparisonMatrix activeSwimmers={activeSwimmers} />
      )}

      {/* TAB 4: Detailed Individual Garmin Session Analytics */}
      {activeTab === 'analytics' && (
        <div className="space-y-6">
          <div className="glass-panel p-6 rounded-3xl border border-ocean-750">
            <h3 className="text-lg font-bold font-heading text-white mb-2">
              Histórico Individual de Entrenamientos Sync Garmin
            </h3>
            <p className="text-xs text-slate-400 font-mono">
              Selecciona una sesión específica para analizar curvas de laps y distribución por series.
            </p>
          </div>

          <SwimEfficiencyHeroBlock />
        </div>
      )}

      {/* Modals */}
      <GarminConnectModal
        isOpen={isGarminConnectOpen}
        onClose={() => setIsGarminConnectOpen(false)}
        onSyncComplete={(newSessions) => {
          reloadProfiles();
        }}
      />

      <ShareSimulationModal
        isOpen={isShareModalOpen}
        onClose={() => setIsShareModalOpen(false)}
        activeSwimmers={activeSwimmers}
        raceSettings={{ poolLength: 25, raceDistance: 100 }}
      />

    </div>
  );
};
