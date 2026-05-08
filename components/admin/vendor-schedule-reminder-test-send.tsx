"use client"

import { useFormStatus } from "react-dom"
import { Button } from "@/components/ui/button"
import { sendVendorScheduleReminderTest } from "@/app/admin/vendors/reminder-actions"

function TestSubmitInner({ disabled }: { disabled: boolean }) {
  const { pending } = useFormStatus()
  return (
    <Button type="submit" variant="outline" size="sm" disabled={pending || disabled}>
      {pending ? "Sending test…" : "Send test reminder to Nicole"}
    </Button>
  )
}

type Props = {
  adminKey: string
  /** True when VENDOR_REMINDER_TEST_EMAIL is set (still validated server-side). */
  testEmailConfigured: boolean
}

export function VendorScheduleReminderTestSend({ adminKey, testEmailConfigured }: Props) {
  return (
    <div className="space-y-2">
      <form action={sendVendorScheduleReminderTest} className="flex flex-col items-start gap-2">
        <input type="hidden" name="adminKey" value={adminKey} />
        <TestSubmitInner disabled={!testEmailConfigured} />
      </form>
      {!testEmailConfigured ? (
        <p className="text-xs text-amber-700 dark:text-amber-500/90 max-w-md">
          Set <code className="text-[10px]">VENDOR_REMINDER_TEST_EMAIL</code> in <code className="text-[10px]">.env.local</code>{" "}
          (your inbox). No vendors are contacted.
        </p>
      ) : (
        <p className="text-xs text-muted-foreground max-w-md">
          Uses the same template and dashboard link as the bulk send. Recipient is only the address in{" "}
          <code className="text-[10px]">VENDOR_REMINDER_TEST_EMAIL</code>.
        </p>
      )}
    </div>
  )
}
