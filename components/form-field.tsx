type FormFieldProps = {
  label: string;
  name: string;
  type?: "text" | "email" | "tel" | "date" | "number";
  placeholder?: string;
  required?: boolean;
  as?: "input" | "textarea";
  helpText?: string;
  maxLength?: number;
};

export function FormField({
  label,
  name,
  type = "text",
  placeholder,
  required = false,
  as = "input",
  helpText,
  maxLength,
}: FormFieldProps) {
  const classes =
    "mt-2 w-full rounded-xl border border-[#1E1E1E]/15 bg-[#fffdf9] px-4 py-3 text-[15px] text-[#1E1E1E] outline-none ring-[#D97A2B] focus:ring-2";

  return (
    <label className="block text-[15px] font-medium text-[#1E1E1E]">
      {label}
      {as === "textarea" ? (
        <textarea
          name={name}
          placeholder={placeholder}
          required={required}
          maxLength={maxLength}
          className={`${classes} min-h-28`}
        />
      ) : (
        <input
          name={name}
          type={type}
          placeholder={placeholder}
          required={required}
          maxLength={maxLength}
          className={classes}
        />
      )}
      {helpText ? <span className="mt-1 block text-[13px] font-normal leading-5 text-[#1E1E1E]/60">{helpText}</span> : null}
    </label>
  );
}
