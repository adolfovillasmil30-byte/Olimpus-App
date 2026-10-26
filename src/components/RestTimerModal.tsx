import React, { useState, useEffect, useRef } from 'react';
import {
  Play,
  Pause,
  RotateCcw,
  X,
  Minimize2,
  Maximize2,
  Volume2,
  VolumeX,
  Plus,
  Minus,
  Timer,
  Bell,
  Sparkles,
} from 'lucide-react';
import { playCountdownTick, playTimerCompleted } from '../utils/audio';
import {
  sendTimerCompletedNotification,
  scheduleTimerDoneInWorker,
  cancelTimerDoneInWorker,
  isNotificationSupported,
  requestNotificationPermission,
  getNotificationPermission,
} from '../utils/notifications';

interface RestTimerModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialSeconds?: number;
  exerciseName?: string;
}

const TIMER_STORAGE_KEY = 'olimpus_rest_timer_state_v1';

export const RestTimerModal: React.FC<RestTimerModalProps> = ({
  isOpen,
  onClose,
  initialSeconds = 60,
  exerciseName,
}) => {
  const [totalSeconds, setTotalSeconds] = useState<number>(initialSeconds);
  const [remainingSeconds, setRemainingSeconds] = useState<number>(initialSeconds);
  const [isActive, setIsActive] = useState<boolean>(true);
  const [isMinimized, setIsMinimized] = useState<boolean>(false);
  const [soundEnabled, setSoundEnabled] = useState<boolean>(true);
  const [notifEnabled, setNotifEnabled] = useState<boolean>(() => {
    return isNotificationSupported() && getNotificationPermission() === 'granted';
  });

  // Timestamp-based tracking for screen-off / background survival
  const targetEndTimeRef = useRef<number | null>(null);

  // Sync when opened or initialSeconds changes
  useEffect(() => {
    if (isOpen) {
      setTotalSeconds(initialSeconds);
      setRemainingSeconds(initialSeconds);
      setIsActive(true);
      setIsMinimized(false);
      const targetTime = Date.now() + initialSeconds * 1000;
      targetEndTimeRef.current = targetTime;
      localStorage.setItem(
        TIMER_STORAGE_KEY,
        JSON.stringify({
          targetEndTime: targetTime,
          totalSeconds: initialSeconds,
          exerciseName,
        })
      );
      // Schedule background alarm in Service Worker for screen-off / locked phone
      scheduleTimerDoneInWorker(targetTime, exerciseName);
    } else {
      targetEndTimeRef.current = null;
      localStorage.removeItem(TIMER_STORAGE_KEY);
      cancelTimerDoneInWorker();
      document.title = 'Olimpus - Gym, Racha & Nutrición';
    }
  }, [isOpen, initialSeconds, exerciseName]);

  // Main countdown loop with timestamp synchronization
  // Note: NO notifications during the countdown! Only ONE single notification on 00:00!
  useEffect(() => {
    if (!isOpen) return;

    if (isActive) {
      if (!targetEndTimeRef.current) {
        const targetTime = Date.now() + remainingSeconds * 1000;
        targetEndTimeRef.current = targetTime;
        localStorage.setItem(
          TIMER_STORAGE_KEY,
          JSON.stringify({
            targetEndTime: targetTime,
            totalSeconds,
            exerciseName,
          })
        );
        scheduleTimerDoneInWorker(targetTime, exerciseName);
      }
    } else {
      targetEndTimeRef.current = null;
      localStorage.removeItem(TIMER_STORAGE_KEY);
      cancelTimerDoneInWorker();
    }

    const interval = setInterval(() => {
      if (!isActive || !targetEndTimeRef.current) return;

      const now = Date.now();
      const diffMs = targetEndTimeRef.current - now;
      const calculatedRemaining = Math.max(0, Math.ceil(diffMs / 1000));

      setRemainingSeconds((prev) => {
        // Ticks sound for last 3 seconds
        if (soundEnabled && calculatedRemaining <= 3 && calculatedRemaining > 0 && prev !== calculatedRemaining) {
          playCountdownTick();
        }

        // When reaching EXACTLY 0: Fire ONE single notification with loud pitido & vibration
        if (calculatedRemaining === 0 && prev > 0) {
          sendTimerCompletedNotification(exerciseName);
          targetEndTimeRef.current = null;
          localStorage.removeItem(TIMER_STORAGE_KEY);
          setIsActive(false);
          document.title = '⏱️ ¡Descanso Terminado! - Olimpus';
        } else if (calculatedRemaining > 0) {
          // Tab title update only (NO system push notification spam!)
          const min = Math.floor(calculatedRemaining / 60);
          const sec = calculatedRemaining % 60;
          document.title = `⏱️ ${String(min).padStart(2, '0')}:${String(sec).padStart(2, '0')} - Olimpus`;
        }

        return calculatedRemaining;
      });
    }, 500);

    // Screen wake / Visibility listener:
    // If the phone was locked or turned off, triggers immediately on phone wake if time completed
    const handleVisibilityOrFocus = () => {
      if (isActive && targetEndTimeRef.current) {
        const now = Date.now();
        const diffMs = targetEndTimeRef.current - now;
        const calculatedRemaining = Math.max(0, Math.ceil(diffMs / 1000));
        setRemainingSeconds(calculatedRemaining);

        if (calculatedRemaining === 0) {
          sendTimerCompletedNotification(exerciseName);
          setIsActive(false);
          targetEndTimeRef.current = null;
          localStorage.removeItem(TIMER_STORAGE_KEY);
        }
      }
    };

    window.addEventListener('visibilitychange', handleVisibilityOrFocus);
    window.addEventListener('focus', handleVisibilityOrFocus);

    return () => {
      clearInterval(interval);
      window.removeEventListener('visibilitychange', handleVisibilityOrFocus);
      window.removeEventListener('focus', handleVisibilityOrFocus);
    };
  }, [isOpen, isActive, soundEnabled, totalSeconds, exerciseName]);

  if (!isOpen) return null;

  const minutes = Math.floor(remainingSeconds / 60);
  const seconds = remainingSeconds % 60;
  const formattedTime = `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;

  const adjustTime = (delta: number) => {
    setRemainingSeconds((prev) => {
      const next = Math.max(5, prev + delta);
      setTotalSeconds((t) => Math.max(t, next));
      if (isActive) {
        const targetTime = Date.now() + next * 1000;
        targetEndTimeRef.current = targetTime;
        localStorage.setItem(
          TIMER_STORAGE_KEY,
          JSON.stringify({
            targetEndTime: targetTime,
            totalSeconds: Math.max(totalSeconds, next),
            exerciseName,
          })
        );
        scheduleTimerDoneInWorker(targetTime, exerciseName);
      }
      return next;
    });
  };

  const setPreset = (secs: number) => {
    setTotalSeconds(secs);
    setRemainingSeconds(secs);
    setIsActive(true);
    const targetTime = Date.now() + secs * 1000;
    targetEndTimeRef.current = targetTime;
    localStorage.setItem(
      TIMER_STORAGE_KEY,
      JSON.stringify({
        targetEndTime: targetTime,
        totalSeconds: secs,
        exerciseName,
      })
    );
    scheduleTimerDoneInWorker(targetTime, exerciseName);
  };

  const handleTogglePlayPause = () => {
    if (isActive) {
      // Pausing
      setIsActive(false);
      targetEndTimeRef.current = null;
      localStorage.removeItem(TIMER_STORAGE_KEY);
      cancelTimerDoneInWorker();
    } else {
      // Resuming
      const secsToRun = remainingSeconds === 0 ? totalSeconds : remainingSeconds;
      setRemainingSeconds(secsToRun);
      const targetTime = Date.now() + secsToRun * 1000;
      targetEndTimeRef.current = targetTime;
      localStorage.setItem(
        TIMER_STORAGE_KEY,
        JSON.stringify({
          targetEndTime: targetTime,
          totalSeconds,
          exerciseName,
        })
      );
      scheduleTimerDoneInWorker(targetTime, exerciseName);
      setIsActive(true);
    }
  };

  const handleReset = () => {
    setRemainingSeconds(totalSeconds);
    setIsActive(false);
    targetEndTimeRef.current = null;
    localStorage.removeItem(TIMER_STORAGE_KEY);
    cancelTimerDoneInWorker();
    document.title = 'Olimpus - Gym, Racha & Nutrición';
  };

  const handleEnableNotification = async () => {
    const granted = await requestNotificationPermission();
    setNotifEnabled(granted);
  };

  // Minimized Floating Pill
  if (isMinimized) {
    return (
      <div className="fixed bottom-24 right-4 z-50 flex items-center gap-2.5 bg-gradient-to-r from-orange-600 to-amber-600 text-white px-4 py-2.5 rounded-full shadow-2xl shadow-orange-500/40 border border-orange-400/30 backdrop-blur-md animate-bounce-subtle">
        <Timer className="w-4 h-4 animate-spin" style={{ animationDuration: isActive ? '3s' : '0s' }} />
        <span className="font-mono font-bold text-sm tracking-wider">{formattedTime}</span>
        <button
          onClick={handleTogglePlayPause}
          className="p-1 hover:bg-white/20 rounded-full transition-colors"
          title={isActive ? 'Pausar' : 'Reanudar'}
        >
          {isActive ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5" />}
        </button>
        <button
          onClick={() => setIsMinimized(false)}
          className="p-1 hover:bg-white/20 rounded-full transition-colors"
          title="Maximizar"
        >
          <Maximize2 className="w-3.5 h-3.5" />
        </button>
        <button
          onClick={onClose}
          className="p-1 hover:bg-white/20 rounded-full transition-colors"
          title="Cerrar"
        >
          <X className="w-3.5 h-3.5" />
        </button>
      </div>
    );
  }

  // Full Screen Modal View
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md">
      <div className="w-full max-w-sm bg-gradient-to-b from-slate-900 via-slate-900 to-black border border-slate-800 rounded-3xl p-6 shadow-2xl relative overflow-hidden text-center">
        {/* Glow behind timer */}
        <div className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-48 h-48 bg-orange-500/15 rounded-full blur-3xl pointer-events-none" />

        {/* Top bar */}
        <div className="flex items-center justify-between text-slate-400 mb-2 relative z-10">
          <div className="flex items-center gap-1">
            <button
              onClick={() => setSoundEnabled(!soundEnabled)}
              className={`p-2 rounded-xl transition-colors ${
                soundEnabled ? 'text-orange-400 bg-orange-500/10' : 'text-slate-500 hover:text-slate-300'
              }`}
              title="Activar / Desactivar Sonido"
            >
              {soundEnabled ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
            </button>
            <button
              onClick={handleEnableNotification}
              className={`p-2 rounded-xl transition-colors ${
                notifEnabled ? 'text-emerald-400 bg-emerald-500/10' : 'text-slate-500 hover:text-slate-300'
              }`}
              title={notifEnabled ? 'Notificación final activada' : 'Activar aviso al terminar descanso'}
            >
              <Bell className="w-4 h-4" />
            </button>
          </div>

          <div className="text-center">
            <span className="text-[10px] font-extrabold tracking-wider uppercase text-orange-400">
              Descanso entre series
            </span>
            {exerciseName && (
              <p className="text-xs text-slate-300 truncate max-w-[150px] font-bold">{exerciseName}</p>
            )}
          </div>

          <div className="flex items-center gap-1">
            <button
              onClick={() => setIsMinimized(true)}
              className="p-2 hover:bg-slate-800 rounded-xl transition-colors text-slate-400 hover:text-white"
              title="Minimizar"
            >
              <Minimize2 className="w-4 h-4" />
            </button>
            <button
              onClick={onClose}
              className="p-2 hover:bg-slate-800 rounded-xl transition-colors text-slate-400 hover:text-white"
              title="Cerrar"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Single Notification & Background Alert Indicator */}
        <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-slate-950/80 border border-slate-800 text-[10px] text-slate-400 my-1">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
          <span>Avisa con pitido y notificación única al finalizar</span>
        </div>

        {/* Circular Display */}
        <div className="relative w-52 h-52 mx-auto my-2 flex items-center justify-center">
          <svg className="w-full h-full -rotate-90">
            {/* Background track */}
            <circle
              cx="104"
              cy="104"
              r="88"
              className="stroke-slate-800/80 fill-none"
              strokeWidth="9"
            />
            {/* Animated progress ring */}
            <circle
              cx="104"
              cy="104"
              r="88"
              className={`fill-none transition-all duration-300 ${
                remainingSeconds <= 5 && remainingSeconds > 0
                  ? 'stroke-red-500'
                  : remainingSeconds === 0
                  ? 'stroke-emerald-400'
                  : 'stroke-orange-500'
              }`}
              strokeWidth="9"
              strokeDasharray={2 * Math.PI * 88}
              strokeDashoffset={2 * Math.PI * 88 * (1 - (totalSeconds - remainingSeconds) / totalSeconds)}
              strokeLinecap="round"
            />
          </svg>

          {/* Time readout in center */}
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <span
              className={`font-mono font-black text-5xl tracking-tight transition-transform ${
                remainingSeconds <= 3 && remainingSeconds > 0 ? 'text-red-400 scale-105' : 'text-white'
              }`}
            >
              {formattedTime}
            </span>
            <span className="text-[11px] uppercase font-bold text-slate-400 mt-1">
              {remainingSeconds === 0 ? '¡A darle a la serie!' : isActive ? 'Descansando...' : 'Pausado'}
            </span>
          </div>
        </div>

        {/* Quick adjustments +15 / -15 */}
        <div className="flex items-center justify-center gap-3 my-3">
          <button
            onClick={() => adjustTime(-15)}
            className="flex items-center gap-1 px-3 py-1.5 rounded-full bg-slate-800/80 hover:bg-slate-700 text-xs font-semibold text-slate-300 transition-colors border border-slate-700/50"
          >
            <Minus className="w-3.5 h-3.5" /> 15s
          </button>
          <button
            onClick={() => adjustTime(15)}
            className="flex items-center gap-1 px-3 py-1.5 rounded-full bg-slate-800/80 hover:bg-slate-700 text-xs font-semibold text-slate-300 transition-colors border border-slate-700/50"
          >
            <Plus className="w-3.5 h-3.5" /> 15s
          </button>
        </div>

        {/* Preset buttons */}
        <div className="grid grid-cols-4 gap-2 mb-4">
          {[30, 60, 90, 120].map((secs) => (
            <button
              key={secs}
              onClick={() => setPreset(secs)}
              className={`py-2 px-1 text-xs font-bold rounded-xl transition-all ${
                totalSeconds === secs
                  ? 'bg-orange-500 text-white shadow-lg shadow-orange-500/30'
                  : 'bg-slate-800/60 hover:bg-slate-800 text-slate-400 hover:text-white border border-slate-800'
              }`}
            >
              {secs}s
            </button>
          ))}
        </div>

        {/* Main Controls (Play / Pause / Reset) */}
        <div className="flex items-center justify-center gap-3">
          <button
            onClick={handleReset}
            className="p-3.5 bg-slate-800/80 hover:bg-slate-700 text-slate-300 hover:text-white rounded-2xl transition-all border border-slate-700/50"
            title="Reiniciar"
          >
            <RotateCcw className="w-5 h-5" />
          </button>

          <button
            onClick={handleTogglePlayPause}
            className={`flex-1 py-3.5 px-6 rounded-2xl font-bold flex items-center justify-center gap-2 shadow-lg transition-all active:scale-95 ${
              isActive
                ? 'bg-amber-500/20 text-amber-400 hover:bg-amber-500/30 border border-amber-500/30'
                : 'bg-gradient-to-r from-orange-500 to-amber-500 text-white shadow-orange-500/30 hover:opacity-95'
            }`}
          >
            {isActive ? (
              <>
                <Pause className="w-5 h-5 fill-current" /> Pausar
              </>
            ) : (
              <>
                <Play className="w-5 h-5 fill-current" /> {remainingSeconds === 0 ? 'Repetir' : 'Reanudar'}
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};
