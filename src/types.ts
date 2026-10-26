export interface Exercise {
  id: string;
  name: string;
  sets: number;
  reps: string;
  weightKg: number;
  completedSets: boolean[];
  muscleGroup: string;
  restSeconds?: number;
  notes?: string;
}

export interface DayWorkout {
  id: string;
  dayOfWeek: number; // 0 = Domingo, 1 = Lunes, ..., 6 = Sábado
  dayName: string;
  workoutName: string;
  focusMuscles: string[];
  exercises: Exercise[];
  notes?: string;
  isRestDay?: boolean;
}

export interface AttendanceRecord {
  date: string; // YYYY-MM-DD
  attended: boolean;
  workoutName?: string;
  durationMinutes?: number;
  timestamp: string;
  notes?: string;
}

export interface Meal {
  id: string;
  date: string; // YYYY-MM-DD
  type: 'desayuno' | 'almuerzo' | 'cena' | 'snack';
  name: string;
  calories: number;
  protein: number; // grams
  carbs: number; // grams
  fat: number; // grams
  photoUrl?: string;
  time: string;
}

export interface NutritionGoal {
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
}

export interface BodyMeasurement {
  id: string;
  date: string; // YYYY-MM-DD
  weightKg: number;
  muscleMassKg?: number;
  bodyFatPercent?: number;
  chestCm?: number;
  waistCm?: number;
  armsCm?: number;
  thighsCm?: number;
  hipsCm?: number;
  notes?: string;
}

export interface StreakStats {
  currentStreak: number;
  longestStreak: number;
  totalWorkouts: number;
  lastWorkoutDate: string | null;
}
