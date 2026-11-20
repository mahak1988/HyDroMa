/**
 * Tourism contracts shared by the tourism app (and later services).
 *
 * Design rules:
 * - Money is always minor units + ISO currency (reused from commerce).
 * - Villages, rangelands and nomadic communities are NOT duplicated here: every
 *   record carries an optional `landscapeRef` pointing at the Landscape
 *   Management record. Tourism only adds the visitor-facing projection.
 * - A nomadic territory is time-dependent: every zone, route and camp has an
 *   optional validity window and an optional recurring month set, plus an
 *   access level and a sensitivity level.
 * - Sensitive locations are never published without consent: `sensitivity` is
 *   part of the record so the UI can suppress geometry and routes.
 * - Primary display fields are `LocalizedText` so names and descriptions are
 *   localizable per locale (fa/ar/en today, more later without code changes).
 */

import type { Money, VerificationStatus } from "./commerce";

export type LngLat = [number, number];

/** Localized display text. Every locale must be present; fallback is en. */
export type LocalizedText = { en: string; fa: string; ar: string };

export type GeoGeometry =
  | { type: "Point"; coordinates: LngLat }
  | { type: "LineString"; coordinates: LngLat[] }
  | { type: "Polygon"; coordinates: LngLat[][] };

/** Inclusive ISO date range (YYYY-MM-DD). */
export type ValidityWindow = { from: string; to: string };

export type AccessLevel = "open" | "guided-only" | "permit" | "closed";
export type Sensitivity = "public" | "review-required" | "sensitive";

export type DestinationKind =
  | "village"
  | "nomadic-territory"
  | "rangeland"
  | "farm"
  | "natural-area"
  | "forest"
  | "mountain"
  | "watershed"
  | "cultural-area"
  | "historic-area"
  | "protected-area";

export type DestinationStatus = "demo";

export type Destination = {
  id: string;
  slug: string;
  kind: DestinationKind;
  name: LocalizedText;
  summary: LocalizedText;
  description: LocalizedText;
  /** Landscape Management record reference (never a duplicated village record). */
  landscapeRef: string | null;
  country: string;
  region: string;
  center: LngLat;
  /** Generalized public geometry; never a sensitive boundary. */
  geometry: GeoGeometry | null;
  bestSeason: LocalizedText | null;
  naturalFeatures: string[];
  culturalFeatures: string[];
  facilities: string[];
  /** Environmental and safety warnings shown to visitors. */
  warnings: string[];
  /** Aggregated community note; no household-level PII. */
  community: LocalizedText;
  access: string;
  experienceIds: string[];
  stayIds: string[];
  hostIds: string[];
  artworkSeed: number;
  status: DestinationStatus;
};

export type NomadicZoneKind = "summer" | "winter" | "spring" | "autumn" | "camp" | "corridor";

export type NomadicZone = {
  id: string;
  kind: NomadicZoneKind;
  name: LocalizedText;
  geometry: GeoGeometry;
  /** Explicit validity window for the demo season. */
  validity: ValidityWindow | null;
  /** Recurring months (1-12) when the zone is used every year; null = not seasonal. */
  months: number[] | null;
  access: AccessLevel;
  sensitivity: Sensitivity;
  capacity: number | null;
  note: LocalizedText | null;
};

export type MigrationRoute = {
  id: string;
  name: LocalizedText;
  path: LngLat[];
  validity: ValidityWindow | null;
  months: number[] | null;
  access: AccessLevel;
  sensitivity: Sensitivity;
  note: LocalizedText | null;
};

export type NomadicCamp = {
  id: string;
  name: LocalizedText;
  center: LngLat;
  validity: ValidityWindow | null;
  months: number[] | null;
  access: AccessLevel;
  sensitivity: Sensitivity;
  note: LocalizedText | null;
};

export type NomadicCommunity = {
  id: string;
  slug: string;
  name: LocalizedText;
  summary: LocalizedText;
  description: LocalizedText;
  landscapeRef: string | null;
  country: string;
  region: string;
  center: LngLat;
  lifestyle: string[];
  zones: NomadicZone[];
  routes: MigrationRoute[];
  camps: NomadicCamp[];
  hostIds: string[];
  /** Publication consent from the community; sensitive data stays hidden without it. */
  consent: { published: boolean; note: LocalizedText };
  artworkSeed: number;
  status: DestinationStatus;
};

export type StayKind =
  | "homestay"
  | "rural-stay"
  | "nomadic-stay"
  | "farm-stay"
  | "nature-camp"
  | "local-stay"
  | "family-stay";

export type RoomType = {
  id: string;
  name: string;
  /** Guests per unit. */
  capacity: number;
  /** Number of units of this type. */
  units: number;
  price: Money;
};

export type AvailabilityDay = {
  /** ISO date (YYYY-MM-DD). */
  date: string;
  total: number;
  booked: number;
};

export type Stay = {
  id: string;
  slug: string;
  kind: StayKind;
  name: LocalizedText;
  summary: LocalizedText;
  description: LocalizedText;
  destinationRef: string | null;
  landscapeRef: string | null;
  hostId: string | null;
  country: string;
  region: string;
  center: LngLat;
  /** Maximum guests across all room types. */
  capacity: number;
  rooms: RoomType[];
  amenities: string[];
  houseRules: string[];
  services: string[];
  price: Money;
  cancellation: string;
  access: string;
  calendar: AvailabilityDay[];
  artworkSeed: number;
  status: DestinationStatus;
};

export type ExperienceType =
  | "nature"
  | "agri"
  | "nomadic"
  | "cultural"
  | "scientific"
  | "educational"
  | "farm-visit"
  | "restoration"
  | "wildlife"
  | "local-production"
  | "photography"
  | "family";

export type Difficulty = "easy" | "moderate" | "challenging";
export type ExperienceBookingStatus = "open" | "request" | "closed";

export type Experience = {
  id: string;
  slug: string;
  type: ExperienceType;
  title: LocalizedText;
  summary: LocalizedText;
  description: LocalizedText;
  /** One experience can connect to several destinations. */
  destinationRefs: string[];
  hostId: string | null;
  durationHours: number;
  capacity: number;
  season: string | null;
  difficulty: Difficulty;
  requirements: string[];
  equipment: string[];
  safety: string[];
  price: Money;
  bookingStatus: ExperienceBookingStatus;
  artworkSeed: number;
  status: DestinationStatus;
};

export type TourismEventType =
  | "festival"
  | "ritual"
  | "agri-event"
  | "nomadic-event"
  | "exhibition"
  | "workshop"
  | "environmental";

export type RegistrationStatus = "open" | "waitlist" | "closed";

export type TourismEvent = {
  id: string;
  slug: string;
  type: TourismEventType;
  title: LocalizedText;
  summary: LocalizedText;
  /** ISO timestamps; the display calendar is a presentation concern. */
  startsAt: string;
  endsAt: string;
  timezone: string;
  location: string;
  organizerId: string | null;
  capacity: number;
  conditions: string;
  registration: RegistrationStatus;
  artworkSeed: number;
  status: DestinationStatus;
};

/**
 * A host is a tourism provider. The canonical seller record lives in the
 * marketplace domain (`Seller`); tourism only keeps the presentation fields it
 * needs and references the seller by id. No Product/Seller model is duplicated.
 */
export type TourismHost = {
  sellerId: string;
  name: LocalizedText;
  bio: LocalizedText;
  languages: string[];
  destinationIds: string[];
  stayIds: string[];
  experienceIds: string[];
  verification: VerificationStatus;
  since: string;
  /** Marketplace product ids offered by this host; resolved by the marketplace. */
  localProductRefs: string[];
};

export type BookingKind = "stay" | "experience";
export type BookingStatus = "requested" | "pending-host" | "confirmed" | "declined" | "cancelled";

export type BookingRequest = {
  id: string;
  kind: BookingKind;
  targetId: string;
  startDate: string;
  endDate: string;
  guests: number;
  status: BookingStatus;
  quote: Money;
  createdAt: string;
  /** Always true in this phase: no backend, no payment, no host confirmation. */
  demo: true;
};

export type BookingQuote = {
  amountMinor: number;
  currency: string;
  nights: number;
  guests: number;
  breakdown: Array<{ label: string; amountMinor: number }>;
};