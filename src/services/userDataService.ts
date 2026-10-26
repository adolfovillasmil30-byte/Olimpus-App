import {
  collection,
  doc,
  getDocs,
  setDoc,
  deleteDoc,
  writeBatch,
} from 'firebase/firestore';
import { auth, db, handleFirestoreError, OperationType } from '../lib/firebase';
import {
  DayWorkout,
  AttendanceRecord,
  Meal,
  NutritionGoal,
  BodyMeasurement,
} from '../types';
import {
  DEFAULT_WORKOUTS,
  DEFAULT_GOAL,
  getInitialAttendance,
  getInitialMeals,
  getInitialProgress,
} from '../utils/storage';

// Local storage key prefix helpers scoped by user UID
export const getStorageKey = (uid: string, key: string) => `olimpus_${uid}_${key}`;

// Check if user is currently authenticated with matching UID
export const isUserAuthorized = (uid: string): boolean => {
  return !!auth.currentUser && auth.currentUser.uid === uid;
};

// -------------------------------------------------------------
// Workouts (users/{uid}/workouts)
// -------------------------------------------------------------
export async function fetchUserWorkouts(uid: string): Promise<DayWorkout[]> {
  if (!isUserAuthorized(uid)) {
    return DEFAULT_WORKOUTS;
  }

  const cacheKey = getStorageKey(uid, 'workouts');
  const cached = localStorage.getItem(cacheKey);

  try {
    const workoutsCol = collection(db, 'users', uid, 'workouts');
    const snapshot = await getDocs(workoutsCol);

    if (snapshot.empty) {
      // First time user: initialize clean default workouts in Firestore
      const batch = writeBatch(db);
      for (const w of DEFAULT_WORKOUTS) {
        const wDocRef = doc(db, 'users', uid, 'workouts', w.id);
        batch.set(wDocRef, w);
      }
      await batch.commit();

      localStorage.setItem(cacheKey, JSON.stringify(DEFAULT_WORKOUTS));
      return DEFAULT_WORKOUTS;
    }

    const workoutsList: DayWorkout[] = [];
    snapshot.forEach((d) => {
      workoutsList.push(d.data() as DayWorkout);
    });

    // Sort by dayOfWeek to keep Monday -> Sunday sequence
    workoutsList.sort((a, b) => {
      const orderA = a.dayOfWeek === 0 ? 7 : a.dayOfWeek;
      const orderB = b.dayOfWeek === 0 ? 7 : b.dayOfWeek;
      return orderA - orderB;
    });

    localStorage.setItem(cacheKey, JSON.stringify(workoutsList));
    return workoutsList;
  } catch (error) {
    console.warn(`Firestore read failed for workouts of ${uid}:`, error);
    if (cached) {
      try {
        return JSON.parse(cached);
      } catch {
        // ignore parse error
      }
    }
    handleFirestoreError(error, OperationType.LIST, `users/${uid}/workouts`);
    return DEFAULT_WORKOUTS;
  }
}

export async function saveUserWorkouts(uid: string, workouts: DayWorkout[]): Promise<void> {
  const cacheKey = getStorageKey(uid, 'workouts');
  try {
    localStorage.setItem(cacheKey, JSON.stringify(workouts));
  } catch (e) {
    console.warn('Error saving workouts to local cache', e);
  }

  if (!isUserAuthorized(uid)) return;

  try {
    const batch = writeBatch(db);
    for (const w of workouts) {
      const wDocRef = doc(db, 'users', uid, 'workouts', w.id);
      batch.set(wDocRef, w);
    }
    await batch.commit();
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, `users/${uid}/workouts`);
  }
}

// -------------------------------------------------------------
// Attendance (users/{uid}/attendance)
// -------------------------------------------------------------
export async function fetchUserAttendance(uid: string): Promise<Record<string, AttendanceRecord>> {
  if (!isUserAuthorized(uid)) {
    return getInitialAttendance();
  }

  const cacheKey = getStorageKey(uid, 'attendance');
  const cached = localStorage.getItem(cacheKey);

  try {
    const attendanceCol = collection(db, 'users', uid, 'attendance');
    const snapshot = await getDocs(attendanceCol);

    const records: Record<string, AttendanceRecord> = {};
    snapshot.forEach((d) => {
      const data = d.data() as AttendanceRecord;
      if (data && data.date) {
        records[data.date] = data;
      }
    });

    localStorage.setItem(cacheKey, JSON.stringify(records));
    return records;
  } catch (error) {
    console.warn(`Firestore read failed for attendance of ${uid}:`, error);
    if (cached) {
      try {
        return JSON.parse(cached);
      } catch {
        // ignore
      }
    }
    handleFirestoreError(error, OperationType.LIST, `users/${uid}/attendance`);
    return getInitialAttendance();
  }
}

export async function saveUserAttendanceRecord(
  uid: string,
  dateKey: string,
  record: AttendanceRecord | null
): Promise<void> {
  if (!isUserAuthorized(uid)) return;

  try {
    const docRef = doc(db, 'users', uid, 'attendance', dateKey);
    if (record) {
      await setDoc(docRef, record);
    } else {
      await deleteDoc(docRef);
    }
  } catch (error) {
    handleFirestoreError(error, record ? OperationType.WRITE : OperationType.DELETE, `users/${uid}/attendance/${dateKey}`);
  }
}

export async function syncAllUserAttendance(
  uid: string,
  records: Record<string, AttendanceRecord>
): Promise<void> {
  const cacheKey = getStorageKey(uid, 'attendance');
  try {
    localStorage.setItem(cacheKey, JSON.stringify(records));
  } catch (e) {
    console.warn('Error saving attendance to local cache', e);
  }

  if (!isUserAuthorized(uid)) return;

  try {
    const batch = writeBatch(db);
    for (const [dateKey, rec] of Object.entries(records)) {
      if (rec && rec.attended) {
        const docRef = doc(db, 'users', uid, 'attendance', dateKey);
        batch.set(docRef, rec);
      }
    }
    await batch.commit();
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, `users/${uid}/attendance`);
  }
}

// -------------------------------------------------------------
// Meals and Nutrition Goal (users/{uid}/meals)
// -------------------------------------------------------------
export async function fetchUserMealsAndGoal(uid: string): Promise<{
  meals: Meal[];
  goal: NutritionGoal;
}> {
  if (!isUserAuthorized(uid)) {
    return { meals: getInitialMeals(), goal: DEFAULT_GOAL };
  }

  const mealsCacheKey = getStorageKey(uid, 'meals');
  const goalCacheKey = getStorageKey(uid, 'goal');
  const cachedMeals = localStorage.getItem(mealsCacheKey);
  const cachedGoal = localStorage.getItem(goalCacheKey);

  try {
    const mealsCol = collection(db, 'users', uid, 'meals');
    const snapshot = await getDocs(mealsCol);

    const mealsList: Meal[] = [];
    let goal: NutritionGoal = DEFAULT_GOAL;

    snapshot.forEach((d) => {
      if (d.id === '_goal') {
        goal = d.data() as NutritionGoal;
      } else {
        mealsList.push(d.data() as Meal);
      }
    });

    localStorage.setItem(mealsCacheKey, JSON.stringify(mealsList));
    localStorage.setItem(goalCacheKey, JSON.stringify(goal));

    return { meals: mealsList, goal };
  } catch (error) {
    console.warn(`Firestore read failed for meals/goal of ${uid}:`, error);
    let fallbackMeals = getInitialMeals();
    let fallbackGoal = DEFAULT_GOAL;
    if (cachedMeals) {
      try {
        fallbackMeals = JSON.parse(cachedMeals);
      } catch {
        // ignore
      }
    }
    if (cachedGoal) {
      try {
        fallbackGoal = JSON.parse(cachedGoal);
      } catch {
        // ignore
      }
    }
    handleFirestoreError(error, OperationType.LIST, `users/${uid}/meals`);
    return { meals: fallbackMeals, goal: fallbackGoal };
  }
}

export async function saveUserMeals(uid: string, meals: Meal[]): Promise<void> {
  const cacheKey = getStorageKey(uid, 'meals');
  try {
    localStorage.setItem(cacheKey, JSON.stringify(meals));
  } catch (e) {
    console.warn('Error saving meals to local cache', e);
  }

  if (!isUserAuthorized(uid)) return;

  try {
    const batch = writeBatch(db);
    for (const m of meals) {
      const mealRef = doc(db, 'users', uid, 'meals', m.id);
      batch.set(mealRef, m);
    }
    await batch.commit();
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, `users/${uid}/meals`);
  }
}

export async function deleteUserMeal(uid: string, mealId: string): Promise<void> {
  if (!isUserAuthorized(uid)) return;
  try {
    const mealRef = doc(db, 'users', uid, 'meals', mealId);
    await deleteDoc(mealRef);
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, `users/${uid}/meals/${mealId}`);
  }
}

export async function saveUserGoal(uid: string, goal: NutritionGoal): Promise<void> {
  const cacheKey = getStorageKey(uid, 'goal');
  try {
    localStorage.setItem(cacheKey, JSON.stringify(goal));
  } catch (e) {
    console.warn('Error saving goal to local cache', e);
  }

  if (!isUserAuthorized(uid)) return;

  try {
    const goalRef = doc(db, 'users', uid, 'meals', '_goal');
    await setDoc(goalRef, goal);
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, `users/${uid}/meals/_goal`);
  }
}

// -------------------------------------------------------------
// Progress (users/{uid}/progress)
// -------------------------------------------------------------
export async function fetchUserProgress(uid: string): Promise<BodyMeasurement[]> {
  if (!isUserAuthorized(uid)) {
    return getInitialProgress();
  }

  const cacheKey = getStorageKey(uid, 'progress');
  const cached = localStorage.getItem(cacheKey);

  try {
    const progressCol = collection(db, 'users', uid, 'progress');
    const snapshot = await getDocs(progressCol);

    const progressList: BodyMeasurement[] = [];
    snapshot.forEach((d) => {
      progressList.push(d.data() as BodyMeasurement);
    });

    // Sort by date ascending
    progressList.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

    localStorage.setItem(cacheKey, JSON.stringify(progressList));
    return progressList;
  } catch (error) {
    console.warn(`Firestore read failed for progress of ${uid}:`, error);
    if (cached) {
      try {
        return JSON.parse(cached);
      } catch {
        // ignore
      }
    }
    handleFirestoreError(error, OperationType.LIST, `users/${uid}/progress`);
    return getInitialProgress();
  }
}

export async function saveUserProgress(uid: string, progress: BodyMeasurement[]): Promise<void> {
  const cacheKey = getStorageKey(uid, 'progress');
  try {
    localStorage.setItem(cacheKey, JSON.stringify(progress));
  } catch (e) {
    console.warn('Error saving progress to local cache', e);
  }

  if (!isUserAuthorized(uid)) return;

  try {
    const batch = writeBatch(db);
    for (const p of progress) {
      const pRef = doc(db, 'users', uid, 'progress', p.id);
      batch.set(pRef, p);
    }
    await batch.commit();
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, `users/${uid}/progress`);
  }
}

export async function deleteUserProgressRecord(uid: string, progressId: string): Promise<void> {
  if (!isUserAuthorized(uid)) return;
  try {
    const pRef = doc(db, 'users', uid, 'progress', progressId);
    await deleteDoc(pRef);
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, `users/${uid}/progress/${progressId}`);
  }
}

// -------------------------------------------------------------
// Cache Cleanup on User Switch / Logout
// -------------------------------------------------------------
export function clearAllLocalUserData(): void {
  try {
    // Find and remove all keys starting with olimpus_
    const keysToRemove: string[] = [];
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && key.startsWith('olimpus_')) {
        keysToRemove.push(key);
      }
    }
    keysToRemove.forEach((key) => localStorage.removeItem(key));
  } catch (e) {
    console.warn('Error clearing user local data:', e);
  }
}

export function clearSpecificUserData(uid: string): void {
  try {
    const prefix = `olimpus_${uid}_`;
    const keysToRemove: string[] = [];
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && key.startsWith(prefix)) {
        keysToRemove.push(key);
      }
    }
    keysToRemove.forEach((key) => localStorage.removeItem(key));
  } catch (e) {
    console.warn(`Error clearing data for user ${uid}:`, e);
  }
}
