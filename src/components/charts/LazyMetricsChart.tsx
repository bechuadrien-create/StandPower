import React, { Suspense } from 'react';
import type { MetricsChartProps } from './MetricsChart';

const LazyLoadedChart = React.lazy(() => import('./MetricsChart'));

export function LazyMetricsChart(props: MetricsChartProps) {
  return (
    <Suspense
      fallback={
        <div className="h-56 w-full flex items-center justify-center text-xs text-sp-muted bg-sp-elevated/40 rounded-xl">
          Chargement du graphique…
        </div>
      }
    >
      <LazyLoadedChart {...props} />
    </Suspense>
  );
}
