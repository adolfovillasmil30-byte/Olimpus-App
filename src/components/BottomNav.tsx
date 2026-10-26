import React from 'react';
import { Home, Dumbbell, Flame, Utensils, TrendingUp } from 'lucide-react';

export type NavTab = 'inicio' | 'gym' | 'racha' | 'comidas' | 'progreso';

interface BottomNavProps {
  currentTab: NavTab;
  onTabChange: (tab: NavTab) => void;
  streakCount: number;
}

export const BottomNav: React.FC<BottomNavProps> = ({
  currentTab,
  onTabChange,
  streakCount,
}) => {
  const tabs = [
    {
      id: 'inicio' as NavTab,
      label: 'Inicio',
      icon: Home,
    },
    {
      id: 'gym' as NavTab,
      label: 'Gym',
      icon: Dumbbell,
    },
    {
      id: 'racha' as NavTab,
      label: 'Racha',
      icon: Flame,
      badge: streakCount > 0 ? `${streakCount}🔥` : undefined,
    },
    {
      id: 'comidas' as NavTab,
      label: 'Comidas',
      icon: Utensils,
    },
    {
      id: 'progreso' as NavTab,
      label: 'Progreso',
      icon: TrendingUp,
    },
  ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-40 bg-black/95 backdrop-blur-2xl border-t border-[#d4af37]/25 pb-safe">
      <div className="max-w-md mx-auto px-2 py-2 flex items-center justify-around">
        {tabs.map((tab) => {
          const isActive = currentTab === tab.id;
          const Icon = tab.icon;

          return (
            <button
              key={tab.id}
              onClick={() => onTabChange(tab.id)}
              className={`relative flex flex-col items-center justify-center py-1.5 px-3 rounded-2xl transition-all duration-200 active:scale-90 ${
                isActive
                  ? 'text-[#f5d061] font-bold'
                  : 'text-neutral-400 hover:text-amber-100 font-medium'
              }`}
            >
              {/* Active gold glow indicator */}
              {isActive && (
                <span className="absolute -top-1 w-8 h-1 bg-gradient-to-r from-[#f5d061] via-[#d4af37] to-[#8c6615] rounded-full shadow-[0_0_12px_rgba(212,175,55,0.7)]" />
              )}

              <div className="relative">
                <Icon
                  className={`w-5 h-5 transition-transform duration-200 ${
                    isActive ? 'scale-110 stroke-[2.4] text-[#f5d061]' : 'stroke-[1.8]'
                  } ${tab.id === 'racha' && isActive ? 'text-amber-400 fill-amber-400/20 animate-pulse' : ''}`}
                />
                {tab.badge && tab.id === 'racha' && !isActive && (
                  <span className="absolute -top-1.5 -right-3 text-[10px] bg-gradient-to-r from-amber-600 to-[#d4af37] text-black font-black px-1 rounded-full leading-tight shadow-sm">
                    {streakCount}
                  </span>
                )}
              </div>

              <span className={`text-[10px] tracking-tight mt-1 ${isActive ? 'text-amber-200 font-bold' : 'text-neutral-400'}`}>
                {tab.label}
              </span>
            </button>
          );
        })}
      </div>
    </nav>
  );
};
