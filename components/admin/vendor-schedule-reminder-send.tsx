"use client"

import { useFormStatus } from "react-dom"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"
import { Button } from "@/components/ui/button"
import { sendVendorScheduleReminders } from "@/app/admin/vendors/reminder-actions"

function SubmitInner() {
  const { pending } = useFormStatus()
  return (
    <AlertDialogAction type="submit" disabled={pending}>
      {pending ? "Sending…" : "Send now"}
    </AlertDialogAction>
  )
}

type Props = {
  adminKey: string
  /** Unique inboxes that will receive an email (deduped). */
  recipientCount: number
}

export function VendorScheduleReminderSend({ adminKey, recipientCount }: Props) {
  const disabled = recipientCount === 0

  return (
    <div className="flex flex-col items-stretch sm:items-end gap-2">
      <p className="text-xs text-muted-foreground text-left sm:text-right max-w-xs sm:ml-auto">
        This sends to all eligible active vendor inboxes.
      </p>
      <AlertDialog>
        <AlertDialogTrigger asChild>
          <Button type="button" variant="secondary" size="sm" disabled={disabled} className="w-full sm:w-auto">
            Send schedule &amp; map reminders
          </Button>
        </AlertDialogTrigger>
        <AlertDialogContent>
        <form action={sendVendorScheduleReminders}>
          <input type="hidden" name="adminKey" value={adminKey} />
          <AlertDialogHeader>
            <AlertDialogTitle>Send reminder emails?</AlertDialogTitle>
            <AlertDialogDescription asChild>
              <div className="space-y-2 text-muted-foreground text-sm">
                <p>
                  You are about to send schedule reminders to{" "}
                  <strong className="text-foreground">{recipientCount}</strong>{" "}
                  {recipientCount === 1 ? "vendor" : "vendors"}.
                </p>
                <p>
                  This sends one email per unique address (active directory listings only). It does not run on a
                  schedule.
                </p>
              </div>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel type="button">Cancel</AlertDialogCancel>
            <SubmitInner />
          </AlertDialogFooter>
        </form>
      </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
