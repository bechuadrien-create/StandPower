import React from 'react';
import {
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { formatCivilDateFr } from '../../domain/calculations/units';

export interface ChartDataPoint {
  civilDate: string;
  value: number;
  movingAverage7d?: number;
}

export interface MetricsChartProps {
  title: string;
  unitLabel: string;
  data: ChartDataPoint[];
  showMovingAverage?: boolean;
}

export default function MetricsChart({
  title,
  unitLabel,
  data,
  showMovingAverage = false,
}: MetricsChartProps) {
  if (data.length === 0) {
    return (
      <div className="py-8 text-center text-sm text-sp-muted">
        Aucune mesure enregistrée sur cette période. StandPower n’invente jamais de données pour remplir un graphique.
      </div>
    );
  }

  const formattedData = data.map((d) => ({
    ...d,
    shortDate: formatCivilDateFr(d.civilDate),
  }));

  const firstVal = data[0].value;
  const lastVal = data[data.length - 1].value;
  const delta = Number((lastVal - firstVal).toFixed(2));

  return (
    <div className="space-y-3" aria-label={title}>
      <div className="flex flex-wrap items-center justify-between gap-2 text-xs text-sp-muted">
        <span>
          {data.length} point{data.length > 1 ? 's' : ''} enregistré{data.length > 1 ? 's' : ''}
        </span>
        <span className="tabular-nums font-medium text-sp-text">
          Dernier : {lastVal.toString().replace('.', ',')} {unitLabel}
          {data.length > 1 && (
            <span className="ml-2 text-sp-muted">
              ({delta > 0 ? `+${delta.toString().replace('.', ',')}` : delta.toString().replace('.', ',')} {unitLabel})
            </span>
          )}
        </span>
      </div>

      <div className="h-56 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={formattedData} margin={{ top: 8, right: 12, bottom: 4, left: -12 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="var(--sp-border)" />
            <XAxis
              dataKey="shortDate"
              tick={{ fill: 'var(--sp-muted)', fontSize: 11 }}
              stroke="var(--sp-border)"
            />
            <YAxis
              domain={['auto', 'auto']}
              tick={{ fill: 'var(--sp-muted)', fontSize: 11 }}
              stroke="var(--sp-border)"
            />
            <Tooltip
              contentStyle={{
                backgroundColor: 'var(--sp-elevated)',
                borderColor: 'var(--sp-border)',
                borderRadius: '0.75rem',
                color: 'var(--sp-text)',
                fontSize: '12px',
              }}
              formatter={(value: number, name: string) => [
                `${value.toString().replace('.', ',')} ${unitLabel}`,
                name === 'movingAverage7d' ? 'Moyenne mobile 7j' : title,
              ]}
            />
            <Line
              type="monotone"
              dataKey="value"
              name={title}
              stroke="var(--sp-accent)"
              strokeWidth={2.5}
              dot={{ r: 4, fill: 'var(--sp-accent)' }}
              activeDot={{ r: 6 }}
            />
            {showMovingAverage && (
              <Line
                type="monotone"
                dataKey="movingAverage7d"
                name="movingAverage7d"
                stroke="var(--sp-terracotta)"
                strokeWidth={2}
                strokeDasharray="4 4"
                dot={false}
                connectNulls
              />
            )}
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
