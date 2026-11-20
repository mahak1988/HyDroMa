import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import type { ReactNode } from "react";
import type { BookingRequest } from "@eco-nojin/domain-types";
import { BOOKING_STORAGE_KEY } from "../lib/booking";
import { parseBookings } from "../lib/booking-store";

type BookingValue = {
  bookings: BookingRequest[];
  add: (booking: BookingRequest) => void;
  cancel: (id: string) => void;
};

const BookingContext = createContext<BookingValue | null>(null);

function load(): BookingRequest[] {
  try {
    const raw = window.localStorage.getItem(BOOKING_STORAGE_KEY);
    if (!raw) return [];
    // Invalid records are dropped here and overwritten on the next persist.
    return parseBookings(JSON.parse(raw));
  } catch {
    return [];
  }
}

function persist(bookings: BookingRequest[]): void {
  try {
    window.localStorage.setItem(BOOKING_STORAGE_KEY, JSON.stringify(bookings));
  } catch {
    // Storage can be blocked; the demo still works for the current session.
  }
}

export function BookingProvider({ children }: { children: ReactNode }) {
  const [bookings, setBookings] = useState<BookingRequest[]>(load);

  useEffect(() => {
    persist(bookings);
  }, [bookings]);

  const add = useCallback((booking: BookingRequest) => {
    setBookings((current) => [booking, ...current]);
  }, []);

  const cancel = useCallback((id: string) => {
    setBookings((current) => current.filter((booking) => booking.id !== id));
  }, []);

  const value = useMemo<BookingValue>(() => ({ bookings, add, cancel }), [bookings, add, cancel]);
  return <BookingContext.Provider value={value}>{children}</BookingContext.Provider>;
}

export function useBookings(): BookingValue {
  const value = useContext(BookingContext);
  if (!value) throw new Error("useBookings must be used inside BookingProvider");
  return value;
}