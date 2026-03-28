"use client";

import { useActionState } from "react";
import { addTruckFromInquiry, type AddTruckFromInquiryState } from "@/app/actions/admin-trucks";

const initial: AddTruckFromInquiryState = {};

export function AddToDirectoryForm({ inquiryId }: { inquiryId: string }) {
  const [state, formAction, pending] = useActionState(addTruckFromInquiry, initial);

  return (
    <form action={formAction} className="space-y-2">
      <input type="hidden" name="inquiryId" value={inquiryId} />
      <button
        type="submit"
        disabled={pending}
        className="rounded border border-neutral-400 bg-neutral-100 px-3 py-1.5 text-sm hover:bg-neutral-200 disabled:opacity-50"
      >
        {pending ? "Working…" : "Add to Directory"}
      </button>
      {state?.error ? <p className="text-xs text-red-600">{state.error}</p> : null}
      {state?.ok ? <p className="text-xs text-green-700">Added and marked processed.</p> : null}
    </form>
  );
}
