import React, { useState, useEffect } from 'react';
import {
  X,
  Lock,
  Mail,
  ShieldCheck,
  Cpu,
  Database,
  CheckCircle2,
  AlertCircle,
  RefreshCw,
  Zap,
  UploadCloud,
  ExternalLink,
  Info,
  Sliders,
} from 'lucide-react';
import { garminConnectService } from '../services/garminConnectService';
import { swimmerProfileService } from '../services/swimmerProfileService';
import { dbService } from '../services/firebaseService';
import { parseGarminCsv } from '../services/garminCsvParser';
import { aquaticAudio } from '../audio/aquaticAudioEngine';

export const GarminConnectModal = ({ isOpen, onClose, onSyncComplete }) => {
  const [activeTab, setActiveTab] = useState('credentials'); // 'credentials' | 'upload' | 'metrics'
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  // Custom metrics inputs
  const [realDist, setRealDist] = useState(1000);
  const [realPaceMin, setRealPaceMin] = useState(1);
  const [realPaceSec, setRealPaceSec] = useState(26);
  const [realHr, setRealHr] = useState(145);
  const [realStrokes, setRealStrokes] = useState(14);
  const [realPoolLen, setRealPoolLen] = useState(25);

  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [connectionInfo, setConnectionInfo] = useState({ isConnected: false });
  const [uploadSuccess, setUploadSuccess] = useState('');

  // Load existing connection on modal open
  useEffect(() => {
    if (isOpen) {
      garminConnectService.getStatus().then((status) => {
        setConnectionInfo(status);
        if (status.userEmail) {
          setEmail(status.userEmail);
        }
      });
      setErrorMessage('');
      setUploadSuccess('');
    }
  }, [isOpen]);

  if (!isOpen) return null;

  // Handle Credentials Login Submit (Email + Password)
  const handleCredentialsSubmit = async (e) => {
    e.preventDefault();
    setErrorMessage('');
    setIsLoading(true);

    try {
      aquaticAudio.playSplash();
    } catch (err) {}

    try {
      const result = await garminConnectService.connectAndSync(email, password);

      try {
        aquaticAudio.playSonar();
      } catch (err) {}

      setConnectionInfo(result.connectionInfo);
      setIsLoading(false);

      if (onSyncComplete) {
        onSyncComplete(result.sessions);
      }
      setTimeout(() => {
        onClose();
      }, 300);
    } catch (err) {
      console.error(err);
      setIsLoading(false);
      setErrorMessage(err.message || 'Error al conectar con los servidores de Garmin.');
    }
  };

  // Handle Real Garmin File Upload (.CSV / .FIT)
  const handleFileUpload = (file) => {
    if (!file) return;
    setIsLoading(true);
    setUploadSuccess('');
    setErrorMessage('');

    try {
      aquaticAudio.playSplash();
    } catch (err) {}

    const reader = new FileReader();
    reader.onload = async (e) => {
      const text = e.target.result || '';
      const parsedSessions = parseGarminCsv(text);

      if (parsedSessions.length === 0) {
        setIsLoading(false);
        setErrorMessage('El archivo CSV no contiene registros de natación válidos o reconocibles.');
        return;
      }

      // Clear old cached sessions in dbService before saving new ones
      await dbService.clearAll();
      await dbService.saveSessionsBatch(parsedSessions);
      await garminConnectService.connectAndSync(email || 'usuario_garmin@connect.com', 'dummy');

      // Replace CSV workouts in active swimmer profile
      const profiles = swimmerProfileService.getProfiles();
      if (profiles.length > 0) {
        const targetId = profiles[0].id;
        swimmerProfileService.replaceSwimmerWorkouts(targetId, parsedSessions);
      }

      try {
        aquaticAudio.playSonar();
      } catch (err) {}

      setIsLoading(false);
      setUploadSuccess(`¡Éxito! Se importaron ${parsedSessions.length} actividades reales y se recalcularon los promedios.`);
      if (onSyncComplete) {
        onSyncComplete(parsedSessions);
      }
      setTimeout(() => onClose(), 600);
    };

    reader.readAsText(file);
  };

  // Handle Real Metrics Manual Entry
  const handleMetricsSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    const userLabel = email ? email.split('@')[0] : 'Coach';
    
    const pace100Secs = Number(realPaceMin) * 60 + Number(realPaceSec);
    const timeSecs = (Number(realDist) / 100) * pace100Secs;
    const pMins = Math.floor(pace100Secs / 60);
    const pSecs = pace100Secs % 60;
    const paceStr = `${pMins}:${pSecs < 10 ? '0' : ''}${pSecs}`;
    
    // SWOLF is typically (Time for 1 length) + (Strokes per length)
    // Time for 1 length (25m) = pace100Secs / 4 (assuming 25m pool)
    const timePerLength = pace100Secs / (100 / Number(realPoolLen));
    const calcSwolf = Math.round(timePerLength + Number(realStrokes));

    const realSession = {
      id: `garmin-manual-${Date.now()}`,
      date: new Date().toISOString().split('T')[0],
      title: `Sesión Manual (Coach) - ${realDist}m`,
      poolLength: Number(realPoolLen),
      totalDistance: Number(realDist),
      totalTimeSeconds: timeSecs,
      avgSwolf: calcSwolf,
      avgPace100m: paceStr,
      avgHeartRate: Number(realHr),
      maxHeartRate: Number(realHr) + 15,
      totalStrokes: Math.round((Number(realDist) / Number(realPoolLen)) * Number(realStrokes)),
      calories: Math.round(Number(realDist) * 0.22),
      trainingLoad: Math.round(Number(realDist) * 0.06),
      source: 'Ingreso Manual Rápido (Coach)',
      laps: [
        { lap: 1, dist: Number(realDist) / 2, pace: paceStr, swolf: calcSwolf, strokes: Number(realStrokes), hr: Number(realHr) - 2 },
        { lap: 2, dist: Number(realDist) / 2, pace: paceStr, swolf: calcSwolf + 1, strokes: Number(realStrokes), hr: Number(realHr) + 2 },
      ],
      strokesDistribution: { freestyle: 90, backstroke: 10, breaststroke: 0, butterfly: 0 },
      hrZones: { z1: 20, z2: 60, z3: 20, z4: 0 },
    };

    await dbService.saveSessionsBatch([realSession]);
    await garminConnectService.connectAndSync(email || `${userLabel}@garmin.com`, 'dummy');

    try {
      aquaticAudio.playSonar();
    } catch (err) {}

    setIsLoading(false);
    if (onSyncComplete) {
      onSyncComplete([realSession]);
    }
    setTimeout(() => onClose(), 300);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-ocean-950/85 backdrop-blur-md animate-fadeIn">
      <div className="glass-panel-glow w-full max-w-xl rounded-2xl p-6 md:p-8 text-slate-100 max-h-[92vh] overflow-y-auto relative border border-biolum-cyan/40 shadow-2xl space-y-6">
        
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-slate-400 hover:text-biolum-cyan transition-colors p-2 rounded-full hover:bg-ocean-800/50"
        >
          <X className="w-6 h-6" />
        </button>

        {/* Header */}
        <div className="flex items-center gap-3 border-b border-ocean-700/60 pb-4">
          <div className="p-3 bg-biolum-cyan/10 border border-biolum-cyan/40 rounded-xl text-biolum-cyan shadow-lg shadow-biolum-cyan/10">
            <Cpu className="w-7 h-7 animate-pulse" />
          </div>
          <div>
            <h2 className="text-2xl font-bold font-heading text-white flex items-center gap-2">
              Conexión Garmin Connect
              <span className="text-xs px-2 py-0.5 rounded-full bg-biolum-cyan/20 text-biolum-cyan border border-biolum-cyan/40 font-mono">
                API & DB
              </span>
            </h2>
            <p className="text-sm text-slate-300">
              Conecta tu cuenta de Garmin Connect para sincronizar a la Base de Datos.
            </p>
          </div>
        </div>

        {/* Tab Selector */}
        <div className="flex flex-col sm:flex-row items-center gap-2 bg-ocean-950 p-1 rounded-xl border border-ocean-700 text-xs font-bold">
          <button
            onClick={() => setActiveTab('credentials')}
            className={`flex-1 w-full py-2.5 rounded-lg transition-all flex items-center justify-center gap-1.5 ${
              activeTab === 'credentials'
                ? 'bg-biolum-cyan text-ocean-950 shadow-md'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Zap className="w-4 h-4" />
            1. Login
          </button>
          <button
            onClick={() => setActiveTab('upload')}
            className={`flex-1 w-full py-2.5 rounded-lg transition-all flex items-center justify-center gap-1.5 ${
              activeTab === 'upload'
                ? 'bg-biolum-emerald text-ocean-950 shadow-md'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <UploadCloud className="w-4 h-4" />
            2. CSV/.FIT
          </button>
          <button
            onClick={() => setActiveTab('manual')}
            className={`flex-1 w-full py-2.5 rounded-lg transition-all flex items-center justify-center gap-1.5 ${
              activeTab === 'manual'
                ? 'bg-amber-400 text-ocean-950 shadow-md'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Sliders className="w-4 h-4" />
            3. Carga Rápida
          </button>
        </div>

        {/* TAB 1: Credentials Login (Email AND Password) */}
        {activeTab === 'credentials' && (
          <form onSubmit={handleCredentialsSubmit} className="space-y-4">
            {errorMessage && (
              <div className="p-3.5 bg-rose-500/15 border border-rose-500/40 rounded-xl text-rose-300 text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
                <span>{errorMessage}</span>
              </div>
            )}

            {/* Email Field */}
            <div className="space-y-1">
              <label className="text-xs font-semibold text-slate-300 flex items-center gap-1.5">
                <Mail className="w-3.5 h-3.5 text-biolum-cyan" />
                Correo Electrónico de Garmin Connect
              </label>
              <input
                type="email"
                required
                disabled={isLoading}
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="ejemplo@deportista.com"
                className="w-full px-4 py-2.5 rounded-xl bg-ocean-950 border border-ocean-700 text-slate-100 placeholder-slate-500 text-sm focus:outline-none focus:border-biolum-cyan"
              />
            </div>

            {/* Password Field */}
            <div className="space-y-1">
              <label className="text-xs font-semibold text-slate-300 flex items-center gap-1.5">
                <Lock className="w-3.5 h-3.5 text-biolum-cyan" />
                Contraseña de Garmin Connect
              </label>
              <input
                type="password"
                required
                disabled={isLoading}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••••••"
                className="w-full px-4 py-2.5 rounded-xl bg-ocean-950 border border-ocean-700 text-slate-100 placeholder-slate-500 text-sm font-mono focus:outline-none focus:border-biolum-cyan"
              />
            </div>

            {/* Database target info */}
            <div className="p-3.5 bg-ocean-900/60 rounded-xl border border-ocean-750 text-xs text-slate-300 flex items-center justify-between">
              <span className="flex items-center gap-1.5 font-semibold text-biolum-teal">
                <Database className="w-4 h-4" /> Destino Base de Datos:
              </span>
              <span className="text-[11px] text-biolum-cyan font-mono font-bold">Firebase Firestore Cloud 🟢</span>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={isLoading}
              className="w-full py-3.5 px-4 rounded-xl font-bold text-white bg-gradient-to-r from-biolum-cyan via-ocean-600 to-biolum-teal hover:from-biolum-cyan hover:to-biolum-teal border border-biolum-cyan/50 text-xs flex items-center justify-center gap-2 shadow-lg shadow-biolum-cyan/20 transition-all disabled:opacity-50"
            >
              {isLoading ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" /> Autenticando y Sincronizando BD...
                </>
              ) : (
                <>
                  <Zap className="w-4 h-4 text-amber-300" />
                  Conectar Garmin & Sincronizar Base de Datos
                </>
              )}
            </button>

            <div className="flex items-center justify-center gap-2 text-[11px] text-slate-400 pt-2 border-t border-ocean-800">
              <ShieldCheck className="w-4 h-4 text-biolum-emerald" />
              <span>Conexión cifrada SSL/TLS. Credenciales protegidas.</span>
            </div>
          </form>
        )}

        {/* TAB 2: File Upload (.CSV / .FIT) */}
        {activeTab === 'upload' && (
          <div className="space-y-4">
            <div className="border-2 border-dashed border-biolum-cyan/50 hover:border-biolum-cyan rounded-2xl p-6 text-center bg-ocean-950/60 transition-all space-y-3">
              <UploadCloud className="w-10 h-10 text-biolum-cyan mx-auto animate-bounce" />
              <div>
                <h4 className="font-bold text-white text-sm">
                  Carga el archivo exportado de tu reloj Garmin
                </h4>
                <p className="text-xs text-slate-400 mt-1">
                  Descárgalo desde <a href="https://connect.garmin.com" target="_blank" rel="noreferrer" className="text-biolum-cyan underline">Garmin Connect Web</a> (Opción Exportar a CSV / FIT).
                </p>
              </div>

              <label className="inline-block px-5 py-2.5 rounded-xl bg-biolum-cyan text-ocean-950 font-bold text-xs cursor-pointer hover:bg-white transition-all shadow-lg shadow-biolum-cyan/20">
                Seleccionar Archivo de Garmin
                <input
                  type="file"
                  accept=".csv,.fit"
                  className="hidden"
                  onChange={(e) => e.target.files?.[0] && handleFileUpload(e.target.files[0])}
                />
              </label>
            </div>

            {uploadSuccess && (
              <div className="p-3.5 bg-biolum-emerald/15 border border-biolum-emerald/40 rounded-xl text-biolum-emerald text-xs flex items-center gap-2 font-medium">
                <CheckCircle2 className="w-5 h-5 shrink-0" />
                <span>{uploadSuccess}</span>
              </div>
            )}

            <div className="pt-3 border-t border-ocean-800 flex justify-center">
              <button
                type="button"
                onClick={async () => {
                  await dbService.clearAll();
                  swimmerProfileService.resetToDefaults();
                  setUploadSuccess('Se limpió el historial almacenado y se reestablecieron los datos.');
                  if (onSyncComplete) onSyncComplete([]);
                }}
                className="text-xs text-rose-400 hover:text-rose-300 underline font-mono flex items-center gap-1"
              >
                <X className="w-3.5 h-3.5" /> Limpiar datos anteriores guardados en caché
              </button>
            </div>
          </div>
        )}

        {/* TAB 3: Manual Quick Entry */}
        {activeTab === 'manual' && (
          <form onSubmit={handleMetricsSubmit} className="space-y-4">
            <div className="p-4 bg-ocean-950/80 rounded-2xl border border-ocean-750 text-xs text-slate-300 space-y-2">
              <p>
                <strong className="text-amber-400 font-bold">Modo Entrenador:</strong> Ingresa el resumen que aparece en la pantalla del reloj para generar una simulación instantánea.
              </p>
            </div>

            <div className="grid grid-cols-2 gap-4">
              {/* Distancia */}
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-300 flex items-center gap-1">Distancia (m)</label>
                <input
                  type="number"
                  required
                  min="50"
                  step="25"
                  value={realDist}
                  onChange={(e) => setRealDist(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl bg-ocean-900 border border-ocean-700 text-white font-mono text-sm focus:outline-none focus:border-amber-400"
                />
              </div>

              {/* Pool Length */}
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-300 flex items-center gap-1">Piscina (m)</label>
                <select
                  value={realPoolLen}
                  onChange={(e) => setRealPoolLen(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl bg-ocean-900 border border-ocean-700 text-white font-mono text-sm focus:outline-none focus:border-amber-400"
                >
                  <option value={25}>25m (Corta)</option>
                  <option value={50}>50m (Olímpica)</option>
                </select>
              </div>

              {/* Ritmo / 100m */}
              <div className="space-y-1 col-span-2">
                <label className="text-xs font-bold text-slate-300 flex items-center gap-1">Ritmo Medio por 100m (MM:SS)</label>
                <div className="flex gap-2 items-center">
                  <input
                    type="number"
                    required
                    min="0"
                    max="10"
                    value={realPaceMin}
                    onChange={(e) => setRealPaceMin(e.target.value)}
                    className="w-full px-4 py-2.5 rounded-xl bg-ocean-900 border border-ocean-700 text-white font-mono text-sm focus:outline-none focus:border-amber-400 text-center"
                    placeholder="Min"
                  />
                  <span className="font-bold text-white">:</span>
                  <input
                    type="number"
                    required
                    min="0"
                    max="59"
                    value={realPaceSec}
                    onChange={(e) => setRealPaceSec(e.target.value)}
                    className="w-full px-4 py-2.5 rounded-xl bg-ocean-900 border border-ocean-700 text-white font-mono text-sm focus:outline-none focus:border-amber-400 text-center"
                    placeholder="Seg"
                  />
                </div>
              </div>

              {/* Pulso (HR) */}
              <div className="space-y-1">
                <label className="text-xs font-bold text-rose-400 flex items-center gap-1">Pulso Medio (ppm)</label>
                <input
                  type="number"
                  required
                  min="60"
                  max="220"
                  value={realHr}
                  onChange={(e) => setRealHr(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl bg-ocean-900 border border-ocean-700 text-white font-mono text-sm focus:outline-none focus:border-rose-400"
                />
              </div>

              {/* Brazadas */}
              <div className="space-y-1">
                <label className="text-xs font-bold text-biolum-emerald flex items-center gap-1">Brazadas/largo</label>
                <input
                  type="number"
                  required
                  min="5"
                  max="50"
                  step="0.1"
                  value={realStrokes}
                  onChange={(e) => setRealStrokes(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl bg-ocean-900 border border-ocean-700 text-white font-mono text-sm focus:outline-none focus:border-biolum-emerald"
                />
              </div>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={isLoading}
              className="w-full py-3.5 px-4 rounded-xl font-bold text-ocean-950 bg-amber-400 hover:bg-amber-300 text-sm flex items-center justify-center gap-2 shadow-lg shadow-amber-500/20 transition-all mt-4"
            >
              <Zap className="w-4 h-4" />
              Generar Simulación Automática
            </button>
          </form>
        )}

      </div>
    </div>
  );
};
