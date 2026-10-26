import React, { useState } from 'react';
import {
  Flame,
  ChevronLeft,
  ChevronRight,
  CheckCircle2,
  Calendar as CalendarIcon,
  Award,
  Zap,
  Trophy,
  Sparkles,
  Info,
  Check,
  Lock,
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { AttendanceRecord, StreakStats } from '../types';
import { formatDateKey } from '../utils/storage';

interface StreakCalendarViewProps {
  attendance: Record<string, AttendanceRecord>;
  streakStats: StreakStats;
  onToggleAttendance: (dateKey: string) => void;
  onOpenTimer: () => void;
}

export const StreakCalendarView: React.FC<StreakCalendarViewProps> = ({
  attendance,
  streakStats,
  onToggleAttendance,
}) => {
  const [currentDate, setCurrentDate] = useState<Date>(new Date());
  const [selectedDayKey, setSelectedDayKey] = useState<string | null>(formatDateKey());

  const todayKey = formatDateKey();
  const isTodayAttended = Boolean(attendance[todayKey]?.attended);

  // Calendar calculations
  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();

  const monthNames = [
    'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
    'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
  ];
  const dayLabels = ['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom'];

  // Days in month
  const firstDayOfMonth = new Date(year, month, 1);
  const lastDayOfMonth = new Date(year, month + 1, 0);
  const daysInMonth = lastDayOfMonth.getDate();

  // Shift Monday as 0 (Sunday = 6)
  let firstDayIndex = firstDayOfMonth.getDay() - 1;
  if (firstDayIndex === -1) firstDayIndex = 6;

  // Previous month dates to fill initial slots
  const prevMonthLastDay = new Date(year, month, 0).getDate();

  // Count attendance in current visible month
  let monthlyWorkoutsCount = 0;
  for (let d = 1; d <= daysInMonth; d++) {
    const dStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
    if (attendance[dStr]?.attended) {
      monthlyWorkoutsCount++;
    }
  }

  const prevMonth = () => {
    setCurrentDate(new Date(year, month - 1, 1));
  };

  const nextMonth = () => {
    setCurrentDate(new Date(year, month + 1, 1));
  };

  const resetToToday = () => {
    setCurrentDate(new Date());
    setSelectedDayKey(todayKey);
  };

  const handleCelebrateToday = () => {
    onToggleAttendance(todayKey);
    if (!isTodayAttended) {
      confetti({
        particleCount: 80,
        spread: 70,
        origin: { y: 0.6 },
        colors: ['#f97316', '#eab308', '#ef4444', '#fbbf24'],
      });
    }
  };

  // Streak levels & Milestones
  const milestones = [
    { days: 3, label: '3 Días', title: 'Chispa Inicial', icon: Zap },
    { days: 7, label: '7 Días', title: 'Semana de Fuego', icon: Flame },
    { days: 14, label: '14 Días', title: 'Modo Imparable', icon: Trophy },
    { days: 30, label: '30 Días', title: 'Titán del Gym', icon: Award },
  ];

  return (
    <div className="space-y-5 pb-24 max-w-md mx-auto px-4 pt-3">
      {/* HERO RACHA ACTUAL */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-b from-orange-950/70 via-slate-900 to-slate-900 border border-orange-500/30 p-6 text-center shadow-2xl">
        {/* Glow Effects */}
        <div className="absolute -top-12 left-1/2 -translate-x-1/2 w-48 h-48 bg-gradient-to-b from-orange-500/30 to-red-600/10 rounded-full blur-3xl pointer-events-none" />

        {/* Flame Badge */}
        <div className="relative inline-flex items-center justify-center my-2">
          <div className="animate-flame-glow">
            <div className="w-24 h-24 rounded-full bg-gradient-to-tr from-red-600 via-orange-500 to-amber-300 p-1 flex items-center justify-center shadow-2xl">
              <div className="w-full h-full bg-[#0d121f] rounded-full flex flex-col items-center justify-center">
                <Flame className="w-10 h-10 text-orange-500 fill-orange-500 animate-pulse" />
                <span className="text-[10px] font-black tracking-widest text-orange-400 uppercase -mt-1">RACHA</span>
              </div>
            </div>
          </div>

          {/* Number Badge floating */}
          <div className="absolute -bottom-1 -right-1 bg-gradient-to-r from-orange-600 to-amber-500 text-white font-black text-base px-2.5 py-0.5 rounded-full border-2 border-[#090d16] shadow-lg">
            {streakStats.currentStreak}
          </div>
        </div>

        <div className="mt-3">
          <div className="inline-flex items-center gap-1.5 px-3 py-0.5 rounded-full bg-orange-500/10 border border-orange-500/20 text-orange-400 text-[11px] font-black uppercase tracking-wider mb-1">
            <span>Racha Actual</span>
            <span>🔥</span>
          </div>
          <h2 className="text-2xl font-black tracking-tight text-white flex items-center justify-center gap-2">
            <span>{streakStats.currentStreak} Días de Racha</span>
          </h2>
          <p className="text-xs text-slate-300 mt-1 font-medium">
            {isTodayAttended
              ? '¡Excelente trabajo! Has asegurado tu racha de hoy.'
              : '¡Ve a entrenar hoy para mantener viva la llama de tu racha!'}
          </p>
        </div>

        {/* Quick check today button */}
        <button
          onClick={handleCelebrateToday}
          className={`mt-4 w-full py-3 px-4 rounded-2xl font-bold flex items-center justify-center gap-2 text-sm transition-all active:scale-95 shadow-lg ${
            isTodayAttended
              ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 hover:bg-emerald-500/30'
              : 'bg-gradient-to-r from-orange-500 via-amber-500 to-yellow-500 text-white shadow-orange-500/30 hover:brightness-110'
          }`}
        >
          {isTodayAttended ? (
            <>
              <CheckCircle2 className="w-4 h-4 text-emerald-400" />
              <span>Entrenamiento de Hoy Registrado (Completado)</span>
            </>
          ) : (
            <>
              <Flame className="w-4 h-4 fill-white text-white" />
              <span>Marcar Asistencia al Gym de Hoy 🔥</span>
            </>
          )}
        </button>

        {/* Streak Stats mini bar */}
        <div className="grid grid-cols-3 gap-2 mt-4 pt-4 border-t border-slate-800/80">
          <div className="bg-slate-900/80 rounded-xl p-2.5 border border-slate-800/60">
            <span className="text-[10px] uppercase font-bold text-slate-400 block">Actual</span>
            <span className="text-base font-black text-orange-400">{streakStats.currentStreak} días</span>
          </div>
          <div className="bg-slate-900/80 rounded-xl p-2.5 border border-slate-800/60">
            <span className="text-[10px] uppercase font-bold text-slate-400 block">Récord</span>
            <span className="text-base font-black text-amber-300">{streakStats.longestStreak} días</span>
          </div>
          <div className="bg-slate-900/80 rounded-xl p-2.5 border border-slate-800/60">
            <span className="text-[10px] uppercase font-bold text-slate-400 block">Total</span>
            <span className="text-base font-black text-slate-200">{streakStats.totalWorkouts}</span>
          </div>
        </div>
      </div>

      {/* CALENDAR CARD */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-3xl p-5 shadow-xl">
        {/* Calendar Header with Navigation */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-xl bg-orange-500/10 text-orange-400 border border-orange-500/20">
              <CalendarIcon className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-extrabold text-base text-white capitalize">
                {monthNames[month]} {year}
              </h3>
              <p className="text-[11px] text-slate-400">
                {monthlyWorkoutsCount} días asistidos este mes
              </p>
            </div>
          </div>

          <div className="flex items-center gap-1">
            <button
              onClick={resetToToday}
              className="text-[10px] font-bold px-2 py-1 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg transition-colors border border-slate-700"
            >
              Hoy
            </button>
            <button
              onClick={prevMonth}
              className="p-1.5 hover:bg-slate-800 text-slate-400 hover:text-white rounded-lg transition-colors"
              title="Mes anterior"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <button
              onClick={nextMonth}
              className="p-1.5 hover:bg-slate-800 text-slate-400 hover:text-white rounded-lg transition-colors"
              title="Mes siguiente"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Days of week header */}
        <div className="grid grid-cols-7 gap-1 text-center mb-2">
          {dayLabels.map((label) => (
            <span key={label} className="text-[10px] font-bold uppercase tracking-wider text-slate-500">
              {label}
            </span>
          ))}
        </div>

        {/* Calendar Grid */}
        <div className="grid grid-cols-7 gap-1.5">
          {/* Previous month empty days */}
          {Array.from({ length: firstDayIndex }).map((_, i) => {
            const dayNum = prevMonthLastDay - firstDayIndex + i + 1;
            return (
              <div
                key={`prev-${i}`}
                className="h-10 rounded-xl flex items-center justify-center text-xs text-slate-700 font-medium select-none"
              >
                {dayNum}
              </div>
            );
          })}

          {/* Days in current month */}
          {Array.from({ length: daysInMonth }).map((_, i) => {
            const day = i + 1;
            const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
            const isAttended = Boolean(attendance[dateStr]?.attended);
            const isCurrentToday = dateStr === todayKey;
            const isSelected = selectedDayKey === dateStr;

            return (
              <button
                key={dateStr}
                onClick={() => setSelectedDayKey(dateStr)}
                className={`relative h-11 rounded-xl flex flex-col items-center justify-center text-xs font-bold transition-all group ${
                  isSelected
                    ? 'ring-2 ring-orange-400 ring-offset-2 ring-offset-slate-900'
                    : ''
                } ${
                  isAttended
                    ? 'bg-gradient-to-br from-orange-600/40 via-amber-600/30 to-red-600/30 text-white border border-orange-500/50 shadow-md shadow-orange-950/40 hover:brightness-110'
                    : isCurrentToday
                    ? 'bg-slate-800 text-orange-400 border border-slate-700 hover:bg-slate-700'
                    : 'bg-slate-950/40 hover:bg-slate-800/60 text-slate-300 border border-slate-800/50'
                }`}
              >
                {/* Day number */}
                <span className={isAttended ? 'text-white' : isCurrentToday ? 'text-orange-400 font-black' : ''}>
                  {day}
                </span>

                {/* Flame indicator if attended */}
                {isAttended ? (
                  <Flame className="w-3.5 h-3.5 text-orange-400 fill-orange-400 -mt-0.5 animate-pulse" />
                ) : isCurrentToday ? (
                  <span className="w-1.5 h-1.5 rounded-full bg-orange-500 mt-0.5" />
                ) : null}
              </button>
            );
          })}
        </div>

        {/* Selected Day Details Panel */}
        {selectedDayKey && (
          <div className="mt-4 pt-4 border-t border-slate-800 flex items-center justify-between">
            <div>
              <div className="flex items-center gap-1.5">
                <span className="text-xs font-bold text-white">
                  {new Date(selectedDayKey + 'T12:00:00').toLocaleDateString('es-ES', {
                    weekday: 'long',
                    day: 'numeric',
                    month: 'long',
                  })}
                </span>
                {selectedDayKey === todayKey && (
                  <span className="text-[10px] bg-orange-500/20 text-orange-400 px-1.5 py-0.2 rounded font-bold">
                    Hoy
                  </span>
                )}
              </div>
              <p className="text-[11px] text-slate-400 mt-0.5">
                {attendance[selectedDayKey]?.attended
                  ? `Asistencia confirmada 🔥 (${attendance[selectedDayKey]?.workoutName || 'Entrenamiento'})`
                  : 'Sin asistencia registrada'}
              </p>
            </div>

            {selectedDayKey === todayKey ? (
              <button
                onClick={() => onToggleAttendance(selectedDayKey)}
                className={`px-3 py-1.5 text-xs font-bold rounded-xl transition-all ${
                  attendance[selectedDayKey]?.attended
                    ? 'bg-red-500/20 text-red-400 hover:bg-red-500/30 border border-red-500/30'
                    : 'bg-orange-500 hover:bg-orange-600 text-white shadow-md shadow-orange-500/20'
                }`}
              >
                {attendance[selectedDayKey]?.attended ? 'Desmarcar' : '+ Marcar Asistencia'}
              </button>
            ) : (
              <div className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold rounded-xl bg-slate-950/80 border border-slate-800 text-slate-500 select-none">
                <Lock className="w-3.5 h-3.5 text-slate-500" />
                <span>{selectedDayKey < todayKey ? 'Día pasado (Historial)' : 'Día futuro (Pendiente)'}</span>
              </div>
            )}
          </div>
        )}
      </div>

      {/* BADGES & LOGROS DE RACHA */}
      <div className="bg-slate-900/80 border border-slate-800 rounded-3xl p-5 shadow-xl">
        <div className="flex items-center gap-2 mb-3">
          <div className="p-1.5 rounded-lg bg-yellow-500/10 text-yellow-400">
            <Sparkles className="w-4 h-4" />
          </div>
          <h3 className="font-extrabold text-sm text-white">Hitos de Racha Actual</h3>
        </div>

        <div className="grid grid-cols-2 gap-2.5">
          {milestones.map((item) => {
            const isUnlocked = streakStats.longestStreak >= item.days;
            const Icon = item.icon;

            return (
              <div
                key={item.days}
                className={`p-3 rounded-2xl border transition-all ${
                  isUnlocked
                    ? 'bg-gradient-to-br from-amber-500/15 via-orange-500/10 to-transparent border-amber-500/40 text-amber-200 shadow-sm'
                    : 'bg-slate-950/40 border-slate-800/80 text-slate-500 opacity-60'
                }`}
              >
                <div className="flex items-center justify-between mb-1">
                  <div
                    className={`w-7 h-7 rounded-lg flex items-center justify-center ${
                      isUnlocked ? 'bg-amber-500 text-slate-950' : 'bg-slate-800 text-slate-500'
                    }`}
                  >
                    <Icon className="w-4 h-4" />
                  </div>
                  {isUnlocked ? (
                    <span className="text-[10px] font-bold text-emerald-400 flex items-center gap-0.5">
                      <Check className="w-3 h-3" /> Logrado
                    </span>
                  ) : (
                    <span className="text-[10px] font-mono text-slate-500">{item.days}d</span>
                  )}
                </div>
                <h4 className="font-bold text-xs text-white mt-1">{item.title}</h4>
                <p className="text-[10px] text-slate-400">Racha de {item.label}</p>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
