"use client";

import { Bloom, EffectComposer, Vignette, ChromaticAberration } from "@react-three/postprocessing";
import { BlendFunction } from "postprocessing";
import { Vector2 } from "three";

export function Effects() {
  return (
    <EffectComposer multisampling={0}>
      <Bloom
        intensity={0.85}
        luminanceThreshold={0.22}
        luminanceSmoothing={0.3}
        mipmapBlur
        radius={0.6}
      />
      <ChromaticAberration
        offset={new Vector2(0.0006, 0.0006)}
        blendFunction={BlendFunction.NORMAL}
        radialModulation={false}
        modulationOffset={0}
      />
      <Vignette eskil={false} offset={0.28} darkness={0.9} />
    </EffectComposer>
  );
}
