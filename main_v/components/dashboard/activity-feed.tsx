import { cn } from "@/lib/utils"
import { Car, CreditCard, AlertTriangle, Timer } from "lucide-react"

type ActivityType = "session" | "payment" | "incident" | "entry"

interface Activity {
  id: string
  type: ActivityType
  title: string
  description: string
  time: string
}

const activityIcons: Record<ActivityType, typeof Car> = {
  session: Timer,
  payment: CreditCard,
  incident: AlertTriangle,
  entry: Car,
}

const activityColors: Record<ActivityType, string> = {
  session: "bg-primary/10 text-primary",
  payment: "bg-success/10 text-success",
  incident: "bg-destructive/10 text-destructive",
  entry: "bg-warning/10 text-warning",
}

interface ActivityFeedProps {
  activities: Activity[]
}

export function ActivityFeed({ activities }: ActivityFeedProps) {
  return (
    <div className="rounded-xl border border-border bg-card shadow-sm">
      <div className="border-b border-border p-4">
        <h3 className="text-lg font-semibold text-card-foreground">Recent Activity</h3>
      </div>
      <div className="divide-y divide-border">
        {activities.map((activity) => {
          const Icon = activityIcons[activity.type]
          const colorClass = activityColors[activity.type]

          return (
            <div
              key={activity.id}
              className="flex items-start gap-4 p-4 transition-colors hover:bg-muted/50"
            >
              <div className={cn("rounded-lg p-2", colorClass)}>
                <Icon className="h-4 w-4" />
              </div>
              <div className="flex-1 space-y-1">
                <p className="text-sm font-medium text-card-foreground">
                  {activity.title}
                </p>
                <p className="text-sm text-muted-foreground">
                  {activity.description}
                </p>
              </div>
              <span className="text-xs text-muted-foreground whitespace-nowrap">
                {activity.time}
              </span>
            </div>
          )
        })}
      </div>
    </div>
  )
}
