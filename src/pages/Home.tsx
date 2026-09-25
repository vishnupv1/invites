import { Link } from "react-router-dom";
import { InviteView } from "../components/InviteView";
import { EVENTS } from "../data/events";
import { getTemplate, sampleFor } from "../data/templates";

const features = [
  { title: "Photos", text: "Paid styles take a gallery. The free note stays words only." },
  { title: "Wishes", text: "Guests leave a note on the invite, without an account." },
  { title: "Maps", text: "Search the venue and the page drops a map on the spot." },
  { title: "Countdown", text: "Evening and birthday styles count down to the day." },
];

const steps = [
  { n: "01", title: "Choose the celebration", text: "Wedding, reception, birthday, anniversary, engagement, or housewarming." },
  { n: "02", title: "Pick a style", text: "Each category has its own designs. Preview before you commit." },
  { n: "03", title: "Add the day", text: "Names, time, photos, a song if you have one, and the place." },
  { n: "04", title: "Share the link", text: "Guests open it on a phone. Nothing to install." },
];

export function Home() {
  const demo = getTemplate("garden")!;

  return (
    <>
      <section className="landing-hero">
        <div>
          <p className="eyebrow">Choose your celebration</p>
          <h1>
            Turn the day into a <em>link</em> guests will open.
          </h1>
          <p className="lede">
            A digital invitation for the function: names, photos, a map, and a place to send wishes.
            One wedding style is free and plain. The rest are bought once.
          </p>
          <div className="hero-actions">
            <Link className="pill-link" to="/c/marriage">
              Wedding
            </Link>
            <Link className="pill-link" to="/c/birthday">
              Birthday
            </Link>
            <Link className="ghost" to="/c/reception">
              Reception
            </Link>
          </div>
        </div>
        <div className="phone" aria-hidden="true">
          <div className="phone-screen">
            <InviteView template={demo} fields={sampleFor(demo, "marriage")} />
          </div>
          <p className="phone-note">Free wedding note</p>
        </div>
      </section>

      <section className="feature-row">
        {features.map((feature) => (
          <article key={feature.title}>
            <h2>{feature.title}</h2>
            <p>{feature.text}</p>
          </article>
        ))}
      </section>

      <section id="categories" className="occasion-block">
        <h2>
          An invitation for <em>every</em> occasion
        </h2>
        <div className="categories">
          {EVENTS.map((event) => (
            <Link key={event.id} className={`category-card cat-${event.id}`} to={`/c/${event.id}`}>
              <span>{event.cardLabel}</span>
              <h3>{event.label}</h3>
              <p>See styles</p>
            </Link>
          ))}
        </div>
      </section>

      <section className="steps">
        {steps.map((step) => (
          <article key={step.n}>
            <span>{step.n}</span>
            <h2>{step.title}</h2>
            <p>{step.text}</p>
          </article>
        ))}
      </section>
    </>
  );
}
