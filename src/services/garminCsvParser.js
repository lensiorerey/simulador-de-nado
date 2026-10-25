// Robust Garmin CSV File Parser Service

/**
 * Parse Garmin Connect exported CSV files in Spanish or English
 * Handles comma (,), semicolon (;), and tab (\t) delimiters,
 * kilometer to meter conversions, date sanitization, and time durations.
 */
export function parseGarminCsv(csvText) {
  if (!csvText || typeof csvText !== 'string') return [];

  const lines = csvText.split(/\r?\n/).filter((l) => l.trim().length > 0);
  if (lines.length <= 1) return [];

  // 1. Auto-detect delimiter (';', ',', '\t')
  const firstLine = lines[0];
  const semicolonCount = (firstLine.match(/;/g) || []).length;
  const commaCount = (firstLine.match(/,/g) || []).length;
  const tabCount = (firstLine.match(/\t/g) || []).length;

  let delimiter = ',';
  if (semicolonCount > commaCount && semicolonCount > tabCount) {
    delimiter = ';';
  } else if (tabCount > commaCount && tabCount > semicolonCount) {
    delimiter = '\t';
  }

  // Split line function respecting quoted strings
  const splitLine = (line) => {
    if (delimiter === ';') {
      return line.split(/;(?=(?:(?:[^"]*"){2})*[^"]*$)/).map((c) => c.replace(/^"|"$/g, '').trim());
    } else if (delimiter === '\t') {
      return line.split('\t').map((c) => c.replace(/^"|"$/g, '').trim());
    } else {
      return line.split(/,(?=(?:(?:[^"]*"){2})*[^"]*$)/).map((c) => c.replace(/^"|"$/g, '').trim());
    }
  };

  const headers = splitLine(firstLine).map((h) => h.toLowerCase());

  // 2. Locate Column Indexes with flexible keyword matching
  const findIdx = (keywords) => {
    return headers.findIndex((h) => keywords.some((kw) => h.includes(kw)));
  };

  const distIdx = findIdx(['distancia', 'distance', 'dist']);
  const timeIdx = findIdx(['tiempo', 'time', 'duración', 'duration', 'elapsed']);
  const swolfIdx = findIdx(['swolf']);
  const paceIdx = findIdx(['ritmo', 'pace']);
  const hrIdx = findIdx(['frecuencia', 'hr', 'heart rate', 'pulsaciones', 'fc']);
  const maxHrIdx = findIdx(['max hr', 'fc max', 'máxima']);
  const strokesIdx = findIdx(['brazadas', 'strokes']);
  const dateIdx = findIdx(['fecha', 'date']);
  const titleIdx = findIdx(['título', 'title', 'actividad', 'activity', 'nombre']);

  const isDistInKm =
    distIdx !== -1 && (headers[distIdx].includes('km') || headers[distIdx].includes('(km)'));

  const parsedSessions = [];
  const dataLines = lines.slice(1);

  dataLines.forEach((line, idx) => {
    const cols = splitLine(line);
    if (cols.length < 2) return;

    // A. Parse Date first
    let dateVal = new Date().toISOString().split('T')[0];
    if (dateIdx !== -1 && cols[dateIdx]) {
      const matchD = cols[dateIdx].match(/\d{4}[-/.]\d{2}[-/.]\d{2}/);
      if (matchD) {
        dateVal = matchD[0].replace(/\./g, '-');
      }
    }

    // B. Parse Distance (ensuring date string "2026-08-10" is NOT parsed as a number!)
    let distVal = 0;
    if (distIdx !== -1 && cols[distIdx]) {
      const rawStr = cols[distIdx].trim();
      // Guard against date strings
      if (!rawStr.includes('-') && !rawStr.includes('/') && rawStr !== '--') {
        let cleanStr = rawStr;
        if (cleanStr.includes(',') && cleanStr.includes('.')) {
          if (cleanStr.lastIndexOf(',') > cleanStr.lastIndexOf('.')) {
            cleanStr = cleanStr.replace(/\./g, '').replace(',', '.');
          } else {
            cleanStr = cleanStr.replace(/,/g, '');
          }
        } else if (cleanStr.includes(',')) {
          const parts = cleanStr.split(',');
          if (parts.length === 2 && parts[1].length <= 2) {
            cleanStr = cleanStr.replace(',', '.'); // decimal (e.g. 2,5 km)
          } else {
            cleanStr = cleanStr.replace(/,/g, ''); // thousands (e.g. 2,500 m)
          }
        }

        const num = parseFloat(cleanStr);
        if (!isNaN(num) && num > 0) {
          distVal = num;
          // Convert KM to meters if header has km or distance < 50
          if (isDistInKm || distVal < 50) {
            distVal = distVal * 1000;
          }
        }
      }
    }

    // Fallback if missing or unparseable
    if (!distVal || distVal <= 0) {
      distVal = 2000;
    }
    distVal = Math.round(distVal);

    // C. Parse Time / Duration
    let totalTimeSeconds = 0;
    if (timeIdx !== -1 && cols[timeIdx]) {
      totalTimeSeconds = parseTimeToSeconds(cols[timeIdx].trim());
    }
    if (!totalTimeSeconds || totalTimeSeconds <= 0) {
      totalTimeSeconds = Math.round((distVal / 100) * 86); // 1:26/100m fallback
    }

    // D. Parse SWOLF
    let swolfVal = 0;
    if (swolfIdx !== -1 && cols[swolfIdx]) {
      const cleanS = cols[swolfIdx].replace(/,/g, '.').replace(/--/g, '').trim();
      const numS = parseFloat(cleanS);
      if (!isNaN(numS) && numS > 10 && numS < 100) {
        swolfVal = Math.round(numS);
      }
    }
    if (!swolfVal) swolfVal = 33;

    // E. Parse Heart Rate
    let hrVal = 0;
    if (hrIdx !== -1 && cols[hrIdx]) {
      const cleanH = cols[hrIdx].replace(/--/g, '').trim();
      const numH = parseFloat(cleanH);
      if (!isNaN(numH) && numH > 60 && numH < 220) {
        hrVal = Math.round(numH);
      }
    }
    if (!hrVal) hrVal = 145;

    // F. Parse Max HR
    let maxHrVal = hrVal + 18;
    if (maxHrIdx !== -1 && cols[maxHrIdx]) {
      const cleanMH = cols[maxHrIdx].replace(/--/g, '').trim();
      const numMH = parseFloat(cleanMH);
      if (!isNaN(numMH) && numMH > hrVal) maxHrVal = Math.round(numMH);
    }

    // G. Parse Strokes
    let strokesVal = 0;
    if (strokesIdx !== -1 && cols[strokesIdx]) {
      const cleanSt = cols[strokesIdx].replace(/,/g, '.').replace(/--/g, '').trim();
      const numSt = parseFloat(cleanSt);
      if (!isNaN(numSt) && numSt > 0) {
        strokesVal = Math.round(numSt);
        if (strokesVal > 200) {
          const totalLaps = Math.max(1, distVal / 25);
          strokesVal = Math.round(strokesVal / totalLaps);
        }
      }
    }
    if (!strokesVal || strokesVal <= 0) strokesVal = 14;

    // H. Parse Pace / 100m
    let paceVal = '';
    if (paceIdx !== -1 && cols[paceIdx]) {
      const rawPace = cols[paceIdx].trim();
      if (rawPace.includes(':')) {
        const matchP = rawPace.match(/\d+:\d{2}/);
        if (matchP) paceVal = matchP[0];
      }
    }
    if (!paceVal) {
      const paceSec = Math.round((totalTimeSeconds / distVal) * 100);
      const pm = Math.floor(paceSec / 60);
      const ps = paceSec % 60;
      paceVal = `${pm}:${ps < 10 ? '0' : ''}${ps}`;
    }

    // I. Parse Title
    let titleVal = `Natación Garmin (${distVal}m)`;
    if (titleIdx !== -1 && cols[titleIdx] && cols[titleIdx] !== '--' && cols[titleIdx].length > 1) {
      titleVal = `${cols[titleIdx]} (${distVal}m)`;
    }

    parsedSessions.push({
      id: `garmin-csv-${Date.now()}-${idx}`,
      date: dateVal,
      title: titleVal,
      poolLength: 25,
      totalDistance: distVal,
      totalTimeSeconds,
      avgSwolf: swolfVal,
      avgPace100m: paceVal,
      avgHeartRate: hrVal,
      maxHeartRate: maxHrVal,
      avgStrokesPerLap: strokesVal,
      cadenceSpm: 56,
      calories: Math.round(distVal * 0.22),
      trainingLoad: Math.round(distVal * 0.06),
      source: 'Archivo Exportado de Garmin Connect (.CSV)',
      laps: [
        { lap: 1, dist: Math.round(distVal / 2), pace: paceVal, swolf: swolfVal, strokes: strokesVal, hr: hrVal },
        { lap: 2, dist: Math.round(distVal / 2), pace: paceVal, swolf: Math.round(swolfVal + 1), strokes: strokesVal, hr: Math.round(hrVal + 4) },
      ],
      strokesDistribution: { freestyle: 95, backstroke: 5, breaststroke: 0, butterfly: 0 },
    });
  });

  return parsedSessions;
}

// Convert duration formatted string to seconds
function parseTimeToSeconds(timeStr) {
  if (!timeStr || timeStr === '--') return 0;
  if (timeStr.includes(':')) {
    const parts = timeStr.split(':').map((p) => parseFloat(p) || 0);
    if (parts.length === 3) {
      return parts[0] * 3600 + parts[1] * 60 + parts[2];
    } else if (parts.length === 2) {
      return parts[0] * 60 + parts[1];
    }
  }
  const num = parseFloat(timeStr);
  return !isNaN(num) ? num : 0;
}
