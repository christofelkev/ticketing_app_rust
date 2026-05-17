import React from 'react'
import { PieChart, Pie, Cell, Tooltip, Legend, ResponsiveContainer } from 'recharts'
import { CATEGORY_CONFIG, CATEGORY_CHART_COLORS } from '../../lib/constants'
import type { Category } from '../../types'

interface CategoryChartProps {
  data: { category: Category; count: number }[]
}

export const CategoryChart: React.FC<CategoryChartProps> = ({ data }) => {
  const chartData = data.map(item => ({
    name: CATEGORY_CONFIG[item.category].label,
    value: item.count,
    icon: CATEGORY_CONFIG[item.category].icon,
  }))

  const total = chartData.reduce((sum, d) => sum + d.value, 0)

  if (total === 0) {
    return (
      <div className="card p-5 h-64 flex items-center justify-center">
        <p className="text-sm text-text-muted">Belum ada data ticket</p>
      </div>
    )
  }

  return (
    <div className="card p-5">
      <h3 className="text-sm font-semibold text-text-main mb-4">Ticket per Kategori</h3>
      <ResponsiveContainer width="100%" height={220}>
        <PieChart>
          <Pie
            data={chartData}
            cx="50%"
            cy="50%"
            innerRadius={60}
            outerRadius={90}
            paddingAngle={3}
            dataKey="value"
          >
            {chartData.map((_, index) => (
              <Cell key={`cell-${index}`} fill={CATEGORY_CHART_COLORS[index % CATEGORY_CHART_COLORS.length]} />
            ))}
          </Pie>
          <Tooltip
            formatter={(value: number, name: string) => [value, name]}
            contentStyle={{ borderRadius: '8px', border: '1px solid #E2E8F0', fontSize: '12px' }}
          />
          <Legend
            formatter={(value) => <span className="text-xs text-text-sub">{value}</span>}
            wrapperStyle={{ fontSize: '12px' }}
          />
        </PieChart>
      </ResponsiveContainer>
    </div>
  )
}
