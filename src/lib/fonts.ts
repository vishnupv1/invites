import { useEffect } from "react";

const FAMILIES = {
  "Alex Brush": "Alex+Brush",
  Allura: "Allura",
  Amiri: "Amiri:wght@400;700",
  "Bodoni Moda": "Bodoni+Moda:ital,opsz,wght@0,6..96,500;0,6..96,600;1,6..96,500",
  Caveat: "Caveat:wght@600;700",
  Cinzel: "Cinzel:wght@500;600;700",
  "Cinzel Decorative": "Cinzel+Decorative:wght@400;700",
  "Cormorant Garamond": "Cormorant+Garamond:ital,wght@0,500;0,600;0,700;1,500",
  "DM Sans": "DM+Sans:wght@400;500;700",
  Fredoka: "Fredoka:wght@500;600;700",
  Gloock: "Gloock",
  "Great Vibes": "Great+Vibes",
  "Instrument Sans": "Instrument+Sans:wght@400;500;600;700",
  Jost: "Jost:wght@400;500;600",
  Karla: "Karla:wght@400;500;700",
  Lora: "Lora:ital,wght@0,500;0,600;1,500",
  "Monsieur La Doulaise": "Monsieur+La+Doulaise",
  "Noto Sans Malayalam": "Noto+Sans+Malayalam:wght@400;600",
  "Noto Sans Tamil": "Noto+Sans+Tamil:wght@400;600;700",
  "Noto Serif Tamil": "Noto+Serif+Tamil:wght@600;700",
  Nunito: "Nunito:wght@400;600;700;800",
  "Nunito Sans": "Nunito+Sans:wght@400;600;700;800",
  Parisienne: "Parisienne",
  "Pinyon Script": "Pinyon+Script",
  "Playfair Display": "Playfair+Display:ital,wght@0,500;0,600;0,700;1,500",
  "Tiro Devanagari Hindi": "Tiro+Devanagari+Hindi",
} as const;

export type FontFamily = keyof typeof FAMILIES;

function load(family: FontFamily) {
  const key = `font-${family.replaceAll(" ", "-").toLowerCase()}`;
  if (document.getElementById(key)) return;
  const link = document.createElement("link");
  link.id = key;
  link.rel = "stylesheet";
  link.href = `https://fonts.googleapis.com/css2?family=${FAMILIES[family]}&display=swap`;
  document.head.appendChild(link);
}

export function useFonts(...families: FontFamily[]) {
  const key = families.join("|");
  useEffect(() => {
    for (const family of key.split("|") as FontFamily[]) load(family);
  }, [key]);
}
