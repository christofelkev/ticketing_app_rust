import React from 'react'
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Area, AreaChart
} from 'recharts'

interface TrendChartProps {
  data: { week: string; count: number }[]
}

export const TrendChart: React.FC<TrendChartProps> = ({ data }) => {
  return (
    <div className="card p-5">
      <h3 className="text-sm font-semibold text-text-main mb-4">Trend Ticket Masuk (4 Minggu)</h3>
      <ResponsiveContainer width="100%" height={220}>
        <AreaChart data={data} margin={{ top: 5, right: 10, left: -20, bottom: 0 }}>
          <defs>
            <linearGradient id="trendGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#2563EB" stopOpacity={0.15} />
              <stop offset="95%" stopColor="#2563EB" stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" />
          <XAxis
            dataKey="week"
            tick={{ fontSize: 11, fill: '#94A3B8' }}
            axisLine={false}
            tickLine={false}
          />
          <YAxis
            tick={{ fontSize: 11, fill: '#94A3B8' }}
            axisLine={false}
            tickLine={false}
            allowDecimals={false}
          />
          <Tooltip
            contentStyle={{ borderRadius: '8px', border: '1px solid #E2E8F0', fontSize: '12px' }}
            formatter={(value: number) => [`${value} ticket`, 'Masuk']}
          />
          <Area
            type="monotone"
            dataKey="count"
            stroke="#2563EB"
            strokeWidth={2}
            fill="url(#trendGradient)"
            dot={{ fill: '#2563EB', r: 4 }}
            activeDot={{ r: 6, fill: '#1D4ED8' }}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  )
}
