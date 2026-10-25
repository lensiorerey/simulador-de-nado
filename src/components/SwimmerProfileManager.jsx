import React, { useState } from 'react';
import {
  User,
  Users,
  Plus,
  Trash2,
  CheckCircle2,
  Activity,
  Flame,
  Zap,
  TrendingDown,
  Upload,
  RefreshCw,
  Award,
  Sliders,
  ShieldCheck,
  Check,
} from 'lucide-react';
import { swimmerProfileService } from '../services/swimmerProfileService';
import { aquaticAudio } from '../audio/aquaticAudioEngine';

export const SwimmerProfileManager = ({
  profiles = [],
  activeSwimmerIds = [],
  onToggleActiveSwimmer,
  onProfilesUpdated,
  onOpenGarminConnect,
}) => {
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showAddWorkoutModal, setShowAddWorkoutModal] = useState(false);
  const [selectedSwimmerForWorkout, setSelectedSwimmerForWorkout] = useState(null);

  // New Swimmer Form State
  const [newName, setNewName] = useState('');
  const [newGender, setNewGender] = useState('male');
  const [newColor, setNewColor] = useState('#00F2FE');
  const [newSwolf, setNewSwolf] = useState(33);
  const [newPace, setNewPace] = useState('1:26');
  const [newStrokes, setNewStrokes] = useState(14);
  const [newHr, setNewHr] = useState(145);
  const [newBio, setNewBio] = useState('');

  // New Workout Form State
  const [wTitle, setWTitle] = useState('Entrenamiento Serie Aeróbica');
  const [wDist, setWDist] = useState(2500);
  const [wPace, setWPace] = useState('1:25');
  const [wSwolf, setWSwolf] = useState(31);
  const [wHr, setWHr] = useState(148);
  const [wStrokes, setWStrokes] = useState(13);

  // Handle Create New Swimmer
  const handleCreateSubmit = (e) => {
    e.preventDefault();
    if (!newName.trim()) return;

    swimmerProfileService.createSwimmer({
      name: newName,
      avatarGender: newGender,
      avatarColor: newColor,
      customSwolf: Number(newSwolf),
      customPace: newPace,
      customStrokes: Number(newStrokes),
      customHr: Number(newHr),
      bio: newBio || 'Perfil personalizado de natación.',
    });

    try {
      aquaticAudio.playSplash();
    } catch (err) {}

    setShowCreateModal(false);
    setNewName('');
    setNewBio('');
    if (onProfilesUpdated) onProfilesUpdated();
  };

  // Handle Add Workout to Swimmer
  const handleAddWorkoutSubmit = (e) => {
    e.preventDefault();
    if (!selectedSwimmerForWorkout) return;

    const [m, s] = wPace.split(':').map(Number);
    const paceSec = (m || 1) * 60 + (s || 25);
    const timeSec = (Number(wDist) / 100) * paceSec;

    swimmerProfileService.addWorkoutToSwimmer(selectedSwimmerForWorkout.id, {
      id: `w-${Date.now()}`,
      title: wTitle,
      date: new Date().toISOString().split('T')[0],
      poolLength: 25,
      totalDistance: Number(wDist),
      totalTimeSeconds: timeSec,
      avgSwolf: Number(wSwolf),
      avgPace100m: wPace,
      avgHeartRate: Number(wHr),
      avgStrokesPerLap: Number(wStrokes),
      cadenceSpm: 56,
    });

    try {
      aquaticAudio.playSonar();
    } catch (err) {}

    setShowAddWorkoutModal(false);
    if (onProfilesUpdated) onProfilesUpdated();
  };

  // Preset Colors for Avatar selection
  const colorOptions = ['#00F2FE', '#F43F5E', '#10B981', '#A855F7', '#F59E0B', '#3B82F6'];

  return (
    <div className="space-y-6">
      
      {/* Top Banner & Actions */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 glass-panel p-6 rounded-3xl border border-biolum-cyan/30">
        <div>
          <div className="flex items-center gap-2">
            <Users className="w-6 h-6 text-biolum-cyan" />
            <h3 className="text-xl font-black font-heading text-white tracking-tight">
              Gestor de Nadadores &amp; <span className="text-biolum-cyan">Promedios Garmin</span>
            </h3>
          </div>
          <p className="text-xs text-slate-300 font-mono mt-1 max-w-xl">
            Genera perfiles individuales a partir del promedio ponderado de todos los entrenamientos Garmin. Selecciona quiénes participan en la simulación multi-carril.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={onOpenGarminConnect}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-ocean-950 hover:bg-ocean-800 text-biolum-cyan border border-biolum-cyan/40 font-extrabold text-xs transition-all shadow-md"
          >
            <RefreshCw className="w-4 h-4" /> Conectar Garmin Connect
          </button>

          <button
            onClick={() => setShowCreateModal(true)}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-biolum-cyan to-biolum-aqua text-ocean-950 font-extrabold text-xs shadow-lg shadow-biolum-cyan/20 hover:brightness-110 transition-all"
          >
            <Plus className="w-4 h-4" /> Nuevo Nadador
          </button>
        </div>
      </div>

      {/* Swimmer Profiles Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {profiles.map((swimmer) => {
          const avg = swimmer.averages || {};
          const isActiveInSim = activeSwimmerIds.includes(swimmer.id);

          return (
            <div
              key={swimmer.id}
              className={`glass-panel p-6 rounded-3xl border transition-all relative overflow-hidden ${
                isActiveInSim
                  ? 'border-biolum-cyan bg-ocean-900/60 shadow-xl shadow-biolum-cyan/10'
                  : 'border-ocean-750 opacity-80 hover:opacity-100'
              }`}
            >
              {/* Top Row: Avatar & Toggle Switch */}
              <div className="flex items-start justify-between gap-4 mb-4">
                <div className="flex items-center gap-3">
                  <div
                    className="w-12 h-12 rounded-2xl flex items-center justify-center font-black text-ocean-950 text-lg shadow-lg"
                    style={{ backgroundColor: swimmer.avatarColor || '#00F2FE' }}
                  >
                    {swimmer.name.charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h4 className="text-base font-extrabold text-white font-heading">
                        {swimmer.name}
                      </h4>
                      {swimmer.garminConnected && (
                        <span className="n64-badge text-[9px] bg-biolum-cyan/20 text-biolum-cyan border border-biolum-cyan/40 px-2 py-0.5 rounded font-mono font-bold">
                          GARMIN OK
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-slate-300 line-clamp-1">{swimmer.bio}</p>
                  </div>
                </div>

                {/* Active Switch */}
                <button
                  onClick={() => onToggleActiveSwimmer(swimmer.id)}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl font-mono text-xs font-bold transition-all ${
                    isActiveInSim
                      ? 'bg-biolum-cyan text-ocean-950 shadow-md shadow-biolum-cyan/30'
                      : 'bg-ocean-950 text-slate-400 border border-ocean-750'
                  }`}
                >
                  {isActiveInSim ? (
                    <>
                      <Check className="w-3.5 h-3.5" /> En Simulación
                    </>
                  ) : (
                    '+ Incluir'
                  )}
                </button>
              </div>

              {/* Main Consolidated Garmin Averages Grid */}
              <div className="bg-ocean-950/80 p-4 rounded-2xl border border-ocean-750/80 grid grid-cols-2 sm:grid-cols-4 gap-3 my-4">
                <div>
                  <span className="text-[10px] text-slate-400 font-mono block">Ritmo Promed.</span>
                  <span className="text-sm font-extrabold font-mono text-biolum-cyan">
                    {avg.avgPaceFormatted || '1:26'}/100m
                  </span>
                </div>

                <div>
                  <span className="text-[10px] text-slate-400 font-mono block">SWOLF Promed.</span>
                  <span className="text-sm font-extrabold font-mono text-amber-400">
                    {avg.avgSwolf || 33}
                  </span>
                </div>

                <div>
                  <span className="text-[10px] text-slate-400 font-mono block">DPS (Dist/Brazada)</span>
                  <span className="text-sm font-extrabold font-mono text-emerald-400">
                    {avg.avgDPS || 1.79}m
                  </span>
                </div>

                <div>
                  <span className="text-[10px] text-slate-400 font-mono block">Eficiencia</span>
                  <span className="text-sm font-extrabold font-mono text-rose-400">
                    {avg.efficiencyScore || 85}/100
                  </span>
                </div>
              </div>

              {/* Workout Statistics Summary */}
              <div className="flex items-center justify-between text-xs text-slate-300 font-mono pt-2 border-t border-ocean-800">
                <span>
                  {swimmer.workouts ? swimmer.workouts.length : 0} Entrenamientos ({avg.totalDistanceKm || 0} km acumulados)
                </span>
                <button
                  onClick={() => {
                    setSelectedSwimmerForWorkout(swimmer);
                    setShowAddWorkoutModal(true);
                  }}
                  className="text-biolum-cyan hover:underline flex items-center gap-1 font-semibold"
                >
                  <Plus className="w-3.5 h-3.5" /> + Añadir Sesión
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* Modal: Create New Swimmer */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-ocean-950/80 backdrop-blur-md z-50 flex items-center justify-center p-4">
          <div className="glass-panel p-6 rounded-3xl border border-biolum-cyan/40 max-w-lg w-full">
            <h3 className="text-xl font-extrabold text-white font-heading mb-4">
              Crear Nuevo Perfil de Nadador
            </h3>
            <form onSubmit={handleCreateSubmit} className="space-y-4 text-xs font-mono">
              <div>
                <label className="block text-slate-300 mb-1">Nombre Completo</label>
                <input
                  type="text"
                  required
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  placeholder="Ej. Lucas Silva"
                  className="w-full bg-ocean-950 border border-ocean-750 rounded-xl px-3 py-2 text-white focus:border-biolum-cyan focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-300 mb-1">Género Avatar</label>
                  <select
                    value={newGender}
                    onChange={(e) => setNewGender(e.target.value)}
                    className="w-full bg-ocean-950 border border-ocean-750 rounded-xl px-3 py-2 text-white"
                  >
                    <option value="male">Masculino ♂</option>
                    <option value="female">Femenino ♀</option>
                  </select>
                </div>

                <div>
                  <label className="block text-slate-300 mb-1">Color de Carril</label>
                  <div className="flex items-center gap-2 pt-1">
                    {colorOptions.map((c) => (
                      <button
                        type="button"
                        key={c}
                        onClick={() => setNewColor(c)}
                        className={`w-6 h-6 rounded-full border-2 transition-all ${
                          newColor === c ? 'border-white scale-110' : 'border-transparent'
                        }`}
                        style={{ backgroundColor: c }}
                      />
                    ))}
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-300 mb-1">SWOLF Inicial</label>
                  <input
                    type="number"
                    value={newSwolf}
                    onChange={(e) => setNewSwolf(e.target.value)}
                    className="w-full bg-ocean-950 border border-ocean-750 rounded-xl px-3 py-2 text-white"
                  />
                </div>

                <div>
                  <label className="block text-slate-300 mb-1">Ritmo/100m Inicial</label>
                  <input
                    type="text"
                    value={newPace}
                    onChange={(e) => setNewPace(e.target.value)}
                    className="w-full bg-ocean-950 border border-ocean-750 rounded-xl px-3 py-2 text-white"
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-300 mb-1">Nota / Biografía</label>
                <input
                  type="text"
                  value={newBio}
                  onChange={(e) => setNewBio(e.target.value)}
                  placeholder="Ej. Nadador Máster buscando bajar SWOLF de 35."
                  className="w-full bg-ocean-950 border border-ocean-750 rounded-xl px-3 py-2 text-white"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-4 border-t border-ocean-800">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="px-4 py-2 rounded-xl bg-ocean-900 text-slate-300 font-bold"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-biolum-cyan text-ocean-950 font-black shadow-lg shadow-biolum-cyan/30"
                >
                  Guardar Nadador
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Add Workout Session */}
      {showAddWorkoutModal && selectedSwimmerForWorkout && (
        <div className="fixed inset-0 bg-ocean-950/80 backdrop-blur-md z-50 flex items-center justify-center p-4">
          <div className="glass-panel p-6 rounded-3xl border border-biolum-cyan/40 max-w-lg w-full">
            <h3 className="text-xl font-extrabold text-white font-heading mb-1">
              Añadir Entrenamiento Garmin a {selectedSwimmerForWorkout.name}
            </h3>
            <p className="text-xs text-slate-400 font-mono mb-4">
              Los datos ingresados recalcularán automáticamente el promedio hidrodinámico general.
            </p>

            <form onSubmit={handleAddWorkoutSubmit} className="space-y-4 text-xs font-mono">
              <div>
                <label className="block text-slate-300 mb-1">Título del Entrenamiento</label>
                <input
                  type="text"
                  required
                  value={wTitle}
                  onChange={(e) => setWTitle(e.target.value)}
                  className="w-full bg-ocean-950 border border-ocean-750 rounded-xl px-3 py-2 text-white"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-300 mb-1">Distancia Total (metros)</label>
                  <input
                    type="number"
                    value={wDist}
                    onChange={(e) => setWDist(e.target.value)}
                    className="w-full bg-ocean-950 border border-ocean-750 rounded-xl px-3 py-2 text-white"
                  />
                </div>

                <div>
                  <label className="block text-slate-300 mb-1">Ritmo Promedio / 100m</label>
                  <input
                    type="text"
                    value={wPace}
                    onChange={(e) => setWPace(e.target.value)}
                    placeholder="1:25"
                    className="w-full bg-ocean-950 border border-ocean-750 rounded-xl px-3 py-2 text-white"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-slate-300 mb-1">SWOLF</label>
                  <input
                    type="number"
                    value={wSwolf}
                    onChange={(e) => setWSwolf(e.target.value)}
                    className="w-full bg-ocean-950 border border-ocean-750 rounded-xl px-3 py-2 text-white"
                  />
                </div>

                <div>
                  <label className="block text-slate-300 mb-1">Brazadas/Largo</label>
                  <input
                    type="number"
                    value={wStrokes}
                    onChange={(e) => setWStrokes(e.target.value)}
                    className="w-full bg-ocean-950 border border-ocean-750 rounded-xl px-3 py-2 text-white"
                  />
                </div>

                <div>
                  <label className="block text-slate-300 mb-1">Ritmo Cardíaco</label>
                  <input
                    type="number"
                    value={wHr}
                    onChange={(e) => setWHr(e.target.value)}
                    className="w-full bg-ocean-950 border border-ocean-750 rounded-xl px-3 py-2 text-white"
                  />
                </div>
              </div>

              <div className="flex items-center justify-end gap-3 pt-4 border-t border-ocean-800">
                <button
                  type="button"
                  onClick={() => setShowAddWorkoutModal(false)}
                  className="px-4 py-2 rounded-xl bg-ocean-900 text-slate-300 font-bold"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-biolum-cyan text-ocean-950 font-black shadow-lg shadow-biolum-cyan/30"
                >
                  Cargar Sesión &amp; Recalcular
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};
