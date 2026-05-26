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
import { sendVendorProfileRemindersBulk } from "@/app/admin/vendors/reminder-actions"

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
  /** Unique inboxes (after dedupe). */
  recipientCount: number
  /** Truck rows eligible before dedupe (test names & invalid emails excluded). */
  eligibleTruckCount: number
}

export function VendorProfileReminderBulkSend({ adminKey, recipientCount, eligibleTruckCount }: Props) {
  const disabled = recipientCount === 0

  return (
    <div className="flex flex-col items-stretch gap-2">
      <p className="text-xs text-muted-foreground max-w-md">
        <span className="font-medium text-foreground tabular-nums">{recipientCount}</span> unique{" "}
        {recipientCount === 1 ? "inbox" : "inboxes"} ·{" "}
        <span className="font-medium text-foreground tabular-nums">{eligibleTruckCount}</span> eligible{" "}
        {eligibleTruckCount === 1 ? "listing" : "listings"} (names containing &quot;test&quot; excluded; blank emails
        excluded; one email per address).
      </p>
      <AlertDialog>
        <AlertDialogTrigger asChild>
          <Button type="button" variant="default" size="sm" disabled={disabled} className="w-full sm:w-auto">
            Send reminder to all vendors
          </Button>
        </AlertDialogTrigger>
        <AlertDialogContent>
          <form action={sendVendorProfileRemindersBulk}>
            <input type="hidden" name="adminKey" value={adminKey} />
            <AlertDialogHeader>
              <AlertDialogTitle>Send vendor shortcut + live map reminder?</AlertDialogTitle>
              <AlertDialogDescription asChild>
                <div className="space-y-2 text-muted-foreground text-sm">
                  <p>
                    This will email the approved &quot;Vendor Shortcut + Live Map Reminder&quot; message to{" "}
                    <strong className="text-foreground">{recipientCount}</strong> unique{" "}
                    {recipientCount === 1 ? "address" : "addresses"}.
                  </p>
                  <p>
                    Eligible listings counted: <strong className="text-foreground">{eligibleTruckCount}</strong>.
                    Skipped rows (duplicate inbox or filtered) are reported after the run.
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
