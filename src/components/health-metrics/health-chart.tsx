'use client'

import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, ReferenceLine
} from 'recharts'
import { format, parseISO } from 'date-fns'
import type { HealthMetric } from '@/types/database'

interface HealthChartProps {
  metrics: HealthMetric[]
  metric: keyof HealthMetric
  label: string
  color?: string
  referenceValue?: number
}

interface TooltipPayload {
  value: number
  name: string
}

function CustomTooltip({ active, payload, label }: {
  active?: boolean
  payload?: TooltipPayload[]
  label?: string
}) {
  if (!active || !payload?.length) return null
  return (
    <div className="rounded-lg border border-border bg-surface px-3 py-2 shadow-xl">
      <p className="text-[10px] text-text-tertiary mb-1">{label}</p>
      {payload.map((p) => (
        <p key={p.name} className="text-sm font-semibold text-text-primary">{p.value}</p>
      ))}
    </div>
  )
}

export function HealthChart({ metrics, metric, label, color = '#6366f1', referenceValue }: HealthChartProps) {
  const data = metrics
    .filter(m => m[metric] !== null && m[metric] !== undefined)
    .map(m => ({
      date: format(parseISO(m.metric_date), 'MMM d'),
      value: Number(m[metric]),
    }))

  if (data.length === 0) {
    return (
      <div className="flex items-center justify-center h-[160px]">
        <p className="text-xs text-text-faint">No data yet — log your first entry</p>
      </div>
    )
  }

  const values = data.map(d => d.value)
  const min = Math.min(...values)
  const max = Math.max(...values)
  const padding = (max - min) * 0.15 || 1

  return (
    <div className="h-[180px] w-full">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={data} margin={{ top: 4, right: 4, bottom: 0, left: -20 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="var(--color-chart-grid)" vertical={false} />
          <XAxis
            dataKey="date"
            tick={{ fill: 'var(--color-chart-axis)', fontSize: 10 }}
            axisLine={false}
            tickLine={false}
            interval="preserveStartEnd"
          />
          <YAxis
            tick={{ fill: 'var(--color-chart-axis)', fontSize: 10 }}
            axisLine={false}
            tickLine={false}
            domain={[min - padding, max + padding]}
            tickCount={4}
          />
          <Tooltip content={<CustomTooltip />} />
          {referenceValue && (
            <ReferenceLine y={referenceValue} stroke="var(--color-border)" strokeDasharray="4 4" />
          )}
          <Line
            type="monotone"
            dataKey="value"
            stroke={color}
            strokeWidth={2}
            dot={{ fill: color, strokeWidth: 0, r: 3 }}
            activeDot={{ fill: color, r: 5, strokeWidth: 0 }}
            name={label}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  )
}
