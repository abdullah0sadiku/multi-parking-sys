import { cn } from "@/lib/utils"

interface ParkingLevelCardProps {
  level: string
  total: number
  occupied: number
  available: number
  reserved: number
}

export function ParkingLevelCard({
  level,
  total,
  occupied,
  available,
  reserved,
}: ParkingLevelCardProps) {
  const occupancyPercent = Math.round((occupied / total) * 100)

  return (
    <div className="rounded-xl border border-border bg-card p-5 shadow-sm">
      <div className="mb-4 flex items-center justify-between">
        <h3 className="text-lg font-semibold text-card-foreground">{level}</h3>
        <span className="text-sm font-medium text-muted-foreground">
          {occupancyPercent}% Full
        </span>
      </div>

      <div className="mb-4 h-2 overflow-hidden rounded-full bg-muted">
        <div
          className={cn(
            "h-full rounded-full transition-all",
            occupancyPercent >= 90
              ? "bg-destructive"
              : occupancyPercent >= 70
              ? "bg-warning"
              : "bg-success"
          )}
          style={{ width: `${occupancyPercent}%` }}
        />
      </div>

      <div className="grid grid-cols-3 gap-2 text-center">
        <div className="rounded-lg bg-success/10 p-2">
          <p className="text-lg font-bold text-success">{available}</p>
          <p className="text-xs text-muted-foreground">Available</p>
        </div>
        <div className="rounded-lg bg-destructive/10 p-2">
          <p className="text-lg font-bold text-destructive">{occupied}</p>
          <p className="text-xs text-muted-foreground">Occupied</p>
        </div>
        <div className="rounded-lg bg-warning/10 p-2">
          <p className="text-lg font-bold text-warning">{reserved}</p>
          <p className="text-xs text-muted-foreground">Reserved</p>
        </div>
      </div>
    </div>
  )
}
