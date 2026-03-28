"use client";

import { useActionState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { addTruckFromInquiry, type AddTruckFromInquiryState } from "@/app/actions/admin-trucks";

const initial: AddTruckFromInquiryState = {};

export function AddToDirectoryForm({ inquiryId }: { inquiryId: string }) {
  const router = useRouter();
  const [state, formAction, pending] = useActionState(addTruckFromInquiry, initial);

  useEffect(() => {
    if (!state?.ok) return;
    const t = setTimeout(() => router.refresh(), 2000);
    return () => clearTimeout(t);
  }, [state?.ok, router]);

  return (
    <form action={formAction} className="space-y-2">
      <input type="hidden" name="inquiryId" value={inquiryId} />
      <button
        type="submit"
        disabled={pending || state?.ok}
        className="rounded border border-neutral-400 bg-neutral-100 px-3 py-1.5 text-sm hover:bg-neutral-200 disabled:opacity-50"
      >
        {pending ? "Working…" : state?.ok ? "Added" : "Add to Directory"}
      </button>
      {state?.error ? <p className="text-xs text-red-600">{state.error}</p> : null}
      {state?.ok ? (
        <p className="rounded border border-green-200 bg-green-50 px-2 py-1.5 text-xs text-green-800">
          Success: added or updated in directory and inquiry marked processed.
        </p>
      ) : null}
    </form>
  );
}
