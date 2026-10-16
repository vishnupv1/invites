import copy from "../data/occasion-content.json" with { type: "json" };

type Sample = string | { text: string; lang?: string };

type Page = {
  review: string;
  whatYouGet: string[];
  howItWorks: string[];
  wording: Sample[];
  price: string;
  faqs: { q: string; a: string }[];
};

const pages = copy as Record<string, Page>;

export function occasionCopy(id: string) {
  return pages[id];
}

export function OccasionArticle({ id }: { id: string }) {
  const page = pages[id];
  if (!page) return null;
  return (
    <article className="occasion-copy">
      {page.review ? <p className="occasion-review">{page.review}</p> : null}
      <h2>What you get</h2>
      {page.whatYouGet.map((paragraph) => <p key={paragraph}>{paragraph}</p>)}
      <h2>How it works</h2>
      <ol>
        {page.howItWorks.map((step) => <li key={step}>{step}</li>)}
      </ol>
      <h2>Invitation wording</h2>
      {page.wording.map((sample) => {
        const text = typeof sample === "string" ? sample : sample.text;
        const lang = typeof sample === "string" ? undefined : sample.lang;
        return <p key={text} lang={lang}>{text}</p>;
      })}
      <h2>Price</h2>
      <p>{page.price}</p>
      <h2>Questions</h2>
      {page.faqs.map((item) => (
        <details key={item.q} open>
          <summary>{item.q}</summary>
          <p>{item.a}</p>
        </details>
      ))}
    </article>
  );
}
