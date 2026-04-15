"use client"

import { useFormStatus } from "react-dom"
import { Button, type ButtonProps } from "@/components/ui/button"
import { Spinner } from "@/components/ui/spinner"
import { cn } from "@/lib/utils"

interface SubmitButtonProps extends Omit<ButtonProps, "type"> {
  children: React.ReactNode
  loadingText?: string
  isPending?: boolean
}

export function SubmitButton({
  children,
  loadingText = "Submitting...",
  isPending = false,
  disabled,
  className,
  ...props
}: SubmitButtonProps) {
  const { pending } = useFormStatus()
  const isLoading = pending || isPending
  
  return (
    <Button
      type="submit"
      disabled={isLoading || disabled}
      className={cn("gap-2", className)}
      {...props}
    >
      {isLoading && <Spinner className="h-4 w-4" />}
      {isLoading ? loadingText : children}
    </Button>
  )
}
