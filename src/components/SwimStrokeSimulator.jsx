import React, { useState, useEffect, useRef } from 'react';
import {
  Play,
  Pause,
  RotateCcw,
  User,
  Zap,
  Swords,
  Trophy,
  Sparkles,
  ShieldCheck,
  Activity,
  Flame,
  Gauge,
  Award,
  CheckCircle2,
  AlertTriangle,
  Target,
  Clock,
  Heart,
  Share2,
  Copy,
  Check,
  ChevronUp,
  ChevronDown,
  ChevronLeft,
  Flag,
} from 'lucide-react';
import { aquaticAudio } from '../audio/aquaticAudioEngine';
import { shareService } from '../services/shareService';

const STORAGE_KEY = 'last_swim_simulation_state';

const loadSavedSimulationState = () => {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) return JSON.parse(raw);
  } catch (e) {}
  return null;
};

export const SwimStrokeSimulator = ({ session, allSessions = [], profiles = [] }) => {
  const savedState = loadSavedSimulationState();

  // Mode: Swimmer 1 Solo vs Swimmer 1 & 2 Comparison
  const [isComparisonMode, setIsComparisonMode] = useState(savedState?.isComparisonMode ?? true);

  // Selected Race Distance (50m, 100m, 200m, 400m, 1000m)
  const [raceDistance, setRaceDistance] = useState(savedState?.raceDistance ?? 400);

  // Swimmer 1 settings (Tú / Garmin - synced from Garmin screenshot)
  const [swimmer1Gender, setSwimmer1Gender] = useState(savedState?.s1?.swimmer1Gender || 'male');
  const [swimmer1Name, setSwimmer1Name] = useState(savedState?.s1?.swimmer1Name || 'Nadador 1 (Tú)');
  const [s1Swolf, setS1Swolf] = useState(savedState?.s1?.s1Swolf || session?.avgSwolf || 41);
  const [s1StrokesPerLap, setS1StrokesPerLap] = useState(savedState?.s1?.s1StrokesPerLap || 13.2);
  const [s1Spm, setS1Spm] = useState(savedState?.s1?.s1Spm || 29);
  const [s1Hr, setS1Hr] = useState(savedState?.s1?.s1Hr || session?.avgHeartRate || 134);
  const [s1Dist, setS1Dist] = useState(savedState?.s1?.s1Dist || session?.totalDistance || 2700);

  // Swimmer 2 settings (Rival / Garmin Screen Data)
  const [swimmer2Gender, setSwimmer2Gender] = useState(savedState?.s2?.swimmer2Gender || 'female');
  const [swimmer2Name, setSwimmer2Name] = useState(savedState?.s2?.swimmer2Name || 'Nadador 2 (Rival)');
  const [s2Swolf, setS2Swolf] = useState(savedState?.s2?.s2Swolf || 38);
  const [s2StrokesPerLap, setS2StrokesPerLap] = useState(savedState?.s2?.s2StrokesPerLap || 11.5);
  const [s2Spm, setS2Spm] = useState(savedState?.s2?.s2Spm || 26);
  const [s2Hr, setS2Hr] = useState(savedState?.s2?.s2Hr || 148);
  const [s2Dist, setS2Dist] = useState(savedState?.s2?.s2Dist || 2700);

  // Live distance accumulators (in meters)
  const [metersSwam1, setMetersSwam1] = useState(0);
  const [metersSwam2, setMetersSwam2] = useState(0);

  // Share Modal State
  const [isShareModalOpen, setIsShareModalOpen] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);

  // Canvas Animation Controls
  const [isPlaying, setIsPlaying] = useState(true);
  const [animSpeed, setAnimSpeed] = useState(1);
  const canvasRef = useRef(null);

  // Auto-save simulation state to localStorage on every parameter change
  useEffect(() => {
    const payload = {
      isComparisonMode,
      raceDistance,
      s1: { swimmer1Gender, swimmer1Name, s1Swolf, s1StrokesPerLap, s1Spm, s1Hr, s1Dist },
      s2: { swimmer2Gender, swimmer2Name, s2Swolf, s2StrokesPerLap, s2Spm, s2Hr, s2Dist },
    };
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(payload));
    } catch (e) {
      console.warn('Failed to save simulation state:', e);
    }
  }, [
    isComparisonMode,
    raceDistance,
    swimmer1Gender, swimmer1Name, s1Swolf, s1StrokesPerLap, s1Spm, s1Hr, s1Dist,
    swimmer2Gender, swimmer2Name, s2Swolf, s2StrokesPerLap, s2Spm, s2Hr, s2Dist,
  ]);

  // Sync when shared URL hash is loaded on mount
  useEffect(() => {
    const shared = shareService.parseShareHash();
    if (shared && shared.swimmers && shared.swimmers.length > 0) {
      const s1 = shared.swimmers[0];
      if (s1) {
        if (s1.averages?.avgSwolf) setS1Swolf(s1.averages.avgSwolf);
        if (s1.averages?.avgStrokesPerLap) setS1StrokesPerLap(s1.averages.avgStrokesPerLap);
        if (s1.averages?.avgHeartRate) setS1Hr(s1.averages.avgHeartRate);
        if (s1.averages?.avgCadenceSpm) setS1Spm(s1.averages.avgCadenceSpm);
        if (s1.avatarGender) setSwimmer1Gender(s1.avatarGender);
        if (s1.name) setSwimmer1Name(s1.name);
      }
      const s2 = shared.swimmers[1];
      if (s2) {
        if (s2.averages?.avgSwolf) setS2Swolf(s2.averages.avgSwolf);
        if (s2.averages?.avgStrokesPerLap) setS2StrokesPerLap(s2.averages.avgStrokesPerLap);
        if (s2.averages?.avgHeartRate) setS2Hr(s2.averages.avgHeartRate);
        if (s2.averages?.avgCadenceSpm) setS2Spm(s2.averages.avgCadenceSpm);
        if (s2.avatarGender) setSwimmer2Gender(s2.avatarGender);
        if (s2.name) setSwimmer2Name(s2.name);
        setIsComparisonMode(true);
      }
      if (shared.raceDistance) setRaceDistance(shared.raceDistance);
    } else if (session && !savedState) {
      if (session.avgSwolf) setS1Swolf(session.avgSwolf);
      if (session.totalDistance) setS1Dist(session.totalDistance);
      if (session.avgHeartRate) setS1Hr(session.avgHeartRate);
      if (session.avgStrokesPerLap) setS1StrokesPerLap(session.avgStrokesPerLap);
    }
  }, [session]);

  // Pure Biomechanical Swim Physics Engine:
  // Integrates SWOLF efficiency and Cadence turnover so ALL inputs dynamically drive Pace, Speed, and Telemetry
  const calcTelemetryPhysics = (swolf, strokesPerLap, spm, distMeters = 2700) => {
    const numSwolf = Math.max(15, Number(swolf) || 41);
    const numStrokes = Math.max(0.1, parseFloat(strokesPerLap) || 13.2);
    const numSpm = Math.max(5, parseFloat(spm) || 29);
    const dist = Math.max(25, Number(distMeters) || 2700);

    // 1. Distance Per Stroke (DPS in meters = 25m pool / strokesPerLap)
    const dps = (25 / numStrokes).toFixed(2);

    // 2. Stroke turnover cadence frequency (If SPM > 45, normalize single-arm strokes to arm stroke cycles)
    const cycleSpm = numSpm > 45 ? numSpm / 2 : numSpm;

    // 3. Time components:
    // A) SWOLF-derived 100m time (4 x 25m lap time, where lap time = SWOLF - Strokes):
    const timeSwolf100m = 4 * Math.max(5, numSwolf - numStrokes);

    // B) Cadence-derived 100m time from turnover: (240 * Strokes/25m) / SPM
    const timeCadence100m = (240 * numStrokes) / Math.max(1, cycleSpm);

    // 4. Integrated Telemetry Time (50% SWOLF Efficiency + 50% Turnover Cadence):
    let totalSec100m = (timeSwolf100m + timeCadence100m) / 2;
    totalSec100m = Math.max(35, Math.min(300, totalSec100m));

    // Exact float rounding matching Garmin active moving time
    const exactSec = Math.round(totalSec100m);
    const m = Math.floor(exactSec / 60);
    const s = exactSec % 60;
    const paceFormatted = `${m}:${s < 10 ? '0' : ''}${s}`;

    // Speed metrics (m/s and km/h)
    const speedMpsVal = 100 / totalSec100m;
    const speedMps = speedMpsVal.toFixed(2);
    const speedKmh = (speedMpsVal * 3.6).toFixed(2);

    // Estimated total single arm strokes for session distance
    const totalStrokesEst = Math.round((dist / 25) * numStrokes);

    return {
      dps,
      speedMps,
      speedKmh,
      paceFormatted,
      totalStrokesEst,
    };
  };

  const s1Physics = calcTelemetryPhysics(s1Swolf, s1StrokesPerLap, s1Spm, raceDistance);
  const s2Physics = calcTelemetryPhysics(s2Swolf, s2StrokesPerLap, s2Spm, raceDistance);

  const s1DPS = s1Physics.dps;
  const s2DPS = s2Physics.dps;
  const s1SpeedMps = s1Physics.speedMps;
  const s2SpeedMps = s2Physics.speedMps;
  const s1Pace = s1Physics.paceFormatted;
  const s2Pace = s2Physics.paceFormatted;

  // 1. Explosividad (Stroke Power Index = DPS * (SPM / 60) -> m/s² propulsivo)
  const s1Explosiveness = (parseFloat(s1DPS) * (Number(s1Spm) / 60)).toFixed(2);
  const s2Explosiveness = (parseFloat(s2DPS) * (Number(s2Spm) / 60)).toFixed(2);

  // 2. Costo Cardíaco / Economía (Heartbeats per 100m = (Pace_sec / 60) * HR)
  const s1Heartbeats100m = Math.round((100 / parseFloat(s1SpeedMps) / 60) * Number(s1Hr));
  const s2Heartbeats100m = Math.round((100 / parseFloat(s2SpeedMps) / 60) * Number(s2Hr));

  // Estimated Race Time for current raceDistance
  const calcRaceTimeFormatted = (speedMps, distMeters) => {
    const totalSec = Math.round(Number(distMeters) / Math.max(0.1, parseFloat(speedMps)));
    const m = Math.floor(totalSec / 60);
    const s = totalSec % 60;
    return `${m}m ${s < 10 ? '0' : ''}${s}s`;
  };

  const s1RaceTime = calcRaceTimeFormatted(s1SpeedMps, raceDistance);
  const s2RaceTime = calcRaceTimeFormatted(s2SpeedMps, raceDistance);

  // REALISTIC DYNAMIC SWIMMER RANK EVALUATION (Continuous Score 0 to 100)
  const getSwimmerRank = (swolf, dps, paceStr) => {
    const numSwolf = Number(swolf) || 38;
    const numDps = parseFloat(dps) || 1.7;

    let speedMps = 1.0;
    if (paceStr && paceStr.includes(':')) {
      const [m, s] = paceStr.split(':').map(Number);
      const sec = (m || 1) * 60 + (s || 30);
      speedMps = 100 / Math.max(1, sec);
    }

    const swolfScore = Math.max(0, Math.min(100, (55 - numSwolf) * 4));
    const dpsScore = Math.max(0, Math.min(100, numDps * 42));
    const speedScore = Math.max(0, Math.min(100, speedMps * 70));

    const totalScore = Math.round(swolfScore * 0.4 + dpsScore * 0.35 + speedScore * 0.25);

    if (totalScore >= 85) {
      return {
        rankName: 'Rango 1: Élite Nacional / Competición 🥇',
        badgeColor: 'bg-amber-400/20 text-amber-300 border-amber-400/50',
        tierLevel: 'Nivel Olímpico / Máster Élite (Top 3%)',
        score: totalScore,
        summary: 'Deslizamiento hidrodinámico óptimo con bajo arrastre.',
      };
    } else if (totalScore >= 70) {
      return {
        rankName: 'Rango 2: Avanzado Competitivo 🥈',
        badgeColor: 'bg-biolum-cyan/20 text-biolum-cyan border-biolum-cyan/50',
        tierLevel: 'Nadador de Club / Triatleta Grupo de Edad A',
        score: totalScore,
        summary: 'Alta eficiencia de brazada con buen control de ritmo.',
      };
    } else if (totalScore >= 52) {
      return {
        rankName: 'Rango 3: Intermedio Acondicionado 🥉',
        badgeColor: 'bg-biolum-emerald/20 text-biolum-emerald border-biolum-emerald/50',
        tierLevel: 'Nadador Máster / Triatleta Grupo B',
        score: totalScore,
        summary: 'Ritmo estable. Oportunidad de reducir brazadas por largo.',
      };
    } else {
      return {
        rankName: 'Rango 4: Inicial / En Desarrollo Técnica 🔰',
        badgeColor: 'bg-rose-500/20 text-rose-300 border-rose-500/50',
        tierLevel: 'Fase de Construcción Técnica Base',
        score: totalScore,
        summary: 'Alta frecuencia o arrastre. Enfocar en rolido y codo alto.',
      };
    }
  };

  const s1Rank = getSwimmerRank(s1Swolf, s1DPS, s1Pace);
  const s2Rank = getSwimmerRank(s2Swolf, s2DPS, s2Pace);

  // Virtual Swim Coach Class Insights Generator
  const getCoachInsights = (swolf, dps, spm, hr, strokesPerLap, heartbeats100m) => {
    const numSwolf = Number(swolf);
    const numDps = parseFloat(dps);
    const numStrokes = parseFloat(strokesPerLap);
    const numHr = Number(hr);
    const hb100 = Number(heartbeats100m);

    let wellDone = '';
    let toImprove = '';
    let drillDrill = '';

    if (numDps >= 2.0) {
      wellDone = `Excelente alcance hidrodinámico con ${numDps}m por brazada. El agarre de codo alto permite proyectar el cuerpo sin hundir la cadera.`;
    } else if (numSwolf <= 35) {
      wellDone = `Excelente economía con SWOLF de ${numSwolf}. La fase de deslizamiento es fluida y aprovechas el impulso previo.`;
    } else if (hb100 < 200) {
      wellDone = `Costo energético óptimo: solo ${hb100} latidos por 100m. Gran eficiencia aeróbica para la velocidad actual.`;
    } else {
      wellDone = `Buena cadencia base de ${spm} SPM que mantiene la continuidad del nado sin pausas muertas.`;
    }

    if (numStrokes >= 13.0 && numSwolf > 40) {
      toImprove = `Estás dando ${numStrokes} brazadas/25m (SWOLF ${numSwolf}). La alta frecuencia genera turbulencia y resistencia parásita en la cabeza.`;
      drillDrill = `Drill Recomendado: 6x50m Nado Contado. Busca reducir 1.5 brazadas por largo alargando la patada de 2 tiempos.`;
    } else if (hb100 > 240) {
      toImprove = `Costo cardíaco elevado (${hb100} latidos/100m). Hay gasto de energía excesivo (posiblemente frenando agua) para el ritmo actual.`;
      drillDrill = `Drill Recomendado: Series Z2 de 4x100m respirando a 3 tiempos enfocándose en el desliz para bajar pulsaciones.`;
    } else {
      toImprove = `Rolido de cadera levemente plano. Trabajar la extensión completa del dorsal para ganar 0.2m más por brazada.`;
      drillDrill = `Drill Recomendado: 4x50m Brazada Punto Muerto (Catch-up drill) usando tubito frontal.`;
    }

    return { wellDone, toImprove, drillDrill };
  };

  const s1Coach = getCoachInsights(s1Swolf, s1DPS, s1Spm, s1Hr, s1StrokesPerLap, s1Heartbeats100m);
  const s2Coach = getCoachInsights(s2Swolf, s2DPS, s2Spm, s2Hr, s2StrokesPerLap, s2Heartbeats100m);

  // Generate shareable URL hash
  const generateShareUrl = () => {
    const swimmers = [
      {
        name: swimmer1Name,
        avatarGender: swimmer1Gender,
        customSwolf: Number(s1Swolf),
        customStrokes: Number(s1StrokesPerLap),
        customSpm: Number(s1Spm),
        customPace: s1Pace,
        customHr: Number(s1Hr),
      },
    ];
    if (isComparisonMode) {
      swimmers.push({
        name: swimmer2Name,
        avatarGender: swimmer2Gender,
        customSwolf: Number(s2Swolf),
        customStrokes: Number(s2StrokesPerLap),
        customSpm: Number(s2Spm),
        customPace: s2Pace,
        customHr: Number(s2Hr),
      });
    }
    return shareService.generateShareUrl(swimmers, { raceDistance });
  };

  const handleCopyShareLink = async () => {
    const url = generateShareUrl();
    
    // Update the browser's address bar directly so the user can copy it manually if clipboard fails
    const queryPart = url.split('?')[1];
    if (queryPart) {
      window.history.replaceState(null, '', '?' + queryPart);
    }

    try {
      if (navigator.clipboard && navigator.clipboard.writeText) {
        await navigator.clipboard.writeText(url);
      } else {
        // Fallback for unsecured HTTP
        const textArea = document.createElement("textarea");
        textArea.value = url;
        document.body.appendChild(textArea);
        textArea.select();
        document.execCommand("copy");
        textArea.remove();
      }
      setCopiedLink(true);
      aquaticAudio.playChime();
      setTimeout(() => setCopiedLink(false), 2500);
    } catch (e) {
      console.warn("Clipboard API failed, URL is in address bar", e);
      setCopiedLink(true);
      setTimeout(() => setCopiedLink(false), 2500);
    }
  };

  // Reset live distance accumulator
  const handleResetSimulation = () => {
    setMetersSwam1(0);
    setMetersSwam2(0);
    aquaticAudio.playBubbleSound();
  };

  // 60 FPS HTML5 Canvas Physics & Live Metres Engine
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    let animationFrameId;

    let posX1 = 70;
    let posX2 = 70;
    let armAngle1 = 0;
    let armAngle2 = 0;
    let bubbleParticles = [];

    for (let i = 0; i < 50; i++) {
      bubbleParticles.push({
        x: Math.random() * canvas.width,
        y: Math.random() * canvas.height,
        radius: Math.random() * 2.5 + 0.5,
        speedY: Math.random() * 0.4 + 0.1,
        alpha: Math.random() * 0.6 + 0.2,
      });
    }

    let lastTime = performance.now();

    const render = (currentTime) => {
      const deltaSec = (currentTime - lastTime) / 1000;
      lastTime = currentTime;

      ctx.clearRect(0, 0, canvas.width, canvas.height);

      const laneHeight = isComparisonMode ? canvas.height / 2 : canvas.height;

      // Pool Grid Lines
      ctx.strokeStyle = 'rgba(0, 242, 254, 0.10)';
      ctx.lineWidth = 1;
      for (let y = 0; y < canvas.height; y += 40) {
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(canvas.width, y);
        ctx.stroke();
      }

      if (isComparisonMode) {
        // Olympic Center Lane Separator
        ctx.strokeStyle = 'rgba(255, 215, 0, 0.5)';
        ctx.lineWidth = 3;
        ctx.setLineDash([10, 8]);
        ctx.beginPath();
        ctx.moveTo(0, canvas.height / 2);
        ctx.lineTo(canvas.width, canvas.height / 2);
        ctx.stroke();
        ctx.setLineDash([]);
      }

      // Bubbles
      bubbleParticles.forEach((b) => {
        ctx.beginPath();
        ctx.arc(b.x, b.y, b.radius, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(0, 242, 254, ${b.alpha})`;
        ctx.fill();
        b.y -= b.speedY;
        if (b.y < 0) b.y = canvas.height;
      });

      // Update position & live accumulated meters
      if (isPlaying) {
        const v1 = parseFloat(s1SpeedMps) * 1.35 * animSpeed;
        const v2 = parseFloat(s2SpeedMps) * 1.35 * animSpeed;

        posX1 += v1;
        posX2 += v2;

        armAngle1 += 0.002 * Number(s1Spm) * animSpeed;
        armAngle2 += 0.002 * Number(s2Spm) * animSpeed;

        if (posX1 > canvas.width - 80) posX1 = 70;
        if (posX2 > canvas.width - 80) posX2 = 70;

        // Update live meters counters state in small increments
        setMetersSwam1((prev) => {
          if (prev >= raceDistance) return raceDistance;
          const next = prev + parseFloat(s1SpeedMps) * deltaSec * animSpeed * 3;
          return Math.min(raceDistance, Math.round(next * 10) / 10);
        });

        if (isComparisonMode) {
          setMetersSwam2((prev) => {
            if (prev >= raceDistance) return raceDistance;
            const next = prev + parseFloat(s2SpeedMps) * deltaSec * animSpeed * 3;
            return Math.min(raceDistance, Math.round(next * 10) / 10);
          });
        }
      }

      // Dynamic Swimmer Avatar Colors based on Gender
      const s1Color = swimmer1Gender === 'female' ? '#ff007f' : '#00f2fe';
      const s2Color = swimmer2Gender === 'female' ? '#ff007f' : '#00f2fe';

      // Draw Swimmer 1
      const y1 = isComparisonMode ? laneHeight / 2 : canvas.height / 2;
      drawSwimmerAvatar(
        ctx,
        posX1,
        y1,
        swimmer1Gender,
        armAngle1,
        Number(s1Swolf),
        s1DPS,
        Number(s1Spm),
        Number(s1Hr),
        s1Color,
        `🏊 ${swimmer1Name}`,
        metersSwam1,
        raceDistance,
        s1RaceTime
      );

      // Draw Swimmer 2
      if (isComparisonMode) {
        const y2 = laneHeight + laneHeight / 2;
        drawSwimmerAvatar(
          ctx,
          posX2,
          y2,
          swimmer2Gender,
          armAngle2,
          Number(s2Swolf),
          s2DPS,
          Number(s2Spm),
          Number(s2Hr),
          s2Color,
          `🏊 ${swimmer2Name}`,
          metersSwam2,
          raceDistance,
          s2RaceTime
        );
      }

      animationFrameId = requestAnimationFrame(render);
    };

    animationFrameId = requestAnimationFrame(render);

    return () => cancelAnimationFrame(animationFrameId);
  }, [
    isPlaying,
    animSpeed,
    isComparisonMode,
    s1SpeedMps,
    s2SpeedMps,
    s1Spm,
    s2Spm,
    s1Swolf,
    s2Swolf,
    s1DPS,
    s2DPS,
    s1Hr,
    s2Hr,
    swimmer1Gender,
    swimmer2Gender,
    swimmer1Name,
    swimmer2Name,
    raceDistance,
  ]);

  const drawSwimmerAvatar = (
    ctx,
    x,
    y,
    gender,
    angle,
    swolf,
    dps,
    spm,
    hr,
    colorHex,
    nameLabel,
    curMeters,
    totMeters,
    timeEst
  ) => {
    ctx.save();
    ctx.translate(x, y);

    // 1. Hydrodynamic Bioluminescent Particle Wake Trail (Trailing behind swimmer)
    const wakeLength = 120;
    ctx.fillStyle = colorHex;
    for (let i = 0; i < 14; i++) {
      const particleX = -35 - Math.random() * wakeLength;
      const particleY = (Math.random() - 0.5) * 16;
      const radius = Math.random() * 2.5 + 0.5;
      const alpha = Math.max(0, 1 - Math.abs(particleX) / wakeLength) * 0.5;
      ctx.fillStyle = colorHex;
      ctx.globalAlpha = alpha;
      ctx.beginPath();
      ctx.arc(particleX, particleY, radius, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.globalAlpha = 1.0;

    // 2. Animated Water Turbulence Ripples
    ctx.strokeStyle = colorHex;
    ctx.lineWidth = 1.5;
    for (let i = 1; i <= 4; i++) {
      ctx.beginPath();
      const waveX = -30 - i * 20;
      const waveOffset = Math.sin(angle * 3 + i) * 6;
      ctx.arc(waveX, waveOffset, 6 + i * 3, -Math.PI / 2, Math.PI / 2);
      ctx.stroke();
    }

    // 3. Glowing Swimmer Neon Body Silhouette
    ctx.fillStyle = colorHex;
    ctx.strokeStyle = colorHex;
    ctx.shadowColor = colorHex;
    ctx.shadowBlur = 18;

    // Head
    ctx.beginPath();
    ctx.arc(28, 0, 8, 0, Math.PI * 2);
    ctx.fill();

    // Torso (Sleek aerodynamic swimmer profile)
    ctx.beginPath();
    if (gender === 'female') {
      ctx.moveTo(20, -7);
      ctx.lineTo(20, 7);
      ctx.lineTo(-8, 5);
      ctx.lineTo(-24, 3);
      ctx.lineTo(-24, -3);
      ctx.lineTo(-8, -5);
    } else {
      ctx.moveTo(20, -10);
      ctx.lineTo(20, 10);
      ctx.lineTo(-8, 6);
      ctx.lineTo(-24, 4);
      ctx.lineTo(-24, -4);
      ctx.lineTo(-8, -6);
    }
    ctx.closePath();
    ctx.fill();

    // High-Turnover Stroke Arm Cycle
    const strokeX = Math.cos(angle) * 26;
    const strokeY = Math.sin(angle) * 14;
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(14, -8);
    ctx.lineTo(14 + strokeX, -8 + strokeY);
    ctx.stroke();

    const strokeX2 = Math.cos(angle + Math.PI) * 26;
    const strokeY2 = Math.sin(angle + Math.PI) * 14;
    ctx.beginPath();
    ctx.moveTo(14, 8);
    ctx.lineTo(14 + strokeX2, 8 + strokeY2);
    ctx.stroke();

    // Flutter Kick Legs
    const kickY = Math.sin(angle * 4) * 6;
    ctx.strokeStyle = colorHex;
    ctx.lineWidth = 3.5;
    ctx.beginPath();
    ctx.moveTo(-24, -2);
    ctx.lineTo(-42, -2 + kickY);
    ctx.moveTo(-24, 2);
    ctx.lineTo(-42, 2 - kickY);
    ctx.stroke();

    // 4. Floating Distance Pill Badge (Exact matching Mockup Image 1!)
    ctx.shadowBlur = 0;
    const isFinished = curMeters >= totMeters;
    const badgeText = isFinished ? `${totMeters}m 🏁` : `${curMeters.toFixed(0)}m`;
    
    ctx.font = 'bold 10px monospace';
    const textWidth = ctx.measureText(badgeText).width;
    const badgeWidth = textWidth + 12;
    const badgeHeight = 18;
    const badgeX = -badgeWidth / 2 + 10;
    const badgeY = -28;

    // Badge Background Pill
    ctx.fillStyle = 'rgba(3, 16, 36, 0.85)';
    ctx.strokeStyle = colorHex;
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.roundRect(badgeX, badgeY, badgeWidth, badgeHeight, 9);
    ctx.fill();
    ctx.stroke();

    // Badge Text
    ctx.fillStyle = isFinished ? '#ffd700' : '#ffffff';
    ctx.fillText(badgeText, badgeX + 6, badgeY + 12);

    ctx.restore();
  };

  return (
    <div className="bg-[#020b18] min-h-screen p-2 sm:p-4 space-y-3 animate-fadeIn relative">

      {/* Top Header Bar matching attached image */}
      <div className="flex items-center justify-between px-2 py-1 border-b border-ocean-800/60 text-white">
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={handleResetSimulation}
            className="text-slate-300 hover:text-white transition-colors"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>
          <h1 className="text-sm sm:text-base font-extrabold tracking-tight text-white">
            Cómo Nado - Telemetría
          </h1>
        </div>

        {/* Quick Play/Pacing Control & Speed Multipliers */}
        <div className="flex items-center gap-1.5">
          <button
            type="button"
            onClick={() => setIsShareModalOpen(true)}
            className="px-2 py-1 rounded-full bg-amber-500/10 border border-amber-500/40 text-amber-400 font-bold text-[10px] flex items-center gap-1 backdrop-blur-md hover:bg-amber-500/20 transition-all mr-1"
          >
            <Share2 className="w-3 h-3" />
            Compartir
          </button>

          {/* Speed Multipliers (0.5x, 1x, 2x, 4x) */}
          <div className="flex items-center gap-0.5 bg-ocean-950/90 p-0.5 rounded-full border border-ocean-700 backdrop-blur-md">
            {[0.5, 1, 2, 4].map((spd) => (
              <button
                key={spd}
                type="button"
                onClick={() => setAnimSpeed(spd)}
                className={`px-1.5 py-0.5 rounded-full text-[9px] font-bold font-mono transition-all ${
                  animSpeed === spd ? 'bg-biolum-cyan text-ocean-950 font-black shadow' : 'text-slate-400 hover:text-white'
                }`}
              >
                {spd}x
              </button>
            ))}
          </div>

          <button
            type="button"
            onClick={() => {
              aquaticAudio.playBubbleSound();
              setIsPlaying(!isPlaying);
            }}
            className="px-2.5 py-1 rounded-full bg-biolum-cyan/10 border border-biolum-cyan/40 text-biolum-cyan font-bold text-[10px] flex items-center gap-1 backdrop-blur-md hover:bg-biolum-cyan/20 transition-all"
          >
            {isPlaying ? <Pause className="w-3 h-3" /> : <Play className="w-3 h-3" />}
            {isPlaying ? 'Pausa' : 'Play'}
          </button>
        </div>
      </div>

      {/* 2D HTML5 Canvas Pool Track (Exact matching image pool dimensions) */}
      <div className="relative rounded-2xl overflow-hidden border border-[#00f2fe]/40 bg-[#020b18] shadow-2xl flex items-center justify-center min-h-[120px] sm:min-h-[220px]">
        <canvas
          ref={canvasRef}
          width={850}
          height={isComparisonMode ? 220 : 150}
          className="w-full h-auto block cursor-pointer max-h-[140px] sm:max-h-[240px]"
        />

        {/* Floating Race Distance Indicator */}
        <div className="absolute top-2 left-2 bg-[#020b18]/90 px-2.5 py-0.5 rounded-full border border-biolum-cyan/40 font-mono text-[10px] text-white backdrop-blur-md flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-biolum-cyan animate-pulse" />
          <span>{metersSwam1.toFixed(0)}m / {raceDistance}m</span>
        </div>
      </div>

      {/* Race Distance Selector Bar (Metros de Nado de la Simulación) */}
      <div className="max-w-2xl mx-auto flex items-center justify-between gap-2 px-3 py-1.5 rounded-xl bg-ocean-950/90 border border-ocean-750 text-xs shadow-md">
        <div className="flex items-center gap-1.5">
          <Target className="w-3.5 h-3.5 text-amber-400" />
          <span className="font-extrabold text-white text-[11px]">Metros:</span>
        </div>

        <div className="flex items-center gap-1">
          {[50, 100, 200, 400, 1000].map((dist) => (
            <button
              key={dist}
              type="button"
              onClick={() => {
                setRaceDistance(dist);
                handleResetSimulation();
              }}
              className={`px-2 py-0.5 rounded-lg text-[10px] sm:text-xs font-mono font-bold transition-all ${
                raceDistance === dist
                  ? 'bg-[#00f2fe] text-ocean-950 font-black shadow-[0_0_10px_rgba(0,242,254,0.4)]'
                  : 'bg-ocean-900 text-slate-300 hover:text-white border border-ocean-750'
              }`}
            >
              {dist}m
            </button>
          ))}
        </div>
      </div>

      {/* 2-Column Side-by-Side Swimmer Cards (100% Exact match to attached image) */}
      <div className="grid grid-cols-2 gap-2.5 sm:gap-3.5 max-w-2xl mx-auto">
        
        {/* Swimmer 1 Card (Cyan Border & Inner Cross Grid) */}
        <div className="rounded-[24px] sm:rounded-[28px] border-2 border-[#00f2fe] bg-[#020b18]/95 shadow-[0_0_25px_rgba(0,242,254,0.35)] p-2.5 sm:p-3.5 text-center flex flex-col justify-between">
          <div className="text-xs sm:text-sm font-extrabold text-white pb-2 border-b border-[#00f2fe]/30 tracking-tight flex justify-between items-center">
            <span>Nadador 1 (Tú)</span>
            {profiles && profiles.length > 0 && (
              <select
                className="text-[10px] bg-[#020b18] border border-[#00f2fe]/50 text-white rounded px-1.5 py-0.5 ml-2 font-normal focus:outline-none max-w-[120px]"
                onChange={(e) => {
                  const p = profiles.find(prof => prof.id === e.target.value);
                  if (p) {
                    setSwimmer1Name(p.name);
                    setSwimmer1Gender(p.avatarGender);
                    if (p.averages) {
                      setS1Swolf(p.averages.avgSwolf || 34);
                      setS1Hr(p.averages.avgHeartRate || 145);
                      setS1StrokesPerLap(p.averages.avgStrokesPerLap || 14);
                      setS1Spm(p.averages.avgCadenceSpm || 29);
                    }
                  }
                }}
              >
                <option value="">Cargar Perfil...</option>
                {profiles.map(p => (
                  <option key={p.id} value={p.id}>{p.name}</option>
                ))}
              </select>
            )}
          </div>

          <div className="grid grid-cols-2 divide-x divide-y divide-[#00f2fe]/30 text-center pt-1">
            {/* Cell 1: SWOLF */}
            <div className="p-1.5 sm:p-2 flex flex-col items-center justify-center">
              <span className="text-[9px] sm:text-[10px] text-slate-400 font-medium block">SWOLF</span>
              <input
                type="number"
                value={s1Swolf}
                onFocus={(e) => e.target.select()}
                onChange={(e) => setS1Swolf(e.target.value)}
                className="w-full text-center bg-transparent font-black text-sm sm:text-lg text-white focus:outline-none focus:text-[#00f2fe]"
              />
            </div>

            {/* Cell 2: Brazadas */}
            <div className="p-1.5 sm:p-2 flex flex-col items-center justify-center">
              <span className="text-[9px] sm:text-[10px] text-slate-400 font-medium block">Brazadas</span>
              <input
                type="number"
                step="0.1"
                value={s1StrokesPerLap}
                onFocus={(e) => e.target.select()}
                onChange={(e) => setS1StrokesPerLap(e.target.value)}
                className="w-full text-center bg-transparent font-black text-sm sm:text-lg text-white focus:outline-none focus:text-[#00f2fe]"
              />
            </div>

            {/* Cell 3: SPM */}
            <div className="p-1.5 sm:p-2 flex flex-col items-center justify-center">
              <span className="text-[9px] sm:text-[10px] text-slate-400 font-medium block">SPM</span>
              <input
                type="number"
                step="0.1"
                value={s1Spm}
                onFocus={(e) => e.target.select()}
                onChange={(e) => setS1Spm(e.target.value)}
                className="w-full text-center bg-transparent font-black text-sm sm:text-lg text-white focus:outline-none focus:text-[#00f2fe]"
              />
            </div>

            {/* Cell 4: FC */}
            <div className="p-1.5 sm:p-2 flex flex-col items-center justify-center">
              <span className="text-[9px] sm:text-[10px] text-slate-400 font-medium block">FC</span>
              <input
                type="number"
                value={s1Hr}
                onFocus={(e) => e.target.select()}
                onChange={(e) => setS1Hr(e.target.value)}
                className="w-full text-center bg-transparent font-black text-sm sm:text-lg text-white focus:outline-none focus:text-[#00f2fe]"
              />
            </div>

            {/* Cell 5: Ritmo */}
            <div className="p-1.5 sm:p-2 flex flex-col items-center justify-center">
              <span className="text-[9px] sm:text-[10px] text-slate-400 font-medium block">Ritmo</span>
              <span className="font-black text-sm sm:text-lg text-white">{s1Pace}</span>
            </div>

            {/* Cell 6: Velocidad */}
            <div className="p-1.5 sm:p-2 flex flex-col items-center justify-center">
              <span className="text-[9px] sm:text-[10px] text-slate-400 font-medium block">Velocidad</span>
              <div className="flex flex-col items-center">
                <span className="font-black text-sm sm:text-lg text-white leading-tight">{s1Physics.speedKmh}</span>
                <span className="text-[8px] font-normal text-slate-400">km/h</span>
              </div>
            </div>

            {/* Cell 7: DPS */}
            <div className="p-1.5 sm:p-2 flex flex-col items-center justify-center">
              <span className="text-[9px] sm:text-[10px] text-slate-400 font-medium block">DPS</span>
              <span className="font-black text-sm sm:text-lg text-white">{s1Physics.dps}m</span>
            </div>

            {/* Cell 8: Total */}
            <div className="p-1.5 sm:p-2 flex flex-col items-center justify-center">
              <span className="text-[9px] sm:text-[10px] text-slate-400 font-medium block">Total</span>
              <span className="font-black text-sm sm:text-lg text-white">{s1Physics.totalStrokesEst.toLocaleString()}</span>
            </div>
          </div>
        </div>

        {/* Swimmer 2 Card (Pink Border & Inner Cross Grid) */}
        <div className="rounded-[24px] sm:rounded-[28px] border-2 border-[#f43f5e] bg-[#020b18]/95 shadow-[0_0_25px_rgba(244,63,94,0.35)] p-2.5 sm:p-3.5 text-center flex flex-col justify-between">
          <div className="text-xs sm:text-sm font-extrabold text-white pb-2 border-b border-rose-500/30 tracking-tight flex justify-between items-center">
            <span>Nadador 2 (Rival)</span>
            {profiles && profiles.length > 0 && (
              <select
                className="text-[10px] bg-[#020b18] border border-rose-500/50 text-white rounded px-1.5 py-0.5 ml-2 font-normal focus:outline-none max-w-[120px]"
                onChange={(e) => {
                  const p = profiles.find(prof => prof.id === e.target.value);
                  if (p) {
                    setSwimmer2Name(p.name);
                    setSwimmer2Gender(p.avatarGender);
                    if (p.averages) {
                      setS2Swolf(p.averages.avgSwolf || 34);
                      setS2Hr(p.averages.avgHeartRate || 145);
                      setS2StrokesPerLap(p.averages.avgStrokesPerLap || 14);
                      setS2Spm(p.averages.avgCadenceSpm || 29);
                    }
                  }
                }}
              >
                <option value="">Cargar Perfil...</option>
                {profiles.map(p => (
                  <option key={p.id} value={p.id}>{p.name}</option>
                ))}
              </select>
            )}
          </div>

          <div className="grid grid-cols-2 divide-x divide-y divide-[#f43f5e]/30 text-center pt-1">
            {/* Cell 1: SWOLF */}
            <div className="p-1.5 sm:p-2 flex flex-col items-center justify-center">
              <span className="text-[9px] sm:text-[10px] text-slate-400 font-medium block">SWOLF</span>
              <input
                type="number"
                value={s2Swolf}
                onFocus={(e) => e.target.select()}
                onChange={(e) => setS2Swolf(e.target.value)}
                className="w-full text-center bg-transparent font-black text-sm sm:text-lg text-white focus:outline-none focus:text-[#f43f5e]"
              />
            </div>

            {/* Cell 2: Brazadas */}
            <div className="p-1.5 sm:p-2 flex flex-col items-center justify-center">
              <span className="text-[9px] sm:text-[10px] text-slate-400 font-medium block">Brazadas</span>
              <input
                type="number"
                step="0.1"
                value={s2StrokesPerLap}
                onFocus={(e) => e.target.select()}
                onChange={(e) => setS2StrokesPerLap(e.target.value)}
                className="w-full text-center bg-transparent font-black text-sm sm:text-lg text-white focus:outline-none focus:text-[#f43f5e]"
              />
            </div>

            {/* Cell 3: SPM */}
            <div className="p-1.5 sm:p-2 flex flex-col items-center justify-center">
              <span className="text-[9px] sm:text-[10px] text-slate-400 font-medium block">SPM</span>
              <input
                type="number"
                step="0.1"
                value={s2Spm}
                onFocus={(e) => e.target.select()}
                onChange={(e) => setS2Spm(e.target.value)}
                className="w-full text-center bg-transparent font-black text-sm sm:text-lg text-white focus:outline-none focus:text-[#f43f5e]"
              />
            </div>

            {/* Cell 4: FC */}
            <div className="p-1.5 sm:p-2 flex flex-col items-center justify-center">
              <span className="text-[9px] sm:text-[10px] text-slate-400 font-medium block">FC</span>
              <input
                type="number"
                value={s2Hr}
                onFocus={(e) => e.target.select()}
                onChange={(e) => setS2Hr(e.target.value)}
                className="w-full text-center bg-transparent font-black text-sm sm:text-lg text-white focus:outline-none focus:text-[#f43f5e]"
              />
            </div>

            {/* Cell 5: Ritmo */}
            <div className="p-1.5 sm:p-2 flex flex-col items-center justify-center">
              <span className="text-[9px] sm:text-[10px] text-slate-400 font-medium block">Ritmo</span>
              <span className="font-black text-sm sm:text-lg text-white">{s2Pace}</span>
            </div>

            {/* Cell 6: Velocidad */}
            <div className="p-1.5 sm:p-2 flex flex-col items-center justify-center">
              <span className="text-[9px] sm:text-[10px] text-slate-400 font-medium block">Velocidad</span>
              <div className="flex flex-col items-center">
                <span className="font-black text-sm sm:text-lg text-white leading-tight">{s2Physics.speedKmh}</span>
                <span className="text-[8px] font-normal text-slate-400">km/h</span>
              </div>
            </div>

            {/* Cell 7: DPS */}
            <div className="p-1.5 sm:p-2 flex flex-col items-center justify-center">
              <span className="text-[9px] sm:text-[10px] text-slate-400 font-medium block">DPS</span>
              <span className="font-black text-sm sm:text-lg text-white">{s2Physics.dps}m</span>
            </div>

            {/* Cell 8: Total */}
            <div className="p-1.5 sm:p-2 flex flex-col items-center justify-center">
              <span className="text-[9px] sm:text-[10px] text-slate-400 font-medium block">Total</span>
              <span className="font-black text-sm sm:text-lg text-white">{s2Physics.totalStrokesEst.toLocaleString()}</span>
            </div>
          </div>
        </div>

      </div>

      {/* Head-to-Head Telemetry Analysis Cards & Explosion/Endurance Metrics (Desktop only) */}
      {isComparisonMode && (
        <div className="hidden md:block space-y-6 animate-slideDown">
          
          {/* COMBINED COMPARISON MATRIX TABLE (Includes Explosión & Resistencia) */}
          <div className="p-5 rounded-2xl bg-gradient-to-r from-biolum-cyan/15 via-ocean-900 to-biolum-emerald/15 border border-biolum-cyan/40 space-y-4">
            <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-2 border-b border-ocean-750 pb-3">
              <div>
                <h4 className="font-extrabold text-white text-sm uppercase tracking-wider flex items-center gap-2">
                  <Gauge className="w-5 h-5 text-biolum-cyan animate-pulse" />
                  Matriz de Explosividad, Resistencia &amp; Tiempo Estimado ({raceDistance}m)
                </h4>
                <p className="text-xs text-slate-300">
                  Comparativa de aceleración propulsiva y economía cardiovascular.
                </p>
              </div>
              <span className="text-[10px] font-mono px-2.5 py-1 rounded-full bg-amber-400/20 text-amber-300 border border-amber-400/30 font-bold">
                Prueba Objetivo: {raceDistance} metros
              </span>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-6 gap-3 text-center text-xs font-mono">
              <div className="bg-ocean-950/80 p-3 rounded-xl border border-ocean-750">
                <div className="text-[10px] text-slate-400">⚡ Explosividad (Power)</div>
                <div className="font-bold text-amber-400 text-sm mt-0.5">{s1Explosiveness} vs {s2Explosiveness}</div>
                <div className="text-[9px] text-amber-300 mt-0.5 font-bold">
                  {parseFloat(s1Explosiveness) >= parseFloat(s2Explosiveness) ? 'Nadador 1 + Potencia' : 'Nadador 2 + Potencia'}
                </div>
              </div>

              <div className="bg-ocean-950/80 p-3 rounded-xl border border-ocean-750">
                <div className="text-[10px] text-slate-400">🫀 Costo Cardíaco</div>
                <div className="font-bold text-rose-400 text-sm mt-0.5">{s1Heartbeats100m} vs {s2Heartbeats100m} bpm/100m</div>
                <div className="text-[9px] text-rose-300 mt-0.5 font-bold">
                  {s1Heartbeats100m <= s2Heartbeats100m ? 'Nadador 1 + Eficiente' : 'Nadador 2 + Eficiente'}
                </div>
              </div>

              <div className="bg-ocean-950/80 p-3 rounded-xl border border-ocean-750">
                <div className="text-[10px] text-slate-400">⏱️ Tiempo {raceDistance}m</div>
                <div className="font-bold text-biolum-cyan text-sm mt-0.5">{s1RaceTime} vs {s2RaceTime}</div>
                <div className="text-[9px] text-biolum-cyan mt-0.5 font-bold">
                  {parseFloat(s1SpeedMps) >= parseFloat(s2SpeedMps) ? 'Nadador 1 Primero' : 'Nadador 2 Primero'}
                </div>
              </div>

              <div className="bg-ocean-950/80 p-3 rounded-xl border border-ocean-750">
                <div className="text-[10px] text-slate-400">DPS (Alcance/Brazada)</div>
                <div className="font-bold text-white text-sm mt-0.5">{s1DPS}m vs {s2DPS}m</div>
                <div className="text-[9px] text-slate-300 mt-0.5 font-bold">
                  {parseFloat(s1DPS) > parseFloat(s2DPS) ? 'Nadador 1 + Desliz' : 'Nadador 2 + Desliz'}
                </div>
              </div>

              <div className="bg-ocean-950/80 p-3 rounded-xl border border-ocean-750">
                <div className="text-[10px] text-slate-400">Cadencia (SPM)</div>
                <div className="font-bold text-white text-sm mt-0.5">{s1Spm} vs {s2Spm} spm</div>
                <div className="text-[9px] text-slate-300 mt-0.5 font-bold">
                  {Number(s1Spm) < Number(s2Spm) ? 'Nadador 1 Ritmo bajo' : 'Nadador 2 Ritmo bajo'}
                </div>
              </div>

              <div className="bg-ocean-950/80 p-3 rounded-xl border border-ocean-750">
                <div className="text-[10px] text-slate-400">SWOLF Score</div>
                <div className="font-bold text-amber-300 text-sm mt-0.5">{s1Swolf} vs {s2Swolf}</div>
                <div className="text-[9px] text-amber-300 mt-0.5 font-bold">
                  {Number(s1Swolf) <= Number(s2Swolf) ? 'Nadador 1 + Eficiente' : 'Nadador 2 + Eficiente'}
                </div>
              </div>
            </div>
          </div>

          {/* GRAND FINAL REPORT: DYNAMIC SWIMMER RANK & VIRTUAL SWIM COACH "CLASE DE NATACIÓN" (POSITIONED AFTER ALL SIMULATION DATA) */}
          <div className="space-y-4 pt-4 border-t border-ocean-800">
            <div className="flex items-center gap-2">
              <Trophy className="w-6 h-6 text-amber-400 animate-pulse" />
              <div>
                <h3 className="text-xl font-extrabold font-heading text-white tracking-tight">
                  🏆 Veredicto Final de Rango &amp; Informe de Clase de Natación
                </h3>
                <p className="text-xs text-slate-300">
                  Evaluación de nivel y feedback del entrenador calculado 100% dinámicamente según tus métricas de simulación.
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              
              {/* Swimmer 1 Coach Card & Dynamic Rank */}
              <div className="glass-panel p-5 rounded-2xl border border-biolum-cyan/50 space-y-4">
                <div className="flex items-center justify-between border-b border-ocean-800 pb-3">
                  <div>
                    <h4 className="font-bold text-white text-base font-heading">
                      {swimmer1Name}
                    </h4>
                    <span className="text-xs text-biolum-cyan font-mono font-semibold">{s1Rank.tierLevel}</span>
                  </div>

                  <div className="text-right">
                    <span className={`inline-block text-xs px-3 py-1 rounded-full font-mono font-bold border shadow-lg ${s1Rank.badgeColor}`}>
                      {s1Rank.rankName}
                    </span>
                    <span className="block text-[10px] text-slate-400 font-mono mt-1">
                      Puntuación Biomecánica: <strong className="text-biolum-cyan text-xs">{s1Rank.score}/100</strong>
                    </span>
                  </div>
                </div>

                <div className="bg-ocean-950/60 p-2.5 rounded-xl border border-ocean-800 text-xs text-slate-300 font-mono">
                  <span className="text-biolum-cyan font-bold block mb-0.5">Resumen de Nado:</span>
                  {s1Rank.summary}
                </div>

                {/* Lo que está MUY BIEN */}
                <div className="p-3 bg-biolum-emerald/15 border border-biolum-emerald/40 rounded-xl space-y-1">
                  <span className="text-xs font-bold text-biolum-emerald flex items-center gap-1.5">
                    <CheckCircle2 className="w-4 h-4 shrink-0" /> Lo que está MUY BIEN:
                  </span>
                  <p className="text-xs text-slate-200 leading-relaxed font-sans pl-5">
                    {s1Coach.wellDone}
                  </p>
                </div>

                {/* Qué MEJORAR */}
                <div className="p-3 bg-amber-400/15 border border-amber-400/40 rounded-xl space-y-1">
                  <span className="text-xs font-bold text-amber-300 flex items-center gap-1.5">
                    <AlertTriangle className="w-4 h-4 shrink-0" /> Qué MEJORAR:
                  </span>
                  <p className="text-xs text-slate-200 leading-relaxed font-sans pl-5">
                    {s1Coach.toImprove}
                  </p>
                </div>

                {/* Drill Técnico Recomendado */}
                <div className="p-3 bg-ocean-950 border border-ocean-750 rounded-xl space-y-1">
                  <span className="text-xs font-bold text-biolum-cyan flex items-center gap-1.5">
                    <Target className="w-4 h-4 shrink-0" /> Ejercicio Técnico Recomendado (Drill):
                  </span>
                  <p className="text-xs text-slate-300 leading-relaxed font-mono pl-5">
                    {s1Coach.drillDrill}
                  </p>
                </div>
              </div>

              {/* Swimmer 2 Coach Card & Dynamic Rank */}
              <div className="glass-panel p-5 rounded-2xl border border-rose-500/50 space-y-4">
                <div className="flex items-center justify-between border-b border-ocean-800 pb-3">
                  <div>
                    <h4 className="font-bold text-white text-base font-heading">
                      {swimmer2Name}
                    </h4>
                    <span className="text-xs text-rose-300 font-mono font-semibold">{s2Rank.tierLevel}</span>
                  </div>

                  <div className="text-right">
                    <span className={`inline-block text-xs px-3 py-1 rounded-full font-mono font-bold border shadow-lg ${s2Rank.badgeColor}`}>
                      {s2Rank.rankName}
                    </span>
                    <span className="block text-[10px] text-slate-400 font-mono mt-1">
                      Puntuación Biomecánica: <strong className="text-rose-300 text-xs">{s2Rank.score}/100</strong>
                    </span>
                  </div>
                </div>

                <div className="bg-ocean-950/60 p-2.5 rounded-xl border border-ocean-800 text-xs text-slate-300 font-mono">
                  <span className="text-rose-400 font-bold block mb-0.5">Resumen de Nado:</span>
                  {s2Rank.summary}
                </div>

                {/* Lo que está MUY BIEN */}
                <div className="p-3 bg-biolum-emerald/15 border border-biolum-emerald/40 rounded-xl space-y-1">
                  <span className="text-xs font-bold text-biolum-emerald flex items-center gap-1.5">
                    <CheckCircle2 className="w-4 h-4 shrink-0" /> Lo que está MUY BIEN:
                  </span>
                  <p className="text-xs text-slate-200 leading-relaxed font-sans pl-5">
                    {s2Coach.wellDone}
                  </p>
                </div>

                {/* Qué MEJORAR */}
                <div className="p-3 bg-amber-400/15 border border-amber-400/40 rounded-xl space-y-1">
                  <span className="text-xs font-bold text-amber-300 flex items-center gap-1.5">
                    <AlertTriangle className="w-4 h-4 shrink-0" /> Qué MEJORAR:
                  </span>
                  <p className="text-xs text-slate-200 leading-relaxed font-sans pl-5">
                    {s2Coach.toImprove}
                  </p>
                </div>

                {/* Drill Técnico Recomendado */}
                <div className="p-3 bg-ocean-950 border border-ocean-750 rounded-xl space-y-1">
                  <span className="text-xs font-bold text-biolum-cyan flex items-center gap-1.5">
                    <Target className="w-4 h-4 shrink-0" /> Ejercicio Técnico Recomendado (Drill):
                  </span>
                  <p className="text-xs text-slate-300 leading-relaxed font-mono pl-5">
                    {s2Coach.drillDrill}
                  </p>
                </div>
              </div>

            </div>
          </div>

        </div>
      )}

      {/* SHARE SIMULATION MODAL */}
      {isShareModalOpen && (
        <div className="fixed inset-0 bg-ocean-950/80 backdrop-blur-md z-50 flex items-center justify-center p-4">
          <div className="glass-panel-glow max-w-md w-full p-6 rounded-3xl border border-biolum-cyan/50 space-y-5 animate-scaleUp shadow-2xl relative">
            <div className="flex items-center justify-between border-b border-ocean-800 pb-3">
              <div className="flex items-center gap-2">
                <Share2 className="w-5 h-5 text-amber-400" />
                <h3 className="text-lg font-black font-heading text-white">
                  Compartir Simulación Comparativa
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setIsShareModalOpen(false)}
                className="text-slate-400 hover:text-white font-bold text-sm"
              >
                ✕
              </button>
            </div>

            <p className="text-xs text-slate-300 leading-relaxed">
              Copia este enlace único. Al enviárselo a otro nadador o amigo, la web cargará automáticamente esta misma configuración de SWOLF, brazadas, cadencia y velocidad.
            </p>

            <div className="p-3 bg-ocean-950 border border-ocean-750 rounded-2xl space-y-2">
              <span className="text-[10px] text-slate-400 font-mono block">Enlace directo generado:</span>
              <input
                type="text"
                readOnly
                value={generateShareUrl()}
                className="w-full bg-ocean-900 text-biolum-cyan font-mono text-xs px-3 py-2 rounded-xl border border-ocean-700 focus:outline-none"
              />
            </div>

            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={handleCopyShareLink}
                className="flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-gradient-to-r from-biolum-cyan to-biolum-emerald text-ocean-950 font-black text-xs shadow-lg shadow-biolum-cyan/20 hover:brightness-110 transition-all"
              >
                {copiedLink ? (
                  <>
                    <Check className="w-4 h-4 text-ocean-950" /> ¡Enlace Copiado al Portapapeles!
                  </>
                ) : (
                  <>
                    <Copy className="w-4 h-4" /> Copiar Enlace de Simulación
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
