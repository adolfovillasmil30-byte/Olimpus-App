import React, { useState } from 'react';
import {
  Dumbbell,
  Plus,
  Play,
  CheckCircle,
  Timer,
  Trash2,
  Edit2,
  ChevronRight,
  Flame,
  X,
  Save,
  Check,
  Sparkles,
  ArrowLeftRight,
  SlidersHorizontal,
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { DayWorkout, Exercise, AttendanceRecord } from '../types';
import { formatDateKey } from '../utils/storage';

interface GymViewProps {
  workouts: DayWorkout[];
  onUpdateWorkouts: (workouts: DayWorkout[]) => void;
  attendance: Record<string, AttendanceRecord>;
  onToggleAttendance: (dateKey: string, workoutName?: string) => void;
  onStartRestTimer: (seconds: number, exerciseName: string) => void;
}

export const GymView: React.FC<GymViewProps> = ({
  workouts,
  onUpdateWorkouts,
  attendance,
  onToggleAttendance,
  onStartRestTimer,
}) => {
  // Current real day of week: 0 = Domingo, 1 = Lunes, etc.
  const todayDayOfWeek = new Date().getDay();
  const [selectedDayOfWeek, setSelectedDayOfWeek] = useState<number>(todayDayOfWeek);
  const todayKey = formatDateKey();
  const isTodayAttended = Boolean(attendance[todayKey]?.attended);

  // Modal states
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [editingExercise, setEditingExercise] = useState<Exercise | null>(null);
  const [isEditRoutineModalOpen, setIsEditRoutineModalOpen] = useState(false);
  const [isSwapModalOpen, setIsSwapModalOpen] = useState(false);

  // Routine customization state
  const [routineTitleInput, setRoutineTitleInput] = useState('');
  const [selectedFocusMuscles, setSelectedFocusMuscles] = useState<string[]>([]);
  const [swapTargetDay, setSwapTargetDay] = useState<number>(
    todayDayOfWeek === 1 ? 3 : 1 // default suggest Wednesday or Monday
  );

  // Exercise Form state
  const [formName, setFormName] = useState('');
  const [formSets, setFormSets] = useState(4);
  const [formReps, setFormReps] = useState('10-12');
  const [formWeight, setFormWeight] = useState(40);
  const [formMuscle, setFormMuscle] = useState('Pectoral');
  const [formRestSeconds, setFormRestSeconds] = useState(60);
  const [formNotes, setFormNotes] = useState('');

  // Find active workout for selected day
  const currentWorkout = workouts.find((w) => w.dayOfWeek === selectedDayOfWeek) || workouts[0];

  const daysNav = [
    { dayOfWeek: 1, label: 'LUN', full: 'Lunes' },
    { dayOfWeek: 2, label: 'MAR', full: 'Martes' },
    { dayOfWeek: 3, label: 'MIÉ', full: 'Miércoles' },
    { dayOfWeek: 4, label: 'JUE', full: 'Jueves' },
    { dayOfWeek: 5, label: 'VIE', full: 'Viernes' },
    { dayOfWeek: 6, label: 'SÁB', full: 'Sábado' },
    { dayOfWeek: 0, label: 'DOM', full: 'Domingo' },
  ];

  // Muscle group suggestions
  const muscleSuggestions = [
    'Pectoral',
    'Espalda',
    'Cuádriceps',
    'Isquiotibiales',
    'Glúteos',
    'Hombros',
    'Bíceps',
    'Tríceps',
    'Core / Abdomen',
    'Gemelos',
    'Cardio',
  ];

  // Toggle set completion
  const handleToggleSet = (exerciseId: string, setIndex: number) => {
    const updatedWorkouts = workouts.map((w) => {
      if (w.id !== currentWorkout.id) return w;
      return {
        ...w,
        exercises: w.exercises.map((ex) => {
          if (ex.id !== exerciseId) return ex;
          const newCompleted = [...ex.completedSets];
          newCompleted[setIndex] = !newCompleted[setIndex];
          // If just checked it, trigger the rest timer!
          if (newCompleted[setIndex]) {
            onStartRestTimer(ex.restSeconds || 60, ex.name);
          }
          return {
            ...ex,
            completedSets: newCompleted,
          };
        }),
      };
    });
    onUpdateWorkouts(updatedWorkouts);
  };

  // Open edit routine modal
  const openEditRoutineModal = () => {
    setRoutineTitleInput(currentWorkout.workoutName);
    setSelectedFocusMuscles([...currentWorkout.focusMuscles]);
    setIsEditRoutineModalOpen(true);
  };

  // Toggle muscle selection
  const handleToggleMuscle = (muscle: string) => {
    setSelectedFocusMuscles((prev) =>
      prev.includes(muscle) ? prev.filter((m) => m !== muscle) : [...prev, muscle]
    );
  };

  // Preset routine templates
  const routinePresets = [
    { name: 'Pecho, Hombros & Tríceps (Push)', muscles: ['Pectoral', 'Deltoides', 'Tríceps'] },
    { name: 'Espalda & Bíceps (Pull)', muscles: ['Dorsales', 'Trapecios', 'Bíceps'] },
    { name: 'Pierna Completa (Cuádriceps & Gemelos)', muscles: ['Cuádriceps', 'Glúteos', 'Gemelos'] },
    { name: 'Cadena Posterior & Brazos', muscles: ['Isquiotibiales', 'Glúteos', 'Bíceps', 'Tríceps'] },
    { name: 'Torso Pesado & Core', muscles: ['Pectoral', 'Espalda', 'Abdomen'] },
    { name: 'Piernas & Glúteos Focus', muscles: ['Glúteos', 'Isquiotibiales', 'Cuádriceps'] },
    { name: 'Cardio HIIT & Abdomen', muscles: ['Cardio', 'Core / Abdomen'] },
    { name: 'Descanso Activo & Movilidad', muscles: ['Recuperación', 'Movilidad'] },
  ];

  const handleApplyPreset = (preset: { name: string; muscles: string[] }) => {
    setRoutineTitleInput(preset.name);
    setSelectedFocusMuscles(preset.muscles);
  };

  const handleSaveRoutineCustomization = (e: React.FormEvent) => {
    e.preventDefault();
    if (!routineTitleInput.trim()) return;

    const updatedWorkouts = workouts.map((w) => {
      if (w.id !== currentWorkout.id) return w;
      return {
        ...w,
        workoutName: routineTitleInput.trim(),
        focusMuscles: selectedFocusMuscles.length > 0 ? selectedFocusMuscles : ['General'],
      };
    });
    onUpdateWorkouts(updatedWorkouts);
    setIsEditRoutineModalOpen(false);
  };

  // Swap workouts between selected day and another day
  const handleSwapWorkouts = (targetDay: number) => {
    if (targetDay === selectedDayOfWeek) return;

    const targetWorkout = workouts.find((w) => w.dayOfWeek === targetDay);
    if (!currentWorkout || !targetWorkout) return;

    const updatedWorkouts = workouts.map((w) => {
      if (w.dayOfWeek === selectedDayOfWeek) {
        return {
          ...w,
          workoutName: targetWorkout.workoutName,
          focusMuscles: [...targetWorkout.focusMuscles],
          exercises: [...targetWorkout.exercises],
          notes: targetWorkout.notes,
          isRestDay: targetWorkout.isRestDay,
        };
      }
      if (w.dayOfWeek === targetDay) {
        return {
          ...w,
          workoutName: currentWorkout.workoutName,
          focusMuscles: [...currentWorkout.focusMuscles],
          exercises: [...currentWorkout.exercises],
          notes: currentWorkout.notes,
          isRestDay: currentWorkout.isRestDay,
        };
      }
      return w;
    });

    onUpdateWorkouts(updatedWorkouts);
    setIsSwapModalOpen(false);
  };

  // Open add exercise modal
  const openAddModal = () => {
    setEditingExercise(null);
    setFormName('');
    setFormSets(4);
    setFormReps('10-12');
    setFormWeight(30);
    setFormMuscle(currentWorkout.focusMuscles[0] || 'Pectoral');
    setFormRestSeconds(60);
    setFormNotes('');
    setIsAddModalOpen(true);
  };

  // Open edit exercise modal
  const openEditModal = (ex: Exercise) => {
    setEditingExercise(ex);
    setFormName(ex.name);
    setFormSets(ex.sets);
    setFormReps(String(ex.reps));
    setFormWeight(ex.weightKg);
    setFormMuscle(ex.muscleGroup);
    setFormRestSeconds(ex.restSeconds || 60);
    setFormNotes(ex.notes || '');
    setIsAddModalOpen(true);
  };

  // Save exercise (Add or Edit)
  const handleSaveExercise = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formName.trim()) return;

    const setsCount = Math.max(1, formSets);

    if (editingExercise) {
      // Edit
      const updatedWorkouts = workouts.map((w) => {
        if (w.id !== currentWorkout.id) return w;
        return {
          ...w,
          exercises: w.exercises.map((ex) => {
            if (ex.id !== editingExercise.id) return ex;
            // maintain existing completed states or adjust array
            let completed = [...ex.completedSets];
            if (completed.length < setsCount) {
              completed = [...completed, ...Array(setsCount - completed.length).fill(false)];
            } else if (completed.length > setsCount) {
              completed = completed.slice(0, setsCount);
            }
            return {
              ...ex,
              name: formName.trim(),
              sets: setsCount,
              reps: formReps.trim() || '10',
              weightKg: Number(formWeight) || 0,
              muscleGroup: formMuscle,
              restSeconds: formRestSeconds,
              notes: formNotes.trim(),
              completedSets: completed,
            };
          }),
        };
      });
      onUpdateWorkouts(updatedWorkouts);
    } else {
      // Create new
      const newEx: Exercise = {
        id: `ex-${Date.now()}`,
        name: formName.trim(),
        sets: setsCount,
        reps: formReps.trim() || '10',
        weightKg: Number(formWeight) || 0,
        muscleGroup: formMuscle,
        restSeconds: formRestSeconds,
        notes: formNotes.trim(),
        completedSets: Array(setsCount).fill(false),
      };

      const updatedWorkouts = workouts.map((w) => {
        if (w.id !== currentWorkout.id) return w;
        return {
          ...w,
          exercises: [...w.exercises, newEx],
        };
      });
      onUpdateWorkouts(updatedWorkouts);
    }

    setIsAddModalOpen(false);
  };

  // Delete exercise
  const handleDeleteExercise = (exId: string) => {
    if (confirm('¿Eliminar este ejercicio de la rutina?')) {
      const updatedWorkouts = workouts.map((w) => {
        if (w.id !== currentWorkout.id) return w;
        return {
          ...w,
          exercises: w.exercises.filter((ex) => ex.id !== exId),
        };
      });
      onUpdateWorkouts(updatedWorkouts);
    }
  };

  // Mark workout as done for today
  const handleCompleteWorkout = () => {
    onToggleAttendance(todayKey, currentWorkout.workoutName);
    if (!isTodayAttended) {
      confetti({
        particleCount: 100,
        spread: 80,
        origin: { y: 0.6 },
        colors: ['#f97316', '#22c55e', '#3b82f6', '#eab308'],
      });
    }
  };

  const totalSets = currentWorkout.exercises.reduce((acc, ex) => acc + ex.sets, 0);
  const completedSetsCount = currentWorkout.exercises.reduce(
    (acc, ex) => acc + ex.completedSets.filter(Boolean).length,
    0
  );
  const progressPercent = totalSets > 0 ? Math.round((completedSetsCount / totalSets) * 100) : 0;

  return (
    <div className="space-y-4 pb-24 max-w-md mx-auto px-4 pt-3">
      {/* DAY SELECTOR TABS */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none select-none">
        {daysNav.map((item) => {
          const isSelected = selectedDayOfWeek === item.dayOfWeek;
          const isToday = todayDayOfWeek === item.dayOfWeek;

          return (
            <button
              key={item.dayOfWeek}
              onClick={() => setSelectedDayOfWeek(item.dayOfWeek)}
              className={`flex-1 min-w-[50px] py-2 px-1 rounded-2xl flex flex-col items-center justify-center transition-all ${
                isSelected
                  ? 'bg-gradient-to-b from-orange-500 to-amber-600 text-white shadow-lg shadow-orange-500/25 scale-[1.03]'
                  : 'bg-slate-900/80 hover:bg-slate-800 text-slate-400 border border-slate-800'
              }`}
            >
              <span className="text-[10px] font-bold tracking-wider uppercase opacity-80">
                {item.label}
              </span>
              <span className="text-xs font-black mt-0.5">
                {item.dayOfWeek === 0 ? 'D' : item.dayOfWeek}
              </span>
              {isToday && (
                <span
                  className={`w-1 h-1 rounded-full mt-1 ${
                    isSelected ? 'bg-white' : 'bg-orange-400'
                  }`}
                />
              )}
            </button>
          );
        })}
      </div>

      {/* WORKOUT HEADER CARD */}
      <div className="bg-gradient-to-br from-slate-900 via-slate-900 to-[#121927] border border-slate-800 rounded-3xl p-5 shadow-xl">
        <div className="flex items-start justify-between gap-3">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs uppercase font-extrabold tracking-wider text-orange-400">
                {currentWorkout.dayName}
              </span>
              {todayDayOfWeek === selectedDayOfWeek && (
                <span className="text-[10px] bg-emerald-500/20 text-emerald-300 font-bold px-2 py-0.5 rounded-full border border-emerald-500/30">
                  ¡Rutina de Hoy!
                </span>
              )}
            </div>
            <h2 className="text-xl font-black text-white mt-1 tracking-tight">
              {currentWorkout.workoutName}
            </h2>
            <div className="flex flex-wrap gap-1.5 mt-2">
              {currentWorkout.focusMuscles.map((muscle) => (
                <span
                  key={muscle}
                  className="text-[11px] px-2.5 py-0.5 rounded-full bg-slate-800/90 text-slate-300 border border-slate-700/60 font-medium"
                >
                  {muscle}
                </span>
              ))}
            </div>

            {/* Quick Actions: Modificar Músculos & Intercambiar Día */}
            <div className="flex items-center gap-2 mt-3">
              <button
                onClick={openEditRoutineModal}
                className="px-2.5 py-1.5 rounded-xl bg-slate-800/90 hover:bg-slate-800 text-slate-300 hover:text-white transition-all text-xs font-bold border border-slate-700/60 flex items-center gap-1.5 active:scale-95"
                title="Modificar nombre y grupos musculares de este día"
              >
                <SlidersHorizontal className="w-3.5 h-3.5 text-orange-400" />
                <span>Modificar Músculos</span>
              </button>

              <button
                onClick={() => setIsSwapModalOpen(true)}
                className="px-2.5 py-1.5 rounded-xl bg-orange-500/10 hover:bg-orange-500/20 text-orange-400 hover:text-orange-300 transition-all text-xs font-bold border border-orange-500/25 flex items-center gap-1.5 active:scale-95"
                title="Intercambiar la rutina de este día con otro día de la semana"
              >
                <ArrowLeftRight className="w-3.5 h-3.5" />
                <span>Intercambiar Día</span>
              </button>
            </div>
          </div>

          <button
            onClick={openAddModal}
            className="p-3 bg-orange-500 hover:bg-orange-600 active:scale-95 text-white rounded-2xl shadow-lg shadow-orange-500/30 transition-all flex items-center justify-center shrink-0"
            title="Añadir ejercicio a esta rutina"
          >
            <Plus className="w-5 h-5 stroke-[2.5]" />
          </button>
        </div>

        {/* Progress bar of completed sets */}
        <div className="mt-4 pt-4 border-t border-slate-800/80">
          <div className="flex items-center justify-between text-xs mb-1.5">
            <span className="text-slate-400 font-medium">Progreso de la sesión</span>
            <span className="font-mono font-bold text-orange-400">
              {completedSetsCount}/{totalSets} series ({progressPercent}%)
            </span>
          </div>
          <div className="w-full h-2 bg-slate-800 rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-orange-500 to-amber-400 rounded-full transition-all duration-300"
              style={{ width: `${progressPercent}%` }}
            />
          </div>
        </div>

        {/* Attendance Button */}
        <div className="mt-4">
          <button
            onClick={handleCompleteWorkout}
            className={`w-full py-3 px-4 rounded-2xl font-bold flex items-center justify-center gap-2 text-sm transition-all active:scale-95 shadow-lg ${
              isTodayAttended && todayDayOfWeek === selectedDayOfWeek
                ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 hover:bg-emerald-500/30'
                : 'bg-gradient-to-r from-orange-500 to-amber-500 text-white hover:brightness-110 shadow-orange-500/20'
            }`}
          >
            {isTodayAttended && todayDayOfWeek === selectedDayOfWeek ? (
              <>
                <CheckCircle className="w-4 h-4 text-emerald-400" />
                <span>Asistencia al Gym Confirmada 🔥</span>
              </>
            ) : (
              <>
                <Flame className="w-4 h-4 text-white fill-white" />
                <span>Completar y Registrar Asistencia al Gym</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* EXERCISES LIST */}
      <div className="space-y-3">
        <div className="flex items-center justify-between px-1">
          <h3 className="font-extrabold text-sm text-slate-200 uppercase tracking-wider flex items-center gap-1.5">
            <Dumbbell className="w-4 h-4 text-orange-400" />
            <span>Ejercicios Programados ({currentWorkout.exercises.length})</span>
          </h3>
          <span className="text-xs text-slate-400">Toca las series al completarlas</span>
        </div>

        {currentWorkout.exercises.length === 0 ? (
          <div className="bg-slate-900/50 border border-dashed border-slate-800 rounded-3xl p-8 text-center">
            <Dumbbell className="w-10 h-10 text-slate-600 mx-auto mb-2 stroke-[1.5]" />
            <p className="text-slate-300 font-bold text-sm">No hay ejercicios para este día</p>
            <p className="text-slate-500 text-xs mt-1">
              Agrega tu primer ejercicio presionando el botón naranja.
            </p>
            <button
              onClick={openAddModal}
              className="mt-4 px-4 py-2 bg-orange-500 hover:bg-orange-600 text-white rounded-xl text-xs font-bold transition-all shadow-md inline-flex items-center gap-1.5"
            >
              <Plus className="w-4 h-4" /> Añadir Ejercicio
            </button>
          </div>
        ) : (
          currentWorkout.exercises.map((ex, index) => {
            const completedCount = ex.completedSets.filter(Boolean).length;
            const isAllCompleted = completedCount === ex.sets;

            return (
              <div
                key={ex.id}
                className={`rounded-2xl p-4 border transition-all duration-200 ${
                  isAllCompleted
                    ? 'bg-slate-900/90 border-emerald-500/30'
                    : 'bg-slate-900/90 border-slate-800/90 hover:border-slate-700'
                }`}
              >
                {/* Header of Exercise */}
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-start gap-2.5">
                    <span className="w-6 h-6 rounded-lg bg-slate-800 text-slate-400 font-mono text-xs font-bold flex items-center justify-center shrink-0 mt-0.5">
                      {index + 1}
                    </span>
                    <div>
                      <h4 className="font-extrabold text-white text-sm leading-snug">
                        {ex.name}
                      </h4>
                      <div className="flex items-center gap-2 mt-1">
                        <span className="text-[11px] font-semibold text-orange-400 bg-orange-500/10 px-2 py-0.5 rounded-md border border-orange-500/20">
                          {ex.muscleGroup}
                        </span>
                        <span className="text-xs text-slate-300 font-bold">
                          {ex.weightKg > 0 ? `${ex.weightKg} kg` : 'Peso Corporal'}
                        </span>
                        <span className="text-xs text-slate-400">× {ex.reps} reps</span>
                      </div>
                    </div>
                  </div>

                  {/* Actions for exercise */}
                  <div className="flex items-center gap-1">
                    {/* Rest timer quick launcher */}
                    <button
                      onClick={() => onStartRestTimer(ex.restSeconds || 60, ex.name)}
                      className="p-1.5 rounded-lg bg-slate-800/80 hover:bg-slate-700 text-amber-400 transition-colors flex items-center gap-1 text-[11px] font-bold border border-slate-700/50"
                      title="Cronómetro de descanso para este ejercicio"
                    >
                      <Timer className="w-3.5 h-3.5" />
                      <span>{ex.restSeconds || 60}s</span>
                    </button>

                    <button
                      onClick={() => openEditModal(ex)}
                      className="p-1.5 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-slate-200 transition-colors"
                      title="Editar ejercicio"
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                    </button>

                    <button
                      onClick={() => handleDeleteExercise(ex.id)}
                      className="p-1.5 rounded-lg hover:bg-red-500/20 text-slate-500 hover:text-red-400 transition-colors"
                      title="Eliminar ejercicio"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                {/* Notes if any */}
                {ex.notes && (
                  <p className="text-[11px] text-slate-400 mt-2 bg-slate-950/40 p-2 rounded-xl border border-slate-800/60">
                    💡 {ex.notes}
                  </p>
                )}

                {/* Interactive Series Tracker */}
                <div className="mt-3 pt-3 border-t border-slate-800/60">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                      Series: {completedCount}/{ex.sets}
                    </span>
                    <button
                      onClick={() => onStartRestTimer(ex.restSeconds || 60, ex.name)}
                      className="text-[11px] text-amber-400 hover:underline flex items-center gap-1"
                    >
                      <Timer className="w-3 h-3" /> Iniciar Descanso
                    </button>
                  </div>

                  <div className="flex items-center gap-2 flex-wrap">
                    {Array.from({ length: ex.sets }).map((_, sIdx) => {
                      const isDone = Boolean(ex.completedSets[sIdx]);

                      return (
                        <button
                          key={sIdx}
                          onClick={() => handleToggleSet(ex.id, sIdx)}
                          className={`flex-1 min-w-[50px] py-2 px-2 rounded-xl font-mono text-xs font-bold flex items-center justify-center gap-1.5 transition-all active:scale-95 ${
                            isDone
                              ? 'bg-gradient-to-r from-emerald-600 to-teal-500 text-white shadow-md shadow-emerald-950'
                              : 'bg-slate-800/80 hover:bg-slate-700 text-slate-400 border border-slate-700/60'
                          }`}
                        >
                          {isDone ? <Check className="w-3.5 h-3.5 stroke-[3]" /> : null}
                          <span>S{sIdx + 1}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* ADD / EDIT EXERCISE MODAL */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/80 backdrop-blur-sm p-0 sm:p-4">
          <div className="w-full max-w-md bg-slate-900 border border-slate-800 rounded-t-3xl sm:rounded-3xl p-6 shadow-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-4 border-b border-slate-800 mb-4">
              <h3 className="text-lg font-black text-white flex items-center gap-2">
                <Dumbbell className="w-5 h-5 text-orange-500" />
                {editingExercise ? 'Editar Ejercicio' : 'Añadir Nuevo Ejercicio'}
              </h3>
              <button
                onClick={() => setIsAddModalOpen(false)}
                className="p-1.5 rounded-full hover:bg-slate-800 text-slate-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveExercise} className="space-y-4">
              {/* Exercise Name */}
              <div>
                <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-1.5">
                  Nombre del Ejercicio *
                </label>
                <input
                  type="text"
                  required
                  placeholder="Ej: Press Banca, Sentadillas, Curl..."
                  value={formName}
                  onChange={(e) => setFormName(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white placeholder-slate-500 focus:outline-none focus:border-orange-500 text-sm"
                />
              </div>

              {/* Muscle Group */}
              <div>
                <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-1.5">
                  Músculo Principal
                </label>
                <input
                  type="text"
                  value={formMuscle}
                  onChange={(e) => setFormMuscle(e.target.value)}
                  placeholder="Ej: Pectoral, Dorsal, Bíceps..."
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white placeholder-slate-500 focus:outline-none focus:border-orange-500 text-sm mb-2"
                />
                <div className="flex flex-wrap gap-1.5">
                  {muscleSuggestions.slice(0, 6).map((m) => (
                    <button
                      type="button"
                      key={m}
                      onClick={() => setFormMuscle(m)}
                      className={`text-[10px] px-2 py-0.5 rounded-lg border transition-colors ${
                        formMuscle === m
                          ? 'bg-orange-500 text-white border-orange-500 font-bold'
                          : 'bg-slate-800/80 text-slate-400 border-slate-700 hover:text-white'
                      }`}
                    >
                      {m}
                    </button>
                  ))}
                </div>
              </div>

              {/* Sets, Reps, Weight Grid */}
              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-1.5">
                    Series
                  </label>
                  <input
                    type="number"
                    min="1"
                    max="15"
                    value={formSets}
                    onChange={(e) => setFormSets(Number(e.target.value))}
                    className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-white text-center font-bold text-sm focus:border-orange-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-1.5">
                    Reps
                  </label>
                  <input
                    type="text"
                    value={formReps}
                    onChange={(e) => setFormReps(e.target.value)}
                    placeholder="8-10"
                    className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-white text-center font-bold text-sm focus:border-orange-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-1.5">
                    Peso (kg)
                  </label>
                  <input
                    type="number"
                    step="0.5"
                    min="0"
                    value={formWeight}
                    onChange={(e) => setFormWeight(Number(e.target.value))}
                    className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-white text-center font-bold text-sm focus:border-orange-500"
                  />
                </div>
              </div>

              {/* Rest Seconds */}
              <div>
                <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-1.5">
                  Descanso entre series
                </label>
                <div className="flex items-center gap-2">
                  {[45, 60, 90, 120].map((sec) => (
                    <button
                      type="button"
                      key={sec}
                      onClick={() => setFormRestSeconds(sec)}
                      className={`flex-1 py-1.5 rounded-xl text-xs font-bold border transition-colors ${
                        formRestSeconds === sec
                          ? 'bg-amber-500 text-slate-950 border-amber-400'
                          : 'bg-slate-950 text-slate-400 border-slate-800 hover:text-white'
                      }`}
                    >
                      {sec}s
                    </button>
                  ))}
                </div>
              </div>

              {/* Notes */}
              <div>
                <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-1.5">
                  Notas / Consejos de técnica
                </label>
                <input
                  type="text"
                  placeholder="Ej: Pausa abajo de 1 segundo..."
                  value={formNotes}
                  onChange={(e) => setFormNotes(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white placeholder-slate-500 focus:outline-none focus:border-orange-500 text-sm"
                />
              </div>

              {/* Submit Buttons */}
              <div className="pt-2 flex items-center gap-3">
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="flex-1 py-3 px-4 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-sm font-bold transition-colors"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="flex-1 py-3 px-4 rounded-xl bg-gradient-to-r from-orange-500 to-amber-500 hover:opacity-95 text-white text-sm font-bold transition-all shadow-lg shadow-orange-500/25 flex items-center justify-center gap-2"
                >
                  <Save className="w-4 h-4" />
                  <span>Guardar</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* EDIT ROUTINE & MUSCLES MODAL */}
      {isEditRoutineModalOpen && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/80 backdrop-blur-sm p-0 sm:p-4">
          <div className="w-full max-w-md bg-slate-900 border border-slate-800 rounded-t-3xl sm:rounded-3xl p-6 shadow-2xl max-h-[92vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-4 border-b border-slate-800 mb-4">
              <div>
                <span className="text-[10px] uppercase font-bold text-orange-400">
                  {currentWorkout.dayName}
                </span>
                <h3 className="text-lg font-black text-white flex items-center gap-2">
                  <SlidersHorizontal className="w-5 h-5 text-orange-500" />
                  Modificar Grupos Musculares
                </h3>
              </div>
              <button
                onClick={() => setIsEditRoutineModalOpen(false)}
                className="p-1.5 rounded-full hover:bg-slate-800 text-slate-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveRoutineCustomization} className="space-y-4">
              {/* Presets */}
              <div>
                <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-2">
                  Plantillas Rápidas (1-Toque)
                </label>
                <div className="grid grid-cols-2 gap-1.5 max-h-36 overflow-y-auto pr-1">
                  {routinePresets.map((preset) => (
                    <button
                      type="button"
                      key={preset.name}
                      onClick={() => handleApplyPreset(preset)}
                      className="text-left p-2 rounded-xl bg-slate-950 border border-slate-800 hover:border-orange-500/60 text-xs text-slate-300 hover:text-white transition-all"
                    >
                      <span className="font-bold truncate block">{preset.name.split(' (')[0]}</span>
                      <span className="text-[10px] text-slate-500 block truncate">
                        {preset.muscles.join(', ')}
                      </span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Custom Routine Name */}
              <div>
                <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-1.5">
                  Nombre de la Rutina de este Día
                </label>
                <input
                  type="text"
                  required
                  placeholder="Ej: Pecho & Bíceps, Pierna Intensa..."
                  value={routineTitleInput}
                  onChange={(e) => setRoutineTitleInput(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white placeholder-slate-500 focus:outline-none focus:border-orange-500 text-sm font-semibold"
                />
              </div>

              {/* Muscle Chips to toggle */}
              <div>
                <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-1.5">
                  Grupos Musculares Enfocados
                </label>
                <div className="flex flex-wrap gap-1.5">
                  {muscleSuggestions.map((muscle) => {
                    const isSelected = selectedFocusMuscles.includes(muscle);
                    return (
                      <button
                        type="button"
                        key={muscle}
                        onClick={() => handleToggleMuscle(muscle)}
                        className={`text-xs px-3 py-1.5 rounded-xl border transition-all flex items-center gap-1.5 ${
                          isSelected
                            ? 'bg-orange-500 text-white border-orange-500 font-bold shadow-md shadow-orange-500/20'
                            : 'bg-slate-950 text-slate-400 border-slate-800 hover:text-white'
                        }`}
                      >
                        {isSelected && <Check className="w-3.5 h-3.5 stroke-[3]" />}
                        <span>{muscle}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className="pt-2 flex items-center gap-3">
                <button
                  type="button"
                  onClick={() => setIsEditRoutineModalOpen(false)}
                  className="flex-1 py-3 px-4 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-sm font-bold transition-colors"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="flex-1 py-3 px-4 rounded-xl bg-gradient-to-r from-orange-500 to-amber-500 hover:opacity-95 text-white text-sm font-bold transition-all shadow-lg shadow-orange-500/25 flex items-center justify-center gap-2"
                >
                  <Save className="w-4 h-4" />
                  <span>Guardar Cambios</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* SWAP DAYS MODAL */}
      {isSwapModalOpen && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/80 backdrop-blur-sm p-0 sm:p-4">
          <div className="w-full max-w-md bg-slate-900 border border-slate-800 rounded-t-3xl sm:rounded-3xl p-6 shadow-2xl max-h-[92vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-4 border-b border-slate-800 mb-4">
              <h3 className="text-lg font-black text-white flex items-center gap-2">
                <ArrowLeftRight className="w-5 h-5 text-orange-500" />
                Intercambiar Rutinas de Día
              </h3>
              <button
                onClick={() => setIsSwapModalOpen(false)}
                className="p-1.5 rounded-full hover:bg-slate-800 text-slate-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-4">
              {/* Current day banner */}
              <div className="bg-slate-950 p-3.5 rounded-2xl border border-slate-800">
                <span className="text-[10px] font-bold uppercase text-orange-400 block tracking-wider">
                  Día Actual Seleccionado
                </span>
                <span className="text-base font-black text-white mt-0.5 block">
                  {currentWorkout.dayName}
                </span>
                <span className="text-xs text-slate-400 block mt-0.5">
                  {currentWorkout.workoutName} ({currentWorkout.exercises.length} ejercicios)
                </span>
              </div>

              <div className="text-center">
                <div className="w-8 h-8 rounded-full bg-orange-500/10 text-orange-400 border border-orange-500/20 flex items-center justify-center mx-auto">
                  <ArrowLeftRight className="w-4 h-4" />
                </div>
                <span className="text-xs text-slate-400 font-bold mt-1 block">
                  Intercambiar su rutina y ejercicios con:
                </span>
              </div>

              {/* Target days list */}
              <div className="space-y-2">
                {workouts
                  .filter((w) => w.dayOfWeek !== selectedDayOfWeek)
                  .map((w) => {
                    const isSelected = swapTargetDay === w.dayOfWeek;
                    return (
                      <button
                        key={w.id}
                        type="button"
                        onClick={() => setSwapTargetDay(w.dayOfWeek)}
                        className={`w-full text-left p-3 rounded-2xl border transition-all flex items-center justify-between ${
                          isSelected
                            ? 'bg-orange-500/15 border-orange-500 text-white shadow-md'
                            : 'bg-slate-950/60 border-slate-800 hover:border-slate-700 text-slate-300'
                        }`}
                      >
                        <div>
                          <span className="text-xs font-black text-orange-400 block">
                            {w.dayName}
                          </span>
                          <span className="text-sm font-bold text-white block">
                            {w.workoutName}
                          </span>
                          <span className="text-[11px] text-slate-400 block mt-0.5">
                            {w.exercises.length} ejercicios • {w.focusMuscles.join(', ')}
                          </span>
                        </div>
                        <div
                          className={`w-5 h-5 rounded-full border flex items-center justify-center shrink-0 ${
                            isSelected
                              ? 'border-orange-500 bg-orange-500 text-slate-950'
                              : 'border-slate-700 bg-slate-900'
                          }`}
                        >
                          {isSelected && <Check className="w-3.5 h-3.5 stroke-[3]" />}
                        </div>
                      </button>
                    );
                  })}
              </div>

              <p className="text-[11px] text-slate-500 bg-slate-950/80 p-3 rounded-xl border border-slate-800/80">
                💡 Al confirmar, toda la rutina de <strong className="text-slate-300">{currentWorkout.dayName}</strong> pasará al día seleccionado y la de ese día pasará a {currentWorkout.dayName}.
              </p>

              {/* Actions */}
              <div className="pt-2 flex items-center gap-3">
                <button
                  type="button"
                  onClick={() => setIsSwapModalOpen(false)}
                  className="flex-1 py-3 px-4 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-sm font-bold transition-colors"
                >
                  Cancelar
                </button>
                <button
                  type="button"
                  onClick={() => handleSwapWorkouts(swapTargetDay)}
                  className="flex-1 py-3 px-4 rounded-xl bg-gradient-to-r from-orange-500 to-amber-500 hover:opacity-95 text-white text-sm font-bold transition-all shadow-lg shadow-orange-500/25 flex items-center justify-center gap-2"
                >
                  <ArrowLeftRight className="w-4 h-4" />
                  <span>Intercambiar Rutinas</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
