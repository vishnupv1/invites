import type { EventId } from "../types";

export type EventDef = {
  id: EventId;
  label: string;
  cardLabel: string;
  detailLabel: string;
  namesLabel: string;
  hostsLabel: string;
  titleLabel: string;
};

export const EVENTS: EventDef[] = [
  {
    id: "marriage",
    label: "Marriage",
    cardLabel: "Marriage",
    detailLabel: "",
    namesLabel: "Couple",
    hostsLabel: "Families",
    titleLabel: "Ceremony line",
  },
  {
    id: "reception",
    label: "Marriage reception",
    cardLabel: "Wedding reception",
    detailLabel: "After the ceremony",
    namesLabel: "Couple",
    hostsLabel: "Hosted by",
    titleLabel: "Reception line",
  },
  {
    id: "birthday",
    label: "Birthday",
    cardLabel: "Birthday",
    detailLabel: "Turning",
    namesLabel: "Guest of honour",
    hostsLabel: "Hosted by",
    titleLabel: "Party line",
  },
  {
    id: "anniversary",
    label: "Anniversary",
    cardLabel: "Anniversary",
    detailLabel: "Years together",
    namesLabel: "Couple",
    hostsLabel: "Hosted by",
    titleLabel: "Celebration line",
  },
  {
    id: "engagement",
    label: "Engagement",
    cardLabel: "Engagement",
    detailLabel: "",
    namesLabel: "Couple",
    hostsLabel: "Families",
    titleLabel: "Announcement",
  },
  {
    id: "housewarming",
    label: "Housewarming",
    cardLabel: "Housewarming",
    detailLabel: "",
    namesLabel: "Household",
    hostsLabel: "Hosted by",
    titleLabel: "Gathering line",
  },
];

export function getEvent(id: string | undefined) {
  return EVENTS.find((event) => event.id === id) ?? EVENTS[0];
}
