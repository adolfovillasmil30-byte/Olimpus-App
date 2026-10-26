import React from 'react';
import { Sparkles, Clock } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export const TrialBanner: React.FC = () => {
  const { userProfile, daysRemainingInTrial } = useAuth();

  if (!userProfile || userProfile.status !== 'trial') {
    return null;
  }

  const daysText =
    daysRemainingInTrial <= 0
      ? 'Últimas horas'
      : daysRemainingInTrial === 1
      ? 'Queda 1 día'
      : `Quedan ${daysRemainingInTrial} días`;

  return (
    <aside aria-label="Información de periodo de prueba" className="bg-gradient-to-r from-orange-600/90 via-amber-600/90 to-yellow-600/90 text-white px-3 py-1.5 text-xs font-semibold shadow-md flex items-center justify-between z-40 border-b border-orange-500/40">
      <div className="max-w-md mx-auto w-full flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="p-1 rounded-md bg-white/20">
            <Sparkles className="w-3.5 h-3.5 text-yellow-200" />
          </span>
          <span className="tracking-tight">
            Periodo de prueba: <strong className="font-extrabold text-white underline decoration-yellow-300">{daysText}</strong>
          </span>
        </div>
        <div className="flex items-center gap-1 text-[11px] font-bold uppercase tracking-wider bg-black/25 px-2 py-0.5 rounded-full border border-white/20">
          <Clock className="w-3 h-3 text-yellow-300" />
          <span>Acceso Total</span>
        </div>
      </div>
    </aside>
  );
};
