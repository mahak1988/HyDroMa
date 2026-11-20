import type { BookingRequest } from "@eco-nojin/domain-types";
import { isValidIsoDate } from "./time";

const STATUSES = new Set(["requested", "pending-host", "confirmed", "declined", "cancelled"]);
const KINDS = new Set(["stay", "experience"]);
/** Upper bound for a demo amount in minor units (1e12). */
const MAX_AMOUNT_MINOR = 1_000_000_000_000;

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function isNonEmptyString(value: unknown): value is string {
  return typeof value === "string" && value.trim().length > 0;
}

function isCurrencyCode(value: unknown): value is string {
  return typeof value === "string" && /^[A-Za-z]{3}$/.test(value);
}

function isMoney(value: unknown): value is { amountMinor: number; currency: string } {
  if (!isRecord(value)) return false;
  const amount = value.amountMinor;
  const currency = value.currency;
  return (
    typeof amount === "number" &&
    Number.isSafeInteger(amount) &&
    amount >= 0 &&
    amount <= MAX_AMOUNT_MINOR &&
    isCurrencyCode(currency)
  );
}

/**
 * Validate one persisted booking. LocalStorage is user-controlled and may be
 * stale or corrupt, so every field required by the UI must be present and
 * well-formed before the record enters operational state.
 */
export function isBookingRequest(value: unknown): value is BookingRequest {
  if (!isRecord(value)) return false;
  if (value.demo !== true) return false;
  if (!isNonEmptyString(value.id) || !isNonEmptyString(value.targetId)) return false;
  if (typeof value.kind !== "string" || !KINDS.has(value.kind)) return false;
  if (typeof value.status !== "string" || !STATUSES.has(value.status)) return false;
  if (typeof value.startDate !== "string" || typeof value.endDate !== "string") return false;
  if (!isValidIsoDate(value.startDate) || !isValidIsoDate(value.endDate)) return false;
  if (value.startDate > value.endDate) return false;
  if (typeof value.guests !== "number" || !Number.isInteger(value.guests) || value.guests < 1) return false;
  if (!isMoney(value.quote)) return false;
  if (!isNonEmptyString(value.createdAt)) return false;
  return true;
}

/**
 * Filter an unknown parsed value to valid bookings. Invalid records are
 * dropped; valid records are returned unchanged (same object identity).
 */
export function parseBookings(raw: unknown): BookingRequest[] {
  if (!Array.isArray(raw)) return [];
  return raw.filter(isBookingRequest);
}