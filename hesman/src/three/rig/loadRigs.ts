import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js";
import { LionId } from "@/lib/types";
import { LION_ORDER } from "@/lib/lionConfigs";
import { MANIFEST } from "./manifest";
import { LionRig } from "./lionRig";
import { buildProceduralRig } from "./proceduralRig";

export interface RigLoadResult {
  rigs: Record<LionId, LionRig>;
  report: { id: LionId; source: "glb" | "procedural"; reason?: string }[];
}

export async function loadRigs(options: { forceProcedural?: boolean } = {}): Promise<RigLoadResult> {
  const loader = new GLTFLoader();
  const settled = await Promise.allSettled(
    LION_ORDER.map((id) =>
      options.forceProcedural
        ? Promise.reject(new Error("procedural rig forced"))
        : loader.loadAsync(MANIFEST[id].asset),
    ),
  );

  const rigs = {} as Record<LionId, LionRig>;
  const report: RigLoadResult["report"] = [];
  LION_ORDER.forEach((id, i) => {
    const manifest = MANIFEST[id];
    const res = settled[i];
    if (res.status === "fulfilled") {
      const root = res.value.scene.getObjectByName("root");
      if (root) {
        root.removeFromParent();
        try {
          rigs[id] = new LionRig(manifest, root, "glb");
          report.push({ id, source: "glb" });
          return;
        } catch (err) {
          report.push({ id, source: "procedural", reason: (err as Error).message });
        }
      } else {
        report.push({ id, source: "procedural", reason: "asset has no root node" });
      }
    } else {
      report.push({ id, source: "procedural", reason: (res.reason as Error)?.message ?? "load failed" });
    }
    rigs[id] = new LionRig(manifest, buildProceduralRig(manifest), "procedural");
  });
  return { rigs, report };
}
