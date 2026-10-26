import React, { useState } from 'react';
import { Flame, Timer, Smartphone, Monitor, LogOut, User as UserIcon, RotateCcw } from 'lucide-react';
import { StreakStats } from '../types';
import { useAuth } from '../context/AuthContext';
import { resetAppToVirginState } from '../utils/storage';

interface HeaderProps {
  streakStats: StreakStats;
  onOpenTimer: () => void;
  onOpenStreakTab: () => void;
  isPhoneFrame: boolean;
  onTogglePhoneFrame: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  streakStats,
  onOpenTimer,
  onOpenStreakTab,
  isPhoneFrame,
  onTogglePhoneFrame,
}) => {
  const { user, userProfile, logout } = useAuth();
  const [showAccountMenu, setShowAccountMenu] = useState<boolean>(false);

  return (
    <header
      className={`w-full bg-[#090d16]/95 backdrop-blur-xl border-b border-slate-800/80 px-4 pb-3 select-none transition-all ios-header-safe pt-12 sm:pt-3.5 ${
        isPhoneFrame ? 'simulated-frame' : ''
      }`}
    >
      <div className="flex items-center justify-between max-w-md mx-auto">
        {/* Logo and Brand */}
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-orange-600 via-amber-500 to-yellow-400 p-0.5 shadow-lg shadow-orange-500/25 flex items-center justify-center">
            <div className="w-full h-full bg-[#090d16] rounded-[10px] flex items-center justify-center">
              <Flame className="w-5 h-5 text-orange-500 fill-orange-500" />
            </div>
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <span className="font-extrabold text-base tracking-tight text-white">Olimpus</span>
              <span className="text-[10px] uppercase font-bold tracking-wider px-1.5 py-0.5 rounded-full bg-orange-500/10 text-orange-400 border border-orange-500/20">
                Gym Pro
              </span>
            </div>
            <p className="text-[11px] text-slate-400 font-medium">Tu progreso diario</p>
          </div>
        </div>

        {/* Action Pills */}
        <div className="flex items-center gap-1.5">
          {/* Streak Flame Pill (TikTok style) */}
          <button
            onClick={onOpenStreakTab}
            className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-full bg-gradient-to-r from-orange-500/20 via-amber-500/20 to-yellow-500/15 border border-orange-500/30 hover:border-orange-500/60 transition-all active:scale-95 group shadow-sm shadow-orange-500/10"
            title="Ver sistema de racha y calendario"
          >
            <span className="relative flex h-2.5 w-2.5 items-center justify-center">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-orange-400 opacity-75"></span>
              <Flame className="w-3.5 h-3.5 text-orange-500 fill-orange-500 relative z-10" />
            </span>
            <span className="text-xs font-black tracking-wide text-orange-300 group-hover:text-orange-200">
              {streakStats.currentStreak} {streakStats.currentStreak === 1 ? 'D' : 'D'}
            </span>
          </button>


          {/* Quick Rest Timer Trigger */}
          <button
            onClick={onOpenTimer}
            className="p-2 rounded-xl bg-slate-800/80 hover:bg-slate-700 text-slate-300 hover:text-white transition-all border border-slate-700/50 active:scale-95"
            title="Abrir Cronómetro de Descanso"
          >
            <Timer className="w-4 h-4 text-amber-400" />
          </button>

          {/* User Account Popover Toggle */}
          <div className="relative">
            <button
              onClick={() => setShowAccountMenu(!showAccountMenu)}
              className="p-2 rounded-xl bg-slate-800/80 hover:bg-slate-700 text-slate-300 hover:text-white transition-all border border-slate-700/50 active:scale-95"
              title="Cuenta y sesión"
            >
              <UserIcon className="w-4 h-4 text-orange-400" />
            </button>

            {showAccountMenu && (
              <>
                <div
                  className="fixed inset-0 z-40"
                  onClick={() => setShowAccountMenu(false)}
                />
                <div className="absolute right-0 mt-2 w-56 rounded-2xl bg-[#090d16] border border-slate-800 p-3 shadow-2xl z-50 animate-in fade-in zoom-in-95">
                  <div className="mb-2 pb-2 border-b border-slate-800">
                    <p className="text-[11px] text-slate-400 font-medium">Conectado como:</p>
                    <p className="text-xs font-bold text-white truncate">{user?.email}</p>
                    <span className="inline-block mt-1 text-[10px] font-bold px-1.5 py-0.5 rounded uppercase tracking-wider bg-orange-500/15 text-orange-400 border border-orange-500/30">
                      {userProfile?.status === 'trial' ? 'Periodo de Prueba' : 'Suscripción Activa'}
                    </span>
                  </div>
                  <button
                    onClick={() => {
                      if (
                        window.confirm(
                          '¿Reiniciar la aplicación a estado virgen? Se limpiarán las rachas, ejercicios, fotos de comidas y pesajes para que comiences desde cero.'
                        )
                      ) {
                        resetAppToVirginState();
                        window.location.reload();
                      }
                    }}
                    className="w-full flex items-center gap-2 px-3 py-2 text-xs font-semibold text-slate-300 hover:text-white hover:bg-slate-800 rounded-xl transition-colors mb-1"
                  >
                    <RotateCcw className="w-3.5 h-3.5 text-orange-400" />
                    <span>Reiniciar a Modo Virgen</span>
                  </button>

                  <button
                    onClick={() => {
                      setShowAccountMenu(false);
                      logout();
                    }}
                    className="w-full flex items-center gap-2 px-3 py-2 text-xs font-semibold text-red-400 hover:bg-red-500/10 rounded-xl transition-colors"
                  >
                    <LogOut className="w-3.5 h-3.5" />
                    <span>Cerrar Sesión</span>
                  </button>
                </div>
              </>
            )}
          </div>

          {/* Phone / Desktop View Toggle (hidden on small screens, useful for preview) */}
          <button
            onClick={onTogglePhoneFrame}
            className="hidden sm:flex p-2 rounded-xl bg-slate-800/50 hover:bg-slate-800 text-slate-400 hover:text-slate-200 transition-all border border-slate-800"
            title={isPhoneFrame ? 'Expandir vista completa' : 'Vista en marco de teléfono'}
          >
            {isPhoneFrame ? <Monitor className="w-4 h-4" /> : <Smartphone className="w-4 h-4" />}
          </button>
        </div>
      </div>
    </header>
  );
};
