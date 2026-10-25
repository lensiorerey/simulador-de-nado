import React, { useState } from 'react';
import { WaterBackground } from './components/WaterBackground';
import { GarminDashboard } from './components/GarminDashboard';
import { GarminIntegrationGuideModal } from './components/GarminIntegrationGuideModal';
import { aquaticAudio } from './audio/aquaticAudioEngine';
import {
  Waves,
  Play,
  Pause,
  Sparkles,
  Swords,
  Trophy,
} from 'lucide-react';

export function App() {
  const [isAudioPlaying, setIsAudioPlaying] = useState(false);
  const [audioVolume, setAudioVolume] = useState(0.25);
  const [isGuideOpen, setIsGuideOpen] = useState(false);

  const toggleAudio = () => {
    const playing = aquaticAudio.toggle();
    setIsAudioPlaying(playing);
  };

  const handleVolumeChange = (e) => {
    const val = parseFloat(e.target.value);
    setAudioVolume(val);
    aquaticAudio.setVolume(val);
  };

  return (
    <div className="relative min-h-screen flex flex-col justify-between overflow-hidden">
      
      {/* Real-time HTML5 Water Canvas Background */}
      <WaterBackground />

      {/* Main Content Overlay */}
      <div className="relative z-10">
        
        {/* Navigation Bar */}
        <header className="glass-panel sticky top-0 z-40 border-b border-biolum-cyan/20">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-14 flex items-center justify-between">
            
            {/* Logo */}
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-biolum-cyan to-biolum-aqua p-0.5 shadow-lg shadow-biolum-cyan/20">
                <div className="w-full h-full bg-ocean-950 rounded-[6px] flex items-center justify-center text-biolum-cyan">
                  <Waves className="w-4 h-4 animate-pulse" />
                </div>
              </div>
              <div className="flex items-center gap-2">
                <h1 className="text-base sm:text-lg font-extrabold font-heading text-white tracking-tight">
                  CÓMO <span className="text-biolum-cyan">NADO</span>
                </h1>
                <span className="n64-badge text-[8px] font-retro bg-amber-500 text-ocean-950 px-1.5 py-0.5 rounded font-black tracking-widest">
                  GARMIN &amp; CSV
                </span>
              </div>
            </div>

            {/* Center Info Badge */}
            <div className="hidden lg:flex items-center gap-2 text-xs font-mono text-biolum-teal bg-ocean-950/80 px-3 py-1 rounded-xl border border-ocean-750">
              <Trophy className="w-3.5 h-3.5 text-amber-300" />
              <span>Simulación Física 60 FPS &amp; Promedios de Nado</span>
            </div>

            {/* Right Tools: Audio Synthesizer Controls */}
            <div className="flex items-center gap-3">
              <div className="glass-panel px-2.5 py-1 rounded-xl border border-biolum-cyan/30 flex items-center gap-2">
                <button
                  onClick={toggleAudio}
                  title="Música Ambiental Acuática Synthesizer"
                  className="flex items-center gap-1.5 text-xs text-biolum-cyan hover:text-white transition-colors"
                >
                  {isAudioPlaying ? (
                    <>
                      <Pause className="w-3.5 h-3.5 text-biolum-cyan animate-pulse" />
                      <span className="hidden sm:inline font-mono text-[9px]">FX ON</span>
                    </>
                  ) : (
                    <>
                      <Play className="w-3.5 h-3.5 text-slate-400" />
                      <span className="hidden sm:inline font-mono text-[9px] text-slate-400">Play Vibe</span>
                    </>
                  )}
                </button>
                <input
                  type="range"
                  min="0"
                  max="0.5"
                  step="0.02"
                  value={audioVolume}
                  onChange={handleVolumeChange}
                  className="w-12 accent-biolum-cyan cursor-pointer hidden sm:block"
                />
              </div>
            </div>

          </div>
        </header>

        {/* Main Dashboard View */}
        <main className="max-w-7xl mx-auto px-0 sm:px-4 lg:px-6 pt-0 sm:pt-3 pb-0 sm:pb-6">
          <GarminDashboard onOpenGuide={() => setIsGuideOpen(true)} />
        </main>

      </div>

      {/* Garmin Connect Integration Guide Modal */}
      <GarminIntegrationGuideModal
        isOpen={isGuideOpen}
        onClose={() => setIsGuideOpen(false)}
        onSyncDemo={() => {
          aquaticAudio.playBubbleSound();
        }}
      />

      {/* Footer (Hidden on mobile for pure 1-screen phone mockup view) */}
      <footer className="hidden md:block relative z-10 glass-panel border-t border-ocean-800 py-6">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-slate-400">
          <div className="flex items-center gap-2">
            <Waves className="w-4 h-4 text-biolum-cyan" />
            <span>Plataforma de Seguimiento de Natación Garmin &amp; Análisis Biomecánico 60 FPS</span>
          </div>
        </div>
      </footer>

    </div>
  );
}

export default App;
