import { useEffect, useRef } from "react";
import { useI18n } from "@eco-nojin/i18n";
import { createBaseStyle, createLayerRegistry, mountSpatialMap, resolveMapColors, type LayerDescriptor } from "@eco-nojin/spatial";

export function MapPage() {
  const { t } = useI18n();
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (!ref.current) return;
    const registry = createLayerRegistry();
    const demo: LayerDescriptor = {
      id: "demo-points",
      label: t("apps.field.mapTitle" as never),
      kind: "point",
      visible: true,
      opacity: 0.7,
      provenance: { source: "demo", sourceKind: "generated" },
    };
    registry.register(demo);
    const controller = mountSpatialMap({ container: ref.current, style: createBaseStyle(resolveMapColors()), center: [51.4, 35.7], zoom: 6 });
    return () => controller?.destroy?.();
  }, [t]);
  return (
    <div className="space-y-3">
      <h1 className="text-xl font-semibold text-fg">{t("apps.field.mapTitle" as never)}</h1>
      <div ref={ref} className="h-[60vh] w-full rounded-lg border border-border" />
    </div>
  );
}