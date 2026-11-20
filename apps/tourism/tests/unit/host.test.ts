import { describe, expect, it } from "vitest";
import type { BookingRequest } from "@eco-nojin/domain-types";
import { HOSTS } from "../../src/data/tourism";
import { bookingsForHost } from "../../src/lib/host";

function booking(id: string, kind: "stay" | "experience", targetId: string): BookingRequest {
  return {
    id,
    kind,
    targetId,
    startDate: "2026-06-01",
    endDate: "2026-06-03",
    guests: 2,
    status: "requested",
    quote: { amountMinor: 1_000_000, currency: "IRR" },
    createdAt: "2026-11-19T08:00:00.000Z",
    demo: true,
  };
}

const kondor = HOSTS.find((host) => host.sellerId === "sel-kondor")!;
const zagros = HOSTS.find((host) => host.sellerId === "sel-zagros-farm")!;

const bookings = [
  booking("req-kondor-stay", "stay", "stay-kondor-homestay"),
  // `exp-harvest-walk` is shared by Kondor and Zagros; use a Kondor-only one.
  booking("req-kondor-exp", "experience", "exp-weaving"),
  booking("req-zagros-stay", "stay", "stay-zagros-farm-stay"),
];

describe("bookingsForHost", () => {
  it("returns only the selected host's stays and experiences", () => {
    const result = bookingsForHost(bookings, kondor);
    expect(result.map((item) => item.id)).toEqual(["req-kondor-stay", "req-kondor-exp"]);
  });

  it("does not leak another host's bookings", () => {
    const result = bookingsForHost(bookings, zagros);
    expect(result.map((item) => item.id)).toEqual(["req-zagros-stay"]);
    expect(result.some((item) => item.targetId === "stay-kondor-homestay")).toBe(false);
  });

  it("returns an empty list for a host without owned assets", () => {
    const emptyHost = { ...kondor, stayIds: [], experienceIds: [] };
    expect(bookingsForHost(bookings, emptyHost)).toEqual([]);
  });
});