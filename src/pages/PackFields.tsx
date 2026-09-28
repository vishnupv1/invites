import { linesFor, packOf, type CustomPack, type FactItem, type FaqItem, type PersonItem, type ProgrammeItem, type RoomItem, type StoryBeat } from "../data/custom";

export function PackFields({ id, lines, onChange }: { id: string; lines?: string; onChange: (lines: string) => void }) {
  const pack = packOf(id, lines || linesFor(id));
  function write(next: CustomPack) {
    onChange(JSON.stringify(next));
  }
  function patchList<T extends object>(key: keyof CustomPack, index: number, patch: Partial<T>) {
    const list = [...((pack[key] as T[]) ?? [])];
    list[index] = { ...list[index], ...patch };
    write({ ...pack, [key]: list });
  }

  return (
    <>
      {pack.story?.map((item, index) => (
        <div className="ed-fn" key={`story-${index}`}>
          {index === 0 ? <p className="ed-lead">Love story</p> : null}
          <div className="ed-grid-2">
            <input className="ed-input" aria-label="Year" value={item.year} onChange={(event) => patchList<StoryBeat>("story", index, { year: event.target.value })} />
            <input className="ed-input" aria-label="Chapter title" value={item.title} onChange={(event) => patchList<StoryBeat>("story", index, { title: event.target.value })} />
          </div>
          <textarea className="ed-input" aria-label="Chapter" rows={2} value={item.text} onChange={(event) => patchList<StoryBeat>("story", index, { text: event.target.value })} />
        </div>
      ))}
      {pack.sangeetVenue !== undefined ? (
        <div className="ed-fn">
          <p className="ed-lead">Mehendi and sangeet</p>
          <div className="ed-grid-2">
            <input className="ed-input" aria-label="Sangeet time" type="time" value={pack.sangeetTime ?? ""} onChange={(event) => write({ ...pack, sangeetTime: event.target.value })} />
            <input className="ed-input" aria-label="Sangeet venue" placeholder="Venue" value={pack.sangeetVenue} onChange={(event) => write({ ...pack, sangeetVenue: event.target.value })} />
          </div>
          <input className="ed-input" aria-label="Photo caption" placeholder="Caption under the photographs" value={pack.caption ?? ""} onChange={(event) => write({ ...pack, caption: event.target.value })} />
        </div>
      ) : null}
      {pack.travelFrom !== undefined ? (
        <div className="ed-fn">
          <p className="ed-lead">The journey</p>
          <input className="ed-input" aria-label="Starting point" placeholder="Airport or station" value={pack.travelFrom} onChange={(event) => write({ ...pack, travelFrom: event.target.value })} />
          <input className="ed-input" aria-label="Distance" placeholder="Distance" value={pack.travelKm ?? ""} onChange={(event) => write({ ...pack, travelKm: event.target.value })} />
          <p className="ed-lead">The shuttle note is under Details.</p>
        </div>
      ) : null}
      {pack.programme?.map((item, index) => (
        <div className="ed-fn" key={`programme-${index}`}>
          {index === 0 ? <p className="ed-lead">The day’s programme</p> : null}
          <div className="ed-grid-2">
            <input className="ed-input" aria-label="Time" value={item.time} onChange={(event) => patchList<ProgrammeItem>("programme", index, { time: event.target.value })} />
            <input className="ed-input" aria-label="Programme title" value={item.title} onChange={(event) => patchList<ProgrammeItem>("programme", index, { title: event.target.value })} />
          </div>
          <textarea className="ed-input" aria-label="Programme detail" rows={2} value={item.text} onChange={(event) => patchList<ProgrammeItem>("programme", index, { text: event.target.value })} />
        </div>
      ))}
      {pack.rooms?.map((item, index) => (
        <div className="ed-fn" key={`room-${index}`}>
          {index === 0 ? <p className="ed-lead">House tour</p> : null}
          <div className="ed-grid-2">
            <input className="ed-input" aria-label="Tab" value={item.label} onChange={(event) => patchList<RoomItem>("rooms", index, { label: event.target.value })} />
            <input className="ed-input" aria-label="Room name" value={item.name} onChange={(event) => patchList<RoomItem>("rooms", index, { name: event.target.value })} />
          </div>
          <textarea className="ed-input" aria-label="Room" rows={2} value={item.text} onChange={(event) => patchList<RoomItem>("rooms", index, { text: event.target.value })} />
          <input className="ed-input" aria-label="Room note" placeholder="Short note" value={item.note} onChange={(event) => patchList<RoomItem>("rooms", index, { note: event.target.value })} />
        </div>
      ))}
      {pack.people?.map((item, index) => (
        <div className="ed-fn" key={`person-${index}`}>
          {index === 0 ? <p className="ed-lead">Godparents</p> : null}
          <div className="ed-grid-2">
            <input className="ed-input" aria-label="Name" value={item.name} onChange={(event) => patchList<PersonItem>("people", index, { name: event.target.value })} />
            <input className="ed-input" aria-label="Role" value={item.role} onChange={(event) => patchList<PersonItem>("people", index, { role: event.target.value })} />
          </div>
        </div>
      ))}
      {pack.facts?.map((item, index) => (
        <div className="ed-fn" key={`fact-${index}`}>
          {index === 0 ? <p className="ed-lead">Little facts</p> : null}
          <div className="ed-grid-2">
            <input className="ed-input" aria-label="Fact" value={item.label} onChange={(event) => patchList<FactItem>("facts", index, { label: event.target.value })} />
            <input className="ed-input" aria-label="Answer" value={item.value} onChange={(event) => patchList<FactItem>("facts", index, { value: event.target.value })} />
          </div>
        </div>
      ))}
      {pack.airport !== undefined ? (
        <div className="ed-fn">
          <p className="ed-lead">Travel, stay and gifts</p>
          <textarea className="ed-input" aria-label="Airport" rows={2} value={pack.airport} onChange={(event) => write({ ...pack, airport: event.target.value })} />
          <textarea className="ed-input" aria-label="Where to stay" rows={2} value={pack.stay ?? ""} onChange={(event) => write({ ...pack, stay: event.target.value })} />
          <textarea className="ed-input" aria-label="Gift note" rows={2} value={pack.gift ?? ""} onChange={(event) => write({ ...pack, gift: event.target.value })} />
        </div>
      ) : null}
      {pack.faqs?.map((item, index) => (
        <div className="ed-fn" key={`faq-${index}`}>
          {index === 0 ? <p className="ed-lead">Questions guests ask</p> : null}
          <input className="ed-input" aria-label="Question" value={item.q} onChange={(event) => patchList<FaqItem>("faqs", index, { q: event.target.value })} />
          <textarea className="ed-input" aria-label="Answer" rows={2} value={item.a} onChange={(event) => patchList<FaqItem>("faqs", index, { a: event.target.value })} />
        </div>
      ))}
    </>
  );
}
