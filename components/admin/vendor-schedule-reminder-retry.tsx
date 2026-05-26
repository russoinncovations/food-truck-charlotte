"use client"

import { useFormStatus } from "react-dom"
import { useMemo } from "react"
import { Button } from "@/components/ui/button"
import { sendVendorScheduleRemindersRetry } from "@/app/admin/vendors/reminder-actions"

export type ScheduleReminderFailureRow = {
  email: string
  message: string
  truckId?: string
  truckName?: string
}

function SubmitInner({ count }: { count: number }) {
  const { pending } = useFormStatus()
  return (
    <Button type="submit" variant="outline" size="sm" disabled={pending || count === 0}>
      {pending ? "Retrying failed…" : `Retry failed only (${count})`}
    </Button>
  )
}

type Props = {
  adminKey: string
  failures: ScheduleReminderFailureRow[]
}

/**
 * Sends only rows that failed in the prior bulk run (same template). Requires truckId from the failure report JSON.
 */
export function VendorScheduleReminderRetryFailures({ adminKey, failures }: Props) {
  const recipients = useMemo(() => {
    const out: { email: string; truckId: string; truckName: string }[] = []
    const seen = new Set<string>()
    for (const f of failures) {
      const id = f.truckId?.trim()
      const email = f.email.trim().toLowerCase()
      if (!id || !email || seen.has(email)) continue
      seen.add(email)
      out.push({
        email: f.email.trim(),
        truckId: id,
        truckName: (f.truckName ?? "").trim() || "there",
      })
    }
    return out
  }, [failures])

  if (recipients.length === 0) return null

  const payloadJson = JSON.stringify(recipients)

  return (
    <div className="rounded-md border border-amber-500/35 bg-amber-500/5 px-3 py-2 mt-3 space-y-2">
      <p className="text-xs text-muted-foreground">
        Retry uses the failed rows from this run only (won&apos;t touch vendors already sent). Sends are paced the same as
        the main bulk send.
      </p>
      <form action={sendVendorScheduleRemindersRetry} className="flex flex-wrap items-center gap-2">
        <input type="hidden" name="adminKey" value={adminKey} />
        <input type="hidden" name="retryRecipients" value={payloadJson} />
        <SubmitInner count={recipients.length} />
      </form>
    </div>
  )
}
