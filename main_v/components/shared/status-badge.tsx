import { cn } from "@/lib/utils"

type StatusVariant = "success" | "warning" | "error" | "info" | "default"

interface StatusBadgeProps {
  status: string
  variant?: StatusVariant
}

const variantStyles: Record<StatusVariant, string> = {
  success: "bg-success/15 text-success border-success/30",
  warning: "bg-warning/15 text-warning border-warning/30",
  error: "bg-destructive/15 text-destructive border-destructive/30",
  info: "bg-primary/15 text-primary border-primary/30",
  default: "bg-muted text-muted-foreground border-border",
}

export function StatusBadge({ status, variant = "default" }: StatusBadgeProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-medium",
        variantStyles[variant]
      )}
    >
      {status}
    </span>
  )
}

// Helper function to determine variant from common status strings
export function getStatusVariant(status: string): StatusVariant {
  const normalizedStatus = status.toLowerCase()
  
  if (["active", "completed", "paid", "online", "available", "success"].includes(normalizedStatus)) {
    return "success"
  }
  if (["pending", "reserved", "warning", "processing"].includes(normalizedStatus)) {
    return "warning"
  }
  if (["expired", "failed", "offline", "error", "cancelled", "inactive"].includes(normalizedStatus)) {
    return "error"
  }
  if (["new", "info"].includes(normalizedStatus)) {
    return "info"
  }
  return "default"
}
