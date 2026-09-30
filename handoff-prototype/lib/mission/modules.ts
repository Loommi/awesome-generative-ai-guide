import { CONTENT, type ModuleContent, type ModuleKey } from "./content";
import { rgbTriple, THEME } from "./theme";

/** A mission module as the handoff layer sees it: an id plus everything needed to draw it. */
export interface ModuleSpec extends ModuleContent {
  /** Stable id sent over the network. */
  id: string;
  /** Accent as hex and as an "r, g, b" triple for rgba(). */
  accentHex: string;
  accent: string;
}

const module = (key: ModuleKey, accentHex: string): ModuleSpec => ({
  ...CONTENT[key],
  id: `module-${key}`,
  accentHex,
  accent: rgbTriple(accentHex),
});

/** Order = slot order on both screens. */
export const MODULES: ModuleSpec[] = [
  module("eos", THEME.cyan),
  module("navigation", THEME.amber),
  module("command", THEME.violet),
  module("anomaly", THEME.red),
];
