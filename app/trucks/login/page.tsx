import type { Metadata } from "next";
import Link from "next/link";
import { TruckMagicLinkForm } from "@/components/forms/truck-magic-link-form";
import { SectionHeader } from "@/components/section-header";

export const metadata: Metadata = {
  title: "Vendor sign in",
  description: "Sign in with email to access open event requests on Food Truck Charlotte.",
};

export default async function TruckLoginPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const sp = await searchParams;
  const errorMessage =
    sp.error === "auth"
      ? "That sign-in link was invalid or expired. Request a new one below."
      : sp.error === "config"
        ? "This site is missing Supabase configuration."
        : null;

  return (
    <div className="space-y-8 md:space-y-10">
      <SectionHeader
        eyebrow="Vendors"
        title="Sign in to your dashboard"
        description="We will email you a one-time link. Use the same email you registered with for the event marketplace."
      />
      {errorMessage ? (
        <div
          className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-[15px] text-red-950"
          role="alert"
        >
          <p className="font-medium">{errorMessage}</p>
        </div>
      ) : null}
      <TruckMagicLinkForm showLoginHelper />
      <p className="text-center text-[15px] text-[#1E1E1E]/70">
        Need an account?{" "}
        <Link
          href="/trucks/register"
          className="font-medium text-[#D97A2B] underline-offset-2 hover:underline"
        >
          Register your truck
        </Link>
      </p>
    </div>
  );
}
