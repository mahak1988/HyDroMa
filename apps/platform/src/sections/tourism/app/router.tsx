import { Route, Routes } from "react-router-dom";
import "../styles/index.css";
import { TourismLayout } from "./TourismLayout";
import { HostRoute } from "./guards";
import { BookingProvider } from "../store/bookings";
import { HomePage } from "../pages/HomePage";
import { DestinationsPage } from "../pages/DestinationsPage";
import { DestinationPage } from "../pages/DestinationPage";
import { NomadicPage } from "../pages/NomadicPage";
import { NomadicDetailPage } from "../pages/NomadicDetailPage";
import { StaysPage } from "../pages/StaysPage";
import { StayPage } from "../pages/StayPage";
import { ExperiencesPage } from "../pages/ExperiencesPage";
import { ToursPage } from "../pages/ToursPage";
import { ExperiencePage } from "../pages/ExperiencePage";
import { EventsPage } from "../pages/EventsPage";
import { MapPage } from "../pages/MapPage";
import { HostPage } from "../pages/HostPage";
import { HostSignInPage } from "../pages/HostSignInPage";
import { BookPage } from "../pages/BookPage";
import { BookingsPage } from "../pages/BookingsPage";
import { NotFoundPage } from "../pages/NotFoundPage";

/**
 * Tourism section router (lazy, internal to the platform SPA).
 *
 * The platform's `/tourism/*` route renders this module behind Suspense, so the
 * whole section — pages, content and stores — is its own chunk. `/host` and
 * `/bookings` remain supply-side and gated by the real session.
 */
export default function TourismSectionRouter() {
  return (
    <BookingProvider>
      <Routes>
        <Route element={<TourismLayout />}>
          <Route index element={<HomePage />} />
          <Route path="destinations" element={<DestinationsPage />} />
          <Route path="destinations/:slug" element={<DestinationPage />} />
          <Route path="nomadic" element={<NomadicPage />} />
          <Route path="nomadic/:slug" element={<NomadicDetailPage />} />
          <Route path="stays" element={<StaysPage />} />
          <Route path="stays/:slug" element={<StayPage />} />
          <Route path="experiences" element={<ExperiencesPage />} />
          <Route path="tours" element={<ToursPage />} />
          <Route path="experiences/:slug" element={<ExperiencePage />} />
          <Route path="events" element={<EventsPage />} />
          <Route path="map" element={<MapPage />} />
          <Route path="host/signin" element={<HostSignInPage />} />
          <Route element={<HostRoute />}>
            <Route path="host" element={<HostPage />} />
            <Route path="bookings" element={<BookingsPage />} />
          </Route>
          <Route path="book/:kind/:slug" element={<BookPage />} />
          <Route path="*" element={<NotFoundPage />} />
        </Route>
      </Routes>
    </BookingProvider>
  );
}
