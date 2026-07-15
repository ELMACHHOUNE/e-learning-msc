'use client'

import {
  PieChart, Pie, Cell, ResponsiveContainer,
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend,
} from 'recharts'

const COLORS = {
  primary: '#ffed00',
  success: '#8dc572',
  warning: '#f0ad4e',
  error: '#be6464',
  info: '#337ab7',
  ink: '#000000',
  mute: '#666666',
  charcoal: '#333333',
  hairline: '#f2f2f2',
  surfaceSoft: '#f7f7f7',
}

function CustomTooltip({ active, payload, label }: any) {
  if (!active || !payload?.length) return null
  return (
    <div className="bg-canvas border border-hairline-strong px-3 py-2 text-xs shadow-md">
      {label && <p className="text-charcoal font-600 mb-0.5">{label}</p>}
      {payload.map((entry: any, i: number) => (
        <p key={i} className="text-mute" style={{ color: entry.color }}>
          {entry.name}: {entry.value}
        </p>
      ))}
    </div>
  )
}

function ChartCard({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="bg-canvas border border-hairline p-xl">
      <h3 className="text-caption text-mute uppercase tracking-[0.1em] font-600 mb-lg">
        {title}
      </h3>
      {children}
    </div>
  )
}

export function UsersByRoleChart({ data }: { data: { name: string; value: number }[] }) {
  const colors = [COLORS.primary, COLORS.info, COLORS.success]
  return (
    <ChartCard title="Users by Role">
      <ResponsiveContainer width="100%" height={240}>
        <PieChart>
          <Pie data={data} dataKey="value" nameKey="name" cx="50%" cy="50%" innerRadius={50} outerRadius={90} paddingAngle={2}>
            {data.map((_, i) => (
              <Cell key={i} fill={colors[i % colors.length]} />
            ))}
          </Pie>
          <Tooltip content={<CustomTooltip />} />
          <Legend
            verticalAlign="bottom"
            iconType="circle"
            iconSize={8}
            formatter={(value: string) => (
              <span className="text-caption text-mute">{value}</span>
            )}
          />
        </PieChart>
      </ResponsiveContainer>
    </ChartCard>
  )
}

export function CoursesByCategoryChart({ data }: { data: { name: string; count: number }[] }) {
  if (data.length === 0) {
    return (
      <ChartCard title="Courses by Category">
        <div className="flex items-center justify-center h-[240px] text-caption text-mute">
          No categories yet
        </div>
      </ChartCard>
    )
  }
  return (
    <ChartCard title="Courses by Category">
      <ResponsiveContainer width="100%" height={240}>
        <BarChart data={data} margin={{ top: 0, right: 0, left: -16, bottom: 0 }}>
          <CartesianGrid stroke={COLORS.hairline} strokeDasharray="3 3" vertical={false} />
          <XAxis dataKey="name" tick={{ fontSize: 11, fill: COLORS.mute }} axisLine={{ stroke: COLORS.hairline }} tickLine={false} />
          <YAxis tick={{ fontSize: 11, fill: COLORS.mute }} axisLine={false} tickLine={false} allowDecimals={false} />
          <Tooltip content={<CustomTooltip />} cursor={{ fill: COLORS.surfaceSoft }} />
          <Bar dataKey="count" radius={[2, 2, 0, 0]} maxBarSize={40}>
            {data.map((_, i) => (
              <Cell key={i} fill={i === 0 ? COLORS.primary : COLORS.info} fillOpacity={1 - i * 0.15} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </ChartCard>
  )
}

export function CourseStatusChart({ data }: { data: { name: string; value: number }[] }) {
  const allInactive = data.every((d) => d.name === 'Inactive' || d.value === 0)
  if (allInactive) return null
  return (
    <ChartCard title="Course Status">
      <ResponsiveContainer width="100%" height={240}>
        <PieChart>
          <Pie data={data} dataKey="value" nameKey="name" cx="50%" cy="50%" innerRadius={50} outerRadius={90} paddingAngle={2}>
            <Cell fill={COLORS.success} />
            <Cell fill={COLORS.error} />
          </Pie>
          <Tooltip content={<CustomTooltip />} />
          <Legend
            verticalAlign="bottom"
            iconType="circle"
            iconSize={8}
            formatter={(value: string) => (
              <span className="text-caption text-mute">{value}</span>
            )}
          />
        </PieChart>
      </ResponsiveContainer>
    </ChartCard>
  )
}

export function GuildsByCourseChart({ data }: { data: { name: string; value: number }[] }) {
  if (data.length === 0) {
    return (
      <ChartCard title="Guilds by Course">
        <div className="flex items-center justify-center h-[240px] text-caption text-mute">
          No guilds yet
        </div>
      </ChartCard>
    )
  }
  return (
    <ChartCard title="Guilds by Course">
      <ResponsiveContainer width="100%" height={240}>
        <BarChart data={data} layout="vertical" margin={{ top: 0, right: 0, left: 0, bottom: 0 }}>
          <CartesianGrid stroke={COLORS.hairline} strokeDasharray="3 3" horizontal={false} />
          <XAxis type="number" tick={{ fontSize: 11, fill: COLORS.mute }} axisLine={{ stroke: COLORS.hairline }} tickLine={false} allowDecimals={false} />
          <YAxis type="category" dataKey="name" tick={{ fontSize: 11, fill: COLORS.mute }} axisLine={false} tickLine={false} width={120} />
          <Tooltip content={<CustomTooltip />} cursor={{ fill: COLORS.surfaceSoft }} />
          <Bar dataKey="value" radius={[0, 2, 2, 0]} maxBarSize={20}>
            {data.map((_, i) => (
              <Cell key={i} fill={i === 0 ? COLORS.warning : COLORS.charcoal} fillOpacity={1 - i * 0.12} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </ChartCard>
  )
}
