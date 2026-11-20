import { createBrowserRouter } from "react-router-dom";
import { routerBasename } from "@eco-nojin/configuration";
import { TourismLayout } from "./TourismLayout";
import { HostRoute } from "./guards";
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
 * Route registry. `/host` and `/bookings` are supply-side/authenticated and are
 * wrapped in `HostRoute`; previously any visitor could open them.
 */
export const router = createBrowserRouter([
  {
    path: "/",
    element: <TourismLayout />,
    children: [
      { index: true, element: <HomePage /> },
      { path: "destinations", element: <DestinationsPage /> },
      { path: "destinations/:slug", element: <DestinationPage /> },
      { path: "nomadic", element: <NomadicPage /> },
      { path: "nomadic/:slug", element: <NomadicDetailPage /> },
      { path: "stays", element: <StaysPage /> },
      { path: "stays/:slug", element: <StayPage /> },
      { path: "experiences", element: <ExperiencesPage /> },
      { path: "tours", element: <ToursPage /> },
      { path: "experiences/:slug", element: <ExperiencePage /> },
      { path: "events", element: <EventsPage /> },
      { path: "map", element: <MapPage /> },
      { path: "host/signin", element: <HostSignInPage /> },
      {
        element: <HostRoute />,
        children: [
          { path: "host", element: <HostPage /> },
          { path: "bookings", element: <BookingsPage /> },
        ],
      },
      { path: "book/:kind/:slug", element: <BookPage /> },
      { path: "*", element: <NotFoundPage /> },
    ],
  },
], { basename: routerBasename(import.meta.env.BASE_URL) });