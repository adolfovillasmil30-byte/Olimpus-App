import React from 'react';
import { motion } from 'framer-motion';
import {
  X,
  Target,
  Sparkles,
  TrendingUp,
  CheckCircle2,
  AlertCircle,
  Flame,
  Award,
  ChevronRight,
  ShieldCheck,
  Dumbbell,
  Zap,
} from 'lucide-react';
import { Meal, NutritionGoal } from '../types';

interface MealNutritionModalProps {
  meal: Meal;
  dailyGoal: NutritionGoal;
  onClose: () => void;
  onDelete?: (mealId: string) => void;
}

// Proportional targets based on meal type
const MEAL_PROPORTIONS: Record<
  Meal['type'],
  { label: string; icon: string; ratio: number; percentText: string; description: string }
> = {
  desayuno: {
    label: 'Desayuno',
    icon: '🌅',
    ratio: 0.25,
    percentText: '25%',
    description: 'Activación metabólica y reserva inicial de energía',
  },
  almuerzo: {
    label: 'Almuerzo',
    icon: '☀️',
    ratio: 0.35,
    percentText: '35%',
    description: 'Comida principal para recarga de glucógeno y síntesis muscular',
  },
  cena: {
    label: 'Cena',
    icon: '🌙',
    ratio: 0.25,
    percentText: '25%',
    description: 'Reparación muscular nocturna y digestión equilibrada',
  },
  snack: {
    label: 'Snacks & Merienda',
    icon: '🍎',
    ratio: 0.15,
    percentText: '15%',
    description: 'Control de saciedad y soporte metabólico continuo',
  },
};

export const MealNutritionModal: React.FC<MealNutritionModalProps> = ({
  meal,
  dailyGoal,
  onClose,
  onDelete,
}) => {
  const mealConfig = MEAL_PROPORTIONS[meal.type] || MEAL_PROPORTIONS.almuerzo;

  // Individual goal targets for this specific meal type
  const targetCalories = Math.round(dailyGoal.calories * mealConfig.ratio);
  const targetProtein = Math.round(dailyGoal.protein * mealConfig.ratio);
  const targetCarbs = Math.round(dailyGoal.carbs * mealConfig.ratio);
  const targetFat = Math.round(dailyGoal.fat * mealConfig.ratio);

  // Actual values
  const actualCalories = meal.calories || 0;
  const actualProtein = meal.protein || 0;
  const actualCarbs = meal.carbs || 0;
  const actualFat = meal.fat || 0;

  // Ratio fulfillment (capped visually at 150%)
  const pScore = targetProtein > 0 ? actualProtein / targetProtein : 1;
  const cScore = targetCarbs > 0 ? actualCarbs / targetCarbs : 1;
  const fScore = targetFat > 0 ? actualFat / targetFat : 1;
  const calScore = targetCalories > 0 ? actualCalories / targetCalories : 1;

  // Calculate Positivity Score toward fitness goal (0 - 100)
  // Higher emphasis on protein compliance (40%), controlled calories (30%), balanced carbs (15%) and healthy fats (15%)
  const scoreComponent = (actual: number, target: number, weight: number, penalizeExcess = true) => {
    if (target === 0) return weight * 100;
    const ratio = actual / target;
    let accuracy = 0;
    if (ratio <= 1) {
      accuracy = ratio * 100;
    } else {
      // If exceeds target
      if (penalizeExcess) {
        accuracy = Math.max(0, 100 - (ratio - 1) * 70);
      } else {
        accuracy = 100; // Protein surplus isn't heavily penalized in gym context
      }
    }
    return accuracy * (weight / 100);
  };

  const proteinPoints = scoreComponent(actualProtein, targetProtein, 40, false);
  const calPoints = scoreComponent(actualCalories, targetCalories, 30, true);
  const carbsPoints = scoreComponent(actualCarbs, targetCarbs, 15, true);
  const fatPoints = scoreComponent(actualFat, targetFat, 15, true);

  const rawPositivity = Math.round(proteinPoints + calPoints + carbsPoints + fatPoints);
  const positivityScore = Math.min(100, Math.max(10, isNaN(rawPositivity) ? 80 : rawPositivity));

  // Determine qualitative verdict
  let verdictTitle = 'Comida Muy Favorable';
  let verdictColor = 'text-emerald-400';
  let verdictBg = 'bg-emerald-500/10 border-emerald-500/20';
  let verdictIcon = Sparkles;
  let verdictSummary =
    'Esta comida aporta los macronutrientes idóneos para mantener la síntesis proteica y mantener tus niveles de energía.';

  if (positivityScore >= 88) {
    verdictTitle = 'Óptima para tu Objetivo';
    verdictColor = 'text-emerald-400';
    verdictBg = 'bg-emerald-500/10 border-emerald-500/25';
    verdictIcon = Award;
    verdictSummary =
      'Excelente proporción. Cumple con precisión la cuota proteica y calórica asignada para este tiempo de comida.';
  } else if (positivityScore >= 72) {
    verdictTitle = 'Muy Positiva y Nutritiva';
    verdictColor = 'text-cyan-400';
    verdictBg = 'bg-cyan-500/10 border-cyan-500/25';
    verdictIcon = TrendingUp;
    verdictSummary =
      'Gran impacto positivo. Buen balance de macronutrientes que apoya directamente tu rendimiento y recuperación muscular.';
  } else if (positivityScore >= 55) {
    verdictTitle = 'Moderadamente Alineada';
    verdictColor = 'text-amber-400';
    verdictBg = 'bg-amber-500/10 border-amber-500/25';
    verdictIcon = Target;
    verdictSummary =
      'Aporte aceptable. Para optimizarla aún más, ajusta la cantidad de proteína o carbohidratos en tus siguientes comidas del día.';
  } else {
    verdictTitle = 'Ajustable para tu Meta';
    verdictColor = 'text-orange-400';
    verdictBg = 'bg-orange-500/10 border-orange-500/25';
    verdictIcon = AlertCircle;
    verdictSummary =
      'Esta comida difiere un poco del objetivo estimado para este horario. Puedes compensar en las comidas restantes.';
  }

  // Calculate actual calorie contribution percentages from macros (P: 4kcal/g, C: 4kcal/g, F: 9kcal/g)
  const pCal = actualProtein * 4;
  const cCal = actualCarbs * 4;
  const fCal = actualFat * 9;
  const totalMacroCal = pCal + cCal + fCal || 1;
  const pPct = Math.round((pCal / totalMacroCal) * 100);
  const cPct = Math.round((cCal / totalMacroCal) * 100);
  const fPct = Math.round((fCal / totalMacroCal) * 100);

  // SVG Gauge calculation
  const radius = 42;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (positivityScore / 100) * circumference;

  return (
    <motion.div
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/85 backdrop-blur-md p-0 sm:p-4 overflow-y-auto"
      onClick={onClose}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.22, ease: 'easeOut' }}
    >
      <motion.div
        className="w-full max-w-lg bg-slate-900 border border-slate-800 rounded-t-3xl sm:rounded-3xl p-5 sm:p-6 shadow-2xl relative my-auto max-h-[95vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
        initial={{ opacity: 0, y: 45, scale: 0.96 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: 35, scale: 0.96 }}
        transition={{
          type: 'spring',
          damping: 26,
          stiffness: 320,
          mass: 0.85,
        }}
      >
        {/* Modal Header */}
        <div className="flex items-start justify-between pb-3 border-b border-slate-800/80">
          <div className="flex items-center gap-3">
            <span className="text-3xl p-2 rounded-2xl bg-slate-800/70 border border-slate-700/50 shadow-sm">
              {mealConfig.icon}
            </span>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-black uppercase tracking-wider text-orange-400 bg-orange-500/10 px-2 py-0.5 rounded-full border border-orange-500/20">
                  {mealConfig.label} ({mealConfig.percentText} del día)
                </span>
                <span className="text-xs text-slate-400 font-mono">{meal.time}</span>
              </div>
              <h3 className="text-lg font-black text-white mt-1 leading-tight">{meal.name}</h3>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-full bg-slate-800/70 text-slate-400 hover:text-white hover:bg-slate-700 transition-colors"
            title="Cerrar vista"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Optional Photo Header if meal has photo */}
        {meal.photoUrl && (
          <motion.div
            initial={{ opacity: 0, scale: 0.98 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.3, delay: 0.1 }}
            className="relative rounded-2xl overflow-hidden mt-3 h-40 border border-slate-800 shadow-lg group"
          >
            <img
              src={meal.photoUrl}
              alt={meal.name}
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-transparent to-black/30 pointer-events-none" />
            <div className="absolute bottom-2.5 left-3 flex items-center gap-2">
              <span className="px-2.5 py-1 rounded-xl bg-black/75 backdrop-blur-md text-xs font-bold text-white border border-white/10 flex items-center gap-1.5 font-mono">
                <Flame className="w-3.5 h-3.5 text-orange-400 fill-orange-400" />
                {meal.calories} kcal registradas
              </span>
            </div>
          </motion.div>
        )}

        {/* POSITIVITY SCORE HERO (Circular Chart & Verdict) */}
        <motion.div
          initial={{ opacity: 0, y: 18 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.35, delay: 0.12 }}
          className="mt-4 p-4 rounded-2xl bg-gradient-to-br from-slate-950 via-slate-900 to-[#121a2c] border border-slate-800/90 shadow-xl"
        >
          <div className="flex items-center justify-between mb-3">
            <div>
              <span className="text-[10px] font-extrabold uppercase tracking-widest text-slate-400 flex items-center gap-1">
                <Sparkles className="w-3 h-3 text-orange-400" />
                Impacto en tu Objetivo
              </span>
              <h4 className="text-sm font-black text-white mt-0.5">
                Evaluación individual de {mealConfig.label}
              </h4>
            </div>

            <div className="text-right">
              <span className="text-[10px] text-slate-400">Meta asignada</span>
              <span className="text-xs font-mono font-bold text-slate-300 block">
                {targetCalories} kcal
              </span>
            </div>
          </div>

          <div className="flex items-center gap-5">
            {/* SVG Circular Positivity Gauge */}
            <div className="relative w-24 h-24 shrink-0 flex items-center justify-center">
              <svg className="w-full h-full -rotate-90" viewBox="0 0 100 100">
                {/* Background Track */}
                <circle
                  cx="50"
                  cy="50"
                  r={radius}
                  fill="transparent"
                  stroke="#1e293b"
                  strokeWidth="9"
                />
                {/* Positivity Progress Arc Animated */}
                <motion.circle
                  cx="50"
                  cy="50"
                  r={radius}
                  fill="transparent"
                  stroke={
                    positivityScore >= 80
                      ? '#10b981'
                      : positivityScore >= 60
                      ? '#06b6d4'
                      : '#f97316'
                  }
                  strokeWidth="9"
                  strokeDasharray={circumference}
                  initial={{ strokeDashoffset: circumference }}
                  animate={{ strokeDashoffset }}
                  transition={{ duration: 0.85, delay: 0.2, ease: 'easeOut' }}
                  strokeLinecap="round"
                />
              </svg>
              {/* Centered Score */}
              <motion.div
                initial={{ opacity: 0, scale: 0.7 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.4, delay: 0.3 }}
                className="absolute inset-0 flex flex-col items-center justify-center"
              >
                <span className="text-2xl font-black text-white font-mono leading-none">
                  {positivityScore}%
                </span>
                <span className="text-[9px] font-bold text-slate-400 uppercase tracking-tighter mt-0.5">
                  Positiva
                </span>
              </motion.div>
            </div>

            {/* Verdict Card */}
            <motion.div
              initial={{ opacity: 0, x: 15 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.35, delay: 0.2 }}
              className={`flex-1 p-3 rounded-xl border ${verdictBg}`}
            >
              <div className="flex items-center gap-1.5 mb-1">
                {React.createElement(verdictIcon, {
                  className: `w-4 h-4 ${verdictColor}`,
                })}
                <span className={`text-xs font-black uppercase tracking-wider ${verdictColor}`}>
                  {verdictTitle}
                </span>
              </div>
              <p className="text-xs text-slate-300 leading-relaxed font-medium">
                {verdictSummary}
              </p>
            </motion.div>
          </div>
        </motion.div>

        {/* NUTRIENTS BREAKDOWN CHART (PROTEIN / CARBS / FAT) */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.22 }}
          className="mt-4"
        >
          <div className="flex items-center justify-between mb-2 px-1">
            <h4 className="text-xs font-black uppercase tracking-wider text-slate-300 flex items-center gap-1.5">
              <Dumbbell className="w-3.5 h-3.5 text-orange-400" />
              Nutrientes vs Meta de {mealConfig.label}
            </h4>
            <span className="text-[10px] text-slate-400">Registrado / Objetivo</span>
          </div>

          <div className="space-y-2.5">
            {/* PROTEIN BAR */}
            <motion.div
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.35, delay: 0.26 }}
              className="p-3 rounded-2xl bg-slate-950/70 border border-slate-800/80"
            >
              <div className="flex items-center justify-between mb-1">
                <div className="flex items-center gap-1.5">
                  <div className="w-2.5 h-2.5 rounded-full bg-orange-500 shadow-sm shadow-orange-500/50" />
                  <span className="text-xs font-extrabold text-white">Proteína</span>
                  <span className="text-[10px] text-orange-400 font-bold bg-orange-500/10 px-1.5 py-0.2 rounded">
                    Síntesis Muscular
                  </span>
                </div>
                <div className="text-right font-mono text-xs">
                  <span className="font-black text-white">{actualProtein}g</span>
                  <span className="text-slate-400 text-[11px]"> / {targetProtein}g</span>
                  <span className="text-orange-400 font-bold ml-1.5 text-[11px]">
                    ({Math.round(pScore * 100)}%)
                  </span>
                </div>
              </div>
              {/* Progress Bar */}
              <div className="w-full h-2.5 bg-slate-800 rounded-full overflow-hidden mt-1.5">
                <motion.div
                  className="h-full bg-gradient-to-r from-orange-600 via-orange-500 to-amber-400 rounded-full"
                  initial={{ width: 0 }}
                  animate={{ width: `${Math.min(100, Math.round(pScore * 100))}%` }}
                  transition={{ duration: 0.7, delay: 0.32, ease: 'easeOut' }}
                />
              </div>
              <div className="mt-1 flex items-center justify-between text-[10px] text-slate-400">
                <span>
                  {actualProtein >= targetProtein
                    ? '✓ Cumple la dosis óptima de aminoácidos para este plato'
                    : `Faltan ${targetProtein - actualProtein}g para la meta ideal de ${mealConfig.label.toLowerCase()}`}
                </span>
                <span className="text-slate-500">{pCal} kcal ({pPct}%)</span>
              </div>
            </motion.div>

            {/* CARBS BAR */}
            <motion.div
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.35, delay: 0.32 }}
              className="p-3 rounded-2xl bg-slate-950/70 border border-slate-800/80"
            >
              <div className="flex items-center justify-between mb-1">
                <div className="flex items-center gap-1.5">
                  <div className="w-2.5 h-2.5 rounded-full bg-cyan-400 shadow-sm shadow-cyan-400/50" />
                  <span className="text-xs font-extrabold text-white">Carbohidratos</span>
                  <span className="text-[10px] text-cyan-400 font-bold bg-cyan-500/10 px-1.5 py-0.2 rounded">
                    Energía y Glucógeno
                  </span>
                </div>
                <div className="text-right font-mono text-xs">
                  <span className="font-black text-white">{actualCarbs}g</span>
                  <span className="text-slate-400 text-[11px]"> / {targetCarbs}g</span>
                  <span className="text-cyan-400 font-bold ml-1.5 text-[11px]">
                    ({Math.round(cScore * 100)}%)
                  </span>
                </div>
              </div>
              {/* Progress Bar */}
              <div className="w-full h-2.5 bg-slate-800 rounded-full overflow-hidden mt-1.5">
                <motion.div
                  className="h-full bg-gradient-to-r from-cyan-600 via-cyan-500 to-teal-400 rounded-full"
                  initial={{ width: 0 }}
                  animate={{ width: `${Math.min(100, Math.round(cScore * 100))}%` }}
                  transition={{ duration: 0.7, delay: 0.38, ease: 'easeOut' }}
                />
              </div>
              <div className="mt-1 flex items-center justify-between text-[10px] text-slate-400">
                <span>
                  {actualCarbs > targetCarbs * 1.2
                    ? 'Aporte energético alto; excelente para antes o después de entrenar'
                    : 'Aporte de carbohidratos controlado y dentro del margen'}
                </span>
                <span className="text-slate-500">{cCal} kcal ({cPct}%)</span>
              </div>
            </motion.div>

            {/* FAT BAR */}
            <motion.div
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.35, delay: 0.38 }}
              className="p-3 rounded-2xl bg-slate-950/70 border border-slate-800/80"
            >
              <div className="flex items-center justify-between mb-1">
                <div className="flex items-center gap-1.5">
                  <div className="w-2.5 h-2.5 rounded-full bg-amber-400 shadow-sm shadow-amber-400/50" />
                  <span className="text-xs font-extrabold text-white">Grasas</span>
                  <span className="text-[10px] text-amber-400 font-bold bg-amber-500/10 px-1.5 py-0.2 rounded">
                    Hormonas y Saciedad
                  </span>
                </div>
                <div className="text-right font-mono text-xs">
                  <span className="font-black text-white">{actualFat}g</span>
                  <span className="text-slate-400 text-[11px]"> / {targetFat}g</span>
                  <span className="text-amber-400 font-bold ml-1.5 text-[11px]">
                    ({Math.round(fScore * 100)}%)
                  </span>
                </div>
              </div>
              {/* Progress Bar */}
              <div className="w-full h-2.5 bg-slate-800 rounded-full overflow-hidden mt-1.5">
                <motion.div
                  className="h-full bg-gradient-to-r from-amber-600 via-amber-500 to-yellow-400 rounded-full"
                  initial={{ width: 0 }}
                  animate={{ width: `${Math.min(100, Math.round(fScore * 100))}%` }}
                  transition={{ duration: 0.7, delay: 0.44, ease: 'easeOut' }}
                />
              </div>
              <div className="mt-1 flex items-center justify-between text-[10px] text-slate-400">
                <span>
                  {actualFat <= targetFat
                    ? 'Nivel de grasa saludable óptimo sin saturar el gasto calórico'
                    : 'Grasas presentes; favorecen la asimilación de vitaminas'}
                </span>
                <span className="text-slate-500">{fCal} kcal ({fPct}%)</span>
              </div>
            </motion.div>
          </div>
        </motion.div>

        {/* MACRO DISTRIBUTION STRIP */}
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.35, delay: 0.44 }}
          className="mt-4 p-3.5 rounded-2xl bg-slate-950 border border-slate-800/80"
        >
          <div className="flex items-center justify-between text-[11px] font-bold text-slate-300 mb-2">
            <span>Distribución Calórica de este Plato</span>
            <span className="text-slate-400 font-mono">{actualCalories} kcal totales</span>
          </div>

          {/* Multi-segment stacked bar */}
          <div className="w-full h-3 rounded-full overflow-hidden flex bg-slate-800">
            <motion.div
              className="h-full bg-orange-500"
              initial={{ width: 0 }}
              animate={{ width: `${pPct}%` }}
              transition={{ duration: 0.6, delay: 0.5, ease: 'easeOut' }}
              title={`Proteína: ${pPct}%`}
            />
            <motion.div
              className="h-full bg-cyan-500"
              initial={{ width: 0 }}
              animate={{ width: `${cPct}%` }}
              transition={{ duration: 0.6, delay: 0.53, ease: 'easeOut' }}
              title={`Carbohidratos: ${cPct}%`}
            />
            <motion.div
              className="h-full bg-amber-500"
              initial={{ width: 0 }}
              animate={{ width: `${fPct}%` }}
              transition={{ duration: 0.6, delay: 0.56, ease: 'easeOut' }}
              title={`Grasas: ${fPct}%`}
            />
          </div>

          {/* Legend */}
          <div className="flex items-center justify-around mt-2 text-[10px] font-semibold text-slate-300">
            <span className="flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-orange-500" />
              Proteína {pPct}%
            </span>
            <span className="flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-cyan-500" />
              Carbos {cPct}%
            </span>
            <span className="flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-amber-500" />
              Grasas {fPct}%
            </span>
          </div>
        </motion.div>

        {/* BOTTOM ACTION BUTTON */}
        <div className="mt-5 flex gap-3">
          {onDelete && (
            <button
              onClick={() => {
                onDelete(meal.id);
                onClose();
              }}
              className="py-3 px-4 rounded-xl bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/20 text-xs font-bold transition-colors"
            >
              Eliminar
            </button>
          )}
          <button
            onClick={onClose}
            className="flex-1 py-3 px-4 rounded-xl bg-gradient-to-r from-orange-500 to-amber-500 hover:brightness-110 text-white text-xs font-extrabold transition-all shadow-lg shadow-orange-500/25 text-center flex items-center justify-center gap-1.5"
          >
            <span>Volver a Nutrición</span>
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
};
