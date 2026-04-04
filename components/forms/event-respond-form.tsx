"use client";

import { useActionState } from "react";
import { respondToEventInquiry, type TruckRespondState } from "@/app/actions/truck-availability";

const btnClass =
  "inline-flex justify-center rounded-full bg-[#D97A2B] px-5 py-2.5 text-sm font-semibold text-white transition-opacity hover:bg-[#c76e25] disabled:cursor-not-allowed disabled:opacity-60";

const sentClass =
  "inline-flex cursor-default justify-center rounded-full border border-[#1E1E1E]/20 bg-[#f0ebe4] px-5 py-2.5 text-sm font-medium text-[#1E1E1E]/80";

type Props = {
  inquiryId: string;
  alreadyResponded: boolean;
};

const initial: TruckRespondState = {};

export function EventRespondForm({ inquiryId, alreadyResponded }: Props) {
  const [state, action, pending] = useActionState(respondToEventInquiry, initial);

  const done = alreadyResponded || state.success === true || state.already === true;

  if (done) {
    return (
      <span className={sentClass} aria-live="polite">
        Response Sent
      </span>
    );
  }

  return (
    <form action={action} className="flex flex-col gap-2">
      <input type="hidden" name="inquiryId" value={inquiryId} />
      <button type="submit" disabled={pending} className={btnClass}>
        {pending ? "Sending…" : "I'm Available"}
      </button>
      {state.error ? (
        <p className="text-[13px] text-red-700" role="alert">
          {state.error}
        </p>
      ) : null}
    </form>
  );
}
