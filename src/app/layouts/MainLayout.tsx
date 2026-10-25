import React, { useEffect } from 'react';
import { NavLink, Outlet, useLocation, useNavigate } from 'react-router-dom';
import { App as CapacitorApp } from '@capacitor/app';
import {
  Activity,
  Calendar,
  Check,
  Dumbbell,
  Play,
  Shield,
  Sun,
  Moon,
  User,
} from 'lucide-react';
import { useAppStore } from '../providers/useAppStore';

export function MainLayout() {
  const navigate = useNavigate();
  const location = useLocation();
  const snapshot = useAppStore((s) => s.snapshot);
  const lastSavedAt = useAppStore((s) => s.lastSavedAt);
  const updatePreferences = useAppStore((s) => s.updatePreferences);
  const resetAllLocalData = useAppStore((s) => s.resetAllLocalData);

  const activeWorkout = snapshot.workoutSessions.find(
    (w) => w.status === 'in_progress' || w.status === 'paused'
  );

  // Synchronisation du thème (Sombre / Clair / Système)
  useEffect(() => {
    const root = document.documentElement;
    const theme = snapshot.userPreferences.theme;

    const applyTheme = () => {
      if (theme === 'dark') {
        root.classList.add('dark');
      } else if (theme === 'light') {
        root.classList.remove('dark');
      } else {
        const prefersDark =
          typeof window !== 'undefined' &&
          window.matchMedia('(prefers-color-scheme: dark)').matches;
        if (prefersDark) root.classList.add('dark');
        else root.classList.remove('dark');
      }
    };

    applyTheme();
  }, [snapshot.userPreferences.theme]);

  // Gestion du bouton retour matériel Android
  useEffect(() => {
    let listenerHandle: { remove: () => Promise<void> } | null = null;
    const setupBackListener = async () => {
      try {
        listenerHandle = await CapacitorApp.addListener('backButton', ({ canGoBack }) => {
          if (location.pathname !== '/' && canGoBack) {
            window.history.back();
          } else if (location.pathname !== '/') {
            navigate('/');
          } else {
            void CapacitorApp.exitApp();
          }
        });
      } catch {
        // Ignoré hors contexte natif
      }
    };
    void setupBackListener();
    return () => {
      if (listenerHandle) void listenerHandle.remove();
    };
  }, [location.pathname, navigate]);

  const toggleThemeQuick = () => {
    const next = snapshot.userPreferences.theme === 'dark' ? 'light' : 'dark';
    void updatePreferences({ theme: next });
  };

  const navItems = [
    { to: '/', label: "Aujourd'hui", icon: Calendar },
    { to: '/musculation', label: 'Musculation', icon: Dumbbell },
    { to: '/combat', label: 'Combat', icon: Shield },
    { to: '/progression', label: 'Progression', icon: Activity },
    { to: '/profil', label: 'Profil', icon: User },
  ];

  return (
    <div className="min-h-dvh flex flex-col bg-sp-bg text-sp-text">
      {/* Bannière Mode Démo explicite et réinitialisable */}
      {snapshot.userPreferences.demoModeActive && (
        <div className="bg-sp-terracotta text-sp-terracotta-fg px-4 py-2 text-xs font-medium flex items-center justify-between gap-2">
          <span>Mode démonstration actif (données d’exemple).</span>
          <button
            type="button"
            onClick={() => void resetAllLocalData()}
            className="underline font-semibold px-2 py-1 rounded hover:opacity-90"
          >
            Réinitialiser
          </button>
        </div>
      )}

      {/* En-tête sobre */}
      <header className="sticky top-0 z-30 bg-sp-bg/95 backdrop-blur-sm border-b border-sp-border px-4 py-2.5 flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-sp-accent text-sp-accent-fg flex items-center justify-center font-bold text-sm tracking-tight">
            SP
          </div>
          <div>
            <span className="font-semibold tracking-tight text-base">StandPower</span>
            <span className="sr-only"> — Carnet de performance local</span>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {lastSavedAt && (
            <span
              className="hidden sm:inline-flex items-center gap-1 text-xs text-sp-muted"
              aria-live="polite"
            >
              <Check className="w-3.5 h-3.5 text-sp-success" />
              Sauvegardé
            </span>
          )}
          <button
            type="button"
            onClick={toggleThemeQuick}
            aria-label={
              snapshot.userPreferences.theme === 'dark'
                ? 'Passer au thème clair'
                : 'Passer au thème sombre'
            }
            className="touch-target inline-flex items-center justify-center rounded-xl text-sp-muted hover:text-sp-text hover:bg-sp-elevated px-2.5"
          >
            {snapshot.userPreferences.theme === 'dark' ? (
              <Sun className="w-5 h-5" />
            ) : (
              <Moon className="w-5 h-5" />
            )}
          </button>
        </div>
      </header>

      {/* Bandeau de reprise rapide si une séance est en cours et qu'on est sur un autre écran */}
      {activeWorkout && location.pathname !== '/musculation' && (
        <div className="bg-sp-elevated border-b border-sp-accent/50 px-4 py-2.5 flex items-center justify-between gap-3">
          <div className="min-w-0">
            <p className="text-xs font-semibold text-sp-accent uppercase tracking-wider">
              Séance en cours ({activeWorkout.status === 'paused' ? 'En pause' : 'Active'})
            </p>
            <p className="text-sm font-medium truncate">{activeWorkout.title}</p>
          </div>
          <button
            type="button"
            onClick={() => navigate('/musculation')}
            className="touch-target shrink-0 inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-sp-accent text-sp-accent-fg text-xs font-semibold"
          >
            <Play className="w-4 h-4" />
            Reprendre
          </button>
        </div>
      )}

      {/* Contenu principal */}
      <main className="flex-1 w-full max-w-3xl mx-auto px-4 pt-4 pb-28">
        <Outlet />
      </main>

      {/* Barre de navigation principale (5 onglets, cibles >= 48dp, safe-area) */}
      <nav
        aria-label="Navigation principale"
        className="fixed bottom-0 inset-x-0 z-30 bg-sp-surface/95 backdrop-blur-sm border-t border-sp-border pb-[env(safe-area-inset-bottom,0px)]"
      >
        <div className="max-w-3xl mx-auto grid grid-cols-5">
          {navItems.map((item) => {
            const Icon = item.icon;
            return (
              <NavLink
                key={item.to}
                to={item.to}
                end={item.to === '/'}
                className={({ isActive }) =>
                  `touch-target flex flex-col items-center justify-center py-2 px-1 text-xs font-medium transition-colors ${
                    isActive
                      ? 'text-sp-accent font-semibold'
                      : 'text-sp-muted hover:text-sp-text'
                  }`
                }
              >
                <Icon className="w-5 h-5 mb-1" aria-hidden="true" />
                <span className="truncate max-w-full">{item.label}</span>
              </NavLink>
            );
          })}
        </div>
      </nav>
    </div>
  );
}
