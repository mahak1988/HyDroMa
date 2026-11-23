import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import type { ReactNode } from "react";
import type { BookingRequest } from "@eco-nojin/domain-types";
import { BOOKING_STORAGE_KEY } from "../lib/booking";
import { readPersisted, writePersisted } from "@eco-nojin/utilities";
import { parseBookings } from "../lib/booking-store";

type BookingValue = {
  bookings: BookingRequest[];
  add: (booking: BookingRequest) => void;
  cancel: (id: string) => void;
};

const BookingContext = createContext<BookingValue | null>(null);

function load(): BookingRequest[] {
  const parsed = readPersisted<BookingRequest[]>(BOOKING_STORAGE_KEY, (raw) => parseBookings(raw));
  return parsed ?? [];
}

function persist(bookings: BookingRequest[]): void {
  writePersisted(BOOKING_STORAGE_KEY, bookings);
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