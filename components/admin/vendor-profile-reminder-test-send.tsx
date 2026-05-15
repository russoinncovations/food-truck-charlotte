"use client"

import { useFormStatus } from "react-dom"
import { Button } from "@/components/ui/button"
import { sendVendorProfileReminderTestToAdmin } from "@/app/admin/vendors/reminder-actions"

function SubmitInner({ disabled }: { disabled: boolean }) {
  const { pending } = useFormStatus()
  return (
    <Button type="submit" variant="secondary" size="sm" disabled={pending || disabled}>
      {pending ? "Sending…" : "Send test reminder to admin"}
    </Button>
  )
}

type Props = {
  adminKey: string
  inquiryEmailConfigured: boolean
}

/**
 * Test send: profile + live pin reminder copy only to INQUIRY_TO_EMAIL. No vendors.
 */
export function VendorProfileReminderTestSend({ adminKey, inquiryEmailConfigured }: Props) {
  return (
    <div className="space-y-2">
      <form action={sendVendorProfileReminderTestToAdmin} className="flex flex-col items-start gap-2">
        <input type="hidden" name="adminKey" value={adminKey} />
        <SubmitInner disabled={!inquiryEmailConfigured} />
      </form>
      {!inquiryEmailConfigured ? (
        <p className="text-xs text-amber-700 dark:text-amber-500/90 max-w-md">
          Set <code className="text-[10px]">INQUIRY_TO_EMAIL</code> in your environment. No vendors are contacted.
        </p>
      ) : (
        <p className="text-xs text-muted-foreground max-w-md">
          Sends the draft “profile + live pin” message to <code className="text-[10px]">INQUIRY_TO_EMAIL</code> only for
          review. Does not use the vendor list.
        </p>
      )}
    </div>
  )
}
