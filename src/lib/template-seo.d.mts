export type TemplateSeoInput = {
  id?: string;
  name: string;
  price: number;
  free?: boolean;
  description?: string;
  events?: readonly string[];
  tagline?: string;
};

export type TemplateSeoLine = {
  heading: string;
  title: string;
  description: string;
  lead: string;
};

export function priceLabel(template: Pick<TemplateSeoInput, "price" | "free">): string;
export function generatedTemplateSeo(template: TemplateSeoInput): TemplateSeoLine;
