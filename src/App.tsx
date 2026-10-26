/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import {
  DayWorkout,
  AttendanceRecord,
  Meal,
  NutritionGoal,
  BodyMeasurement,
  StreakStats,
} from './types';
import {
  loadWorkouts,
  saveWorkouts,
  loadAttendance,
  saveAttendance,
  loadMeals,
  saveMeals,
  loadGoal,
  saveGoal,
  loadProgress,
  saveProgress,
  calculateStreak,
  formatDateKey,
} from './utils/storage';
import { Header } from './components/Header';
import { BottomNav, NavTab } from './components/BottomNav';
import { DashboardView } from './components/DashboardView';
import { GymView } from './components/GymView';
import { StreakCalendarView } from './components/StreakCalendarView';
import { NutritionView } from './components/NutritionView';
import { ProgressView } from './components/ProgressView';
import { RestTimerModal } from './components/RestTimerModal';
import { NotificationSettingsModal } from './components/NotificationSettingsModal';
import {
  NotificationSettings,
  loadNotifSettings,
  saveNotifSettings,
  sendMotivationalNotification,
  registerServiceWorker,
  syncScheduledGymReminder,
  checkAndTriggerScheduledReminders,
} from './utils/notifications';
import { AuthProvider, useAuth } from './context/AuthContext';
import { AuthScreen } from './components/AuthScreen';
import { SuspendedScreen } from './components/SuspendedScreen';
import { TrialBanner } from './components/TrialBanner';
import { Flame } from 'lucide-react';

function AppContent() {
  const { user, userProfile, loading, isTrialExpired } = useAuth();

  // State initialization from persistent storage
  const [workouts, setWorkouts] = useState<DayWorkout[]>(loadWorkouts);
  const [attendance, setAttendance] = useState<Record<string, AttendanceRecord>>(loadAttendance);
  const [meals, setMeals] = useState<Meal[]>(loadMeals);
  const [goal, setGoal] = useState<NutritionGoal>(loadGoal);
  const [progress, setProgress] = useState<BodyMeasurement[]>(loadProgress);

  // App navigation state
  const [currentTab, setCurrentTab] = useState<NavTab>('inicio');

  // Phone frame simulation toggle for desktop
  const [isPhoneFrame, setIsPhoneFrame] = useState<boolean>(true);

  // Notifications state
  const [isNotifModalOpen, setIsNotifModalOpen] = useState<boolean>(false);
  const [notifSettings, setNotifSettings] = useState<NotificationSettings>(loadNotifSettings);

  // Rest Timer state
  const [isTimerOpen, setIsTimerOpen] = useState<boolean>(false);
  const [timerSeconds, setTimerSeconds] = useState<number>(60);
  const [timerExerciseName, setTimerExerciseName] = useState<string>('');

  // Streak Stats
  const streakStats: StreakStats = calculateStreak(attendance);

  // Auto-save listeners
  useEffect(() => {
    saveWorkouts(workouts);
  }, [workouts]);

  useEffect(() => {
    saveAttendance(attendance);
  }, [attendance]);

  useEffect(() => {
    saveMeals(meals);
  }, [meals]);

  useEffect(() => {
    saveGoal(goal);
  }, [goal]);

  useEffect(() => {
    saveProgress(progress);
  }, [progress]);

  useEffect(() => {
    saveNotifSettings(notifSettings);
  }, [notifSettings]);

  // Register Service Worker and set up background alarm / scheduled reminders
  useEffect(() => {
    registerServiceWorker();
    syncScheduledGymReminder(notifSettings);

    // Initial check on load
    checkAndTriggerScheduledReminders();

    // Check periodically for scheduled gym reminder time
    const reminderInterval = setInterval(() => {
      checkAndTriggerScheduledReminders();
    }, 20000);

    const handleFocusOrWake = () => {
      checkAndTriggerScheduledReminders();
    };

    window.addEventListener('focus', handleFocusOrWake);
    window.addEventListener('visibilitychange', handleFocusOrWake);

    return () => {
      clearInterval(reminderInterval);
      window.removeEventListener('focus', handleFocusOrWake);
      window.removeEventListener('visibilitychange', handleFocusOrWake);
    };
  }, [notifSettings]);

  // Gym Attendance Toggle Handler - Strictly only allows today!
  const handleToggleAttendance = (dateKey: string, workoutName?: string) => {
    const todayKey = formatDateKey();
    // Do not allow editing past or future days
    if (dateKey !== todayKey) {
      return;
    }

    setAttendance((prev) => {
      const existing = prev[dateKey];
      const newAttendance = { ...prev };

      if (existing?.attended) {
        // Toggle off
        delete newAttendance[dateKey];
      } else {
        // Toggle on
        newAttendance[dateKey] = {
          date: dateKey,
          attended: true,
          workoutName: workoutName || 'Entrenamiento en el Gym',
          durationMinutes: 60,
          timestamp: new Date().toISOString(),
        };
      }
      return newAttendance;
    });
  };

  // Launch rest timer from exercise
  const handleStartRestTimer = (seconds: number, exerciseName: string) => {
    setTimerSeconds(seconds);
    setTimerExerciseName(exerciseName);
    setIsTimerOpen(true);
  };

  // Meal handlers
  const handleAddMeal = (newMeal: Meal) => {
    setMeals((prev) => [newMeal, ...prev]);
  };

  const handleDeleteMeal = (mealId: string) => {
    setMeals((prev) => prev.filter((m) => m.id !== mealId));
  };

  // Progress measurement handlers
  const handleAddMeasurement = (newEntry: BodyMeasurement) => {
    setProgress((prev) => {
      // replace if same date or append
      const filtered = prev.filter((p) => p.date !== newEntry.date);
      return [...filtered, newEntry];
    });
  };

  const handleDeleteMeasurement = (id: string) => {
    setProgress((prev) => prev.filter((p) => p.id !== id));
  };

  // Authentication & Subscription Access Control
  if (loading) {
    return (
      <div className="min-h-screen bg-[#060911] text-slate-100 flex flex-col items-center justify-center select-none">
        <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-orange-600 via-amber-500 to-yellow-400 p-0.5 shadow-xl shadow-orange-500/25 mb-4 animate-pulse">
          <div className="w-full h-full bg-[#090d16] rounded-[14px] flex items-center justify-center">
            <Flame className="w-9 h-9 text-orange-500 fill-orange-500" />
          </div>
        </div>
        <div className="w-6 h-6 border-2 border-orange-500/30 border-t-orange-500 rounded-full animate-spin mb-3" />
        <p className="text-xs text-slate-400 font-semibold tracking-wider uppercase">Cargando Olimpus...</p>
      </div>
    );
  }

  // Not authenticated -> Show Login / Register Screen
  if (!user) {
    return <AuthScreen />;
  }

  // Suspended or trial period expired -> Show elegant lock screen
  if (userProfile?.status === 'suspended' || isTrialExpired) {
    return <SuspendedScreen />;
  }

  return (
    <div className="min-h-screen bg-[#060911] text-slate-100 flex flex-col items-center justify-start sm:py-4 selection:bg-orange-500/30 selection:text-orange-200">
      {/* Container wrapper: Native Phone Frame or Full-width view */}
      <div
        className={`w-full transition-all duration-300 relative flex flex-col bg-[#090d16] ${
          isPhoneFrame
            ? 'sm:max-w-[430px] sm:min-h-[860px] sm:my-auto sm:rounded-[44px] sm:border-[9px] sm:border-slate-800/90 sm:shadow-[0_25px_70px_rgba(0,0,0,0.85)] sm:ring-1 sm:ring-slate-700/50 overflow-hidden'
            : 'max-w-xl min-h-screen'
        }`}
      >
        {/* Fixed / Sticky Top Header Region (stays fixed when scrolling) */}
        <div className="sticky top-0 z-30 w-full bg-[#090d16]">
          {/* Trial period notification banner (Top of screen) */}
          <TrialBanner />

          {/* Dynamic Island / Mobile Phone Notch Simulation (only on desktop phone frame) */}
          {isPhoneFrame && (
            <div className="hidden sm:flex items-center justify-between px-6 pt-6 pb-2 select-none text-[11px] font-semibold text-slate-400">
              <span>9:41</span>
              {/* Pill Notch */}
              <div className="w-24 h-4 bg-black rounded-full flex items-center justify-center gap-2 border border-slate-800">
                <span className="w-2.5 h-2.5 rounded-full bg-slate-900 border border-slate-800" />
                <span className="w-1.5 h-1.5 rounded-full bg-blue-500/80" />
              </div>
              <div className="flex items-center gap-1.5 text-xs">
                <span>5G</span>
                <span className="font-bold">100%</span>
              </div>
            </div>
          )}

          {/* Header with Olimpus Brand & Streak Counter */}
          <Header
            streakStats={streakStats}
            onOpenTimer={() => setIsTimerOpen(true)}
            onOpenStreakTab={() => setCurrentTab('racha')}
            isPhoneFrame={isPhoneFrame}
            onTogglePhoneFrame={() => setIsPhoneFrame(!isPhoneFrame)}
          />
        </div>

        {/* Tab Content Router */}
        <main className="flex-1 overflow-y-auto">
          {currentTab === 'inicio' && (
            <DashboardView
              streakStats={streakStats}
              workouts={workouts}
              attendance={attendance}
              meals={meals}
              goal={goal}
              progress={progress}
              onNavigateTab={(tab) => setCurrentTab(tab)}
              onToggleAttendance={handleToggleAttendance}
              onOpenTimer={() => setIsTimerOpen(true)}
              onOpenNotifications={() => setIsNotifModalOpen(true)}
            />
          )}

          {currentTab === 'gym' && (
            <GymView
              workouts={workouts}
              onUpdateWorkouts={setWorkouts}
              attendance={attendance}
              onToggleAttendance={handleToggleAttendance}
              onStartRestTimer={handleStartRestTimer}
            />
          )}

          {currentTab === 'racha' && (
            <StreakCalendarView
              attendance={attendance}
              streakStats={streakStats}
              onToggleAttendance={handleToggleAttendance}
              onOpenTimer={() => setIsTimerOpen(true)}
            />
          )}

          {currentTab === 'comidas' && (
            <NutritionView
              meals={meals}
              goal={goal}
              onAddMeal={handleAddMeal}
              onDeleteMeal={handleDeleteMeal}
              onUpdateGoal={setGoal}
            />
          )}

          {currentTab === 'progreso' && (
            <ProgressView
              progress={progress}
              onAddMeasurement={handleAddMeasurement}
              onDeleteMeasurement={handleDeleteMeasurement}
            />
          )}
        </main>

        {/* Native Mobile Bottom Navigation Bar */}
        <BottomNav
          currentTab={currentTab}
          onTabChange={setCurrentTab}
          streakCount={streakStats.currentStreak}
        />

        {/* Interactive Rest Timer Modal / Floating Pill */}
        <RestTimerModal
          isOpen={isTimerOpen}
          onClose={() => setIsTimerOpen(false)}
          initialSeconds={timerSeconds}
          exerciseName={timerExerciseName}
        />

        {/* Motivational Notifications & Background Settings Modal */}
        <NotificationSettingsModal
          isOpen={isNotifModalOpen}
          onClose={() => setIsNotifModalOpen(false)}
          settings={notifSettings}
          onUpdateSettings={setNotifSettings}
        />
      </div>
    </div>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}

