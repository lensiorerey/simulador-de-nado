import React from 'react';
import {
  Swords,
  Trophy,
  Activity,
  Zap,
  TrendingDown,
  Gauge,
  Award,
  Users,
  CheckCircle2,
  AlertCircle,
} from 'lucide-react';
import { Bar } from 'react-chartjs-2';

export const SwimmerComparisonMatrix = ({ activeSwimmers = [] }) => {
  if (!activeSwimmers || activeSwimmers.length === 0) {
    return (
      <div className="glass-panel p-8 rounded-3xl border border-ocean-750 text-center">
        <Users className="w-10 h-10 text-slate-500 mx-auto mb-3 animate-pulse" />
        <h4 className="text-lg font-bold text-white">No hay nadadores seleccionados</h4>
        <p className="text-xs text-slate-400 font-mono mt-1">
          Ve a la pestaña 'Perfiles &amp; Promedios' para incluir nadadores en la simulación comparativa.
        </p>
      </div>
    );
  }

  // Calculate fastest pace for relative gap calculations
  const sortedByPace = [...activeSwimmers].sort(
    (a, b) => (a.averages?.avgPace100mSec || 90) - (b.averages?.avgPace100mSec || 90)
  );
  const leaderSwimmer = sortedByPace[0];
  const leaderPaceSec = leaderSwimmer?.averages?.avgPace100mSec || 90;

  // Best SWOLF swimmer
  const sortedBySwolf = [...activeSwimmers].sort(
    (a, b) => (a.averages?.avgSwolf || 99) - (b.averages?.avgSwolf || 99)
  );
  const bestSwolfSwimmer = sortedBySwolf[0];

  // Chart data for SWOLF Comparison
  const chartData = {
    labels: activeSwimmers.map((s) => s.name),
    datasets: [
      {
        label: 'SWOLF Promedio (Menor = Más Eficiente)',
        data: activeSwimmers.map((s) => s.averages?.avgSwolf || 35),
        backgroundColor: activeSwimmers.map((s) => s.avatarColor || '#00F2FE'),
        borderRadius: 8,
      },
    ],
  };

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        labels: { color: '#94A3B8', font: { family: 'monospace', size: 11 } },
      },
    },
    scales: {
      x: { ticks: { color: '#94A3B8' }, grid: { color: 'rgba(255,255,255,0.05)' } },
      y: { ticks: { color: '#94A3B8' }, grid: { color: 'rgba(255,255,255,0.05)' } },
    },
  };

  return (
    <div className="space-y-6">
      
      {/* Top Headline Banner */}
      <div className="glass-panel p-6 rounded-3xl border border-biolum-cyan/30 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <Swords className="w-6 h-6 text-biolum-cyan" />
            <h3 className="text-xl font-black font-heading text-white tracking-tight">
              Comparativa Cabeza a Cabeza <span className="text-biolum-cyan">({activeSwimmers.length} Nadadores)</span>
            </h3>
          </div>
          <p className="text-xs text-slate-300 font-mono mt-1">
            Análisis biomecánico comparativo basado en los promedios reales del reloj Garmin.
          </p>
        </div>

        {/* Highlights Badges */}
        <div className="flex items-center gap-3">
          <div className="bg-ocean-950 px-3 py-2 rounded-2xl border border-ocean-750 flex items-center gap-2 text-xs">
            <Trophy className="w-4 h-4 text-amber-400" />
            <div>
              <span className="text-[10px] text-slate-400 block font-mono">Mejor SWOLF</span>
              <span className="font-extrabold text-amber-300 font-mono">
                {bestSwolfSwimmer?.name} ({bestSwolfSwimmer?.averages?.avgSwolf})
              </span>
            </div>
          </div>

          <div className="bg-ocean-950 px-3 py-2 rounded-2xl border border-ocean-750 flex items-center gap-2 text-xs">
            <Zap className="w-4 h-4 text-biolum-cyan" />
            <div>
              <span className="text-[10px] text-slate-400 block font-mono">Más Rápido 100m</span>
              <span className="font-extrabold text-biolum-cyan font-mono">
                {leaderSwimmer?.name} ({leaderSwimmer?.averages?.avgPaceFormatted})
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Main Side-by-Side Matrix Table */}
      <div className="glass-panel rounded-3xl border border-ocean-750 overflow-x-auto shadow-2xl">
        <table className="w-full text-left border-collapse text-xs font-mono">
          <thead>
            <tr className="bg-ocean-950/90 text-slate-400 border-b border-ocean-800">
              <th className="p-4 font-bold">Métrica Biomecánica</th>
              {activeSwimmers.map((s) => (
                <th key={s.id} className="p-4 font-bold text-white min-w-[160px]">
                  <div className="flex items-center gap-2">
                    <span
                      className="w-3 h-3 rounded-full inline-block"
                      style={{ backgroundColor: s.avatarColor || '#00F2FE' }}
                    />
                    <span className="truncate">{s.name}</span>
                  </div>
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-ocean-800/60 text-slate-200">
            {/* Row 1: Ritmo / 100m */}
            <tr>
              <td className="p-4 font-semibold text-slate-300">Ritmo Promedio / 100m</td>
              {activeSwimmers.map((s) => {
                const paceSec = s.averages?.avgPace100mSec || 90;
                const deltaSec = paceSec - leaderPaceSec;
                return (
                  <td key={s.id} className="p-4 font-extrabold text-biolum-cyan">
                    {s.averages?.avgPaceFormatted || '1:26'}
                    {deltaSec > 0 ? (
                      <span className="text-[10px] text-rose-400 font-normal ml-2">
                        (+{deltaSec}s)
                      </span>
                    ) : (
                      <span className="text-[10px] text-emerald-400 font-normal ml-2">
                        (Líder)
                      </span>
                    )}
                  </td>
                );
              })}
            </tr>

            {/* Row 2: SWOLF Promedio */}
            <tr>
              <td className="p-4 font-semibold text-slate-300">Índice SWOLF Promedio</td>
              {activeSwimmers.map((s) => (
                <td key={s.id} className="p-4 font-bold text-amber-400">
                  {s.averages?.avgSwolf || 33}
                </td>
              ))}
            </tr>

            {/* Row 3: Distancia Por Brazada (DPS) */}
            <tr>
              <td className="p-4 font-semibold text-slate-300">Distancia por Brazada (DPS)</td>
              {activeSwimmers.map((s) => (
                <td key={s.id} className="p-4 font-bold text-emerald-400">
                  {s.averages?.avgDPS || 1.79} metros / brazada
                </td>
              ))}
            </tr>

            {/* Row 4: Cadencia */}
            <tr>
              <td className="p-4 font-semibold text-slate-300">Cadencia (Brazadas/Minuto)</td>
              {activeSwimmers.map((s) => (
                <td key={s.id} className="p-4 font-mono">
                  {s.averages?.avgCadenceSpm || 56} SPM
                </td>
              ))}
            </tr>

            {/* Row 5: Proyección 400m */}
            <tr>
              <td className="p-4 font-semibold text-slate-300">Tiempo Proyectado 400m</td>
              {activeSwimmers.map((s) => {
                const paceSec = s.averages?.avgPace100mSec || 86;
                const total400Sec = paceSec * 4;
                const min = Math.floor(total400Sec / 60);
                const sec = total400Sec % 60;
                return (
                  <td key={s.id} className="p-4 font-mono text-slate-100 font-bold">
                    {min}:{sec < 10 ? '0' : ''}
                    {sec}
                  </td>
                );
              })}
            </tr>

            {/* Row 6: Eficiencia Hydro (0-100) */}
            <tr>
              <td className="p-4 font-semibold text-slate-300">Índice Eficiencia Hydro</td>
              {activeSwimmers.map((s) => (
                <td key={s.id} className="p-4">
                  <div className="flex items-center gap-2">
                    <div className="flex-1 bg-ocean-950 rounded-full h-2 overflow-hidden border border-ocean-750">
                      <div
                        className="bg-gradient-to-r from-biolum-cyan to-biolum-aqua h-full rounded-full"
                        style={{ width: `${s.averages?.efficiencyScore || 85}%` }}
                      />
                    </div>
                    <span className="font-bold text-biolum-cyan">
                      {s.averages?.efficiencyScore || 85}%
                    </span>
                  </div>
                </td>
              ))}
            </tr>
          </tbody>
        </table>
      </div>

      {/* SWOLF Comparison Chart */}
      <div className="glass-panel p-6 rounded-3xl border border-ocean-750">
        <h4 className="text-sm font-bold font-heading text-white mb-4">
          Gráfico Comparativo de SWOLF (Menor es más eficiente)
        </h4>
        <div className="h-64">
          <Bar data={chartData} options={chartOptions} />
        </div>
      </div>

    </div>
  );
};
