import { DayWorkout, AttendanceRecord, Meal, NutritionGoal, BodyMeasurement, StreakStats } from '../types';

const STORAGE_KEYS = {
  VERSION_CHECK: 'olimpus_clean_slate_v2',
  WORKOUTS: 'olimpus_workouts_v2',
  ATTENDANCE: 'olimpus_attendance_v2',
  MEALS: 'olimpus_meals_v2',
  GOAL: 'olimpus_goal_v2',
  PROGRESS: 'olimpus_progress_v2',
};

// Auto-clean old mock data from previous versions if present
(function purgeLegacyMockData() {
  try {
    const isCleaned = localStorage.getItem(STORAGE_KEYS.VERSION_CHECK);
    if (!isCleaned) {
      // Remove legacy fitstreak mock keys
      localStorage.removeItem('fitstreak_workouts_v1');
      localStorage.removeItem('fitstreak_attendance_v1');
      localStorage.removeItem('fitstreak_meals_v1');
      localStorage.removeItem('fitstreak_progress_v1');
      localStorage.removeItem('fitstreak_goal_v1');
      localStorage.setItem(STORAGE_KEYS.VERSION_CHECK, 'true');
    }
  } catch (e) {
    console.warn('Unable to purge legacy keys', e);
  }
})();

// Format Date YYYY-MM-DD in local time
export function formatDateKey(d: Date = new Date()): string {
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export function parseDateKey(dateStr: string): Date {
  const [y, m, d] = dateStr.split('-').map(Number);
  return new Date(y, m - 1, d);
}

// Initial clean routines (7 days ready for user customization with empty exercises)
export const DEFAULT_WORKOUTS: DayWorkout[] = [
  {
    id: 'w-1',
    dayOfWeek: 1, // Lunes
    dayName: 'Lunes',
    workoutName: 'Pecho, Hombros & Tríceps',
    focusMuscles: ['Pectoral', 'Hombros', 'Tríceps'],
    exercises: [],
  },
  {
    id: 'w-2',
    dayOfWeek: 2, // Martes
    dayName: 'Martes',
    workoutName: 'Espalda & Bíceps',
    focusMuscles: ['Espalda', 'Bíceps'],
    exercises: [],
  },
  {
    id: 'w-3',
    dayOfWeek: 3, // Miércoles
    dayName: 'Miércoles',
    workoutName: 'Pierna Completa & Core',
    focusMuscles: ['Cuádriceps', 'Isquiotibiales', 'Glúteos'],
    exercises: [],
  },
  {
    id: 'w-4',
    dayOfWeek: 4, // Jueves
    dayName: 'Jueves',
    workoutName: 'Torso & Brazos',
    focusMuscles: ['Pectoral', 'Espalda', 'Hombros'],
    exercises: [],
  },
  {
    id: 'w-5',
    dayOfWeek: 5, // Viernes
    dayName: 'Viernes',
    workoutName: 'Cadena Posterior & Brazos',
    focusMuscles: ['Piernas', 'Bíceps', 'Tríceps'],
    exercises: [],
  },
  {
    id: 'w-6',
    dayOfWeek: 6, // Sábado
    dayName: 'Sábado',
    workoutName: 'Cardio HIIT & Abdomen',
    focusMuscles: ['Cardio', 'Core / Abdomen'],
    exercises: [],
  },
  {
    id: 'w-0',
    dayOfWeek: 0, // Domingo
    dayName: 'Domingo',
    workoutName: 'Descanso Activo & Movilidad',
    focusMuscles: ['Recuperación', 'Movilidad'],
    isRestDay: true,
    exercises: [],
  },
];

// Initial attendance records: completely empty (virgin slate, 0 days marked)
export const getInitialAttendance = (): Record<string, AttendanceRecord> => {
  return {};
};

// Initial meals: completely empty (virgin slate, no pre-loaded food photos)
export const getInitialMeals = (): Meal[] => {
  return [];
};

export const DEFAULT_GOAL: NutritionGoal = {
  calories: 2200,
  protein: 160,
  carbs: 230,
  fat: 65,
};

// Initial progress & body measurements: completely empty (virgin slate, no pre-loaded weights)
export const getInitialProgress = (): BodyMeasurement[] => {
  return [];
};

// Calculate Streak statistics
export function calculateStreak(attendance: Record<string, AttendanceRecord>): StreakStats {
  const dates = Object.keys(attendance)
    .filter((k) => attendance[k]?.attended)
    .sort();

  if (dates.length === 0) {
    return {
      currentStreak: 0,
      longestStreak: 0,
      totalWorkouts: 0,
      lastWorkoutDate: null,
    };
  }

  const todayStr = formatDateKey(new Date());
  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);
  const yesterdayStr = formatDateKey(yesterday);

  let currentStreak = 0;
  // Check if today or yesterday was attended to see if streak is alive
  const hasToday = attendance[todayStr]?.attended;
  const hasYesterday = attendance[yesterdayStr]?.attended;

  if (hasToday || hasYesterday) {
    let checkDate = hasToday ? new Date() : yesterday;
    while (true) {
      const key = formatDateKey(checkDate);
      if (attendance[key]?.attended) {
        currentStreak++;
        checkDate.setDate(checkDate.getDate() - 1);
      } else {
        break;
      }
    }
  }

  // Calculate longest streak across history
  let longestStreak = 0;
  let tempStreak = 0;
  let prevDate: Date | null = null;

  for (const dateStr of dates) {
    const curDate = parseDateKey(dateStr);
    if (!prevDate) {
      tempStreak = 1;
    } else {
      const diffDays = Math.round((curDate.getTime() - prevDate.getTime()) / (1000 * 60 * 60 * 24));
      if (diffDays === 1) {
        tempStreak++;
      } else if (diffDays > 1) {
        tempStreak = 1;
      }
    }
    if (tempStreak > longestStreak) {
      longestStreak = tempStreak;
    }
    prevDate = curDate;
  }

  longestStreak = Math.max(longestStreak, currentStreak);

  return {
    currentStreak,
    longestStreak,
    totalWorkouts: dates.length,
    lastWorkoutDate: dates[dates.length - 1],
  };
}

// Storage helpers
export function loadWorkouts(): DayWorkout[] {
  try {
    const data = localStorage.getItem(STORAGE_KEYS.WORKOUTS);
    if (data) {
      const parsed = JSON.parse(data);
      if (Array.isArray(parsed) && parsed.length > 0) {
        return parsed;
      }
    }
  } catch (e) {
    console.warn('Error reading workouts', e);
  }
  return DEFAULT_WORKOUTS;
}

export function saveWorkouts(workouts: DayWorkout[]) {
  try {
    localStorage.setItem(STORAGE_KEYS.WORKOUTS, JSON.stringify(workouts));
  } catch (e) {
    console.warn('Error saving workouts', e);
  }
}

export function loadAttendance(): Record<string, AttendanceRecord> {
  try {
    const data = localStorage.getItem(STORAGE_KEYS.ATTENDANCE);
    if (data) return JSON.parse(data);
  } catch (e) {
    console.warn('Error reading attendance', e);
  }
  return getInitialAttendance();
}

export function saveAttendance(records: Record<string, AttendanceRecord>) {
  try {
    localStorage.setItem(STORAGE_KEYS.ATTENDANCE, JSON.stringify(records));
  } catch (e) {
    console.warn('Error saving attendance', e);
  }
}

export function loadMeals(): Meal[] {
  try {
    const data = localStorage.getItem(STORAGE_KEYS.MEALS);
    if (data) return JSON.parse(data);
  } catch (e) {
    console.warn('Error reading meals', e);
  }
  return getInitialMeals();
}

export function saveMeals(meals: Meal[]) {
  try {
    localStorage.setItem(STORAGE_KEYS.MEALS, JSON.stringify(meals));
  } catch (e) {
    console.warn('Error saving meals', e);
  }
}

export function loadGoal(): NutritionGoal {
  try {
    const data = localStorage.getItem(STORAGE_KEYS.GOAL);
    if (data) return JSON.parse(data);
  } catch (e) {
    console.warn('Error reading goal', e);
  }
  return DEFAULT_GOAL;
}

export function saveGoal(goal: NutritionGoal) {
  try {
    localStorage.setItem(STORAGE_KEYS.GOAL, JSON.stringify(goal));
  } catch (e) {
    console.warn('Error saving goal', e);
  }
}

export function loadProgress(): BodyMeasurement[] {
  try {
    const data = localStorage.getItem(STORAGE_KEYS.PROGRESS);
    if (data) return JSON.parse(data);
  } catch (e) {
    console.warn('Error reading progress', e);
  }
  return getInitialProgress();
}

export function saveProgress(progress: BodyMeasurement[]) {
  try {
    localStorage.setItem(STORAGE_KEYS.PROGRESS, JSON.stringify(progress));
  } catch (e) {
    console.warn('Error saving progress', e);
  }
}

// Reset all user data back to blank virgin state
export function resetAppToVirginState() {
  try {
    localStorage.removeItem(STORAGE_KEYS.WORKOUTS);
    localStorage.removeItem(STORAGE_KEYS.ATTENDANCE);
    localStorage.removeItem(STORAGE_KEYS.MEALS);
    localStorage.removeItem(STORAGE_KEYS.PROGRESS);
    localStorage.setItem(STORAGE_KEYS.VERSION_CHECK, 'true');
  } catch (e) {
    console.warn('Error resetting app', e);
  }
}
