"use client"

import {
  Bar,
  BarChart,
  ResponsiveContainer,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  Cell,
} from "recharts"

interface SpotStats {
  available: number
  occupied: number
  reserved: number
  maintenance: number
}

interface UsageChartProps {
  spots?: SpotStats
  isLoading?: boolean
}

const BAR_COLORS = {
  Available:   "hsl(var(--chart-2))",
  Occupied:    "hsl(var(--destructive))",
  Reserved:    "hsl(var(--warning))",
  Maintenance: "hsl(var(--muted-foreground))",
}

export function UsageChart({ spots, isLoading }: UsageChartProps) {
  const data = spots
    ? [
        { name: "Available",   count: spots.available },
        { name: "Occupied",    count: spots.occupied },
        { name: "Reserved",    count: spots.reserved },
        { name: "Maintenance", count: spots.maintenance },
      ]
    : []

  return (
    <div className="rounded-xl border border-border bg-card p-6 shadow-sm">
      <div className="mb-6">
        <h3 className="text-lg font-semibold text-card-foreground">
          Spot Status Breakdown
        </h3>
        <p className="text-sm text-muted-foreground">
          Current occupancy across all parking levels
        </p>
      </div>

      {isLoading ? (
        <div className="h-[300px] flex items-center justify-center">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
        </div>
      ) : !spots || data.every((d) => d.count === 0) ? (
        <div className="h-[300px] flex items-center justify-center text-sm text-muted-foreground">
          No spot data available
        </div>
      ) : (
        <div className="h-[300px]">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={data} barSize={48}>
              <CartesianGrid
                strokeDasharray="3 3"
                stroke="hsl(var(--border))"
                vertical={false}
              />
              <XAxis
                dataKey="name"
                axisLine={false}
                tickLine={false}
                tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 12 }}
              />
              <YAxis
                axisLine={false}
                tickLine={false}
                tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 12 }}
                allowDecimals={false}
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: "hsl(var(--card))",
                  border: "1px solid hsl(var(--border))",
                  borderRadius: "8px",
                  boxShadow: "0 4px 6px -1px rgba(0,0,0,0.1)",
                }}
                labelStyle={{ color: "hsl(var(--card-foreground))" }}
                formatter={(value: number) => [value, "Spots"]}
              />
              <Bar dataKey="count" radius={[4, 4, 0, 0]}>
                {data.map((entry) => (
                  <Cell
                    key={entry.name}
                    fill={BAR_COLORS[entry.name as keyof typeof BAR_COLORS]}
                  />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}
    </div>
  )
}
