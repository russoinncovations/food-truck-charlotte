import type { Metadata } from "next";
import { FormField } from "@/components/form-field";
import { SectionHeader } from "@/components/section-header";

export const metadata: Metadata = {
  title: "For Food Truck Owners",
  description:
    "Join Food Truck Charlotte to increase local visibility, receive qualified inquiries, and grow through trusted community reach.",
};

export default function ForTrucksPage() {
  return (
    <div className="space-y-10 md:space-y-12">
      <SectionHeader
        eyebrow="For Trucks"
        title="Grow Your Visibility with Food Truck Charlotte"
        description="Join a Charlotte-first guide built from real community relationships, and get discovered by people actively planning where to eat and who to book."
      />

      <section className="grid gap-4 rounded-2xl border border-[#1E1E1E]/8 bg-[#fffdfa] p-5 md:grid-cols-3 md:p-6">
        {[
          "Show up where Charlotte locals already go to discover trucks.",
          "Build trust through consistent local visibility and event coverage.",
          "Receive inquiries from hosts planning schools, HOAs, offices, and more.",
        ].map((item) => (
          <p key={item} className="text-sm leading-6 text-[#1E1E1E]/85">
            {item}
          </p>
        ))}
      </section>

      <form className="grid gap-4 rounded-2xl border border-[#1E1E1E]/8 bg-[#fffdfa] p-5 md:grid-cols-2 md:p-6">
        <FormField label="Truck Name" name="truckName" placeholder="Your truck's public name" required />
        <FormField label="Owner / Contact Name" name="contactName" placeholder="Best point of contact" required />
        <FormField label="Email" name="email" type="email" placeholder="name@email.com" required />
        <FormField label="Phone" name="phone" type="tel" placeholder="(704) 555-0123" />
        <FormField label="Cuisine" name="cuisine" placeholder="Ex: Tacos, BBQ, Caribbean" required />
        <FormField label="Service Area" name="serviceArea" placeholder="Ex: Uptown, South End, NoDa" required />
        <FormField label="Instagram" name="instagram" placeholder="@yourtruckname" />
        <FormField label="Website" name="website" placeholder="https://yourtruck.com" />
        <div className="md:col-span-2">
          <FormField
            label="Short Description"
            name="description"
            as="textarea"
            placeholder="Tell Charlotte what makes your menu and service style stand out."
          />
        </div>
        <button
          type="submit"
          className="md:col-span-2 inline-flex w-fit rounded-full bg-[#D97A2B] px-6 py-3 text-sm font-semibold text-white hover:bg-[#c76e25]"
        >
          Join the Directory
        </button>
      </form>
    </div>
  );
}
