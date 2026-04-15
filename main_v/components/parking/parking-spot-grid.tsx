"use client"

import { cn } from "@/lib/utils"
import { Car, Wrench } from "lucide-react"
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip"

type SpotStatus = "available" | "occupied" | "reserved" | "maintenance"

interface ParkingSpot {
  id: string
  number: string
  status: SpotStatus
  vehicle?: {
    plate: string
    type: string
    entryTime?: string
  }
}

interface ParkingSpotGridProps {
  spots: ParkingSpot[]
  columns?: number
}

const statusColors: Record<SpotStatus, string> = {
  available:   "bg-success/20 border-success/50 hover:bg-success/30",
  occupied:    "bg-destructive/20 border-destructive/50",
  reserved:    "bg-warning/20 border-warning/50",
  maintenance: "bg-muted border-muted-foreground/30",
}

const statusIconColor: Record<SpotStatus, string> = {
  available:   "text-success",
  occupied:    "text-destructive",
  reserved:    "text-warning",
  maintenance: "text-muted-foreground",
}

export function ParkingSpotGrid({ spots, columns = 10 }: ParkingSpotGridProps) {
  return (
    <TooltipProvider>
      <div
        className="grid gap-2"
        style={{ gridTemplateColumns: `repeat(${columns}, minmax(0, 1fr))` }}
      >
        {spots.map((spot) => (
          <Tooltip key={spot.id}>
            <TooltipTrigger asChild>
              <button
                className={cn(
                  "relative flex h-14 w-full flex-col items-center justify-center rounded-lg border-2 transition-all",
                  statusColors[spot.status]
                )}
              >
                {spot.status === "occupied" && (
                  <Car className={cn("h-4 w-4", statusIconColor.occupied)} />
                )}
                {spot.status === "maintenance" && (
                  <Wrench className={cn("h-4 w-4", statusIconColor.maintenance)} />
                )}
                <span className="text-xs font-medium text-foreground/70 leading-tight">
                  {spot.number}
                </span>
              </button>
            </TooltipTrigger>
            <TooltipContent side="top" className="max-w-xs">
              <div className="space-y-1">
                <p className="font-medium">Spot {spot.number}</p>
                <p className="text-xs capitalize">
                  Status:{" "}
                  <span className={statusIconColor[spot.status]}>{spot.status}</span>
                </p>
                {spot.vehicle && (
                  <>
                    <p className="text-xs">Plate: {spot.vehicle.plate}</p>
                    <p className="text-xs">Type: {spot.vehicle.type}</p>
                    {spot.vehicle.entryTime && (
                      <p className="text-xs">Entry: {spot.vehicle.entryTime}</p>
                    )}
                  </>
                )}
              </div>
            </TooltipContent>
          </Tooltip>
        ))}
      </div>
    </TooltipProvider>
  )
}
