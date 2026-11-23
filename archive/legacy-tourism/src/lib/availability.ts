import type { AvailabilityDay, Stay } from "@eco-nojin/domain-types";
import { addDays, nightsBetween } from "./time";

/** Units still available on one calendar day; never negative. */
export function availableUnits(day: AvailabilityDay | undefined): number {
  if (!day) return 0;
  return Math.max(0, day.total - day.booked);
}

export function dayFor(stay: Stay, date: string): AvailabilityDay | undefined {
  return stay.calendar.find((day) => day.date === date);
}

/** Availability for a date; a date outside the demo calendar has no published availability. */
export function availableOn(stay: Stay, date: string): number {
  return availableUnits(dayFor(stay, date));
}

/** Every ISO date in [start, end). */
export function eachDate(start: string, end: string): string[] {
  const nights = nightsBetween(start, end);
  return Array.from({ length: nights }, (_, index) => addDays(start, index));
}

/** Minimum available units across the requested range. 0 means no availability. */
export function minAvailable(stay: Stay, start: string, end: string): number {
  const dates = eachDate(start, end);
  if (dates.length === 0) return 0;
  return Math.min(...dates.map((date) => availableOn(stay, date)));
}

export function hasAvailability(stay: Stay, start: string, end: string, guests: number): boolean {
  const nights = nightsBetween(start, end);
  if (nights <= 0) return false;
  if (guests <= 0) return false;
  return minAvailable(stay, start, end) >= guests;
}

/** Consecutive days from a start date with at least `guests` available. */
export function firstAvailableRange(stay: Stay, from: string, guests: number, nights = 1): string | null {
  for (let offset = 0; offset < stay.calendar.length; offset += 1) {
    const start = addDays(from, offset);
    const end = addDays(start, nights);
    if (hasAvailability(stay, start, end, guests)) return start;
  }
  return null;
}