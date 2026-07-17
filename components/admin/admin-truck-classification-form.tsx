import {
  BROWSE_CUISINE_LABEL_WITH_OTHER,
  BROWSE_CUISINE_LABELS,
  VENDOR_SETUP_EDIT_OPTIONS,
  browseLabelsFromStoredCuisine,
  resolveVendorSetupForEdit,
} from "@/lib/trucks/truck-classification"

type Props = {
  adminKey: string
  truckId: string
  cuisine: string | null
  cuisineTypes: string[] | null
  vendorType: string | null
  updateAction: (formData: FormData) => Promise<void>
}

export function AdminTruckClassificationForm({
  adminKey,
  truckId,
  cuisine,
  cuisineTypes,
  vendorType,
  updateAction,
}: Props) {
  const { primary, additional } = browseLabelsFromStoredCuisine(cuisine, cuisineTypes)
  const setup = resolveVendorSetupForEdit(vendorType)

  return (
    <form action={updateAction} className="mt-4 space-y-3 rounded-md border border-border/70 bg-muted/20 p-3">
      <input type="hidden" name="adminKey" value={adminKey} />
      <input type="hidden" name="truckId" value={truckId} />
      <p className="text-xs font-medium text-foreground">Browse classification</p>
      <p className="text-[11px] text-muted-foreground leading-snug">
        Manual primary category and tags override automatic /trucks guessing. Vendor setup drives the
        public setup filter.
      </p>

      <div className="space-y-1">
        <label htmlFor={`primary-${truckId}`} className="text-xs text-muted-foreground">
          Primary cuisine / category
        </label>
        <select
          id={`primary-${truckId}`}
          name="primary_cuisine"
          defaultValue={primary}
          className="flex h-9 w-full rounded-md border border-border bg-background px-2 text-sm"
        >
          <option value="">Not set (use automatic matching)</option>
          {BROWSE_CUISINE_LABEL_WITH_OTHER.map((label) => (
            <option key={label} value={label}>
              {label}
            </option>
          ))}
        </select>
      </div>

      <fieldset className="space-y-1.5">
        <legend className="text-xs text-muted-foreground">Additional cuisine tags</legend>
        <div className="grid grid-cols-1 gap-1.5 sm:grid-cols-2">
          {BROWSE_CUISINE_LABELS.map((label) => (
            <label key={label} className="flex items-start gap-2 text-xs text-foreground cursor-pointer">
              <input
                type="checkbox"
                name="additional_cuisines"
                value={label}
                defaultChecked={additional.includes(label)}
                className="mt-0.5 size-3.5 shrink-0 rounded border-input"
              />
              <span>{label}</span>
            </label>
          ))}
        </div>
      </fieldset>

      <div className="space-y-1">
        <label htmlFor={`setup-${truckId}`} className="text-xs text-muted-foreground">
          Vendor setup
        </label>
        <select
          id={`setup-${truckId}`}
          name="vendor_type"
          defaultValue={setup}
          className="flex h-9 w-full rounded-md border border-border bg-background px-2 text-sm"
        >
          <option value="">Not set</option>
          {VENDOR_SETUP_EDIT_OPTIONS.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>
      </div>

      <button
        type="submit"
        className="inline-flex h-8 items-center justify-center rounded-md bg-primary px-3 text-xs font-medium text-primary-foreground hover:bg-primary/90"
      >
        Save classification
      </button>
    </form>
  )
}
