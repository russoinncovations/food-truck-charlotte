import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { signOutTruck } from "@/app/actions/truck-auth";
import { EventRespondForm } from "@/components/forms/event-respond-form";
import { SectionHeader } from "@/components/section-header";
import { createServerSupabaseClient } from "@/lib/supabase/server";

export const metadata: Metadata = {
  title: "Event leads dashboard",
  description: "Open event requests for registered Food Truck Charlotte vendors.",
};

export const dynamic = "force-dynamic";

type OpenInquiry = {
  id: string;
  event_date: string;
  event_location: string;
  guest_count: number;
  indoor_outdoor: string;
  cuisine_preferences: string;
  budget_range: string | null;
};

function formatListDate(iso: string): string {
  const d = new Date(iso + "T12:00:00");
  if (Number.isNaN(d.getTime())) return iso;
  return d.toLocaleDateString("en-US", {
    weekday: "short",
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

export default async function TruckDashboardPage() {
  const supabase = await createServerSupabaseClient();
  if (!supabase) {
    return (
      <div className="rounded-xl border border-[#1E1E1E]/15 bg-[#fffdfa] p-6 text-[15px] text-[#1E1E1E]/80">
        Supabase is not configured. Add{" "}
        <code className="rounded bg-[#f0ebe4] px-1">NEXT_PUBLIC_SUPABASE_URL</code> and{" "}
        <code className="rounded bg-[#f0ebe4] px-1">NEXT_PUBLIC_SUPABASE_ANON_KEY</code>.
      </div>
    );
  }

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user?.email) {
    redirect("/trucks/login");
  }

  const emailNorm = user.email.trim().toLowerCase();

  const { data: truck, error: truckErr } = await supabase
    .from("trucks")
    .select("id, active, name")
    .eq("email", emailNorm)
    .maybeSingle();

  if (truckErr) {
    return (
      <p className="text-[15px] text-red-700">
        Could not load your profile. Please try again later.
      </p>
    );
  }

  if (!truck) {
    return (
      <div className="space-y-6">
        <SectionHeader
          eyebrow="Dashboard"
          title="No vendor profile yet"
          description="Register your truck with the same email you use to sign in. After approval you will see open event requests here."
        />
        <Link
          href="/trucks/register"
          className="inline-flex rounded-full bg-[#D97A2B] px-6 py-3 text-sm font-semibold text-white hover:bg-[#c76e25]"
        >
          Register your truck
        </Link>
      </div>
    );
  }

  if (!truck.active) {
    return (
      <div className="space-y-4">
        <SectionHeader
          eyebrow="Dashboard"
          title="Your registration is pending approval"
          description="Thanks for signing up. An admin will review your truck and set your account to active. You will then be able to view and respond to open event requests. Watch your inbox for updates."
        />
        <p className="text-[15px] text-[#1E1E1E]/75">
          Signed in as <span className="font-medium text-[#1E1E1E]">{user.email}</span>
        </p>
      </div>
    );
  }

  const { data: inquiries, error: inqErr } = await supabase
    .from("event_inquiries")
    .select(
      "id, event_date, event_location, guest_count, indoor_outdoor, cuisine_preferences, budget_range",
    )
    .eq("status", "open")
    .order("created_at", { ascending: false });

  if (inqErr) {
    return (
      <p className="text-[15px] text-red-700">
        Could not load event requests. If this is new, apply the latest database migration for{" "}
        <code className="rounded bg-[#f0ebe4] px-1">event_inquiries</code>.
      </p>
    );
  }

  const list = (inquiries ?? []) as OpenInquiry[];

  const { data: responses } = await supabase
    .from("truck_responses")
    .select("inquiry_id")
    .eq("truck_id", truck.id);

  const respondedIds = new Set(
    (responses ?? []).map((r: { inquiry_id: string }) => r.inquiry_id),
  );

  return (
    <div className="space-y-8">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <SectionHeader
          eyebrow="Dashboard"
          title={`Hi, ${truck.name}`}
          description="Open host requests are listed below. Host contact details are shared only after you tap “I'm Available.”"
        />
        <form action={signOutTruck} className="shrink-0">
          <button
            type="submit"
            className="rounded-full border border-[#1E1E1E]/20 px-4 py-2 text-sm font-medium text-[#1E1E1E]/80 hover:bg-[#1E1E1E]/5"
          >
            Sign out
          </button>
        </form>
      </div>

      {list.length === 0 ? (
        <p className="text-[15px] text-[#1E1E1E]/70">No open event requests right now. Check back soon.</p>
      ) : (
        <ul className="grid gap-4 md:grid-cols-2">
          {list.map((row) => (
            <li
              key={row.id}
              className="flex flex-col gap-3 rounded-2xl border border-[#1E1E1E]/8 bg-[#fffdfa] p-5 shadow-sm"
            >
              <p className="text-[15px] font-semibold text-[#1E1E1E]">
                {formatListDate(String(row.event_date))}
              </p>
              <p className="text-[14px] leading-6 text-[#1E1E1E]/85">
                <span className="text-[#1E1E1E]/55">Location:</span> {row.event_location}
              </p>
              <p className="text-[14px] leading-6 text-[#1E1E1E]/85">
                <span className="text-[#1E1E1E]/55">Guests:</span> {row.guest_count}
              </p>
              <p className="text-[14px] leading-6 text-[#1E1E1E]/85">
                <span className="text-[#1E1E1E]/55">Setting:</span> {row.indoor_outdoor}
              </p>
              <p className="text-[14px] leading-6 text-[#1E1E1E]/85">
                <span className="text-[#1E1E1E]/55">Cuisine:</span> {row.cuisine_preferences}
              </p>
              <p className="text-[14px] leading-6 text-[#1E1E1E]/85">
                <span className="text-[#1E1E1E]/55">Budget:</span> {row.budget_range ?? "—"}
              </p>
              <div className="mt-1 border-t border-[#1E1E1E]/10 pt-3">
                <EventRespondForm inquiryId={row.id} alreadyResponded={respondedIds.has(row.id)} />
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
