"use client";

import Link from "next/link";
import { useState } from "react";
import type { FoodTruckListItem } from "@/lib/types";

const CUISINES = ["All", "Tacos", "BBQ", "Desserts", "Wings", "Latin", "Soul Food", "Coffee"];

type StatusKey = "available" | "event" | "inquire";

const STATUS_MAP: Record<StatusKey, { label: string; bg: string; color: string; border?: string }> = {
  available: { label: "Available", bg: "#CCE8E0", color: "#0F6E56" },
  event: { label: "At Event", bg: "#FDDCCE", color: "#D94F1E" },
  inquire: { label: "Inquire", bg: "#F4F0E8", color: "#7A7268", border: "#E8E2D8" },
};

const STATUS_CYCLE: StatusKey[] = ["available", "inquire", "event"];

const AVATAR_PALETTES = [
  { bg: "#FDDCCE", text: "#D94F1E" },
  { bg: "#CCE8E0", text: "#0F6E56" },
  { bg: "#FAF0CC", text: "#BA7517" },
  { bg: "#CCE0F4", text: "#185FA5" },
  { bg: "#F4CCE0", text: "#993556" },
];

function nameInitial(name: string): string {
  const t = name.trim();
  if (!t) return "?";
  return t.charAt(0).toUpperCase();
}

export type HeroSectionProps = {
  featuredTrucks: FoodTruckListItem[];
  totalTruckCount: number;
};

export function HeroSection({ featuredTrucks, totalTruckCount }: HeroSectionProps) {
  const [activeFilter, setActiveFilter] = useState("All");

  const shown = Math.min(5, featuredTrucks.length);
  const total = Math.max(totalTruckCount, shown);

  return (
    <div className="w-full" style={{ background: "var(--ftc-cream)", color: "var(--ftc-ink)" }}>
      <div className="grid min-h-0 grid-cols-1 lg:min-h-[min(720px,calc(100vh-7rem))] lg:grid-cols-[1fr_340px]">
        {/* LEFT */}
        <div className="flex flex-col justify-center px-5 py-14 sm:px-10 lg:px-14 lg:py-20">
          <div className="mb-8 flex items-center gap-2">
            <span
              className="animate-pulse-dot h-[7px] w-[7px] rounded-full"
              style={{ background: "var(--ftc-orange)" }}
            />
            <span
              className="text-[11px] font-medium uppercase tracking-[0.08em]"
              style={{ color: "var(--ftc-orange)" }}
            >
              {totalTruckCount > 0 ? `${totalTruckCount} trucks active` : "Browse local trucks"}
            </span>
            <span style={{ color: "var(--ftc-hint)" }}>·</span>
            <span
              className="text-[11px] uppercase tracking-[0.08em]"
              style={{ color: "var(--ftc-subtle)" }}
            >
              Charlotte, NC
            </span>
          </div>

          <h1
            className="font-display mb-6 font-extrabold leading-[0.95] tracking-[-0.04em]"
            style={{ fontSize: "clamp(3.2rem, 5.5vw, 5rem)", color: "var(--ftc-ink)" }}
          >
            Charlotte&apos;s<br />
            food trucks,{" "}
            <span style={{ color: "var(--ftc-orange)" }}>all here.</span>
          </h1>

          <p
            className="mb-10 max-w-[420px] text-base font-light leading-[1.65]"
            style={{ color: "var(--ftc-muted)" }}
          >
            The only local guide built from Charlotte&apos;s own 35,000-member food truck community. Browse, discover,
            and book — free.
          </p>

          <div
            className="mb-8 flex max-w-[500px] flex-wrap items-center gap-2 rounded-[10px] p-[6px] pl-4 sm:flex-nowrap sm:pl-5"
            style={{
              background: "#fff",
              border: "1.5px solid var(--ftc-ink)",
              boxShadow: "var(--shadow-card)",
            }}
          >
            <input
              type="text"
              placeholder="Search cuisine, truck name…"
              className="min-w-0 flex-1 bg-transparent px-1 py-2 text-[15px] outline-none sm:py-0"
              style={{ color: "var(--ftc-ink)" }}
              aria-label="Search trucks"
            />
            <span className="hidden h-6 w-px sm:inline-block" style={{ background: "var(--ftc-border)" }} />
            <span className="hidden text-[13px] whitespace-nowrap sm:inline" style={{ color: "var(--ftc-subtle)" }}>
              📍 Charlotte, NC
            </span>
            <Link
              href="/find-food-trucks"
              className="whitespace-nowrap rounded-[7px] px-4 py-[11px] text-[14px] font-medium text-white sm:px-5"
              style={{ background: "var(--ftc-orange)" }}
            >
              Find Trucks
            </Link>
          </div>

          <div className="mb-12 flex flex-wrap gap-2">
            {CUISINES.map((c) => (
              <button
                key={c}
                type="button"
                onClick={() => setActiveFilter(c)}
                className="cursor-pointer rounded-full border px-4 py-[7px] text-[13px] transition-all"
                style={
                  activeFilter === c
                    ? { background: "var(--ftc-ink)", color: "var(--ftc-cream)", borderColor: "var(--ftc-ink)" }
                    : {
                        background: "var(--ftc-cream-md)",
                        color: "#5C5750",
                        borderColor: "var(--ftc-border-md)",
                      }
                }
              >
                {c}
              </button>
            ))}
          </div>

          <div className="flex flex-wrap items-center gap-6 sm:gap-8">
            {[
              { num: "35K+", label: "Community Members" },
              { num: "Since '14", label: "Charlotte-Based" },
              { num: "Free", label: "Always" },
            ].map(({ num, label }, i, arr) => (
              <div key={label} className="flex items-center gap-6 sm:gap-8">
                <div className="flex flex-col gap-[2px]">
                  <span
                    className="font-display text-[24px] font-bold leading-none tracking-tight"
                    style={{ color: "var(--ftc-ink)" }}
                  >
                    {num}
                  </span>
                  <span
                    className="text-[11px] uppercase tracking-[0.06em]"
                    style={{ color: "var(--ftc-subtle)" }}
                  >
                    {label}
                  </span>
                </div>
                {i < arr.length - 1 ? (
                  <span className="hidden h-8 w-px sm:inline-block" style={{ background: "var(--ftc-border)" }} />
                ) : null}
              </div>
            ))}
          </div>
        </div>

        {/* RIGHT PANEL */}
        <div
          className="flex min-h-[320px] flex-col border-t lg:border-l lg:border-t-0"
          style={{ background: "var(--ftc-cream-md)", borderColor: "var(--ftc-border)" }}
        >
          <div
            className="flex items-center justify-between border-b px-5 py-4 sm:px-6 sm:py-5"
            style={{ borderColor: "var(--ftc-border)" }}
          >
            <span
              className="font-display text-[13px] font-bold uppercase tracking-[0.06em]"
              style={{ color: "var(--ftc-subtle)" }}
            >
              Featured Trucks
            </span>
            <span className="text-[12px]" style={{ color: "var(--ftc-hint)" }}>
              Showing {shown} of {total}
            </span>
          </div>

          <div className="min-h-0 flex-1">
            {featuredTrucks.length === 0 ? (
              <p className="px-6 py-6 text-sm" style={{ color: "var(--ftc-muted)" }}>
                No trucks listed yet — check back soon.
              </p>
            ) : (
              featuredTrucks.slice(0, 5).map((truck, i) => {
                const statusKey = STATUS_CYCLE[i % STATUS_CYCLE.length];
                const status = STATUS_MAP[statusKey];
                const palette = AVATAR_PALETTES[i % AVATAR_PALETTES.length];
                return (
                  <Link
                    key={truck.slug}
                    href={`/trucks/${truck.slug}`}
                    className="animate-slide-in group flex items-center gap-4 border-b px-5 py-4 transition-colors hover:bg-[var(--ftc-cream-dk)] sm:px-6"
                    style={{
                      borderColor: "var(--ftc-border)",
                      background: "var(--ftc-cream-md)",
                      animationDelay: `${i * 0.08}s`,
                    }}
                  >
                    <div
                      className="flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-[10px] font-display text-lg font-bold"
                      style={{ background: palette.bg, color: palette.text }}
                    >
                      {nameInitial(truck.name)}
                    </div>
                    <div className="min-w-0 flex-1">
                      <div
                        className="font-display truncate text-[15px] font-bold tracking-tight"
                        style={{ color: "var(--ftc-ink)" }}
                      >
                        {truck.name}
                      </div>
                      <div className="truncate text-[12px]" style={{ color: "var(--ftc-subtle)" }}>
                        {truck.cuisine} · {truck.serviceArea || "Charlotte area"}
                      </div>
                    </div>
                    <span
                      className="flex-shrink-0 rounded px-2 py-1 text-[10px] font-medium uppercase tracking-[0.06em]"
                      style={{
                        background: status.bg,
                        color: status.color,
                        border: status.border ? `1px solid ${status.border}` : "none",
                      }}
                    >
                      {status.label}
                    </span>
                  </Link>
                );
              })
            )}
          </div>

          <div className="p-5">
            <Link
              href="/find-food-trucks"
              className="flex w-full items-center justify-center rounded-lg py-[13px] text-[14px] font-medium"
              style={{ background: "var(--ftc-ink)", color: "var(--ftc-cream)" }}
            >
              Browse All {total} Trucks →
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
