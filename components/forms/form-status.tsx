"use client"

import { useFormStatus } from "react-dom"
import { AlertCircle, CheckCircle2 } from "lucide-react"
import { cn } from "@/lib/utils"

interface FormStatusProps {
  state?: {
    success?: boolean
    error?: string
    message?: string
  }
  className?: string
}

export function FormStatus({ state, className }: FormStatusProps) {
  const { pending } = useFormStatus()
  
  // Don't show anything while pending or if no state
  if (pending || !state) return null
  
  // Show error message
  if (state.error) {
    return (
      <div className={cn(
        "flex items-center gap-2 p-3 rounded-lg bg-destructive/10 text-destructive text-sm",
        className
      )}>
        <AlertCircle className="h-4 w-4 shrink-0" />
        <span>{state.error}</span>
      </div>
    )
  }
  
  // Show success message
  if (state.success && state.message) {
    return (
      <div className={cn(
        "flex items-center gap-2 p-3 rounded-lg bg-green-500/10 text-green-600 text-sm",
        className
      )}>
        <CheckCircle2 className="h-4 w-4 shrink-0" />
        <span>{state.message}</span>
      </div>
    )
  }
  
  return null
}
