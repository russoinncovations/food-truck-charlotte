"use client"

import { useSyncExternalStore } from "react"

const QUERY = "(min-width: 1024px)"

function subscribe(onChange: () => void) {
  if (typeof window === "undefined") return () => {}
  const mql = window.matchMedia(QUERY)
  mql.addEventListener("change", onChange)
  return () => mql.removeEventListener("change", onChange)
}

function getSnapshot() {
  return typeof window !== "undefined" && window.matchMedia(QUERY).matches
}

function getServerSnapshot() {
  return false
}

/** True when viewport is lg breakpoint or wider; false during SSR. */
export function useMinWidthLg() {
  return useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot)
}
