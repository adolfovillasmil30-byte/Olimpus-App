import React from 'react';
import {
  Flame,
  Dumbbell,
  Utensils,
  TrendingUp,
  ChevronRight,
  Plus,
  Timer,
  CheckCircle2,
  Calendar as CalendarIcon,
  Camera,
  Scale,
  Sparkles,
  ArrowUpRight,
  ArrowDownRight,
  Bell,
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { DayWorkout, AttendanceRecord, Meal, NutritionGoal, BodyMeasurement, StreakStats } from '../types';
import { formatDateKey } from '../utils/storage';
import { NavTab } from './BottomNav';

interface DashboardViewProps {
  streakStats: StreakStats;
  workouts: DayWorkout[];
  attendance: Record<string, AttendanceRecord>;
  meals: Meal[];
  goal: NutritionGoal;
  progress: BodyMeasurement[];
  onNavigateTab: (tab: NavTab) => void;
  onToggleAttendance: (dateKey: string) => void;
  onOpenTimer: () => void;
  onOpenNotifications?: () => void;
}

export const DashboardView: React.FC<DashboardViewProps> = ({
  streakStats,
  workouts,
  attendance,
  meals,
  goal,
  progress,
  onNavigateTab,
  onToggleAttendance,
  onOpenTimer,
  onOpenNotifications,
}) => {
  const today = new Date();
  const todayKey = formatDateKey(today);
  const todayDayOfWeek = today.getDay();
  const isTodayAttended = Boolean(attendance[todayKey]?.attended);

  // Today's scheduled workout
  const todayWorkout = workouts.find((w) => w.dayOfWeek === todayDayOfWeek) || workouts[0];

  // Today's meals
  const todayMeals = meals.filter((m) => m.date === todayKey);
  const totalCalories = todayMeals.reduce((acc, m) => acc + (m.calories || 0), 0);
  const calPercent = Math.min(100, Math.round((totalCalories / goal.calories) * 100));

  // Progress stats
  const sortedProgress = [...progress].sort(
    (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()
  );
  const firstProgress = sortedProgress[0];
  const latestProgress = sortedProgress[sortedProgress.length - 1];
  const weightChange = latestProgress && firstProgress
    ? Number((latestProgress.weightKg - firstProgress.weightKg).toFixed(1))
    : 0;
  const muscleChange = latestProgress?.muscleMassKg && firstProgress?.muscleMassKg
    ? Number((latestProgress.muscleMassKg - firstProgress.muscleMassKg).toFixed(1))
    : 0;

  // Mini 7-day attendance strip (last 6 days + today)
  const last7Days = Array.from({ length: 7 }).map((_, i) => {
    const d = new Date(today);
    d.setDate(d.getDate() - (6 - i));
    const key = formatDateKey(d);
    const dayName = d.toLocaleDateString('es-ES', { weekday: 'narrow' }).toUpperCase();
    const dayNumber = d.getDate();
    const attended = Boolean(attendance[key]?.attended);
    const isToday = key === todayKey;
    return { key, dayName, dayNumber, attended, isToday };
  });

  const handleToggleTodayAttendance = () => {
    onToggleAttendance(todayKey);
    if (!isTodayAttended) {
      confetti({
        particleCount: 90,
        spread: 70,
        origin: { y: 0.6 },
        colors: ['#f97316', '#eab308', '#ef4444'],
      });
    }
  };

  return (
    <div className="space-y-4 pb-24 max-w-md mx-auto px-4 pt-3">
      {/* 1. RACHA ACTUAL & CALENDARIO 7 DÍAS */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-orange-950/80 via-slate-900 to-slate-900 border border-orange-500/30 p-5 shadow-2xl">
        {/* Glow */}
        <div className="absolute top-0 right-0 w-44 h-44 bg-gradient-to-b from-orange-500/25 to-red-600/10 rounded-full blur-3xl pointer-events-none" />

        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-red-600 via-orange-500 to-amber-300 p-0.5 shadow-xl shadow-orange-600/30">
              <div className="w-full h-full bg-[#0d121f] rounded-[14px] flex flex-col items-center justify-center animate-flame-glow">
                <Flame className="w-7 h-7 text-orange-500 fill-orange-500" />
              </div>
            </div>

            <div>
              <div className="flex items-center gap-1.5">
                <span className="text-[11px] font-black uppercase tracking-wider text-orange-400">
                  Racha Actual
                </span>
                <span className="text-xs">🔥</span>
              </div>
              <h2 className="text-2xl font-black text-white tracking-tight flex items-baseline gap-1.5">
                <span>{streakStats.currentStreak}</span>
                <span className="text-base font-extrabold text-slate-300">
                  {streakStats.currentStreak === 1 ? 'Día en racha' : 'Días en racha'}
                </span>
              </h2>
            </div>
          </div>

          <button
            onClick={() => onNavigateTab('racha')}
            className="p-2 text-slate-400 hover:text-white rounded-xl hover:bg-slate-800 transition-colors"
            title="Ver calendario completo"
          >
            <ChevronRight className="w-5 h-5" />
          </button>
        </div>

        {/* 7-Day Attendance Mini Strip */}
        <div className="mt-4 pt-3 border-t border-slate-800/80">
          <div className="flex items-center justify-between text-[11px] text-slate-400 mb-2 font-medium">
            <span>Asistencia de los últimos 7 días</span>
            <button
              onClick={() => onNavigateTab('racha')}
              className="text-orange-400 hover:underline font-bold"
            >
              Ver mes
            </button>
          </div>

          <div className="grid grid-cols-7 gap-1.5">
            {last7Days.map((item) => (
              <button
                key={item.key}
                onClick={() => {
                  if (item.isToday) {
                    onToggleAttendance(item.key);
                  }
                }}
                disabled={!item.isToday}
                className={`py-2 rounded-2xl flex flex-col items-center justify-center transition-all ${
                  item.isToday
                    ? 'ring-2 ring-orange-500 ring-offset-2 ring-offset-slate-900 font-black cursor-pointer'
                    : 'cursor-default opacity-90'
                } ${
                  item.attended
                    ? 'bg-gradient-to-b from-orange-600 to-amber-600 text-white shadow-md shadow-orange-950'
                    : 'bg-slate-950/60 text-slate-500 border border-slate-800'
                }`}
                title={
                  item.isToday
                    ? 'Asistencia de hoy'
                    : item.attended
                    ? 'Asistido (Historial no editable)'
                    : 'Sin asistencia (Historial no editable)'
                }
              >
                <span className="text-[9px] uppercase font-bold">{item.dayName}</span>
                <span className="text-xs font-mono font-bold mt-0.5">{item.dayNumber}</span>
                <div className="h-3 flex items-center justify-center mt-0.5">
                  {item.attended ? (
                    <Flame className="w-3 h-3 text-white fill-white animate-pulse" />
                  ) : (
                    <span className="w-1 h-1 rounded-full bg-slate-700" />
                  )}
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Quick check today button */}
        <button
          onClick={handleToggleTodayAttendance}
          className={`mt-4 w-full py-2.5 px-4 rounded-2xl font-bold flex items-center justify-center gap-2 text-xs transition-all active:scale-95 shadow-md ${
            isTodayAttended
              ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 hover:bg-emerald-500/30'
              : 'bg-gradient-to-r from-orange-500 via-amber-500 to-yellow-500 text-white shadow-orange-500/25 hover:brightness-110'
          }`}
        >
          {isTodayAttended ? (
            <>
              <CheckCircle2 className="w-4 h-4 text-emerald-400" />
              <span>¡Día de Gym Asistido! Racha asegurada</span>
            </>
          ) : (
            <>
              <Flame className="w-4 h-4 fill-white" />
              <span>Marcar Asistencia al Gym de Hoy 🔥</span>
            </>
          )}
        </button>
      </div>

      {/* QUICK SHORTCUTS ROW */}
      <div className="grid grid-cols-2 gap-2.5">
        <button
          onClick={onOpenTimer}
          className="bg-slate-900/90 border border-slate-800 hover:border-amber-500/40 p-3.5 rounded-2xl flex items-center gap-3 transition-all active:scale-95 text-left group"
        >
          <div className="w-10 h-10 rounded-xl bg-amber-500/10 text-amber-400 flex items-center justify-center border border-amber-500/20 group-hover:scale-105 transition-transform">
            <Timer className="w-5 h-5" />
          </div>
          <div>
            <span className="text-xs font-black text-white block">Cronómetro</span>
            <span className="text-[10px] text-slate-400">Descanso entre series</span>
          </div>
        </button>

        <button
          onClick={() => onNavigateTab('comidas')}
          className="bg-slate-900/90 border border-slate-800 hover:border-orange-500/40 p-3.5 rounded-2xl flex items-center gap-3 transition-all active:scale-95 text-left group"
        >
          <div className="w-10 h-10 rounded-xl bg-orange-500/10 text-orange-400 flex items-center justify-center border border-orange-500/20 group-hover:scale-105 transition-transform">
            <Camera className="w-5 h-5" />
          </div>
          <div>
            <span className="text-xs font-black text-white block">+ Registrar Comida</span>
            <span className="text-[10px] text-slate-400">Con foto y calorías</span>
          </div>
        </button>
      </div>

      {/* MOTIVATIONAL NOTIFICATIONS SHORTCUT BANNER */}
      {onOpenNotifications && (
        <button
          onClick={onOpenNotifications}
          className="w-full p-3.5 rounded-2xl bg-gradient-to-r from-orange-500/10 via-amber-500/10 to-yellow-500/5 border border-orange-500/25 hover:border-orange-500/50 flex items-center justify-between transition-all active:scale-95 text-left group shadow-sm"
        >
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-orange-500/20 text-orange-400 flex items-center justify-center border border-orange-500/30 group-hover:scale-105 transition-transform">
              <Bell className="w-4 h-4" />
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <span className="text-xs font-black text-white block">
                  Avisos: "¡Vamos al Gym!" & "¡No pierdas tu racha!"
                </span>
              </div>
              <span className="text-[11px] text-slate-400 block mt-0.5">
                Configurar recordatorios y cronómetro en barra de notificaciones
              </span>
            </div>
          </div>
          <ChevronRight className="w-4 h-4 text-orange-400 group-hover:translate-x-0.5 transition-transform shrink-0" />
        </button>
      )}

      {/* 2. TODAY'S WORKOUT CARD */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-3xl p-5 shadow-xl">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-xl bg-orange-500/10 text-orange-400 border border-orange-500/20">
              <Dumbbell className="w-4 h-4" />
            </div>
            <div>
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                Entreno Programado Para Hoy
              </span>
              <h3 className="text-base font-black text-white">{todayWorkout.workoutName}</h3>
            </div>
          </div>

          <button
            onClick={() => onNavigateTab('gym')}
            className="text-xs text-orange-400 font-bold flex items-center gap-0.5 hover:underline"
          >
            <span>Ver Rutina</span>
            <ChevronRight className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Exercises Preview */}
        {todayWorkout.exercises.length === 0 ? (
          <div className="py-3 px-2 text-center bg-slate-950/40 rounded-xl border border-dashed border-slate-800 my-3">
            <p className="text-xs text-slate-400 font-medium">No hay ejercicios para hoy todavía.</p>
            <p className="text-[11px] text-slate-500 mt-0.5">Diseña tu rutina personalizada desde cero.</p>
          </div>
        ) : (
          <div className="space-y-1.5 my-3">
            {todayWorkout.exercises.slice(0, 3).map((ex) => (
              <div
                key={ex.id}
                className="bg-slate-950/60 rounded-xl p-2.5 flex items-center justify-between border border-slate-800/60 text-xs"
              >
                <div className="flex items-center gap-2 truncate">
                  <span className="w-1.5 h-1.5 rounded-full bg-orange-500 shrink-0" />
                  <span className="text-slate-200 font-semibold truncate">{ex.name}</span>
                </div>
                <span className="text-slate-400 font-mono text-[11px] shrink-0">
                  {ex.sets} × {ex.reps} {ex.weightKg > 0 ? `(${ex.weightKg}kg)` : ''}
                </span>
              </div>
            ))}
            {todayWorkout.exercises.length > 3 && (
              <p className="text-[11px] text-slate-500 text-center pt-0.5">
                +{todayWorkout.exercises.length - 3} ejercicios más
              </p>
            )}
          </div>
        )}

        <button
          onClick={() => onNavigateTab('gym')}
          className="w-full py-2.5 bg-slate-800 hover:bg-slate-700 active:scale-95 text-slate-200 text-xs font-bold rounded-xl transition-colors border border-slate-700/80 flex items-center justify-center gap-1.5"
        >
          {todayWorkout.exercises.length === 0 ? (
            <>
              <Plus className="w-3.5 h-3.5 text-orange-400" />
              <span>+ Añadir Primeros Ejercicios a la Rutina</span>
            </>
          ) : (
            <span>Abrir Rutina y Empezar Series</span>
          )}
        </button>
      </div>

      {/* 3. TODAY'S NUTRITION RESUME */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-3xl p-5 shadow-xl">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-xl bg-orange-500/10 text-orange-400 border border-orange-500/20">
              <Utensils className="w-4 h-4" />
            </div>
            <div>
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                Comidas de Hoy
              </span>
              <h3 className="text-base font-black text-white">
                {totalCalories} / {goal.calories} <span className="text-xs text-slate-400 font-normal">kcal</span>
              </h3>
            </div>
          </div>

          <button
            onClick={() => onNavigateTab('comidas')}
            className="text-xs text-orange-400 font-bold flex items-center gap-0.5 hover:underline"
          >
            <span>Ver Platos</span>
            <ChevronRight className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Calorie Bar */}
        <div className="w-full h-2 bg-slate-800 rounded-full overflow-hidden mb-3">
          <div
            className="h-full bg-gradient-to-r from-orange-500 to-amber-400 rounded-full transition-all duration-300"
            style={{ width: `${calPercent}%` }}
          />
        </div>

        {/* Food Photos Thumbnails */}
        {todayMeals.length > 0 ? (
          <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
            {todayMeals.map((meal) => (
              <div
                key={meal.id}
                onClick={() => onNavigateTab('comidas')}
                className="relative min-w-[90px] h-20 rounded-2xl overflow-hidden border border-slate-800 shrink-0 cursor-pointer group shadow-sm"
              >
                {meal.photoUrl ? (
                  <img
                    src={meal.photoUrl}
                    alt={meal.name}
                    className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-200"
                  />
                ) : (
                  <div className="w-full h-full bg-slate-950 flex items-center justify-center text-slate-500">
                    <Utensils className="w-5 h-5" />
                  </div>
                )}
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent flex flex-col justify-end p-1.5">
                  <span className="text-[10px] text-white font-bold truncate leading-tight">
                    {meal.name}
                  </span>
                  <span className="text-[9px] text-orange-300 font-mono">{meal.calories} kcal</span>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="py-2.5 text-center">
            <p className="text-xs text-slate-500">
              Aún no has registrado comidas para hoy.
            </p>
            <button
              onClick={() => onNavigateTab('comidas')}
              className="mt-2 text-xs font-bold text-orange-400 hover:text-orange-300 inline-flex items-center gap-1"
            >
              <Plus className="w-3 h-3" /> Registrar primer plato
            </button>
          </div>
        )}
      </div>

      {/* 4. WEIGHT & MUSCLE SUMMARY */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-3xl p-5 shadow-xl">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-xl bg-orange-500/10 text-orange-400 border border-orange-500/20">
              <TrendingUp className="w-4 h-4" />
            </div>
            <div>
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                Progreso Físico
              </span>
              <h3 className="text-base font-black text-white">Peso & Masa Muscular</h3>
            </div>
          </div>

          <button
            onClick={() => onNavigateTab('progreso')}
            className="text-xs text-orange-400 font-bold flex items-center gap-0.5 hover:underline"
          >
            <span>Ver Gráficos</span>
            <ChevronRight className="w-3.5 h-3.5" />
          </button>
        </div>

        <div className="grid grid-cols-2 gap-3 mt-2">
          {/* Weight */}
          <div className="bg-slate-950/60 rounded-2xl p-3 border border-slate-800/80">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
              Peso Actual
            </span>
            <div className="flex items-baseline gap-1 mt-0.5">
              <span className="text-2xl font-black text-white font-mono">
                {latestProgress ? latestProgress.weightKg : '--'}
              </span>
              <span className="text-xs text-slate-400">{latestProgress ? 'kg' : ''}</span>
            </div>
            <div className="flex items-center gap-1 text-[11px] font-semibold text-slate-400 mt-1">
              {latestProgress ? (
                <>
                  <ArrowDownRight className="w-3.5 h-3.5 text-emerald-400" />
                  <span className="text-emerald-400">{Math.abs(weightChange)} kg registrados</span>
                </>
              ) : (
                <span>Sin registros aún</span>
              )}
            </div>
          </div>

          {/* Muscle */}
          <div className="bg-slate-950/60 rounded-2xl p-3 border border-slate-800/80">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
              Masa Muscular
            </span>
            <div className="flex items-baseline gap-1 mt-0.5">
              <span className="text-2xl font-black text-white font-mono">
                {latestProgress?.muscleMassKg ? latestProgress.muscleMassKg : '--'}
              </span>
              <span className="text-xs text-slate-400">{latestProgress?.muscleMassKg ? 'kg' : ''}</span>
            </div>
            <div className="flex items-center gap-1 text-[11px] font-semibold text-slate-400 mt-1">
              {latestProgress?.muscleMassKg ? (
                <>
                  <ArrowUpRight className="w-3.5 h-3.5 text-emerald-400" />
                  <span className="text-emerald-400">+{muscleChange} kg</span>
                </>
              ) : (
                <span>Sin registros aún</span>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
