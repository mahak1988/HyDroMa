import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Link } from "react-router-dom";
import {
  createBaseStyle,
  mountSpatialMap,
  Popup,
  resolveMapColors,
  type Feature,
  type FeatureCollection,
  type MapLayerMouseEvent,
  type SpatialMap,
} from "@eco-nojin/spatial";
import type { DestinationKind, ExperienceType, GeoGeometry, LngLat } from "@eco-nojin/domain-types";
import { useI18n } from "@eco-nojin/i18n";
import { DESTINATIONS, EXPERIENCES, NOMADIC_COMMUNITIES, STAYS, destinationById } from "../data/tourism";
import { isPublicGeometry, isSeasonActive } from "../lib/time";
import { pick } from "../lib/text";
import { useTourism } from "../content";

type LayerKey = "destinations" | "stays" | "experiences" | "routes" | "camps";

type Props = {
  asOf: string;
  destinationKind?: DestinationKind | "";
  experienceType?: ExperienceType | "";
  className?: string;
};

type MapContainer = HTMLDivElement & { __spatialMap?: SpatialMap };

const EMPTY: FeatureCollection = { type: "FeatureCollection", features: [] };

const LAYER_VISIBILITY: Record<LayerKey, string[]> = {
  destinations: ["dest-points"],
  stays: ["stay-points"],
  experiences: ["exp-points"],
  routes: ["routes-line"],
  camps: ["camp-points", "zones-fill", "zones-line"],
};

const LAYER_IDS = ["zones-fill", "zones-line", "routes-line", "dest-points", "stay-points", "exp-points", "camp-points"];

function pointFeature(position: LngLat, properties: Record<string, string | number>): Feature {
  return { type: "Feature", properties, geometry: { type: "Point", coordinates: position } };
}

function polygonFeature(geometry: GeoGeometry, properties: Record<string, string | number>): Feature | null {
  if (geometry.type === "Point") return pointFeature(geometry.coordinates, properties);
  if (geometry.type === "LineString") {
    return { type: "Feature", properties, geometry: { type: "LineString", coordinates: geometry.coordinates } };
  }
  if (geometry.type === "Polygon") {
    return { type: "Feature", properties, geometry: { type: "Polygon", coordinates: geometry.coordinates } };
  }
  return null;
}

function lineFeature(path: LngLat[], properties: Record<string, string | number>): Feature | null {
  if (path.length < 2) return null;
  return { type: "Feature", properties, geometry: { type: "LineString", coordinates: path } };
}

function buildDestinations(locale: string, kind: DestinationKind | ""): FeatureCollection {
  return {
    type: "FeatureCollection",
    features: DESTINATIONS.filter((destination) => !kind || destination.kind === kind).map((destination) =>
      pointFeature(destination.center, {
        id: destination.id,
        name: pick(destination.name, locale),
        kind: destination.kind,
        ref: `/destinations/${destination.slug}`,
      }),
    ),
  };
}

function buildStays(locale: string, kind: DestinationKind | ""): FeatureCollection {
  const visibleDestinationIds = kind
    ? new Set(DESTINATIONS.filter((destination) => destination.kind === kind).map((destination) => destination.id))
    : null;
  return {
    type: "FeatureCollection",
    features: STAYS.filter((stay) => !visibleDestinationIds || (stay.destinationRef && visibleDestinationIds.has(stay.destinationRef))).map((stay) =>
      pointFeature(stay.center, {
        id: stay.id,
        name: pick(stay.name, locale),
        kind: stay.kind,
        ref: `/stays/${stay.slug}`,
      }),
    ),
  };
}

/**
 * Experiences are shown at the centre of their first destination. The domain
 * model has no separate coordinate: the destination owns the place.
 */
function buildExperiences(locale: string, type: ExperienceType | ""): FeatureCollection {
  const features: Feature[] = [];
  for (const experience of EXPERIENCES) {
    if (type && experience.type !== type) continue;
    const destination = experience.destinationRefs.map(destinationById).find(Boolean);
    if (!destination) continue;
    features.push(
      pointFeature(destination.center, {
        id: experience.id,
        name: pick(experience.title, locale),
        kind: experience.type,
        ref: `/experiences/${experience.slug}`,
      }),
    );
  }
  return { type: "FeatureCollection", features };
}

function buildRoutes(asOf: string, locale: string): FeatureCollection {
  const features: Feature[] = [];
  for (const community of NOMADIC_COMMUNITIES) {
    if (!community.consent.published) continue;
    for (const route of community.routes) {
      if (!isPublicGeometry(route.sensitivity)) continue;
      if (!isSeasonActive(asOf, route)) continue;
      const feature = lineFeature(route.path, {
        id: route.id,
        name: pick(route.name, locale),
        kind: "route",
        community: pick(community.name, locale),
      });
      if (feature) features.push(feature);
    }
  }
  return { type: "FeatureCollection", features };
}

function buildCamps(asOf: string, locale: string): FeatureCollection {
  const features: Feature[] = [];
  for (const community of NOMADIC_COMMUNITIES) {
    if (!community.consent.published) continue;
    for (const camp of community.camps) {
      if (!isPublicGeometry(camp.sensitivity)) continue;
      if (!isSeasonActive(asOf, camp)) continue;
      features.push(
        pointFeature(camp.center, {
          id: camp.id,
          name: pick(camp.name, locale),
          kind: "camp",
          community: pick(community.name, locale),
        }),
      );
    }
  }
  return { type: "FeatureCollection", features };
}

function buildZones(asOf: string, locale: string): FeatureCollection {
  const features: Feature[] = [];
  for (const community of NOMADIC_COMMUNITIES) {
    if (!community.consent.published) continue;
    for (const zone of community.zones) {
      if (!isPublicGeometry(zone.sensitivity)) continue;
      if (!isSeasonActive(asOf, zone)) continue;
      const feature = polygonFeature(zone.geometry, {
        id: zone.id,
        name: pick(zone.name, locale),
        kind: zone.kind,
        community: pick(community.name, locale),
      });
      if (feature) features.push(feature);
    }
  }
  return { type: "FeatureCollection", features };
}

function setSource(map: SpatialMap, id: string, data: FeatureCollection): void {
  const source = map.getSource(id) as unknown as { setData?: (value: FeatureCollection) => void } | undefined;
  source?.setData?.(data);
}

export function TourismMap({ asOf, destinationKind = "", experienceType = "", className }: Props) {
  const { locale } = useI18n();
  const c = useTourism();
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<SpatialMap | null>(null);
  const readyRef = useRef(false);
  const [selected, setSelected] = useState<{ name: string; kind: string; ref?: string } | null>(null);
  const [visible, setVisible] = useState<Record<LayerKey, boolean>>({
    destinations: true,
    stays: true,
    experiences: true,
    routes: true,
    camps: true,
  });

  const sources = useMemo(
    () => ({
      zones: buildZones(asOf, locale),
      routes: buildRoutes(asOf, locale),
      destinations: buildDestinations(locale, destinationKind),
      stays: buildStays(locale, destinationKind),
      experiences: buildExperiences(locale, experienceType),
      camps: buildCamps(asOf, locale),
    }),
    [asOf, destinationKind, experienceType, locale],
  );
  const sourcesRef = useRef(sources);
  sourcesRef.current = sources;

  const visibleRef = useRef(visible);
  visibleRef.current = visible;

  const ariaLabelRef = useRef(c.map.title);
  ariaLabelRef.current = c.map.title;

  const applySources = useCallback((map: SpatialMap) => {
    const data = sourcesRef.current;
    setSource(map, "zones", data.zones);
    setSource(map, "routes", data.routes);
    setSource(map, "destinations", data.destinations);
    setSource(map, "stays", data.stays);
    setSource(map, "experiences", data.experiences);
    setSource(map, "camps", data.camps);
  }, []);

  const applyVisibility = useCallback((map: SpatialMap) => {
    const state = visibleRef.current;
    for (const [key, layerIds] of Object.entries(LAYER_VISIBILITY)) {
      const show = state[key as LayerKey] ? "visible" : "none";
      for (const id of layerIds) {
        if (map.getLayer(id)) map.setLayoutProperty(id, "visibility", show);
      }
    }
  }, []);

  // Mount once. Data changes update sources in place; they never destroy the
  // WebGL context, the worker pool, the camera or the visibility state.
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const colors = resolveMapColors();
    const style = createBaseStyle(colors);
    style.sources = {
      zones: { type: "geojson", data: EMPTY },
      routes: { type: "geojson", data: EMPTY },
      destinations: { type: "geojson", data: EMPTY },
      stays: { type: "geojson", data: EMPTY },
      experiences: { type: "geojson", data: EMPTY },
      camps: { type: "geojson", data: EMPTY },
    };
    style.layers.push(
      {
        id: "zones-fill",
        type: "fill",
        source: "zones",
        paint: { "fill-color": colors.primary, "fill-opacity": 0.16 },
      },
      {
        id: "zones-line",
        type: "line",
        source: "zones",
        paint: { "line-color": colors.primary, "line-width": 1.4, "line-opacity": 0.8 },
      },
      {
        id: "routes-line",
        type: "line",
        source: "routes",
        paint: { "line-color": colors.warning, "line-width": 2.2, "line-dasharray": [2, 1.4] },
      },
      {
        id: "dest-points",
        type: "circle",
        source: "destinations",
        paint: {
          "circle-radius": 6,
          "circle-color": colors.primary,
          "circle-stroke-width": 2,
          "circle-stroke-color": "#ffffff",
        },
      },
      {
        id: "stay-points",
        type: "circle",
        source: "stays",
        paint: {
          "circle-radius": 5,
          "circle-color": colors.info,
          "circle-stroke-width": 2,
          "circle-stroke-color": "#ffffff",
        },
      },
      {
        id: "camp-points",
        type: "circle",
        source: "camps",
        paint: {
          "circle-radius": 4,
          "circle-color": colors.success,
          "circle-stroke-width": 1.5,
          "circle-stroke-color": "#ffffff",
        },
      },
      {
        id: "exp-points",
        type: "circle",
        source: "experiences",
        paint: {
          "circle-radius": 5,
          "circle-color": colors.warning,
          "circle-stroke-width": 1.5,
          "circle-stroke-color": "#ffffff",
        },
      },
    );

    const controller = mountSpatialMap({
      container,
      style,
      center: [51.05, 36.08],
      zoom: 8.2,
      ariaLabel: ariaLabelRef.current,
    });
    const map = controller.map;
    mapRef.current = map;

    // Dev-only introspection for map-state regression tests; stripped from
    // production builds by Vite's `import.meta.env.DEV` replacement.
    if (import.meta.env.DEV) {
      (container as MapContainer).__spatialMap = map;
    }

    const popup = new Popup({ closeButton: false, offset: 12 });
    const onClick = (event: MapLayerMouseEvent) => {
      const feature = event.features?.[0];
      if (!feature) return;
      const name = String(feature.properties?.name ?? "");
      const kind = String(feature.properties?.kind ?? "");
      const ref = feature.properties?.ref ? String(feature.properties.ref) : undefined;
      setSelected({ name, kind, ref });
      popup.setLngLat(event.lngLat).setText(`${name} · ${kind}`).addTo(map);
    };

    const onLoad = () => {
      readyRef.current = true;
      applySources(map);
      applyVisibility(map);
      for (const layer of LAYER_IDS) map.on("click", layer, onClick);
      map.on("mouseenter", "dest-points", () => {
        map.getCanvas().style.cursor = "pointer";
      });
      map.on("mouseleave", "dest-points", () => {
        map.getCanvas().style.cursor = "";
      });
      if (import.meta.env.DEV) container.setAttribute("data-map-ready", "true");
    };
    map.on("load", onLoad);

    return () => {
      readyRef.current = false;
      if (import.meta.env.DEV) {
        delete (container as MapContainer).__spatialMap;
        container.removeAttribute("data-map-ready");
      }
      controller.destroy();
      mapRef.current = null;
    };
  }, [applySources, applyVisibility]);

  // Update GeoJSON sources in place on data/locale changes.
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !readyRef.current) return;
    applySources(map);
  }, [asOf, destinationKind, experienceType, locale, applySources]);

  // Re-apply visibility whenever the user toggles a layer.
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !readyRef.current) return;
    applyVisibility(map);
  }, [visible, applyVisibility]);

  // Keep direction and the canvas label in sync with the active locale without
  // remounting the map.
  useEffect(() => {
    const dir = document.documentElement.dir === "rtl" ? "rtl" : "ltr";
    containerRef.current?.setAttribute("dir", dir);
    const canvas = mapRef.current?.getCanvas();
    canvas?.setAttribute("dir", dir);
    canvas?.setAttribute("aria-label", c.map.title);
  }, [locale, c.map.title]);

  const toggle = (key: LayerKey) => setVisible((current) => ({ ...current, [key]: !current[key] }));

  return (
    <div className="overflow-hidden rounded-lg border border-border">
      <div
        ref={containerRef}
        className={className ?? "h-[480px] w-full"}
        role="application"
        aria-label={c.map.title}
      />
      <div className="flex flex-wrap items-center gap-3 border-t border-border bg-surface px-3 py-2 text-2xs text-fg-muted">
        <span className="font-medium text-fg">{c.map.legend}</span>
        {(
          [
            ["destinations", c.map.destinations],
            ["stays", c.map.stays],
            ["experiences", c.map.experiences],
            ["routes", c.map.routes],
            ["camps", c.map.camps],
          ] as Array<[LayerKey, string]>
        ).map(([key, label]) => (
          <label key={key} className="inline-flex items-center gap-1.5">
            <input type="checkbox" checked={visible[key]} onChange={() => toggle(key)} className="size-3.5 rounded border-border-strong accent-primary" />
            {label}
          </label>
        ))}
        <span className="ms-auto text-fg-subtle">{c.map.asOf}: {asOf}</span>
      </div>
      <p className="border-t border-border bg-warning-soft px-3 py-2 text-2xs text-warning-soft-fg">
        {c.map.sensitiveHidden} {c.map.reviewHidden}
      </p>
      <div aria-live="polite" className="border-t border-border bg-surface px-3 py-2 text-2xs text-fg-muted">
        {selected ? (
          <span>
            <span className="font-medium text-fg">{selected.name}</span> · {selected.kind}
            {selected.ref ? (
              <>
                {" · "}
                <Link to={selected.ref} className="text-primary hover:underline">
                  {c.ui.view}
                </Link>
              </>
            ) : null}
          </span>
        ) : (
          c.map.select
        )}
      </div>
    </div>
  );
}