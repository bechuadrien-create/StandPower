import React, { Suspense, useEffect } from 'react';
import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';
import { useAppStore } from '../providers/useAppStore';
import { MainLayout } from '../layouts/MainLayout';
import { TodayPage } from '../../features/dashboard/TodayPage';
import { AlertBox, Button, Card } from '../../components/ui/Primitives';

const StrengthPage = React.lazy(() =>
  import('../../features/strength/StrengthPage').then((m) => ({
    default: m.StrengthPage,
  }))
);
const CombatPage = React.lazy(() =>
  import('../../features/combat/CombatPage').then((m) => ({
    default: m.CombatPage,
  }))
);
const ProgramsPage = React.lazy(() =>
  import('../../features/programs/ProgramsPage').then((m) => ({
    default: m.ProgramsPage,
  }))
);
const ProgressPage = React.lazy(() =>
  import('../../features/progress/ProgressPage').then((m) => ({
    default: m.ProgressPage,
  }))
);
const NutritionPage = React.lazy(() =>
  import('../../features/nutrition/NutritionPage').then((m) => ({
    default: m.NutritionPage,
  }))
);
const ProfilePage = React.lazy(() =>
  import('../../features/profile/ProfilePage').then((m) => ({
    default: m.ProfilePage,
  }))
);
const OnboardingPage = React.lazy(() =>
  import('../../features/onboarding/OnboardingPage').then((m) => ({
    default: m.OnboardingPage,
  }))
);

function ScreenLoader() {
  return (
    <div className="py-12 text-center text-sm text-sp-muted">
      Chargement de l’écran…
    </div>
  );
}

export function AppRouter() {
  const isHydrated = useAppStore((s) => s.isHydrated);
  const hydrationError = useAppStore((s) => s.hydrationError);
  const hydrate = useAppStore((s) => s.hydrate);

  useEffect(() => {
    void hydrate();
  }, [hydrate]);

  if (!isHydrated) {
    return (
      <div className="min-h-dvh flex items-center justify-center bg-sp-bg text-sp-text p-6">
        <div className="text-center space-y-2">
          <div className="w-10 h-10 rounded-xl bg-sp-accent text-sp-accent-fg font-bold flex items-center justify-center mx-auto">
            SP
          </div>
          <p className="text-sm text-sp-muted">
            Initialisation de la base locale StandPower…
          </p>
        </div>
      </div>
    );
  }

  if (hydrationError) {
    return (
      <div className="min-h-dvh flex items-center justify-center bg-sp-bg text-sp-text p-6">
        <Card className="max-w-md w-full space-y-3">
          <AlertBox tone="error" title="Erreur de chargement local">
            {hydrationError}
          </AlertBox>
          <Button variant="primary" onClick={() => void hydrate()}>
            Réessayer
          </Button>
        </Card>
      </div>
    );
  }

  return (
    <BrowserRouter>
      <Suspense fallback={<ScreenLoader />}>
        <Routes>
          <Route element={<MainLayout />}>
            <Route path="/" element={<TodayPage />} />
            <Route path="/onboarding" element={<OnboardingPage />} />
            <Route path="/musculation" element={<StrengthPage />} />
            <Route path="/programmes" element={<ProgramsPage />} />
            <Route path="/combat" element={<CombatPage />} />
            <Route path="/progression" element={<ProgressPage />} />
            <Route path="/nutrition" element={<NutritionPage />} />
            <Route path="/profil" element={<ProfilePage />} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Route>
        </Routes>
      </Suspense>
    </BrowserRouter>
  );
}
