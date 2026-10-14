'use client'

import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Line,
  LineChart,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'
import type { AnalyticsTimeseriesPoint } from '@/types/analytics'

const COLORS = {
  primary: '#ffed00',
  success: '#8dc572',
  warning: '#f0ad4e',
  error: '#be6464',
  info: '#337ab7',
  mute: '#666666',
  hairline: '#f2f2f2',
  surfaceSoft: '#f7f7f7',
}

const PIE_COLORS = [COLORS.primary, COLORS.info, COLORS.success, COLORS.warning, COLORS.error, COLORS.mute]

function ChartTooltip({
  active,
  payload,
  label,
}: {
  active?: boolean
  payload?: { name?: string; value?: number | string; color?: string }[]
  label?: string | number
}) {
  if (!active || !payload || payload.length === 0) return null
  return (
    <div className="bg-canvas border border-hairline shadow-sm px-md py-sm">
      {label !== undefined && <p className="text-caption text-mute">{label}</p>}
      {payload.map((entry, index) => (
        <p key={index} className="text-body-sm text-ink">
          <span className="font-600">{entry.name}</span>: {Number(entry.value ?? 0).toLocaleString()}
        </p>
      ))}
    </div>
  )
}

function EmptyChart({ message }: { message: string }) {
  return (
    <div className="flex items-center justify-center h-[240px] text-caption text-mute">{message}</div>
  )
}

const SERIES = [
  { key: 'pageViews' as const, label: 'Page views', color: COLORS.info },
  { key: 'sessions' as const, label: 'Sessions', color: COLORS.warning },
  { key: 'visitors' as const, label: 'Unique visitors', color: COLORS.success },
]

interface TrafficChartProps {
  data: AnalyticsTimeseriesPoint[]
  hidden: Record<string, boolean>
  onToggle: (key: string) => void
}

export function TrafficChart({ data, hidden, onToggle }: TrafficChartProps) {
  if (data.length === 0) return <EmptyChart message="No traffic recorded in this period" />

  return (
    <div>
      <div className="flex flex-wrap items-center gap-md mb-lg">
        {SERIES.map((series) => (
          <button
            key={series.key}
            onClick={() => onToggle(series.key)}
            aria-pressed={!hidden[series.key]}
            className="flex items-center gap-2 bg-transparent border-none cursor-pointer p-0"
          >
            <span
              className="w-3 h-3 shrink-0"
              style={{ backgroundColor: hidden[series.key] ? 'transparent' : series.color, opacity: hidden[series.key] ? 0.3 : 1 }}
            />
            <span className={`text-body-sm ${hidden[series.key] ? 'text-mute line-through' : 'text-ink'}`}>
              {series.label}
            </span>
          </button>
        ))}
      </div>

      <ResponsiveContainer width="100%" height={280}>
        <LineChart data={data} margin={{ top: 0, right: 0, left: -16, bottom: 0 }}>
          <CartesianGrid stroke={COLORS.hairline} strokeDasharray="3 3" vertical={false} />
          <XAxis
            dataKey="bucket"
            tick={{ fontSize: 11, fill: COLORS.mute }}
            axisLine={{ stroke: COLORS.hairline }}
            tickLine={false}
            minTickGap={24}
          />
          <YAxis
            tick={{ fontSize: 11, fill: COLORS.mute }}
            axisLine={false}
            tickLine={false}
            allowDecimals={false}
          />
          <Tooltip content={<ChartTooltip />} />
          {SERIES.filter((series) => !hidden[series.key]).map((series) => (
            <Line
              key={series.key}
              type="monotone"
              dataKey={series.key}
              name={series.label}
              stroke={series.color}
              strokeWidth={2}
              dot={false}
              isAnimationActive={false}
              activeDot={{ r: 3 }}
            />
          ))}
        </LineChart>
      </ResponsiveContainer>
    </div>
  )
}

export interface RankRow {
  name: string
  value: number
}

/** Drops malformed rows so a report shape change degrades to a panel, never a crash. */
function normalizeRank(data: RankRow[] | undefined | null): RankRow[] {
  if (!Array.isArray(data)) return []
  return data
    .filter((row) => row && typeof row.name === 'string' && typeof row.value === 'number' && Number.isFinite(row.value))
    .map((row) => ({ name: row.name, value: row.value }))
}

export function RankBarChart({ data, emptyLabel = 'No data yet' }: { data: RankRow[]; emptyLabel?: string }) {
  const rows = normalizeRank(data)
  if (rows.length === 0) return <EmptyChart message={emptyLabel} />

  return (
    <ResponsiveContainer width="100%" height={Math.max(200, rows.length * 36)}>
      <BarChart data={rows} layout="vertical" margin={{ top: 0, right: 16, left: 0, bottom: 0 }}>
        <CartesianGrid stroke={COLORS.hairline} strokeDasharray="3 3" horizontal={false} />
        <XAxis
          type="number"
          tick={{ fontSize: 11, fill: COLORS.mute }}
          axisLine={{ stroke: COLORS.hairline }}
          tickLine={false}
          allowDecimals={false}
        />
        <YAxis
          type="category"
          dataKey="name"
          width={130}
          tick={{ fontSize: 11, fill: COLORS.mute }}
          axisLine={false}
          tickLine={false}
          tickFormatter={(value: string) => (value.length > 20 ? `${value.slice(0, 20)}…` : value)}
        />
        <Tooltip content={<ChartTooltip />} cursor={{ fill: COLORS.surfaceSoft }} />
        <Bar dataKey="value" radius={[0, 2, 2, 0]} maxBarSize={18}>
          isAnimationActive={false}
          {rows.map((entry, index) => (
            <Cell key={`${entry.name}-${index}`} fill={COLORS.info} fillOpacity={1 - index * 0.1} />
          ))}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  )
}

export function DistributionPieChart({ data, emptyLabel = 'No data yet' }: { data: RankRow[]; emptyLabel?: string }) {
  const rows = normalizeRank(data)
  if (rows.length === 0) return <EmptyChart message={emptyLabel} />

  return (
    <ResponsiveContainer width="100%" height={240}>
      <PieChart>
        <Pie data={rows} dataKey="value" nameKey="name" innerRadius={50} outerRadius={90} paddingAngle={2}>
          isAnimationActive={false}
          {rows.map((entry, index) => (
            <Cell key={`${entry.name}-${index}`} fill={PIE_COLORS[index % PIE_COLORS.length]} />
          ))}
        </Pie>
        <Tooltip content={<ChartTooltip />} />
      </PieChart>
    </ResponsiveContainer>
  )
}

export function LegendList({ data, layout = 'stacked' }: { data: RankRow[]; layout?: 'stacked' | 'inline' }) {
  const rows = normalizeRank(data)
  if (rows.length === 0) return null
  const total = rows.reduce((sum, row) => sum + row.value, 0) || 1

  return (
    <ul className={layout === 'inline' ? 'flex-1 space-y-2 self-center' : 'mt-md space-y-2'}>
      {rows.map((row, index) => (
        <li key={`${row.name}-${index}`} className="flex items-center gap-sm text-body-sm">
          <span
            className="w-3 h-3 shrink-0"
            style={{ backgroundColor: PIE_COLORS[index % PIE_COLORS.length] }}
          />
          <span className="text-charcoal truncate flex-1">{row.name}</span>
          <span className="text-ink font-600">{row.value.toLocaleString()}</span>
          <span className="text-mute w-12 text-right">{Math.round((row.value / total) * 100)}%</span>
        </li>
      ))}
    </ul>
  )
}