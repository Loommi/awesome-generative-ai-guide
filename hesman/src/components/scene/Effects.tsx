"use client";

import { Bloom, EffectComposer, Vignette } from "@react-three/postprocessing";

/** Restrained post FX: bloom only catches emissive glows, never the armour. */
export function Effects() {
  return (
    <EffectComposer multisampling={0}>
      <Bloom intensity={0.5} luminanceThreshold={0.85} luminanceSmoothing={0.2} mipmapBlur radius={0.55} />
      <Vignette eskil={false} offset={0.3} darkness={0.55} />
    </EffectComposer>
  );
}
