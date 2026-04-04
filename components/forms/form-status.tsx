import type { InquiryFormState } from "@/app/actions/inquiry";

export type FormStatusState = Pick<InquiryFormState, "error" | "success">;

type FormStatusProps = {
  state: FormStatusState | undefined;
  successTitle?: string;
  successDescription?: string;
};

export function FormStatus({
  state,
  successTitle = "Thank you — your message was sent.",
  successDescription = "We'll follow up using the contact information you provided.",
}: FormStatusProps) {
  if (!state?.error && !state?.success) {
    return null;
  }

  if (state.success) {
    return (
      <div
        className="rounded-xl border border-[#1E1E1E]/15 bg-[#f0ebe4] px-4 py-3 text-[15px] leading-7 text-[#1E1E1E]/90"
        role="status"
        aria-live="polite"
      >
        <p className="font-medium text-[#1E1E1E]">{successTitle}</p>
        <p className="mt-1 text-[#1E1E1E]/75">{successDescription}</p>
      </div>
    );
  }

  return (
    <div
      className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-[15px] leading-7 text-red-950"
      role="alert"
      aria-live="assertive"
    >
      <p className="font-medium">{state.error}</p>
    </div>
  );
}
