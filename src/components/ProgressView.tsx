import React, { useState } from 'react';
import {
  TrendingUp,
  Plus,
  Scale,
  Ruler,
  Calendar,
  Sparkles,
  ArrowDownRight,
  ArrowUpRight,
  Trash2,
  X,
  Activity,
  Layers,
} from 'lucide-react';
import { BodyMeasurement } from '../types';
import { formatDateKey } from '../utils/storage';

interface ProgressViewProps {
  progress: BodyMeasurement[];
  onAddMeasurement: (entry: BodyMeasurement) => void;
  onDeleteMeasurement: (id: string) => void;
}

type MetricKey = 'weightKg' | 'muscleMassKg' | 'bodyFatPercent' | 'waistCm' | 'armsCm';

export const ProgressView: React.FC<ProgressViewProps> = ({
  progress,
  onAddMeasurement,
  onDeleteMeasurement,
}) => {
  // Sort entries chronologically
  const sortedEntries = [...progress].sort(
    (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()
  );

  const [selectedMetric, setSelectedMetric] = useState<MetricKey>('weightKg');
  const [activeTooltip, setActiveTooltip] = useState<{
    x: number;
    y: number;
    date: string;
    value: number;
    unit: string;
  } | null>(null);

  // Modal state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [inputDate, setInputDate] = useState(formatDateKey());
  const [inputWeight, setInputWeight] = useState<number | ''>('');
  const [inputMuscle, setInputMuscle] = useState<number | ''>('');
  const [inputBodyFat, setInputBodyFat] = useState<number | ''>('');
  const [inputWaist, setInputWaist] = useState<number | ''>('');
  const [inputArms, setInputArms] = useState<number | ''>('');
  const [inputChest, setInputChest] = useState<number | ''>('');
  const [inputThighs, setInputThighs] = useState<number | ''>('');
  const [inputNotes, setInputNotes] = useState('');

  // Latest vs First entry for overall diff
  const firstEntry = sortedEntries[0];
  const latestEntry = sortedEntries[sortedEntries.length - 1];

  const metricsConfig: Record<
    MetricKey,
    { label: string; unit: string; color: string; stroke: string; goalDirection: 'down' | 'up' }
  > = {
    weightKg: {
      label: 'Peso Corporal',
      unit: 'kg',
      color: '#f97316',
      stroke: 'rgb(249, 115, 22)',
      goalDirection: 'down',
    },
    muscleMassKg: {
      label: 'Masa Muscular',
      unit: 'kg',
      color: '#10b981',
      stroke: 'rgb(16, 185, 129)',
      goalDirection: 'up',
    },
    bodyFatPercent: {
      label: '% Grasa Corporal',
      unit: '%',
      color: '#06b6d4',
      stroke: 'rgb(6, 182, 212)',
      goalDirection: 'down',
    },
    waistCm: {
      label: 'Cintura',
      unit: 'cm',
      color: '#f59e0b',
      stroke: 'rgb(245, 158, 11)',
      goalDirection: 'down',
    },
    armsCm: {
      label: 'Brazos',
      unit: 'cm',
      color: '#ec4899',
      stroke: 'rgb(236, 72, 153)',
      goalDirection: 'up',
    },
  };

  const currentMetricConfig = metricsConfig[selectedMetric];

  // Filter entries that have the selected metric
  const validDataPoints = sortedEntries
    .filter((entry) => {
      if (selectedMetric === 'waistCm') return entry.waistCm !== undefined;
      if (selectedMetric === 'armsCm') return entry.armsCm !== undefined;
      return entry[selectedMetric] !== undefined;
    })
    .map((entry) => {
      let val = 0;
      if (selectedMetric === 'waistCm') val = entry.waistCm || 0;
      else if (selectedMetric === 'armsCm') val = entry.armsCm || 0;
      else val = (entry[selectedMetric] as number) || 0;
      return {
        date: entry.date,
        value: val,
        rawEntry: entry,
      };
    });

  // Calculate Chart Coordinates
  const chartWidth = 340;
  const chartHeight = 170;
  const paddingX = 25;
  const paddingY = 25;

  const values = validDataPoints.map((d) => d.value);
  const minVal = values.length > 0 ? Math.min(...values) : 0;
  const maxVal = values.length > 0 ? Math.max(...values) : 100;
  const range = maxVal - minVal || 1;

  // Generate SVG Points
  const points = validDataPoints.map((d, idx) => {
    const x =
      paddingX +
      (idx / Math.max(1, validDataPoints.length - 1)) * (chartWidth - paddingX * 2);
    const normalizedY = (d.value - minVal) / range;
    const y = chartHeight - paddingY - normalizedY * (chartHeight - paddingY * 2);
    return { x, y, date: d.date, value: d.value };
  });

  const svgPathD =
    points.length > 1
      ? points.reduce((acc, pt, i) => `${acc} ${i === 0 ? 'M' : 'L'} ${pt.x} ${pt.y}`, '')
      : '';

  const areaPathD =
    points.length > 1
      ? `${svgPathD} L ${points[points.length - 1].x} ${chartHeight - paddingY + 5} L ${
          points[0].x
        } ${chartHeight - paddingY + 5} Z`
      : '';

  // Calculate Net Change for selected metric
  const firstVal = validDataPoints[0]?.value || 0;
  const latestVal = validDataPoints[validDataPoints.length - 1]?.value || 0;
  const changeDiff = Number((latestVal - firstVal).toFixed(1));

  const handleSaveModal = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputWeight) return;

    const newEntry: BodyMeasurement = {
      id: `bm-${Date.now()}`,
      date: inputDate,
      weightKg: Number(inputWeight),
      muscleMassKg: inputMuscle ? Number(inputMuscle) : undefined,
      bodyFatPercent: inputBodyFat ? Number(inputBodyFat) : undefined,
      waistCm: inputWaist ? Number(inputWaist) : undefined,
      armsCm: inputArms ? Number(inputArms) : undefined,
      chestCm: inputChest ? Number(inputChest) : undefined,
      thighsCm: inputThighs ? Number(inputThighs) : undefined,
      notes: inputNotes.trim() || undefined,
    };

    onAddMeasurement(newEntry);
    setIsModalOpen(false);
  };

  return (
    <div className="space-y-4 pb-24 max-w-md mx-auto px-4 pt-3">
      {/* PROGRESS SUMMARY HERO */}
      <div className="bg-gradient-to-br from-slate-900 via-slate-900 to-[#192233] border border-slate-800 rounded-3xl p-5 shadow-2xl relative overflow-hidden">
        {/* Glow backdrop */}
        <div
          className="absolute -top-10 -right-10 w-44 h-44 rounded-full blur-3xl opacity-20 pointer-events-none"
          style={{ backgroundColor: currentMetricConfig.color }}
        />

        <div className="flex items-center justify-between mb-3">
          <div>
            <span className="text-[10px] font-black uppercase tracking-wider text-orange-400 bg-orange-500/10 px-2 py-0.5 rounded-full border border-orange-500/20">
              Evolución Corporal
            </span>
            <h2 className="text-xl font-black text-white mt-1">Gráficas de Progreso</h2>
          </div>

          <button
            onClick={() => setIsModalOpen(true)}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-orange-500 hover:bg-orange-600 active:scale-95 text-white text-xs font-bold transition-all shadow-lg shadow-orange-500/30"
          >
            <Plus className="w-3.5 h-3.5 stroke-[2.5]" />
            <span>Registrar Peso</span>
          </button>
        </div>

        {/* Metric Selector Pills */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none my-2 select-none">
          {(Object.keys(metricsConfig) as MetricKey[]).map((key) => {
            const isSelected = selectedMetric === key;
            const config = metricsConfig[key];

            return (
              <button
                key={key}
                onClick={() => {
                  setSelectedMetric(key);
                  setActiveTooltip(null);
                }}
                className={`py-1.5 px-3 rounded-xl text-xs font-bold whitespace-nowrap transition-all ${
                  isSelected
                    ? 'bg-white text-slate-950 shadow-md font-extrabold scale-[1.02]'
                    : 'bg-slate-950/60 hover:bg-slate-800 text-slate-400 border border-slate-800'
                }`}
              >
                {config.label}
              </button>
            );
          })}
        </div>

        {/* Current Metric Readout & Change Badge */}
        <div className="flex items-end justify-between mt-3 mb-2 bg-slate-950/60 rounded-2xl p-4 border border-slate-800/80">
          <div>
            <span className="text-xs text-slate-400 font-medium">{currentMetricConfig.label} actual</span>
            <div className="flex items-baseline gap-1 mt-0.5">
              <span className="text-3xl font-black text-white font-mono">
                {validDataPoints.length > 0 ? latestVal : '--'}
              </span>
              <span className="text-xs text-slate-400 font-bold">
                {validDataPoints.length > 0 ? currentMetricConfig.unit : ''}
              </span>
            </div>
          </div>

          <div className="text-right">
            <span className="text-[10px] text-slate-400 block font-medium">Cambio total</span>
            {validDataPoints.length >= 2 ? (
              <div
                className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-black font-mono mt-1 ${
                  changeDiff === 0
                    ? 'bg-slate-800 text-slate-300'
                    : (currentMetricConfig.goalDirection === 'down' && changeDiff < 0) ||
                      (currentMetricConfig.goalDirection === 'up' && changeDiff > 0)
                    ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                    : 'bg-orange-500/20 text-orange-400 border border-orange-500/30'
                }`}
              >
                {changeDiff > 0 ? (
                  <ArrowUpRight className="w-3.5 h-3.5 stroke-[2.5]" />
                ) : changeDiff < 0 ? (
                  <ArrowDownRight className="w-3.5 h-3.5 stroke-[2.5]" />
                ) : null}
                <span>
                  {changeDiff > 0 ? `+${changeDiff}` : changeDiff} {currentMetricConfig.unit}
                </span>
              </div>
            ) : (
              <span className="text-[11px] text-slate-500 font-medium mt-1 inline-block">
                Pendiente de registros
              </span>
            )}
          </div>
        </div>

        {/* INTERACTIVE SVG LINE & AREA CHART */}
        <div className="relative mt-3 pt-2">
          {validDataPoints.length < 2 ? (
            <div className="h-44 flex items-center justify-center text-xs text-slate-500 text-center px-4">
              Agrega al menos dos registros de peso o medidas para graficar la curva de progreso.
            </div>
          ) : (
            <div className="relative bg-slate-950/40 rounded-2xl p-2 border border-slate-800/60">
              <svg viewBox={`0 0 ${chartWidth} ${chartHeight}`} className="w-full h-44 overflow-visible">
                <defs>
                  <linearGradient id="chartGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor={currentMetricConfig.color} stopOpacity="0.4" />
                    <stop offset="100%" stopColor={currentMetricConfig.color} stopOpacity="0.0" />
                  </linearGradient>
                </defs>

                {/* Horizontal reference lines */}
                <line
                  x1={paddingX}
                  y1={paddingY}
                  x2={chartWidth - paddingX}
                  y2={paddingY}
                  stroke="rgba(255,255,255,0.06)"
                  strokeDasharray="4 4"
                />
                <line
                  x1={paddingX}
                  y1={chartHeight / 2}
                  x2={chartWidth - paddingX}
                  y2={chartHeight / 2}
                  stroke="rgba(255,255,255,0.06)"
                  strokeDasharray="4 4"
                />
                <line
                  x1={paddingX}
                  y1={chartHeight - paddingY}
                  x2={chartWidth - paddingX}
                  y2={chartHeight - paddingY}
                  stroke="rgba(255,255,255,0.06)"
                />

                {/* Shaded Area */}
                <path d={areaPathD} fill="url(#chartGradient)" />

                {/* Line Path */}
                <path
                  d={svgPathD}
                  fill="none"
                  stroke={currentMetricConfig.color}
                  strokeWidth="3.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />

                {/* Interactive Points */}
                {points.map((pt, i) => {
                  const isHovered = activeTooltip?.date === pt.date;

                  return (
                    <g key={pt.date}>
                      {/* Invisible larger hit target */}
                      <circle
                        cx={pt.x}
                        cy={pt.y}
                        r="18"
                        fill="transparent"
                        className="cursor-pointer"
                        onClick={() =>
                          setActiveTooltip({
                            x: pt.x,
                            y: pt.y,
                            date: pt.date,
                            value: pt.value,
                            unit: currentMetricConfig.unit,
                          })
                        }
                      />
                      {/* Visible point */}
                      <circle
                        cx={pt.x}
                        cy={pt.y}
                        r={isHovered ? 7 : 4.5}
                        fill="#090d16"
                        stroke={currentMetricConfig.color}
                        strokeWidth={isHovered ? 3.5 : 2.5}
                        className="transition-all duration-150 pointer-events-none"
                      />
                    </g>
                  );
                })}
              </svg>

              {/* Tooltip Overlay */}
              {activeTooltip && (
                <div
                  className="absolute bg-slate-900 border border-slate-700 text-white rounded-xl px-2.5 py-1.5 shadow-2xl pointer-events-none -translate-x-1/2 -translate-y-full text-center"
                  style={{
                    left: `${(activeTooltip.x / chartWidth) * 100}%`,
                    top: `${(activeTooltip.y / chartHeight) * 100}%`,
                  }}
                >
                  <span className="text-[10px] text-slate-400 block font-mono leading-none">
                    {new Date(activeTooltip.date + 'T12:00:00').toLocaleDateString('es-ES', {
                      day: 'numeric',
                      month: 'short',
                    })}
                  </span>
                  <span className="text-xs font-black font-mono text-orange-400">
                    {activeTooltip.value} {activeTooltip.unit}
                  </span>
                </div>
              )}

              {/* Min & Max labels */}
              <div className="flex items-center justify-between text-[10px] text-slate-500 font-mono px-2 mt-1">
                <span>
                  Mín: {minVal} {currentMetricConfig.unit}
                </span>
                <span>Toca los puntos para ver detalles</span>
                <span>
                  Máx: {maxVal} {currentMetricConfig.unit}
                </span>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* BODY MEASUREMENTS SNAPSHOT */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-3xl p-5 shadow-xl">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-xl bg-orange-500/10 text-orange-400 border border-orange-500/20">
              <Ruler className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-extrabold text-sm text-white">Medidas Corporales Actuales</h3>
              <p className="text-[11px] text-slate-400">
                Última medición:{' '}
                {latestEntry?.date
                  ? new Date(latestEntry.date + 'T12:00:00').toLocaleDateString('es-ES', {
                      day: 'numeric',
                      month: 'short',
                    })
                  : 'Sin registros aún'}
              </p>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-2.5">
          <div className="bg-slate-950/60 rounded-2xl p-3 border border-slate-800/80">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
              Cintura
            </span>
            <div className="flex items-baseline gap-1 mt-0.5">
              <span className="text-xl font-black text-amber-400 font-mono">
                {latestEntry?.waistCm || '--'}
              </span>
              <span className="text-xs text-slate-500">cm</span>
            </div>
            {firstEntry?.waistCm && latestEntry?.waistCm && (
              <span className="text-[10px] text-emerald-400 font-bold mt-1 block">
                {(latestEntry.waistCm - firstEntry.waistCm).toFixed(1)} cm desde inicio
              </span>
            )}
          </div>

          <div className="bg-slate-950/60 rounded-2xl p-3 border border-slate-800/80">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
              Brazos (Bíceps)
            </span>
            <div className="flex items-baseline gap-1 mt-0.5">
              <span className="text-xl font-black text-pink-400 font-mono">
                {latestEntry?.armsCm || '--'}
              </span>
              <span className="text-xs text-slate-500">cm</span>
            </div>
            {firstEntry?.armsCm && latestEntry?.armsCm && (
              <span className="text-[10px] text-emerald-400 font-bold mt-1 block">
                +{(latestEntry.armsCm - firstEntry.armsCm).toFixed(1)} cm ganancia
              </span>
            )}
          </div>

          <div className="bg-slate-950/60 rounded-2xl p-3 border border-slate-800/80">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
              Pecho / Torso
            </span>
            <div className="flex items-baseline gap-1 mt-0.5">
              <span className="text-xl font-black text-cyan-400 font-mono">
                {latestEntry?.chestCm || '--'}
              </span>
              <span className="text-xs text-slate-500">cm</span>
            </div>
          </div>

          <div className="bg-slate-950/60 rounded-2xl p-3 border border-slate-800/80">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
              Muslos / Piernas
            </span>
            <div className="flex items-baseline gap-1 mt-0.5">
              <span className="text-xl font-black text-emerald-400 font-mono">
                {latestEntry?.thighsCm || '--'}
              </span>
              <span className="text-xs text-slate-500">cm</span>
            </div>
          </div>
        </div>
      </div>

      {/* WEIGH-IN HISTORY LOG */}
      <div className="bg-slate-900/80 border border-slate-800 rounded-3xl p-5 shadow-xl">
        <h3 className="font-extrabold text-sm text-white mb-3 flex items-center gap-2">
          <Scale className="w-4 h-4 text-orange-400" />
          <span>Historial de Pesajes ({sortedEntries.length})</span>
        </h3>

        <div className="space-y-2">
          {sortedEntries.length === 0 ? (
            <div className="text-center py-6 border border-dashed border-slate-800 rounded-2xl bg-slate-950/30">
              <p className="text-xs text-slate-400 font-semibold">No hay registros de peso todavía</p>
              <p className="text-[11px] text-slate-500 mt-0.5">Comienza a registrar tu peso y medidas corporales.</p>
              <button
                onClick={() => setIsModalOpen(true)}
                className="mt-3 px-3.5 py-1.5 bg-orange-500 hover:bg-orange-600 text-white rounded-xl text-xs font-bold transition-all shadow-md inline-flex items-center gap-1.5"
              >
                <Plus className="w-3.5 h-3.5" /> Registrar Primer Pesaje
              </button>
            </div>
          ) : (
            [...sortedEntries].reverse().map((entry) => (
              <div
                key={entry.id}
                className="bg-slate-950/60 border border-slate-800/80 rounded-2xl p-3 flex items-center justify-between"
              >
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-black font-mono text-white">
                      {entry.weightKg} kg
                    </span>
                    {entry.muscleMassKg && (
                      <span className="text-[11px] font-semibold text-emerald-400 bg-emerald-500/10 px-2 py-0.2 rounded-md">
                        Músculo: {entry.muscleMassKg} kg
                      </span>
                    )}
                    {entry.bodyFatPercent && (
                      <span className="text-[11px] font-semibold text-cyan-400 bg-cyan-500/10 px-2 py-0.2 rounded-md">
                        {entry.bodyFatPercent}% Grasa
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-2 mt-1">
                    <span className="text-[11px] text-slate-400">
                      {new Date(entry.date + 'T12:00:00').toLocaleDateString('es-ES', {
                        weekday: 'short',
                        day: 'numeric',
                        month: 'short',
                      })}
                    </span>
                    {entry.notes && (
                      <span className="text-[11px] text-slate-400 truncate max-w-[180px]">
                        • {entry.notes}
                      </span>
                    )}
                  </div>
                </div>

                <button
                  onClick={() => onDeleteMeasurement(entry.id)}
                  className="p-2 text-slate-500 hover:text-red-400 hover:bg-red-500/10 rounded-xl transition-colors"
                  title="Eliminar registro"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            ))
          )}
        </div>
      </div>

      {/* NEW MEASUREMENT MODAL */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/80 backdrop-blur-sm p-0 sm:p-4">
          <div className="w-full max-w-md bg-slate-900 border border-slate-800 rounded-t-3xl sm:rounded-3xl p-6 shadow-2xl max-h-[92vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-4 border-b border-slate-800 mb-4">
              <h3 className="text-lg font-black text-white flex items-center gap-2">
                <Scale className="w-5 h-5 text-orange-500" />
                Nuevo Registro Físico
              </h3>
              <button
                onClick={() => setIsModalOpen(false)}
                className="p-1.5 rounded-full hover:bg-slate-800 text-slate-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveModal} className="space-y-4">
              {/* Date */}
              <div>
                <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-1.5">
                  Fecha *
                </label>
                <input
                  type="date"
                  required
                  value={inputDate}
                  onChange={(e) => setInputDate(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white focus:outline-none focus:border-orange-500 text-sm"
                />
              </div>

              {/* Weight & Muscle & BodyFat */}
              <div className="grid grid-cols-3 gap-2.5">
                <div>
                  <label className="block text-[10px] font-bold text-orange-400 uppercase tracking-wider mb-1">
                    Peso (kg) *
                  </label>
                  <input
                    type="number"
                    step="0.1"
                    min="30"
                    max="300"
                    required
                    value={inputWeight}
                    onChange={(e) =>
                      setInputWeight(e.target.value === '' ? '' : Number(e.target.value))
                    }
                    className="w-full px-2.5 py-2 rounded-xl bg-slate-950 border border-slate-800 text-white font-mono font-bold text-sm text-center focus:border-orange-500"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-emerald-400 uppercase tracking-wider mb-1">
                    Masa Músculo (kg)
                  </label>
                  <input
                    type="number"
                    step="0.1"
                    min="10"
                    max="150"
                    placeholder="Opcional"
                    value={inputMuscle}
                    onChange={(e) =>
                      setInputMuscle(e.target.value === '' ? '' : Number(e.target.value))
                    }
                    className="w-full px-2.5 py-2 rounded-xl bg-slate-950 border border-slate-800 text-white font-mono font-bold text-sm text-center focus:border-orange-500"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-cyan-400 uppercase tracking-wider mb-1">
                    % Grasa
                  </label>
                  <input
                    type="number"
                    step="0.1"
                    min="3"
                    max="60"
                    placeholder="Opcional"
                    value={inputBodyFat}
                    onChange={(e) =>
                      setInputBodyFat(e.target.value === '' ? '' : Number(e.target.value))
                    }
                    className="w-full px-2.5 py-2 rounded-xl bg-slate-950 border border-slate-800 text-white font-mono font-bold text-sm text-center focus:border-orange-500"
                  />
                </div>
              </div>

              {/* Body Measurements Section */}
              <div className="pt-2 border-t border-slate-800">
                <span className="text-xs font-bold text-slate-300 uppercase tracking-wider block mb-2">
                  Medidas con Cinta Métrica (cm)
                </span>
                <div className="grid grid-cols-2 gap-2.5">
                  <div>
                    <label className="block text-[10px] text-slate-400 mb-1">Cintura (cm)</label>
                    <input
                      type="number"
                      step="0.5"
                      placeholder="Ej: 80"
                      value={inputWaist}
                      onChange={(e) =>
                        setInputWaist(e.target.value === '' ? '' : Number(e.target.value))
                      }
                      className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-white text-sm font-mono focus:border-orange-500"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] text-slate-400 mb-1">Brazos (cm)</label>
                    <input
                      type="number"
                      step="0.5"
                      placeholder="Ej: 37"
                      value={inputArms}
                      onChange={(e) =>
                        setInputArms(e.target.value === '' ? '' : Number(e.target.value))
                      }
                      className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-white text-sm font-mono focus:border-orange-500"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] text-slate-400 mb-1">Pecho (cm)</label>
                    <input
                      type="number"
                      step="0.5"
                      placeholder="Ej: 103"
                      value={inputChest}
                      onChange={(e) =>
                        setInputChest(e.target.value === '' ? '' : Number(e.target.value))
                      }
                      className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-white text-sm font-mono focus:border-orange-500"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] text-slate-400 mb-1">Muslos (cm)</label>
                    <input
                      type="number"
                      step="0.5"
                      placeholder="Ej: 59.5"
                      value={inputThighs}
                      onChange={(e) =>
                        setInputThighs(e.target.value === '' ? '' : Number(e.target.value))
                      }
                      className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-white text-sm font-mono focus:border-orange-500"
                    />
                  </div>
                </div>
              </div>

              {/* Notes */}
              <div>
                <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-1">
                  Notas sobre la forma física o sensaciones
                </label>
                <input
                  type="text"
                  placeholder="Ej: Menos retención de líquidos, más definición..."
                  value={inputNotes}
                  onChange={(e) => setInputNotes(e.target.value)}
                  className="w-full px-3.5 py-2 rounded-xl bg-slate-950 border border-slate-800 text-white placeholder-slate-500 text-sm focus:border-orange-500"
                />
              </div>

              <div className="pt-2 flex items-center gap-3">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="flex-1 py-3 px-4 rounded-xl bg-slate-800 text-slate-300 text-sm font-bold"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="flex-1 py-3 px-4 rounded-xl bg-gradient-to-r from-orange-500 to-amber-500 text-white text-sm font-bold shadow-lg shadow-orange-500/25 flex items-center justify-center gap-2"
                >
                  <Plus className="w-4 h-4" />
                  <span>Guardar Registro</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
