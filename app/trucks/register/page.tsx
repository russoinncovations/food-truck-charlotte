import type { Metadata } from "next";
import Link from "next/link";
import { TruckMarketplaceRegisterForm } from "@/components/forms/truck-marketplace-register-form";
import { SectionHeader } from "@/components/section-header";

export const metadata: Metadata = {
  title: "Register for event leads",
  description:
    "Sign up as a food truck vendor to access open event requests on Food Truck Charlotte. Public directory listing is added when your profile is ready.",
};

export default function TruckRegisterPage() {
  return (
    <div className="space-y-8 md:space-y-10">
      <SectionHeader
        eyebrow="Vendors"
        title="Register for the event dashboard"
        description="Create an account with your truck details. You can sign in immediately to view open host requests. Your truck stays off the public directory until your profile is ready to go live."
      />
      <TruckMarketplaceRegisterForm />
      <p className="text-center text-[15px] text-[#1E1E1E]/70">
        Already registered?{" "}
        <Link href="/trucks/login" className="font-medium text-[#D97A2B] underline-offset-2 hover:underline">
          Sign in
        </Link>
      </p>
    </div>
  );
}
