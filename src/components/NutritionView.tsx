import React, { useState, useRef } from 'react';
import { AnimatePresence } from 'framer-motion';
import {
  Utensils,
  Plus,
  Camera,
  Image as ImageIcon,
  Flame,
  PieChart,
  BarChart2,
  Trash2,
  X,
  Target,
  Sparkles,
  ChevronDown,
  Loader2,
  CheckCircle2,
  Zap,
} from 'lucide-react';
import { Meal, NutritionGoal } from '../types';
import { formatDateKey } from '../utils/storage';
import { useAuth } from '../context/AuthContext';
import { compressFoodImage } from '../utils/imageCompressor';
import { uploadFoodPhoto } from '../services/foodPhotoService';
import { MealNutritionModal } from './MealNutritionModal';

interface NutritionViewProps {
  meals: Meal[];
  goal: NutritionGoal;
  onAddMeal: (meal: Meal) => void;
  onDeleteMeal: (mealId: string) => void;
  onUpdateGoal: (goal: NutritionGoal) => void;
}

export const NutritionView: React.FC<NutritionViewProps> = ({
  meals,
  goal,
  onAddMeal,
  onDeleteMeal,
  onUpdateGoal,
}) => {
  const { user } = useAuth();
  const todayKey = formatDateKey();
  const todayMeals = meals.filter((m) => m.date === todayKey);

  // Modals state
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isGoalModalOpen, setIsGoalModalOpen] = useState(false);
  const [expandedPhoto, setExpandedPhoto] = useState<string | null>(null);
  const [selectedMealForAnalysis, setSelectedMealForAnalysis] = useState<Meal | null>(null);

  // Add meal form fields
  const [mealType, setMealType] = useState<Meal['type']>('almuerzo');
  const [mealName, setMealName] = useState('');
  const [calories, setCalories] = useState<number | ''>('');
  const [protein, setProtein] = useState<number | ''>('');
  const [carbs, setCarbs] = useState<number | ''>('');
  const [fat, setFat] = useState<number | ''>('');
  const [photoPreview, setPhotoPreview] = useState<string>('');

  // Client-side photo compression & upload states
  const [compressedBlob, setCompressedBlob] = useState<Blob | null>(null);
  const [compressionStats, setCompressionStats] = useState<{
    sizeKb: number;
    width: number;
    height: number;
  } | null>(null);
  const [isCompressing, setIsCompressing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [statusNotice, setStatusNotice] = useState<string | null>(null);

  // Goal form fields
  const [tempGoalCal, setTempGoalCal] = useState(goal.calories);
  const [tempGoalP, setTempGoalP] = useState(goal.protein);
  const [tempGoalC, setTempGoalC] = useState(goal.carbs);
  const [tempGoalF, setTempGoalF] = useState(goal.fat);

  const fileInputRef = useRef<HTMLInputElement>(null);

  // Totals calculations
  const totalCalories = todayMeals.reduce((acc, m) => acc + (m.calories || 0), 0);
  const totalProtein = todayMeals.reduce((acc, m) => acc + (m.protein || 0), 0);
  const totalCarbs = todayMeals.reduce((acc, m) => acc + (m.carbs || 0), 0);
  const totalFat = todayMeals.reduce((acc, m) => acc + (m.fat || 0), 0);

  const remainingCalories = Math.max(0, goal.calories - totalCalories);
  const caloriePercent = Math.min(100, Math.round((totalCalories / goal.calories) * 100));

  // Handle Photo selection from camera or gallery with HTML5 Canvas compression
  const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      setIsCompressing(true);
      setStatusNotice(null);

      // Client-side compression to max 800px and strictly < 150 KB
      const result = await compressFoodImage(file, 'image/jpeg');

      setCompressedBlob(result.blob);
      setCompressionStats({
        sizeKb: result.sizeKb,
        width: result.width,
        height: result.height,
      });
      // Instant preview from compressed blob
      setPhotoPreview(result.dataUrl);
    } catch (err) {
      console.warn('Fallo en compresión de imagen, usando lectura estándar:', err);
      const reader = new FileReader();
      reader.onloadend = () => {
        setPhotoPreview(reader.result as string);
        setCompressedBlob(file);
        setCompressionStats(null);
      };
      reader.readAsDataURL(file);
    } finally {
      setIsCompressing(false);
    }
  };

  const handleClearPhoto = () => {
    setPhotoPreview('');
    setCompressedBlob(null);
    setCompressionStats(null);
    setStatusNotice(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleOpenAddModal = (defaultType: Meal['type'] = 'almuerzo') => {
    setMealType(defaultType);
    setMealName('');
    setCalories('');
    setProtein('');
    setCarbs('');
    setFat('');
    setPhotoPreview('');
    setCompressedBlob(null);
    setCompressionStats(null);
    setStatusNotice(null);
    setIsSaving(false);
    setIsCompressing(false);
    setIsAddModalOpen(true);
  };

  const handleSaveMeal = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!mealName.trim() || isSaving) return;

    setIsSaving(true);
    const mealId = `meal-${Date.now()}`;
    let finalPhotoUrl = photoPreview || undefined;

    try {
      // If user is authenticated and has selected a compressed image, upload to Storage
      if (user && compressedBlob) {
        setStatusNotice('Subiendo foto a Firebase Storage...');
        const storageUrl = await uploadFoodPhoto(user.uid, mealId, compressedBlob);
        if (storageUrl) {
          finalPhotoUrl = storageUrl;
        } else {
          // Offline / network failure: gracefully keep local compressed base64 preview
          console.info('No se pudo subir a la nube (offline o error de red). Guardando copia local de la foto.');
        }
      }

      const newMeal: Meal = {
        id: mealId,
        date: todayKey,
        type: mealType,
        name: mealName.trim(),
        calories: Number(calories) || 0,
        protein: Number(protein) || 0,
        carbs: Number(carbs) || 0,
        fat: Number(fat) || 0,
        photoUrl: finalPhotoUrl,
        time: new Date().toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' }),
      };

      onAddMeal(newMeal);
      setIsAddModalOpen(false);
    } catch (err) {
      console.error('Error al guardar comida con foto:', err);
      // Fallback: save meal record even if photo processing had an unexpected glitch
      const fallbackMeal: Meal = {
        id: mealId,
        date: todayKey,
        type: mealType,
        name: mealName.trim(),
        calories: Number(calories) || 0,
        protein: Number(protein) || 0,
        carbs: Number(carbs) || 0,
        fat: Number(fat) || 0,
        photoUrl: photoPreview || undefined,
        time: new Date().toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' }),
      };
      onAddMeal(fallbackMeal);
      setIsAddModalOpen(false);
    } finally {
      setIsSaving(false);
    }
  };

  const handleSaveGoal = (e: React.FormEvent) => {
    e.preventDefault();
    onUpdateGoal({
      calories: Math.max(500, Number(tempGoalCal) || 2000),
      protein: Math.max(10, Number(tempGoalP) || 120),
      carbs: Math.max(10, Number(tempGoalC) || 200),
      fat: Math.max(5, Number(tempGoalF) || 60),
    });
    setIsGoalModalOpen(false);
  };

  const mealCategories: { type: Meal['type']; label: string; icon: string }[] = [
    { type: 'desayuno', label: 'Desayuno', icon: '🌅' },
    { type: 'almuerzo', label: 'Almuerzo', icon: '☀️' },
    { type: 'cena', label: 'Cena', icon: '🌙' },
    { type: 'snack', label: 'Snacks & Merienda', icon: '🍎' },
  ];

  return (
    <div className="space-y-4 pb-24 max-w-md mx-auto px-4 pt-3">
      {/* NUTRITION HERO PROGRESS CARD */}
      <div className="bg-gradient-to-br from-slate-900 via-slate-900 to-[#171f30] border border-slate-800 rounded-3xl p-5 shadow-2xl relative overflow-hidden">
        {/* Ambient glow */}
        <div className="absolute top-0 right-0 w-36 h-36 bg-orange-500/10 rounded-full blur-2xl pointer-events-none" />

        <div className="flex items-center justify-between mb-4">
          <div>
            <div className="flex items-center gap-1.5">
              <span className="text-[10px] font-black uppercase tracking-wider text-orange-400 bg-orange-500/10 px-2 py-0.5 rounded-full border border-orange-500/20">
                Nutrición Diaria
              </span>
              <span className="text-xs text-slate-400">Hoy</span>
            </div>
            <h2 className="text-xl font-black text-white mt-1">Control de Calorías</h2>
          </div>

          <button
            onClick={() => {
              setTempGoalCal(goal.calories);
              setTempGoalP(goal.protein);
              setTempGoalC(goal.carbs);
              setTempGoalF(goal.fat);
              setIsGoalModalOpen(true);
            }}
            className="flex items-center gap-1 px-2.5 py-1.5 rounded-xl bg-slate-800/80 hover:bg-slate-700 text-xs font-bold text-slate-300 transition-colors border border-slate-700/60"
            title="Ajustar metas diarias"
          >
            <Target className="w-3.5 h-3.5 text-orange-400" />
            <span>Objetivo</span>
          </button>
        </div>

        {/* Calories Ring / Big Readout */}
        <div className="grid grid-cols-2 gap-4 items-center bg-slate-950/60 rounded-2xl p-4 border border-slate-800/80">
          <div>
            <span className="text-xs text-slate-400 font-medium block">Consumidas</span>
            <div className="flex items-baseline gap-1 mt-0.5">
              <span className="text-3xl font-black text-white font-mono">{totalCalories}</span>
              <span className="text-xs text-slate-400 font-medium">kcal</span>
            </div>
            <span className="text-[11px] text-slate-400 block mt-1">
              de <span className="font-bold text-slate-300 font-mono">{goal.calories} kcal</span>
            </span>
          </div>

          <div className="text-right border-l border-slate-800 pl-4">
            <span className="text-xs text-slate-400 font-medium block">Restantes</span>
            <div className="flex items-baseline justify-end gap-1 mt-0.5">
              <span
                className={`text-2xl font-black font-mono ${
                  totalCalories > goal.calories ? 'text-red-400' : 'text-emerald-400'
                }`}
              >
                {remainingCalories}
              </span>
              <span className="text-xs text-slate-400 font-medium">kcal</span>
            </div>
            <span className="text-[11px] text-slate-400 block mt-1">
              {caloriePercent}% completado
            </span>
          </div>
        </div>

        {/* Calorie Bar */}
        <div className="w-full h-2.5 bg-slate-800 rounded-full overflow-hidden mt-3">
          <div
            className={`h-full rounded-full transition-all duration-300 ${
              caloriePercent > 100
                ? 'bg-red-500'
                : 'bg-gradient-to-r from-orange-500 via-amber-400 to-yellow-400'
            }`}
            style={{ width: `${Math.min(100, caloriePercent)}%` }}
          />
        </div>

        {/* Macronutrients Grid */}
        <div className="grid grid-cols-3 gap-2 mt-4 pt-4 border-t border-slate-800/80">
          {/* Protein */}
          <div className="bg-slate-900/90 rounded-xl p-2.5 border border-slate-800 text-center">
            <span className="text-[10px] font-bold text-orange-400 uppercase tracking-wider block">
              Proteína
            </span>
            <span className="text-sm font-black text-white font-mono mt-0.5 block">
              {totalProtein}g{' '}
              <span className="text-[10px] text-slate-400 font-normal">/ {goal.protein}g</span>
            </span>
            <div className="w-full h-1 bg-slate-800 rounded-full mt-1.5 overflow-hidden">
              <div
                className="h-full bg-orange-500 rounded-full"
                style={{ width: `${Math.min(100, (totalProtein / goal.protein) * 100)}%` }}
              />
            </div>
          </div>

          {/* Carbs */}
          <div className="bg-slate-900/90 rounded-xl p-2.5 border border-slate-800 text-center">
            <span className="text-[10px] font-bold text-cyan-400 uppercase tracking-wider block">
              Carbos
            </span>
            <span className="text-sm font-black text-white font-mono mt-0.5 block">
              {totalCarbs}g{' '}
              <span className="text-[10px] text-slate-400 font-normal">/ {goal.carbs}g</span>
            </span>
            <div className="w-full h-1 bg-slate-800 rounded-full mt-1.5 overflow-hidden">
              <div
                className="h-full bg-cyan-500 rounded-full"
                style={{ width: `${Math.min(100, (totalCarbs / goal.carbs) * 100)}%` }}
              />
            </div>
          </div>

          {/* Fat */}
          <div className="bg-slate-900/90 rounded-xl p-2.5 border border-slate-800 text-center">
            <span className="text-[10px] font-bold text-amber-400 uppercase tracking-wider block">
              Grasas
            </span>
            <span className="text-sm font-black text-white font-mono mt-0.5 block">
              {totalFat}g{' '}
              <span className="text-[10px] text-slate-400 font-normal">/ {goal.fat}g</span>
            </span>
            <div className="w-full h-1 bg-slate-800 rounded-full mt-1.5 overflow-hidden">
              <div
                className="h-full bg-amber-500 rounded-full"
                style={{ width: `${Math.min(100, (totalFat / goal.fat) * 100)}%` }}
              />
            </div>
          </div>
        </div>

        {/* Quick add meal trigger */}
        <button
          onClick={() => handleOpenAddModal('almuerzo')}
          className="mt-4 w-full py-3 px-4 rounded-2xl bg-gradient-to-r from-orange-500 to-amber-500 hover:brightness-110 active:scale-95 text-white font-bold text-sm flex items-center justify-center gap-2 shadow-lg shadow-orange-500/25 transition-all"
        >
          <Camera className="w-4 h-4" />
          <span>Añadir Comida con Foto y Calorías</span>
        </button>
      </div>

      {/* MEALS BY CATEGORY */}
      <div className="space-y-4">
        {mealCategories.map((cat) => {
          const categoryMeals = todayMeals.filter((m) => m.type === cat.type);
          const catCalories = categoryMeals.reduce((acc, m) => acc + m.calories, 0);

          return (
            <div key={cat.type} className="bg-slate-900/80 border border-slate-800 rounded-3xl p-4 shadow-xl">
              {/* Category Header */}
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <span className="text-lg">{cat.icon}</span>
                  <h3 className="font-extrabold text-sm text-white">{cat.label}</h3>
                  <span className="text-xs text-orange-400 font-mono font-bold">
                    {catCalories > 0 ? `${catCalories} kcal` : ''}
                  </span>
                </div>

                <button
                  onClick={() => handleOpenAddModal(cat.type)}
                  className="p-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition-colors flex items-center gap-1 text-xs font-semibold"
                >
                  <Plus className="w-3.5 h-3.5 text-orange-400" />
                  <span>Añadir</span>
                </button>
              </div>

              {/* Meals in this category */}
              {categoryMeals.length === 0 ? (
                <div className="bg-slate-950/40 rounded-2xl p-3 text-center border border-slate-800/50">
                  <span className="text-xs text-slate-500">No hay platos registrados en esta comida</span>
                </div>
              ) : (
                <div className="space-y-2.5">
                  {categoryMeals.map((meal) => (
                    <div
                      key={meal.id}
                      onClick={() => setSelectedMealForAnalysis(meal)}
                      className="bg-slate-950/70 hover:bg-slate-950/95 border border-slate-800/80 hover:border-orange-500/50 rounded-2xl p-3 flex items-center gap-3 group cursor-pointer transition-all shadow-sm hover:shadow-lg hover:shadow-orange-500/5"
                    >
                      {/* Photo Thumbnail or Placeholder */}
                      {meal.photoUrl ? (
                        <div
                          onClick={(e) => {
                            e.stopPropagation();
                            setSelectedMealForAnalysis(meal);
                          }}
                          className="w-16 h-16 rounded-xl overflow-hidden shrink-0 cursor-pointer relative group/img border border-slate-700/60 shadow-md"
                        >
                          <img
                            src={meal.photoUrl}
                            alt={meal.name}
                            className="w-full h-full object-cover group-hover/img:scale-110 transition-transform duration-200"
                          />
                          <div className="absolute inset-0 bg-black/20 group-hover/img:bg-black/0 transition-colors" />
                        </div>
                      ) : (
                        <div className="w-16 h-16 rounded-xl bg-slate-800/60 border border-slate-800 flex items-center justify-center shrink-0 text-slate-500 group-hover:text-orange-400 group-hover:border-orange-500/30 transition-colors">
                          <ImageIcon className="w-6 h-6 stroke-[1.5]" />
                        </div>
                      )}

                      {/* Meal info */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between">
                          <h4 className="font-bold text-white text-sm truncate group-hover:text-orange-300 transition-colors">
                            {meal.name}
                          </h4>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              onDeleteMeal(meal.id);
                            }}
                            className="p-1 rounded-lg text-slate-500 hover:text-red-400 hover:bg-red-500/10 transition-colors opacity-70 group-hover:opacity-100"
                            title="Eliminar plato"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>

                        <div className="flex items-center gap-2 mt-1">
                          <span className="text-xs font-mono font-bold text-orange-400">
                            {meal.calories} kcal
                          </span>
                          <span className="text-[11px] text-slate-400">• {meal.time}</span>
                          <span className="text-[10px] font-bold text-slate-400 bg-slate-850 px-1.5 py-0.5 rounded-md group-hover:text-orange-400 group-hover:bg-orange-500/10 transition-colors flex items-center gap-1 ml-auto border border-slate-800 group-hover:border-orange-500/20">
                            <BarChart2 className="w-2.5 h-2.5 text-orange-400" />
                            <span>Ver impacto</span>
                          </span>
                        </div>

                        {/* Macros small tags */}
                        <div className="flex items-center gap-1.5 mt-1 text-[10px] text-slate-400">
                          <span className="bg-orange-500/10 text-orange-300 px-1.5 py-0.2 rounded font-mono">
                            P: {meal.protein}g
                          </span>
                          <span className="bg-cyan-500/10 text-cyan-300 px-1.5 py-0.2 rounded font-mono">
                            C: {meal.carbs}g
                          </span>
                          <span className="bg-amber-500/10 text-amber-300 px-1.5 py-0.2 rounded font-mono">
                            G: {meal.fat}g
                          </span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* PHOTO PREVIEW MODAL */}
      {expandedPhoto && (
        <div
          onClick={() => setExpandedPhoto(null)}
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/90 backdrop-blur-md"
        >
          <div className="relative max-w-sm w-full">
            <button
              onClick={() => setExpandedPhoto(null)}
              className="absolute -top-10 right-0 p-2 text-white bg-slate-800/80 rounded-full hover:bg-slate-700"
            >
              <X className="w-5 h-5" />
            </button>
            <img
              src={expandedPhoto}
              alt="Comida"
              className="w-full max-h-[80vh] object-contain rounded-3xl border border-slate-700 shadow-2xl"
            />
          </div>
        </div>
      )}

      {/* ADD MEAL MODAL */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/80 backdrop-blur-sm p-0 sm:p-4">
          <div className="w-full max-w-md bg-slate-900 border border-slate-800 rounded-t-3xl sm:rounded-3xl p-6 shadow-2xl max-h-[92vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-4 border-b border-slate-800 mb-4">
              <h3 className="text-lg font-black text-white flex items-center gap-2">
                <Camera className="w-5 h-5 text-orange-500" />
                Registrar Comida
              </h3>
              <button
                onClick={() => setIsAddModalOpen(false)}
                className="p-1.5 rounded-full hover:bg-slate-800 text-slate-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveMeal} className="space-y-4">
              {/* Meal Category Selector */}
              <div>
                <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-1.5">
                  Tipo de Comida
                </label>
                <div className="grid grid-cols-4 gap-1.5">
                  {mealCategories.map((cat) => (
                    <button
                      type="button"
                      key={cat.type}
                      onClick={() => setMealType(cat.type)}
                      className={`py-2 px-1 text-center rounded-xl text-xs font-bold border transition-colors ${
                        mealType === cat.type
                          ? 'bg-orange-500 text-white border-orange-500 shadow-md'
                          : 'bg-slate-950 text-slate-400 border-slate-800 hover:text-white'
                      }`}
                    >
                      <div className="text-base">{cat.icon}</div>
                      <span className="text-[10px] truncate block">{cat.label.split(' ')[0]}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Food Name */}
              <div>
                <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-1.5">
                  Nombre del Plato / Alimento *
                </label>
                <input
                  type="text"
                  required
                  placeholder="Ej: Pechuga con arroz, Ensalada de atún..."
                  value={mealName}
                  onChange={(e) => setMealName(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white placeholder-slate-500 focus:outline-none focus:border-orange-500 text-sm"
                />
              </div>

              {/* Photo Input & Preview */}
              <div>
                <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-1.5">
                  Foto de la Comida
                </label>
                
                {/* File picker */}
                <input
                  type="file"
                  ref={fileInputRef}
                  accept="image/*"
                  capture="environment"
                  onChange={handlePhotoUpload}
                  className="hidden"
                />

                {isCompressing ? (
                  <div className="w-full py-8 px-4 rounded-2xl bg-slate-950/70 border border-orange-500/40 flex flex-col items-center justify-center gap-2.5 text-center">
                    <Loader2 className="w-7 h-7 text-orange-400 animate-spin" />
                    <div>
                      <p className="text-xs font-bold text-white">Comprimiendo foto en Canvas...</p>
                      <p className="text-[11px] text-slate-400 mt-0.5">
                        Redimensionando a máx 800px y garantizando menos de 150 KB
                      </p>
                    </div>
                  </div>
                ) : photoPreview ? (
                  <div className="relative rounded-2xl overflow-hidden border border-slate-700 h-48 group bg-slate-950">
                    <img
                      src={photoPreview}
                      alt="Vista previa de comida"
                      className="w-full h-full object-cover"
                    />

                    {/* Gradient overlay for readability */}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-black/60 pointer-events-none" />

                    {/* Top Stats Tag */}
                    <div className="absolute top-2.5 left-2.5 flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-black/75 backdrop-blur-md border border-white/10 text-[10px] font-bold text-white">
                      <Zap className="w-3 h-3 text-amber-400 fill-amber-400" />
                      <span>
                        {compressionStats
                          ? `${compressionStats.sizeKb} KB • ${compressionStats.width}×${compressionStats.height}px`
                          : '< 150 KB (Comprimida)'}
                      </span>
                      <span className="text-emerald-400 font-extrabold">• Capa Gratis</span>
                    </div>

                    {/* Remove photo button */}
                    <button
                      type="button"
                      onClick={handleClearPhoto}
                      disabled={isSaving}
                      className="absolute top-2.5 right-2.5 p-1.5 bg-black/75 hover:bg-red-500/80 text-white rounded-full transition-colors backdrop-blur-md"
                      title="Quitar foto"
                    >
                      <X className="w-4 h-4" />
                    </button>

                    {/* Bottom action controls */}
                    <div className="absolute bottom-2.5 left-2.5 right-2.5 flex items-center justify-between">
                      <span className="text-[10px] text-slate-300 font-medium bg-black/60 px-2 py-0.5 rounded-lg backdrop-blur-sm">
                        ✓ Vista previa lista
                      </span>
                      <button
                        type="button"
                        onClick={() => fileInputRef.current?.click()}
                        disabled={isSaving}
                        className="px-3 py-1.5 bg-slate-900/90 hover:bg-slate-800 text-white text-xs font-bold rounded-xl transition-colors flex items-center gap-1.5 border border-slate-700/80 shadow-md backdrop-blur-sm"
                      >
                        <Camera className="w-3.5 h-3.5 text-orange-400" />
                        <span>Cambiar</span>
                      </button>
                    </div>
                  </div>
                ) : (
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    disabled={isSaving}
                    className="w-full py-5 border-2 border-dashed border-slate-800 hover:border-orange-500/60 rounded-2xl flex flex-col items-center justify-center gap-2 text-slate-400 hover:text-orange-400 transition-colors bg-slate-950/40 group cursor-pointer"
                  >
                    <div className="w-11 h-11 rounded-full bg-slate-900 flex items-center justify-center group-hover:scale-110 transition-transform border border-slate-800 shadow-inner">
                      <Camera className="w-5 h-5 text-orange-400 stroke-[2]" />
                    </div>
                    <div className="text-center">
                      <span className="text-xs font-bold text-slate-300 block">
                        Tomar foto o subir de tu galería
                      </span>
                      <span className="text-[10px] text-slate-500 block mt-0.5">
                        Compresión automática a máx 800px y menos de 150 KB (Capa Gratis)
                      </span>
                    </div>
                  </button>
                )}
              </div>

              {/* Calories and Macros Grid */}
              <div className="grid grid-cols-4 gap-2">
                <div>
                  <label className="block text-[10px] font-bold text-slate-300 uppercase tracking-wider mb-1">
                    Calorías
                  </label>
                  <input
                    type="number"
                    min="0"
                    placeholder="kcal"
                    value={calories}
                    onChange={(e) => setCalories(e.target.value === '' ? '' : Number(e.target.value))}
                    className="w-full px-2.5 py-2 rounded-xl bg-slate-950 border border-slate-800 text-white font-mono font-bold text-xs text-center focus:border-orange-500"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-orange-400 uppercase tracking-wider mb-1">
                    Proteína (g)
                  </label>
                  <input
                    type="number"
                    min="0"
                    placeholder="g"
                    value={protein}
                    onChange={(e) => setProtein(e.target.value === '' ? '' : Number(e.target.value))}
                    className="w-full px-2.5 py-2 rounded-xl bg-slate-950 border border-slate-800 text-white font-mono font-bold text-xs text-center focus:border-orange-500"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-cyan-400 uppercase tracking-wider mb-1">
                    Carbos (g)
                  </label>
                  <input
                    type="number"
                    min="0"
                    placeholder="g"
                    value={carbs}
                    onChange={(e) => setCarbs(e.target.value === '' ? '' : Number(e.target.value))}
                    className="w-full px-2.5 py-2 rounded-xl bg-slate-950 border border-slate-800 text-white font-mono font-bold text-xs text-center focus:border-orange-500"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-amber-400 uppercase tracking-wider mb-1">
                    Grasa (g)
                  </label>
                  <input
                    type="number"
                    min="0"
                    placeholder="g"
                    value={fat}
                    onChange={(e) => setFat(e.target.value === '' ? '' : Number(e.target.value))}
                    className="w-full px-2.5 py-2 rounded-xl bg-slate-950 border border-slate-800 text-white font-mono font-bold text-xs text-center focus:border-orange-500"
                  />
                </div>
              </div>

              {/* Status Notice if saving or uploading */}
              {statusNotice && (
                <div className="flex items-center gap-2 p-2.5 rounded-xl bg-orange-500/10 border border-orange-500/20 text-xs text-orange-300">
                  <Loader2 className="w-3.5 h-3.5 animate-spin shrink-0 text-orange-400" />
                  <span>{statusNotice}</span>
                </div>
              )}

              {/* Submit Buttons */}
              <div className="pt-2 flex items-center gap-3">
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  disabled={isSaving}
                  className="flex-1 py-3 px-4 rounded-xl bg-slate-800 hover:bg-slate-700 disabled:opacity-50 text-slate-300 text-sm font-bold transition-colors"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={isSaving || isCompressing}
                  className="flex-1 py-3 px-4 rounded-xl bg-gradient-to-r from-orange-500 to-amber-500 hover:opacity-95 disabled:opacity-60 text-white text-sm font-bold transition-all shadow-lg shadow-orange-500/25 flex items-center justify-center gap-2"
                >
                  {isSaving ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>Guardando...</span>
                    </>
                  ) : (
                    <>
                      <Plus className="w-4 h-4" />
                      <span>Guardar Comida</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* EDIT GOALS MODAL */}
      {isGoalModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
          <div className="w-full max-w-sm bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-2xl">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800 mb-4">
              <h3 className="text-base font-black text-white flex items-center gap-2">
                <Target className="w-4 h-4 text-orange-400" />
                Objetivos Diarios
              </h3>
              <button
                onClick={() => setIsGoalModalOpen(false)}
                className="p-1 rounded-full text-slate-400 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveGoal} className="space-y-3.5">
              <div>
                <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-1">
                  Meta de Calorías Diarias (kcal)
                </label>
                <input
                  type="number"
                  min="500"
                  step="50"
                  value={tempGoalCal}
                  onChange={(e) => setTempGoalCal(Number(e.target.value))}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white font-mono font-bold text-sm focus:border-orange-500"
                />
              </div>

              <div className="grid grid-cols-3 gap-2">
                <div>
                  <label className="block text-[10px] font-bold text-orange-400 uppercase tracking-wider mb-1">
                    Proteína (g)
                  </label>
                  <input
                    type="number"
                    min="10"
                    value={tempGoalP}
                    onChange={(e) => setTempGoalP(Number(e.target.value))}
                    className="w-full px-2.5 py-2 rounded-xl bg-slate-950 border border-slate-800 text-white font-mono font-bold text-xs text-center focus:border-orange-500"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-cyan-400 uppercase tracking-wider mb-1">
                    Carbos (g)
                  </label>
                  <input
                    type="number"
                    min="10"
                    value={tempGoalC}
                    onChange={(e) => setTempGoalC(Number(e.target.value))}
                    className="w-full px-2.5 py-2 rounded-xl bg-slate-950 border border-slate-800 text-white font-mono font-bold text-xs text-center focus:border-orange-500"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-amber-400 uppercase tracking-wider mb-1">
                    Grasa (g)
                  </label>
                  <input
                    type="number"
                    min="5"
                    value={tempGoalF}
                    onChange={(e) => setTempGoalF(Number(e.target.value))}
                    className="w-full px-2.5 py-2 rounded-xl bg-slate-950 border border-slate-800 text-white font-mono font-bold text-xs text-center focus:border-orange-500"
                  />
                </div>
              </div>

              <div className="pt-3 flex gap-2">
                <button
                  type="button"
                  onClick={() => setIsGoalModalOpen(false)}
                  className="flex-1 py-2.5 rounded-xl bg-slate-800 text-slate-300 text-xs font-bold"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2.5 rounded-xl bg-orange-500 hover:bg-orange-600 text-white text-xs font-bold shadow-md shadow-orange-500/20"
                >
                  Guardar Metas
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* INDIVIDUAL MEAL NUTRITION & IMPACT ANALYSIS MODAL */}
      <AnimatePresence>
        {selectedMealForAnalysis && (
          <MealNutritionModal
            key={selectedMealForAnalysis.id}
            meal={selectedMealForAnalysis}
            dailyGoal={goal}
            onClose={() => setSelectedMealForAnalysis(null)}
            onDelete={onDeleteMeal}
          />
        )}
      </AnimatePresence>
    </div>
  );
};


