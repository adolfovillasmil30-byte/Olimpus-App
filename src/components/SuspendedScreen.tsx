import React, { useState } from 'react';
import { Lock, LogOut, MessageSquare, RefreshCw, AlertTriangle, ShieldAlert, Check } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export const SuspendedScreen: React.FC = () => {
  const { user, userProfile, logout, refreshProfile } = useAuth();
  const [isRefreshing, setIsRefreshing] = useState<boolean>(false);
  const [copied, setCopied] = useState<boolean>(false);

  const handleRefresh = async () => {
    setIsRefreshing(true);
    try {
      await refreshProfile();
    } finally {
      setTimeout(() => setIsRefreshing(false), 800);
    }
  };

  const handleContactWhatsApp = () => {
    const text = encodeURIComponent(
      `Hola! Mi acceso a Olimpus Gym Pro se encuentra vencido. Mi correo es: ${user?.email || 'N/A'} (UID: ${user?.uid || 'N/A'}). Quisiera renovar mi suscripción mensual.`
    );
    window.open(`https://wa.me/?text=${text}`, '_blank');
  };

  const handleCopySupportInfo = () => {
    const info = `Usuario Olimpus: ${user?.email}\nUID: ${user?.uid}\nEstado: Vencido`;
    navigator.clipboard.writeText(info);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  return (
    <div className="min-h-screen bg-[#060911] text-slate-100 flex flex-col justify-center items-center p-4 relative overflow-hidden select-none">
      {/* Background ambient lighting */}
      <div className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-red-600/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-10 right-1/3 w-80 h-80 bg-orange-600/10 rounded-full blur-3xl pointer-events-none" />

      <div className="w-full max-w-md relative z-10">
        {/* Card */}
        <div className="bg-[#090d16]/95 border border-red-500/30 rounded-3xl p-6 sm:p-8 shadow-2xl shadow-red-950/40 backdrop-blur-xl text-center">
          {/* Lock Icon */}
          <div className="inline-flex items-center justify-center w-20 h-20 rounded-3xl bg-gradient-to-tr from-red-600 via-orange-600 to-amber-500 p-0.5 shadow-xl shadow-red-600/25 mb-5">
            <div className="w-full h-full bg-[#090d16] rounded-[22px] flex items-center justify-center">
              <Lock className="w-9 h-9 text-red-400" />
            </div>
          </div>

          {/* Title */}
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-red-500/15 border border-red-500/30 text-red-400 text-xs font-bold uppercase tracking-wider mb-3">
            <ShieldAlert className="w-3.5 h-3.5" />
            <span>Acceso Bloqueado</span>
          </div>

          <h2 className="text-xl sm:text-2xl font-black text-white tracking-tight mb-2">
            Periodo de Prueba o Mensualidad Vencida
          </h2>

          <p className="text-sm text-slate-300 leading-relaxed mb-6">
            Tu periodo de prueba o mensualidad ha vencido. Contacta al administrador para renovar tu acceso.
          </p>

          {/* Account Detail Box */}
          <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-3.5 mb-6 text-left">
            <div className="flex items-center justify-between text-xs mb-1">
              <span className="text-slate-400">Cuenta:</span>
              <span className="font-semibold text-white truncate max-w-[180px]">{user?.email}</span>
            </div>
            <div className="flex items-center justify-between text-xs">
              <span className="text-slate-400">Estado de suscripción:</span>
              <span className="font-bold text-red-400 uppercase tracking-wider text-[11px] px-2 py-0.5 rounded bg-red-500/10 border border-red-500/20">
                {userProfile?.status === 'trial' ? 'Prueba Vencida' : 'Suspendida'}
              </span>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="space-y-3">
            {/* Contact WhatsApp / Admin button */}
            <button
              onClick={handleContactWhatsApp}
              className="w-full py-3.5 px-4 rounded-xl font-bold text-sm text-white bg-gradient-to-r from-orange-500 via-amber-500 to-yellow-500 hover:from-orange-600 hover:to-amber-600 shadow-lg shadow-orange-500/25 active:scale-[0.99] transition-all flex items-center justify-center gap-2"
            >
              <MessageSquare className="w-4 h-4" />
              <span>Contactar al Administrador</span>
            </button>

            {/* Check/Refresh status if admin already enabled it */}
            <div className="grid grid-cols-2 gap-2">
              <button
                onClick={handleRefresh}
                disabled={isRefreshing}
                className="py-2.5 px-3 rounded-xl font-semibold text-xs text-slate-200 bg-slate-800/80 hover:bg-slate-700 border border-slate-700/60 active:scale-[0.99] transition-all flex items-center justify-center gap-1.5"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${isRefreshing ? 'animate-spin text-orange-400' : ''}`} />
                <span>{isRefreshing ? 'Verificando...' : 'Revisar Acceso'}</span>
              </button>

              <button
                onClick={handleCopySupportInfo}
                className="py-2.5 px-3 rounded-xl font-semibold text-xs text-slate-200 bg-slate-800/80 hover:bg-slate-700 border border-slate-700/60 active:scale-[0.99] transition-all flex items-center justify-center gap-1.5"
              >
                {copied ? <Check className="w-3.5 h-3.5 text-green-400" /> : <AlertTriangle className="w-3.5 h-3.5 text-amber-400" />}
                <span>{copied ? 'Copiado!' : 'Copiar Info'}</span>
              </button>
            </div>

            {/* Sign Out Button */}
            <button
              onClick={logout}
              className="w-full py-2.5 px-4 rounded-xl font-semibold text-xs text-slate-400 hover:text-white bg-transparent hover:bg-slate-900 border border-slate-800 active:scale-[0.99] transition-all flex items-center justify-center gap-2 mt-2"
            >
              <LogOut className="w-4 h-4" />
              <span>Cerrar Sesión</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
