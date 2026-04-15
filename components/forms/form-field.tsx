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
    as = "input",
  } = props

  const inputId = `field-${name}`
  
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
          className="resize-none"
        />
      ) : as === "select" ? (
        <select
          id={inputId}
          name={name}
          required={required}
          defaultValue={defaultValue}
          autoComplete={autoComplete}
          className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
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
        />
      )}
      
      {description && (
        <p className="text-xs text-muted-foreground">{description}</p>
      )}
    </div>
  )
}
