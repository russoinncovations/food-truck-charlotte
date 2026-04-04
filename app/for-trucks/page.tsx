import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { ForTrucksForm } from "@/components/forms/for-trucks-form";
import { TruckMagicLinkForm } from "@/components/forms/truck-magic-link-form";
import { SectionHeader } from "@/components/section-header";
import { createServerSupabaseClient } from "@/lib/supabase/server";

export const metadata: Metadata = {
  title: "For Food Vendors",
  description:
    "Join Food Truck Charlotte to increase local visibility, receive qualified inquiries, and grow through trusted community reach.",
};

export const dynamic = "force-dynamic";

const fieldClass =
  "mt-2 w-full rounded-xl border border-[#1E1E1E]/15 bg-[#fffdf9] px-4 py-3 text-[15px] text-[#1E1E1E] outline-none ring-[#D97A2B] focus:ring-2";

const saveBtnClass =
  "inline-flex w-full max-w-full justify-center rounded-full bg-[#D97A2B] px-6 py-3 text-sm font-semibold text-white transition-opacity hover:bg-[#c76e25] sm:w-fit";

async function updateTruckProfile(formData: FormData) {
  "use server";

  const supabase = await createServerSupabaseClient();
  if (!supabase) {
    redirect("/for-trucks?error=config");
  }

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user?.email) {
    redirect("/for-trucks?error=auth");
  }

  const emailNorm = user.email.trim().toLowerCase();

  const description = String(formData.get("description") ?? "").trim();
  const serviceAreas = String(formData.get("serviceAreas") ?? "").trim();
  const instagram = String(formData.get("instagram") ?? "").trim();
  const website = String(formData.get("website") ?? "").trim();
  const catering = String(formData.get("catering") ?? "");

  const { error } = await supabase
    .from("trucks")
    .update({
      description: description || null,
      service_areas: serviceAreas || null,
      instagram: instagram || null,
      website: website || null,
      catering: catering === "yes",
    })
    .eq("email", emailNorm);

  if (error) {
    console.error("[for-trucks] truck profile update failed:", error.message);
    redirect("/for-trucks?error=save");
  }

  redirect("/for-trucks?saved=1");
}

type TruckRow = {
  name: string;
  description: string | null;
  service_areas: string | null;
  instagram: string | null;
  website: string | null;
  catering: boolean | null;
};

export default async function ForTrucksPage({
  searchParams,
}: {
  searchParams: Promise<{ saved?: string; error?: string }>;
}) {
  const sp = await searchParams;
  const saved = sp.saved === "1";
  const errorKey = sp.error;

  const supabase = await createServerSupabaseClient();
  const {
    data: { user },
  } = supabase ? await supabase.auth.getUser() : { data: { user: null } };

  let truck: TruckRow | null = null;

  if (supabase && user?.email) {
    const emailNorm = user.email.trim().toLowerCase();
    const { data } = await supabase
      .from("trucks")
      .select("name, description, service_areas, instagram, website, catering")
      .eq("email", emailNorm)
      .maybeSingle();
    if (data) {
      truck = data as TruckRow;
    }
  }

  return (
    <div className="space-y-10 md:space-y-12">
      <SectionHeader
        eyebrow="For Vendors"
        title="Whether you run a truck, cart, or tent — list free and get found by Charlotte."
        description="Join a Charlotte-first guide built from real community relationships, and get discovered by people actively planning where to eat and who to book."
      />

      <section className="grid gap-4 rounded-2xl border border-[#1E1E1E]/8 bg-[#fffdfa] p-5 md:grid-cols-3 md:p-6">
        {[
          "Show up where Charlotte locals already go to discover food vendors.",
          "Build trust through consistent local visibility and event coverage.",
          "Receive inquiries from hosts planning schools, HOAs, offices, and more.",
        ].map((item) => (
          <p key={item} className="text-sm leading-6 text-[#1E1E1E]/85">
            {item}
          </p>
        ))}
      </section>

      {!user ? (
        <>
          <div className="space-y-4">
            <h2 className="text-lg font-semibold text-[#1E1E1E]">Vendor sign in</h2>
            <p className="text-[15px] leading-7 text-[#1E1E1E]/75">
              Sign in with your email to view and edit your directory profile.
            </p>
            <TruckMagicLinkForm />
          </div>
          <div className="space-y-4 border-t border-[#1E1E1E]/10 pt-10">
            <h2 className="text-lg font-semibold text-[#1E1E1E]">New to the directory?</h2>
            <p className="text-[15px] leading-7 text-[#1E1E1E]/75">
              Request a free listing below. We&apos;ll follow up by email.
            </p>
            <ForTrucksForm />
          </div>
        </>
      ) : !truck ? (
        <div className="rounded-2xl border border-[#1E1E1E]/8 bg-[#fffdfa] p-6 text-[15px] leading-7 text-[#1E1E1E]/85">
          <p className="font-medium text-[#1E1E1E]">
            Your listing is pending approval. We&apos;ll notify you when you&apos;re added to the directory.
          </p>
        </div>
      ) : (
        <div className="space-y-6">
          {saved ? (
            <div
              className="rounded-xl border border-[#1E1E1E]/15 bg-[#f0ebe4] px-4 py-3 text-[15px] leading-7 text-[#1E1E1E]/90"
              role="status"
            >
              <p className="font-medium text-[#1E1E1E]">Your changes have been saved.</p>
            </div>
          ) : null}
          {errorKey === "save" ? (
            <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-[15px] text-red-950" role="alert">
              <p className="font-medium">We couldn&apos;t save your changes. Please try again.</p>
            </div>
          ) : null}
          {errorKey === "auth" ? (
            <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-[15px] text-red-950" role="alert">
              <p className="font-medium">You must be signed in to save.</p>
            </div>
          ) : null}
          {errorKey === "config" ? (
            <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-[15px] text-red-950" role="alert">
              <p className="font-medium">Server configuration is missing.</p>
            </div>
          ) : null}

          <div>
            <h2 className="text-lg font-semibold text-[#1E1E1E]">Your profile</h2>
            <p className="mt-1 text-[15px] text-[#1E1E1E]/70">
              Signed in as {user.email}. Truck name is managed by our team.
            </p>
          </div>

          <form action={updateTruckProfile} className="grid max-w-2xl gap-4">
            <label className="block text-[15px] font-medium text-[#1E1E1E]">
              Truck name
              <input
                type="text"
                readOnly
                defaultValue={truck.name}
                tabIndex={-1}
                className={`${fieldClass} cursor-not-allowed bg-[#f5f0e8] text-[#1E1E1E]/80`}
                aria-readonly="true"
              />
            </label>

            <label className="block text-[15px] font-medium text-[#1E1E1E]">
              Description
              <textarea
                name="description"
                placeholder="Tell customers about your truck"
                defaultValue={truck.description ?? ""}
                rows={5}
                className={`${fieldClass} min-h-28`}
              />
            </label>

            <label className="block text-[15px] font-medium text-[#1E1E1E]">
              Service areas
              <input
                type="text"
                name="serviceAreas"
                placeholder="Neighborhoods or regions you serve"
                defaultValue={truck.service_areas ?? ""}
                className={fieldClass}
              />
            </label>

            <label className="block text-[15px] font-medium text-[#1E1E1E]">
              Instagram handle
              <input
                type="text"
                name="instagram"
                placeholder="@yourtruck"
                defaultValue={truck.instagram ?? ""}
                className={fieldClass}
              />
            </label>

            <label className="block text-[15px] font-medium text-[#1E1E1E]">
              Website
              <input
                type="text"
                name="website"
                placeholder="https://"
                defaultValue={truck.website ?? ""}
                className={fieldClass}
              />
            </label>

            <fieldset className="min-w-0 border-0 p-0">
              <legend className="text-[15px] font-medium text-[#1E1E1E]">Catering</legend>
              <div className="mt-2 space-y-3 rounded-xl border border-[#1E1E1E]/15 bg-[#fffdf9] px-4 py-3">
                <label className="flex cursor-pointer items-start gap-3 text-[15px] font-normal text-[#1E1E1E]">
                  <input
                    type="radio"
                    name="catering"
                    value="yes"
                    defaultChecked={truck.catering === true}
                    className="mt-1 h-4 w-4 shrink-0 border-[#1E1E1E]/25 accent-[#D97A2B] focus:outline-none focus:ring-2 focus:ring-[#D97A2B]"
                  />
                  <span>Yes</span>
                </label>
                <label className="flex cursor-pointer items-start gap-3 text-[15px] font-normal text-[#1E1E1E]">
                  <input
                    type="radio"
                    name="catering"
                    value="no"
                    defaultChecked={truck.catering !== true}
                    className="mt-1 h-4 w-4 shrink-0 border-[#1E1E1E]/25 accent-[#D97A2B] focus:outline-none focus:ring-2 focus:ring-[#D97A2B]"
                  />
                  <span>No</span>
                </label>
              </div>
            </fieldset>

            <button type="submit" className={saveBtnClass}>
              Save Changes
            </button>
          </form>
        </div>
      )}
    </div>
  );
}
