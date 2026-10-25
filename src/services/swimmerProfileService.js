// Swimmer Profile & Garmin Workout Aggregation Service

const LOCAL_STORAGE_PROFILES_KEY = 'eikasia_swimmer_profiles';

// Default Benchmark Swimmers Presets
export const DEFAULT_PRESET_SWIMMERS = [
  {
    id: 'preset-alex',
    name: 'Alejandro Z.',
    avatarGender: 'male',
    avatarColor: '#00F2FE', // Biolum Cyan
    garminEmail: 'alex.garmin@swim.pro',
    garminConnected: true,
    lastSynced: '2026-08-12',
    bio: 'Nadador de Aguas Abiertas & Triatleta. Enfocado en SWOLF bajo.',
    workouts: [
      {
        id: 'garmin-w1',
        title: 'Entrenamiento 2500m Intervalos',
        date: '2026-08-10',
        poolLength: 25,
        totalDistance: 2500,
        totalTimeSeconds: 2150, // 35:50 (1:26/100m)
        avgSwolf: 31,
        avgPace100m: '1:26',
        avgHeartRate: 146,
        avgStrokesPerLap: 13,
        cadenceSpm: 56,
      },
      {
        id: 'garmin-w2',
        title: 'Sesión Umbral Anaeróbico 3000m',
        date: '2026-08-08',
        poolLength: 25,
        totalDistance: 3000,
        totalTimeSeconds: 2610, // 43:30 (1:27/100m)
        avgSwolf: 33,
        avgPace100m: '1:27',
        avgHeartRate: 152,
        avgStrokesPerLap: 14,
        cadenceSpm: 58,
      },
      {
        id: 'garmin-w3',
        title: 'Técnica & Deslizamiento 2000m',
        date: '2026-08-05',
        poolLength: 25,
        totalDistance: 2000,
        totalTimeSeconds: 1680, // 28:00 (1:24/100m)
        avgSwolf: 30,
        avgPace100m: '1:24',
        avgHeartRate: 138,
        avgStrokesPerLap: 12,
        cadenceSpm: 54,
      },
    ],
  },
  {
    id: 'preset-sofia',
    name: 'Sofía M. (Rival)',
    avatarGender: 'female',
    avatarColor: '#F43F5E', // Rose Red
    garminEmail: 'sofia.garmin@swim.pro',
    garminConnected: true,
    lastSynced: '2026-08-11',
    bio: 'Velocista de Piscina Corta. Cadencia alta & patada constante.',
    workouts: [
      {
        id: 'garmin-w4',
        title: 'Series de Velocidad 100m x 15',
        date: '2026-08-11',
        poolLength: 25,
        totalDistance: 2200,
        totalTimeSeconds: 2310, // 38:30 (1:45/100m)
        avgSwolf: 42,
        avgPace100m: '1:45',
        avgHeartRate: 158,
        avgStrokesPerLap: 19,
        cadenceSpm: 64,
      },
      {
        id: 'garmin-w5',
        title: 'Fuerza con Paletas 2400m',
        date: '2026-08-07',
        poolLength: 25,
        totalDistance: 2400,
        totalTimeSeconds: 2472, // 41:12 (1:43/100m)
        avgSwolf: 41,
        avgPace100m: '1:43',
        avgHeartRate: 162,
        avgStrokesPerLap: 18,
        cadenceSpm: 62,
      },
    ],
  },
  {
    id: 'preset-mateo',
    name: 'Mateo R. (Máster)',
    avatarGender: 'male',
    avatarColor: '#10B981', // Emerald
    garminEmail: 'mateo.garmin@swim.pro',
    garminConnected: true,
    lastSynced: '2026-08-09',
    bio: 'Nadador Máster de Fondo (1500m libre). Ritmo constante de crucero.',
    workouts: [
      {
        id: 'garmin-w6',
        title: 'Fondo Continuo 3500m',
        date: '2026-08-09',
        poolLength: 25,
        totalDistance: 3500,
        totalTimeSeconds: 3150, // 52:30 (1:30/100m)
        avgSwolf: 35,
        avgPace100m: '1:30',
        avgHeartRate: 142,
        avgStrokesPerLap: 15,
        cadenceSpm: 55,
      },
    ],
  },
  {
    id: 'preset-camila',
    name: 'Camila K. (Elite)',
    avatarGender: 'female',
    avatarColor: '#A855F7', // Purple Accent
    garminEmail: 'camila.garmin@swim.pro',
    garminConnected: true,
    lastSynced: '2026-08-13',
    bio: 'Nadadora de Competición Nacional. Eficiencia hidrodinámica superior.',
    workouts: [
      {
        id: 'garmin-w7',
        title: 'Simulación de Carrera 2000m',
        date: '2026-08-13',
        poolLength: 25,
        totalDistance: 2000,
        totalTimeSeconds: 1400, // 23:20 (1:10/100m)
        avgSwolf: 27,
        avgPace100m: '1:10',
        avgHeartRate: 168,
        avgStrokesPerLap: 11,
        cadenceSpm: 60,
      },
    ],
  },
];

/**
 * Calculate consolidated averages from an array of workout sessions for a swimmer
 */
export function calculateSwimmerAverages(workouts = [], poolLength = 25) {
  if (!workouts || workouts.length === 0) {
    return {
      totalWorkoutsCount: 0,
      totalDistanceKm: 0,
      avgPace100mSec: 90,
      avgPaceFormatted: '1:30',
      avgSwolf: 35,
      avgStrokesPerLap: 15,
      avgCadenceSpm: 55,
      avgDPS: (poolLength / 15).toFixed(2),
      avgHeartRate: 145,
      efficiencyScore: 80,
    };
  }

  let totalDist = 0;
  let totalTimeSec = 0;
  let totalSwolfWeighted = 0;
  let totalStrokesWeighted = 0;
  let totalHrWeighted = 0;
  let totalCadenceWeighted = 0;

  workouts.forEach((w) => {
    const dist = Number(w.totalDistance) || 1000;
    totalDist += dist;

    // Convert pace formatted or total time
    let timeSec = Number(w.totalTimeSeconds) || 0;
    if (!timeSec && w.avgPace100m) {
      const [m, s] = w.avgPace100m.split(':').map(Number);
      const paceSec = (m || 1) * 60 + (s || 30);
      timeSec = (dist / 100) * paceSec;
    }
    totalTimeSec += timeSec;

    const swolf = Number(w.avgSwolf) || 35;
    totalSwolfWeighted += swolf * dist;

    const strokes = Number(w.avgStrokesPerLap) || 15;
    totalStrokesWeighted += strokes * dist;

    const hr = Number(w.avgHeartRate) || 145;
    totalHrWeighted += hr * dist;

    const cadence = Number(w.cadenceSpm) || 56;
    totalCadenceWeighted += cadence * dist;
  });

  const avgSwolf = Math.round(totalSwolfWeighted / Math.max(1, totalDist));
  const avgStrokesPerLap = Math.round(totalStrokesWeighted / Math.max(1, totalDist));
  const avgHeartRate = Math.round(totalHrWeighted / Math.max(1, totalDist));
  const avgCadenceSpm = Math.round(totalCadenceWeighted / Math.max(1, totalDist));

  // Average Pace per 100m in seconds
  const avgPace100mSec = Math.round((totalTimeSec / Math.max(1, totalDist)) * 100);
  const minutes = Math.floor(avgPace100mSec / 60);
  const seconds = avgPace100mSec % 60;
  const avgPaceFormatted = `${minutes}:${seconds < 10 ? '0' : ''}${seconds}`;

  // DPS = Distance Per Stroke (meters/stroke for poolLength)
  const avgDPS = parseFloat((poolLength / Math.max(1, avgStrokesPerLap)).toFixed(2));

  // Hydrodynamic Efficiency Score (100 - base penalty for high SWOLF)
  // Benchmark ideal SWOLF ~25 -> Score ~98. SWOLF 50 -> Score ~50.
  const efficiencyScore = Math.min(99, Math.max(30, Math.round(135 - avgSwolf * 1.6)));

  return {
    totalWorkoutsCount: workouts.length,
    totalDistanceKm: parseFloat((totalDist / 1000).toFixed(1)),
    avgPace100mSec,
    avgPaceFormatted,
    avgSwolf,
    avgStrokesPerLap,
    avgCadenceSpm,
    avgDPS,
    avgHeartRate,
    efficiencyScore,
  };
}

export const swimmerProfileService = {
  /**
   * Get all stored swimmer profiles, or initialize default presets
   */
  getProfiles() {
    try {
      const stored = localStorage.getItem(LOCAL_STORAGE_PROFILES_KEY);
      if (stored) {
        let parsed = JSON.parse(stored);
        if (parsed && parsed.length > 0) {
          // Automatically sanitize & purge any legacy faulty 2026m workouts
          parsed = parsed.map((p) => {
            const cleanWorkouts = (p.workouts || []).filter(
              (w) => Number(w.totalDistance) !== 2026
            );
            return {
              ...p,
              workouts: cleanWorkouts,
              averages: calculateSwimmerAverages(cleanWorkouts),
            };
          });
          return parsed;
        }
      }
    } catch (e) {
      console.error('Error loading swimmer profiles:', e);
    }

    // Fallback to presets
    const initialized = DEFAULT_PRESET_SWIMMERS.map((p) => ({
      ...p,
      averages: calculateSwimmerAverages(p.workouts),
    }));
    this.saveProfiles(initialized);
    return initialized;
  },

  /**
   * Save array of swimmer profiles
   */
  saveProfiles(profiles) {
    try {
      localStorage.setItem(LOCAL_STORAGE_PROFILES_KEY, JSON.stringify(profiles));
    } catch (e) {
      console.error('Error saving swimmer profiles:', e);
    }
  },

  /**
   * Add a new workout session to a specific swimmer's Garmin history and update their profile averages
   */
  addWorkoutToSwimmer(swimmerId, newWorkout) {
    const profiles = this.getProfiles();
    const index = profiles.findIndex((p) => p.id === swimmerId);
    if (index !== -1) {
      const swimmer = profiles[index];
      // Filter out any 2026m workout
      const cleanExisting = swimmer.workouts.filter((w) => Number(w.totalDistance) !== 2026);
      const updatedWorkouts = [newWorkout, ...cleanExisting];
      swimmer.workouts = updatedWorkouts;
      swimmer.averages = calculateSwimmerAverages(updatedWorkouts);
      profiles[index] = swimmer;
      this.saveProfiles(profiles);
      return swimmer;
    }
    return null;
  },

  /**
   * Replace all workouts for a swimmer with newly parsed sessions
   */
  replaceSwimmerWorkouts(swimmerId, newWorkouts) {
    const profiles = this.getProfiles();
    const index = profiles.findIndex((p) => p.id === swimmerId);
    if (index !== -1) {
      const swimmer = profiles[index];
      swimmer.workouts = newWorkouts;
      swimmer.averages = calculateSwimmerAverages(newWorkouts);
      profiles[index] = swimmer;
      this.saveProfiles(profiles);
      return swimmer;
    }
    return null;
  },

  /**
   * Create a new custom swimmer profile
   */
  createSwimmer(swimmerData) {
    const profiles = this.getProfiles();
    const id = `swimmer-${Date.now()}`;
    const newSwimmer = {
      id,
      name: swimmerData.name || 'Nuevo Nadador',
      avatarGender: swimmerData.avatarGender || 'male',
      avatarColor: swimmerData.avatarColor || '#00F2FE',
      garminEmail: swimmerData.garminEmail || '',
      garminConnected: !!swimmerData.garminEmail,
      lastSynced: new Date().toISOString().split('T')[0],
      bio: swimmerData.bio || 'Perfil configurado con datos Garmin.',
      workouts: swimmerData.workouts || [
        {
          id: `w-${Date.now()}`,
          title: 'Sesión Base Inicial',
          date: new Date().toISOString().split('T')[0],
          poolLength: 25,
          totalDistance: swimmerData.customDist || 2000,
          totalTimeSeconds: swimmerData.customTimeSec || 1720,
          avgSwolf: swimmerData.customSwolf || 34,
          avgPace100m: swimmerData.customPace || '1:26',
          avgHeartRate: swimmerData.customHr || 145,
          avgStrokesPerLap: swimmerData.customStrokes || 14,
          cadenceSpm: swimmerData.customCadence || 56,
        },
      ],
    };
    newSwimmer.averages = calculateSwimmerAverages(newSwimmer.workouts);
    const updated = [...profiles, newSwimmer];
    this.saveProfiles(updated);
    return newSwimmer;
  },

  /**
   * Reset profiles back to default presets
   */
  resetToDefaults() {
    const initialized = DEFAULT_PRESET_SWIMMERS.map((p) => ({
      ...p,
      averages: calculateSwimmerAverages(p.workouts),
    }));
    this.saveProfiles(initialized);
    return initialized;
  },
};
