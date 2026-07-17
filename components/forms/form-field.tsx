import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { cn } from "@/lib/utils"

interface BaseFormFieldProps {
  name: string
  label: string
  required?: boolean
  defaultValue?: string
  className?: string
  description?: string
  autoComplete?: string
  error?: string | null
}

interface InputFormFieldProps extends BaseFormFieldProps {
  as?: "input" | "textarea"
  type?: "text" | "email" | "tel" | "url" | "number" | "date" | "time"
  placeholder?: string
  min?: string | number
  max?: string | number
  rows?: number
  children?: never
}

interface SelectFormFieldProps extends BaseFormFieldProps {
  as: "select"
  children: React.ReactNode
  type?: never
  placeholder?: never
  min?: never
  max?: never
  rows?: never
}

type FormFieldProps = InputFormFieldProps | SelectFormFieldProps

export function FormField(props: FormFieldProps) {
  const {
    name,
    label,
    required = false,
    defaultValue,
    className,
    description,
    autoComplete,
    error,
    as = "input",
  } = props

  const inputId = `field-${name}`
  const describedBy = error ? `${inputId}-error` : undefined
  const invalidClass = error ? "border-destructive focus-visible:ring-destructive" : undefined

  return (
    <div className={cn("space-y-2", className)}>
      <Label htmlFor={inputId} className="text-sm font-medium">
        {label}
        {required && <span className="text-destructive ml-1">*</span>}
      </Label>

      {as === "textarea" ? (
        <Textarea
          id={inputId}
          name={name}
          placeholder={(props as InputFormFieldProps).placeholder}
          required={required}
          defaultValue={defaultValue}
          autoComplete={autoComplete}
          rows={(props as InputFormFieldProps).rows ?? 4}
          aria-invalid={Boolean(error)}
          aria-describedby={describedBy}
          className={cn("resize-none", invalidClass)}
        />
      ) : as === "select" ? (
        <select
          id={inputId}
          name={name}
          required={required}
          defaultValue={defaultValue ?? ""}
          autoComplete={autoComplete}
          aria-invalid={Boolean(error)}
          aria-describedby={describedBy}
          className={cn(
            "flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50",
            invalidClass
          )}
        >
          {(props as SelectFormFieldProps).children}
        </select>
      ) : (
        <Input
          id={inputId}
          name={name}
          type={(props as InputFormFieldProps).type ?? "text"}
          placeholder={(props as InputFormFieldProps).placeholder}
          required={required}
          defaultValue={defaultValue}
          autoComplete={autoComplete}
          min={(props as InputFormFieldProps).min}
          max={(props as InputFormFieldProps).max}
          aria-invalid={Boolean(error)}
          aria-describedby={describedBy}
          className={invalidClass}
        />
      )}

      {error ? (
        <p id={`${inputId}-error`} className="text-xs text-destructive">
          {error}
        </p>
      ) : description ? (
        <p className="text-xs text-muted-foreground">{description}</p>
      ) : null}
    </div>
  )
}
