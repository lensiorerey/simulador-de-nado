import React, { useState } from 'react';
import {
  X,
  Share2,
  Copy,
  Check,
  ExternalLink,
  QrCode,
  Sparkles,
  Link,
  Code,
} from 'lucide-react';
import { shareService } from '../services/shareService';
import { aquaticAudio } from '../audio/aquaticAudioEngine';

export const ShareSimulationModal = ({
  isOpen,
  onClose,
  activeSwimmers = [],
  raceSettings = {},
}) => {
  const [copied, setCopied] = useState(false);

  if (!isOpen) return null;

  const shareUrl = shareService.generateShareUrl(activeSwimmers, raceSettings);
  const jsonExport = JSON.stringify(
    {
      simVersion: '1.0',
      activeSwimmersCount: activeSwimmers.length,
      swimmers: activeSwimmers.map((s) => ({
        name: s.name,
        averages: s.averages,
      })),
    },
    null,
    2
  );

  const handleCopyLink = async () => {
    const queryPart = shareUrl.split('?')[1];
    if (queryPart) {
      window.history.replaceState(null, '', '?' + queryPart);
    }

    try {
      if (navigator.clipboard && navigator.clipboard.writeText) {
        await navigator.clipboard.writeText(shareUrl);
      } else {
        const textArea = document.createElement("textarea");
        textArea.value = shareUrl;
        document.body.appendChild(textArea);
        textArea.select();
        document.execCommand("copy");
        textArea.remove();
      }
      setCopied(true);
      try { aquaticAudio.playChime(); } catch(e) {}
      setTimeout(() => setCopied(false), 2500);
    } catch (e) {
      console.warn("Clipboard API failed", e);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    }
  };

  return (
    <div className="fixed inset-0 bg-ocean-950/80 backdrop-blur-md z-50 flex items-center justify-center p-4">
      <div className="glass-panel p-6 rounded-3xl border border-biolum-cyan/40 max-w-xl w-full relative shadow-2xl animate-fade-in">
        
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 rounded-xl bg-ocean-900 text-slate-400 hover:text-white"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Header */}
        <div className="flex items-center gap-3 mb-4">
          <div className="w-12 h-12 rounded-2xl bg-biolum-cyan/20 border border-biolum-cyan/40 flex items-center justify-center text-biolum-cyan">
            <Share2 className="w-6 h-6 animate-pulse" />
          </div>
          <div>
            <h3 className="text-xl font-extrabold font-heading text-white tracking-tight">
              Compartir Simulación de Natación
            </h3>
            <p className="text-xs text-slate-300 font-mono">
              Genera un enlace directo para comparar promedios Garmin con otros nadadores.
            </p>
          </div>
        </div>

        {/* Main Share Link Box */}
        <div className="space-y-4 my-6">
          <div>
            <label className="block text-xs font-mono text-slate-300 mb-1.5 font-bold">
              Enlace Único de Comparativa Multi-Nadador:
            </label>
            <div className="flex items-center gap-2">
              <input
                type="text"
                readOnly
                value={shareUrl}
                className="w-full bg-ocean-950 border border-biolum-cyan/40 rounded-xl px-3 py-2.5 text-xs text-biolum-cyan font-mono focus:outline-none truncate"
              />
              <button
                onClick={handleCopyLink}
                className={`px-4 py-2.5 rounded-xl font-bold text-xs flex items-center gap-2 transition-all whitespace-nowrap ${
                  copied
                    ? 'bg-emerald-500 text-ocean-950 shadow-lg shadow-emerald-500/20'
                    : 'bg-biolum-cyan text-ocean-950 hover:brightness-110 shadow-lg shadow-biolum-cyan/20'
                }`}
              >
                {copied ? (
                  <>
                    <Check className="w-4 h-4" /> ¡Enlace Copiado!
                  </>
                ) : (
                  <>
                    <Copy className="w-4 h-4" /> Copiar Enlace
                  </>
                )}
              </button>
            </div>
          </div>

          {/* Explanation Banner */}
          <div className="bg-ocean-950/80 p-4 rounded-2xl border border-ocean-750 text-xs text-slate-300 space-y-2">
            <div className="flex items-center gap-2 text-amber-300 font-bold font-mono">
              <Sparkles className="w-4 h-4" /> ¿Cómo funciona el enlace compartido?
            </div>
            <p className="text-[11px] leading-relaxed text-slate-400">
              Al abrir este enlace en cualquier navegador o teléfono, la aplicación cargará instantáneamente los perfiles de los <strong className="text-white">{activeSwimmers.length} nadadores activos</strong>, con sus promedios de SWOLF y ritmo Garmin, listos para correr la simulación multi-carril en vivo.
            </p>
          </div>

          {/* JSON Snapshot Viewer */}
          <div>
            <label className="block text-xs font-mono text-slate-400 mb-1 flex items-center justify-between">
              <span>Exportación JSON de Perfiles</span>
              <span className="text-[10px] text-slate-500">Formato Estándar Garmin Swim</span>
            </label>
            <textarea
              readOnly
              rows={4}
              value={jsonExport}
              className="w-full bg-ocean-950 border border-ocean-750 rounded-xl p-3 text-[10px] font-mono text-slate-400 focus:outline-none"
            />
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end pt-4 border-t border-ocean-800">
          <button
            onClick={onClose}
            className="px-5 py-2 rounded-xl bg-ocean-900 text-white font-bold text-xs hover:bg-ocean-800"
          >
            Cerrar
          </button>
        </div>

      </div>
    </div>
  );
};
