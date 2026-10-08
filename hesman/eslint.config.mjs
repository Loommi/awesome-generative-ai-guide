import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  // Override default ignores of eslint-config-next.
  globalIgnores([
    // Default ignores of eslint-config-next:
    ".next/**",
    "out/**",
    "build/**",
    "next-env.d.ts",
  ]),
  // react-hooks/refs and react-hooks/immutability assume React Compiler
  // semantics where refs/useMemo results are never mutated outside an
  // event handler. react-three-fiber's useFrame loop intentionally mutates
  // Object3D refs, materials, and plain animation-state objects every frame
  // to avoid React re-renders at 60fps — that is the idiomatic, performant
  // R3F pattern, not a bug, so these two rules are disabled for the
  // three.js scene layer.
  {
    files: ["src/components/scene/**/*.{ts,tsx}", "src/three/**/*.{ts,tsx}"],
    rules: {
      "react-hooks/refs": "off",
      "react-hooks/immutability": "off",
    },
  },
]);

export default eslintConfig;
