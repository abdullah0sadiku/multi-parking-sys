"use client"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { ArrowLeft } from "lucide-react"
import Link from "next/link"

interface FormCardProps {
  title: string
  description?: string
  backHref?: string
  onSave?: () => void
  onCancel?: () => void
  children: React.ReactNode
  isLoading?: boolean
}

export function FormCard({
  title,
  description,
  backHref,
  onSave,
  onCancel,
  children,
  isLoading,
}: FormCardProps) {
  return (
    <div className="space-y-4">
      {backHref && (
        <Link
          href={backHref}
          className="inline-flex items-center text-sm text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back
        </Link>
      )}
      
      <Card className="max-w-2xl">
        <CardHeader>
          <CardTitle>{title}</CardTitle>
          {description && <CardDescription>{description}</CardDescription>}
        </CardHeader>
        <CardContent className="space-y-6">{children}</CardContent>
        <CardFooter className="flex justify-end gap-3 border-t pt-6">
          {onCancel && (
            <Button variant="outline" onClick={onCancel} disabled={isLoading}>
              Cancel
            </Button>
          )}
          {onSave && (
            <Button onClick={onSave} disabled={isLoading}>
              {isLoading ? "Saving..." : "Save Changes"}
            </Button>
          )}
        </CardFooter>
      </Card>
    </div>
  )
}
