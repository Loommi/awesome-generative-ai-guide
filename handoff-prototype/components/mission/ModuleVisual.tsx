"use client";

import type { ModuleKey } from "@/lib/mission/content";
import { AnomalyVisualization } from "./AnomalyVisualization";
import { CommandVisualization } from "./CommandVisualization";
import { NavigationVisualization } from "./NavigationVisualization";
import { VesselVisualization } from "./VesselVisualization";

/** "card": compact art on the draggable cartridge. "full": the inspector's large view. */
export type VisualVariant = "card" | "full";

export function ModuleVisual({ kind, variant }: { kind: ModuleKey; variant: VisualVariant }) {
  switch (kind) {
    case "eos":
      return <VesselVisualization variant={variant} />;
    case "navigation":
      return <NavigationVisualization variant={variant} />;
    case "command":
      return <CommandVisualization variant={variant} />;
    case "anomaly":
      return <AnomalyVisualization variant={variant} />;
  }
}
