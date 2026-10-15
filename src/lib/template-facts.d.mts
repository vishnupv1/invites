export type TemplateFactInput = {
  name: string;
  price: number;
  free?: boolean;
  description?: string;
  meta?: { components?: { label: string }[] };
  components?: { label: string }[];
};

export function templateFacts(
  template: TemplateFactInput,
  phrase?: { languages?: string[]; occasion?: string },
  occasions?: string[],
): {
  review: string;
  included: string[];
  suitable: string[];
  languages: string[];
  guestSees: string;
  price: string;
  faqs: { q: string; a: string }[];
};
