import { describe, expect, it } from "vitest";
import { DESTINATIONS, EXPERIENCES, NOMADIC_COMMUNITIES, STAYS, quoteStay } from "../../src/data/tourism";
import { availableOn, hasAvailability, minAvailable } from "../../src/lib/availability";
import { makeBooking, validateExperienceRequest, validateStayRequest } from "../../src/lib/booking";
import { activeOverlaps, addDays, isPublicGeometry, isSeasonActive, nightsBetween } from "../../src/lib/time";
import { pick } from "../../src/lib/text";
import { en } from "../../src/content/en";
import { fa } from "../../src/content/fa";
import { ar } from "../../src/content/ar";

const taleghan = NOMADIC_COMMUNITIES.find((item) => item.slug === "taleghan-migration")!;
const kondorStay = STAYS.find((item) => item.slug === "kondor-homestay")!;
const closedExperience = EXPERIENCES.find((item) => item.bookingStatus === "closed")!;

describe("time windows", () => {
  it("counts nights between ISO dates and never returns a negative", () => {
    expect(nightsBetween("2026-06-01", "2026-06-03")).toBe(2);
    expect(nightsBetween("2026-06-03", "2026-06-01")).toBe(0);
    expect(addDays("2026-06-01", 21)).toBe("2026-06-22");
  });

  it("applies both validity and recurring months", () => {
    const summer = taleghan.zones.find((zone) => zone.kind === "summer")!;
    expect(isSeasonActive("2026-06-15", summer)).toBe(true);
    expect(isSeasonActive("2026-01-15", summer)).toBe(false);
    const winter = taleghan.zones.find((zone) => zone.kind === "winter")!;
    expect(isSeasonActive("2027-01-15", winter)).toBe(true);
    expect(isSeasonActive("2026-06-15", winter)).toBe(false);
  });

  it("keeps sensitive geometry out of the public set", () => {
    const sensitive = taleghan.zones.find((zone) => zone.sensitivity === "sensitive")!;
    expect(isPublicGeometry(sensitive.sensitivity)).toBe(false);
    expect(taleghan.zones.some((zone) => zone.sensitivity === "sensitive")).toBe(true);
  });

  it("reports overlapping spring and summer zones on 15 June 2026", () => {
    const pairs = activeOverlaps(taleghan.zones, "2026-06-15");
    const ids = pairs.flatMap((pair) => [pair.a.id, pair.b.id]);
    expect(ids).toContain("zone-spring");
    expect(ids).toContain("zone-summer");
    const january = activeOverlaps(taleghan.zones, "2026-01-15");
    expect(january).toHaveLength(0);
  });

  it("detects overlap when the same zones are public", () => {
    // The algorithm is independent of visibility policy; the public projection
    // filters review-required zones before calling it.
    const publicZones = taleghan.zones.map((zone) => ({ ...zone, sensitivity: "public" as const }));
    const pairs = activeOverlaps(publicZones, "2026-06-15");
    const ids = pairs.flatMap((pair) => [pair.a.id, pair.b.id]);
    expect(ids).toContain("zone-spring");
    expect(ids).toContain("zone-summer");
  });

  it("withholds the whole record when consent is not published", () => {
    const zagros = NOMADIC_COMMUNITIES.find((item) => item.slug === "zagros-migration")!;
    expect(zagros.consent.published).toBe(false);
    expect(zagros.zones.every((zone) => !isPublicGeometry(zone.sensitivity))).toBe(true);
  });
});

describe("availability", () => {
  const stay = kondorStay;

  it("derives available units from the calendar", () => {
    const day = stay.calendar[0]!;
    expect(availableOn(stay, day.date)).toBe(day.total - day.booked);
    expect(availableOn(stay, "1999-01-01")).toBe(0);
  });

  it("requires every night in the range to fit the guests", () => {
    const start = stay.calendar[0]!.date;
    const end = addDays(start, 2);
    expect(hasAvailability(stay, start, end, 1)).toBe(true);
    expect(hasAvailability(stay, start, end, 99)).toBe(false);
    expect(hasAvailability(stay, start, start, 1)).toBe(false);
  });

  it("computes the minimum availability across the range", () => {
    const start = stay.calendar[0]!.date;
    const end = addDays(start, 5);
    expect(minAvailable(stay, start, end)).toBeGreaterThanOrEqual(0);
  });
});

describe("booking requests", () => {
  const start = kondorStay.calendar[0]!.date;
  const end = addDays(start, 2);

  it("rejects an invalid range", () => {
    const result = validateStayRequest(kondorStay, end, start, 2);
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.reason).toBe("invalid-dates");
  });

  it("rejects guests above the published capacity", () => {
    const result = validateStayRequest(kondorStay, start, end, kondorStay.capacity + 1);
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.reason).toBe("too-many-guests");
  });

  it("quotes nights at the published nightly rate without floats", () => {
    const result = validateStayRequest(kondorStay, start, end, 1);
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.quote.nights).toBe(2);
      expect(result.quote.amountMinor).toBe(quoteStay(kondorStay, start, end, 1).amountMinor);
    }
  });

  it("marks a closed experience as closed", () => {
    const result = validateExperienceRequest(closedExperience, 1);
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.reason).toBe("closed");
  });

  it("rejects a group larger than the experience capacity", () => {
    const experience = EXPERIENCES.find((item) => item.bookingStatus !== "closed")!;
    const result = validateExperienceRequest(experience, experience.capacity + 1);
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.reason).toBe("too-many-guests");
  });

  it("always records a demo booking", () => {
    const booking = makeBooking("stay", kondorStay.id, start, end, 2, {
      amountMinor: 8_400_000,
      currency: "IRR",
      nights: 2,
      guests: 2,
      breakdown: [],
    });
    expect(booking.demo).toBe(true);
    expect(booking.status).toBe("requested");
  });
});

describe("data integrity", () => {
  it("links every destination to a landscape record", () => {
    expect(DESTINATIONS.every((destination) => destination.landscapeRef !== null)).toBe(true);
  });

  it("never references a missing destination, stay or experience", () => {
    const destinationIds = new Set(DESTINATIONS.map((item) => item.id));
    const stayIds = new Set(STAYS.map((item) => item.id));
    const experienceIds = new Set(EXPERIENCES.map((item) => item.id));
    for (const stay of STAYS) {
      if (stay.destinationRef) expect(destinationIds.has(stay.destinationRef)).toBe(true);
    }
    for (const experience of EXPERIENCES) {
      for (const id of experience.destinationRefs) expect(destinationIds.has(id)).toBe(true);
    }
    for (const destination of DESTINATIONS) {
      for (const id of destination.stayIds) expect(stayIds.has(id)).toBe(true);
      for (const id of destination.experienceIds) expect(experienceIds.has(id)).toBe(true);
    }
  });

  it("covers every destination kind with at least one record", () => {
    const kinds = new Set(DESTINATIONS.map((item) => item.kind));
    expect(kinds.size).toBe(11);
  });

  it("provides localized text in all three locales", () => {
    for (const destination of DESTINATIONS) {
      expect(destination.name.fa.length).toBeGreaterThan(0);
      expect(destination.name.ar.length).toBeGreaterThan(0);
      expect(destination.summary.en.length).toBeGreaterThan(0);
    }
    expect(pick(taleghan.name, "fa")).toBe(taleghan.name.fa);
    expect(pick(taleghan.name, "ar")).toBe(taleghan.name.ar);
    expect(pick(taleghan.name, "de")).toBe(taleghan.name.en);
  });
});

function flatten(value: unknown, prefix = ""): string[] {
  if (typeof value !== "object" || value === null) return [prefix];
  return Object.entries(value as Record<string, unknown>).flatMap(([key, child]) =>
    flatten(child, prefix ? `${prefix}.${key}` : key),
  );
}

describe("content dictionaries", () => {
  const enKeys = flatten(en).sort();
  const faKeys = flatten(fa).sort();
  const arKeys = flatten(ar).sort();

  it("keeps fa and ar structurally identical to en", () => {
    expect(faKeys).toEqual(enKeys);
    expect(arKeys).toEqual(enKeys);
  });

  it("never leaves an empty translation string", () => {
    for (const [key, value] of Object.entries(en)) {
      expect(key.length).toBeGreaterThan(0);
      if (typeof value === "string") expect(value.length).toBeGreaterThan(0);
    }
  });
});
