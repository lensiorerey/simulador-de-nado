import React, { useState, useEffect, useRef } from 'react';
import {
  Play,
  Pause,
  RotateCcw,
  Trophy,
  Activity,
  Gauge,
  Sparkles,
  Zap,
  Sliders,
  ChevronRight,
  Flame,
  Award,
  Users,
  Eye,
  Layers,
} from 'lucide-react';
import { aquaticAudio } from '../audio/aquaticAudioEngine';

export const MultiSwimmerSimulator = ({
  swimmers = [],
  poolLength = 25,
  raceDistance = 100,
  onRaceFinish,
}) => {
  const [isPlaying, setIsPlaying] = useState(true);
  const [animSpeed, setAnimSpeed] = useState(1); // 0.5, 1, 2, 4
  const [selectedPoolLength, setSelectedPoolLength] = useState(poolLength);
  const [selectedRaceDist, setSelectedRaceDist] = useState(raceDistance);
  const canvasRef = useRef(null);

  // Leaderboard status state
  const [racePositions, setRacePositions] = useState([]);
  const [isRaceFinished, setIsRaceFinished] = useState(false);
  const [finishPodium, setFinishPodium] = useState([]);

  // Animation frame reference & timing
  const animStateRef = useRef({
    swimmerData: [],
    raceFinished: false,
    startTime: null,
  });

  // Re-initialize animation state whenever swimmers or distance changes
  useEffect(() => {
    if (!swimmers || swimmers.length === 0) return;

    const initialData = swimmers.map((s, idx) => {
      const avgPaceSec = s.averages?.avgPace100mSec || 86; // sec per 100m
      const metersPerSec = 100 / avgPaceSec;
      const strokesPerLap = s.averages?.avgStrokesPerLap || 14;
      const cadenceSpm = s.averages?.avgCadenceSpm || 56;

      return {
        id: s.id || `swimmer-${idx}`,
        name: s.name || `Nadador ${idx + 1}`,
        color: s.avatarColor || (idx === 0 ? '#00F2FE' : '#F43F5E'),
        gender: s.avatarGender || 'male',
        swolf: s.averages?.avgSwolf || 33,
        paceFormatted: s.averages?.avgPaceFormatted || '1:26',
        metersPerSec,
        strokesPerLap,
        cadenceSpm,
        // Dynamic animation values:
        distanceCovered: 0, // meters
        currentLaneX: 0, // 0 to 1 ratio along pool
        direction: 1, // 1 = going right (0 to poolLength), -1 = going left (poolLength to 0)
        armAngle: Math.random() * Math.PI,
        isTurning: false,
        turnTimer: 0,
        completedTimeSec: null,
        rank: null,
      };
    });

    animStateRef.current = {
      swimmerData: initialData,
      raceFinished: false,
      startTime: Date.now(),
    };

    setIsRaceFinished(false);
    setFinishPodium([]);
    setRacePositions(initialData);
  }, [swimmers, selectedPoolLength, selectedRaceDist]);

  // Main 60 FPS HTML5 Canvas Animation Loop
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    let animationFrameId;

    // Water particles
    let bubbles = Array.from({ length: 60 }, () => ({
      x: Math.random() * canvas.width,
      y: Math.random() * canvas.height,
      radius: Math.random() * 2.5 + 0.5,
      speedY: Math.random() * 0.4 + 0.1,
      alpha: Math.random() * 0.6 + 0.2,
    }));

    let lastTimestamp = performance.now();

    const render = (now) => {
      const deltaSec = Math.min(0.1, (now - lastTimestamp) / 1000) * animSpeed;
      lastTimestamp = now;

      ctx.clearRect(0, 0, canvas.width, canvas.height);

      const numSwimmers = animStateRef.current.swimmerData.length;
      if (numSwimmers === 0) return;

      const laneHeight = canvas.height / numSwimmers;
      const startMargin = 60;
      const endMargin = canvas.width - 60;
      const poolWidthPx = endMargin - startMargin;

      // 1. Draw Pool Background Grid & Lane Dividers
      for (let i = 0; i < numSwimmers; i++) {
        const laneY = i * laneHeight;

        // Lane floor tint
        ctx.fillStyle = i % 2 === 0 ? 'rgba(11, 19, 41, 0.6)' : 'rgba(15, 23, 42, 0.8)';
        ctx.fillRect(0, laneY, canvas.width, laneHeight);

        // Lane rope divider (bicolor buoy rope)
        if (i > 0) {
          ctx.strokeStyle = 'rgba(0, 242, 254, 0.25)';
          ctx.lineWidth = 2;
          ctx.beginPath();
          ctx.moveTo(0, laneY);
          ctx.lineTo(canvas.width, laneY);
          ctx.stroke();

          // Buoys along rope
          for (let bx = startMargin; bx <= endMargin; bx += 30) {
            ctx.fillStyle = (bx / 30) % 2 === 0 ? '#00F2FE' : '#F43F5E';
            ctx.beginPath();
            ctx.arc(bx, laneY, 2.5, 0, Math.PI * 2);
            ctx.fill();
          }
        }

        // Lane Number Label
        ctx.fillStyle = 'rgba(255, 255, 255, 0.4)';
        ctx.font = 'bold 12px Inter, sans-serif';
        ctx.fillText(`CARRIL ${i + 1}`, 12, laneY + laneHeight / 2 + 4);
      }

      // Pool Walls (Start & Turn Wall)
      ctx.fillStyle = '#1E293B';
      ctx.fillRect(0, 0, startMargin - 10, canvas.height);
      ctx.fillRect(endMargin + 10, 0, canvas.width - (endMargin + 10), canvas.height);

      // Yellow Wall Touch Target Pads
      ctx.fillStyle = '#F59E0B';
      ctx.fillRect(startMargin - 10, 0, 10, canvas.height);
      ctx.fillRect(endMargin, 0, 10, canvas.height);

      // Distance Grid Markers along top pool wall
      for (let m = 0; m <= selectedPoolLength; m += selectedPoolLength / 5) {
        const ratio = m / selectedPoolLength;
        const mx = startMargin + ratio * poolWidthPx;
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.15)';
        ctx.beginPath();
        ctx.moveTo(mx, 0);
        ctx.lineTo(mx, canvas.height);
        ctx.stroke();

        ctx.fillStyle = 'rgba(255, 255, 255, 0.5)';
        ctx.font = '10px monospace';
        ctx.fillText(`${m}m`, mx - 8, 14);
      }

      // Ambient Animated Water Bubbles
      bubbles.forEach((b) => {
        b.y -= b.speedY;
        if (b.y < 0) b.y = canvas.height;
        ctx.fillStyle = `rgba(0, 242, 254, ${b.alpha})`;
        ctx.beginPath();
        ctx.arc(b.x, b.y, b.radius, 0, Math.PI * 2);
        ctx.fill();
      });

      // 2. Physics & Position Updates
      const swimmersData = animStateRef.current.swimmerData;
      let activeFinisherCount = 0;

      swimmersData.forEach((swimmer, idx) => {
        const laneY = idx * laneHeight + laneHeight / 2;

        if (isPlaying && !swimmer.completedTimeSec) {
          if (swimmer.isTurning) {
            // Flip turn pause (0.7s)
            swimmer.turnTimer -= deltaSec;
            if (swimmer.turnTimer <= 0) {
              swimmer.isTurning = false;
              swimmer.direction *= -1; // reverse direction
            }
          } else {
            // Distance progress
            const distIncrement = swimmer.metersPerSec * deltaSec;
            swimmer.distanceCovered += distIncrement;

            // Check if finished full race distance
            if (swimmer.distanceCovered >= selectedRaceDist) {
              swimmer.distanceCovered = selectedRaceDist;
              const elapsedSec = (Date.now() - animStateRef.current.startTime) / 1000;
              swimmer.completedTimeSec = elapsedSec;
              try {
                aquaticAudio.playChime();
              } catch (e) {}
            } else {
              // Calculate position in current lap
              const currentLapDist = swimmer.distanceCovered % selectedPoolLength;
              const currentLapNum = Math.floor(swimmer.distanceCovered / selectedPoolLength);

              // Direction alternates per lap
              const goingRight = currentLapNum % 2 === 0;
              swimmer.direction = goingRight ? 1 : -1;

              // Check if reached pool end for turn
              if (
                goingRight &&
                swimmer.distanceCovered % selectedPoolLength > selectedPoolLength - 0.3
              ) {
                swimmer.isTurning = true;
                swimmer.turnTimer = 0.7;
              } else if (!goingRight && currentLapDist < 0.3 && swimmer.distanceCovered > 0.5) {
                swimmer.isTurning = true;
                swimmer.turnTimer = 0.7;
              }
            }

            // Arm rotation cadence angle
            const strokeFreq = swimmer.cadenceSpm / 60; // strokes/sec
            swimmer.armAngle += Math.PI * 2 * strokeFreq * deltaSec;
          }
        }

        if (swimmer.completedTimeSec) {
          activeFinisherCount++;
        }

        // Calculate Canvas X Coordinate
        const currentLapMeters = swimmer.distanceCovered % selectedPoolLength;
        const currentLapIndex = Math.floor(swimmer.distanceCovered / selectedPoolLength);
        const isRightDirection = currentLapIndex % 2 === 0;

        let ratio = currentLapMeters / selectedPoolLength;
        if (swimmer.distanceCovered >= selectedRaceDist) {
          // If finished, stay at wall
          ratio = selectedRaceDist % selectedPoolLength === 0 ? 1 : (selectedRaceDist % selectedPoolLength) / selectedPoolLength;
        }

        const posX = isRightDirection
          ? startMargin + ratio * poolWidthPx
          : endMargin - ratio * poolWidthPx;

        swimmer.currentLaneX = posX;

        // 3. Render Swimmer Body & Stroke Dynamics
        ctx.save();
        ctx.translate(posX, laneY);

        // Flip swimmer body based on direction
        const faceRight = swimmer.direction === 1;
        if (!faceRight) {
          ctx.scale(-1, 1);
        }

        // Wake Turbulence & Bubbles behind swimmer
        for (let w = 0; w < 4; w++) {
          ctx.fillStyle = `rgba(0, 242, 254, ${0.4 - w * 0.08})`;
          ctx.beginPath();
          ctx.arc(-22 - w * 10, (Math.random() - 0.5) * 6, 3 + w * 2, 0, Math.PI * 2);
          ctx.fill();
        }

        // Body Torso
        ctx.fillStyle = swimmer.color;
        ctx.shadowColor = swimmer.color;
        ctx.shadowBlur = 12;

        ctx.beginPath();
        ctx.ellipse(0, 0, 18, 7, 0, 0, Math.PI * 2);
        ctx.fill();

        // Head with Swim Cap
        ctx.fillStyle = '#FFFFFF';
        ctx.beginPath();
        ctx.arc(14, 0, 5, 0, Math.PI * 2);
        ctx.fill();

        // Goggles
        ctx.fillStyle = '#0F172A';
        ctx.fillRect(15, -2, 3, 4);

        // Freestyle Arm Rotation Animation
        const armLength = 16;
        const armX1 = Math.cos(swimmer.armAngle) * armLength;
        const armY1 = Math.sin(swimmer.armAngle) * 9;
        const armX2 = Math.cos(swimmer.armAngle + Math.PI) * armLength;
        const armY2 = Math.sin(swimmer.armAngle + Math.PI) * 9;

        ctx.strokeStyle = swimmer.color;
        ctx.lineWidth = 3.5;
        ctx.lineCap = 'round';

        // Arm 1
        ctx.beginPath();
        ctx.moveTo(4, -3);
        ctx.lineTo(4 + armX1, -3 + armY1);
        ctx.stroke();

        // Arm 2
        ctx.beginPath();
        ctx.moveTo(4, 3);
        ctx.lineTo(4 + armX2, 3 + armY2);
        ctx.stroke();

        // Water Splash Effect when arm enters water
        if (Math.sin(swimmer.armAngle) > 0.8) {
          ctx.fillStyle = 'rgba(255, 255, 255, 0.7)';
          ctx.beginPath();
          ctx.arc(4 + armX1, -3 + armY1, 4, 0, Math.PI * 2);
          ctx.fill();
        }

        ctx.restore();

        // 4. Telemetry Label over Swimmer
        ctx.fillStyle = '#FFFFFF';
        ctx.font = 'bold 11px Inter, sans-serif';
        ctx.fillText(
          `${swimmer.name} (${Math.round(swimmer.distanceCovered)}m)`,
          posX - 25,
          laneY - 14
        );
      });

      // Check if race finished completely for all
      if (
        activeFinisherCount === swimmersData.length &&
        !animStateRef.current.raceFinished
      ) {
        animStateRef.current.raceFinished = true;
        setIsRaceFinished(true);

        const podium = [...swimmersData]
          .sort((a, b) => (a.completedTimeSec || 999) - (b.completedTimeSec || 999))
          .map((s, idx) => ({
            ...s,
            rank: idx + 1,
            timeFormatted: `${Math.floor(s.completedTimeSec / 60)}:${
              s.completedTimeSec % 60 < 10 ? '0' : ''
            }${(s.completedTimeSec % 60).toFixed(1)}`,
          }));

        setFinishPodium(podium);
        if (onRaceFinish) onRaceFinish(podium);
      }

      setRacePositions([...swimmersData]);

      if (isPlaying) {
        animationFrameId = requestAnimationFrame(render);
      }
    };

    animationFrameId = requestAnimationFrame(render);

    return () => {
      cancelAnimationFrame(animationFrameId);
    };
  }, [isPlaying, animSpeed, selectedPoolLength, selectedRaceDist]);

  // Reset Race Handler
  const handleResetRace = () => {
    setIsRaceFinished(false);
    setFinishPodium([]);
    if (!swimmers || swimmers.length === 0) return;

    const resetData = swimmers.map((s, idx) => {
      const avgPaceSec = s.averages?.avgPace100mSec || 86;
      return {
        id: s.id || `swimmer-${idx}`,
        name: s.name || `Nadador ${idx + 1}`,
        color: s.avatarColor || (idx === 0 ? '#00F2FE' : '#F43F5E'),
        gender: s.avatarGender || 'male',
        swolf: s.averages?.avgSwolf || 33,
        paceFormatted: s.averages?.avgPaceFormatted || '1:26',
        metersPerSec: 100 / avgPaceSec,
        strokesPerLap: s.averages?.avgStrokesPerLap || 14,
        cadenceSpm: s.averages?.avgCadenceSpm || 56,
        distanceCovered: 0,
        currentLaneX: 0,
        direction: 1,
        armAngle: 0,
        isTurning: false,
        turnTimer: 0,
        completedTimeSec: null,
        rank: null,
      };
    });

    animStateRef.current = {
      swimmerData: resetData,
      raceFinished: false,
      startTime: Date.now(),
    };
    setIsPlaying(true);
    try {
      aquaticAudio.playSplash();
    } catch (e) {}
  };

  // Find leader for gap calculations
  const sortedByDist = [...racePositions].sort((a, b) => b.distanceCovered - a.distanceCovered);
  const leader = sortedByDist[0];

  return (
    <div className="glass-panel p-6 rounded-3xl border border-biolum-cyan/30 shadow-2xl relative overflow-hidden">
      
      {/* Header Controls */}
      <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4 mb-6">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-2 rounded-xl bg-biolum-cyan/10 text-biolum-cyan border border-biolum-cyan/30">
              <Users className="w-5 h-5 animate-pulse" />
            </span>
            <h3 className="text-xl font-extrabold font-heading text-white tracking-tight">
              Simulador Multi-Carrera 2D <span className="text-biolum-cyan">({swimmers.length} Nadadores)</span>
            </h3>
          </div>
          <p className="text-xs text-slate-300 font-mono mt-1">
            Simulación física 60 FPS gobernada por promedios SWOLF, Cadencia y Ritmo/100m de Garmin.
          </p>
        </div>

        {/* Control Toolbar */}
        <div className="flex flex-wrap items-center gap-3">
          {/* Race Distance Selector */}
          <div className="flex items-center gap-1.5 bg-ocean-950 px-3 py-1.5 rounded-xl border border-ocean-750 text-xs">
            <Gauge className="w-4 h-4 text-amber-400" />
            <span className="text-slate-400">Prueba:</span>
            <select
              value={selectedRaceDist}
              onChange={(e) => setSelectedRaceDist(Number(e.target.value))}
              className="bg-transparent text-white font-mono font-bold focus:outline-none cursor-pointer"
            >
              <option value={50} className="bg-ocean-950">50m Sprint</option>
              <option value={100} className="bg-ocean-950">100m Libre</option>
              <option value={200} className="bg-ocean-950">200m Medley</option>
              <option value={400} className="bg-ocean-950">400m Fondo</option>
              <option value={1500} className="bg-ocean-950">1500m Olímpico</option>
            </select>
          </div>

          {/* Speed Selector */}
          <div className="flex items-center gap-1 bg-ocean-950 p-1 rounded-xl border border-ocean-750 text-xs font-mono">
            {[0.5, 1, 2, 4].map((spd) => (
              <button
                key={spd}
                onClick={() => setAnimSpeed(spd)}
                className={`px-2.5 py-1 rounded-lg transition-all ${
                  animSpeed === spd
                    ? 'bg-biolum-cyan text-ocean-950 font-bold shadow-md'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                {spd}x
              </button>
            ))}
          </div>

          {/* Play/Pause Button */}
          <button
            onClick={() => setIsPlaying(!isPlaying)}
            className="flex items-center gap-2 px-4 py-2 rounded-xl font-bold text-xs bg-gradient-to-r from-biolum-cyan to-biolum-aqua text-ocean-950 shadow-lg shadow-biolum-cyan/20 hover:brightness-110 transition-all active:scale-95"
          >
            {isPlaying ? (
              <>
                <Pause className="w-4 h-4" /> Pausar
              </>
            ) : (
              <>
                <Play className="w-4 h-4" /> Reanudar
              </>
            )}
          </button>

          {/* Reset Button */}
          <button
            onClick={handleResetRace}
            title="Reiniciar Simulación"
            className="p-2 rounded-xl bg-ocean-800 hover:bg-ocean-700 text-slate-300 hover:text-white border border-ocean-750 transition-all"
          >
            <RotateCcw className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* HTML5 Pool Canvas Container */}
      <div className="relative rounded-2xl overflow-hidden border border-biolum-cyan/30 shadow-inner bg-ocean-950">
        <canvas
          ref={canvasRef}
          width={900}
          height={Math.max(260, swimmers.length * 75)}
          className="w-full h-auto block"
        />

        {/* Floating Race Finish Overlay Banner */}
        {isRaceFinished && finishPodium.length > 0 && (
          <div className="absolute inset-0 bg-ocean-950/90 backdrop-blur-md flex flex-col items-center justify-center p-6 text-center animate-fade-in z-30">
            <div className="w-14 h-14 rounded-2xl bg-amber-500/20 border border-amber-500/40 flex items-center justify-center text-amber-400 mb-3 shadow-lg shadow-amber-500/20 animate-bounce">
              <Trophy className="w-8 h-8" />
            </div>
            <h4 className="text-2xl font-black font-heading text-white">
              ¡Carrera Finalizada!
            </h4>
            <p className="text-xs text-slate-300 font-mono mt-1">
              Resultados finales de telemetría Garmin en prueba de {selectedRaceDist}m
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 w-full max-w-xl mt-6">
              {finishPodium.slice(0, 3).map((p, idx) => (
                <div
                  key={p.id}
                  className={`p-3 rounded-2xl border text-left flex items-center justify-between ${
                    idx === 0
                      ? 'bg-amber-500/10 border-amber-500/50 text-amber-300'
                      : idx === 1
                      ? 'bg-slate-300/10 border-slate-300/40 text-slate-200'
                      : 'bg-amber-700/10 border-amber-700/40 text-amber-600'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <span className="w-7 h-7 rounded-lg bg-ocean-950 flex items-center justify-center font-black text-xs font-mono">
                      #{idx + 1}
                    </span>
                    <div>
                      <h5 className="text-xs font-bold text-white truncate max-w-[110px]">
                        {p.name}
                      </h5>
                      <span className="text-[10px] font-mono opacity-80">
                        SWOLF: {p.swolf}
                      </span>
                    </div>
                  </div>
                  <span className="font-mono text-xs font-extrabold">{p.timeFormatted}</span>
                </div>
              ))}
            </div>

            <button
              onClick={handleResetRace}
              className="mt-6 px-6 py-2.5 rounded-xl bg-biolum-cyan text-ocean-950 font-extrabold text-xs shadow-lg shadow-biolum-cyan/30 hover:brightness-110 transition-all flex items-center gap-2"
            >
              <RotateCcw className="w-4 h-4" /> Simular Otra Vez
            </button>
          </div>
        )}
      </div>

      {/* Live Telemetry Leaderboard HUD below canvas */}
      <div className="mt-6 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        {racePositions.map((s, idx) => {
          const gapMeters = leader ? (leader.distanceCovered - s.distanceCovered).toFixed(1) : 0;
          const isLeader = leader?.id === s.id;

          return (
            <div
              key={s.id}
              className="glass-panel p-3 rounded-xl border border-ocean-750 flex items-center justify-between"
              style={{ borderLeftColor: s.color, borderLeftWidth: '4px' }}
            >
              <div>
                <div className="flex items-center gap-2">
                  <h5 className="text-xs font-bold text-white truncate max-w-[130px]">
                    {s.name}
                  </h5>
                  {isLeader && (
                    <span className="text-[9px] font-mono bg-amber-500/20 text-amber-300 border border-amber-500/40 px-1.5 py-0.2 rounded font-bold">
                      LÍDER
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-3 mt-1 text-[11px] text-slate-400 font-mono">
                  <span>Ritmo: {s.paceFormatted}</span>
                  <span>SWOLF: {s.swolf}</span>
                </div>
              </div>

              <div className="text-right font-mono">
                <div className="text-sm font-black text-biolum-cyan">
                  {Math.round(s.distanceCovered)}m
                </div>
                <div className="text-[10px] text-slate-400">
                  {isLeader ? '1º Puesto' : `+${gapMeters}m atrás`}
                </div>
              </div>
            </div>
          );
        })}
      </div>

    </div>
  );
};
