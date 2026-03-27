"use client";

type SubmitButtonProps = {
  children: React.ReactNode;
  isPending: boolean;
};

export function SubmitButton({ children, isPending }: SubmitButtonProps) {
  return (
    <button
      type="submit"
      disabled={isPending}
      className="md:col-span-2 inline-flex w-full max-w-full justify-center rounded-full bg-[#D97A2B] px-6 py-3 text-sm font-semibold text-white transition-opacity hover:bg-[#c76e25] disabled:cursor-not-allowed disabled:opacity-60 sm:w-fit"
    >
      {isPending ? "Sending…" : children}
    </button>
  );
}
