# 🏊‍♂️ Simulador de Nado ("Cómo Nado")

Plataforma interactiva de simulación biomecánica de natación a 60 FPS, análisis de eficiencia hidrodinámica (**SWOLF**), comparativa multi-nadador e integración con sesiones de **Garmin Connect** y archivos **CSV**.

## 🚀 Estructura del Proyecto

- `src/App.jsx` — Entrada principal de la aplicación y barra de navegación con sintetizador acuático.
- `src/components/`
  - `SwimStrokeSimulator.jsx` — Simulador físico e hidrodinámico de brazada a 60 FPS con edición de SWOLF y comparativa.
  - `MultiSwimmerSimulator.jsx` — Simulador comparativo para múltiples nadadores en simultáneo.
  - `SwimEfficiencyHeroBlock.jsx` — Bloque principal de métricas de eficiencia de nado.
  - `GarminDashboard.jsx` & `GarminConnectModal.jsx` — Panel principal de telemetría e importación desde Garmin / CSV.
  - `SwimmerComparisonMatrix.jsx` & `SwimmerProfileManager.jsx` — Gestión de perfiles y matriz comparativa de nadadores.
  - `ShareSimulationModal.jsx` — Exportación y enlaces para compartir simulaciones.
  - `WaterBackground.jsx` — Fondo de agua interactivo en HTML5 Canvas.
- `src/services/` — Servicios de parseo de CSV de Garmin (`garminCsvParser.js`), perfiles (`swimmerProfileService.js`), conexión Garmin (`garminConnectService.js`) y Firebase (`firebaseService.js`).
- `src/audio/aquaticAudioEngine.js` — Motor de sonido acuático sintetizado en Web Audio API.
- `server/` — Cliente y proxy local para integración con Garmin (`garminProxy.js`).
- `test app/` — Archivos `Activities.csv` de ejemplo exportados de Garmin para pruebas.

## 🛠️ Comandos Disponibles

```bash
# Instalar dependencias
npm install

# Iniciar servidor de desarrollo (Vite)
npm run dev

# Iniciar proxy local de Garmin (opcional)
npm run server

# Compilar para producción
npm run build
```
