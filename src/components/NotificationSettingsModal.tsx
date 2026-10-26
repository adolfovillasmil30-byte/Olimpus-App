import React, { useState } from 'react';
import {
  Bell,
  X,
  CheckCircle2,
  AlertCircle,
  Flame,
  Dumbbell,
  Target,
  Sparkles,
  Timer,
  Clock,
  Send,
} from 'lucide-react';
import {
  NotificationSettings,
  isNotificationSupported,
  getNotificationPermission,
  requestNotificationPermission,
  sendMotivationalNotification,
  sendTimerCompletedNotification,
} from '../utils/notifications';

interface NotificationSettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  settings: NotificationSettings;
  onUpdateSettings: (settings: NotificationSettings) => void;
}

export const NotificationSettingsModal: React.FC<NotificationSettingsModalProps> = ({
  isOpen,
  onClose,
  settings,
  onUpdateSettings,
}) => {
  const [permission, setPermission] = useState<NotificationPermission>(getNotificationPermission);
  const [testSentMessage, setTestSentMessage] = useState<string | null>(null);

  if (!isOpen) return null;

  const supported = isNotificationSupported();

  const handleRequestPermission = async () => {
    const granted = await requestNotificationPermission();
    setPermission(getNotificationPermission());
    if (granted) {
      onUpdateSettings({ ...settings, enabled: true });
      sendMotivationalNotification('gym');
    }
  };

  const handleSendTest = (type: 'gym' | 'streak' | 'goal' | 'timer') => {
    if (permission !== 'granted') {
      handleRequestPermission();
      return;
    }

    if (type === 'timer') {
      sendTimerCompletedNotification('Press de Banca');
      setTestSentMessage('Notificación de cronómetro enviada');
    } else {
      sendMotivationalNotification(type);
      setTestSentMessage(
        type === 'gym'
          ? 'Enviada: "¡Vamos al Gym! 💪"'
          : type === 'streak'
          ? 'Enviada: "🔥 ¡No pierdas tu racha!"'
          : 'Enviada: "🎯 Cada día más cerca del objetivo"'
      );
    }

    setTimeout(() => setTestSentMessage(null), 3500);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/80 backdrop-blur-sm p-0 sm:p-4">
      <div className="w-full max-w-md bg-slate-900 border border-slate-800 rounded-t-3xl sm:rounded-3xl p-6 shadow-2xl max-h-[92vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-800 mb-4">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-orange-500/10 text-orange-400 border border-orange-500/20">
              <Bell className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-black text-white">Notificaciones & Alertas</h3>
              <p className="text-[11px] text-slate-400">Recordatorios y cronómetro en segundo plano</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-full hover:bg-slate-800 text-slate-400 hover:text-white"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="space-y-4">
          {/* Permission Status Banner */}
          <div
            className={`p-4 rounded-2xl border ${
              permission === 'granted'
                ? 'bg-emerald-950/30 border-emerald-500/40 text-emerald-300'
                : 'bg-amber-950/30 border-amber-500/40 text-amber-300'
            }`}
          >
            <div className="flex items-start gap-3">
              {permission === 'granted' ? (
                <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
              ) : (
                <AlertCircle className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
              )}
              <div className="flex-1">
                <span className="text-xs font-bold block">
                  {permission === 'granted'
                    ? 'Notificaciones activadas en este dispositivo'
                    : 'Permiso de notificaciones pendiente'}
                </span>
                <p className="text-[11px] text-slate-300 mt-0.5">
                  {permission === 'granted'
                    ? 'Recibirás avisos para ir al gym, cuidar tu racha y alertas cuando el cronómetro termine.'
                    : 'Autoriza las notificaciones para que aparezcan en tu barra de estado y pantalla de bloqueo.'}
                </p>

                {permission !== 'granted' && (
                  <button
                    onClick={handleRequestPermission}
                    className="mt-3 px-4 py-2 rounded-xl bg-gradient-to-r from-orange-500 to-amber-500 text-white font-bold text-xs shadow-md shadow-orange-500/20 flex items-center gap-1.5"
                  >
                    <Bell className="w-3.5 h-3.5" />
                    <span>Activar Notificaciones Ahora</span>
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* Test Feedback Pill */}
          {testSentMessage && (
            <div className="p-2.5 rounded-xl bg-emerald-500/20 text-emerald-300 text-xs font-bold text-center border border-emerald-500/30 animate-pulse">
              ✓ {testSentMessage}
            </div>
          )}

          {/* MOTIVATIONAL NOTIFICATIONS TESTING */}
          <div className="bg-slate-950 p-4 rounded-2xl border border-slate-800">
            <span className="text-xs font-bold text-slate-300 uppercase tracking-wider block mb-2">
              Mensajes Motivacionales & Pruebas
            </span>
            <p className="text-[11px] text-slate-400 mb-3">
              Toca para probar cómo se ve y suena cada notificación en tu teléfono:
            </p>

            <div className="space-y-2">
              <button
                onClick={() => handleSendTest('gym')}
                className="w-full p-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-800 text-left flex items-center justify-between text-xs transition-colors group"
              >
                <div className="flex items-center gap-2.5">
                  <Dumbbell className="w-4 h-4 text-orange-400" />
                  <span className="font-bold text-white group-hover:text-orange-300">
                    "¡Vamos al Gym! 💪"
                  </span>
                </div>
                <span className="text-[10px] text-slate-400 flex items-center gap-1 font-mono">
                  <Send className="w-3 h-3" /> Enviar
                </span>
              </button>

              <button
                onClick={() => handleSendTest('streak')}
                className="w-full p-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-800 text-left flex items-center justify-between text-xs transition-colors group"
              >
                <div className="flex items-center gap-2.5">
                  <Flame className="w-4 h-4 text-orange-500" />
                  <span className="font-bold text-white group-hover:text-orange-300">
                    "🔥 ¡No pierdas tu racha!"
                  </span>
                </div>
                <span className="text-[10px] text-slate-400 flex items-center gap-1 font-mono">
                  <Send className="w-3 h-3" /> Enviar
                </span>
              </button>

              <button
                onClick={() => handleSendTest('goal')}
                className="w-full p-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-800 text-left flex items-center justify-between text-xs transition-colors group"
              >
                <div className="flex items-center gap-2.5">
                  <Target className="w-4 h-4 text-cyan-400" />
                  <span className="font-bold text-white group-hover:text-cyan-300">
                    "🎯 Cada día más cerca del objetivo"
                  </span>
                </div>
                <span className="text-[10px] text-slate-400 flex items-center gap-1 font-mono">
                  <Send className="w-3 h-3" /> Enviar
                </span>
              </button>

              <button
                onClick={() => handleSendTest('timer')}
                className="w-full p-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-800 text-left flex items-center justify-between text-xs transition-colors group"
              >
                <div className="flex items-center gap-2.5">
                  <Timer className="w-4 h-4 text-amber-400" />
                  <span className="font-bold text-white group-hover:text-amber-300">
                    "⏱️ ¡Descanso Terminado! A la siguiente serie"
                  </span>
                </div>
                <span className="text-[10px] text-slate-400 flex items-center gap-1 font-mono">
                  <Send className="w-3 h-3" /> Enviar
                </span>
              </button>
            </div>
          </div>

          {/* BACKGROUND RUNNING & SCREEN-OFF BEHAVIOR EXPLANATION */}
          <div className="bg-slate-950/80 p-4 rounded-2xl border border-slate-800">
            <div className="flex items-center gap-2 mb-2">
              <Timer className="w-4 h-4 text-emerald-400" />
              <span className="text-xs font-bold text-white">
                Cronómetro & Recordatorio en Segundo Plano
              </span>
            </div>
            <p className="text-[11px] text-slate-300 leading-relaxed">
              Olimpus utiliza sincronización con reloj interno y Service Worker en segundo plano:
            </p>
            <ul className="text-[11px] text-slate-400 space-y-1.5 mt-2 list-disc list-inside">
              <li>
                <strong className="text-slate-200">Sin spam a cada segundo:</strong> El cronómetro no te llena de notificaciones continuas; envía <strong className="text-orange-400">una única notificación al terminar</strong>.
              </li>
              <li>
                <strong className="text-slate-200">Pitido de aviso:</strong> Al llegar a 00:00, emite un pitido audible y vibración avisando que tu descanso terminó.
              </li>
              <li>
                <strong className="text-slate-200">Pantalla apagada o teléfono bloqueado:</strong> El tiempo sigue corriendo exactamente y el Service Worker lanza la alerta a la hora exacta.
              </li>
            </ul>
          </div>

          {/* Daily Reminder Settings */}
          <div className="bg-slate-950 p-4 rounded-2xl border border-slate-800 space-y-3">
            <div>
              <span className="text-xs font-bold text-slate-300 uppercase tracking-wider block">
                Hora de Recordatorio Diario para ir al Gym
              </span>
              <p className="text-[10px] text-slate-400 mt-0.5">
                La app te enviará la notificación automáticamente a esta hora exacta.
              </p>
            </div>

            <div className="flex items-center justify-between pt-1">
              <span className="text-xs text-slate-300 font-semibold flex items-center gap-1.5">
                <Clock className="w-4 h-4 text-orange-400" /> Hora del aviso
              </span>
              <input
                type="time"
                value={settings.gymReminderTime}
                onChange={(e) =>
                  onUpdateSettings({ ...settings, gymReminderTime: e.target.value })
                }
                className="px-3 py-1.5 rounded-xl bg-slate-900 border border-slate-700 text-white font-mono text-xs focus:border-orange-500"
              />
            </div>
          </div>

          <button
            onClick={onClose}
            className="w-full py-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold transition-colors"
          >
            Listo / Cerrar
          </button>
        </div>
      </div>
    </div>
  );
};
