import { TimeField } from "../components/WhenFields";
import { linesFor, packOf, type CustomPack, type FactItem, type FaqItem, type PersonItem, type ProgrammeItem, type RoomItem, type StoryBeat, type WishItem } from "../data/custom";

function RemoveButton({ label, onClick }: { label: string; onClick: () => void }) {
  return (
    <button type="button" className="ed-remove" aria-label={label} onClick={onClick}>
      <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#C45B63" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <path d="M4 7h16M10 11v6M14 11v6M6 7l1 13h10l1-13M9 7V4h6v3" />
      </svg>
    </button>
  );
}

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
  function dropItem(key: keyof CustomPack, index: number) {
    const list = [...((pack[key] as object[]) ?? [])];
    list.splice(index, 1);
    write({ ...pack, [key]: list });
  }
  function addItem<T extends object>(key: keyof CustomPack, item: T) {
    write({ ...pack, [key]: [...((pack[key] as T[]) ?? []), item] });
  }

  return (
    <>
      {pack.story ? (
        <>
          {pack.story.map((item, index) => (
            <div className="ed-fn" key={`story-${index}`}>
              {index === 0 ? <p className="ed-lead">Love story</p> : null}
              <div className="ed-fn-head">
                <input className="ed-input" aria-label="Chapter title" value={item.title} onChange={(event) => patchList<StoryBeat>("story", index, { title: event.target.value })} />
                <RemoveButton label={`Remove ${item.title || "chapter"}`} onClick={() => dropItem("story", index)} />
              </div>
              <input className="ed-input" aria-label="Year" value={item.year} onChange={(event) => patchList<StoryBeat>("story", index, { year: event.target.value })} />
              <textarea className="ed-input" aria-label="Chapter" rows={2} value={item.text} onChange={(event) => patchList<StoryBeat>("story", index, { text: event.target.value })} />
            </div>
          ))}
          <button type="button" className="ed-add" onClick={() => addItem<StoryBeat>("story", { year: "", title: "New chapter", text: "" })}>+ Add a chapter</button>
        </>
      ) : null}
      {pack.sangeetName === null ? (
        <button type="button" className="ed-add" onClick={() => write({ ...pack, sangeetName: "Evening gathering", sangeetTime: pack.sangeetTime || "18:00" })}>+ Add an evening gathering</button>
      ) : pack.sangeetName !== undefined ? (
        <div className="ed-fn">
          <div className="ed-fn-head">
            <input className="ed-input" aria-label="Evening gathering" value={pack.sangeetName} onChange={(event) => write({ ...pack, sangeetName: event.target.value })} />
            <RemoveButton label={`Remove ${pack.sangeetName || "evening gathering"}`} onClick={() => write({ ...pack, sangeetName: null })} />
          </div>
          <div className="ed-grid-2">
            <TimeField label="Sangeet time" value={pack.sangeetTime ?? ""} onChange={(sangeetTime) => write({ ...pack, sangeetTime })} />
            <input className="ed-input" aria-label="Sangeet venue" placeholder="Venue" value={pack.sangeetVenue ?? ""} onChange={(event) => write({ ...pack, sangeetVenue: event.target.value })} />
          </div>
          <input className="ed-input" aria-label="Photo caption" placeholder="Caption under the photographs" value={pack.caption ?? ""} onChange={(event) => write({ ...pack, caption: event.target.value })} />
        </div>
      ) : null}
      {pack.bonfireName === null ? (
        <button type="button" className="ed-add" onClick={() => write({ ...pack, bonfireName: "Bonfire", bonfireWhen: pack.bonfireWhen || "", bonfireVenue: pack.bonfireVenue || "" })}>+ Add a late gathering</button>
      ) : pack.bonfireName !== undefined ? (
        <div className="ed-fn">
          <div className="ed-fn-head">
            <input className="ed-input" aria-label="Late gathering" value={pack.bonfireName} onChange={(event) => write({ ...pack, bonfireName: event.target.value })} />
            <RemoveButton label={`Remove ${pack.bonfireName || "late gathering"}`} onClick={() => write({ ...pack, bonfireName: null })} />
          </div>
          <div className="ed-grid-2">
            <input className="ed-input" aria-label="When" placeholder="When" value={pack.bonfireWhen ?? ""} onChange={(event) => write({ ...pack, bonfireWhen: event.target.value })} />
            <input className="ed-input" aria-label="Bonfire venue" placeholder="Venue" value={pack.bonfireVenue ?? ""} onChange={(event) => write({ ...pack, bonfireVenue: event.target.value })} />
          </div>
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
      {pack.milkTitle === null ? (
        <button type="button" className="ed-add" onClick={() => write({ ...pack, milkTitle: "Paalukachal" })}>+ Add the milk ceremony</button>
      ) : pack.milkTitle !== undefined ? (
        <div className="ed-fn">
          <div className="ed-fn-head">
            <input className="ed-input" aria-label="Milk ceremony" value={pack.milkTitle} onChange={(event) => write({ ...pack, milkTitle: event.target.value })} />
            <RemoveButton label={`Remove ${pack.milkTitle || "milk ceremony"}`} onClick={() => write({ ...pack, milkTitle: null })} />
          </div>
          <p className="ed-lead">The longer note is the Paalukachal field under Details. Clear it to leave this section without a paragraph.</p>
        </div>
      ) : null}
      {pack.hostsTamil !== undefined || pack.inviteTamil !== undefined || pack.tamilNote !== undefined ? (
        <div className="ed-fn">
          <p className="ed-lead">Tamil wording</p>
          {pack.hostsTamil !== undefined ? <input className="ed-input" aria-label="Tamil family line" lang="ta" value={pack.hostsTamil} onChange={(event) => write({ ...pack, hostsTamil: event.target.value })} /> : null}
          {pack.inviteTamil !== undefined ? <input className="ed-input" aria-label="Tamil invitation line" lang="ta" value={pack.inviteTamil} onChange={(event) => write({ ...pack, inviteTamil: event.target.value })} /> : null}
          {pack.tamilNote !== undefined ? <textarea className="ed-input" aria-label="Tamil blessing" lang="ta" rows={3} value={pack.tamilNote} onChange={(event) => write({ ...pack, tamilNote: event.target.value })} /> : null}
        </div>
      ) : null}
      {pack.programme ? (
        <>
          {pack.programme.map((item, index) => (
            <div className="ed-fn" key={`programme-${index}`}>
              {index === 0 ? <p className="ed-lead">{item.kick !== undefined ? "The celebration" : "The day’s programme"}</p> : null}
              <div className="ed-fn-head">
                <input className="ed-input" aria-label={item.kick !== undefined ? "Gathering name" : "Programme title"} value={item.title} onChange={(event) => patchList<ProgrammeItem>("programme", index, { title: event.target.value })} />
                <RemoveButton label={`Remove ${item.title || "gathering"}`} onClick={() => dropItem("programme", index)} />
              </div>
              {item.kick !== undefined ? (
                <input className="ed-input" aria-label="Occasion" value={item.kick} onChange={(event) => patchList<ProgrammeItem>("programme", index, { kick: event.target.value })} />
              ) : null}
              {item.tamil !== undefined ? (
                <input className="ed-input" aria-label="Tamil name" lang="ta" value={item.tamil} onChange={(event) => patchList<ProgrammeItem>("programme", index, { tamil: event.target.value })} />
              ) : null}
              <input className="ed-input" aria-label={item.kick !== undefined ? "When" : "Time"} value={item.time} onChange={(event) => patchList<ProgrammeItem>("programme", index, { time: event.target.value })} />
              {item.kick !== undefined ? (
                <input className="ed-input" aria-label="Venue" value={item.text} onChange={(event) => patchList<ProgrammeItem>("programme", index, { text: event.target.value })} />
              ) : (
                <textarea className="ed-input" aria-label="Programme detail" rows={2} value={item.text} onChange={(event) => patchList<ProgrammeItem>("programme", index, { text: event.target.value })} />
              )}
              {item.note !== undefined ? (
                <input className="ed-input" aria-label="Dress" value={item.note} onChange={(event) => patchList<ProgrammeItem>("programme", index, { note: event.target.value })} />
              ) : null}
            </div>
          ))}
          <button type="button" className="ed-add" onClick={() => addItem<ProgrammeItem>("programme", { time: "", title: "New gathering", text: "", ...(pack.inviteTamil !== undefined ? { tamil: "" } : {}), ...(pack.programme?.[0]?.kick !== undefined ? { kick: "", note: "" } : {}) })}>+ Add a gathering</button>
        </>
      ) : null}
      {pack.rooms ? (
        <>
          {pack.rooms.map((item, index) => (
            <div className="ed-fn" key={`room-${index}`}>
              {index === 0 ? <p className="ed-lead">House tour</p> : null}
              <div className="ed-fn-head">
                <input className="ed-input" aria-label="Room name" value={item.name} onChange={(event) => patchList<RoomItem>("rooms", index, { name: event.target.value })} />
                <RemoveButton label={`Remove ${item.name || "room"}`} onClick={() => dropItem("rooms", index)} />
              </div>
              <input className="ed-input" aria-label="Tab" value={item.label} onChange={(event) => patchList<RoomItem>("rooms", index, { label: event.target.value })} />
              <textarea className="ed-input" aria-label="Room" rows={2} value={item.text} onChange={(event) => patchList<RoomItem>("rooms", index, { text: event.target.value })} />
              <input className="ed-input" aria-label="Room note" placeholder="Short note" value={item.note} onChange={(event) => patchList<RoomItem>("rooms", index, { note: event.target.value })} />
            </div>
          ))}
          <button type="button" className="ed-add" onClick={() => addItem<RoomItem>("rooms", { label: "Room", name: "New room", text: "", note: "" })}>+ Add a room</button>
        </>
      ) : null}
      {pack.people ? (
        <>
          {pack.people.map((item, index) => (
            <div className="ed-fn" key={`person-${index}`}>
              {index === 0 ? <p className="ed-lead">{/god/i.test(item.role) ? "Godparents" : "Families"}</p> : null}
              <div className="ed-fn-head">
                <input className="ed-input" aria-label="Name" value={item.name} onChange={(event) => patchList<PersonItem>("people", index, { name: event.target.value })} />
                <RemoveButton label={`Remove ${item.name || "person"}`} onClick={() => dropItem("people", index)} />
              </div>
              <input className="ed-input" aria-label="Role" value={item.role} onChange={(event) => patchList<PersonItem>("people", index, { role: event.target.value })} />
            </div>
          ))}
          <button type="button" className="ed-add" onClick={() => addItem<PersonItem>("people", { name: "New person", role: "" })}>+ Add a person</button>
        </>
      ) : null}
      {pack.facts ? (
        <>
          {pack.facts.map((item, index) => (
            <div className="ed-fn" key={`fact-${index}`}>
              {index === 0 ? <p className="ed-lead">Little facts</p> : null}
              <div className="ed-fn-head">
                <input className="ed-input" aria-label="Fact" value={item.label} onChange={(event) => patchList<FactItem>("facts", index, { label: event.target.value })} />
                <RemoveButton label={`Remove ${item.label || "fact"}`} onClick={() => dropItem("facts", index)} />
              </div>
              <input className="ed-input" aria-label="Answer" value={item.value} onChange={(event) => patchList<FactItem>("facts", index, { value: event.target.value })} />
            </div>
          ))}
          <button type="button" className="ed-add" onClick={() => addItem<FactItem>("facts", { label: "New fact", value: "" })}>+ Add a fact</button>
        </>
      ) : null}
      {pack.wishes ? (
        <>
          {pack.wishes.map((item, index) => (
            <div className="ed-fn" key={`wish-${index}`}>
              {index === 0 ? <p className="ed-lead">Wishes</p> : null}
              <div className="ed-fn-head">
                <input className="ed-input" aria-label="From" value={item.by} onChange={(event) => patchList<WishItem>("wishes", index, { by: event.target.value })} />
                <RemoveButton label={`Remove wish from ${item.by || "guest"}`} onClick={() => dropItem("wishes", index)} />
              </div>
              <textarea className="ed-input" aria-label="Wish" rows={2} value={item.text} onChange={(event) => patchList<WishItem>("wishes", index, { text: event.target.value })} />
            </div>
          ))}
          <button type="button" className="ed-add" onClick={() => addItem<WishItem>("wishes", { text: "", by: "" })}>+ Add a wish</button>
        </>
      ) : null}
      {pack.caption !== undefined && pack.sangeetName === undefined ? (
        <div className="ed-fn">
          <p className="ed-lead">Hashtag</p>
          <input className="ed-input" aria-label="Hashtag" value={pack.caption} onChange={(event) => write({ ...pack, caption: event.target.value })} />
          {pack.instagram !== undefined ? (
            <input className="ed-input" aria-label="Instagram handle" placeholder="@your.handle" value={pack.instagram} onChange={(event) => write({ ...pack, instagram: event.target.value })} />
          ) : null}
        </div>
      ) : null}
      {pack.venueNote !== undefined || pack.venuePhone !== undefined ? (
        <div className="ed-fn">
          <p className="ed-lead">Venue details</p>
          {pack.venueNote !== undefined ? (
            <textarea className="ed-input" aria-label="Venue note" placeholder="Directions, parking or shuttle times" rows={2} value={pack.venueNote} onChange={(event) => write({ ...pack, venueNote: event.target.value })} />
          ) : null}
          {pack.venuePhone !== undefined ? (
            <input className="ed-input" aria-label="Venue phone" type="tel" placeholder="Venue phone (optional)" value={pack.venuePhone} onChange={(event) => write({ ...pack, venuePhone: event.target.value })} />
          ) : null}
        </div>
      ) : null}
      {pack.airport !== undefined ? (
        <div className="ed-fn">
          <p className="ed-lead">Travel, stay and gifts</p>
          <textarea className="ed-input" aria-label="Airport" rows={2} value={pack.airport} onChange={(event) => write({ ...pack, airport: event.target.value })} />
          <textarea className="ed-input" aria-label="Where to stay" rows={2} value={pack.stay ?? ""} onChange={(event) => write({ ...pack, stay: event.target.value })} />
          <textarea className="ed-input" aria-label="Gift note" rows={2} value={pack.gift ?? ""} onChange={(event) => write({ ...pack, gift: event.target.value })} />
        </div>
      ) : null}
      {pack.faqs ? (
        <>
          {pack.faqs.map((item, index) => (
            <div className="ed-fn" key={`faq-${index}`}>
              {index === 0 ? <p className="ed-lead">Questions guests ask</p> : null}
              <div className="ed-fn-head">
                <input className="ed-input" aria-label="Question" value={item.q} onChange={(event) => patchList<FaqItem>("faqs", index, { q: event.target.value })} />
                <RemoveButton label={`Remove ${item.q || "question"}`} onClick={() => dropItem("faqs", index)} />
              </div>
              <textarea className="ed-input" aria-label="Answer" rows={2} value={item.a} onChange={(event) => patchList<FaqItem>("faqs", index, { a: event.target.value })} />
            </div>
          ))}
          <button type="button" className="ed-add" onClick={() => addItem<FaqItem>("faqs", { q: "New question", a: "" })}>+ Add a question</button>
        </>
      ) : null}
    </>
  );
}
