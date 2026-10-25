// Share Service: Encodes & Decodes Multi-Swimmer Simulation State into Shareable URL Hash

export const shareService = {
  /**
   * Generates a compressed base64 hash string from the active swimmer roster and pool settings
   * @param {Array} swimmers - Active roster of swimmers
   * @param {Object} raceSettings - Race settings (poolLength, raceDistance, animSpeed)
   */
  generateShareHash(swimmers, raceSettings = {}) {
    try {
      const pl = raceSettings.poolLength || 25;
      const rd = raceSettings.raceDistance || 100;
      
      const sArr = swimmers.map(s => {
        const n = (s.name || '').replace(/[*|~]/g, ''); // strip delimiters
        const g = s.avatarGender === 'female' ? 'f' : 'm';
        const c = (s.avatarColor || '#00F2FE').replace('#', '');
        const sw = Math.round(s.averages?.avgSwolf || s.customSwolf || 34);
        const p = s.averages?.avgPaceFormatted || s.customPace || '1:26';
        const st = Number(s.averages?.avgStrokesPerLap || s.customStrokes || 14).toFixed(1);
        const sp = Math.round(s.averages?.avgCadenceSpm || s.customSpm || 29);
        const hr = Math.round(s.averages?.avgHeartRate || s.customHr || 145);
        return `${n}*${g}*${c}*${sw}*${p}*${st}*${sp}*${hr}`;
      });

      const packed = `v3|${pl}|${rd}|${sArr.join('~')}`;
      const b64 = btoa(unescape(encodeURIComponent(packed)));
      
      return b64.replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
    } catch (e) {
      console.error('Error generating share hash:', e);
      return '';
    }
  },

  /**
   * Returns a complete shareable URL link
   */
  generateShareUrl(swimmers, raceSettings = {}) {
    const hash = this.generateShareHash(swimmers, raceSettings);
    if (!hash) return window.location.href;
    const baseUrl = window.location.origin + window.location.pathname;
    return `${baseUrl}?sim=${hash}`;
  },

  /**
   * Parses the URL hash parameter if present and returns restored state
   */
  parseShareHash() {
    try {
      const queryParams = new URLSearchParams(window.location.search);
      let b64 = queryParams.get('sim');
      
      if (!b64) {
        const hash = window.location.hash;
        if (hash && hash.includes('#sim=')) {
          b64 = hash.replace('#sim=', '');
        }
      }

      if (!b64) return null;

      // Restore base64 padding and URL-safe chars
      let base64str = b64.replace(/-/g, '+').replace(/_/g, '/');
      while (base64str.length % 4) {
        base64str += '=';
      }

      const decodedStr = decodeURIComponent(escape(atob(base64str)));
      
      // V3 PACKED STRING PARSER
      if (decodedStr.startsWith('v3|')) {
        const parts = decodedStr.split('|');
        if (parts.length < 4) return null;
        
        const pl = Number(parts[1]) || 25;
        const rd = Number(parts[2]) || 100;
        const swimmersArr = parts[3].split('~').map((str, idx) => {
           const sparts = str.split('*');
           const name = sparts[0] || `Nadador ${idx + 1}`;
           const gender = sparts[1] === 'f' ? 'female' : 'male';
           const color = '#' + (sparts[2] || '00F2FE');
           const swolf = Number(sparts[3]) || 34;
           const paceStr = sparts[4] || '1:26';
           const strokes = Number(sparts[5]) || 14;
           const spm = Number(sparts[6]) || 29;
           const hr = Number(sparts[7]) || 145;
           
           const [mStr, sStr] = paceStr.split(':');
           const paceSec = (Number(mStr) || 1) * 60 + (Number(sStr) || 26);

           return {
             id: `shared-${idx}-${Date.now()}`,
             name,
             avatarGender: gender,
             avatarColor: color,
             garminConnected: true,
             lastSynced: 'Vía Enlace Compartido',
             bio: 'Perfil importado desde simulación compartida.',
             workouts: [
               {
                 id: `shared-w-${idx}-${Date.now()}`,
                 title: 'Entrenamiento Compartido',
                 totalDistance: 2000,
                 avgSwolf: swolf,
                 avgPace100m: paceStr,
                 avgHeartRate: hr,
                 avgStrokesPerLap: strokes,
                 cadenceSpm: spm,
                 laps: [
                   { lap: 1, dist: 1000, swolf, hr, pace: paceStr },
                   { lap: 2, dist: 1000, swolf, hr, pace: paceStr }
                 ],
                 strokesDistribution: { freestyle: 100, backstroke: 0, breaststroke: 0, butterfly: 0 }
               }
             ],
             averages: {
               totalWorkoutsCount: 1,
               totalDistanceKm: 2.5,
               avgPace100mSec: paceSec,
               avgPaceFormatted: paceStr,
               avgSwolf: swolf,
               avgStrokesPerLap: strokes,
               avgCadenceSpm: spm,
               avgDPS: (pl / Math.max(1, strokes)).toFixed(2),
               avgHeartRate: hr,
               efficiencyScore: 85,
             },
           };
        });

        return { poolLength: pl, raceDistance: rd, swimmers: swimmersArr };
      }

      // V1 / V2 JSON PARSER (BACKWARDS COMPATIBILITY)
      const payload = JSON.parse(decodedStr);
      if (!payload || (!payload.swimmers && !payload.s)) return null;

      const restoredSwimmers = (payload.s || payload.swimmers).map((s, idx) => {
        const paceStr = s.p || s.pace || '1:26';
        const [mStr, sStr] = paceStr.split(':');
        const paceSec = (Number(mStr) || 1) * 60 + (Number(sStr) || 26);
        const name = s.n || s.name || `Nadador ${idx + 1}`;
        const gender = s.g === 'f' ? 'female' : s.g === 'm' ? 'male' : s.gender || 'male';
        const color = s.c || s.color || '#00F2FE';
        const swolf = s.sw || s.swolf || 34;
        const hr = s.hr || 145;
        const strokes = s.st ? parseFloat(s.st) : s.strokes || 14;
        const spm = s.sp || s.spm || 29;

        return {
          id: `shared-${idx}-${Date.now()}`,
          name: name,
          avatarGender: gender,
          avatarColor: color,
          garminConnected: true,
          lastSynced: 'Vía Enlace Compartido',
          bio: 'Perfil importado desde simulación compartida.',
          workouts: [
            {
              id: `shared-w-${idx}-${Date.now()}`,
              title: 'Entrenamiento Compartido',
              totalDistance: 2000,
              avgSwolf: swolf,
              avgPace100m: paceStr,
              avgHeartRate: hr,
              avgStrokesPerLap: strokes,
              cadenceSpm: spm,
              laps: [
                { lap: 1, dist: 1000, swolf: swolf, hr: hr, pace: paceStr },
                { lap: 2, dist: 1000, swolf: swolf, hr: hr, pace: paceStr }
              ],
              strokesDistribution: { freestyle: 100, backstroke: 0, breaststroke: 0, butterfly: 0 }
            }
          ],
          averages: {
            totalWorkoutsCount: 1,
            totalDistanceKm: 2.5,
            avgPace100mSec: paceSec,
            avgPaceFormatted: paceStr,
            avgSwolf: swolf,
            avgStrokesPerLap: strokes,
            avgCadenceSpm: spm,
            avgDPS: ((payload.pl || payload.poolLength || 25) / Math.max(1, strokes)).toFixed(2),
            avgHeartRate: hr,
            efficiencyScore: s.score || 85,
          },
        };
      });

      return {
        poolLength: payload.pl || payload.poolLength || 25,
        raceDistance: payload.rd || payload.raceDistance || 100,
        swimmers: restoredSwimmers,
      };
    } catch (e) {
      console.error('Error parsing share hash from URL:', e);
      return null;
    }
  },
};
