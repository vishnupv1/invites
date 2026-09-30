import type { AnnaTheme } from "../components/AnnaInvite";
import type { BaptismTheme } from "../components/BaptismInvite";
import type { BeachTheme } from "../components/BeachInvite";
import type { HomeTheme } from "../components/HomeInvite";
import type { PeaceTheme } from "../components/PeaceInvite";
import type { ShaadiTheme } from "../components/ShaadiInvite";
import type { ThiruvizhaTheme } from "../components/ThiruvizhaInvite";
import type { VivahTheme } from "../components/VivahInvite";

export function annaThemeOf(swatch: string): AnnaTheme {
  if (swatch === "emerald") return "sage";
  if (swatch === "midnight") return "dusk";
  return "terracotta";
}

export function homeThemeOf(swatch: string): HomeTheme {
  if (swatch === "rose") return "sunset";
  if (swatch === "midnight") return "night";
  return "day";
}

export function beachThemeOf(swatch: string): BeachTheme {
  if (swatch === "sky") return "tropical";
  if (swatch === "plum") return "dusk";
  return "sunset";
}

export function vivahThemeOf(swatch: string): VivahTheme {
  if (swatch === "emerald") return "emerald";
  if (swatch === "plum") return "royal";
  return "midnight";
}

export function shaadiThemeOf(swatch: string): ShaadiTheme {
  if (swatch === "emerald") return "emerald";
  if (swatch === "ivory") return "ivory";
  return "rani";
}

export function peaceThemeOf(swatch: string): PeaceTheme {
  if (swatch === "noir") return "noir";
  if (swatch === "sage") return "sage";
  return "blush";
}

export function thiruThemeOf(swatch: string): ThiruvizhaTheme {
  if (swatch === "ivory") return "ivory";
  if (swatch === "emerald") return "emerald";
  return "rani";
}

export function baptismThemeOf(swatch: string): BaptismTheme {
  if (swatch === "rose") return "blush";
  if (swatch === "emerald") return "sage";
  return "sky";
}
