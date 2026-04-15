"use client";

import { createClientComponentClient } from "@supabase/auth-helpers-nextjs";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import { getSupabase } from "@/lib/supabase";

type TruckRow = {
  id: string;
  name: string | null;
  cuisine: string | null;
  tagline: string | null;
  about: string | null;
  area: string | null;
  status: string | null;
  event_types: string | null;
  min_guests: number | null;
};

export default function TruckDashboardProfilePage() {
  const router = useRouter();
  const [userEmail, setUserEmail] = useState<string | null>(null);
  const [truck, setTruck] = useState<TruckRow | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const [name, setName] = useState("");
  const [cuisine, setCuisine] = useState("");
  const [tagline, setTagline] = useState("");
  const [about, setAbout] = useState("");
  const [area, setArea] = useState("");
  const [status, setStatus] = useState("");
  const [eventTypes, setEventTypes] = useState("");
  const [minGuests, setMinGuests] = useState("");

  const loadTruck = useCallback(async () => {
    setLoading(true);
    setError(null);
    const supabase = createClientComponentClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user?.email) {
      setLoading(false);
      router.replace("/truck-dashboard");
      return;
    }
    setUserEmail(user.email);

    const dataClient = getSupabase();
    if (!dataClient) {
      setError("Server configuration is missing.");
      setLoading(false);
      return;
    }

    const { data, error: qErr } = await dataClient
      .from("trucks")
      .select("id, name, cuisine, tagline, about, area, status, event_types, min_guests")
      .eq("owner_email", user.email)
      .maybeSingle();

    if (qErr) {
      setError(qErr.message);
      setLoading(false);
      return;
    }

    if (!data) {
      setTruck(null);
      setLoading(false);
      return;
    }

    const row = data as TruckRow;
    setTruck(row);
    setName(row.name ?? "");
    setCuisine(row.cuisine ?? "");
    setTagline(row.tagline ?? "");
    setAbout(row.about ?? "");
    setArea(row.area ?? "");
    setStatus(row.status ?? "");
    setEventTypes(row.event_types ?? "");
    setMinGuests(row.min_guests != null ? String(row.min_guests) : "");
    setLoading(false);
  }, [router]);

  useEffect(() => {
    void loadTruck();
  }, [loadTruck]);

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    if (!truck?.id || !userEmail) return;
    setSaving(true);
    setMessage(null);
    setError(null);

    const minParsed = minGuests.trim() === "" ? null : Number(minGuests);
    const payload = {
      name: name.trim(),
      cuisine: cuisine.trim(),
      tagline: tagline.trim() || null,
      about: about.trim() || null,
      area: area.trim() || null,
      status: status.trim() || null,
      event_types: eventTypes.trim() || null,
      min_guests: minParsed != null && !Number.isNaN(minParsed) ? minParsed : null,
    };

    const supabase = createClientComponentClient();
    const { error: uErr } = await supabase.from("trucks").update(payload).eq("id", truck.id);

    setSaving(false);
    if (uErr) {
      setError(uErr.message);
      return;
    }
    setMessage("Saved.");
    void loadTruck();
  }

  async function handleLogout() {
    const supabase = createClientComponentClient();
    await supabase.auth.signOut();
    router.replace("/truck-dashboard");
  }

  if (loading) {
    return (
      <div className="px-4 py-16 text-center text-sm" style={{ color: "var(--ftc-muted)" }}>
        Loading…
      </div>
    );
  }

  if (!truck) {
    return (
      <div className="mx-auto max-w-lg px-4 py-16" style={{ background: "var(--ftc-cream)", color: "var(--ftc-ink)" }}>
        <p className="font-display text-lg font-bold">No listing found</p>
        <p className="mt-2 text-sm" style={{ color: "var(--ftc-muted)" }}>
          We couldn&apos;t find a truck with owner email <strong>{userEmail}</strong>.
        </p>
        <button
          type="button"
          onClick={() => void handleLogout()}
          className="font-display mt-6 rounded-lg px-4 py-2 text-sm font-semibold text-white"
          style={{ background: "var(--ftc-orange)" }}
        >
          Log out
        </button>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-xl px-4 py-10" style={{ background: "var(--ftc-cream)", color: "var(--ftc-ink)" }}>
      <div className="mb-8 flex flex-wrap items-center justify-between gap-4">
        <h1 className="font-display text-2xl font-extrabold tracking-tight" style={{ fontFamily: "var(--font-display)" }}>
          Your truck
        </h1>
        <button
          type="button"
          onClick={() => void handleLogout()}
          className="rounded-lg border px-4 py-2 text-sm font-medium"
          style={{ borderColor: "var(--ftc-border-md)", color: "var(--ftc-ink)" }}
        >
          Log out
        </button>
      </div>

      <form onSubmit={handleSave} className="flex flex-col gap-4 rounded-2xl border bg-white p-6" style={{ borderColor: "var(--ftc-border)", boxShadow: "var(--shadow-soft)" }}>
        <label className="flex flex-col gap-1 text-sm font-medium" style={{ color: "var(--ftc-ink-lt)" }}>
          Name
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="rounded-lg border px-3 py-2 text-[15px]"
            style={{ borderColor: "var(--ftc-border-md)", color: "var(--ftc-ink)" }}
          />
        </label>
        <label className="flex flex-col gap-1 text-sm font-medium" style={{ color: "var(--ftc-ink-lt)" }}>
          Cuisine
          <input
            value={cuisine}
            onChange={(e) => setCuisine(e.target.value)}
            className="rounded-lg border px-3 py-2 text-[15px]"
            style={{ borderColor: "var(--ftc-border-md)", color: "var(--ftc-ink)" }}
          />
        </label>
        <label className="flex flex-col gap-1 text-sm font-medium" style={{ color: "var(--ftc-ink-lt)" }}>
          Tagline
          <input
            value={tagline}
            onChange={(e) => setTagline(e.target.value)}
            className="rounded-lg border px-3 py-2 text-[15px]"
            style={{ borderColor: "var(--ftc-border-md)", color: "var(--ftc-ink)" }}
          />
        </label>
        <label className="flex flex-col gap-1 text-sm font-medium" style={{ color: "var(--ftc-ink-lt)" }}>
          About
          <textarea
            value={about}
            onChange={(e) => setAbout(e.target.value)}
            rows={4}
            className="rounded-lg border px-3 py-2 text-[15px]"
            style={{ borderColor: "var(--ftc-border-md)", color: "var(--ftc-ink)" }}
          />
        </label>
        <label className="flex flex-col gap-1 text-sm font-medium" style={{ color: "var(--ftc-ink-lt)" }}>
          Area
          <input
            value={area}
            onChange={(e) => setArea(e.target.value)}
            className="rounded-lg border px-3 py-2 text-[15px]"
            style={{ borderColor: "var(--ftc-border-md)", color: "var(--ftc-ink)" }}
          />
        </label>
        <label className="flex flex-col gap-1 text-sm font-medium" style={{ color: "var(--ftc-ink-lt)" }}>
          Status
          <input
            value={status}
            onChange={(e) => setStatus(e.target.value)}
            className="rounded-lg border px-3 py-2 text-[15px]"
            style={{ borderColor: "var(--ftc-border-md)", color: "var(--ftc-ink)" }}
          />
        </label>
        <label className="flex flex-col gap-1 text-sm font-medium" style={{ color: "var(--ftc-ink-lt)" }}>
          Event types
          <input
            value={eventTypes}
            onChange={(e) => setEventTypes(e.target.value)}
            className="rounded-lg border px-3 py-2 text-[15px]"
            style={{ borderColor: "var(--ftc-border-md)", color: "var(--ftc-ink)" }}
          />
        </label>
        <label className="flex flex-col gap-1 text-sm font-medium" style={{ color: "var(--ftc-ink-lt)" }}>
          Min. guests
          <input
            type="number"
            min={0}
            value={minGuests}
            onChange={(e) => setMinGuests(e.target.value)}
            className="rounded-lg border px-3 py-2 text-[15px]"
            style={{ borderColor: "var(--ftc-border-md)", color: "var(--ftc-ink)" }}
          />
        </label>

        {error ? (
          <p className="text-sm" style={{ color: "var(--ftc-orange)" }}>
            {error}
          </p>
        ) : null}
        {message ? (
          <p className="text-sm" style={{ color: "var(--ftc-green)" }}>
            {message}
          </p>
        ) : null}

        <button
          type="submit"
          disabled={saving}
          className="font-display mt-2 rounded-lg py-3 text-[15px] font-semibold text-white disabled:opacity-60"
          style={{ background: "var(--ftc-orange)" }}
        >
          {saving ? "Saving…" : "Save changes"}
        </button>
      </form>
    </div>
  );
}
